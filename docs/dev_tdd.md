# Logfire Adoption TDD Plan

The following phases are mutually exclusive and collectively exhaustive. Within each phase, the listed TDD cycles (Red → Green → Refactor → Regression) can run in parallel—up to three agents concurrently—without blocking dependencies across cycles.

## [ ] Phase 1 — Dependency & Environment Foundations

> Concurrency: Cycles 1A–1C may run in parallel once shared repos are pulled.

### Cycle 1A — Pin Logfire Runtime

- [x] **Red:** Add a failing unit test asserting a Logfire bootstrap helper exists.
  - Files: `tests/python/test_logfire_bootstrap.py` (new)
  - Dependencies: `pytest`, existing Python test harness
  - Satisfies: DEV-PRD-018, DEV-SDS-018
- [x] **Green:** Declare the `logfire` dependency and expose a minimal `bootstrap_logfire` stub that raises `NotImplementedError`.
  - Files: `pyproject.toml`, `uv.lock`, `libs/python/vibepro_logging.py`
  - Dependencies: Python packaging workflow (`uv sync`)
  - Satisfies: DEV-PRD-018, DEV-SDS-018
- [x] **Refactor:** Normalize dependency version pinning and share OTEL env var defaults in `templates/{{project_slug}}/.env.j2`.
  - Files: `pyproject.toml`, `templates/{{project_slug}}/.env.example.j2`
  - Dependencies: Copier templating conventions
  - Satisfies: DEV-PRD-011, DEV-SDS-010
- [x] **Regression:** Run `just ai-validate` (or `pytest tests/python/test_logfire_bootstrap.py`) to ensure the new dependency integrates cleanly.
  - Dependencies: Devbox shell, `mise` runtimes
  - Satisfies: DEV-PRD-007, DEV-SDS-006

### Cycle 1B — CI & Task Wiring

- [x] **Red:** Create a failing CI task asserting `logfire` smoke tests are invoked (e.g., missing `tools/logging/test_logfire.py`).
  - Files: `.github/workflows/ai-validate.yml`, `Justfile`
  - Dependencies: Existing CI workflow templates
  - Satisfies: DEV-PRD-007, DEV-SDS-006
- [x] **Green:** Add a `just test:logfire` target that runs the smoke script and wire it into CI.
  - Files: `Justfile`, `.github/workflows/ai-validate.yml`, `tools/logging/test_logfire.py` (stub)
  - Dependencies: Node/Python shared tooling, execution permissions
  - Satisfies: DEV-PRD-018, DEV-SDS-018
- [x] **Refactor:** Consolidate logging-related tasks under a single namespace (e.g., `test:logs`) to avoid duplication.
  - Files: `Justfile`, `docs/observability/README.md`
  - Dependencies: Existing logging tasks (`test:logs`)
  - Satisfies: DEV-PRD-004, DEV-SDS-004
- [x] **Regression:** Execute `just test:logs` locally and confirm CI workflow passes in dry-run mode (`act` or workflow dispatcher).
  - Dependencies: Local Vector mock, GitHub Actions runner config
  - Satisfies: DEV-PRD-018, DEV-SDS-018

### Cycle 1C — Template Synchronisation

- [ ] **Red:** Add a failing copier template test expecting Logfire env vars in generated projects.
  - Files: `tests/copier/test_logfire_template.py` (new), `justfile` test target
  - Dependencies: Copier test harness (`just test-generation`)
  - Satisfies: DEV-PRD-021, DEV-SDS-021
- [ ] **Green:** Update template files to include Logfire settings and documentation placeholders.
  - Files: `templates/{{project_slug}}/.github/prompts/tdd-tbd.prompt.md`, `templates/{{project_slug}}/docs/observability/logging.md.j2`
  - Dependencies: Jinja templating, existing docs snippets
  - Satisfies: DEV-PRD-018, DEV-SDS-018
- [ ] **Refactor:** Ensure template variables reuse existing macros for OTEL endpoints.
  - Files: `templates/{{project_slug}}/docs/_includes/env_vars.md.j2`
  - Dependencies: Template macro library
  - Satisfies: DEV-PRD-006, DEV-SDS-002
- [ ] **Regression:** Run `just test-generation` to validate rendered workspace reflects new env vars and docs.
  - Dependencies: Copier, temporary output directory
  - Satisfies: DEV-PRD-021, DEV-SDS-021

## [ ] Phase 2 — Python Instrumentation Delivery

> Concurrency: Cycles 2A–2C require Phase 1 artifacts present but are otherwise independent.

### Cycle 2A — FastAPI Instrumentation

- [ ] **Red:** Extend `tests/python/test_logfire_bootstrap.py` asserting FastAPI requests emit spans (test currently skips due to missing instrumentation).
  - Files: `tests/python/test_logfire_bootstrap.py`
  - Dependencies: `httpx`, `fastapi`, `pytest-asyncio`
  - Satisfies: DEV-PRD-018, DEV-SDS-018
- [ ] **Green:** Implement `bootstrap_logfire` to call `logfire.configure` and `logfire.instrument_fastapi`.
  - Files: `libs/python/vibepro_logging.py`
  - Dependencies: Logfire SDK API
  - Satisfies: DEV-PRD-018, DEV-SDS-018
- [ ] **Refactor:** Extract shared OTEL env binding into `libs/python/vibepro_logging.py::default_metadata`.
  - Files: `libs/python/vibepro_logging.py`
  - Dependencies: Python typing utilities (`TypedDict` or dataclasses)
  - Satisfies: DEV-PRD-020, DEV-SDS-022
- [ ] **Regression:** Run `pytest tests/python/test_logfire_bootstrap.py -k fastapi` and `just test:logs`.
  - Dependencies: FastAPI test client, Devbox shell
  - Satisfies: DEV-PRD-023, DEV-SDS-022

### Cycle 2B — Context Binding API

- [ ] **Red:** Author a failing unit test that expects `get_logger()` to bind `environment` and `application_version`.
  - Files: `tests/python/test_logfire_context.py` (new)
  - Dependencies: Python logging fixtures
  - Satisfies: DEV-PRD-018, DEV-SDS-018
- [ ] **Green:** Implement `get_logger()` to return a Logfire-bound logger with the shared metadata and ensure optional category defaults.
  - Files: `libs/python/vibepro_logging.py`
  - Dependencies: `typing` protocols, Logfire API
  - Satisfies: DEV-PRD-018, DEV-SDS-018
- [ ] **Refactor:** Centralize category constants in `libs/python/vibepro_logging.py` and export for reuse by generated services.
  - Files: `libs/python/vibepro_logging.py`, `templates/{{project_slug}}/libs/shared/logging/constants.py.j2`
  - Dependencies: Template sync with runtime library
  - Satisfies: DEV-PRD-006, DEV-SDS-002
- [ ] **Regression:** Execute `pytest tests/python/test_logfire_context.py` and re-run `just test-generation` to confirm template alignment.
  - Dependencies: Copier artifacts from Phase 1C
  - Satisfies: DEV-PRD-021, DEV-SDS-021

### Cycle 2C — Optional Integrations

- [ ] **Red:** Add skipped tests outlining expected spans for `requests` and `pydantic` instrumentation.
  - Files: `tests/python/test_logfire_integrations.py` (new)
  - Dependencies: `requests`, `pydantic`, `pytest`
  - Satisfies: DEV-PRD-018, DEV-SDS-018
- [ ] **Green:** Wire optional helpers (`logfire.instrument_requests`, `logfire.instrument_pydantic`) behind feature flags or settings toggles.
  - Files: `libs/python/vibepro_logging.py`, `docs/observability/README.md`
  - Dependencies: Environment variable parsing (`os.getenv`)
  - Satisfies: DEV-PRD-009, DEV-SDS-008
- [ ] **Refactor:** Move toggle parsing into a reusable settings module (`libs/python/logging_settings.py`).
  - Files: `libs/python/logging_settings.py` (new), `libs/python/vibepro_logging.py`
  - Dependencies: Shared configuration patterns
  - Satisfies: DEV-PRD-006, DEV-SDS-002
- [ ] **Regression:** Run targeted tests (`pytest tests/python/test_logfire_integrations.py`) with toggles on/off and confirm `just test:logs` still passes.
  - Dependencies: Environment variable management within tests
  - Satisfies: DEV-PRD-018, DEV-SDS-018

## [ ] Phase 3 — Pipeline & Documentation Integration

> Concurrency: Cycles 3A–3C depend on Phase 2 outputs but do not depend on one another.

### Cycle 3A — Vector & Monitoring Updates

- [ ] **Red:** Introduce a failing shell test expecting Logfire-derived fields in Vector output.
  - Files: `tests/ops/test_vector_logfire.sh` (new)
  - Dependencies: Shell test harness, Docker/Vector binary
  - Satisfies: DEV-PRD-018, DEV-SDS-018
- [ ] **Green:** Update `ops/vector/vector.toml` to ensure OTLP log ingestion captures Logfire spans and metadata.
  - Files: `ops/vector/vector.toml`
  - Dependencies: Vector configuration syntax
  - Satisfies: DEV-PRD-018, DEV-SDS-018
- [ ] **Refactor:** Consolidate PII redaction transforms to reuse macros (avoid duplicating rules).
  - Files: `ops/vector/vector.toml`, `tools/vector/macros.vrl` (new)
  - Dependencies: Vector VRL includes
  - Satisfies: DEV-PRD-005, DEV-SDS-005
- [ ] **Regression:** Execute `just test:logs` and `tests/ops/test_vector_logfire.sh`.
  - Dependencies: Vector runtime, OpenObserve stub
  - Satisfies: DEV-PRD-018, DEV-SDS-018

### Cycle 3B — Documentation Synchronisation

- [ ] **Red:** Add failing markdown lint checks expecting Logfire sections in docs.
  - Files: `tools/docs/lint_config.json`, `docs/observability/README.md` (placeholder comment)
  - Dependencies: `markdownlint`, doc lint pipeline
  - Satisfies: DEV-PRD-007, DEV-SDS-006
- [ ] **Green:** Document Logfire workflows across developer guides.
  - Files: `docs/observability/README.md`, `docs/ENVIRONMENT.md`, `templates/{{project_slug}}/docs/observability/logging.md.j2`
  - Dependencies: Markdown standards, template sync
  - Satisfies: DEV-PRD-018, DEV-SDS-018
- [ ] **Refactor:** Extract shared snippets into `.github/instructions/logging.instructions.md` for reuse across personas.
  - Files: `.github/instructions/logging.instructions.md`, `.github/copilot-instructions.md`
  - Dependencies: Instruction stacking guidelines
  - Satisfies: DEV-PRD-002, DEV-SDS-002
- [ ] **Regression:** Run `just docs:lint` and `just test-generation` to ensure templates inherit documentation updates.
  - Dependencies: Markdown lint toolchain, Copier
  - Satisfies: DEV-PRD-007, DEV-SDS-006

### Cycle 3C — Workflow Observability

- [ ] **Red:** Create failing telemetry expectations for new Logfire metrics ingestion (e.g., `tests/observability/test_logfire_metrics.py`).
  - Files: `tests/observability/test_logfire_metrics.py`
  - Dependencies: Telemetry fixtures, redb temporal DB
  - Satisfies: DEV-PRD-019, DEV-SDS-017
- [ ] **Green:** Extend observability pipeline to ship Logfire span metrics into existing dashboards.
  - Files: `docs/observability/dashboards/logfire.json`, `ops/vector/vector.toml` (metrics sink)
  - Dependencies: OpenObserve dashboards, Vector metrics config
  - Satisfies: DEV-PRD-018, DEV-SDS-018
- [ ] **Refactor:** Align metrics naming with existing telemetry taxonomy (e.g., `logfire.span.duration`).
  - Files: `docs/observability/dashboards/logfire.json`, `tools/observability/schema.json`
  - Dependencies: Observability schema definitions
  - Satisfies: DEV-PRD-010, DEV-SDS-009
- [ ] **Regression:** Run `just observe-verify` and confirm dashboards load via API snapshot tests.
  - Dependencies: OpenObserve token, Devbox
  - Satisfies: DEV-PRD-018, DEV-SDS-018

## [ ] Phase 4 — Migration & Enforcement

> Concurrency: Cycles 4A–4B require Phase 3 completions but can run in parallel.

### Cycle 4A — Runtime Migration

- [ ] **Red:** Introduce failing lint rules flagging `structlog` imports.
  - Files: `pyproject.toml` (ruff config), `.ruff.toml`
  - Dependencies: Ruff linting
  - Satisfies: DEV-PRD-007, DEV-SDS-006
- [ ] **Green:** Replace remaining `structlog` usages with Logfire helpers across template and runtime code.
  - Files: `libs/python/vibepro_logging.py`, `tools/logging/structlog-quickstart.py` (deprecate/rename), `templates/{{project_slug}}/apps/**`
  - Dependencies: Existing logging wrappers
  - Satisfies: DEV-PRD-018, DEV-SDS-018
- [ ] **Refactor:** Remove obsolete structlog assets and update reference docs/CHANGELOG.
  - Files: `CHANGELOG.md`, `docs/work-summaries/structured-logging-implementation.md`, delete `tools/_logging_bak/structlog-quickstart.py`
  - Dependencies: Git history for archival
  - Satisfies: DEV-PRD-007, DEV-SDS-006
- [ ] **Regression:** Run `just lint` and `just test:logs` to ensure no structlog references remain.
  - Dependencies: Repo-wide lint/test workflows
  - Satisfies: DEV-PRD-018, DEV-SDS-018

### Cycle 4B — Generator & Spec Enforcement

- [ ] **Red:** Add failing generator tests verifying new services invoke Logfire bootstrap.
  - Files: `tools/generators/domain/index.spec.ts`, `tests/generators/domain/logfire.spec.ts`
  - Dependencies: Nx generator testing harness
  - Satisfies: DEV-PRD-021, DEV-SDS-021
- [ ] **Green:** Update generator templates to call `bootstrap_logfire` and scaffold OTEL env vars.
  - Files: `tools/generators/domain/files/python/api/main.py__tmpl__`, `templates/{{project_slug}}/libs/python/vibepro_logging.py.j2`
  - Dependencies: Nx generator devkit, Jinja templates
  - Satisfies: DEV-PRD-018, DEV-SDS-018
- [ ] **Refactor:** Deduplicate template logic by sharing partials for instrumentation imports.
  - Files: `tools/generators/domain/files/_partials/logfire_import.py__tmpl__`, `tools/generators/domain/index.ts`
  - Dependencies: Generator partial include system
  - Satisfies: DEV-PRD-006, DEV-SDS-002
- [ ] **Regression:** Run `nx affected:test --targets=test --projects domain` and `just test-generation` to confirm generator outputs.
  - Dependencies: Nx CLI, Devbox runtime
  - Satisfies: DEV-PRD-021, DEV-SDS-021
