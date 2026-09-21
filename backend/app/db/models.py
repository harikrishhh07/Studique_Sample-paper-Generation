import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Text, ForeignKey, DateTime, JSON, Boolean
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from pgvector.sqlalchemy import Vector
from app.db.session import Base

def generate_uuid():
    return str(uuid.uuid4())

class Subject(Base):
    __tablename__ = "subjects"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String(255), nullable=True, index=True)
    code = Column(String(50), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    units = relationship("SyllabusUnit", back_populates="subject", cascade="all, delete-orphan")
    questions = relationship("Question", back_populates="subject")
    slide_chunks = relationship("SlideChunk", back_populates="subject", cascade="all, delete-orphan")

class SyllabusUnit(Base):
    __tablename__ = "syllabus_units"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    subject_id = Column(String, ForeignKey("subjects.id"), nullable=False)
    unit_no = Column(Integer, nullable=False)
    title = Column(String(255), nullable=False)
    topics = Column(JSONB, nullable=True) # list of topics
    
    subject = relationship("Subject", back_populates="units")

class SlideChunk(Base):
    __tablename__ = "slide_chunks"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String(255), nullable=False, index=True)
    subject_id = Column(String, ForeignKey("subjects.id"), nullable=False)
    unit_no = Column(Integer, nullable=False)
    ppt_name = Column(String(255), nullable=False)
    slide_no = Column(Integer, nullable=False)
    chunk_text = Column(Text, nullable=False)
    embedding = Column(Vector(1536), nullable=True)
    metadata_json = Column(JSONB, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    subject = relationship("Subject", back_populates="slide_chunks")

class SourcePaper(Base):
    __tablename__ = "source_papers"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String(255), nullable=True, index=True)
    subject_id = Column(String, ForeignKey("subjects.id"), nullable=False)
    exam_name = Column(String(255), nullable=False)
    exam_type = Column(String(100), default="End Semester")
    month = Column(String(50), nullable=False)
    year = Column(Integer, nullable=False)
    file_ref = Column(String(512), nullable=False)
    status = Column(String(50), default="ingested")
    created_at = Column(DateTime, default=datetime.utcnow)

class Question(Base):
    __tablename__ = "questions"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String(255), nullable=True, index=True)
    subject_id = Column(String, ForeignKey("subjects.id"), nullable=False)
    source_paper_id = Column(String, ForeignKey("source_papers.id"), nullable=True)
    unit_id = Column(String, ForeignKey("syllabus_units.id"), nullable=True)
    part = Column(String(10), nullable=False) # 'A', 'B', 'C'
    question_no = Column(Integer, nullable=False)
    or_group = Column(String(20), nullable=True) # e.g. '21.a', '21.b'
    sub_no = Column(String(20), nullable=True)
    marks = Column(Integer, nullable=False)
    bl = Column(Integer, default=1) # Bloom's level 1-6
    co = Column(Integer, default=1) # Course outcome 1-5
    po = Column(Integer, default=1) # Program outcome 1-12
    question_text = Column(Text, nullable=False) # LaTeX inline supported
    options = Column(JSONB, nullable=True) # for MCQs: {"A": "...", "B": "..."}
    figure_refs = Column(JSONB, nullable=True) # image paths
    source_type = Column(String(20), default="extracted") # 'extracted'|'generated'
    extraction_confidence = Column(Float, default=1.0)
    unit_confidence = Column(Float, default=1.0)
    similarity_status = Column(String(50), default="unique")
    review_status = Column(String(50), default="verified") # 'verified'|'flagged'|'pending'|'needs_review'
    canonical_id = Column(String, ForeignKey("questions.id"), nullable=True)
    embedding = Column(Vector(1536), nullable=True)
    answer_key = Column(Text, nullable=True)
    source_refs = Column(JSONB, nullable=True) # References to slide chunks or page numbers
    created_at = Column(DateTime, default=datetime.utcnow)
    
    subject = relationship("Subject", back_populates="questions")
    occurrences = relationship("QuestionOccurrence", back_populates="question", cascade="all, delete-orphan")
    versions = relationship("QuestionVersion", back_populates="question", cascade="all, delete-orphan")

class QuestionOccurrence(Base):
    __tablename__ = "question_occurrences"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    question_id = Column(String, ForeignKey("questions.id"), nullable=False)
    source_paper_id = Column(String, ForeignKey("source_papers.id"), nullable=True)
    exam_name = Column(String(255), nullable=False)
    month = Column(String(50), nullable=False)
    year = Column(Integer, nullable=False)
    
    question = relationship("Question", back_populates="occurrences")

class QuestionVersion(Base):
    __tablename__ = "question_versions"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    question_id = Column(String, ForeignKey("questions.id"), nullable=False)
    version_no = Column(Integer, nullable=False)
    snapshot = Column(JSONB, nullable=False)
    changed_by = Column(String(255), default="student")
    reason = Column(String(512), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    question = relationship("Question", back_populates="versions")

class GeneratedPaper(Base):
    __tablename__ = "generated_papers"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String(255), nullable=True, index=True)
    subject_id = Column(String, ForeignKey("subjects.id"), nullable=False)
    kind = Column(String(10), nullable=False) # 'QB'|'SP'
    status = Column(String(20), default="draft") # 'draft'|'approved'|'rejected'
    format_id = Column(String, ForeignKey("formats.id"), nullable=True)
    blueprint = Column(JSONB, nullable=True)
    pdf_ref = Column(String(512), nullable=True)
    json_ref = Column(String(512), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    items = relationship("GeneratedPaperItem", back_populates="paper", cascade="all, delete-orphan")

class GeneratedPaperItem(Base):
    __tablename__ = "generated_paper_items"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    paper_id = Column(String, ForeignKey("generated_papers.id"), nullable=False)
    slot = Column(String(50), nullable=False)
    question_id = Column(String, ForeignKey("questions.id"), nullable=False)
    
    paper = relationship("GeneratedPaper", back_populates="items")

class FormatConfig(Base):
    __tablename__ = "formats"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    config = Column(JSONB, nullable=False) # Parts structure & rules
    created_at = Column(DateTime, default=datetime.utcnow)

class Job(Base):
    __tablename__ = "jobs"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String(255), nullable=True, index=True)
    type = Column(String(50), nullable=False) # 'INGEST_PYQ'|'GENERATE_QB'|'GENERATE_SP'|'GENERATE_BOTH'
    status = Column(String(20), default="pending") # 'pending'|'running'|'completed'|'failed'
    stage = Column(String(100), default="queued")
    progress = Column(Float, default=0.0)
    payload = Column(JSONB, nullable=True)
    error = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class UserUsage(Base):
    __tablename__ = "user_usages"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String(255), nullable=False, index=True)
    job_id = Column(String, nullable=True)
    action = Column(String(50), nullable=False)
    prompt_tokens = Column(Integer, default=0)
    completion_tokens = Column(Integer, default=0)
    estimated_cost = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
