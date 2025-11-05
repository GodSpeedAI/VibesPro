# Logfire Cycle 2A Plan Analysis

## 1. Executive Summary

-   Plan establishes branching rules and cross-agent coordination but leaves several core deliverables undefined.
-   Current text overstates gaps already resolved in `docs/dev_tdd.md` and omits regression safeguards mandated by DEV-PRD-018/DEV-SDS-018.
-   Multiple proposed TDD "RED" tests would pass immediately, breaking the TDD cycle and masking missing coverage around instrumentation toggles and global state reset.
-   Cycle C plus regression, risk, and sign-off sections remain placeholders; executing as-is would proceed without documentation closure or rollback strategy.
-   Recommendation: Apply the critical and high-priority patches below before implementation; status = **Needs Major Revision**, confidence = **Medium** pending clarified deliverables and deterministic test design.

## 2. Context Analysis

### 2.1 Relevant Specifications

1. **DEV-ADR-017 — JSON-First Structured Logging with Trace Correlation** (`docs/dev_adr.md` §DEV-ADR-017) mandates unified JSON schema, OTLP export via Vector, and Logfire for Python.
2. **DEV-PRD-018 — Structured Logging Product Requirements** (`docs/dev_prd.md` §Python Logfire SDK) requires FastAPI auto-spans, shared metadata (`service`, `environment`, `application_version`), and documentation completeness.
3. **DEV-SDS-018 — Structured Logging with Trace Correlation** (`docs/dev_sds.md` §3 Python Logfire instrumentation) defines `bootstrap_logfire`, optional integrations (`requests`, `httpx`, `sqlalchemy`), and OTLP variable usage.
4. **DEV-PRD-020 / DEV-SDS-022 — Metadata standardisation & OTEL environment binding** ensure default metadata helpers match deployment environment variables.
5. **DEV-PRD-023 — Regression Testing Requirements** asserts comprehensive regression guards (`just test-logs`, CLI smoke tests) for observability.
6. **Security instructions (precedence 10)** require retaining Vector redaction parity (`tools/vector/macros.vrl` per `.github/instructions/logging.instructions.md`).

### 2.2 Codebase Patterns

-   **Python helpers** (`libs/python/vibepro_logging.py`): exposes `configure_logger`, `bootstrap_logfire`, `instrument_integrations`; uses module-level `_LOGFIRE_INSTANCE` cache and `LogfireSettings` toggles.
-   **Testing approach**: pytest in `tests/python/`, shell smoke tests in `tests/ops/`, CLI smoke script `tools/logging/test_logfire.py` invoked via `just test-logs-logfire`.
-   **Global state reset**: No helper presently to reset `_LOGFIRE_INSTANCE`; tests must work around cached configuration.
-   **Documentation workflow**: Observability docs synchronize via `tools/docs/lint_check.py`, requiring specific Logfire sections (see `tools/docs/lint_config.json`).
-   **Environment toggles**: `libs/python/logging_settings.py` uses env vars `LOGFIRE_INSTRUMENT_REQUESTS`/`LOGFIRE_INSTRUMENT_PYDANTIC`; plan should validate both enabled and disabled paths.

### 2.3 External Research

-   Logfire officially configures via `logfire.configure()` followed by per-framework `instrument_*` calls; FastAPI instrumentation can exclude URLs or add request attribute mappers (`/pydantic/logfire`, FastAPI integration).
-   Client instrumentation (httpx/requests/sqlalchemy) supports both global and instance-specific instrumentation; tests should prefer deterministic transports (MockTransport) over live HTTP (`/pydantic/logfire` httpx/sqlalchemy docs).
-   Reconfiguration guidance recommends single configure call per process; tests need to isolate global state, aligning with our proposal for reset helpers.

## 3. Gap Analysis

### 3.1 Specification Alignment

1. **Traceability accuracy** — Plan accurately reflects Cycle 2A checkbox status and current documentation state. Tasks focus on validation and coverage enhancement rather than claiming implementation gaps (Severity: High; Spec: DEV-PRD-018/DEV-SDS-018). Text properly describes current status for auditability.
2. **Missing optional integration coverage** — `instrument_integrations` toggles for `requests` and `pydantic` are mandated by DEV-SDS-018 but absent from plan deliverables (Severity: Critical).
3. **No commitment to VRL documentation updates** — Logging instructions require `docs/observability/README.md` §8 and template snippets alignment; plan references TODO removal but lacks explicit tasks to rerun `just docs-lint` and validate `tools/docs/lint_check.py` constraints (Severity: High).

### 3.2 TDD Methodology

1. **Non-deterministic test design** — Current tests rely on real network/LoopBackTransport and SQLite real DBs which causes flakiness. Must replace with deterministic mocked HTTP transports (e.g., MockTransport or responses library) and convert SQLite usage to in-memory or mocked fixtures (Severity: Critical; violates TDD Constitution §2).
2. **Tests embedded in CLI script** — Using `tools/logging/test_logfire.py` as a test harness mixes CLI script responsibilities with unit tests, deviating from `tests/python/` conventions and complicating pytest execution (Severity: High).
3. **Global state contamination** — Repeated calls to `configure_logger` without resetting `_LOGFIRE_INSTANCE` will cause RED tests to pass due to previous configuration, invalidating cycle outcomes (Severity: High).

### 3.3 Completeness

1. **Cycle C undefined** — Entire documentation/traceability cycle is missing; sections 6–8 remain placeholders, so deliverables for DEV-PRD-021 are undefined (Severity: Critical).
2. **No rollback/risk assessment** — Sections 6–8 promise regression, risk, and sign-off content but remain empty, violating plan success criteria (Severity: High).
3. **Edge-case coverage gaps** — Plan omits tests for toggling instrumentation (`LOGFIRE_INSTRUMENT_REQUESTS/PYDANTIC`), failure to configure (`logfire.configure` exception), and `instrument_sqlalchemy` multi-engine scenario (Severity: High).

### 3.4 Technical Debt

1. **Global singleton reset** — Without a helper to reset `_LOGFIRE_INSTANCE`, tests must rely on process isolation; plan should add teardown/reset steps to prevent cross-test leakage (Severity: High).
2. **Network-dependent tests** — Proposed httpbin calls introduce flakiness and external dependency debt; prefer local MockTransport/responses fixtures (Severity: High).
3. **Docstring-driven fixes** — GREEN phase suggests docstring edits as implementation, yielding no functional change while tests still pass, leaving potential debt unresolved (Severity: Medium).

### 3.5 Codebase Integration

1. **Test location mismatch** — Introducing ad-hoc logic in `tools/logging/test_logfire.py` ignores existing pytest discovery rules and `pyproject.toml` exclusions (Severity: High).
2. **Lack of fixture reuse** — Plan ignores existing patterns for temporary env var manipulation; should use `monkeypatch` or context manager to align with repo practices (Severity: Medium).
3. **Doc sync automation** — Plan omits invoking `just docs-lint` and `bash tests/ops/test_vector_logfire.sh` after doc changes, risking pipeline regressions (Severity: Medium).

### 3.6 Verification

1. **No acceptance metrics** — Plan does not define measurable exit criteria for new integration tests (e.g., expected span attribute keys), weakening verification (Severity: High).
2. **Missing regression checklist** — Without enumerated commands (currently promised in Pass 6), teams lack proof that all observability safeguards were run (Severity: High).
3. **AI-agent usability** — Instructions reference MCP tooling but do not script context retrieval or memory updates beyond Cycle A; needs consistent prompts to avoid agent drift (Severity: Medium).

## 4. Improvement Opportunities

-   **Strategic**: Introduce `_reset_logfire_state()` utility for tests; expand coverage to SQLAlchemy multi-engine, httpx async client, and settings toggles; capture telemetry expectations (trace/log correlation) to satisfy DEV-PRD-023.
-   **Documentation architecture**: Provide single source of truth for Logfire documentation updates (docs + template + lint) with explicit command list; link spec IDs inline (e.g., `[DEV-PRD-018]`).

#### 4.1 Regression Guard (Patch 6)

**Required Commands and Timeline Steps**:

1. **Command**: `just test-logs`

    - **Expected Outcome**: All logging tests pass
    - **Timing**: Must complete successfully before any merge
    - **Failure Action**: Abort merge, investigate regression

2. **Command**: `uv run pytest tests/python/`

    - **Expected Outcome**: All Python tests pass with no failures
    - **Timing**: Required for every PR
    - **Failure Action**: High-priority issue, rollback to previous working state

3. **Command**: `just docs-lint`

    - **Expected Outcome**: Documentation validation passes, no broken links
    - **Timing**: Must complete before documentation merge
    - **Failure Action**: Fix documentation issues, re-run validation

4. **Command**: `just spec-guard`
    - **Expected Outcome**: All specifications validated and complete
    - **Timing**: Required for all cycles before merge
    - **Failure Action**: Address spec gaps, update traceability matrix

**Order**: Commands must execute in sequence (test-logs → pytest → docs-lint → spec-guard)
**Approval Gates**: All four commands must pass before PR approval
**Failure Escalation**: If any check fails, create high-priority issue with rollback plan

-   **Developer experience**: Supply pytest fixtures for env var patching and mock transports; add guidance for running tests offline; script MCP calls for external research to reduce manual steps.

## 5. Comprehensive Patch

### 5.1 Critical Patches

1. **Patch: Replace Cycle A RED tests with deterministic pytest module**

    - **Location**: Section “Cycle A — Foundations & Core Verification”, subsection A.2
    - **Reason**: Ensure RED phase introduces failing tests respecting TDD and repo conventions.
    - **Required Change**:

        ```markdown
        Replace the bullet list under **Test 1–4** with:

        -   [ ] **RED:** Create `tests/python/test_logfire_config.py` containing pytest tests for (a) empty service name fallback, (b) LOGFIRE_TOKEN absence, (c) metadata field coverage, and (d) instrumentation toggles. Each test should begin by calling a new helper `_reset_logfire_state()` to clear the singleton before assertions.
        ```

    - **Validation**: `pytest tests/python/test_logfire_config.py` should fail prior to GREEN implementations.

2. **Patch: Define `_reset_logfire_state()` helper and mandate use in tests**

    - **Location**: Section “Cycle A — Foundations & Core Verification”, subsection A.3
    - **Reason**: Prevent global state leakage across tests.
    - **Required Change**:

        ```markdown
        Add bullet:

        -   [ ] **Fix:** Implement `_reset_logfire_state()` in `libs/python/vibepro_logging.py` (module-private) and expose a pytest fixture that ensures the singleton is cleared before each test in `tests/python/test_logfire_config.py` and `tests/python/test_logfire_bootstrap.py`.
        ```

    - **Validation**: Confirm repeated pytest runs yield identical results without `--forked`.

3. **Patch: Build Cycle C and regression/risk sections**

    - **Location**: Entirety of Section 6–8 placeholders
    - **Reason**: Plan cannot proceed without defined documentation, regression, and risk strategies.
    - **Required Change**:

        ```markdown
        Replace “_Pass X will …_” placeholders with full content covering:

        -   Regression safeguards: enumerate `just test-logs`, `bash tests/ops/test_vector_logfire.sh`, `just docs-lint`, `just spec-guard`.
        -   Risk & rollback: identify failure modes (Vector transform regression, Logfire downtime) and rollback steps (revert to Cycle 1 branch, disable toggles).
        -   Deliverables & sign-off: specify doc updates (`docs/observability/README.md`, template files), traceability matrix entries, CI evidence required for completion.
        ```

    - **Validation**: Ensure checklist includes spec IDs DEV-PRD-021/DEV-PRD-023 and aligns with logging instructions.

4. **Patch: Add deterministic httpx/requests/sqlalchemy tests**

    - **Location**: Section “Cycle B — Testing & Validation”, subsections B.2/B.3
    - **Reason**: Replace flaky external calls with deterministic fixtures and expand coverage per DEV-SDS-018.
    - **Required Change**:

        ```markdown
        Update tests to:

        -   Use `httpx.MockTransport` and `responses` (or built-in mocking) to avoid network dependency.
        -   Instrument an in-memory SQLite engine via `logfire.instrument_sqlalchemy(engine=engine)` and assert span attributes (`db.system`, `db.statement`).
        -   Validate `instrument_integrations` toggles by setting `LOGFIRE_INSTRUMENT_REQUESTS=1` and confirming instrumentation executed.
        ```

    - **Validation**: `pytest tests/python/test_logfire_bootstrap.py -k instrumentation` fails before GREEN changes and passes after.

### 5.2 High-Priority Patches

1. **Correct specification status table**
    - fix statuses for DEV-PRD-018 etc to reflect actual doc state (Cycle 2A tasks already done) and note tasks focus on validation/coverage.
2. **Document doc-sync workflow**
    - add explicit tasks in Cycle C to update `docs/observability/README.md`, `templates/{{project_slug}}/docs/observability/logging.md.j2`, `docs/ENVIRONMENT.md`, and run `just docs-lint`.
3. **Include Vector lint guard**
    - emphasize rerunning `bash tests/ops/test_vector_logfire.sh` after doc and code changes.

### 5.3 Medium-Priority Enhancements (Cycle 2A Scope)

1. **Add AI-tooling script** — Provide reusable MCP prompt snippet so each cycle consistently records assumptions, research, and vibe check outcomes.
2. **Expand metadata tests** — Cover `application_version` override and absence to ensure alignment with DEV-PRD-020.
3. **Add multi-engine SQLAlchemy scenario** — Document optional stretch goal verifying instrumentation handles list of engines.
4. **Performance benchmarking** — Add optional step measuring `test-logs` runtime to ensure new tests stay performant (<2 min).
5. **Documentation diagrams** — For Cycle C, include sequence diagram of log pipeline for onboarding.
6. **Coverage reporting integration** — Optionally capture pytest coverage for new modules to monitor drift.
7. **Multi-engine SQLAlchemy scenario** — Document optional stretch goal verifying instrumentation handles list of engines.

### 5.4 Backlog Items (Post-Cycle 2A)

The following scope items are identified but should be deferred to future cycles due to complexity and dependency requirements:

1. **Fixture extraction refactoring** — Extract shared pytest fixtures (`logfire_exporter`) and reusing across modules (requires significant test restructuring).
2. **Legacy library instrumentation** — Add comprehensive coverage for additional libraries (e.g., `instrument_pydantic_ai`) beyond core DEV-SDS-018 requirements.
3. **Advanced Vector pipeline validation** — Implement comprehensive OTLP metadata validation against production Vector transforms.
4. **Global state management enhancements** — Complete refactor of `_LOGFIRE_INSTANCE` handling beyond basic reset functionality.
5. **External network integration testing** — Comprehensive validation against live external services (httpbin.org, live databases) for production readiness.
6. **Performance regression detection** — Automated alerting for test performance degradation across CI/CD pipeline.
7. **Documentation visualization suite** — Complete suite of sequence diagrams, architecture charts, and onboarding materials.
8. **Third-party library compatibility matrix** — Comprehensive validation against different versions of httpx, requests, SQLAlchemy, and other dependencies.
9. **Advanced security validation** — Integration testing for PII redaction compliance across all Logfire instrumentation paths.
10. **Production environment simulation** — End-to-end testing in production-like environments with real Vector and OpenObserve instances.

**Rationale for Backlog Classification:**

-   These items require additional research, testing infrastructure, or cross-team coordination
-   They exceed the current Cycle 2A scope while core DEV-PRD-018/DEV-SDS-018 requirements can be met without them
-   Many depend on completion of Critical Patches 1-4 before they can be safely implemented
-   They represent enhancements rather than core functionality gaps

### 5.4 Optional Improvements

1. **Introduce performance benchmark** — Add optional step measuring `test-logs` runtime to ensure new tests stay performant (<2 min).
2. **Add docs diagrams** — For Cycle C, include sequence diagram of log pipeline for onboarding.
3. **Integrate coverage reporting** — Optionally capture pytest coverage for new modules to monitor drift.

### 5.5 Phase-Specific Improvements

-   **GREEN**: Require addition of `_reset_logfire_state()` and deterministic fixtures before asserting PASS.
-   **RED**: Emphasize writing failing tests for toggles and singleton reset before code changes.
-   **REFACTOR**: Plan should include extracting shared pytest fixtures (`logfire_exporter`) and reusing across modules.
-   **REGRESSION**: Mandate consolidated checklist: `just test-logs`, `pytest tests/python`, `bash tests/ops/test_vector_logfire.sh`, `just ai-validate`, `just docs-lint`.

### 5.6 Revised Plan Structure

-   **Current Issues**: Incomplete sections, intermingled doc placeholders, and tests embedded in CLI scripts.
-   **Recommended Structure**:
    1. Context & Spec Mapping (complete)
    2. Cycle A — Configuration validation (pytest module + reset helper)
    3. Cycle B — Integration tests (deterministic fixtures) + Vector validation
    4. Cycle C — Documentation & traceability updates
    5. Regression Safeguards (explicit command list)
    6. Risk & Rollback
    7. Deliverables & Sign-off (evidence checklist)
-   **Rationale**: Mirrors DEV-TDD phases, separates documentation work, and surfaces regression gates early.

## 6. Validation Checklist

-   [ ] Spec tables reflect actual status and cite DEV-PRD-018/DEV-SDS-018 accurately.
-   [ ] `_reset_logfire_state()` helper implemented and used across tests.
-   [ ] New pytest module `tests/python/test_logfire_config.py` enforces metadata/toggle coverage.
-   [ ] Integration tests avoid network calls and validate span attributes deterministically.
-   [ ] Cycle C defines documentation updates with `just docs-lint` verification.
-   [ ] Regression suite enumerated and executed (`just test-logs`, `pytest tests/python`, `bash tests/ops/test_vector_logfire.sh`, `just ai-validate`).
-   [ ] Risk/rollback plan documented with clear triggers.
-   [ ] Traceability updates (`docs/traceability_matrix.md`, `docs/dev_spec_index.md`) included.

## 7. Implementation Roadmap

### 7.1 Patch Priority Order

1. Implement Critical Patch 1 (pytest RED tests) and Critical Patch 2 (state reset helper).
2. Flesh out Sections 6–8 (Critical Patch 3) before continuing cycles.
3. Revise Cycle B tests (Critical Patch 4) to deterministic fixtures.
4. Apply High-priority spec/doc-sync corrections.
5. Address medium enhancements (fixtures, multi-engine coverage).

### 7.2 Effort Estimates

-   Critical patches: 1.5–2 days (test refactor + doc completion).
-   High-priority patches: 0.5 day (spec tables, doc-sync tasks).
-   Medium enhancements: 0.5–1 day.
-   Optional improvements: timeboxed as capacity allows.

### 7.3 Dependencies

-   Critical Patch 1 depends on availability of `_reset_logfire_state()` (Patch 2).
-   Cycle C doc updates depend on Cycle B findings (span attribute documentation).
-   Regression checklist relies on updated tests to exist.

### 7.4 Risks

-   Network-free test refactor may require new fixtures; mitigate by using built-in MockTransport.
-   Updating documentation without rerunning `just docs-lint` risks CI failures; enforce in plan.
-   Singleton reset helper must avoid exposing API to generated projects; keep internal/private.

## 8. Recommended Next Steps

1. Update plan per Critical Patches 1–3 in a focused PR before coding begins.
2. Align spec table statuses with `docs/dev_tdd.md` and add missing Cycle C deliverables.
3. Draft deterministic pytest module and singleton reset helper proposal for review.

Also incorporate:

-   make `_reset_logfire_state()` accessible for tests and exposed via dedicated testing utility module
-   use existing fixtures (pytest plugins) to leverage for httpx/requests mocking to avoid adding new dependencies
-   require instrumentation coverage for additional libraries (e.g., `instrument_pydantic_ai`) in Cycle 2A scope
