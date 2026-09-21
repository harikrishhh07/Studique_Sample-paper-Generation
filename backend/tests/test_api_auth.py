import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings

client = TestClient(app)

def test_root_and_health():
    res = client.get("/")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"
    
    health_res = client.get("/health")
    assert health_res.status_code == 200
    assert health_res.json()["status"] == "healthy"

def test_proxy_auth_missing_header():
    res = client.get("/jobs/job-123")
    assert res.status_code == 403
    assert "Forbidden" in res.json()["detail"]

def test_proxy_auth_invalid_secret():
    res = client.get(
        "/jobs/job-123",
        headers={
            "X-Studique-Proxy-Secret": "wrong_secret",
            "X-Student-User-Id": "student_123"
        }
    )
    assert res.status_code == 403

def test_proxy_auth_missing_student_id():
    res = client.get(
        "/jobs/job-123",
        headers={"X-Studique-Proxy-Secret": settings.PROXY_SHARED_SECRET}
    )
    assert res.status_code == 401
    assert "Student identity missing" in res.json()["detail"]
