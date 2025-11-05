# Developer Software Design Specification (DX-first)

Audience: Developers as end-users
Scope: Design for discoverability, usability, and maintainability

---

## DEV-SDS-001 — Repository layout for discoverability (addresses DEV-PRD-001, DEV-PRD-007)

-   Principle: Put the obvious things in obvious places.
-   Design:
    -   `.github/copilot-instructions.md` — repo-wide guidance.
    -   `.github/instructions/*.instructions.md` — MECE components: security, performance, style, general, context.
    -   `.github/prompts/*.prompt.md` — reusable prompt templates; frontmatter metadata.
    -   `.github/chatmodes/*.chatmode.md` — 8 personas; synergy notes.
    -   `.vscode/settings.json` — prompt/mode discovery locations; safe defaults.
    -   `scripts/` — orchestration helpers; token metrics; A/B wrappers.
-   DX Effect: Zero-hunt for files; predictable imports; fast onboarding.

## DEV-SDS-002 — Instruction stacking algorithm (addresses DEV-PRD-002, DEV-PRD-006)

-   Contract: Ordered list of instruction files → concatenated with precedence.
-   Rules:
    -   Order: repo-wide → mode → prompt; later items may override earlier ones only where documented.
    -   Pruning: remove duplicate headings/sections; cap tokens per stack via metrics.
-   Error modes: Missing file, circular include, token overflow; provide clear messages.

## DEV-SDS-003 — Persona chat modes (addresses DEV-PRD-003)

-   Structure: Frontmatter (name, description, tools, model) + body instructions + synergy section (links to security/perf/style instructions).
-   UX: One-click selection; consistent output format; guidance for handoffs between roles.

## DEV-SDS-004 — Tasks orchestrator pattern (addresses DEV-PRD-004, DEV-PRD-010)

-   Inputs: prompt file, variant flag, target selection (file/folder), metrics toggle.
-   Outputs: logged token/latency; variant label.
-   Behavior: Run prompt, collect metrics, optionally split traffic 50/50 for A/B.

## DEV-SDS-005 — Security defaults and trust (addresses DEV-PRD-005)

-   Defaults: Disable chat.tools.autoApprove; honor workspace trust; prepend safety instructions.
-   Validation: CI job verifies settings.json posture and presence of safety instructions in stacks.

## DEV-SDS-006 — Prompt-as-code lifecycle (addresses DEV-PRD-007)

-   Stages: Edit → Lint → Plan (preview effective prompt) → Run (A/B) → Evaluate → Merge.
-   Artifacts: Lint report, plan diff, metrics dashboard.

## DEV-SDS-007 — CALM/Wasp/Nx bridging (addresses DEV-PRD-008)

-   Contract: Wasp-style spec drives features; CALM defines interfaces/controls; Nx generators output reversible services.
-   Validation: CALM controls run pre-generation; fail fast on violations.

## DEV-SDS-008 — Declarative-first with hooks (addresses DEV-PRD-009)

-   Design: Keep configuration declarative; expose hooks in tasks for retrieval, branching, and post-processing.
-   Guardrails: Limit hook scope and sanitize inputs.

## DEV-SDS-009 — Evaluation hooks and token budgets (addresses DEV-PRD-010)

-   Design: Token/latency logging always on when tasks run; optional quality/safety post-processing.
-   Budgets: Per-mode budgets with warnings and hard caps; configurable thresholds.

## DEV-SDS-010 — Devbox as parent shell (addresses DEV-PRD-011, DEV-PRD-015)

Principle: OS dependencies are reproducible and never depend on host state.

Design:

devbox.json defines OS utilities (git, curl, jq, make, ffmpeg, postgresql-client, optional uv).

Developer flow: devbox shell → all subsequent commands execute inside this parent shell.

Scripts in CI may call devbox run -- <cmd> or run inside a Devbox-equivalent container layer.

Error modes: Missing Devbox binary; package not found on platform; non-zero exit from init_hook. Provide actionable messages with remediation.

Artifacts: devbox.json, docs/ENVIRONMENT.md section “Using Devbox”.

## DEV-SDS-011 — mise runtime activation and PATH policy (addresses DEV-PRD-012, DEV-PRD-015, DEV-PRD-016)

Principle: One source of truth for language versions.

Design:

.mise.toml pins node, python, rust.

Local: activate via mise install then mise exec -- <cmd> or shell hook (use_mise if using direnv locally).

CI: mise install then run tasks; no direnv required.

Preflight: a just verify:node task checks node --version vs .mise.toml and (if present) Volta pins.

Error modes: Partial installs, PATH shadowing (Volta vs mise), missing shims. just doctor prints active versions.

Artifacts: .mise.toml, Justfile targets verify:\*, docs updates.

## DEV-SDS-012 — Secrets with SOPS (local & CI) (addresses DEV-PRD-013, DEV-PRD-015)

Principle: Secrets at rest are always encrypted; decryption is ephemeral.

Design:

Local: .secrets.env.sops checked into Git (encrypted); developers run inside a shell that executes sops exec-env .secrets.env.sops <cmd> (via .envrc locally or manual wrapper).

CI (no direnv): Decrypt with CI-provided AGE key or KMS:

sops -d .secrets.env.sops > /tmp/ci.env && set -a && source /tmp/ci.env && set +a

Ensure /tmp/ci.env is removed post-job.

Error modes: Missing key, stale recipients, plaintext leakage. Pipeline fails closed with clear logs; pre-commit rule forbids .env commits.

Artifacts: .sops.yaml, .secrets.env.sops (encrypted), CI snippets.

## DEV-SDS-013 — Just tasks: environment-aware execution (addresses DEV-PRD-014, DEV-PRD-015)

Principle: One-liners for the most common workflows.

Design:

Tasks assume Devbox + mise are active and secrets are loaded (local via direnv, CI via SOPS export).

Example targets: setup, build, test, lint, doctor, verify:node, verify:python, verify:rust.

Remove redundant bootstrapping if covered by mise (e.g., corepack enable optional).

Error modes: Missing env → task prints guidance to activate Devbox/mise; missing secrets → hints to run the decrypt step.

Artifacts: Justfile diffs (minimal, surgical), docs/ENVIRONMENT.md.

## DEV-SDS-014 — Minimal CI pipeline (addresses DEV-PRD-015)

Principle: Parity with local, minus direnv.

Design (pseudostep order):

Checkout repo.

Install Devbox (or use a base image that includes it).

Devbox step: ensure OS tools available for subsequent steps.

Install mise; mise install.

SOPS decrypt to ephemeral env file using CI key/KMS; source it.

Run tasks via just (e.g., just build, just test).

Cleanup ephemeral files (/tmp/ci.env).

Error modes: Secret failure, cache miss for runtimes, PATH conflicts (Volta). Fail fast with explicit diagnostics.

Artifacts: .github/workflows/\* snippets, CI docs.

## DEV-SDS-015 — Volta coexistence & enforcement (addresses DEV-PRD-016)

Principle: Deterministic resolution for Node toolchain, with a clear deprecation path.

Design:

Authoritative source: mise. If a package.json contains a volta stanza, a preflight just verify:node:

Ensures Volta’s node/npm/pnpm match .mise.toml.

Emits a warning when matching; emits a hard error on divergence.

Deprecation: Document a two-release window to remove the volta section from package.json (or mark as informational only).

CI: Volta is not installed; verification runs using jq to read package.json pins (if present) and compare to mise.

Error modes: Different pins, shadowed shims. Resolution guidance printed with exact commands to align versions.

Artifacts: Justfile (verify:node), docs note “Volta Compatibility Mode”.

## DEV-SDS-016 — Chezmoi optional bootstrap (addresses DEV-PRD-011/012)

Principle: Zero-friction first-run on fresh machines.

Design: Provide optional Chezmoi templates for shell hook order and a run_after that executes direnv allow for new .envrc files (local only).

Error modes: None in CI (not used). Local failures fall back to manual direnv allow.

Artifacts: Chezmoi templates (outside repo), docs pointer only.

## DEV-SDS-017 — Rust‑Native Observability Pipeline (Tracing → Vector → OpenObserve)

### Principle

Observability is native, structured, and AI‑enriched by design — not bolted on. The stack must produce high‑fidelity, low‑overhead telemetry usable for diagnostics, optimization, and AI‑assisted pattern discovery.

---

### Design overview

| Layer               |                       Component | Role                                                        | Implementation artifacts                  |
| ------------------- | ------------------------------: | ----------------------------------------------------------- | ----------------------------------------- |
| Instrumentation     | tracing / tracing‑opentelemetry | Emit structured spans, metrics, and logs from Rust services | crates/vibepro-observe/src/lib.rs         |
| Pipeline            |                          Vector | Receive OTLP, sample, redact, enrich                        | ops/vector/vector.toml                    |
| Storage & Analytics |                     OpenObserve | Columnar unified store + SQL/UI                             | External service (staging/prod)           |
| Integration         |                       Just + CI | Local run, validation, CI checks                            | Justfile, .github/workflows/env-check.yml |

Architecture (logical flow)

```
Rust App (tracing macros, tracing_subscriber, tracing_opentelemetry)
  └─OTLP/gRPC→ Vector (host binary: otel sources, VRL transforms, otlp sink)
      └─OTLP/HTTP or gRPC→ OpenObserve (columnar store, SQL + UI)
```

---

### Design details

1. Instrumentation layer (Rust)

-   Crates: tracing, tracing-core, tracing-subscriber, tracing-opentelemetry, opentelemetry-otlp, anyhow, once_cell.
-   Public API (example)

```rust
pub fn init_tracing(service: &str) -> Result<(), anyhow::Error>;
pub fn record_metric(key: &str, value: f64);
```

-   Config (env flags):
    -   VIBEPRO_OBSERVE=1
    -   OTLP_ENDPOINT=http://127.0.0.1:4317
-   Behavior:
    -   If VIBEPRO_OBSERVE=1 → install OTLP exporter (OTLP/gRPC).
    -   Otherwise → default to fmt::Subscriber with JSON stdout.

2. Data pipeline layer (Vector)

-   Deployment:
    -   Install via Devbox/mise (vector binary) or package manager.
    -   Run locally: `just observe-start` (Just target).
-   Config path: `ops/vector/vector.toml`
-   Example vector.toml (snippets)

```toml
[sources.otel_traces]
type    = "opentelemetry"
address = "0.0.0.0:4317"

[transforms.sample_slow]
type      = "sample"
inputs    = ["otel_traces"]
rate      = 0.25
condition = 'exists(.attributes.latency_ms) && to_int!(.attributes.latency_ms) > 300'

[transforms.redact_email]
type = "remap"
inputs = ["sample_slow"]
source = '''
  .user_email = replace(.user_email, r"[^@]+@[^@]+", "[REDACTED]")
'''

[sinks.otlp]
type     = "opentelemetry"
inputs   = ["redact_email"]
endpoint = "${OPENOBSERVE_URL}"
auth     = { strategy = "bearer", token = "${OPENOBSERVE_TOKEN}" }
```

-   Purpose:
    -   Local buffering, sampling, PII redaction, enrichment (app version, host, region).
    -   Enforce opt‑in (env var) and host-level controls.

3. Storage & analytics (OpenObserve)

-   Ingestion: standard OTLP/gRPC or OTLP/HTTP (4317/4318).
-   Auth: API token via `.secrets.env.sops` (OPENOBSERVE_TOKEN).
-   Data model: unified schema for logs, metrics, traces; columnar (Parquet) storage for fast analytics.
-   Example query:

```sql
SELECT service.name, COUNT(*), AVG(duration_ms)
FROM traces
WHERE status = 'error'
GROUP BY service.name;
```

---

### Security & compliance

-   Secrets: OPENOBSERVE_TOKEN & OPENOBSERVE_URL kept in `.secrets.env.sops` (SOPS).
-   PII redaction: VRL transform in `vector.toml` (runtime enforcement).
-   Opt‑in activation: controlled by VIBEPRO_OBSERVE env var.
-   Network boundaries: host Vector → TLS endpoint; enforce via host firewall and CI checks.
-   Governance: sampling + retention configured in Vector/OpenObserve policies.

---

### Error modes & recovery

-   OpenObserve unreachable → retries, memory‑backed buffer, backpressure. Mitigation: Vector retry + buffer config.
-   Invalid VRL transform → Vector refuses to start. Mitigation: `just observe-validate` and CI `vector validate`.
-   Missing token → sink disabled with warning; fallback to JSON stdout.
-   High volume (>1k spans/s) → CPU rise. Mitigation: tune sampling, switch to async exporter.

---

### Artifacts & source control

-   Rust instrumentation crate: `crates/vibepro-observe/`
-   Vector config: `ops/vector/vector.toml`
-   Docs: `docs/observability/README.md`, `docs/ENVIRONMENT.md` § 8
-   Secrets: `.secrets.env.sops`
-   CI validation: `.github/workflows/env-check.yml` (vector validate)
-   Tests:
    -   `tests/ops/test_vector_config.sh` (Phase 2)
    -   `tests/ops/test_tracing_vector.sh` (Phase 3)
    -   `tests/ops/test_openobserve_sink.sh` (Phase 4)
    -   `tests/ops/test_ci_observability.sh` (Phase 5)
    -   `tests/ops/test_observe_flag.sh` (Phase 6)
-   Implementation notes:
    -   `docs/work-summaries/observability-phase1-completion.md`
    -   `docs/work-summaries/observability-phase2-completion.md`
    -   `docs/work-summaries/observability-phase3-completion.md`
    -   `docs/work-summaries/observability-phase4-completion.md`
    -   `docs/work-summaries/observability-phase5-completion.md`
    -   `docs/work-summaries/observability-phase6-completion.md`

**Implementation Status**: ✅ Complete (All 6 phases finished as of 2025-10-12)

**Feature Flags**:

-   Runtime: `VIBEPRO_OBSERVE=1` enables OTLP export
-   Compile-time: `features = ["otlp"]` enables OTLP capability
-   Default: JSON logs only (no network export)

---

### Performance & benchmark goals (targets)

-   Trace emission overhead: < 1 µs per span (criterion bench in vibepro-observe)
-   Vector CPU: < 3% per core at 1k spans/s (staging)
-   Data retention: ≥ 90 days (OpenObserve policy)
-   Ingestion latency: < 250 ms (p95)
-   Sampling efficiency: ~4:1 reduction on average

---

### Implementation dependencies

-   Rust crates: tracing, tracing-opentelemetry, opentelemetry-otlp, anyhow, once_cell.
-   System tools: `vector` binary (Devbox/mise).
-   Secrets: OPENOBSERVE_URL, OPENOBSERVE_TOKEN in `.secrets.env.sops`.

---

### Cross-references

-   DEV-ADR-016 — Architecture decision for adoption
-   DEV-TDD-OBSERVABILITY.md — Implementation test plan
-   DEV-PRD-017 — Product requirement (to be authored)
-   ENVIRONMENT.md §8 — Activation & workflow
-   .github/workflows/env-check.yml — CI validation

---

### Exit criteria

-   `cargo test -p vibepro-observe` passes.
-   `vector validate ops/vector/vector.toml` returns 0.
-   `just observe-verify` ingests a sample trace into OpenObserve successfully.
-   Redaction and sampling rules verified in test environment.
-   Documentation updated with schema and endpoints.

---

## DEV-SDS-018 — Structured Logging with Trace Correlation (Multi-Language)

### Principle

Logging is structured-first (JSON), trace-aware by default, and consistent across all languages. All logs carry correlation metadata (`trace_id`, `span_id`, `service`, `environment`, `version`) and flow through Vector for PII redaction before storage.

---

### Design overview

| Layer      |      Component | Role                                                            | Implementation artifacts                  |
| ---------- | -------------: | --------------------------------------------------------------- | ----------------------------------------- |
| Rust       | tracing events | Emit structured log events via `info!()`, `warn!()`, `error!()` | crates/vibepro-observe (already in place) |
| Node       |           pino | JSON logger with trace context injection                        | libs/node-logging/logger.ts               |
| Python     |        Logfire | Auto-instrument FastAPI/Pydantic, emit JSON logs & spans        | libs/python/vibepro_logging.py            |
| Pipeline   |         Vector | OTLP logs source, PII redaction, enrichment                     | ops/vector/vector.toml (logs section)     |
| Storage    |    OpenObserve | Unified log storage with trace correlation                      | External service (staging/prod)           |
| Validation |    Shell tests | Config validation, PII redaction, correlation                   | tests/ops/test*vector_logs*\*.sh          |

Architecture (logical flow)

```
App Code (Rust/Node/Python structured loggers)
  └─JSON to stdout (local) or OTLP (observe-on)
    └─Vector (OTLP logs source, VRL transforms)
      └─OpenObserve (unified storage, log-trace correlation)
```

---

### Log schema (mandatory fields)

Every log line MUST include:

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
    "category": "app"
}
```

**Field definitions:**

-   `timestamp`: ISO 8601 with timezone
-   `level`: one of `error`, `warn`, `info`, `debug` (no `trace` level—use spans)
-   `message`: Human-readable description
-   `trace_id`: Current trace identifier (from tracing context)
-   `span_id`: Current span identifier
-   `service`: Service name (e.g., `user-api`, `vibepro-node`)
-   `environment`: Deployment environment (`local`, `staging`, `production`)
-   `application_version`: Application version (e.g., `v1.2.3`)
-   `category`: Log category (`app`, `audit`, `security`)

---

### Design details by language

#### 1) Rust (tracing events)

Already implemented via `vibepro-observe`. Use `tracing` events for logs:

```rust
use tracing::{info, warn, error};

// App log
info!(category = "app", user_id_hash = "abc123", "request accepted");

// Security log
warn!(category = "security", action = "auth_failure", user_id_hash = hash(user_id), "auth failed");

// Error log
error!(category = "app", code = 500, "upstream timeout");
```

**Trace context:** Automatically captured when inside a tracing span.
**Transport:** stdout JSON (default) or OTLP (when `VIBEPRO_OBSERVE=1` + `--features otlp`)

#### 2) Node (pino wrapper)

Create `libs/node-logging/logger.ts`:

```typescript
import pino from "pino";

export function logger(service = process.env.SERVICE_NAME || "vibepro-node") {
    return pino({
        base: {
            service,
            environment: process.env.APP_ENV || "local",
            application_version: process.env.APP_VERSION || "dev",
        },
        messageKey: "message",
        formatters: {
            level(label) {
                return { level: label };
            },
            log(obj) {
                return {
                    trace_id: obj.trace_id,
                    span_id: obj.span_id,
                    category: obj.category || "app",
                    ...obj,
                };
            },
        },
    });
}
```

**Usage:**

```typescript
import { logger } from "@vibepro/node-logging/logger";
const log = logger();

log.info({ user_id_hash: "abc123", category: "app" }, "request accepted");
log.warn({ category: "security", action: "rate_limit" }, "client throttled");
log.error({ category: "app", code: 500 }, "upstream timeout");
```

**Trace context:** Injected via middleware/headers (OpenTelemetry context propagation)
**Transport:** stdout JSON → Vector OTLP logs source or HTTP ingestion

#### 3) Python (Logfire instrumentation) - **FUTURE DESIGN (Cycle 2A)**

> **Note:** This section describes planned/target implementations for Cycle 2A (DEV-TDD cycle 2A). These examples are not yet implemented - see `libs/python/vibepro_logging.py` which currently contains stub/NotImplementedError.

Refactor `libs/python/vibepro_logging.py` to expose a Logfire bootstrap that instruments FastAPI and outbound calls:

```python
from __future__ import annotations

import os
from fastapi import FastAPI
import logfire

DEFAULT_SERVICE = os.getenv("SERVICE_NAME", "vibepro-py")

def bootstrap_logfire(app: FastAPI, service: str = DEFAULT_SERVICE) -> None:
    logfire.configure(service_name=service)
    logfire.instrument_fastapi(app)

# get_logger() function removed - consumers should call logfire methods directly
```

**Usage:**

```python
from fastapi import FastAPI
from libs.python.vibepro_logging import bootstrap_logfire, get_logger

app = FastAPI()
bootstrap_logfire(app)

log = get_logger()
log.info("request accepted", category="app", user_id_hash="abc123")
log.warning("auth failed", category="security", action="auth_failure")
```

**Trace context:** Created automatically by Logfire (OpenTelemetry spans) for FastAPI handlers and, when optional integrations are enabled, for outbound HTTP clients and Pydantic validation.

**Integration API calls:** Enable optional integrations in your application startup immediately after creating your FastAPI app or DB engine:

```python
import logfire

# After FastAPI app creation
logfire.instrument_fastapi(app)

# For HTTP clients (add to application startup)
logfire.instrument_requests()  # For requests library
logfire.instrument_httpx()     # For httpx library

# For SQLAlchemy (pass engine or session factory)
logfire.instrument_sqlalchemy(engine=your_db_engine)
```

**Note:** When using `logfire.instrument_sqlalchemy()`, you must pass either the SQLAlchemy engine or session factory as the `engine` parameter. This enables automatic tracing of database queries and connection operations.

**Additional integration examples:**

```python
# Import and configure Logfire with your service
import logfire
from fastapi import FastAPI
from sqlalchemy import create_engine

# Initialize Logfire
logfire.configure(service_name="my-api-service")

# Create FastAPI app and instrument it
app = FastAPI()
logfire.instrument_fastapi(app)

# Create database engine and instrument it
db_engine = create_engine(DATABASE_URL)
logfire.instrument_sqlalchemy(engine=db_engine)

# Instrument HTTP clients for outbound requests
logfire.instrument_requests()  # For Python requests library
logfire.instrument_httpx()     # For httpx (async) library
```

**Transport:** OTLP exporter controlled via env variables (`OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_EXPORTER_OTLP_PROTOCOL`, `OTEL_SERVICE_NAME`). See the [Logfire integration reference](https://logfire.pydantic.dev/docs/integrations/) for more options and configuration.

---

### Vector configuration (logs pipeline)

Add to `ops/vector/vector.toml`:

```toml
# --- Logs Source (OTLP/HTTP) ---
[sources.otel_logs]
type    = "opentelemetry"
address = "0.0.0.0:4318"   # OTLP/HTTP default for logs
protocols = ["logs"]

# --- PII Redaction Transform ---
[transforms.logs_redact_pii]
type   = "remap"
inputs = ["otel_logs"]
source = '''
  if exists(.attributes.user_email) { .attributes.user_email = "[REDACTED]" }
  if exists(.attributes.email) { .attributes.email = "[REDACTED]" }
  if exists(.attributes.authorization) { .attributes.authorization = "[REDACTED]" }
  if exists(.attributes.Authorization) { .attributes.Authorization = "[REDACTED]" }
  if exists(.attributes.password) { .attributes.password = "[REDACTED]" }
  if exists(.attributes.token) { .attributes.token = "[REDACTED]" }
  if exists(.attributes.api_key) { .attributes.api_key = "[REDACTED]" }
'''

# --- Enrichment Transform ---
[transforms.logs_enrich]
type   = "remap"
inputs = ["logs_redact_pii"]
source = '''
  .service = get_env!("SERVICE_NAME", default: "unknown")
  .environment = get_env!("APP_ENV", default: "local")
  .application_version = get_env!("APP_VERSION", default: "dev")
'''

# --- OpenObserve Sink ---
[sinks.logs_otlp]
type     = "opentelemetry"
inputs   = ["logs_enrich"]
endpoint = "${OPENOBSERVE_URL}"
auth     = { strategy = "bearer", token = "${OPENOBSERVE_TOKEN}" }
```

**PII redaction rules:**

-   `user_email`, `email` → `[REDACTED]`
-   `authorization`, `Authorization` → `[REDACTED]`
-   `password`, `token`, `api_key` → `[REDACTED]`

**Enrichment:**

-   `service`: from `SERVICE_NAME` env var
-   `environment`: from `APP_ENV` env var
-   `application_version`: from `APP_VERSION` env var

---

### Log levels & categories

**Levels:** `error`, `warn`, `info`, `debug`

-   No `trace` level—use tracing spans for operation-level detail

**Categories:**

-   `app` (default): Application behavior, business logic
-   `audit`: Compliance/audit trail (longer retention)
-   `security`: Security events (immediate alerting)

Categories use a dedicated field—not level—to enable separate routing and retention policies in OpenObserve.

---

### Retention policy

-   **Logs:** 14-30 days (shorter than traces)
-   **Traces:** 30-90 days (per DEV-SDS-017)
-   **Audit logs:** 90 days minimum (compliance requirement)

Configured per OpenObserve stream/index based on `category` field.

---

### Testing strategy

#### 1) Vector config validation (`tests/ops/test_vector_logs_config.sh`)

```bash
#!/usr/bin/env bash
set -euo pipefail

vector validate ops/vector/vector.toml || exit 1
grep -q 'sources.otel_logs' ops/vector/vector.toml || exit 1
grep -q 'transforms.logs_redact_pii' ops/vector/vector.toml || exit 1
grep -q 'sinks.logs_otlp' ops/vector/vector.toml || exit 1

echo "✅ Vector logs config valid"
```

#### 2) PII redaction test (`tests/ops/test_log_redaction.sh`)

```bash
#!/usr/bin/env bash
set -euo pipefail

# Start Vector in background
vector --config ops/vector/vector.toml &
VECTOR_PID=$!
sleep 2

# Emit log with PII via test script
node tools/logging/test_pino.js | grep -q '[REDACTED]' || {
  kill $VECTOR_PID
  echo "❌ PII not redacted"
  exit 1
}

kill $VECTOR_PID
echo "✅ PII redaction works"
```

#### 3) Trace correlation test (`tests/ops/test_log_trace_correlation.sh`)

```bash
#!/usr/bin/env bash
set -euo pipefail

# Emit log with trace_id and verify it appears in output
node tools/logging/test_pino.js | jq -r '.trace_id' | grep -q '^[a-f0-9]\+$' || {
  echo "❌ trace_id missing or invalid"
  exit 1
}

echo "✅ Log-trace correlation valid"
```

---

### Quick-start validation tools

#### Node (`tools/logging/test_pino.js`)

```javascript
const { logger } = require("../../libs/node-logging/logger");
const log = logger("test-service");

log.info(
    {
        trace_id: "abc123def456",
        span_id: "789ghi",
        category: "app",
        user_email: "test@example.com", // Should be redacted
    },
    "test log message",
);
```

#### Python (`tools/logging/test_logfire.py`)

```python
from fastapi import FastAPI

from libs.python.vibepro_logging import bootstrap_logfire, get_logger

app = FastAPI()
bootstrap_logfire(app, service="test-service")
log = get_logger()
log.info(
    "test log message",
    trace_id="abc123def456",
    span_id="789ghi",
    category="app",
    user_email="test@example.com",  # Should be redacted
)
```

---

### Security & compliance

-   **PII redaction:** Enforced at Vector layer (before storage)
-   **Secrets:** `OPENOBSERVE_TOKEN` stored in `.secrets.env.sops`
-   **Network:** TLS for Vector → OpenObserve connections
-   **Audit trail:** `category=audit` logs retained for 90+ days
-   **Access control:** OpenObserve RBAC for log query permissions

---

### Error modes & recovery

-   **Missing trace context:** Logs still valid; correlation fields may be empty
-   **Vector unavailable:** Logs continue to stdout; no data loss (just no forwarding)
-   **PII redaction failure:** Vector refuses to start if VRL syntax is invalid
-   **Schema mismatch:** OpenObserve accepts JSON; missing fields logged as warnings

---

### Artifacts & source control

-   Rust instrumentation: `crates/vibepro-observe/` (already exists)
-   Node logger: `libs/node-logging/logger.ts` (to be created)
-   Python Logfire bootstrap: `libs/python/vibepro_logging.py` (to be refactored)
-   Vector config: `ops/vector/vector.toml` (logs section to be added)
-   Tests:
    -   `tests/ops/test_vector_logs_config.sh`
    -   `tests/ops/test_log_redaction.sh`
    -   `tests/ops/test_log_trace_correlation.sh`
-   Quick-start tools:
    -   `tools/logging/test_pino.js`
    -   `tools/logging/test_logfire.py`
-   Docs:
    -   `docs/ENVIRONMENT.md` §9 — Logging Policy
    -   `docs/observability/README.md` §11 — Governance & Cost Controls

---

### Performance targets

-   Log emission overhead: < 100 µs per log line
-   Vector CPU: < 2% per core at 1k logs/s
-   PII redaction latency: < 10 µs per log line
-   Log-trace correlation success: > 95%

---

### Implementation dependencies

-   Rust: `tracing` crate (already in use)
-   Node: `pino` package (to be added to libs/node-logging/package.json)
-   Python: `logfire~=1.2.0` package (to be added to requirements.txt or pyproject.toml)
-   Vector: `vector` binary (already installed via Devbox)
-   OpenObserve: API token and URL in `.secrets.env.sops`

---

### Cross-references

-   DEV-ADR-017 — JSON-First Structured Logging architecture decision
-   DEV-PRD-018 — Structured Logging product requirements
-   DEV-SDS-017 — Rust-Native Observability Pipeline (foundation)
-   DEV-ADR-016 — Rust-Native Observability Pipeline (architecture)

---

### Exit criteria

-   `vector validate ops/vector/vector.toml` passes with logs section
-   `tests/ops/test_vector_logs_config.sh` passes
-   `tests/ops/test_log_redaction.sh` passes (PII redacted)
-   `tests/ops/test_log_trace_correlation.sh` passes (correlation fields present)
-   Node and Python quick-start tools emit valid JSON logs
-   Documentation updated in `docs/ENVIRONMENT.md` and `docs/observability/README.md`
-   All three language loggers (Rust/Node/Python) emit identical schema

---

## Documentation-as-code specs

-   Markdown style: headers, lists, mermaid diagrams; frontmatter optional for metadata.
-   Cross-references: Use relative links and DEV-PRD/ADR/SDS IDs.
-   Linters: Markdown lint; link check; schema checks for frontmatter.

## API design for developer usability

-   Human-first: function/task names describe intent; minimal required args; sensible defaults.
-   Error handling: actionable messages; suggestions for remediation; link to docs.

## Code organization

-   Feature-oriented structure for generators and scripts; shared utils for token metrics and plan diffs.
-   Naming: kebab-case files, clear suffixes (.prompt.md, .instructions.md, .chatmode.md).

---

## DEV-SDS-019 — Database Schema and Migration Workflow (addresses DEV-PRD-022)

-   Principle: Database schema changes are atomic, version-controlled, and trigger downstream effects.
-   Design:
    -   **Migrations:** Use the native Supabase CLI for managing database migrations (`supabase/migrations/*.sql`). Each migration file contains plain SQL and is timestamped for ordering.
    -   **Local Development:** A `just db-migrate` command will apply all new migrations to the local Dockerized Supabase instance.
    -   **CI/CD:** The production deployment pipeline will run migrations against the production database before deploying the application code.
    -   **Workflow:** To create a change, a developer runs a command that creates a new, empty migration file. After adding SQL, they run the migration and regeneration command.
-   Artifacts: `supabase/migrations/`, `justfile` targets for `db-migrate`, `db-reset`.
-   Cross-references: DEV-ADR-020, DEV-PRD-022

---

## DEV-SDS-020 — Type Generation and Propagation Pipeline (addresses DEV-PRD-020, DEV-PRD-022)

-   Principle: Generated types are artifacts derived from a single source of truth and should never be manually edited.
-   Design:
    -   **TypeScript Generation:** A `just gen-types-ts` command will execute `npx supabase gen types typescript --local`. The output is piped to a central, shared library file: `libs/shared/types/src/database.types.ts`.
    -   **Python Generation:** A custom script or tool will be used to convert the TypeScript types or introspect the database to generate Pydantic models in `libs/shared/types-py/src/models.py`. This ensures parity.
    -   **Orchestration:** A top-level `just gen-types` command will run both the TypeScript and Python generation steps in sequence. This command is chained with `db-migrate` in the main workflow command.
    -   **CI Validation:** A CI check will run the `gen-types` command and fail if the output differs from what is committed in the repository, ensuring generated types are never stale.
-   Artifacts: `libs/shared/types/src/database.types.ts`, `libs/shared/types-py/src/models.py`, `justfile` targets.
-   Cross-references: DEV-ADR-019, DEV-ADR-020, DEV-PRD-020

---

## DEV-SDS-021 — Nx Generator Design for Type-Safe Scaffolding (addresses DEV-PRD-021)

-   Principle: Generators enforce consistency and accelerate development by embedding architectural patterns into generated code.
-   Design:
    -   **Domain Generator (`@vibepro/domain`):** This will be the primary generator. It will take a domain name as input (e.g., `auth`). It will orchestrate calls to other, more specific generators.
    -   **Generated Libraries:** The generator will create the following libraries, each with a `project.json` file containing appropriate Nx tags for dependency management:
        -   `libs/auth/domain`: Contains pure domain models (interfaces/classes) that wrap the raw generated DB types.
        -   `libs/auth/application`: Contains application services/use cases.
        -   `libs/auth/infrastructure`: Contains Supabase repository implementations for data access.
        -   `libs/auth/api`: Contains FastAPI routes, scaffolded using the `@nxlv/python` generator, using the application services and Pydantic models.
        -   `libs/auth/ui`: Contains frontend components and hooks for the domain, tailored to the selected `app_framework` (Next.js, Remix, or Expo). Type-safe UI components will be generated using `@nx-extend/shadcn-ui`.
    -   **Type Integration:** The generated code will be pre-wired with imports from `libs/shared/types` and `libs/shared/types-py`, ensuring immediate type safety.
    -   **Templates:** The generator will use a set of template files (`<files>`) that are processed to insert the domain name and other variables.
-   Artifacts: `tools/generators/domain/`, including `index.ts`, `schema.json`, and `files/` templates.
-   Cross-references: DEV-ADR-021, DEV-PRD-021, `copier.yml` (`app_framework`)

---

## DEV-SDS-022 — Ports and Adapters Design for Hexagonal Architecture (addresses DEV-ADR-022)

-   Principle: The application's core logic depends on abstractions (ports), not on concrete implementations. Adapters provide the concrete implementations for these abstractions.
-   Design:

    -   **Port Definition:** Ports will be defined as technology-agnostic interfaces within the `libs/<domain>/application` directory. To facilitate testing and dependency inversion, each port will be defined as an abstract contract.

        Example:

    -   Structural implementation (preferred — no inheritance needed)

        ```python
        # libs/auth/infrastructure/adapters/supabase_user_repository.py
        from __future__ import annotations
        from typing import Optional

        from libs.auth.domain.models import User
        from libs.auth.application.ports.user_repository import IUserRepository

        class SupabaseUserRepository:
          def get_user_by_email(self, email: str) -> User | None:
            # Supabase client logic here...
            # return User(...) or None
            ...
        ```

        -   Explicit inheritance (use only if needed)

        ```python
        # libs/auth/infrastructure/adapters/supabase_user_repository.py
        from __future__ import annotations
        from typing import Optional

        from libs.auth.domain.models import User
        from libs.auth.application.ports.user_repository import IUserRepository

        class SupabaseUserRepository(IUserRepository):
          def get_user_by_email(self, email: str) -> User | None:
            # Supabase client logic here...
            ...
        ```

        Notes:

        -   Keep return type User | None (or Optional[User]) to satisfy strict typing.
        -   Use @runtime_checkable on the Protocol only if you plan to call isinstance()/issubclass() checks at runtime.
        -   Ensure import paths match the monorepo layout and run mypy/ruff as part of the TDD/validation workflow.
        -   **Driving (API/UI) Adapters:** FastAPI routes (`api` layer) and UI components (`ui` layer) will act as driving adapters. They will depend on the application services, which are injected with the port interfaces.

    -   **Dependency Injection:** Application services will be initialized with implementations of the ports. This will be managed by the application's main entry point or a dependency injection framework.

-   Artifacts: New `ports` subdirectories within each domain's `application` layer; new `adapters` subdirectories within the `infrastructure` layer.
-   Cross-references: DEV-ADR-022, DEV-PRD-023

---

## DEV-SDS-019 — Complete Generator Specification Template Design (addresses DEV-PRD-019)

Principle: The generator specification template must be comprehensive, AI-friendly, and executable—enabling AI agents to create valid Nx generators just-in-time without hallucinations or external context.

### Design Overview

| Component                | Purpose                                                           | Implementation                                                         |
| ------------------------ | ----------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Spec Template            | Single source of truth for generator patterns                     | `templates/{{project_slug}}/docs/specs/generators/GENERATOR_SPEC.md`   |
| Schema Documentation     | JSON Schema draft-07 examples covering all property types         | Section 3: Inputs/Options with validation rules and prompt types       |
| Type Mapping Matrix      | Schema ↔ TypeScript alignment guide                              | Section 3.1: Table mapping each property to TS type + validation rules |
| Pattern Library          | Reusable generator patterns (domain, service, component, adapter) | Section 3.5: Common Generator Patterns with executable examples        |
| Implementation Hints     | Nx devkit usage patterns and best practices                       | Section 7: Code snippets using `@nx/devkit` helpers                    |
| Acceptance Tests         | Test templates matching project conventions                       | Section 8: Test categories with examples from `tests/generators/*.ts`  |
| AI Quick-Start           | Workflow steps reducing cognitive load                            | Section 13: Step-by-step generator creation process                    |
| Troubleshooting Taxonomy | Categorized error guide (Schema/Runtime/Tests)                    | Section 14: Common errors with resolutions                             |
| Validation Automation    | Commands for automated checking                                   | Throughout: `ajv`, `just ai-validate`, `just spec-guard` references    |
| MCP Assistance           | External knowledge queries for grounding                          | Section 10: context7/ref/exa queries for Nx docs and examples          |

### Detailed Design Sections

#### Section 1: Purpose & Scope

-   **Decision Tree (Mermaid):** Visual guide for when to use vs. write custom code
-   **Use cases:** Clear examples of appropriate generator scenarios
-   **Non-goals:** Explicit anti-patterns to prevent misuse

#### Section 3: Inputs/Options (Schema)

**Schema Property Types Coverage:**

```typescript
interface SchemaPropertyTypes {
    string: {
        validation: ["pattern", "minLength", "maxLength", "format"];
        examples: ["kebab-case names", "email", "url"];
    };
    number: {
        validation: ["minimum", "maximum", "multipleOf"];
        examples: ["port numbers", "retry counts"];
    };
    boolean: {
        defaults: true;
        examples: ["skipTests", "buildable", "publishable"];
    };
    array: {
        validation: ["minItems", "maxItems", "uniqueItems"];
        items: "string | object";
        examples: ["tags", "dependencies"];
    };
    enum: {
        validation: ["enum values"];
        examples: ["language: typescript|python", "framework: next|remix"];
    };
    conditional: {
        keywords: ["if", "then", "else"];
        examples: ["require boundedContext when type=domain"];
    };
}
```

**Prompt Types Coverage:**

```json
{
    "x-prompt": {
        "input": "Simple text input",
        "list": {
            "message": "Select option",
            "items": [
                { "value": "a", "label": "Option A" },
                { "value": "b", "label": "Option B" }
            ]
        },
        "confirmation": "Boolean yes/no prompt",
        "multiselect": {
            "message": "Select multiple",
            "items": ["option1", "option2", "option3"]
        }
    }
}
```

**Default Sources:**

```json
{
    "$default": {
        "$source": "argv", // Command-line argument
        "index": 0 // Position
    },
    "$default": {
        "$source": "projectName" // Current Nx project context
    },
    "$default": {
        "$source": "workspaceName" // Workspace root name
    }
}
```

#### Section 3.1: Type Mapping Matrix

| schema.json Property | TypeScript Type       | Validation Rules               | Example                         |
| -------------------- | --------------------- | ------------------------------ | ------------------------------- |
| `name: string`       | `name: string`        | `pattern: "^[a-z][a-z0-9-]*$"` | `"user-service"`                |
| `port: number`       | `port?: number`       | `minimum: 3000, maximum: 9999` | `3001`                          |
| `skipTests: boolean` | `skipTests?: boolean` | `default: false`               | `true`                          |
| `tags: array`        | `tags?: string[]`     | `items: { type: "string" }`    | `["scope:api", "type:service"]` |
| `type: enum`         | `type: LayerType`     | `enum: ["domain", "infra"]`    | `"domain"`                      |

**Synchronization Rules:**

1. Every `schema.json` property MUST have corresponding `schema.d.ts` field
2. Optional properties in JSON (`required` array) map to TypeScript `?` suffix
3. Enum values become TypeScript union types or string literal types
4. Array items types must match TypeScript array element types

#### Section 3.5: Common Generator Patterns

**Pattern Categories:**

1. **Domain Entity Generator:** Creates DDD entities with value objects
2. **Service/Adapter Generator:** Scaffolds hexagonal layer services
3. **Component Generator:** UI components with styling options
4. **Conditional Schema:** Different options based on generator type

Each pattern includes:

-   Complete `schema.json` example
-   Matching `schema.d.ts` interface
-   Usage example with `pnpm nx g`
-   Expected output files

#### Section 6: Generator Composition

**Calling Other Generators:**

```typescript
import { Tree } from '@nx/devkit';
import { libraryGenerator } from '@nx/js';

export default async function(tree: Tree, schema: MySchema) {
  // Call another generator
  await libraryGenerator(tree, {
    name: `${schema.name}-shared`,
    directory: 'libs/shared'
  });

  // Continue with custom logic
  generateFiles(tree, ...);
}
```

**Conditional File Emission:**

```typescript
// In generator.ts
const filesToGenerate = schema.includeTests
  ? ['src/index.ts', 'src/index.spec.ts']
  : ['src/index.ts'];

// In template files/__fileName__.ts.template
<% if (includeTests) { %>
import { describe, it, expect } from 'vitest';
<% } %>
```

#### Section 7: Implementation Hints

**Nx Devkit Patterns:**

```typescript
// File generation with templates
import { generateFiles, Tree, formatFiles, names } from '@nx/devkit';

const normalizedOptions = {
  ...schema,
  ...names(schema.name) // Provides: className, fileName, propertyName, constantName
};

generateFiles(tree, templatePath, targetPath, normalizedOptions);
await formatFiles(tree);

// Project configuration
import { addProjectConfiguration, updateProjectConfiguration } from '@nx/devkit';

addProjectConfiguration(tree, projectName, {
  root: `libs/${projectName}`,
  projectType: 'library',
  sourceRoot: `libs/${projectName}/src`,
  targets: { build: {...} },
  tags: ['scope:domain', 'type:feature']
});

// Validation
function validateSchema(schema: MySchema): void {
  if (!/^[a-z][a-z0-9-]*$/.test(schema.name)) {
    throw new Error(`Invalid name: ${schema.name}. Must be kebab-case.`);
  }
}
```

#### Section 8: Acceptance Tests

**Test Categories with Templates:**

1. **Generation Success:** Verify all expected files created
2. **Content Validation:** Check generated file contents match spec
3. **Schema Validation:** Reject invalid inputs with clear errors
4. **Idempotency:** Re-running produces no diff
5. **Project Graph:** Nx graph remains valid after generation
6. **Target Execution:** Generated targets (build, test, lint) execute successfully

**Test Harness Integration:**

```typescript
import { runGenerator } from "./utils"; // Existing project utility

it("should generate all expected files", async () => {
    const result = await runGenerator("domain-entity", {
        name: "user",
        boundedContext: "identity",
    });

    expect(result.success).toBe(true);
    expect(result.files).toContain("libs/user/domain/entities/User.ts");
});
```

#### Section 13: AI Agent Instructions

**Generator Creation Workflow:**

```
Step 1: Parse Spec Requirements → Extract purpose, schema, outputs, tests
Step 2: Generate schema.json → Use JSON Schema draft-07, include all validations
Step 3: Generate schema.d.ts → Align exactly with schema.json using mapping matrix
Step 4: Generate generator.ts → Import @nx/devkit, validate inputs, use templates
Step 5: Generate Test Suite → Use patterns from tests/generators/*.test.ts
Step 6: Validate Generator → Run dry-run, tests, lint, graph checks
```

**Common Pitfalls:**

-   ❌ Using `any` type → ✅ Use proper TypeScript types
-   ❌ Hardcoding paths → ✅ Use `path.join` and `names()` helper
-   ❌ Skipping `formatFiles()` → ✅ Always format at end
-   ❌ Creating circular dependencies → ✅ Respect hexagonal layers

#### Section 14: Troubleshooting

**Categorized Error Guide:**

| Category          | Error Pattern                     | Resolution                                         |
| ----------------- | --------------------------------- | -------------------------------------------------- |
| Schema Validation | "Property 'x' is required"        | Add to `required` array in schema.json             |
| Schema Validation | "Value does not match pattern"    | Adjust pattern regex or input format               |
| Generator Runtime | "Cannot find module '@nx/devkit'" | Run `pnpm add -D @nx/devkit`                       |
| Generator Runtime | "Tree.exists is not a function"   | Ensure `tree` parameter passed correctly           |
| Test Failures     | "result.files missing expected"   | Check template path and output path configuration  |
| Test Failures     | "Generated content doesn't match" | Log actual content for debugging: `tree.read(...)` |

### Error Modes & Recovery

**Missing Spec Sections:**

-   Detection: Jest tests fail on TODO detection regex
-   Recovery: Green phase fills sections with concrete examples
-   Validation: `grep "TODO:" GENERATOR_SPEC.md` returns zero

**Schema/TypeScript Drift:**

-   Detection: Type mapping matrix validation fails
-   Recovery: Update schema.d.ts to match schema.json properties
-   Validation: Automated comparison in `spec-completeness.test.ts`

**Invalid Schema Examples:**

-   Detection: AJV validation fails on sample schemas
-   Recovery: Fix JSON Schema syntax and validation rules
-   Validation: `npx ajv validate -s schema.json -d test-data.json`

**AI Hallucination:**

-   Detection: AI simulation test produces invalid generator
-   Recovery: Enhance spec with missing patterns and examples
-   Validation: AI agent successfully creates generator on retry

### Artifacts & Source Control

**Template Files:**

-   `templates/{{project_slug}}/docs/specs/generators/GENERATOR_SPEC.md` — Main spec template
-   `templates/{{project_slug}}/docs/specs/generators/data-access.generator.spec.md` — Example completed spec
-   `templates/{{project_slug}}/docs/specs/generators/*.generator.spec.md` — Additional examples

**Test Files:**

-   `tests/generators/spec-template.test.ts` — Template validation tests
-   `tests/generators/spec-completeness.test.ts` — TODO detection and section checks
-   `tests/generators/ai-agent-simulation.test.ts` — AI workflow simulation
-   `tests/shell/generator-spec-workflow_spec.sh` — End-to-end ShellSpec test

**Supporting Files:**

-   `tests/generators/utils.ts` — Existing copier-based test harness
-   `tests/fixtures/generator-schema-sample.json` — Sample data for AJV validation
-   `docs/generator_plan_review.md` — Gap analysis and recommendations
-   `docs/plans/generator_spec_completion_plan.md` — TDD cycle plan

### Performance & Benchmark Goals

-   Template generation time: < 2 seconds (Copier processing)
-   Spec validation time: < 5 seconds (all tests)
-   AI generator creation time: < 5 minutes (end-to-end)
-   Test suite execution: < 30 seconds (all generator tests)

### Implementation Dependencies

**Tools:**

-   Jest for unit/integration tests
-   ShellSpec for shell script validation
-   AJV for JSON Schema validation
-   Copier for template generation
-   Nx devkit for generator implementation

**External Knowledge:**

-   Context7 Nx documentation (`/websites/nx_dev`)
-   JSON Schema specification (draft-07)
-   Existing Nx generator schemas (@nx/js, @nx/react, @nxlv/python)

**Project Files:**

-   `.github/instructions/generators-first.instructions.md` — Policy
-   `.github/instructions/testing.instructions.md` — Test guidelines
-   `.tessl/usage-specs/tessl/npm-nx/docs/generators-executors.md` — Nx devkit docs

### Cross-References

-   DEV-ADR-019 — Architecture decision for spec completion
-   DEV-PRD-019 — Product requirements and success metrics
-   `docs/generator_plan_review.md` — Detailed gap analysis
-   `docs/plans/generator_spec_completion_plan.md` — MECE TDD cycles A–C
-   `docs/traceability_matrix.md` — Spec ID mappings (to be updated)

### Exit Criteria

-   [ ] All 14 spec sections have concrete content with zero TODO markers
-   [ ] Schema examples cover all types: string, number, boolean, array, enum, conditional
-   [ ] All `x-prompt` types documented: input, list, confirmation, multiselect
-   [ ] All `$default` sources documented: argv, projectName, workspaceName
-   [ ] Type mapping matrix complete and validated
-   [ ] Generator composition patterns with executable examples
-   [ ] AI quick-start workflow with step-by-step instructions
-   [ ] Troubleshooting guide categorized by error type
-   [ ] Test templates align with `tests/generators/utils.ts` patterns
-   [ ] Validation commands integrated: `ajv`, `just ai-validate`, `just spec-guard`
-   [ ] `just test-generation` produces zero TODOs in `../test-output`
-   [ ] All tests pass: Jest, ShellSpec, AJV validation
-   [ ] Documentation reviewed and approved by platform team
-   [ ] Traceability matrix updated with DEV-PRD-019, DEV-SDS-019, DEV-ADR-019

---

## DEV-SDS-023 — Generator Idempotency Pattern Library (addresses DEV-PRD-024)

-   Principle: Generators must be rerunnable with zero diffs; deterministic patterns are documented and enforced.
-   Deterministic Writes: Use `readProjectConfiguration`, `tree.exists`, and AST/marker utilities to avoid overwriting existing content blindly.
-   Formatting: Call `formatFiles(tree)` and preserve sorted exports/imports to keep outputs stable.
-   Tests: Provide Jest specs that run the generator twice and assert `git diff --exit-code === 0`, plus ShellSpec smoke tests mirroring HexDDD’s idempotency suite.
-   Tooling: Add a shared helper in `tests/generators/` for double-run assertions; integrate with CI (`just spec-guard`).

## DEV-SDS-024 — Dependency Tag Configuration & Linting (addresses DEV-PRD-025)

-   Tag Taxonomy: `scope:<domain>`, `type:domain|application|infrastructure|api|ui|shared`, `layer:interface`.
-   Generator Output: All `project.json` files emitted by generators must include the appropriate tags immediately.
-   Lint Rules: Enable `@nx/enforce-module-boundaries` with disallow lists mapping to hexagonal layers (e.g., `type:domain` cannot depend on `type:infrastructure`).
-   Conformance: When Nx Conformance is available, configure the enforce-project-boundaries rule to mirror lint constraints for non-JS projects.
-   Docs: Update developer docs to explain tag usage and provide troubleshooting steps for lint failures.

## DEV-SDS-025 — Unit of Work & Event Bus Reference Implementations (addresses DEV-PRD-026)

-   Contracts: Scaffold `unit_of_work.ts`/`.py` and `event_bus.ts`/`.py` inside each domain’s application layer using TypeScript interfaces and Python `typing.Protocol`.
-   In-Memory Adapters: Generators create `InMemoryUnitOfWork` and `InMemoryEventBus` implementations for fast tests.
-   Infrastructure Adapters: Provide pre-wired Supabase repositories and message bus placeholders to show extension points.
-   Integration: FastAPI routers retrieve UoW/Event Bus via dependency injection; React hooks obtain services already bound to UoW.
-   Tests: Application unit tests use in-memory adapters; integration tests validate transactional behavior and event dispatch.

## DEV-SDS-026 — Supabase Dev Stack Targets & Tooling (addresses DEV-PRD-027)

-   Nx Targets: `tools/supabase/project.json` exports `supabase-devstack:start|stop|reset|status` run-commands invoking Docker Compose.
-   Compose Files: Maintain `docker/docker-compose.supabase.yml` mirroring HexDDD services (db, auth, storage, studio, etc.).
-   Environment: Provide `example.env` and generator-produced `.env.supabase.local` instructions; secrets stored in SOPS files.
-   Tests: ShellSpec scripts cover start/stop/reset flows; optional CI job ensures stack bootstraps within budgeted time.
-   Docs: Update `docs/ENVIRONMENT.md` and `docs/project_state.md` with quick-start and teardown guidance.

## DEV-SDS-027 — Nx Upgrade Runbook (addresses DEV-PRD-028)

-   Workflow: Create `docs/runbooks/nx_upgrade.md` detailing branch creation, `pnpm dlx nx migrate latest`, reviewing `migrations.json`, and applying codemods.
-   Validation Suite: Run `pnpm install`, `pnpm lint`, `pnpm tsc --noEmit`, `nx run-many --target=test`, `just test-generation`, and `just spec-guard`.
-   Rollback: Document restoring prior lockfiles and re-running previous Nx version if regressions appear.
-   Communication: Capture release notes and migration highlights for generated project consumers.
-   Scheduling: Track upgrade cadence on the platform roadmap and coordinate with downstream template consumers.

## DEV-SDS-028 — Universal React Generator Design (addresses DEV-PRD-029)

-   Options: `name`, `framework` (`next|remix|expo`), `apiClient` (bool), `includeExamplePage` (bool), `routerStyle` (`app|pages` for Next.js).
-   Shared Assets: Generator ensures `libs/shared/web` (API client, schemas, errors, env) exists and is imported by generated apps.
-   Templates: Framework-specific file trees under `generators/react/files/<framework>/` with reusable partials.
-   Tests: Jest unit tests cover option handling; e2e generator tests in ShellSpec spin up each framework and run lint/build; idempotency covered via DEV-SDS-023 helpers.
-   Documentation: Provide README snippets per framework plus CLI usage examples.

## DEV-SDS-029 — Strict Typing Configuration (addresses DEV-PRD-030)

-   TypeScript: Set `"strict": true`, `noUncheckedIndexedAccess`, and forbid implicit anys in `tsconfig.base.json`; ESLint rule `@typescript-eslint/no-explicit-any` set to error with documented escape hatches.
-   Python: Configure `mypy.ini` with `strict = True`, enabling `warn-unused-ignores`, `disallow-any-generics`, `warn-return-any`, `no-implicit-reexport`.
-   Tooling: Ensure `uv run mypy --strict` is part of CI quality gates (`just spec-guard`).
-   Education: Provide snippets in developer docs illustrating branded types, `satisfies`, and Protocol usage.
-   Monitoring: Add lint rules and scripts that fail PRs introducing `Any` types unless explicitly justified.

## DEV-SDS-030 — Type Sync Workflow & Hooks (addresses DEV-PRD-031)

-   CI Workflow: Add `ci/type-sync.yml` that runs Supabase schema introspection, regenerates TS/Python types, and asserts clean git state.
-   Just Targets: Expose `just gen-types`, `just db-migrate-and-gen`, and optional `just type-sync-ci` orchestrating the full pipeline.
-   Pre-Commit Hook: Provide `scripts/hooks/pre-commit-type-sync.sh` invoked via Just/mise to regenerate types before commit (opt-in).
-   Failure Guidance: Document remediation steps in `docs/ENVIRONMENT.md` (rerun generator, commit regenerated types).
-   Traceability: Update `docs/traceability_matrix.md` to map Supabase schema changes to PRDs/SDSs ensuring consistent implementation.
