import os
import uuid
import json
import hashlib
import fitz # PyMuPDF
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, Header, status
from sqlalchemy import select
from app.db.session import get_db, AsyncSession
from app.db.models import Subject, SourcePaper, Job, SlideChunk, SyllabusUnit
from app.core.config import settings
from app.services.ppt_parser import PPTParser

router = APIRouter(prefix="", tags=["uploads"])

def compute_sha256(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()

async def process_pdf_unit_notes(
    user_id: str,
    subject_id: str,
    pdf_path: str,
    filename: str,
    session: AsyncSession
):
    """Processes PDF uploaded as unit notes and stores SlideChunk records."""
    doc = fitz.open(pdf_path)
    total_pages = len(doc)
    
    for i, page in enumerate(doc):
        text = page.get_text().strip()
        if not text:
            continue
        page_no = i + 1
        # Determine unit number (1 to 5)
        unit_no = min(5, max(1, int(((page_no - 1) / max(1, total_pages)) * 5) + 1))
        
        chunk = SlideChunk(
            user_id=user_id,
            subject_id=subject_id,
            unit_no=unit_no,
            ppt_name=filename,
            slide_no=page_no,
            chunk_text=f"PDF Page {page_no}:\n" + text,
            metadata_json={"title": f"Page {page_no}"}
        )
        session.add(chunk)
    
    doc.close()
    await session.flush()

@router.post("/uploads")
async def upload_files_and_create_job(
    subject_code: str = Form(...),
    subject_name: str = Form(...),
    output_choice: str = Form("both"), # 'qb' | 'sp' | 'both'
    pyq_files: Optional[List[UploadFile]] = File(None),
    ppt_files: Optional[List[UploadFile]] = File(None),
    x_student_user_id: Optional[str] = Header(None, alias="X-Student-User-Id"),
    db: AsyncSession = Depends(get_db)
):
    user_id = x_student_user_id or "student_default"
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    if not pyq_files and not ppt_files:
        raise HTTPException(status_code=400, detail="Please upload at least one file (Unit Notes or PYQ Paper).")

    # 1. Get or create Subject
    res_subj = await db.execute(
        select(Subject).where(Subject.code == subject_code, Subject.user_id == user_id)
    )
    subject = res_subj.scalar_one_or_none()
    if not subject:
        subject = Subject(user_id=user_id, code=subject_code, name=subject_name)
        db.add(subject)
        await db.flush()

    # Process PYQ Papers (PDF / PPT / PPTX)
    pyq_paths = []
    source_paper_ids = []

    if pyq_files:
        for file in pyq_files:
            content = await file.read()
            if len(content) > 50 * 1024 * 1024:
                raise HTTPException(status_code=400, detail=f"File {file.filename} exceeds 50MB limit.")
            
            ext = os.path.splitext(file.filename)[1].lower()
            if ext not in [".pdf", ".ppt", ".pptx"]:
                raise HTTPException(status_code=400, detail=f"File {file.filename} must be PDF, PPT, or PPTX.")

            file_hash = compute_sha256(content)
            file_id = f"pyq_{file_hash[:12]}_{uuid.uuid4().hex[:6]}{ext}"
            file_path = os.path.join(settings.UPLOAD_DIR, file_id)

            if not os.path.exists(file_path):
                with open(file_path, "wb") as f:
                    f.write(content)

            pyq_paths.append((file.filename, file_path, file_hash))

            sp = SourcePaper(
                user_id=user_id,
                subject_id=subject.id,
                exam_name="Degree Examination",
                month="MAY",
                year=2024,
                file_ref=file_path,
                status="uploaded"
            )
            db.add(sp)
            await db.flush()
            source_paper_ids.append(sp.id)

    # Process Unit Notes (PDF / PPT / PPTX)
    ppt_paths = []
    if ppt_files:
        for file in ppt_files:
            content = await file.read()
            if len(content) > 50 * 1024 * 1024:
                raise HTTPException(status_code=400, detail=f"File {file.filename} exceeds 50MB limit.")

            ext = os.path.splitext(file.filename)[1].lower()
            if ext not in [".pdf", ".ppt", ".pptx"]:
                raise HTTPException(status_code=400, detail=f"File {file.filename} must be PDF, PPT, or PPTX.")

            file_hash = compute_sha256(content)
            file_id = f"notes_{file_hash[:12]}_{uuid.uuid4().hex[:6]}{ext}"
            file_path = os.path.join(settings.UPLOAD_DIR, file_id)

            if not os.path.exists(file_path):
                with open(file_path, "wb") as f:
                    f.write(content)

            if ext == ".pdf":
                await process_pdf_unit_notes(user_id, subject.id, file_path, file.filename, db)
            else:
                ppt_paths.append(file_path)

        if ppt_paths:
            await PPTParser.process_and_store_ppts(user_id, subject.id, ppt_paths, db)

    # Auto-create SyllabusUnit records (1..5) if missing
    for u_no in range(1, 6):
        res_u = await db.execute(
            select(SyllabusUnit).where(SyllabusUnit.subject_id == subject.id, SyllabusUnit.unit_no == u_no)
        )
        if not res_u.scalar_one_or_none():
            unit = SyllabusUnit(
                subject_id=subject.id,
                unit_no=u_no,
                title=f"Unit {u_no}",
                topics=[f"Unit {u_no} Topics"]
            )
            db.add(unit)

    # Create Background Job
    job = Job(
        user_id=user_id,
        type=f"PROCESS_{output_choice.upper()}",
        status="pending",
        stage="Queued for Processing",
        progress=0.0,
        payload={
            "user_id": user_id,
            "subject_id": subject.id,
            "subject_code": subject_code,
            "subject_name": subject_name,
            "output_choice": output_choice,
            "pyq_paths": [p[1] for p in pyq_paths],
            "ppt_paths": ppt_paths,
            "source_paper_ids": source_paper_ids
        }
    )
    db.add(job)
    await db.commit()

    return {
        "message": "Files uploaded successfully. Processing job queued.",
        "job_id": job.id,
        "subject_id": subject.id,
        "pyq_count": len(pyq_paths),
        "ppt_count": len(ppt_files or [])
    }
