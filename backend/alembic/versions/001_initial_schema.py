"""initial schema with pgvector and seeded SRM format

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-09-19 22:50:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import json
import uuid

# revision identifiers, used by Alembic.
revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    # 1. Enable pgvector extension
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")

    # 2. Subjects
    op.create_table(
        'subjects',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('code')
    )
    op.create_index(op.f('ix_subjects_code'), 'subjects', ['code'], unique=True)

    # 3. Syllabus Units
    op.create_table(
        'syllabus_units',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('subject_id', sa.String(), nullable=False),
        sa.Column('unit_no', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('topics', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.ForeignKeyConstraint(['subject_id'], ['subjects.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # 4. Source Papers
    op.create_table(
        'source_papers',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('subject_id', sa.String(), nullable=False),
        sa.Column('exam_name', sa.String(length=255), nullable=False),
        sa.Column('exam_type', sa.String(length=100), nullable=True),
        sa.Column('month', sa.String(length=50), nullable=False),
        sa.Column('year', sa.Integer(), nullable=False),
        sa.Column('file_ref', sa.String(length=512), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['subject_id'], ['subjects.id']),
        sa.PrimaryKeyConstraint('id')
    )

    # 5. Formats
    op.create_table(
        'formats',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('config', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )

    # 6. Questions
    op.execute("""
    CREATE TABLE questions (
        id VARCHAR PRIMARY KEY,
        subject_id VARCHAR NOT NULL REFERENCES subjects(id),
        source_paper_id VARCHAR REFERENCES source_papers(id),
        unit_id VARCHAR REFERENCES syllabus_units(id),
        part VARCHAR(10) NOT NULL,
        question_no INTEGER NOT NULL,
        or_group VARCHAR(20),
        sub_no VARCHAR(20),
        marks INTEGER NOT NULL,
        bl INTEGER DEFAULT 1,
        co INTEGER DEFAULT 1,
        po INTEGER DEFAULT 1,
        question_text TEXT NOT NULL,
        options JSONB,
        figure_refs JSONB,
        source_type VARCHAR(20) DEFAULT 'extracted',
        extraction_confidence FLOAT DEFAULT 1.0,
        unit_confidence FLOAT DEFAULT 1.0,
        similarity_status VARCHAR(50) DEFAULT 'unique',
        review_status VARCHAR(50) DEFAULT 'verified',
        canonical_id VARCHAR REFERENCES questions(id),
        embedding vector(1536),
        answer_key TEXT,
        source_refs JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # 7. Question Occurrences
    op.create_table(
        'question_occurrences',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('question_id', sa.String(), nullable=False),
        sa.Column('source_paper_id', sa.String(), nullable=True),
        sa.Column('exam_name', sa.String(length=255), nullable=False),
        sa.Column('month', sa.String(length=50), nullable=False),
        sa.Column('year', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['question_id'], ['questions.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['source_paper_id'], ['source_papers.id']),
        sa.PrimaryKeyConstraint('id')
    )

    # 8. Question Versions
    op.create_table(
        'question_versions',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('question_id', sa.String(), nullable=False),
        sa.Column('version_no', sa.Integer(), nullable=False),
        sa.Column('snapshot', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('changed_by', sa.String(length=255), nullable=True),
        sa.Column('reason', sa.String(length=512), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['question_id'], ['questions.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # 9. Generated Papers
    op.create_table(
        'generated_papers',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('subject_id', sa.String(), nullable=False),
        sa.Column('kind', sa.String(length=10), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=True),
        sa.Column('format_id', sa.String(), nullable=False),
        sa.Column('blueprint', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('pdf_ref', sa.String(length=512), nullable=True),
        sa.Column('json_ref', sa.String(length=512), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['format_id'], ['formats.id']),
        sa.ForeignKeyConstraint(['subject_id'], ['subjects.id']),
        sa.PrimaryKeyConstraint('id')
    )

    # 10. Generated Paper Items
    op.create_table(
        'generated_paper_items',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('paper_id', sa.String(), nullable=False),
        sa.Column('slot', sa.String(length=50), nullable=False),
        sa.Column('question_id', sa.String(), nullable=False),
        sa.ForeignKeyConstraint(['paper_id'], ['generated_papers.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['question_id'], ['questions.id']),
        sa.PrimaryKeyConstraint('id')
    )

    # 11. Jobs
    op.create_table(
        'jobs',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('type', sa.String(length=50), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=True),
        sa.Column('stage', sa.String(length=100), nullable=True),
        sa.Column('progress', sa.Float(), nullable=True),
        sa.Column('payload', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('error', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )

    # Seed default SRM format config
    srm_format_config = {
        "institution": "SRM Institute of Science and Technology",
        "total_marks": 75,
        "parts": [
            {
                "name": "Part A",
                "question_count": 20,
                "marks_per_question": 1,
                "choice_type": "ALL", # Answer ALL Questions
                "total_marks": 20
            },
            {
                "name": "Part B",
                "question_count": 5,
                "marks_per_question": 8,
                "choice_type": "OR", # 21.a OR 21.b, 22.a OR 22.b, ...
                "total_marks": 40
            },
            {
                "name": "Part C",
                "question_count": 3,
                "marks_per_question": 15,
                "choice_type": "ANY_ONE", # Answer ANY ONE question from 26, 27, 28
                "total_marks": 15
            }
        ]
    }

    formats_table = sa.table(
        'formats',
        sa.column('id', sa.String),
        sa.column('name', sa.String),
        sa.column('config', postgresql.JSONB)
    )

    op.bulk_insert(
        formats_table,
        [
            {
                'id': 'srm-standard-v1',
                'name': 'SRM Standard End Sem (75 Marks)',
                'config': srm_format_config
            }
        ]
    )

def downgrade() -> None:
    op.drop_table('jobs')
    op.drop_table('generated_paper_items')
    op.drop_table('generated_papers')
    op.drop_table('question_versions')
    op.drop_table('question_occurrences')
    op.drop_table('questions')
    op.drop_table('formats')
    op.drop_table('source_papers')
    op.drop_table('syllabus_units')
    op.drop_table('subjects')
