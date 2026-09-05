# Retinal OCT Segmentation Agent

> **Domain:** Clinical Decision Support & Biomedical Computing  
> **Reference Guidelines & Standards:** `Standard Clinical Formulations & ISO/IEC Quality Frameworks`

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![Python](https://img.shields.io/badge/Python-3.10%20%7C%203.11%20%7C%203.12-3776AB.svg?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688.svg?logo=fastapi&logoColor=white)
![Audit Trail](https://img.shields.io/badge/Audit-HMAC--SHA256_Tamper--Evident-brightgreen.svg)
![Zero-PHI Guard](https://img.shields.io/badge/Guard-Zero--PHI_Outbound-blue.svg)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg?logo=docker&logoColor=white)

</div>

---

## 📖 What It Does

Retinal OCT Segmentation Agent is an enterprise-grade analytical platform for clinical decision support. It processes biomedical measurements through specialized worker agents, classifies urgency levels, and maintains a tamper-evident cryptographic audit trail. The system enforces zero-PHI (Protected Health Information) outbound guards to prevent accidental data leakage.

---

## ⚙️ Key Capabilities & Algorithmic Modules

- **Deterministic Calculation Engine**: Strict compliance with standard reference formulations and thresholds.
- **Risk & Urgency Classification**: Multi-tier categorization (ROUTINE, ELEVATED, CRITICAL_STAT) with automated clinical/operational action recommendations.
- **Validation & Guardrails**: Rigorous input bounds checking and anomaly detection.
- **Multi-Worker Consensus**: InvariantQC, SafetyEscalation, and ProtocolConformance workers evaluate each task.
- **Active Learning Calibration**: Bayesian weight tracking for worker reliability.

---

## 💻 Installation

```bash
# Clone the repository
git clone https://github.com/abusuraihsakhri/retinal-oct-segmentation-agent.git
cd retinal-oct-segmentation-agent

# Install dependencies
pip install -e ".[dev]"

# Or install directly
pip install pydantic fastapi uvicorn pytest
```

---

## 🚀 CLI Quickstart & Usage

### 1. Run Single Task Evaluation
```bash
python cli.py audit --task-id TASK-001 --target KEY-01 --primary 28.5 --secondary 14.2 --critical --status DISCORDANT
```

### 2. Interactive Chat Query
```bash
python cli.py chat "What is the system status?"
```

### 3. Batch Process CSV Records
```bash
python cli.py batch -i sample.csv -o results.csv
```

### 4. Verify Audit Trail Integrity
```bash
python cli.py verify-audit
```

### 5. Launch FastAPI REST Server
```bash
python cli.py serve --host 127.0.0.1 --port 8000
```

### Parameter Reference
| Parameter | Description | Default |
|:----------|:------------|:--------|
| `--task-id` | Unique task/case identifier | TASK-2026-001 |
| `--target` | Target specimen or entity identifier | KEY-TARGET-01 |
| `--primary` | Primary measurement value (float) | 28.5 |
| `--secondary` | Secondary metric value (float) | 14.2 |
| `--critical` | Flag for critical/emergency escalation | False |
| `--status` | Status descriptor (NOMINAL, DISCORDANT, etc.) | DISCORDANT |

### Input Data Schema (CSV Batch)

| Field | Description | Requirement |
|:------|:------------|:------------|
| `task_id` | Unique task identifier | Required |
| `target_identifier` | Target specimen identifier | Required |
| `primary_metric` | Primary measurement value | Required |
| `secondary_metric` | Secondary metric value | Required |
| `is_critical_flag` | Critical escalation flag (true/false) | Optional |
| `status_descriptor` | Status/phenotype descriptor | Optional |

---

## 🛡️ Security & Enterprise Architecture

* **Zero-PHI Outbound Interceptor:** Active regex inspection blocking SSNs, MRNs, phone numbers, emails, and patient identifiers.
* **Tamper-Evident HMAC-SHA256 Audit Trail:** Chained, cryptographically signed logs for every evaluation and state transition. Signatures are verified on integrity checks.
* **Path Traversal Protection:** Batch file operations validate paths remain within the working directory.
* **Secure Defaults:** Audit secret key must be configured via `AUDIT_SECRET_KEY` environment variable (ephemeral key generated if not set).
* **Air-Gapped LLM Reasoning Adapter:** Agnostic integration for local Ollama instances (`llama3`, `mistral`), Claude 3.5 Sonnet, GPT-4o, and deterministic test mocks.
* **FastAPI & Prometheus Telemetry:** Exposes OpenAPI 3.1 REST endpoints and operational Prometheus metrics (`/metrics`).

---

## 🧪 Testing & Verification

Run the full automated test suite:

```bash
pytest -v
```

Run with coverage:

```bash
pytest -v --tb=short
```

Execute high-throughput simulation benchmarks:

```bash
python simulator.py 1000
```

---

## 🐳 Container Deployment

```bash
docker build -t retinal-oct-segmentation-agent .
docker run -p 8000:8000 -e AUDIT_SECRET_KEY=your-secret-key retinal-oct-segmentation-agent
```

Or using Docker Compose:

```bash
docker-compose up -d
```

---

## 📁 Project Structure

```
retinal-oct-segmentation-agent/
├── agents/                  # Core enterprise agent modules
│   ├── __init__.py
│   ├── api.py              # FastAPI REST endpoints
│   ├── base.py             # Security, PHI guard, audit trail
│   ├── learning.py         # Bayesian calibration engine
│   ├── llm_factory.py      # LLM provider factory
│   ├── metrics.py          # Prometheus metrics collector
│   ├── models.py           # Pydantic data models
│   ├── streamer.py         # WebSocket telemetry broadcaster
│   ├── supervisor.py       # Master orchestrator
│   └── workers.py          # Specialized worker agents
├── retina_oct_agent/        # Frontier OCT analysis modules
│   ├── agents.py           # Sub-agents and coordinator
│   ├── cli.py              # Frontier CLI
│   ├── engine.py           # Core algorithmic engine
│   ├── models.py           # Frontier data models
│   └── server.py           # Frontier FastAPI server
├── tests/                   # Test suite
│   ├── test_extended.py     # Security, batch, metrics tests
│   ├── test_enrichment.py   # Enrichment module tests
│   ├── test_retina_oct_agent.py  # Frontier agent tests
│   └── test_retinal_oct_segmentation_agent.py  # Core agent tests
├── web/                     # Operations console (HTML/JS)
├── cli.py                   # Main CLI entry point
├── enrichment.py            # Feature enrichment engines
├── simulator.py             # High-throughput simulation
├── pyproject.toml           # Project configuration
├── Dockerfile               # Container build
├── docker-compose.yml       # Container orchestration
└── sample.csv               # Sample batch input data
```

---

## 🔧 Environment Variables

| Variable | Description | Required |
|:---------|:------------|:---------|
| `AUDIT_SECRET_KEY` | Secret key for HMAC-SHA256 audit signing | Recommended |
| `MODEL_PROVIDER` | LLM provider (mock, ollama, claude, openai) | No (default: mock) |

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
