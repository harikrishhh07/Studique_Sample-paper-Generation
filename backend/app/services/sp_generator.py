import os
import json
import logging
import asyncio
from typing import Dict, Any, List, Tuple, Optional
from rapidfuzz import fuzz
from sqlalchemy import select

from app.db.session import AsyncSessionLocal
from app.db.models import (
    Subject, SyllabusUnit, Question, GeneratedPaper, GeneratedPaperItem, FormatConfig, SlideChunk
)
from app.services.blueprint import BlueprintSampler
from app.services.llm_client import LLMClient
from app.services.pdf_renderer import PDFRenderer
from app.core.config import settings

logger = logging.getLogger("sp_generator")

SLOT_PROMPT = """
You are a professor designing an original examination question for SRM Institute of Science and Technology.
Subject: {subject_code} - {subject_name}
Target Unit: {unit_title} (Unit No: {unit_no})
Part: {part} | Marks: {marks} | Bloom's Level: {bl}

Course Material & Notes Context:
{slide_context}

Past Exam Questions for context:
{examples}

CRITICAL RULES:
1. Generate an original, high-quality question for this unit.
2. DO NOT REPEAT or closely resemble any of these existing past questions:
{do_not_repeat}
3. Generate a brand new question with LaTeX inline math ($...$).

Return strictly valid JSON:
{{
  "question_text": "...",
  "options": {options_format},
  "answer_key": "...",
  "working": "..."
}}
"""

class SamplePaperGenerator:
    def __init__(self):
        self.llm = LLMClient()

    async def generate_sample_paper(
        self,
        job_id: str,
        user_id: str,
        subject_id: str,
        subject_code: str,
        subject_name: str,
        syllabus_units: List[SyllabusUnit],
        slide_chunks: List[SlideChunk],
        qb_questions: List[Question]
    ) -> GeneratedPaper:
        async with AsyncSessionLocal() as session:
            # Sample blueprint
            units_dict = [{"id": u.id, "unit_no": u.unit_no, "title": u.title} for u in syllabus_units]
            blueprint = BlueprintSampler.sample_blueprint(units_dict)
            slots = blueprint.get("slots", [])

            paper = GeneratedPaper(
                user_id=user_id,
                subject_id=subject_id,
                kind="SP",
                status="draft",
                blueprint=blueprint
            )
            session.add(paper)
            await session.flush()

            paper_items = []
            generated_so_far = []

            for idx, slot in enumerate(slots):
                unit_no = slot.get("unit_no", 1)
                unit_obj = next((u for u in syllabus_units if u.unit_no == unit_no), None)
                unit_chunks = [c for c in slide_chunks if c.unit_no == unit_no]
                if not unit_chunks and slide_chunks:
                    unit_chunks = slide_chunks[:5]

                # Generate slot question with similarity gate retries
                slot_q_data, is_needs_review = await self._generate_slot_question_with_retries(
                    slot=slot,
                    subject_code=subject_code,
                    subject_name=subject_name,
                    unit=unit_obj,
                    unit_chunks=unit_chunks,
                    qb_questions=qb_questions,
                    generated_so_far=generated_so_far,
                    user_id=user_id,
                    job_id=job_id
                )

                q_text = slot_q_data.get("question_text", f"Question for slot {slot['slot_id']}")
                generated_so_far.append(q_text)

                q_record = Question(
                    user_id=user_id,
                    subject_id=subject_id,
                    unit_id=unit_obj.id if unit_obj else None,
                    part=slot["part"],
                    question_no=slot["question_no"],
                    or_group=slot.get("or_group"),
                    sub_no=slot.get("sub_no"),
                    marks=slot["marks"],
                    bl=slot.get("bl", 3),
                    co=slot.get("co", 1),
                    po=slot.get("po", 1),
                    question_text=q_text,
                    options=slot_q_data.get("options"),
                    answer_key=slot_q_data.get("answer_key"),
                    source_type="generated",
                    similarity_status="flagged_duplicate" if is_needs_review else "unique",
                    review_status="needs_review" if is_needs_review else "verified",
                    source_refs=[{"ppt_name": c.ppt_name, "slide_no": c.slide_no} for c in unit_chunks[:3]] if unit_chunks else []
                )
                session.add(q_record)
                await session.flush()

                item = GeneratedPaperItem(
                    paper_id=paper.id,
                    slot=slot["slot_id"],
                    question_id=q_record.id
                )
                session.add(item)
                paper_items.append((slot, q_record))

            # Build PDF
            pdf_path = await self._render_paper_pdf(
                paper_id=paper.id,
                subject_code=subject_code,
                subject_name=subject_name,
                paper_items=paper_items,
                blueprint=blueprint
            )

            paper.pdf_ref = pdf_path
            paper.status = "approved"
            await session.commit()
            return paper

    async def _generate_slot_question_with_retries(
        self,
        slot: Dict[str, Any],
        subject_code: str,
        subject_name: str,
        unit: Optional[SyllabusUnit],
        unit_chunks: List[SlideChunk],
        qb_questions: List[Question],
        generated_so_far: List[str],
        user_id: str,
        job_id: str
    ) -> Tuple[Dict[str, Any], bool]:
        unit_title = unit.title if unit else f"Unit {slot.get('unit_no', 1)}"
        
        if unit_chunks:
            slide_context = "\n---\n".join([f"[{c.ppt_name} Page/Slide {c.slide_no}]: {c.chunk_text[:300]}" for c in unit_chunks[:4]])
        else:
            slide_context = f"Core course syllabus concepts for {unit_title} in {subject_code} ({subject_name})."

        examples_q = [q.question_text for q in qb_questions if q.unit_id == (unit.id if unit else None)][:3]
        examples_str = "\n- ".join(examples_q) if examples_q else "None provided"

        do_not_repeat = [q.question_text for q in qb_questions[:15]] + generated_so_far[-5:]
        dnr_str = "\n- ".join(do_not_repeat) if do_not_repeat else "None"

        options_format = '{"A": "...", "B": "...", "C": "...", "D": "..."}' if slot["part"] == "A" else "null"

        prompt = SLOT_PROMPT.format(
            subject_code=subject_code,
            subject_name=subject_name,
            unit_title=unit_title,
            unit_no=slot.get("unit_no", 1),
            part=slot["part"],
            marks=slot["marks"],
            bl=slot.get("bl", 3),
            slide_context=slide_context,
            examples=examples_str,
            do_not_repeat=dnr_str,
            options_format=options_format
        )

        for attempt in range(3):
            try:
                res = await self.llm.generate_structured_json(prompt, user_id=user_id, job_id=job_id)
                q_text = res.get("question_text", "").strip()
                if not q_text:
                    continue

                # Similarity gate against QB questions and already generated questions in this paper
                is_duplicate = False
                all_compare_questions = qb_questions + [Question(question_text=gt) for gt in generated_so_far]
                for qb_q in all_compare_questions:
                    if not qb_q.question_text:
                        continue
                    score = fuzz.token_sort_ratio(q_text, qb_q.question_text)
                    if score >= 75:
                        logger.warning(f"Slot {slot['slot_id']} attempt {attempt+1} matched existing question (Score: {score})")
                        is_duplicate = True
                        break

                if not is_duplicate:
                    return res, False
            except Exception as e:
                logger.error(f"Error generating slot {slot['slot_id']} (attempt {attempt+1}): {e}")

        return {
            "question_text": f"Evaluate and solve the core concept in {unit_title} for Part {slot['part']} ({slot['marks']} Marks).",
            "options": {"A": "Option A", "B": "Option B", "C": "Option C", "D": "Option D"} if slot["part"] == "A" else None,
            "answer_key": None,
            "working": None
        }, True

    async def _render_paper_pdf(
        self,
        paper_id: str,
        subject_code: str,
        subject_name: str,
        paper_items: List[Tuple[Dict[str, Any], Question]],
        blueprint: Dict[str, Any]
    ) -> str:
        groups = []
        
        part_a = [item for item in paper_items if item[0]["part"] == "A"]
        part_b = [item for item in paper_items if item[0]["part"] == "B"]
        part_c = [item for item in paper_items if item[0]["part"] == "C"]

        if part_a:
            groups.append({
                "part_name": "PART A — (20 x 1 = 20 Marks) Answer ALL Questions",
                "questions": [
                    {
                        "question_no": item[0]["question_no"],
                        "question_text": item[1].question_text,
                        "options": item[1].options,
                        "marks": item[1].marks,
                        "bl": item[1].bl,
                        "co": item[1].co,
                        "po": item[1].po
                    }
                    for item in part_a
                ]
            })

        if part_b:
            groups.append({
                "part_name": "PART B — (5 x 8 = 40 Marks) Answer ALL Questions (Either / Or Choice)",
                "questions": [
                    {
                        "question_no": f"{item[0]['question_no']}.{item[0].get('sub_no', 'a')}",
                        "question_text": item[1].question_text,
                        "options": item[1].options,
                        "marks": item[1].marks,
                        "bl": item[1].bl,
                        "co": item[1].co,
                        "po": item[1].po
                    }
                    for item in part_b
                ]
            })

        if part_c:
            groups.append({
                "part_name": "PART C — (1 x 15 = 15 Marks) Comprehensive Question",
                "questions": [
                    {
                        "question_no": item[0]["question_no"],
                        "question_text": item[1].question_text,
                        "options": item[1].options,
                        "marks": item[1].marks,
                        "bl": item[1].bl,
                        "co": item[1].co,
                        "po": item[1].po
                    }
                    for item in part_c
                ]
            })

        html = PDFRenderer.generate_html_content(
            title=f"Sample Paper - {subject_code}",
            subject_code=subject_code,
            subject_name=subject_name,
            paper_type="Sample Practice Examination Paper",
            groups=groups,
            max_marks=75,
            blueprint_summary=blueprint.get("unit_distribution")
        )

        output_path = f"uploads/papers/sample_paper_{paper_id[:8]}.pdf"
        return await PDFRenderer.render_pdf_from_html(html, output_path)
