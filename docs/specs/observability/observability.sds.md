# OBSERVABILITY SDSs

<!-- matrix_ids: [] -->

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

- Crates: tracing, tracing-core, tracing-subscriber, tracing-opentelemetry, opentelemetry-otlp, anyhow, once_cell.
- Public API (example)

```rust
pub fn init_tracing(service: &str) -> Result<(), anyhow::Error>;
pub fn record_metric(key: &str, value: f64);
```

- Config (env flags):
  - VIBEPRO_OBSERVE=1
  - OTLP_ENDPOINT=http://127.0.0.1:4317
- Behavior:
  - If VIBEPRO_OBSERVE=1 → install OTLP exporter (OTLP/gRPC).
  - Otherwise → default to fmt::Subscriber with JSON stdout.

2. Data pipeline layer (Vector)

- Deployment:
  - Install via Devbox/mise (vector binary) or package manager.
  - Run locally: `just observe-start` (Just target).
- Config path: `ops/vector/vector.toml`
- Example vector.toml (snippets)

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

- Purpose:
  - Local buffering, sampling, PII redaction, enrichment (app version, host, region).
  - Enforce opt‑in (env var) and host-level controls.

3. Storage & analytics (OpenObserve)

- Ingestion: standard OTLP/gRPC or OTLP/HTTP (4317/4318).
- Auth: API token via `.secrets.env.sops` (OPENOBSERVE_TOKEN).
- Data model: unified schema for logs, metrics, traces; columnar (Parquet) storage for fast analytics.
- Example query:

```sql
SELECT service.name, COUNT(*), AVG(duration_ms)
FROM traces
WHERE status = 'error'
GROUP BY service.name;
```

---

### Security & compliance

- Secrets: OPENOBSERVE_TOKEN & OPENOBSERVE_URL kept in `.secrets.env.sops` (SOPS).
- PII redaction: VRL transform in `vector.toml` (runtime enforcement).
- Opt‑in activation: controlled by VIBEPRO_OBSERVE env var.
- Network boundaries: host Vector → TLS endpoint; enforce via host firewall and CI checks.
- Governance: sampling + retention configured in Vector/OpenObserve policies.

---

### Error modes & recovery

- OpenObserve unreachable → retries, memory‑backed buffer, backpressure. Mitigation: Vector retry + buffer config.
- Invalid VRL transform → Vector refuses to start. Mitigation: `just observe-validate` and CI `vector validate`.
- Missing token → sink disabled with warning; fallback to JSON stdout.
- High volume (>1k spans/s) → CPU rise. Mitigation: tune sampling, switch to async exporter.

---

### Artifacts & source control

- Rust instrumentation crate: `crates/vibepro-observe/`
- Vector config: `ops/vector/vector.toml`
- Docs: `docs/observability/README.md`, `docs/ENVIRONMENT.md` § 8
- Secrets: `.secrets.env.sops`
- CI validation: `.github/workflows/env-check.yml` (vector validate)
- Tests:
  - `tests/ops/test_vector_config.sh` (Phase 2)
  - `tests/ops/test_tracing_vector.sh` (Phase 3)
  - `tests/ops/test_openobserve_sink.sh` (Phase 4)
  - `tests/ops/test_ci_observability.sh` (Phase 5)
  - `tests/ops/test_observe_flag.sh` (Phase 6)
- Implementation notes:
  - `docs/work-summaries/observability-phase1-completion.md`
  - `docs/work-summaries/observability-phase2-completion.md`
  - `docs/work-summaries/observability-phase3-completion.md`
  - `docs/work-summaries/observability-phase4-completion.md`
  - `docs/work-summaries/observability-phase5-completion.md`
  - `docs/work-summaries/observability-phase6-completion.md`

**Implementation Status**: ✅ Complete (All 6 phases finished as of 2025-10-12)

**Feature Flags**:

- Runtime: `VIBEPRO_OBSERVE=1` enables OTLP export
- Compile-time: `features = ["otlp"]` enables OTLP capability
- Default: JSON logs only (no network export)

---

### Performance & benchmark goals (targets)

- Trace emission overhead: < 1 µs per span (criterion bench in vibepro-observe)
- Vector CPU: < 3% per core at 1k spans/s (staging)
- Data retention: ≥ 90 days (OpenObserve policy)
- Ingestion latency: < 250 ms (p95)
- Sampling efficiency: ~4:1 reduction on average

---

### Implementation dependencies

- Rust crates: tracing, tracing-opentelemetry, opentelemetry-otlp, anyhow, once_cell.
- System tools: `vector` binary (Devbox/mise).
- Secrets: OPENOBSERVE_URL, OPENOBSERVE_TOKEN in `.secrets.env.sops`.

---

### Cross-references

- DEV-ADR-016 — Architecture decision for adoption
- DEV-TDD-OBSERVABILITY.md — Implementation test plan
- DEV-PRD-017 — Product requirement (to be authored)
- ENVIRONMENT.md §8 — Activation & workflow
- .github/workflows/env-check.yml — CI validation

---

### Exit criteria

- `cargo test -p vibepro-observe` passes.
- `vector validate ops/vector/vector.toml` returns 0.
- `just observe-verify` ingests a sample trace into OpenObserve successfully.
- Redaction and sampling rules verified in test environment.
- Documentation updated with schema and endpoints.

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

- `timestamp`: ISO 8601 with timezone
- `level`: one of `error`, `warn`, `info`, `debug` (no `trace` level—use spans)
- `message`: Human-readable description
- `trace_id`: Current trace identifier (from tracing context)
- `span_id`: Current span identifier
- `service`: Service name (e.g., `user-api`, `vibepro-node`)
- `environment`: Deployment environment (`local`, `staging`, `production`)
- `application_version`: Application version (e.g., `v1.2.3`)
- `category`: Log category (`app`, `audit`, `security`)

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
import pino from 'pino';

export function logger(service = process.env.SERVICE_NAME || 'vibepro-node') {
  return pino({
    base: {
      service,
      environment: process.env.APP_ENV || 'local',
      application_version: process.env.APP_VERSION || 'dev',
    },
    messageKey: 'message',
    formatters: {
      level(label) {
        return { level: label };
      },
      log(obj) {
        return {
          trace_id: obj.trace_id,
          span_id: obj.span_id,
          category: obj.category || 'app',
          ...obj,
        };
      },
    },
  });
}
```

**Usage:**

```typescript
import { logger } from '@vibepro/node-logging/logger';
const log = logger();

log.info({ user_id_hash: 'abc123', category: 'app' }, 'request accepted');
log.warn({ category: 'security', action: 'rate_limit' }, 'client throttled');
log.error({ category: 'app', code: 500 }, 'upstream timeout');
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

- `user_email`, `email` → `[REDACTED]`
- `authorization`, `Authorization` → `[REDACTED]`
- `password`, `token`, `api_key` → `[REDACTED]`

**Enrichment:**

- `service`: from `SERVICE_NAME` env var
- `environment`: from `APP_ENV` env var
- `application_version`: from `APP_VERSION` env var

---

### Log levels & categories

**Levels:** `error`, `warn`, `info`, `debug`

- No `trace` level—use tracing spans for operation-level detail

**Categories:**

- `app` (default): Application behavior, business logic
- `audit`: Compliance/audit trail (longer retention)
- `security`: Security events (immediate alerting)

Categories use a dedicated field—not level—to enable separate routing and retention policies in OpenObserve.

---

### Retention policy

- **Logs:** 14-30 days (shorter than traces)
- **Traces:** 30-90 days (per DEV-SDS-017)
- **Audit logs:** 90 days minimum (compliance requirement)

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
const { logger } = require('../../libs/node-logging/logger');
const log = logger('test-service');

log.info(
  {
    trace_id: 'abc123def456',
    span_id: '789ghi',
    category: 'app',
    user_email: 'test@example.com', // Should be redacted
  },
  'test log message',
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

- **PII redaction:** Enforced at Vector layer (before storage)
- **Secrets:** `OPENOBSERVE_TOKEN` stored in `.secrets.env.sops`
- **Network:** TLS for Vector → OpenObserve connections
- **Audit trail:** `category=audit` logs retained for 90+ days
- **Access control:** OpenObserve RBAC for log query permissions

---

### Error modes & recovery

- **Missing trace context:** Logs still valid; correlation fields may be empty
- **Vector unavailable:** Logs continue to stdout; no data loss (just no forwarding)
- **PII redaction failure:** Vector refuses to start if VRL syntax is invalid
- **Schema mismatch:** OpenObserve accepts JSON; missing fields logged as warnings

---

### Artifacts & source control

- Rust instrumentation: `crates/vibepro-observe/` (already exists)
- Node logger: `libs/node-logging/logger.ts` (to be created)
- Python Logfire bootstrap: `libs/python/vibepro_logging.py` (to be refactored)
- Vector config: `ops/vector/vector.toml` (logs section to be added)
- Tests:
  - `tests/ops/test_vector_logs_config.sh`
  - `tests/ops/test_log_redaction.sh`
  - `tests/ops/test_log_trace_correlation.sh`
- Quick-start tools:
  - `tools/logging/test_pino.js`
  - `tools/logging/test_logfire.py`
- Docs:
  - `docs/ENVIRONMENT.md` §9 — Logging Policy
  - `docs/observability/README.md` §11 — Governance & Cost Controls

---

### Performance targets

- Log emission overhead: < 100 µs per log line
- Vector CPU: < 2% per core at 1k logs/s
- PII redaction latency: < 10 µs per log line
- Log-trace correlation success: > 95%

---

### Implementation dependencies

- Rust: `tracing` crate (already in use)
- Node: `pino` package (to be added to libs/node-logging/package.json)
- Python: `logfire~=1.2.0` package (to be added to requirements.txt or pyproject.toml)
- Vector: `vector` binary (already installed via Devbox)
- OpenObserve: API token and URL in `.secrets.env.sops`

---

### Cross-references

- DEV-ADR-017 — JSON-First Structured Logging architecture decision
- DEV-PRD-018 — Structured Logging product requirements
- DEV-SDS-017 — Rust-Native Observability Pipeline (foundation)
- DEV-ADR-016 — Rust-Native Observability Pipeline (architecture)

---

### Exit criteria

- `vector validate ops/vector/vector.toml` passes with logs section
- `tests/ops/test_vector_logs_config.sh` passes
- `tests/ops/test_log_redaction.sh` passes (PII redacted)
- `tests/ops/test_log_trace_correlation.sh` passes (correlation fields present)
- Node and Python quick-start tools emit valid JSON logs
- Documentation updated in `docs/ENVIRONMENT.md` and `docs/observability/README.md`
- All three language loggers (Rust/Node/Python) emit identical schema

---

## Documentation-as-code specs

- Markdown style: headers, lists, mermaid diagrams; frontmatter optional for metadata.
- Cross-references: Use relative links and DEV-PRD/ADR/SDS IDs.
- Linters: Markdown lint; link check; schema checks for frontmatter.

## API design for developer usability

- Human-first: function/task names describe intent; minimal required args; sensible defaults.
- Error handling: actionable messages; suggestions for remediation; link to docs.

## Code organization

- Feature-oriented structure for generators and scripts; shared utils for token metrics and plan diffs.
- Naming: kebab-case files, clear suffixes (.prompt.md, .instructions.md, .chatmode.md).

---
