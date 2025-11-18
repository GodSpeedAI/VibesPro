# OBSERVABILITY PRDs

<!-- matrix_ids: [] -->

## DEV-PRD-017 — Observability & AI-Assisted Diagnostics Enablement

-   Description: As a developer and operations engineer, I want a native, structured observability layer that exposes unified logs, traces, and metrics so that both humans and AI systems can perform real-time and historical diagnostics with minimal latency and zero container overhead.
-   EARS: Provide host-native ingestion, transformation, and export of OTLP traces/logs to OpenObserve with validation and CI checks.
-   DX Metrics: End-to-end trace latency (p95) < 250 ms; Vector config validation success 100%; OTLP data loss < 0.1%.

### EARS (Event → Action → Response)

| Event                                                    | Action                                                                          | Response                                                       |
| -------------------------------------------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Application emits tracing spans or structured log events | Data passes through Rust tracing layer, exported via OTLP to local Vector agent | Data validated & transformed; compliant OTLP payload emitted   |
| Vector agent receives OTLP data                          | Applies sampling, redaction, enrichment via VRL                                 | Transformed stream routed to OpenObserve sink                  |
| Vector fails validation or connection                    | just observe-verify or CI detects invalid config                                | Developer alerted via failing test and descriptive error       |
| Developer queries OpenObserve                            | Unified metrics/logs/traces rendered with millisecond latency                   | Dashboards and API endpoints become queryable for AI pipelines |

### Goals

-   Unified Telemetry Stream: Logs, metrics, and traces emitted as structured, queryable data.
-   AI-Assisted Readiness: Telemetry schema + retention policy support future AI correlation engines (clustering, anomaly detection).
-   Zero Container Overhead: Use host-native Vector binary for ingestion/transformation.
-   Secure by Design: All OTLP connections authenticated via SOPS-managed credentials.
-   Observability-as-Code: Configuration stored in ops/vector/vector.toml, validated in CI.

### Non-Goals

-   Build full APM UX (use OpenObserve UI).
-   Vendor lock-in to external SaaS — remain self-hosted, Rust-native.
-   Immediate replacement of all language error logging (initial scope: Rust services).

### User Stories

| ID        | Story                                                                                                          | Acceptance Criteria                                                    |
| --------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| PRD-017-A | As a developer, I can run `just observe-start` to launch the Vector agent and see it accept OTLP data locally. | Vector starts and logs listening on 0.0.0.0:4317.                      |
| PRD-017-B | As a maintainer, I can run `just observe-verify` to validate configuration end-to-end.                         | Command prints “✅ Trace ingested into OpenObserve.”                   |
| PRD-017-C | As an AI researcher, I can query historical traces via OpenObserve’s SQL endpoint to build datasets.           | SQL query returns expected span IDs, durations, and contextual fields. |
| PRD-017-D | As an SRE, I can adjust sampling/redaction rules in `vector.toml` and see effects within one minute.           | Modified rules visible in Vector logs and verified by test ingestion.  |

### DX & Operational Metrics

| Metric                           |                        Target | Measurement                       |
| -------------------------------- | ----------------------------: | --------------------------------- |
| Vector config validation success |                          100% | `vector validate` step in CI      |
| Span ingestion latency (p95)     |                      < 250 ms | End-to-end test trace             |
| OTLP data loss                   |                        < 0.1% | Error counter in Vector logs      |
| Sampling ratio accuracy          |                           ±5% | Compare raw vs stored span counts |
| Redaction coverage               | 100% of configured PII fields | Regex audit on test dataset       |

### Dependencies

-   DEV-ADR-016 — Adoption of Rust-Native Observability Stack
-   DEV-SDS-017 — System design for tracing, Vector, OpenObserve
-   docs/ENVIRONMENT.md §8 — Activation, env vars, Just commands
-   .secrets.env.sops — SOPS-managed OTLP/OpenObserve credentials
-   Justfile tasks: `observe-start`, `observe-verify`, `observe-test`

### Acceptance Tests

-   tests/ops/test_vector_config.sh — `vector validate` returns 0.
-   tests/ops/test_tracing_vector.sh — confirms span transmission.
-   tests/ops/test_openobserve_sink.sh — verifies ingestion with auth.
-   tests/ops/test_observe_flag.sh — ensures flag-based activation works.
-   CI logs contain “Vector config valid” and “✅ Trace ingested”.

### Success Criteria

-   All tests green locally and in CI.
-   Observability layer adds < 3% CPU overhead under load.
-   OpenObserve dashboard shows live traces from staging.
-   Documentation (PRD, SDS, ADR, ENVIRONMENT) complete and linked.
-   AI correlation PoC (span anomaly detection) reads from OpenObserve within one sprint post-launch.

### Supported By

-   DEV-SDS-017 — Rust-Native Observability Pipeline
-   DEV-ADR-016 — Architecture Decision Record
-   docs/dev_tdd_observability.md — Implementation plan & phase checklist
-   docs/observability/README.md — Developer enablement guide

## DEV-PRD-018 — Structured Logging with Trace Correlation

> **Status: Python implementation planned for DEV-TDD cycle 2A. Code examples are design targets, not working implementations.**

-   Description: As a developer, I want consistent, JSON-formatted structured logging across all languages (Rust, Node, Python) with automatic trace correlation and planned zero-effort distributed tracing for Python services (DEV-TDD cycle 2A) so that I can debug issues efficiently and comply with PII protection requirements.
-   EARS: When application code emits logs, the system shall automatically enrich them with trace context (`trace_id`, `span_id`, `service`, `environment`, `version`) and apply PII redaction rules before storage. When a Python FastAPI request is handled, the instrumentation will create a root span and propagate the trace context through downstream calls and logs.
-   DX Metrics: Log-trace correlation success rate > 95%; PII exposure incidents = 0; query performance improvement > 50% vs unstructured logs; Python trace coverage ≥ 95% of FastAPI endpoints.

### EARS (Event → Action → Response)

| Event                               | Action                                                                                              | Response                                             |
| ----------------------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Application emits a log line        | Logger wraps log in JSON with mandatory fields (trace_id, span_id, service, env, version, category) | Structured JSON emitted to stdout                    |
| Vector receives JSON log            | Applies PII redaction transform (email, authorization headers) and enrichment                       | Clean, enriched log forwarded to OpenObserve         |
| Developer queries logs for trace_id | OpenObserve search filters logs by trace_id                                                         | All correlated logs + spans returned in unified view |
| Developer accidentally logs PII     | Vector redaction transform catches configured patterns                                              | PII replaced with [REDACTED] before storage          |
| Python FastAPI request received     | Logfire instrumentation will open a root span, bind Pydantic context, and emit correlated logs      | Unified trace + log timeline visible in OpenObserve  |
| Log retention policy expires        | OpenObserve automatically purges logs older than configured days (14-30)                            | Storage costs reduced; compliance maintained         |

### Goals

-   **Unified Format:** JSON-only across Rust, Node, Python—no printf-style logs
-   **Trace Correlation:** Every log carries trace context for seamless navigation
-   **PII Protection:** Centralized redaction in Vector prevents accidental exposure
-   **Cost Control:** Shorter retention than traces; efficient indexing
-   **Query Performance:** Structured fields enable fast filtering and aggregation

### Non-Goals

-   Replace existing tracing/spans (logs are events, not operations)
-   Support non-JSON formats (explicitly JSON-first)
-   Client-side log aggregation (Vector handles this)

### User Stories

| ID        | Story                                                                                             | Acceptance Criteria                                                                        |
| --------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| PRD-018-A | As a Node developer, I can use `logger.info()` and get JSON with trace context automatically.     | Log contains `trace_id`, `span_id`, `service`, `environment`, `application_version`.       |
| PRD-018-B | As a Python developer, I can use `log.info()` and get the same structured format.                 | Python logs will match Node/Rust schema exactly while being emitted through Logfire.       |
| PRD-018-C | As a security engineer, I can verify that PII is redacted before storage.                         | Test logs with emails/tokens show `[REDACTED]` in OpenObserve.                             |
| PRD-018-D | As an SRE, I can query logs by `trace_id` to find all related log lines.                          | Query returns 100% of logs for a given trace.                                              |
| PRD-018-E | As a developer, I can distinguish between app, audit, and security logs via the `category` field. | Logs tagged with `category=security` are routed to dedicated retention policy.             |
| PRD-018-F | As a Python service owner, I enable tracing once and see correlated spans for FastAPI routes.     | 95% of FastAPI endpoints will produce spans in OpenObserve without manual instrumentation. |

### DX & Operational Metrics

| Metric                 |            Target | Measurement                                       |
| ---------------------- | ----------------: | ------------------------------------------------- |
| Log-trace correlation  |             > 95% | Percentage of logs with valid trace_id/span_id    |
| PII exposure incidents |                 0 | Audit of stored logs for unredacted PII patterns  |
| Query performance      | > 50% improvement | Time to find logs by trace_id vs grep on raw logs |
| JSON parsing success   |             > 99% | Vector log parsing error rate                     |
| Schema compliance      |              100% | All logs contain mandatory fields                 |

### Log Schema (Mandatory Fields)

```json
{
    "timestamp": "2025-10-12T16:00:00.000Z",
    "level": "info",
    "message": "request accepted",
    "trace_id": "abc123def456...",
    "span_id": "789ghi...",
    "service": "user-api",
    "environment": "staging",
    "application_version": "v1.2.3",
    "category": "app",
    "...additional_fields": "..."
}
```

### Log Levels & Categories

**Levels:** `error`, `warn`, `info`, `debug` (no `trace` level—use tracing spans)

**Categories:**

-   `app` (default): Application behavior, business logic
-   `audit`: Compliance/audit trail (longer retention)
-   `security`: Security events (immediate alerting)

Categories use a dedicated field—not level—to enable separate routing and retention policies.

---
