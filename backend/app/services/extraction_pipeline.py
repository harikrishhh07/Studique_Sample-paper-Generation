import os
import json
import logging
import asyncio
from typing import List, Dict, Any, Tuple, Optional
from rapidfuzz import fuzz
from sqlalchemy import select

from app.db.session import AsyncSessionLocal
from app.db.models import (
    Job, SourcePaper, Question, QuestionOccurrence, SyllabusUnit, Subject, SlideChunk
)
from app.services.pdf_processor import PDFProcessor
from app.services.llm_client import LLMClient
from app.services.validator import StructureValidator
from app.services.dedupe import DedupeEngine

logger = logging.getLogger("extraction_pipeline")

PAGE_EXTRACTION_PROMPT = """
Extract all questions from the provided SRM degree examination paper page image and text.
Ensure LaTeX inline formatting for all math symbols (e.g. $\\int_{0}^{1} x dx$, $x^2 + y^2 = a^2$).

Output strictly valid JSON with this schema:
{
  "header": {
    "exam_name": "B.Tech / M.Tech (Integrated) DEGREE EXAMINATION",
    "month": "MAY",
    "year": 2024,
    "subject_code": "21CSC206T",
    "subject_name": "ARTIFICIAL INTELLIGENCE"
  },
  "questions": [
    {
      "part": "A",
      "question_no": 1,
      "or_group": null,
      "sub_no": null,
      "question_text": "Question text here...",
      "options": {"A": "Opt A", "B": "Opt B", "C": "Opt C", "D": "Opt D"},
      "marks": 1,
      "bl": 1,
      "co": 1,
      "po": 1,
      "figure_bboxes": []
    }
  ]
}
"""

class ExtractionPipeline:
    def __init__(self):
        self.llm = LLMClient()
        self.pdf_proc = PDFProcessor()

    async def run_ingestion(self, job_id: str):
        async with AsyncSessionLocal() as session:
            result = await session.execute(select(Job).where(Job.id == job_id))
            job = result.scalar_one_or_none()
            if not job:
                logger.error(f"Job {job_id} not found")
                return

            try:
                job.status = "running"
                job.stage = "1/5: Detecting PDF text layer"
                job.progress = 0.1
                await session.commit()

                payload = job.payload or {}
                user_id = job.user_id or payload.get("user_id")
                source_paper_id = payload.get("source_paper_id")
                pdf_path = payload.get("pdf_path")
                subject_id = payload.get("subject_id")
                
                if not pdf_path or not os.path.exists(pdf_path):
                    raise FileNotFoundError(f"PDF file at {pdf_path} does not exist")

                # Step 1: Text Layer Detection
                has_text = self.pdf_proc.detect_text_layer(pdf_path)
                logger.info(f"PDF text layer detected: {has_text}")

                # Step 2: Render pages at 200 DPI
                job.stage = "2/5: Rendering pages & running dual-pass vision extraction across all pages"
                job.progress = 0.3
                await session.commit()

                pages_data = self.pdf_proc.render_pages_to_images(pdf_path, dpi=200)
                
                pass1_questions = []
                pass2_questions = []
                header_info = {}

                # Dual-pass extraction across ALL pages
                for page_num, page_text, img_b64 in pages_data:
                    prompt = f"{PAGE_EXTRACTION_PROMPT}\n\nPage {page_num} Text Layer:\n{page_text[:3000]}"
                    
                    try:
                        # Pass 1
                        res1 = await self.llm.generate_structured_json(
                            prompt, [img_b64], user_id=user_id, job_id=job_id
                        )
                        if res1.get("header") and not header_info.get("month"):
                            header_info = res1["header"]
                        for q in res1.get("questions", []):
                            q["_page_num"] = page_num
                            pass1_questions.append(q)

                        # Pass 2
                        res2 = await self.llm.generate_structured_json(
                            prompt, [img_b64], user_id=user_id, job_id=job_id
                        )
                        for q in res2.get("questions", []):
                            q["_page_num"] = page_num
                            pass2_questions.append(q)
                    except Exception as pe:
                        logger.warning(f"Page {page_num} extraction warning: {pe}")

                # Step 3: Structural Validation & Agreement Scoring
                job.stage = "3/5: Structural validation & agreement scoring"
                job.progress = 0.5
                await session.commit()

                is_valid, validation_errors = StructureValidator.validate_extraction(pass1_questions)
                agreement_score = self._compute_agreement(pass1_questions, pass2_questions)
                logger.info(f"Validation valid={is_valid}, Agreement={agreement_score:.2f}")

                # Step 4: Figure cropping, Unit tagging & Deduplication
                job.stage = "4/5: Figure cropping, unit tagging & deduplication engine"
                job.progress = 0.7
                await session.commit()

                # Fetch slide chunks and syllabus units for unit tagging
                units_res = await session.execute(
                    select(SyllabusUnit).where(SyllabusUnit.subject_id == subject_id)
                )
                syllabus_units = units_res.scalars().all()

                chunks_res = await session.execute(
                    select(SlideChunk).where(SlideChunk.subject_id == subject_id)
                )
                slide_chunks = chunks_res.scalars().all()

                # Parse header metadata or fallback to payload
                exam_name = header_info.get("exam_name") or payload.get("exam_name") or "Degree Examination"
                exam_month = str(header_info.get("month") or payload.get("month") or "MAY").upper()
                try:
                    exam_year = int(header_info.get("year") or payload.get("year") or 2024)
                except Exception:
                    exam_year = 2024

                # Update SourcePaper header info if missing
                if source_paper_id:
                    sp_res = await session.execute(select(SourcePaper).where(SourcePaper.id == source_paper_id))
                    source_paper = sp_res.scalar_one_or_none()
                    if source_paper:
                        source_paper.exam_name = exam_name
                        source_paper.month = exam_month
                        source_paper.year = exam_year

                for q in pass1_questions:
                    q_text = q.get("question_text", "").strip()
                    if not q_text:
                        continue

                    # Crop figures using the CORRECT page number
                    page_num = q.get("_page_num", 1)
                    fig_paths = []
                    bboxes = q.get("figure_bboxes", [])
                    for bbox in bboxes:
                        if len(bbox) == 4:
                            fig_path = self.pdf_proc.crop_figure(pdf_path, page_num, bbox)
                            if fig_path:
                                fig_paths.append(fig_path)

                    # Tag syllabus unit & find slide references
                    unit_id, unit_conf, source_refs = self._tag_unit_and_refs(q_text, syllabus_units, slide_chunks)

                    # Deduplication Engine check
                    sim_status, canonical_q = await DedupeEngine.process_question_dedupe(
                        subject_id, q_text, user_id, session
                    )

                    if sim_status == "auto_merged" and canonical_q:
                        # Record occurrence under existing canonical question
                        occ = QuestionOccurrence(
                            question_id=canonical_q.id,
                            source_paper_id=source_paper_id,
                            exam_name=exam_name,
                            month=exam_month,
                            year=exam_year
                        )
                        session.add(occ)
                    else:
                        review_stat = "verified" if (is_valid and agreement_score >= 0.8 and unit_conf >= 0.7 and sim_status == "unique") else "flagged"
                        q_record = Question(
                            user_id=user_id,
                            subject_id=subject_id,
                            source_paper_id=source_paper_id,
                            unit_id=unit_id,
                            part=q.get("part", "A"),
                            question_no=q.get("question_no", 1),
                            or_group=q.get("or_group"),
                            sub_no=q.get("sub_no"),
                            marks=q.get("marks", 1),
                            bl=q.get("bl", 1),
                            co=q.get("co", 1),
                            po=q.get("po", 1),
                            question_text=q_text,
                            options=q.get("options"),
                            figure_refs=fig_paths,
                            source_type="extracted",
                            extraction_confidence=round(agreement_score, 2),
                            unit_confidence=round(unit_conf, 2),
                            similarity_status=sim_status,
                            review_status=review_stat,
                            canonical_id=canonical_q.id if canonical_q else None,
                            source_refs=source_refs
                        )
                        session.add(q_record)
                        await session.flush()

                        occ = QuestionOccurrence(
                            question_id=q_record.id,
                            source_paper_id=source_paper_id,
                            exam_name=exam_name,
                            month=exam_month,
                            year=exam_year
                        )
                        session.add(occ)

                # Step 5: Finalize
                job.stage = "5/5: Ingestion pipeline completed"
                job.status = "completed"
                job.progress = 1.0
                await session.commit()
                logger.info(f"Ingestion job {job_id} completed successfully.")

            except Exception as e:
                logger.error(f"Error executing job {job_id}: {e}", exc_info=True)
                job.status = "failed"
                job.stage = "Pipeline failed"
                job.error = str(e)
                await session.commit()

    def _compute_agreement(self, q1_list: List[Dict], q2_list: List[Dict]) -> float:
        if not q1_list or not q2_list:
            return 0.5
        scores = []
        for q1 in q1_list:
            best_match = 0
            for q2 in q2_list:
                score = fuzz.token_sort_ratio(q1.get("question_text", ""), q2.get("question_text", ""))
                best_match = max(best_match, score)
            scores.append(best_match / 100.0)
        return sum(scores) / len(scores) if scores else 0.8

    def _tag_unit_and_refs(
        self,
        q_text: str,
        units: List[SyllabusUnit],
        chunks: List[SlideChunk]
    ) -> Tuple[Optional[str], float, List[Dict[str, Any]]]:
        if not units and not chunks:
            return None, 0.5, []

        best_unit_id = units[0].id if units else None
        best_score = 0.0
        matching_refs = []

        # Match against slide chunks
        for chunk in chunks:
            score = fuzz.token_set_ratio(q_text, chunk.chunk_text)
            if score > best_score:
                best_score = score
                # Find unit_id matching chunk.unit_no
                for u in units:
                    if u.unit_no == chunk.unit_no:
                        best_unit_id = u.id
                        break
            if score >= 60:
                matching_refs.append({
                    "ppt_name": chunk.ppt_name,
                    "slide_no": chunk.slide_no,
                    "unit_no": chunk.unit_no
                })

        # Match against unit titles as fallback
        if best_score < 40 and units:
            for u in units:
                topics = u.topics or []
                combined = f"{u.title} " + (" ".join(topics) if isinstance(topics, list) else str(topics))
                score = fuzz.token_set_ratio(q_text, combined)
                if score > best_score:
                    best_score = score
                    best_unit_id = u.id

        confidence = round(min(1.0, max(0.3, best_score / 100.0)), 2)
        return best_unit_id, confidence, matching_refs[:3]
