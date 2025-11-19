# OBSERVABILITY ADRs

<!-- matrix_ids: [] -->

## DEV-ADR-016 — Adopt Rust‑Native Observability Pipeline (tracing → Vector → OpenObserve)

Status: Proposed → Active (feature‑flagged)

Context
VibePro's execution model is moving toward deterministic, AI‑ready telemetry. Current logging is largely unstructured, preventing reliable correlation and automated analysis. A Rust‑native stack (tracing → Vector → OpenObserve) provides structured OTLP telemetry with low runtime overhead and avoids container‑side agents.

Decision
Implement an opt‑in observability subsystem composed of:

- tracing + tracing‑opentelemetry for in‑process spans, metrics, and structured logs
- Vector as the host‑level collector/transformer
- OpenObserve as the unified long‑term store

Enable via the environment flag: VIBEPRO_OBSERVE=1

Rationale

- Low overhead: Rust async tracing with minimal allocations
- Standardized telemetry (OTLP) compatible with AIOps tools
- Enables AI‑driven RCA and anomaly detection with context‑rich spans
- Removes dependency on container agents (Vector runs as a host binary)

Consequences

| Area          | Positive                                    | Trade‑off                                            |
| ------------- | ------------------------------------------- | ---------------------------------------------------- |
| Performance   | <1% CPU overhead at ~1k spans/s             | Slight binary size growth                            |
| Developer DX  | Unified API for logs/traces                 | New crate dependency (crates/vibepro-observe)        |
| Ops           | Simplified deploy; fewer moving parts       | Requires Vector rollout policy & binary distribution |
| AI Enablement | Historical OTLP data for feature extraction | Must govern PII fields before ingestion              |

Adoption phases

1. **Phase 1 (Prototype):** Basic tracing integration in `vibepro-observe` crate; Vector + OpenObserve setup in dev environment only
2. **Phase 2 (Alpha):** Expand to Node/Python services; add PII redaction transforms; limited production rollout (10% traffic)
3. **Phase 3 (GA):** Full production rollout; mandatory for new services; observability PRD/SDS required

Related

- DEV-PRD-017 — Observability Integration Story (create before Phase 3 implementation)
- docs/dev_tdd_observability.md (v1)

- DEV-SDS-017 — Observability Design Spec (create before Phase 2 implementation)
- Traceability: Phase 1 prototypes may proceed without specs; Phases 2+ must reference DEV-SDS-017 and DEV-PRD-017 in commits

Notes

- Ensure PII/PII‑like fields are redacted or filtered before export.
- Add automated CI checks for vector config validation and a small benchmark to detect regressions.
- Document rollout plan for operators (Vector binary distribution, upgrades, and monitoring).

## DEV-ADR-017 — JSON-First Structured Logging with Trace Correlation

Status: Active

Context
VibePro's current logging approach is inconsistent across languages (Rust, Node, Python) with mixed formats (printf-style, JSON, unstructured). This prevents reliable log-trace correlation, PII governance, and cost-effective retention strategies. The existing observability pipeline (DEV-ADR-016) provides the transport layer but needs logging conventions.

Decision
Implement structured, JSON-first logging with mandatory trace correlation across all languages:

- **Format:** JSON only (machine-first) for all application logs
- **Correlation:** Every log line carries `trace_id`, `span_id`, `service`, `env`, `version`
- **PII Protection:** Never emit raw PII from app code; mandatory redaction in Vector
- **Levels:** `error`, `warn`, `info`, `debug` (no `trace` level—use tracing spans)
- **Categories:** `app` (default), `audit`, `security` via dedicated field
- **Transport:** stdout/stderr locally; OTLP to Vector when `VIBEPRO_OBSERVE=1`
- **Retention:** 14-30 days for logs (shorter than traces)

Language-specific implementations:

- **Rust:** Continue using `tracing` events (already in place via `vibepro-observe`)
- **Node:** `pino` with custom formatters for trace context injection
- **Python:** Replace `structlog` with the Logfire SDK (OpenTelemetry emitter) to auto-instrument FastAPI requests, outbound HTTP clients, and Pydantic validation while emitting the shared JSON schema

Rationale

- **Consistency:** Same log schema regardless of language/runtime
- **Correlation:** Enables log ↔ trace navigation in OpenObserve
- **Python Fidelity:** Logfire surfaces FastAPI spans, Pydantic validation errors, and LLM context with minimal, standardized instrumentation setup such as calling logfire.instrument_fastapi()
- **Cost Control:** Sampling/redaction at Vector edge; shorter retention than traces
- **PII Safety:** Centralized redaction rules prevent accidental exposure
- **Query Performance:** JSON structure enables fast field indexing

Consequences

| Area         | Positive                                                        | Trade–off                                           |
| ------------ | --------------------------------------------------------------- | --------------------------------------------------- |
| Developer DX | Unified logging/tracing API across languages; Python auto-spans | Learn Logfire workflows and manage OTEL env vars    |
| Debugging    | Fast correlation between logs, spans, and Pydantic context      | Must replace legacy structlog wrappers with Logfire |
| Security     | PII redaction enforced at infrastructure layer                  | Vector config complexity                            |
| Cost         | Lower retention costs; efficient queries                        | Initial setup overhead                              |
| Operations   | Consistent log schema for alerting/dashboards                   | Requires Vector transforms validation               |

Implementation Requirements

1. Add Vector OTLP logs source and PII redaction transforms to `ops/vector/vector.toml`
    - **DRI:** Infrastructure Team
    - **Timeline:** Week 1 (2025-11-01 to 2025-11-07)
    - **Phase-exit criteria:** Vector config updated and validated in CI
2. Create `libs/node-logging/logger.ts` with pino wrapper
    - **DRI:** Frontend Platform Team
    - **Timeline:** Week 1-2 (2025-11-01 to 2025-11-14)
    - **Phase-exit criteria:** Logger package published and tests passing
3. Refactor `libs/python/vibepro_logging.py` into a Logfire bootstrap that instruments FastAPI, requests, and async clients
    - **DRI:** Backend Platform Team
    - **Timeline:** Week 2-3 (2025-11-08 to 2025-11-21)
    - **Phase-exit criteria:** Logfire SDK installed, FastAPI instrumentation validated, and smoke test passes in staging

4. Install and configure Logfire SDK in `pyproject.toml`, including default OTEL environment variable templates
    - **DRI:** Backend Platform Team
    - **Timeline:** Week 2 (2025-11-08 to 2025-11-14)
    - **Phase-exit criteria:** All Python services can import and configure Logfire without errors

5. Document logging and tracing policy in `docs/ENVIRONMENT.md` and `docs/observability/README.md`
    - **DRI:** Documentation Team
    - **Timeline:** Week 3-4 (2025-11-15 to 2025-11-28)
    - **Phase-exit criteria:** Documentation reviewed and approved by technical leads

6. Add TDD tests: Vector config validation, PII redaction, trace correlation, Logfire smoke test
    - **DRI:** QA Team
    - **Timeline:** Week 4-5 (2025-11-22 to 2025-12-05)
    - **Phase-exit criteria:** All tests passing in CI with >90% code coverage

Related Specs

- DEV-ADR-016 — Rust-Native Observability Pipeline (foundation)
- DEV-PRD-018 — Structured Logging Product Requirements (Logfire upgrade)
- DEV-SDS-018 — Structured Logging Design Specification (Logfire upgrade)
- DEV-SPEC-009 — Logging Policy & Examples (documentation)

Migration Strategy

- Phase 1: Introduce Logfire alongside existing structlog wrapper behind a compatibility facade; update examples and smoke tests.
- Phase 2: Cut Python services over to Logfire instrumentation (FastAPI, requests, Pydantic) and deprecate structlog usage.
- Phase 3: Remove structlog dependency, enforce Logfire bootstrap in generators, and lint for legacy imports.
    - Note: Completed during TDD Phase 4 — `pyproject.toml` now depends solely on `logfire`.

Validation

- All logs must include: `trace_id`, `span_id`, `service`, `environment`, `application_version`
- PII fields (email, authorization, tokens) automatically redacted by Vector
- Tests validate: config correctness, redaction behavior, correlation fields, and Logfire span validation deferred to DEV-TDD cycle 2A

---
