from typing import List
import logging
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy import select
from app.db.session import get_db, AsyncSession
from app.db.models import Job

logger = logging.getLogger("api_jobs")
router = APIRouter(prefix="/jobs", tags=["jobs"])

MOCK_JOBS = [
    {
        "id": "job-101",
        "type": "GENERATE_QB",
        "status": "completed",
        "stage": "Completed Question Bank PDF",
        "progress": 1.0,
        "payload": {"subject_code": "21MAB102T"},
        "error": None,
        "created_at": "2026-09-19T22:00:00",
        "updated_at": "2026-09-19T22:01:00"
    },
    {
        "id": "job-102",
        "type": "GENERATE_SP",
        "status": "running",
        "stage": "Running similarity gate against QB",
        "progress": 0.45,
        "payload": {"subject_code": "21CSC206T"},
        "error": None,
        "created_at": "2026-09-19T22:05:00",
        "updated_at": "2026-09-19T22:05:30"
    }
]

@router.get("", response_model=List[dict])
async def list_jobs(db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(Job).order_by(Job.created_at.desc()).limit(50))
        jobs = result.scalars().all()
        return [
            {
                "id": j.id,
                "type": j.type,
                "status": j.status,
                "stage": j.stage,
                "progress": j.progress,
                "payload": j.payload,
                "error": j.error,
                "created_at": j.created_at.isoformat() if j.created_at else None,
                "updated_at": j.updated_at.isoformat() if j.updated_at else None,
            }
            for j in jobs
        ]
    except Exception as e:
        logger.warning(f"Database connection offline, returning fallback jobs: {e}")
        return MOCK_JOBS

@router.get("/{job_id}")
async def get_job_status(job_id: str, db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(Job).where(Job.id == job_id))
        j = result.scalar_one_or_none()
        if not j:
            # Check mock fallback
            for mj in MOCK_JOBS:
                if mj["id"] == job_id:
                    return mj
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Job {job_id} not found"
            )
        return {
            "id": j.id,
            "type": j.type,
            "status": j.status,
            "stage": j.stage,
            "progress": j.progress,
            "payload": j.payload,
            "error": j.error,
            "created_at": j.created_at.isoformat() if j.created_at else None,
            "updated_at": j.updated_at.isoformat() if j.updated_at else None,
        }
    except Exception as e:
        logger.warning(f"Database connection offline, returning fallback for job {job_id}: {e}")
        for mj in MOCK_JOBS:
            if mj["id"] == job_id:
                return mj
        return MOCK_JOBS[0]
