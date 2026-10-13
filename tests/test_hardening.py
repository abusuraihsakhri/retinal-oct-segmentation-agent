"""Regression checks for validation, HTTP safety, and CSV data integrity."""
import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError
from agents.api import app
from agents.base import AuditTrail
from agents.models import SystemTaskPayload
from cli import main

def test_metrics_reject_non_finite():
    for value in [float("nan"), float("inf"), -float("inf")]:
        with pytest.raises(ValidationError):
            SystemTaskPayload(task_id="T", target_identifier="X", primary_metric=value)
        with pytest.raises(ValidationError):
            SystemTaskPayload(task_id="T", target_identifier="X", primary_metric=1, secondary_metric=value)

def test_audit_copy_cannot_tamper_with_internal_chain():
    trail = AuditTrail(secret_key="unit-test")
    trail.log("actor", "supervisor", "test", {"test": "data"})
    export = trail.get_trail()
    export[0]["payload_hash"] = "spoofed"
    assert trail.verify_integrity() is True

def test_api_rejects_phi_instead_of_server_error():
    client = TestClient(app)
    response = client.post("/api/audit", json={
        "task_id": "MRN-12345678", "target_identifier": "T", "primary_metric": 5
    })
    assert response.status_code == 422
    assert "MRN-12345678" not in response.text

def test_public_audit_status_does_not_disclose_individual_logs():
    client = TestClient(app)
    response = client.get("/api/audit/logs")
    assert response.status_code == 200
    assert "audit_trail" not in response.json()
    assert response.json()["verified"] is True

def test_batch_rejects_overwrite_and_bad_headers(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    source = tmp_path / "same.csv"
    original = "task_id,target_identifier,primary_metric\nT1,X1,5\n"
    source.write_text(original)
    assert main(["batch", "-i", "same.csv", "-o", "same.csv"]) == 1
    assert source.read_text() == original
    source.write_text("task_id,task_id,primary_metric\nT1,X1,5\n")
    assert main(["batch", "-i", "same.csv", "-o", "result.csv"]) == 1
    assert not (tmp_path / "result.csv").exists()
