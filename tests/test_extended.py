"""
Extended test suite for retinal-oct-segmentation-agent.
Tests for security, batch processing, metrics, and audit trail integrity.
"""
import sys
import csv
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import pytest
from agents.base import PHIGuard, AuditLogger, AuditTrail, SecurityException
from agents.models import SystemTaskPayload, UrgencyLevel
from agents.supervisor import SystemSupervisor
from agents.metrics import SystemMetricsCollector
from agents.learning import ActiveLearningEngine
from agents.llm_factory import LLMFactory, MockLLM
from cli import main


class TestPHIGuardRedaction:
    def test_redact_phi_replaces_identifiers(self):
        text = "Patient MRN-12345678 has phone 555-123-4567"
        redacted = PHIGuard.redact_phi(text)
        assert "MRN-12345678" not in redacted
        assert "555-123-4567" not in redacted
        assert "[REDACTED_IDENTIFIER]" in redacted

    def test_clean_text_unchanged(self):
        text = "Analytical specimen KEY-001 within normal parameters"
        assert PHIGuard.redact_phi(text) == text


class TestAuditTrailSignatureVerification:
    def test_audit_trail_signature_verification(self):
        trail = AuditTrail(secret_key="test-key-for-verification")
        trail.log("test_actor", "tier1", "TEST_EVENT", {"data": "value1"})
        trail.log("test_actor", "tier1", "TEST_EVENT", {"data": "value2"})
        assert trail.verify_integrity() is True

    def test_audit_trail_tamper_detection(self):
        trail = AuditTrail(secret_key="test-key-for-tamper")
        trail.log("actor", "tier", "EVENT", {"data": "original"})
        # Tamper with the log entry
        trail.logs[0]["payload_hash"] = "tampered_hash"
        assert trail.verify_integrity() is False


class TestBatchProcessing:
    def test_batch_with_sample_csv(self):
        # Create temp files within working directory to pass path validation
        cwd = Path.cwd()
        input_path = cwd / "_test_batch_input.csv"
        output_path = cwd / "_test_batch_output.csv"

        with open(input_path, 'w', newline='') as f:
            f.write("task_id,target_identifier,primary_metric,secondary_metric,is_critical_flag,status_descriptor\n")
            f.write("T1,KEY-01,28.4,14.2,True,DISCORDANT\n")
            f.write("T2,KEY-02,12.0,4.1,False,NOMINAL\n")

        try:
            result = main(["batch", "-i", str(input_path), "-o", str(output_path)])
            assert result == 0
            assert output_path.exists()

            with open(output_path, 'r') as f:
                reader = csv.DictReader(f)
                rows = list(reader)
                assert len(rows) == 2
                assert "overall_urgency" in rows[0]
        finally:
            if input_path.exists():
                input_path.unlink()
            if output_path.exists():
                output_path.unlink()

    def test_batch_missing_file_returns_error(self):
        result = main(["batch", "-i", "/nonexistent/path/file.csv"])
        assert result == 1


class TestMetricsCollector:
    def test_prometheus_export_format(self):
        collector = SystemMetricsCollector()
        collector.record_task("CRITICAL_STAT_PANIC", 0.05)
        collector.record_task("ELEVATED_RISK", 0.03)
        collector.record_task("ROUTINE", 0.01)
        collector.record_phi_block()

        output = collector.export_prometheus_text()
        assert "system_tasks_total" in output
        assert "alerts_triggered_total" in output
        assert "phi_outbound_blocks_total" in output
        assert "audit_chain_blocks_total" in output

    def test_metrics_counters_increment(self):
        collector = SystemMetricsCollector()
        collector.record_task("CRITICAL_STAT_PANIC", 0.1)
        assert collector.tasks_total == 1
        assert collector.critical_alerts_total == 1
        collector.record_phi_block()
        assert collector.phi_blocks_total == 1


class TestLLMFactory:
    def test_mock_llm_returns_deterministic_response(self):
        llm = MockLLM("Test System")
        result = llm.invoke("Test query about specifications")
        assert "Test System" in result
        assert "No clinical verification performed" in result

    def test_mock_llm_blocks_phi(self):
        llm = MockLLM()
        with pytest.raises(SecurityException):
            llm.invoke("Patient MRN-12345678 diagnosis")

    def test_factory_returns_mock_for_unknown_provider(self):
        llm = LLMFactory.create("unknown_provider")
        assert isinstance(llm, MockLLM)


class TestActiveLearningEngine:
    def test_record_feedback_updates_weights(self):
        engine = ActiveLearningEngine()
        engine.record_feedback("InvariantQCWorker", True, 0.9)
        engine.record_feedback("InvariantQCWorker", True, 0.8)
        weights = engine.get_calibrated_weights()
        assert "InvariantQCWorker" in weights
        assert weights["InvariantQCWorker"] > 0.5

    def test_uncertainty_buffer(self):
        engine = ActiveLearningEngine()
        engine.record_feedback("InvariantQCWorker", True, 0.55)
        assert len(engine.uncertainty_buffer) == 1


class TestSupervisorEdgeCases:
    def test_supervisor_with_phi_in_task_id_raises(self):
        supervisor = SystemSupervisor(model_provider="mock")
        payload = SystemTaskPayload(
            task_id="MRN-12345678",
            target_identifier="KEY-01",
            primary_metric=10.0,
        )
        with pytest.raises(SecurityException):
            supervisor.process_task(payload)

    def test_supervisor_routine_classification(self):
        supervisor = SystemSupervisor(model_provider="mock")
        payload = SystemTaskPayload(
            task_id="TASK-NOMINAL-01",
            target_identifier="KEY-NOMINAL",
            primary_metric=10.0,
            secondary_metric=5.0,
            status_descriptor="NOMINAL",
            is_critical_flag=False,
        )
        dossier = supervisor.process_task(payload)
        assert dossier.overall_urgency == UrgencyLevel.ROUTINE
        assert dossier.total_alerts == 0
