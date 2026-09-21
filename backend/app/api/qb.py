import os
import json
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends, Header, status
from pydantic import BaseModel
from sqlalchemy import select
from app.db.session import get_db, AsyncSession
from app.db.models import Subject, SyllabusUnit, Question, QuestionOccurrence, GeneratedPaper, FormatConfig, Job
from app.services.pdf_renderer import PDFRenderer
from app.core.config import settings

router = APIRouter(prefix="/qb", tags=["qb"])

class EditQuestionRequest(BaseModel):
    question_text: str
    unit_no: Optional[int] = None
    marks: Optional[int] = None

async def generate_qb_internal(subject_id: str, user_id: str, session: AsyncSession) -> GeneratedPaper:
    res_subj = await session.execute(select(Subject).where(Subject.id == subject_id))
    subject = res_subj.scalar_one_or_none()
    if not subject:
        raise HTTPException(status_code=404, detail=f"Subject {subject_id} not found")

    res_units = await session.execute(
        select(SyllabusUnit).where(SyllabusUnit.subject_id == subject.id).order_by(SyllabusUnit.unit_no.asc())
    )
    units = res_units.scalars().all()

    res_qs = await session.execute(
        select(Question).where(
            Question.subject_id == subject.id,
            Question.canonical_id == None
        ).order_by(Question.unit_id.asc(), Question.part.asc(), Question.question_no.asc())
    )
    questions = res_qs.scalars().all()

    unit_map: Dict[str, Dict[str, Any]] = {}
    for u in units:
        unit_map[u.id] = {
            "unit_title": f"UNIT {u.unit_no} — {u.title.upper()}",
            "parts": {"A": [], "B": [], "C": []}
        }
    unit_map["unassigned"] = {
        "unit_title": "GENERAL QUESTION BANK",
        "parts": {"A": [], "B": [], "C": []}
    }

    for q in questions:
        res_occ = await session.execute(
            select(QuestionOccurrence).where(QuestionOccurrence.question_id == q.id)
        )
        occs = res_occ.scalars().all()
        occ_strs = [f"{o.month} {o.year}" for o in occs]
        occ_text = ", ".join(occ_strs) if occ_strs else None

        q_dict = {
            "id": q.id,
            "question_no": q.question_no,
            "part": q.part,
            "question_text": q.question_text,
            "options": q.options,
            "marks": q.marks,
            "bl": q.bl,
            "co": q.co,
            "po": q.po,
            "occurrences_text": occ_text
        }

        u_id = q.unit_id if q.unit_id in unit_map else "unassigned"
        part_key = q.part if q.part in ("A", "B", "C") else "A"
        unit_map[u_id]["parts"][part_key].append(q_dict)

    groups = []
    for u_id, u_data in unit_map.items():
        has_questions = any(len(qs) > 0 for qs in u_data["parts"].values())
        if not has_questions:
            continue
            
        groups.append({"unit_title": u_data["unit_title"], "part_name": None, "questions": []})
        for part_name, q_list in u_data["parts"].items():
            if q_list:
                groups.append({
                    "unit_title": None,
                    "part_name": f"PART — {part_name}",
                    "questions": q_list
                })

    html_content = PDFRenderer.generate_html_content(
        title=f"Question Bank — {subject.code}",
        subject_code=subject.code,
        subject_name=subject.name,
        paper_type="QUESTION BANK (VERBATIM)",
        groups=groups,
        max_marks=75
    )

    os.makedirs(f"{settings.UPLOAD_DIR}/qb", exist_ok=True)
    pdf_path = f"{settings.UPLOAD_DIR}/qb/QB_{subject.code}_{user_id[:8]}.pdf"
    json_path = f"{settings.UPLOAD_DIR}/qb/QB_{subject.code}_{user_id[:8]}.json"

    with open(json_path, "w") as f:
        json.dump({"subject_code": subject.code, "subject_name": subject.name, "groups": groups}, f, indent=2)

    await PDFRenderer.render_pdf_from_html(html_content, pdf_path)

    paper = GeneratedPaper(
        user_id=user_id,
        subject_id=subject.id,
        kind="QB",
        status="approved",
        pdf_ref=pdf_path,
        json_ref=json_path
    )
    session.add(paper)
    await session.commit()
    return paper

@router.put("/question/{question_id}")
async def edit_question(
    question_id: str,
    req: EditQuestionRequest,
    x_student_user_id: Optional[str] = Header(None, alias="X-Student-User-Id"),
    db: AsyncSession = Depends(get_db)
):
    user_id = x_student_user_id or "student_default"
    res = await db.execute(
        select(Question).where(Question.id == question_id, Question.user_id == user_id)
    )
    q = res.scalar_one_or_none()
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")

    q.question_text = req.question_text
    if req.marks is not None:
        q.marks = req.marks
    q.review_status = "verified"
    await db.commit()

    # Regenerate QB PDF
    await generate_qb_internal(q.subject_id, user_id, db)
    return {"message": "Question updated and PDF regenerated successfully.", "question_id": q.id}
