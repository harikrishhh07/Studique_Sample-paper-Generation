import os
import pytest
import io
from unittest.mock import AsyncMock, MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import get_db
from app.core.config import settings
from app.services.validator import StructureValidator
from scripts.eval_extraction import evaluate_extraction

client = TestClient(app)

def test_structure_validator_valid():
    questions = []
    for i in range(1, 21):
        questions.append({"part": "A", "question_no": i, "marks": 1})
    for i in range(21, 26):
        questions.append({"part": "B", "question_no": i, "or_group": f"{i}.a", "marks": 8})
        questions.append({"part": "B", "question_no": i, "or_group": f"{i}.b", "marks": 8})
    questions.append({"part": "C", "question_no": 27, "marks": 15})

    is_valid, errors = StructureValidator.validate_extraction(questions)
    assert is_valid is True
    assert len(errors) == 0

def test_structure_validator_invalid_part_a():
    questions = [{"part": "A", "question_no": 1, "marks": 1}]
    is_valid, errors = StructureValidator.validate_extraction(questions)
    assert is_valid is False
    assert any("20 questions" in err for err in errors)

def test_upload_pdf_and_job_creation():
    mock_db = AsyncMock()
    mock_scalar = MagicMock()
    mock_scalar.scalar_one_or_none.return_value = None
    mock_db.execute.return_value = mock_scalar
    mock_db.add = MagicMock()
    mock_db.flush = AsyncMock()
    mock_db.commit = AsyncMock()

    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        pdf_bytes = b"%PDF-1.4 sample pdf content for extraction test"
        file_obj = ("pyq_files", ("sample_paper.pdf", io.BytesIO(pdf_bytes), "application/pdf"))
        
        res = client.post(
            "/uploads",
            files=[file_obj],
            data={
                "subject_code": "21MAB102T",
                "subject_name": "Advanced Calculus",
                "output_choice": "both"
            },
            headers={
                "X-Studique-Proxy-Secret": settings.PROXY_SHARED_SECRET,
                "X-Student-User-Id": "student_test_123"
            }
        )
        assert res.status_code == 200
        data = res.json()
        assert "job_id" in data
        assert "subject_id" in data
    finally:
        app.dependency_overrides.clear()

def test_eval_extraction_script():
    sample_path = "fixtures/gold/sample_extraction.json"
    gold_path = "fixtures/gold/21mab102t_july2023_gold.json"
    
    report = evaluate_extraction(sample_path, gold_path)
    assert "text_accuracy" in report
    assert "metadata_accuracy" in report
    assert "math_latex_accuracy" in report
    assert report["overall_score"] > 0
