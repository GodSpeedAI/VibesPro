# Developer Product Requirements Document (DX as the Product)

Audience: Developers as primary users
Scope: Development environment and workflows as product capabilities
Source: transcript.md and ideation synthesis

---

## DEV-PRD-001 — Native configuration-only prompt system

- Description: As a developer, I want to manage prompts/instructions/modes using only native VS Code and GitHub Copilot files so that I can start immediately without extra tools.
- EARS: When setting up a project, the system shall enable prompts and instructions via repository files without custom DSLs.
- DX Metrics: Onboarding < 15 min; zero non-native dependencies.
- Supported by: DEV-ADR-001, DEV-ADR-009

## DEV-PRD-002 — Modular instruction stacking

- Description: As a developer, I want modular instruction files I can stack per task so that I can tailor behavior quickly.
- EARS: Given a task, the system shall allow selecting and ordering instruction files.
- DX Metrics: Time to modify behavior < 5 min; diff size small and isolated.
- Supported by: DEV-ADR-002, DEV-ADR-006, DEV-ADR-007

## DEV-PRD-003 — Persona chat modes (8 roles)

- Description: As a developer, I want curated chat modes for key roles so that I can get phase-appropriate guidance without re-priming.
- EARS: When choosing a persona, the system shall load the corresponding chat mode with synergistic instruction overlays.
- DX Metrics: Context switching reduced (>20%); mode adoption >80% of interactions.
- Supported by: DEV-ADR-003, DEV-ADR-006

## DEV-PRD-004 — Task-based orchestration and A/B testing

- Description: As a developer, I want tasks to run prompts, inject context, and A/B test variants so that I can evaluate changes quickly.
- EARS: Given two variants, the system shall route inputs and collect token/latency metrics.
- DX Metrics: Variant switch < 1 min; results logged 100%.
- Supported by: DEV-ADR-004, DEV-ADR-010

## DEV-PRD-005 — Security posture by default

- Description: As a developer, I want safe defaults and workspace trust enforcement so that I can run prompts confidently.
- EARS: When opening the workspace, the system shall disable auto-approve and apply security instructions globally.
- DX Metrics: 0 insecure defaults; security checks pass rate > 95% pre-merge.
- Supported by: DEV-ADR-005

## DEV-PRD-006 — Context window optimization

- Description: As a developer, I want context ordering and pruning so that prompts remain within token budgets.
- EARS: Given configured locations, the system shall load files in a defined order and avoid redundant content.
- DX Metrics: Token overflows < 2%; average tokens per interaction reduced >15%.
- Supported by: DEV-ADR-006, DEV-ADR-010

## DEV-PRD-007 — Prompt-as-code lifecycle

- Description: As a developer, I want prompts to be versioned, linted, tested, and previewed so that changes are safe and reversible.
- EARS: When proposing a change, the system shall provide lint and a dry-run plan before apply.
- DX Metrics: Rollback MTTR < 5 min; regression defects reduced >25%.
- Supported by: DEV-ADR-007

## DEV-PRD-008 — CALM/Wasp/Nx integration

- Description: As a developer, I want architecture semantics validated over a single-source spec with reversible generators so that scaffolding stays consistent.
- EARS: Given a spec change, the system shall run CALM controls and regenerate services deterministically.
- DX Metrics: Control violations caught in CI 100%; generator determinism verified.
- Supported by: DEV-ADR-008

## DEV-PRD-009 — Declarative-first with escape hatches

- Description: As a developer, I want declarative defaults with optional task/script hooks so that I can do advanced flows without complexity by default.
- EARS: When needed, the system shall allow orchestration scripts without changing base configuration.
- DX Metrics: 80/20 split: 80% flows declarative; 20% advanced via tasks.
- Supported by: DEV-ADR-009

## DEV-PRD-010 — Evaluation hooks & budgets

- Description: As a developer, I want token/latency logging and optional content checks so that I can optimize quality and cost.
- EARS: When running prompts, the system shall log metrics and optionally run safety/quality checks.
- DX Metrics: 100% metric capture; monthly token cost variance <10%.
- Supported by: DEV-ADR-010, DEV-ADR-004

## DEV-PRD-011 — Reproducible OS toolchain via Devbox (Layer II)

Description: As a developer, I want a reproducible OS-level toolchain so that builds and scripts behave identically across machines.

EARS: When I enter the project using a standard command, the system shall provide OS utilities (e.g., git, curl, jq, make, ffmpeg, postgresql-client) without host installation steps.

DX Metrics: “First successful build” on a fresh machine ≤ 10 minutes; zero host package installs documented.

Supported by: DEV-ADR-011, DEV-SDS-010

## DEV-PRD-012 — Single runtime manager across languages via mise (Layer III)

Description: As a developer, I want one tool to pin/install all language runtimes (Node, Python, Rust) so that PATH/version drift is eliminated.

EARS: Given .mise.toml, the system shall install and activate exact versions for Node, Python, and Rust in interactive shells and CI.

DX Metrics: Version mismatch incidents → 0; “runtime install” step ≤ 2 minutes on cached environments.

Supported by: DEV-ADR-012, DEV-ADR-014, DEV-SDS-011

## DEV-PRD-013 — Secure, ephemeral secrets loading (Layer IV)

Description: As a developer, I want secrets to be stored encrypted in Git and only decrypted into process environment at runtime.

EARS: Given .secrets.env.sops, the system shall decrypt to environment for local shells; in CI, the system shall decrypt to a temporary file/env vars without persisting plaintext.

DX Metrics: Secrets in plaintext committed to VCS → 0; “rotate key and re-encrypt” ≤ 5 minutes.

Supported by: DEV-ADR-013, DEV-SDS-012

## DEV-PRD-014 — Tasks standardized via Just (Layer V)

Description: As a developer, I want all common actions available via just so that the app can be driven identically in local and CI environments.

EARS: When I run just <task>, the system shall execute within the provisioned environment (Devbox OS tools + mise runtimes + secrets already available).

DX Metrics: Top 10 tasks executable with a single command; median task startup ≤ 2s.

Supported by: DEV-ADR-011, DEV-ADR-012, DEV-SDS-013

## DEV-PRD-015 — Minimal CI without direnv

Description: As a release engineer, I want CI to run with the same versions and tools as local, without relying on direnv.

EARS: In CI, the system shall (a) load OS tools, (b) activate mise runtimes, and (c) decrypt SOPS secrets via CI key/KMS, then run just tasks.

DX Metrics: CI setup time ≤ 60s on warm cache; secret materialization only in job scope; 100% auditability of versions.

Supported by: DEV-ADR-011, DEV-ADR-012, DEV-ADR-013, DEV-SDS-014

## DEV-PRD-016 — Volta coexistence & deprecation guard (Node)

Description: As a developer, I want explicit behavior when both Volta and mise are present so that Node tool resolution is deterministic.

EARS: When Volta config exists, the system shall (a) prefer mise as authoritative, (b) verify Volta pins match mise, and (c) warn/fail on divergence.

DX Metrics: Divergent Node versions detected early (preflight) 100% of time; Volta removal completed within two minor releases.

Supported by: DEV-ADR-014, DEV-SDS-015

## DEV-PRD-017 — Observability & AI-Assisted Diagnostics Enablement

- Description: As a developer and operations engineer, I want a native, structured observability layer that exposes unified logs, traces, and metrics so that both humans and AI systems can perform real-time and historical diagnostics with minimal latency and zero container overhead.
- EARS: Provide host-native ingestion, transformation, and export of OTLP traces/logs to OpenObserve with validation and CI checks.
- DX Metrics: End-to-end trace latency (p95) < 250 ms; Vector config validation success 100%; OTLP data loss < 0.1%.

### EARS (Event → Action → Response)

| Event                                                    | Action                                                                          | Response                                                       |
| -------------------------------------------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Application emits tracing spans or structured log events | Data passes through Rust tracing layer, exported via OTLP to local Vector agent | Data validated & transformed; compliant OTLP payload emitted   |
| Vector agent receives OTLP data                          | Applies sampling, redaction, enrichment via VRL                                 | Transformed stream routed to OpenObserve sink                  |
| Vector fails validation or connection                    | just observe-verify or CI detects invalid config                                | Developer alerted via failing test and descriptive error       |
| Developer queries OpenObserve                            | Unified metrics/logs/traces rendered with millisecond latency                   | Dashboards and API endpoints become queryable for AI pipelines |

### Goals

- Unified Telemetry Stream: Logs, metrics, and traces emitted as structured, queryable data.
- AI-Assisted Readiness: Telemetry schema + retention policy support future AI correlation engines (clustering, anomaly detection).
- Zero Container Overhead: Use host-native Vector binary for ingestion/transformation.
- Secure by Design: All OTLP connections authenticated via SOPS-managed credentials.
- Observability-as-Code: Configuration stored in ops/vector/vector.toml, validated in CI.

### Non-Goals

- Build full APM UX (use OpenObserve UI).
- Vendor lock-in to external SaaS — remain self-hosted, Rust-native.
- Immediate replacement of all language error logging (initial scope: Rust services).

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

- DEV-ADR-016 — Adoption of Rust-Native Observability Stack
- DEV-SDS-017 — System design for tracing, Vector, OpenObserve
- docs/ENVIRONMENT.md §8 — Activation, env vars, Just commands
- .secrets.env.sops — SOPS-managed OTLP/OpenObserve credentials
- Justfile tasks: `observe-start`, `observe-verify`, `observe-test`

### Acceptance Tests

- tests/ops/test_vector_config.sh — `vector validate` returns 0.
- tests/ops/test_tracing_vector.sh — confirms span transmission.
- tests/ops/test_openobserve_sink.sh — verifies ingestion with auth.
- tests/ops/test_observe_flag.sh — ensures flag-based activation works.
- CI logs contain “Vector config valid” and “✅ Trace ingested”.

### Success Criteria

- All tests green locally and in CI.
- Observability layer adds < 3% CPU overhead under load.
- OpenObserve dashboard shows live traces from staging.
- Documentation (PRD, SDS, ADR, ENVIRONMENT) complete and linked.
- AI correlation PoC (span anomaly detection) reads from OpenObserve within one sprint post-launch.

### Supported By

- DEV-SDS-017 — Rust-Native Observability Pipeline
- DEV-ADR-016 — Architecture Decision Record
- docs/dev_tdd_observability.md — Implementation plan & phase checklist
- docs/observability/README.md — Developer enablement guide

## DEV-PRD-018 — Structured Logging with Trace Correlation

> **Status: Python implementation planned for DEV-TDD cycle 2A. Code examples are design targets, not working implementations.**

- Description: As a developer, I want consistent, JSON-formatted structured logging across all languages (Rust, Node, Python) with automatic trace correlation and planned zero-effort distributed tracing for Python services (DEV-TDD cycle 2A) so that I can debug issues efficiently and comply with PII protection requirements.
- EARS: When application code emits logs, the system shall automatically enrich them with trace context (`trace_id`, `span_id`, `service`, `environment`, `version`) and apply PII redaction rules before storage. When a Python FastAPI request is handled, the instrumentation will create a root span and propagate the trace context through downstream calls and logs.
- DX Metrics: Log-trace correlation success rate > 95%; PII exposure incidents = 0; query performance improvement > 50% vs unstructured logs; Python trace coverage ≥ 95% of FastAPI endpoints.

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

- **Unified Format:** JSON-only across Rust, Node, Python—no printf-style logs
- **Trace Correlation:** Every log carries trace context for seamless navigation
- **PII Protection:** Centralized redaction in Vector prevents accidental exposure
- **Cost Control:** Shorter retention than traces; efficient indexing
- **Query Performance:** Structured fields enable fast filtering and aggregation

### Non-Goals

- Replace existing tracing/spans (logs are events, not operations)
- Support non-JSON formats (explicitly JSON-first)
- Client-side log aggregation (Vector handles this)

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

- `app` (default): Application behavior, business logic
- `audit`: Compliance/audit trail (longer retention)
- `security`: Security events (immediate alerting)

Categories use a dedicated field—not level—to enable separate routing and retention policies.

### PII Redaction Rules (Vector)

Automatically redact these patterns:

- `user_email`, `email`: replaced with `[REDACTED]`
- `authorization`, `Authorization`: replaced with `[REDACTED]`
- `password`, `token`, `api_key`: replaced with `[REDACTED]`

Implemented via Vector VRL transforms before OpenObserve sink.

### Retention Policy

- **Logs:** 14-30 days (shorter than traces)
- **Traces:** 30-90 days (per DEV-PRD-017)
- **Audit logs:** 90 days minimum (compliance requirement)

Configured per OpenObserve stream/index.

### Language-Specific Implementations

**Rust (tracing):**

```rust
use tracing::{info, warn, error};
info!(category = "app", user_id_hash = "abc123", "request accepted");
warn!(category = "security", action = "auth_failure", "auth failed");
```

**Node (pino):**

```typescript
import { logger } from "@vibepro/node-logging/logger";
const log = logger();
log.info({ category: "app", user_id_hash: "abc123" }, "request accepted");
log.warn({ category: "security", action: "auth_failure" }, "auth failed");
```

**Python (Logfire SDK) - Design Target:**

```python
from fastapi import FastAPI
import logfire

app = FastAPI()
logfire.configure(service_name="user-api")
logfire.instrument_fastapi(app)      # automatic request spans

logger = logfire.logger
logger.info("request accepted", category="app", user_id_hash="abc123")
logger.warning("auth failed", category="security", action="auth_failure")
```

**Python OTLP Export Configuration - Design Target:**

```bash
export OTEL_EXPORTER_OTLP_ENDPOINT="http://localhost:4318"
export OTEL_EXPORTER_OTLP_PROTOCOL="http/protobuf"
export OTEL_SERVICE_NAME="user-api"
```

Set the endpoint to Vector (local) or OpenObserve directly, depending on environment. The Logfire SDK will respect standard OpenTelemetry variables, so no additional configuration files will be required to switch destinations.

**Note:** The Python Logfire bootstrap function (`libs/python/vibepro_logging.py`) is now implemented; see that module for configuration details. DEV-TDD cycle 2A will extend coverage where additional instrumentation is required.

Enable additional instrumentation (e.g., `requests`, `httpx`, SQL drivers) using Logfire's optional helpers where relevant to the service.

### Dependencies

- DEV-ADR-017 — JSON-First Structured Logging with Trace Correlation
- DEV-ADR-016 — Rust-Native Observability Pipeline (transport layer)
- DEV-SDS-018 — Structured Logging Design Specification (to be created)
- `ops/vector/vector.toml` — OTLP logs source and PII redaction transforms
- `libs/node-logging/logger.ts` — Node pino wrapper
- `libs/python/vibepro_logging.py` — Logfire bootstrap for Python services
- `pyproject.toml` — `logfire` dependency declaration aligned with structlog removal

### Acceptance Tests

- `tests/ops/test_vector_logs_config.sh` — Validates Vector logs source and transforms
- `tests/ops/test_log_redaction.sh` — Confirms PII redaction behavior
- `tests/ops/test_log_trace_correlation.sh` — Verifies trace context in logs
- `tools/logging/test_pino.js` — Quick validation of Node logger
- `tools/logging/test_logfire.py` — Quick validation of Python Logfire instrumentation

### Success Criteria

- All language-specific loggers emit identical JSON schema
- 100% of logs include trace context when `VIBEPRO_OBSERVE=1`
- ≥95% of FastAPI endpoints emit Logfire-generated spans without manual decorators
- PII redaction tests pass with 0 leaks
- Log query performance improves by > 50% vs unstructured logs
- Documentation complete in `docs/ENVIRONMENT.md` and `docs/observability/README.md`
- Logging tests green in CI

### Supported By

- DEV-SDS-018 — Structured Logging Design (to be created)
- DEV-ADR-017 — Architecture Decision
- docs/ENVIRONMENT.md §9 — Logging Policy (to be added)
- docs/observability/README.md §11 — Governance & Cost Controls (to be updated)

## DEV-PRD-019 — AI pattern intelligence & performance co-pilot

- Description: As a developer, I want the assistant to surface proven architecture patterns, performance insights, and curated context so that my next steps align with successful historical decisions.

### EARS (Event → Action → Response)

| Event                                        | Action                                                                             | Response                                                                                    |
| -------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Developer requests implementation guidance   | Temporal engine queries historical ADRs, pattern recognitions, and success metrics | Assistant returns recommended patterns with confidence %, linked artifacts, and rationale   |
| Performance regression detected in telemetry | PerformanceMonitor compares spans against baselines                                | Assistant surfaces advisory with suggested remediation (e.g., prune context, cache results) |
| Context bundle assembled for AI session      | AIContextManager scores sources using temporal success + confidence metadata       | Bundle includes high-value snippets while respecting token budget                           |
| Developer dismisses suggestion               | Feedback recorded in temporal DB                                                   | Confidence for similar future suggestions is reduced and rationale updated                  |

### Goals

- Provide proactive, high-confidence guidance that cites prior successful artifacts.
- Automate performance advisories using telemetry deltas and heuristics.
- Improve context relevance scores by incorporating historical usage success into bundling.
- Keep developers in flow by delivering recommendations directly in CLI/UI touchpoints.

### Non-Goals

- Building an entirely new UI; leverage existing CLI/chat surfaces for surfacing insights.
- Replacing human review of architectural changes; AI guidance remains assistive.
- Ingesting ungoverned production data; scope limited to project telemetry stored in redb.

### User Stories

| ID        | Story                                                                                                                   | Acceptance Criteria                                                                       |
| --------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| PRD-019-A | As a backend developer, I get pattern suggestions that reference successful service designs when I start a new module.  | Recommendation includes pattern name, originating ADR/commit, and ≥70% confidence.        |
| PRD-019-B | As a performance-focused engineer, I receive automated advisories when code generation exceeds baseline execution time. | Advisory highlights delta vs baseline, impacted spans, and suggested fix.                 |
| PRD-019-C | As a developer invoking `just ai-context-bundle`, I see context sources ranked by historical success.                   | Bundle output lists confidence weight per source and stays under configured token budget. |
| PRD-019-D | As a tech lead, I can audit why the assistant made a recommendation.                                                    | Every suggestion links to provenance metadata (tests, ADRs, commits).                     |
| PRD-019-E | As a developer, I can opt out of temporal data usage for sensitive tasks.                                               | Opt-out flag prevents that session's data from persisting and is logged for governance.   |

### Functional Requirements

- Temporal mining jobs run on a schedule (hourly/daily) and on-demand when major specs merge.
- Pattern recommendations store `pattern_id`, `confidence`, `source_artifacts`, and `last_success_timestamp`.
- Performance advisories trigger when spans exceed baseline by configurable percentage or percentile.
- AIContextManager scoring weights incorporate `confidence` and `success_rate` inputs with tunable coefficients.
- Recommendations surfaced through CLI (`just ai-advice`), VS Code task output, and chat responses include markdown summaries and quick actions.
- Feedback loop records developer acceptance/dismissal to adjust future confidence.

### Data & Telemetry Requirements

- All stored temporal data must honor retention policy (default 90 days) with anonymized identifiers.
- Governance layer enforces PII redaction before persistence and respects opt-out metadata.
- Metrics exported via OpenTelemetry include success rate, adoption rate, and advisory effectiveness.

### Dependencies

- DEV-ADR-018 — Temporal AI intelligence fabric for guidance & optimization
- DEV-SDS-021 — AI guidance fabric design (to be authored)
- DEV-SDS-022 — Performance heuristics design (to be authored)
- docs/dev_tdd_ai_guidance.md — TDD implementation roadmap
- temporal_db schema migrations (crates/temporal or equivalent) adding recommendation/advisory tables

### Acceptance Tests

- `tests/temporal/test_pattern_recommendations.py` — Validates clustering output structure and confidence scoring.
- `tests/perf/test_performance_advisories.spec.ts` — Ensures advisories trigger on baseline regressions and include remediation text.
- `tests/context/test_context_manager_scoring.spec.ts` — Verifies scoring weights and token budget compliance.
- `tests/cli/test_ai_advice_command.sh` — Exercises CLI surface for recommendations with mocked data.
- `tests/security/test_temporal_opt_out.py` — Confirms opt-out sessions bypass persistence and redact identifiers.
- `.github/workflows/ai-guidance.yml` — CI orchestrator running `nx run-many --target=test --projects temporal,performance,context` plus `just test-ai-guidance` wrapper.
- `tests/compliance/test_sword_rubric.md` — Markdown-based smoke checklist ensuring Safety, Workflow Observability, Reliability, and Developer experience (S.W.O.R.D) guardrails are acknowledged per release.

### Success Criteria

- ≥80% of surfaced suggestions cite prior successful artifacts and link to provenance.
- Performance advisories reduce repeat regressions for the same span by 25% over rolling 30 days.
- Context bundle relevance score (per existing evaluation hooks) improves by ≥15% without exceeding token budgets.
- Opt-out compliance rate = 100% (no persisted data when flag enabled).
- Developer satisfaction (post-experiment survey) improves by 1.0 point on a 5-point scale.
- CI workflow `ai-guidance.yml` remains green across merge queue with ≤2% flake rate, and S.W.O.R.D rubric sign-offs are captured in release notes.

### Supported By

- DEV-ADR-018 — Temporal AI intelligence fabric for guidance & optimization
- DEV-SDS-021/022 — Design specifications (to be authored)
- docs/dev_tdd_ai_guidance.md — TDD execution plan
- Existing evaluation hooks (DEV-SDS-009) for measuring suggestion effectiveness
- docs/dev_tdd_ai_guidance.md — CI workflow & S.W.O.R.D closure checklist

---

## Development environment requirements

- Editor: VS Code latest (workspace trust respected).
- Extensions: GitHub Copilot/Chat; optional linting/mermaid preview.
- OS: Windows/macOS/Linux; shell per team standard (PowerShell noted).
- Repo: .github/instructions, .github/prompts, .github/chatmodes, .vscode/settings.json, tasks.
- CI: Lint prompts, run token-budget checks, enforce security defaults.

## DX success metrics (global)

- Onboarding time ≤ 15 minutes with documented steps.
- Build/open project time ≤ 30 seconds to first productive action.
- Debugging round-trip ≤ 2 minutes for common flows.
- Prompt change cycle ≤ 10 minutes from edit → test → merge.

---

## DEV-PRD-020 — End-to-End Type Safety from Database to UI

- Description: As a developer, I want a single, unified type system that ensures data consistency from the PostgreSQL database schema through the FastAPI backend to the Next.js frontend so that I can prevent entire classes of bugs related to type mismatches.
- EARS: When I update the database schema, the system shall automatically generate and propagate corresponding TypeScript and Pydantic types, causing compile-time errors in any part of the application that is not compliant with the new schema.
- DX Metrics: Type-related runtime errors reduced by >90%; developer confidence in refactoring is high; zero manual synchronization of types between layers.
- Supported by: DEV-ADR-019, DEV-ADR-020, DEV-SDS-019, DEV-SDS-020

---

## DEV-PRD-021 — Automated Scaffolding of Type-Safe Modules

- Description: As a developer, I want to use a single Nx generator to scaffold new features or domains, including all necessary layers (domain, API, UI), so that I can create new modules quickly and consistently for the chosen frontend framework (Next.js, Remix, or Expo).
- EARS: When I run the domain generator, the system shall create a full set of libraries for the domain, pre-populated with:
  - A FastAPI backend API using `@nxlv/python`.
  - Type-safe Shadcn UI components using `@nx-extend/shadcn-ui`.
  - All layers connected to the unified type system.
- DX Metrics: Time to create a new, fully-wired CRUD module < 15 minutes; 100% consistency in folder structure and naming conventions across domains.
- Supported by: DEV-ADR-021, DEV-SDS-021, `copier.yml`

---

## DEV-PRD-023 — Decoupled and Testable Business Logic

- Description: As a developer, I want the core business logic to be completely independent of external frameworks and services (like the database or UI) so that it can be tested in isolation and the external dependencies can be swapped out without rewriting the core logic.
- EARS: When I write tests for an application service, I shall be able to provide a mock implementation of its data repository port so that the test runs without a live database connection.
- DX Metrics: Unit test coverage for the `application` layer > 95%; time to write a new business logic test is low due to easy mocking of ports.
- Supported by: DEV-ADR-022, DEV-SDS-022

---

## DEV-PRD-022 — Seamless Database Schema Migration and Type Regeneration

- Description: As a developer, I want a simple, command-line driven workflow for creating database migrations and regenerating all associated types so that I can update data models with a single, atomic action.
- EARS: When I run the `just db-migrate-and-gen` command, the system shall create a new SQL migration file, apply it to the local database, and trigger the full type generation and propagation pipeline.
- DX Metrics: A complete schema-to-UI type update can be performed with a single command; migration and generation process completes in < 60 seconds.
- Supported by: DEV-ADR-020, DEV-SDS-019, DEV-SDS-020
