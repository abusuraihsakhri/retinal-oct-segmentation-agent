# Retinal OCT Segmentation Agent

**Implementation status:** This repository is a *deterministic threshold-evaluation demonstration*. Despite its historical name, it **does not implement retinal OCT image segmentation**. It does not accept OCT images, segment retinal layers, measure retinal thickness, quantify fluid, or validate clinical outcomes. Do not use its classifications or recommendations for patient care.

## Browser demonstration

Open [web/index.html](web/index.html) in a modern browser. The self-contained interface evaluates synthetic task identifiers, two numeric metrics, a status descriptor, and a critical flag. It displays a JSON dossier and can download the result. JavaScript mirrors the rules in [agents/workers.py](agents/workers.py):

| Rule | Demonstration response |
| --- | --- |
| Primary metric > 25 | Elevated alert |
| Secondary metric > 12 | Elevated alert |
| Explicit critical flag | Critical alert |
| Descriptor contains DISCORDANT, ANOMALY, MUTANT, VIOLATION, FAIL, or REJECT | Elevated alert |
| No triggers | Routine |

These arbitrary demonstration thresholds are **not OCT-specific reference intervals** or clinically validated thresholds. The browser implementation runs locally, makes no network requests, and does not collect, upload, or persist inputs. It does not create HMAC audit signatures; the exported JSON intentionally has a null audit hash. Do not enter patient-identifiable information.

A GitHub Pages publishing workflow is included; publication depends on the repository's Pages configuration. The browser app does not require Pyodide because the implemented rules are directly expressible in JavaScript.

## Python CLI and API

Python 3.10 or newer is recommended.

[Download or clone this repository](https://github.com/abusuraihsakhri/retinal-oct-segmentation-agent), then from the repository directory:

~~~bash
python -m pip install -e ".[dev]"
python cli.py audit --task-id T001 --target X001 --primary 28.5 --secondary 14.2 --critical --status DISCORDANT
python cli.py batch --input sample.csv --output results.csv
python cli.py chat "What is the status?"
python cli.py verify-audit
python cli.py serve --host 127.0.0.1 --port 8000
~~~

The main CLI and FastAPI application use the three workers in the agents/ package. The CLI CSV input requires task_id, target_identifier, and primary_metric; optional columns are secondary_metric, status_descriptor, and is_critical_flag. Invalid rows are skipped with warnings. Input and output paths must be distinct and remain within the current working directory.

The local FastAPI service at http://127.0.0.1:8000 exposes:

| Route | Function |
| --- | --- |
| GET /health | Basic service metadata |
| POST /api/audit | Rule-based evaluation |
| POST /api/chat | Deterministic mock reply; not a live language model |
| GET /metrics | JSON in-memory counters |
| GET /api/audit/logs | HMAC audit-integrity summary; no per-task log data |
| GET /docs | Generated OpenAPI documentation |

The separate retina_oct_agent/ package and retina_oct_agent_app.py provide a legacy alternative runner with different thresholds and output structure. Its results should not be treated as interchangeable with the main agents/ implementation.

## Security and privacy

- The Python audit trail is signed with HMAC-SHA256 and stored **in process memory only**. It is not durable, independently timestamped, or a regulatory-compliant audit record.
- Set AUDIT_SECRET_KEY to a unique random value for persistent signing-key consistency across restarts. An ephemeral key is generated if none is supplied.
- Regex-based identifier screening catches some common MRN, phone, email and other identifier patterns. It **does not ensure de-identification, HIPAA compliance, or complete PHI prevention**.
- The API has **no authentication** and must not be exposed directly to the public internet or given real patient data.
- Other named language-model providers in agents/llm_factory.py currently return the same deterministic mock; they are not implemented integrations.
- The formerly hard-coded Compose signing key must be regarded as disclosed and rotated if it was ever used.

For local container use, copy .env.example to .env, generate a unique secret (for example with the command below), and assign it to AUDIT_SECRET_KEY. Then run docker compose up --build. Compose binds the service to localhost port 8000.

~~~bash
python -c "import secrets; print(secrets.token_hex(32))"
~~~

## Development and tests

~~~bash
python -m pip install -e ".[dev]"
python -m pytest -q
python -m compileall -q agents retina_oct_agent cli.py simulator.py enrichment.py
node --check web/engine.js
node --check web/app.js
node --test web/test-*.cjs
~~~

Python uses FastAPI, Pydantic v2, and Uvicorn. Browser functionality uses plain HTML, CSS and JavaScript with no framework, CDN or package install. The browser demo requires a current version of Chrome, Firefox, Safari, or Edge; older browsers without modern JavaScript syntax are not supported. CI checks Python 3.10–3.12 and executes the Node-based browser regression tests.

## License

[MIT](LICENSE).
