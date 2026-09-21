import os
import json
from typing import Dict, Any, List
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from sqlalchemy import select
from app.db.session import get_db, AsyncSession
from app.db.models import Subject, SyllabusUnit, Question, GeneratedPaper, GeneratedPaperItem, FormatConfig
from app.services.blueprint import BlueprintSampler
from app.services.sp_generator import SamplePaperGenerator
from app.services.pdf_renderer import PDFRenderer
from app.core.config import settings

router = APIRouter(prefix="", tags=["sp"])

class GenerateSPRequest(BaseModel):
    subject_id: str

@router.post("/sp/generate")
async def generate_sample_paper(
    req: GenerateSPRequest,
    db: AsyncSession = Depends(get_db)
):
    # 1. Fetch Subject
    res_subj = await db.execute(select(Subject).where(Subject.id == req.subject_id))
    subject = res_subj.scalar_one_or_none()
    if not subject:
        raise HTTPException(status_code=404, detail=f"Subject {req.subject_id} not found")

    # 2. Fetch Syllabus Units
    res_units = await db.execute(
        select(SyllabusUnit).where(SyllabusUnit.subject_id == subject.id).order_by(SyllabusUnit.unit_no.asc())
    )
    units = res_units.scalars().all()
    unit_lookup = {u.id: u for u in units}

    # 3. Fetch past QB questions for similarity gate
    res_qb = await db.execute(select(Question).where(Question.subject_id == subject.id))
    qb_questions = res_qb.scalars().all()

    # 4. Compute Blueprint
    units_dict = [{"id": u.id, "unit_no": u.unit_no, "title": u.title} for u in units]
    blueprint = BlueprintSampler.sample_blueprint(units_dict)
    slots = blueprint["slots"]

    sp_gen = SamplePaperGenerator()
    generated_questions = []
    render_groups = [
        {"unit_title": None, "part_name": "PART — A (20 x 1 = 20 Marks)", "questions": []},
        {"unit_title": None, "part_name": "PART — B (5 x 8 = 40 Marks)", "questions": []},
        {"unit_title": None, "part_name": "PART — C (1 x 15 = 15 Marks)", "questions": []}
    ]

    for slot in slots:
        target_unit = unit_lookup.get(slot["unit_id"])
        slot_res = await sp_gen.generate_slot_question(
            slot=slot,
            subject_code=subject.code,
            subject_name=subject.name,
            unit=target_unit,
            qb_questions=qb_questions
        )

        q_record = Question(
            subject_id=subject.id,
            source_paper_id=None,
            unit_id=slot["unit_id"] if slot["unit_id"] in unit_lookup else None,
            part=slot["part"],
            question_no=slot["question_no"],
            or_group=slot.get("or_group"),
            sub_no=slot.get("sub_no"),
            marks=slot["marks"],
            bl=slot["bl"],
            co=slot["co"],
            po=slot["po"],
            question_text=slot_res["question_text"],
            options=slot_res.get("options"),
            source_type="generated",
            answer_key=slot_res.get("answer_key"),
            similarity_status=slot_res.get("similarity_status", "unique"),
            review_status="pending"
        )
        db.add(q_record)
        await db.flush()

        q_dict = {
            "id": q_record.id,
            "slot_id": slot["slot_id"],
            "question_no": f"{slot['question_no']}.{slot['sub_no']}" if slot.get("sub_no") else str(slot['question_no']),
            "question_text": q_record.question_text,
            "options": q_record.options,
            "marks": q_record.marks,
            "bl": q_record.bl,
            "co": q_record.co,
            "po": q_record.po,
            "occurrences_text": None
        }

        if slot["part"] == "A":
            render_groups[0]["questions"].append(q_dict)
        elif slot["part"] == "B":
            render_groups[1]["questions"].append(q_dict)
        else:
            render_groups[2]["questions"].append(q_dict)

        generated_questions.append((slot["slot_id"], q_record.id))

    # Render PDF & JSON
    os.makedirs(f"{settings.UPLOAD_DIR}/sp", exist_ok=True)
    sp_id_short = subject.code
    pdf_path = f"{settings.UPLOAD_DIR}/sp/SP_{sp_id_short}.pdf"
    json_path = f"{settings.UPLOAD_DIR}/sp/SP_{sp_id_short}.json"

    html_content = PDFRenderer.generate_html_content(
        title=f"Sample Paper — {subject.code}",
        subject_code=subject.code,
        subject_name=subject.name,
        paper_type="SAMPLE QUESTION PAPER (DRAFT - PENDING FACULTY REVIEW)",
        groups=render_groups,
        max_marks=75
    )

    with open(json_path, "w") as f:
        json.dump({"subject_code": subject.code, "blueprint": blueprint, "groups": render_groups}, f, indent=2)

    await PDFRenderer.render_pdf_from_html(html_content, pdf_path)

    # Save GeneratedPaper
    res_fmt = await db.execute(select(FormatConfig).limit(1))
    fmt = res_fmt.scalar_one_or_none()
    fmt_id = fmt.id if fmt else "srm-standard-v1"

    paper = GeneratedPaper(
        subject_id=subject.id,
        kind="SP",
        status="draft", # Starts as draft with visible banner
        format_id=fmt_id,
        blueprint=blueprint,
        pdf_ref=pdf_path,
        json_ref=json_path
    )
    db.add(paper)
    await db.flush()

    for slot_id, q_id in generated_questions:
        item = GeneratedPaperItem(
            paper_id=paper.id,
            slot=slot_id,
            question_id=q_id
        )
        db.add(item)

    await db.commit()

    return {
        "message": "Sample Paper generated in DRAFT state.",
        "paper_id": paper.id,
        "status": paper.status,
        "pdf_ref": pdf_path,
        "json_ref": json_path,
        "total_slots": len(slots)
    }

@router.post("/papers/{paper_id}/approve")
async def approve_paper(paper_id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(GeneratedPaper).where(GeneratedPaper.id == paper_id))
    paper = res.scalar_one_or_none()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
        
    paper.status = "approved"
    await db.commit()
    return {"message": "Paper status updated to APPROVED.", "paper_id": paper.id, "status": paper.status}

@router.post("/papers/{paper_id}/reject")
async def reject_paper(paper_id: str, db: AsyncSession = Depends(get_db)):
    res = await db.execute(select(GeneratedPaper).where(GeneratedPaper.id == paper_id))
    paper = res.scalar_one_or_none()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
        
    paper.status = "rejected"
    await db.commit()
    return {"message": "Paper status updated to REJECTED.", "paper_id": paper.id, "status": paper.status}
