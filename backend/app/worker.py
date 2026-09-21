import asyncio
import logging
from sqlalchemy import select
from app.db.session import AsyncSessionLocal
from app.db.models import Job, Subject, SyllabusUnit, Question, SlideChunk
from app.services.extraction_pipeline import ExtractionPipeline
from app.services.sp_generator import SamplePaperGenerator
from app.api.qb import generate_qb_internal

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("worker")

async def process_job(job_id: str):
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Job).where(Job.id == job_id))
        job = result.scalar_one_or_none()
        if not job:
            return

        logger.info(f"Worker processing job {job.id} (type: {job.type})")
        payload = job.payload or {}
        user_id = job.user_id or payload.get("user_id")
        subject_id = payload.get("subject_id")
        pyq_paths = payload.get("pyq_paths", [])
        output_choice = payload.get("output_choice", "both").lower()

        try:
            job.status = "running"
            job.stage = "1/4: Running extraction pipeline on PYQ papers"
            job.progress = 0.1
            await session.commit()

            # 1. Run Extraction Pipeline for each PYQ paper if uploaded
            pipeline = ExtractionPipeline()
            if pyq_paths:
                for idx, pyq_path in enumerate(pyq_paths):
                    source_paper_ids = payload.get("source_paper_ids", [])
                    sp_id = source_paper_ids[idx] if idx < len(source_paper_ids) else None
                    sub_job = Job(
                        user_id=user_id,
                        type="INGEST_PYQ",
                        status="pending",
                        stage=f"Processing paper {idx+1}/{len(pyq_paths)}",
                        payload={
                            "user_id": user_id,
                            "subject_id": subject_id,
                            "pdf_path": pyq_path,
                            "source_paper_id": sp_id
                        }
                    )
                    session.add(sub_job)
                    await session.commit()
                    await pipeline.run_ingestion(sub_job.id)

            # 2. Generate Question Bank PDF if requested and PYQs exist
            if output_choice in ["qb", "both"]:
                job.stage = "2/4: Generating Question Bank PDF"
                job.progress = 0.6
                await session.commit()
                res_qs = await session.execute(
                    select(Question).where(Question.subject_id == subject_id)
                )
                if res_qs.scalars().first():
                    await generate_qb_internal(subject_id, user_id, session)

            # 3. Generate Sample Paper PDF if requested
            if output_choice in ["sp", "both"]:
                job.stage = "3/4: Generating Sample Paper with zero repeated questions"
                job.progress = 0.8
                await session.commit()

                res_subj = await session.execute(select(Subject).where(Subject.id == subject_id))
                subject = res_subj.scalar_one_or_none()

                res_units = await session.execute(
                    select(SyllabusUnit).where(SyllabusUnit.subject_id == subject_id).order_by(SyllabusUnit.unit_no.asc())
                )
                units = res_units.scalars().all()

                res_chunks = await session.execute(
                    select(SlideChunk).where(SlideChunk.subject_id == subject_id)
                )
                chunks = res_chunks.scalars().all()

                res_qs = await session.execute(
                    select(Question).where(Question.subject_id == subject_id)
                )
                qb_qs = res_qs.scalars().all()

                sp_gen = SamplePaperGenerator()
                await sp_gen.generate_sample_paper(
                    job_id=job.id,
                    user_id=user_id,
                    subject_id=subject_id,
                    subject_code=subject.code if subject else "SUBJECT",
                    subject_name=subject.name if subject else "Subject",
                    syllabus_units=units,
                    slide_chunks=chunks,
                    qb_questions=qb_qs
                )

            # Complete Job
            job.status = "completed"
            job.stage = "Completed QB & Sample Paper generation"
            job.progress = 1.0
            await session.commit()
            logger.info(f"Job {job.id} finished successfully.")

        except Exception as e:
            logger.error(f"Job {job.id} failed: {e}", exc_info=True)
            job.status = "failed"
            job.stage = "Job processing failed"
            job.error = str(e)
            await session.commit()

async def run_worker_loop():
    logger.info("Starting background worker loop...")
    while True:
        try:
            async with AsyncSessionLocal() as session:
                result = await session.execute(
                    select(Job).where(Job.status == "pending").order_by(Job.created_at.asc()).limit(1)
                )
                pending_job = result.scalar_one_or_none()
                
            if pending_job:
                await process_job(pending_job.id)
            else:
                await asyncio.sleep(2.0)
        except Exception as e:
            logger.error(f"Worker loop error: {e}")
            await asyncio.sleep(5.0)

if __name__ == "__main__":
    asyncio.run(run_worker_loop())
