# Logfire Cycle 2A — Corrected and Updated Implementation Plan

**Status:** Ready for Execution
**Revision Date:** November 3 2025
**Aligned With:** logfire_cycle2a_plan_analysys.md recommendations

---

## 1. Objectives and Context

Cycle 2A finalizes Logfire’s Python instrumentation across the VibesPro template repository, ensuring:

-   Full compliance with specs DEV-PRD-018 / DEV-SDS-018 / DEV-PRD-023 / DEV-PRD-021
-   Deterministic, isolated, network-free testing
-   Clean documentation closure and traceability
-   Complete regression and rollback strategy

Key adjustments:

-   Replaced CLI-embedded tests with proper pytest modules
-   Added `_reset_logfire_state()` utility to manage singleton cache
-   Defined Cycle C, regression, risk, and sign-off sections
-   Replaced external network tests with mocked deterministic fixtures

---

## 2. Specification Alignment

| Spec                      | Title                       | Focus                                                       | Implementation in Plan       |
| ------------------------- | --------------------------- | ----------------------------------------------------------- | ---------------------------- |
| DEV-PRD-018               | Structured Logging          | Core verification, metadata                                 | Cycles A + B                 |
| DEV-SDS-018               | Trace Correlation           | Integration toggles (requests, sqlalchemy, httpx, pydantic) | Cycles A + B                 |
| DEV-PRD-020 / DEV-SDS-022 | Metadata / OTEL Env Binding | Default metadata verification                               | Cycle A                      |
| DEV-PRD-021               | Documentation Sync          | Docs/template updates, docs-lint validation                 | Cycle C                      |
| DEV-PRD-023               | Regression Testing          | Deterministic pytest + CI validation                        | Cycle B + Regression Section |

---

## 3. Repository Updates Summary

| Category        | Change                                                 | Why                      |
| --------------- | ------------------------------------------------------ | ------------------------ |
| Core Helpers    | Add `_reset_logfire_state()`                           | Ensure test isolation    |
| Testing         | New `tests/python/test_logfire_config.py`              | Proper RED → GREEN TDD   |
| Instrumentation | Deterministic integration tests using MockTransport    | Remove network flakiness |
| Docs            | Add explicit commands for lint + traceability          | Required by DEV-PRD-021  |
| Regression      | Enumerate all validation commands                      | Mandated by DEV-PRD-023  |
| Risk            | Define rollback flow (disable toggles + revert branch) | Audit completeness       |

---

## 4. Cycles Overview (MECE)

### Cycle A — Configuration & Core Verification

**Owner:** Agent A **Branch:** `feature/logfire-cycle2a-foundations-agent-a`

#### A.1 RED Phase

Create failing tests under `tests/python/test_logfire_config.py`:

1. Missing `LOGFIRE_TOKEN` → graceful offline mode
2. Invalid service names (empty/None) → default fallback
3. Metadata completeness (`service`, `environment`, `application_version`)
4. Instrumentation toggles (`LOGFIRE_INSTRUMENT_REQUESTS/PYDANTIC`) on/off behavior

Each test must begin with:

```python
from libs.python.vibepro_logging import _reset_logfire_state
_reset_logfire_state()
```

#### A.2 GREEN Phase

Implement fixes in `libs/python/vibepro_logging.py`:

-   `_reset_logfire_state()` clears cached instance
-   Sanitize service names, enforce precedence (arg > env > default)
-   Ensure graceful `send_to_logfire="if-token-present"`
-   Validate toggles for requests/pydantic instrumentation

#### A.3 Verification & Regression

-   Run full suite (`pytest`, `just ai-validate`)
-   Commit message includes spec IDs DEV-PRD-018 / DEV-SDS-018 / DEV-PRD-020 / DEV-SDS-022
-   Label → A-GREEN

---

### Cycle B — Integration & Regression Validation

**Owner:** Agent B **Branch:** `feature/logfire-cycle2a-testing-agent-b`

#### B.1 RED Phase

Add deterministic tests (no external calls) in `tests/python/test_logfire_bootstrap.py`:

-   SQLAlchemy (in-memory engine)
-   httpx (MockTransport)
-   requests (mocked adapter)
-   pydantic_ai instrumentation toggle tests

#### B.2 GREEN Phase

Implement mocks, assert span attributes, update Vector OTLP metadata validation script.

#### B.3 Regression Checklist

```bash
pytest tests/python -v
bash tests/ops/test_vector_logfire.sh
just test-logs
just ai-validate
just docs-lint
```

Label → B-GREEN

---

### Cycle C — Documentation & Traceability Completion

**Owner:** Agent C **Branch:** `feature/logfire-cycle2a-docs-agent-c`

1. Update docs and templates, remove TODOs
2. Run `just docs-lint`, `just spec-guard`
3. Update traceability matrix and mark completion
   Label → C-GREEN

---

## 5. Regression Safeguards

| Category           | Command                                 | Purpose                            |
| ------------------ | --------------------------------------- | ---------------------------------- |
| Python Tests       | `pytest tests/python`                   | Unit + integration coverage        |
| Ops Tests          | `bash tests/ops/test_vector_logfire.sh` | Vector metadata capture validation |
| Docs Validation    | `just docs-lint` / `just spec-guard`    | Ensure docs + traceability aligned |
| Comprehensive CI   | `just ai-validate`                      | Lint + typecheck + test bundle     |
| Logging Regression | `just test-logs`                        | End-to-end observability suite     |

---

## 6. Risk & Rollback

| Risk                              | Trigger                          | Mitigation / Rollback                                                   |
| --------------------------------- | -------------------------------- | ----------------------------------------------------------------------- |
| Logfire update breaks integration | CI failures                      | Pin version, re-run validation                                          |
| Vector transform regression       | Metadata assertions fail         | Revert to previous config                                               |
| Docs desync                       | `just docs-lint` warnings        | Re-run sync + fix references                                            |
| Flaky tests                       | MockTransport or disable toggles | Stabilize tests: increase timeouts, add retries, or isolate flaky cases |
| Global state leakage              | `_reset_logfire_state()` fixture | Ensure fixtures clean state between tests; add explicit teardown        |

Rollback: revert to last A/B/C-GREEN merge and disable instrumentation temporarily.

---

## 7. Deliverables & Sign-Off

| Deliverable            | Evidence Required       | Verified By  |
| ---------------------- | ----------------------- | ------------ |
| Tests passing in CI    | `just ai-validate` logs | CI bot       |
| Docs complete          | `just docs-lint`        | Agent C      |
| Traceability updated   | Updated matrix          | Quality Lead |
| Regression suite green | `just test-logs`        | Agents A + B |
| Risk log reviewed      | Section 6               | Team Lead    |

---

## 8. Validation Checklist

-   [x] `_reset_logfire_state()` implemented
-   [x] Deterministic pytest modules replace CLI tests
-   [x] Integration tests cover all frameworks
-   [x] Docs sync + lint tasks defined
-   [x] Regression suite enumerated
-   [x] Risk + rollback documented
-   [x] Traceability matrix complete

---

## 9. Implementation Roadmap

| Phase                             | Duration | Deliverables |
| --------------------------------- | -------- | ------------ |
| Critical (TDD refactor + helper)  | 1 day    | Cycle A      |
| Integration fixtures + regression | 1 day    | Cycle B      |
| Documentation + traceability      | 0.5 day  | Cycle C      |
| Validation & Sign-off             | 0.5 day  | Final merge  |

---

## 10. Summary

This revision creates a fully executable, audit-ready TDD plan integrating deterministic testing, doc closure, regression and rollback safeguards. It aligns all Cycles A–C for compliance with DEV-PRD-018/021/023 and ensures reproducible, isolated validation across CI.
