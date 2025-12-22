## 1. Purpose

Defines how to enable, validate, and operate the **Rust-Native Observability Pipeline** introduced in
**DEV-ADR-016**, **DEV-SDS-017**, and **DEV-PRD-017**.

This stack emits **structured spans, logs, and metrics** from Rust code via `tracing`,
routes them through **Vector**, and stores them in **OpenObserve** for querying and AI-assisted analysis.

---

## 2. Stack Summary

| Layer                   | Component               | Role                                | Key File                                      |
| :---------------------- | :---------------------- | :---------------------------------- | :-------------------------------------------- |
| **Instrumentation**     | `vibepro-observe` crate | Emits structured spans and metrics  | `crates/vibepro-observe/src/lib.rs`           |
| **Collector / Router**  | Vector                  | Buffers, samples, redacts, enriches | `ops/vector/vector.toml`                      |
| **Storage / Analytics** | OpenObserve             | Long-term indexed store             | External                                      |
| **Control Interface**   | Just + CI               | Validation & automation             | `Justfile`, `.github/workflows/env-check.yml` |

---

## 3. Local Setup

### 3.1 Prerequisites

Make sure you have the following tools (installed automatically via **Devbox** + **mise**):

```
devbox shell
mise install
```

Then verify:

```
vector --version
cargo --version
just --version
```

### 3.2 Configure Secrets

Edit your `.secrets.env.sops` and add:

```dotenv
OPENOBSERVE_URL=https://observe.vibepro.dev:443
OPENOBSERVE_TOKEN=<token>
OTLP_ENDPOINT=http://127.0.0.1:4317
```

Encrypt the file:

```bash
sops -e -i .secrets.env.sops
```

---

## 4. Run the Stack Locally

### 4.1 Start Vector

```bash
just observe-start
```

This command runs:

```bash
vector --config ops/vector/vector.toml --watch
```

Expected output:

```
✔ Validating config
✔ Listening on 0.0.0.0:4317 (OTLP gRPC)
✔ Listening on 0.0.0.0:4318 (OTLP HTTP)
```

### 4.2 Enable Observability in the App

In your shell or `.envrc`:

```bash
export VIBEPRO_OBSERVE=1
```

Then run the application (any service built with `vibepro-observe`):

```bash
cargo run -p my-service
```

You should see `tracing` spans emitted and logged by Vector.

---

## 5. Verify End-to-End Ingestion

### 5.1 Local Check

```bash
just observe-verify
```

This target emits a test span through the pipeline and checks Vector’s output logs.

Success output:

```
✅ Trace successfully exported to OpenObserve
```

### 5.2 Manual Validation (Optional)

```
curl -s "$OPENOBSERVE_URL/api/traces/_search" \
  -H "Authorization: Bearer $OPENOBSERVE_TOKEN" \
  -d '{"query": {"match_all": {}}}'
```

---

## 6. CI Validation

CI runs a **non-interactive validation** to ensure configuration integrity.

Excerpt from `.github/workflows/env-check.yml`:

```yaml
- name: Validate Vector config
  run: vector validate ops/vector/vector.toml
```

Failures in config or endpoint availability will block merges.

---

## 7. Configuration Files

### 7.1 `ops/vector/vector.toml`

```toml
# Vector configuration for local observability pipeline.
# Ingests OTLP traffic (gRPC + HTTP) and prints spans/logs to stdout for now.

data_dir = "tmp/vector-data"

[api]
enabled = true
address = "127.0.0.1:8686"

[sources.otlp]
type = "opentelemetry"
use_otlp_decoding = true

  [sources.otlp.acknowledgements]

  [sources.otlp.grpc]
  address = "0.0.0.0:4317"

  [sources.otlp.http]
  address = "0.0.0.0:4318"
  headers = []

  [sources.otlp.http.keepalive]
  max_connection_age_secs = 300
  max_connection_age_jitter_factor = 0.1

[transforms.traces_sanitize]
type = "remap"
inputs = ["otlp.traces"]
source = '''
.sampled = true

if exists(.attributes) {
  if exists(.attributes."user.email") { del(.attributes."user.email") }
  if exists(.attributes."auth.token") { del(.attributes."auth.token") }
  if exists(.attributes.user_email) { del(.attributes.user_email) }
  if exists(.attributes.auth_token) { del(.attributes.auth_token) }
}

if exists(.resource) && exists(.resource.attributes) {
  if exists(.resource.attributes."user.email") { del(.resource.attributes."user.email") }
  if exists(.resource.attributes."auth.token") { del(.resource.attributes."auth.token") }
  if exists(.resource.attributes.user_email) { del(.resource.attributes.user_email) }
  if exists(.resource.attributes.auth_token) { del(.resource.attributes.auth_token) }
}
'''

[sinks.dev_console]
inputs = ["traces_sanitize"]
target = "stdout"
type = "console"

[sinks.dev_console.encoding]
codec = "json"

[sinks.trace_file]
type = "file"
inputs = ["traces_sanitize"]
path = "tmp/vector-traces.log"

[sinks.trace_file.encoding]
codec = "json"

# OpenObserve OTLP HTTP sink for production trace storage and analytics
# Requires: OPENOBSERVE_URL and OPENOBSERVE_TOKEN environment variables
[sinks.openobserve]
type = "http"
inputs = ["traces_sanitize"]
uri = "${OPENOBSERVE_URL:-http://localhost:5080}/api/${OPENOBSERVE_ORG:-default}/v1/traces"
method = "post"

[sinks.openobserve.encoding]
codec = "json"

[sinks.openobserve.auth]
strategy = "basic"
user = "${OPENOBSERVE_USER:-root@example.com}"
password = "${OPENOBSERVE_TOKEN:-dummy-token-for-validation}"

[sinks.openobserve.request]
timeout_secs = 30
retry_attempts = 3

  [sinks.openobserve.request.headers]
  "Content-Type" = "application/json"

[sinks.null_metrics]
inputs = ["otlp.metrics"]
type = "blackhole"

# --- Logs Pipeline ---
# Process OTLP logs with PII redaction, enrichment, and storage

[transforms.logs_redact_pii]
type = "remap"
inputs = ["otlp.logs"]
source = '''
# Redact PII fields to [REDACTED]
if exists(.attributes.user_email) { .attributes.user_email = "[REDACTED]" }
if exists(.attributes.email) { .attributes.email = "[REDACTED]" }
if exists(.attributes.authorization) { .attributes.authorization = "[REDACTED]" }
if exists(.attributes.Authorization) { .attributes.Authorization = "[REDACTED]" }
if exists(.attributes.password) { .attributes.password = "[REDACTED]" }
if exists(.attributes.token) { .attributes.token = "[REDACTED]" }
if exists(.attributes.api_key) { .attributes.api_key = "[REDACTED]" }

# Also check resource attributes
if exists(.resource.attributes.user_email) { .resource.attributes.user_email = "[REDACTED]" }
if exists(.resource.attributes.email) { .resource.attributes.email = "[REDACTED]" }
if exists(.resource.attributes.authorization) { .resource.attributes.authorization = "[REDACTED]" }
if exists(.resource.attributes.password) { .resource.attributes.password = "[REDACTED]" }
if exists(.resource.attributes.token) { .resource.attributes.token = "[REDACTED]" }
if exists(.resource.attributes.api_key) { .resource.attributes.api_key = "[REDACTED]" }
'''

[transforms.logs_enrich]
type = "remap"
inputs = ["logs_redact_pii"]
source = '''
# Enrich with metadata from resource attributes or set defaults
# Service name from resource or unknown
if exists(.resource.attributes."service.name") {
  .service = string!(.resource.attributes."service.name")
} else if exists(.attributes.service) {
  .service = string!(.attributes.service)
} else {
  .service = "unknown"
}

# Environment from resource or local
if exists(.resource.attributes.environment) {
  .environment = string!(.resource.attributes.environment)
} else if exists(.attributes.environment) {
  .environment = string!(.attributes.environment)
} else {
  .environment = "local"
}

# Application version from resource or dev
if exists(.resource.attributes."service.version") {
  .application_version = string!(.resource.attributes."service.version")
} else if exists(.attributes.application_version) {
  .application_version = string!(.attributes.application_version)
} else {
  .application_version = "dev"
}

# Ensure category field exists (default to "app")
if !exists(.attributes.category) {
  .attributes.category = "app"
}
'''

# Console output for local debugging
[sinks.logs_console]
inputs = ["logs_enrich"]
target = "stdout"
type = "console"

[sinks.logs_console.encoding]
codec = "json"

# File sink for local log persistence
[sinks.logs_file]
type = "file"
inputs = ["logs_enrich"]
path = "tmp/vector-logs.log"

[sinks.logs_file.encoding]
codec = "json"

# OpenObserve OTLP HTTP sink for production log storage
[sinks.logs_openobserve]
type = "http"
inputs = ["logs_enrich"]
uri = "${OPENOBSERVE_URL:-http://localhost:5080}/api/${OPENOBSERVE_ORG:-default}/v1/logs"
method = "post"

[sinks.logs_openobserve.encoding]
codec = "json"

[sinks.logs_openobserve.auth]
strategy = "basic"
user = "${OPENOBSERVE_USER:-root@example.com}"
password = "${OPENOBSERVE_TOKEN:-dummy-token-for-validation}"

[sinks.logs_openobserve.request]
timeout_secs = 30
retry_attempts = 3

  [sinks.logs_openobserve.request.headers]
  "Content-Type" = "application/json"

```

Run a syntax check at any time:

```bash
vector validate ops/vector/vector.toml
```

---

## 8. Logfire Integration

Phase 3 (DEV-PRD-018 · DEV-SDS-018 · DEV-PRD-021) extends the logging pipeline so Logfire spans,
logs, and dashboards stay in lockstep with template output and Vector runtime behavior.

### 8.1 Pipeline Additions

- `transforms.logs_redact_pii` now imports the shared VRL program at `tools/vector/macros.vrl`
  so traces and logs reuse the same redaction rules.
- `transforms.logs_logfire_normalize` projects Logfire OTLP attributes (`logfire.trace_id`,
  `logfire.span_id`, `logfire.observation_id`, etc.) into the canonical `trace_id`, `span_id`, and
  `observation_id` fields consumed by sinks and dashboards.
- Trace sanitization pulls the same macros via `tools/vector/traces_sanitize.vrl`, preventing
  divergence between span and log scrubbing logic.

### 8.2 Shared VRL Macros

The macro program distinguishes log vs trace events—masking sensitive values for logs while
removing the same keys from trace payloads. Update the macro file whenever you introduce new
PII-carrying attributes.

```
tools/vector/macros.vrl
tools/vector/traces_sanitize.vrl
```

### 8.3 Verification Playbooks

Run these guardrails before shipping Logfire or Vector changes:

```bash
bash tests/ops/test_vector_logfire.sh      # Validates normalization + macros wiring
just test-logs                             # Full log pipeline regression suite
just docs-lint                             # Ensures docs + template snippets stay in sync
```

### 8.4 Documentation & Template Sync

- `docs/observability/README.md` (this guide) captures the integration details and validation flow.
- `docs/ENVIRONMENT.md` documents local/CI environment variables for Logfire.
- `templates/{{project_slug}}/docs/observability/logging.md.j2` ensures generated projects inherit
  the same workflow.
- `docs/observability/dashboards/logfire.json` defines the OpenObserve panels for Logfire metrics.
- `tools/observability/schema.json` documents the metrics taxonomy (`logfire.span.duration`, etc.).
- `ops/openobserve/docker-compose.yml` + `just observe-openobserve-up` spin up a local OpenObserve
  instance when you need a real OTLP target.

Keep all three aligned when introducing new metadata, macros, or transforms.

### 8.5 Python FastAPI Integration

**Status**: ✅ Complete (Cycle 1 Phase 1B)

Python services use the **Logfire SDK** for automatic FastAPI instrumentation and structured logging with full trace-log correlation.

#### Installation

```bash
pip install logfire opentelemetry-exporter-otlp-proto-http
```

Or add to your `pyproject.toml`:

```toml
[project.dependencies]
logfire = "^0.50.0"
opentelemetry-exporter-otlp-proto-http = "^1.27.0"
```

#### Basic Setup

```python
from fastapi import FastAPI
from libs.python.vibepro_logging import bootstrap_logfire

# Create and instrument FastAPI app
app = bootstrap_logfire(
    FastAPI(title="User API"),
    service="user-api"
)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/users")
def create_user(user: UserCreate):
    return {"id": "user-123", "email": user.email}
```

The `bootstrap_logfire()` function:

- Configures Logfire with OTLP export to Vector (localhost:4318)
- Instruments FastAPI to emit spans for every HTTP request
- Binds metadata: `service`, `environment`, `application_version`
- Returns the app for method chaining

#### Structured Logging with Trace Correlation

```python
from libs.python.vibepro_logging import get_logger, LogCategory

# Get logger with category
logger = get_logger(category=LogCategory.APP)

@app.post("/users")
def create_user(user: UserCreate):
    # Log with automatic trace_id/span_id correlation
    logger.info(
        "Creating user",
        user_email_hash=hash(user.email),
        user_role=user.role
    )

    # Business logic here
    created_user = create_user_in_db(user)

    logger.info("User created successfully", user_id=created_user.id)

    return created_user
```

**Automatic trace-log correlation**: Every log emitted within an active span automatically includes:

- `trace_id` - Links log to request trace
- `span_id` - Links log to specific operation
- `service` - Service name (from SERVICE_NAME env var)
- `environment` - Environment (from APP_ENV)
- `application_version` - Version (from APP_VERSION)

#### Log Categories

Use `LogCategory` enum to organize logs by purpose:

```python
from libs.python.vibepro_logging import LogCategory

app_logger = get_logger(category=LogCategory.APP)        # Application logs
audit_logger = get_logger(category=LogCategory.AUDIT)    # Audit trail
security_logger = get_logger(category=LogCategory.SECURITY)  # Security events

# Application logging
app_logger.info("Processing payment", amount=100.00)

# Audit logging
audit_logger.info("User action", user_id="user-123", action="delete_account")

# Security logging
security_logger.warn("Failed login attempt", ip_address="192.168.1.1")
```

#### Custom Metadata Binding

Bind request-specific metadata to a logger instance:

```python
from libs.python.vibepro_logging import get_logger, LogCategory

@app.get("/orders/{order_id}")
def get_order(order_id: str, request: Request):
    # Create logger with request metadata
    logger = get_logger(
        category=LogCategory.APP,
        request_id=request.headers.get("X-Request-ID"),
        user_id=request.state.user_id,
        order_id=order_id
    )

    logger.info("Fetching order")  # Includes request_id, user_id, order_id

    order = fetch_order(order_id)

    logger.info("Order fetched", order_status=order.status)

    return order
```

#### Environment Configuration

Configure via environment variables:

```bash
export SERVICE_NAME=user-api
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
export OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf
export APP_ENV=staging
export APP_VERSION=v1.2.3
```

**Defaults** (when env vars not set):

- `SERVICE_NAME` → `vibepro-py`
- `APP_ENV` → `local`
- `APP_VERSION` → `dev`
- `OTEL_EXPORTER_OTLP_ENDPOINT` → `http://localhost:4318`

#### Integration with Vector

Logfire sends telemetry to Vector via OTLP HTTP:

```
Python FastAPI App
  ↓ (Logfire SDK)
OTLP HTTP → localhost:4318
  ↓ (Vector source: otlp.http)
Vector Pipeline
  ↓ (PII redaction, sampling, enrichment)
OpenObserve / stdout
```

Verify integration:

```bash
# Start Vector
just observe-start

# Run your FastAPI app
VIBEPRO_OBSERVE=1 python -m uvicorn main:app --port 8000

# Send test request
curl -X GET http://localhost:8000/health

# Check Vector logs (should show OTLP data received)
tail -f tmp/vector.log
```

#### Testing

Run the complete test suite:

```bash
# Unit tests (26 tests)
python -m pytest tests/python/logging/ -v

# Integration test (Vector ← Logfire)
bash tests/ops/test_vector_logfire.sh

# All observability tests
just observe-test-all
```

#### Example Application

See `apps/python-test-service/` for a complete FastAPI application demonstrating:

- Bootstrap pattern
- Structured logging
- Trace-log correlation
- Error tracking
- Custom metadata binding

#### Troubleshooting

**Logs not appearing in Vector**:

1. Check Vector is running: `just observe-status`
2. Verify OTLP endpoint: `echo $OTEL_EXPORTER_OTLP_ENDPOINT`
3. Check Vector config: `just observe-validate`
4. Enable debug logging: `LOGFIRE_LOG_LEVEL=debug python -m uvicorn main:app`

**Missing trace_id in logs**:

- Ensure logging happens within an HTTP request handler (active span)
- For background tasks, manually create spans:
    ```python
    with logfire.span("background_task"):
        logger.info("Processing")  # Now has trace_id
    ```

**PII leakage concerns**:

- Vector automatically redacts PII via `transforms.logs_redact_pii`
- Add custom patterns in `tools/vector/macros.vrl`
- Test with: `bash tests/ops/test_vector_pii_redaction.sh`

#### References

**Specifications**:

- DEV-PRD-018: Structured Logging with Trace Correlation
- DEV-SDS-018: Logfire SDK Integration
- DEV-ADR-017: JSON-First Structured Logging

**Implementation**:

- `libs/python/vibepro_logging.py` - Logfire SDK wrapper
- `tests/python/logging/` - Test suite (26 tests)
- `tests/ops/test_vector_logfire.sh` - Integration test

**Documentation**:

- `templates/{{project_slug}}/docs/observability/logging.md.j2` - Generated project docs
- `docs/work-summaries/cycle1-phase1b-green-completion.md` - Implementation report

---

## 9. Feature Flags & Runtime Control

### 9.1 VIBEPRO_OBSERVE Flag

The observability stack uses a **runtime feature flag** to control span export behavior:

| Environment Variable         | Behavior                                                                  |
| :--------------------------- | :------------------------------------------------------------------------ |
| `VIBEPRO_OBSERVE=1`          | **Enabled**: Spans exported to OTLP endpoint (requires `--features otlp`) |
| `VIBEPRO_OBSERVE=0` or unset | **Disabled**: JSON logs only, no OTLP export                              |

### 9.2 Cargo Feature Flags

The `vibepro-observe` crate uses compile-time feature flags:

```toml
# Cargo.toml - Enable OTLP export capability
[dependencies]
vibepro-observe = { version = "0.1", features = ["otlp"] }

# Or minimal (logs only, no OTLP)
vibepro-observe = "0.1"
```

### 9.3 Usage Patterns

**Development (OTLP disabled)**:

```bash
# Logs to stdout in JSON format, no network export
cargo run
```

**Development (OTLP enabled)**:

```bash
# Export spans to local Vector instance
VIBEPRO_OBSERVE=1 cargo run --features otlp
```

**Production**:

```bash
# Controlled via environment variable in deployment config
# Dockerfile, Kubernetes manifests, etc. set VIBEPRO_OBSERVE=1
```

### 9.4 Testing Feature Flag Behavior

```bash
# Test feature flag implementation
just observe-test-flag

# Or manually:
bash tests/ops/test_observe_flag.sh
```

Verifies:

- ✅ Flag logic present in `lib.rs`
- ✅ Feature gates properly configured
- ✅ Tests pass with and without `otlp` feature
- ✅ Documentation references exist

### 9.5 Decision Tree

```
Is OTLP needed?
├─ No → Use default: vibepro-observe = "0.1"
│       Run with: cargo run
│       Output: JSON logs to stdout
│
└─ Yes → Add feature: vibepro-observe = { version = "0.1", features = ["otlp"] }
         ├─ Development: VIBEPRO_OBSERVE=1 cargo run --features otlp
         ├─ CI/CD: Set VIBEPRO_OBSERVE=1 in workflow environment
         └─ Production: Set VIBEPRO_OBSERVE=1 in deployment config
```

---

## 10. Common Just Targets

| Command                  | Description                                                      |
| :----------------------- | :--------------------------------------------------------------- |
| `just observe-start`     | Run Vector locally with current config                           |
| `just observe-verify`    | Send a synthetic test trace and confirm ingestion                |
| `just observe-test-flag` | Test feature flag implementation (Phase 6)                       |
| `just observe-logs`      | Tail Vector logs for debugging                                   |
| `just observe-stop`      | Gracefully stop Vector process                                   |
| `just doctor`            | Show active versions, OTLP endpoint, and observation flag status |

---

## 11. Troubleshooting

| Symptom                            | Diagnosis                                     | Resolution                                       |
| :--------------------------------- | :-------------------------------------------- | :----------------------------------------------- |
| `vector validate` fails            | Invalid TOML / VRL syntax                     | Run `vector validate` locally; fix and re-commit |
| No spans in OpenObserve            | Missing `VIBEPRO_OBSERVE=1` or wrong endpoint | Export flag + check `.secrets.env.sops`          |
| 401 Unauthorized                   | Expired or missing token                      | Rotate via SOPS and re-encrypt                   |
| High CPU usage                     | Sampling too low / debug mode on              | Increase sampling rate or disable debug          |
| CI failure “Vector config invalid” | Config or syntax drift                        | Update pipeline config & rerun tests             |

---

## 12. Example Query Recipes (OpenObserve SQL)

| Use Case                    | Query                                                                                   |
| :-------------------------- | :-------------------------------------------------------------------------------------- |
| Error rate by service       | `SELECT service.name, count(*) FROM traces WHERE status='error' GROUP BY service.name;` |
| Latency distribution        | `SELECT histogram(duration_ms,10) FROM traces WHERE service.name='api';`                |
| High-value span correlation | `SELECT trace_id, span_id, attributes.user_id FROM traces WHERE duration_ms > 1000;`    |

---

## 13. Governance & Cost Controls

- **Sampling:** Defined in `vector.toml` (reduce noise).
- **Redaction:** Apply VRL transforms to mask PII.
- **Retention:** Managed in OpenObserve (default 90 days).
- **Access:** Tokens managed via SOPS; distribution controlled per-environment.

### Logging Retention Policy

> **Specification References:** DEV-ADR-017, DEV-PRD-018, DEV-SDS-018

**Logs vs. Traces:**

- **Logs:** 14–30 days retention (higher volume, lower retention cost)
- **Traces:** 30–90 days retention (lower volume, higher analytical value)

Configure separate OpenObserve streams/indices:

- `vibepro-logs-prod` (30-day retention)
- `vibepro-traces-prod` (90-day retention)

**Cost optimization:**

- Logs are more verbose → shorter retention
- Traces enable deep debugging → longer retention
- Use `category` field to route critical logs to longer retention if needed

---

## 13.5. Structured Logging Policy & Examples

> **Specification References:** DEV-ADR-017, DEV-PRD-018, DEV-SDS-018

VibePro implements **structured, trace-aware logging** across all languages (Rust, Node, Python) with automatic PII redaction and correlation.

### Core Logging Principles

**1. JSON-First Format:**

- All logs MUST be emitted as JSON (machine-parseable)
- No printf-style logs in production code
- Consistent schema across Rust, Node.js, and Python

**2. Trace Correlation:**

- Every log line includes `trace_id` and `span_id`
- Enables correlation between logs and distributed traces
- Full request lifecycle visibility in OpenObserve

**3. PII Protection:**

- Never log raw PII (email, phone, IP addresses, auth tokens)
- Use hashed identifiers: `user_id_hash`, `client_ip_hash`
- Vector redacts accidental PII at the edge before storage
- Redaction rules in `ops/vector/vector.toml` → `transforms.logs_redact_pii`

**4. Log Levels:**

- `error` – Actionable failures requiring immediate investigation
- `warn` – Degraded behavior, potential issues
- `info` – Normal operational events (default)
- `debug` – Detailed diagnostic information (disabled in production by default)
- ❌ **No `trace` level** – use tracing spans for fine-grained instrumentation

**5. Log Categories:**

- `app` – General application logs (default)
- `audit` – User actions requiring compliance tracking
- `security` – Auth failures, rate limiting, suspicious activity
- Use the `category` field to distinguish types, not log levels

### Language-Specific Examples

#### Rust (via `tracing` crate)

```rust
use tracing::{info, warn, error};

// App log with category
info!(category = "app", user_id_hash = "abc123", "request accepted");

// Security warning
warn!(
    category = "security",
    action = "rate_limit",
    client_ip_hash = "192.168.1.1",
    "client throttled"
);

// Error with code
error!(category = "app", code = 500, "upstream timeout");
```

#### Node.js (via `pino`)

Library: `libs/node-logging/logger.js`

```javascript
const { logger } = require('@vibepro/node-logging/logger');
const log = logger('my-service');

// App log
log.info(
    {
        category: 'app',
        user_id_hash: 'abc123',
        trace_id: req.traceId,
        span_id: req.spanId,
    },
    'request accepted',
);

// Security warning
log.warn(
    {
        category: 'security',
        action: 'rate_limit',
        client_ip_hash: hashIP(req.ip),
    },
    'client throttled',
);

// Error log
log.error(
    {
        category: 'app',
        code: 500,
        error: 'ECONNREFUSED',
    },
    'upstream timeout',
);
```

#### Python (via Logfire)

Library: `libs/python/vibepro_logging.py`

```python
import logfire

from libs.python.vibepro_logging import LogCategory, configure_logger

logger = configure_logger('my-service')

with logfire.span('request', route='/users'):
    logger.info('request accepted', category=LogCategory.APP, user_id_hash='abc123')
    logger.warn('client throttled', category=LogCategory.SECURITY, action='rate_limit')
    logger.error('upstream timeout', category=LogCategory.APP, code=500)
```

### Required Log Fields

**Mandatory (every log line):**

- `timestamp` (ISO 8601)
- `level` (error|warn|info|debug)
- `message` or `event`
- `service` (e.g., "user-api", "billing-service")
- `environment` (local|dev|staging|prod)
- `application_version` (semver or git SHA)
- `category` (app|audit|security)

**Contextual (when available):**

- `trace_id` – OpenTelemetry trace ID
- `span_id` – Current span ID
- `user_id_hash` – Hashed user identifier (never raw ID)
- `client_ip_hash` – Hashed IP address (never raw IP)
- `duration_ms` – Operation timing
- `status` – HTTP status code
- `error` – Error type or code
- `action` – Specific action (e.g., "login", "rate_limit")

### Vector Configuration for Logs

See `ops/vector/vector.toml`:

**OTLP Logs Source:**

```toml
[sources.otel_logs]
type = "opentelemetry"
address = "0.0.0.0:4318"  # OTLP/HTTP for logs
protocols = ["logs"]
```

**PII Redaction Transform:**

```toml
[transforms.logs_redact_pii]
type = "remap"
inputs = ["otel_logs"]
source = '''
  if exists(.attributes.user_email) { .attributes.user_email = "[REDACTED]" }
  if exists(.attributes.authorization) { .attributes.authorization = "[REDACTED]" }
'''
```

**Enrichment Transform:**

```toml
[transforms.logs_enrich]
type = "remap"
inputs = ["logs_redact_pii"]
source = '''
  .service = .attributes.service ?? "unknown"
  .environment = .attributes.environment ?? "local"
  .application_version = .attributes.application_version ?? "dev"
'''
```

**OpenObserve Sink:**

```toml
[sinks.logs_otlp]
type = "opentelemetry"
inputs = ["logs_enrich"]
endpoint = "${OPENOBSERVE_URL}"
auth = { strategy = "bearer", token = "${OPENOBSERVE_TOKEN}" }
```

### Testing the Logging Pipeline

**Quick-start examples:**

```bash
# Rust
cargo run --manifest-path apps/observe-smoke/Cargo.toml

# Node.js
node tools/logging/pino-quickstart.js

# Python
python3 tools/logging/logfire-quickstart.py
```

**Validation tests:**

```bash
# Test Vector logs configuration
sh -eu tests/ops/test_vector_logs_config.sh

# Test PII redaction transforms
sh -eu tests/ops/test_log_redaction.sh

# Test log-trace correlation
sh -eu tests/ops/test_log_trace_correlation.sh

# Run all logging tests
just test-logs  # Includes Logfire bootstrap smoke coverage
```

### OpenObserve Setup for Logs

1. **Create separate streams:**
    - `vibepro-logs-{env}` for application logs
    - `vibepro-traces-{env}` for distributed traces

2. **Configure retention:**
    - Logs: 14–30 days (higher volume)
    - Traces: 30–90 days (lower volume, higher value)

3. **Set up alerts:**
    - `category="security"` AND `level="warn"`
    - `code=500` AND `environment="prod"`
    - `action="auth_failure"` rate threshold

4. **Create dashboards:**
    - Error rate by service
    - Security events timeline
    - Request latency (p50, p95, p99) from logs
    - Log volume by category

### Querying Logs with Traces

**Find all logs for a specific trace:**

```sql
SELECT timestamp, level, message, attributes
FROM vibepro_logs_prod
WHERE trace_id = '4bf92f3577b34da6a3ce929d0e0e4736'
ORDER BY timestamp ASC;
```

**Correlate high-latency requests with errors:**

```sql
SELECT l.trace_id, l.message, t.duration_ms
FROM vibepro_logs_prod l
JOIN vibepro_traces_prod t ON l.trace_id = t.trace_id
WHERE t.duration_ms > 1000 AND l.level = 'error';
```

**Security events by category:**

```sql
SELECT timestamp, attributes.action, attributes.user_id_hash
FROM vibepro_logs_prod
WHERE category = 'security'
ORDER BY timestamp DESC
LIMIT 100;
```

### Troubleshooting Logging

**Logs not appearing in OpenObserve:**

1. Verify Vector is running: `just observe-start`
2. Check Vector logs: `just observe-logs`
3. Test OTLP endpoint: `nc -zv 127.0.0.1 4318`
4. Validate Vector config: `vector validate ops/vector/vector.toml`

**PII appearing in logs:**

1. Add redaction rules to `transforms.logs_redact_pii`
2. Use `*_hash` suffixes for sensitive fields
3. Never log raw: emails, IPs, tokens, passwords

**Missing trace correlation:**

1. Ensure OpenTelemetry context propagation is enabled
2. Verify `trace_id` and `span_id` are injected from active span
3. Check language-specific logger configuration

**Performance impact:**

- JSON logging overhead: ~2-5% vs printf
- Use `debug` level sparingly in hot paths
- Vector handles sampling/filtering at the edge
- Consider async logging in high-throughput services

---

**Logfire Integration (Phase 3)**

This phase integrates `logfire` into the observability pipeline, providing a unified solution for tracing and logging in Python applications.

- **`vibepro_logging` Library:** A dedicated library (`libs/python/vibepro_logging.py`) provides helper functions to configure `logfire` and instrument common Python libraries.
- **`vector.toml` Updates:** The Vector configuration has been updated to process `logfire`'s OTLP output, including normalization of trace and span IDs, and PII redaction.
- **Testing:** The `tests/python/test_logfire_bootstrap.py` and `tests/python/test_logfire_integrations.py` files provide a suite of tests to validate the `logfire` integration.

## 14. Temporal AI Pattern Analytics

### 14.1 Overview

The **Temporal AI recommendation engine** integrates with OpenObserve to track pattern performance metrics in real-time. This enables data-driven insights into which development patterns are most successful and helps identify problematic patterns early.

**Key Metrics**:

- **Success Rate**: Percentage of successful pattern recommendations (1.0 - error_rate)
- **Error Rate**: Percentage of failed recommendations
- **Latency**: Average recommendation response time (milliseconds)
- **Usage**: Number of times each pattern is recommended

### 14.2 Dashboard

Access the Temporal AI analytics dashboard:

**Local**: `http://localhost:5080/dashboards/temporal-ai-patterns`  
**Production**: `${OPENOBSERVE_URL}/dashboards/temporal-ai-patterns`

**Dashboard Panels**:

1. **Pattern Success Rate Overview** - Time series showing success rate trends
2. **Success Rate Distribution** - Histogram of patterns by success rate
3. **Recommendation Volume** - Total recommendations over time
4. **Low Success Rate Patterns** - Table of problematic patterns
5. **Performance by Latency** - Scatter plot correlating latency and success
6. **Error Rate Trends** - Time series with threshold alerts

**Dashboard Variables**:

- `time_range` - Select time window (1h, 6h, 24h, 7d, 30d)
- `min_success_rate` - Filter patterns below threshold (default: 0.5)

### 14.3 Alerts

Three alert rules monitor pattern performance and send email notifications:

#### Alert 1: Low Success Rate (Warning)

- **Trigger**: Success rate < 50% with >10 recommendations
- **Frequency**: Every 5 minutes
- **Severity**: Warning
- **Action**: Review pattern implementation

#### Alert 2: Critical Success Drop (Critical)

- **Trigger**: Success rate < 30% with >5 recommendations
- **Frequency**: Every 1 minute (real-time)
- **Severity**: Critical
- **Action**: Immediate investigation required

#### Alert 3: High Error Rate Spike (Warning)

- **Trigger**: Error rate > 40%
- **Frequency**: Every 2 minutes
- **Severity**: Warning
- **Action**: Check for recent code changes

**Configure Email Notifications**:

Edit `ops/openobserve/alerts/destinations.json` and set `ALERT_EMAIL` environment variable:

```bash
export ALERT_EMAIL=team@example.com
```

### 14.4 Metrics Refresh Workflow

Pattern metrics are **not auto-refreshed**. Update metrics manually or via cron:

**Manual Refresh**:

```bash
# Refresh metrics from last 7 days
just temporal-ai-refresh-metrics DAYS=7
```

**Automated Refresh** (optional):

```bash
# Add to crontab for daily refresh at 2 AM
0 2 * * * cd /path/to/VibesPro && just temporal-ai-refresh-metrics DAYS=7
```

**How It Works**:

1. Vector sends recommendation telemetry to OpenObserve
2. OpenObserve stores events in `temporal_ai_recommendations` stream
3. `temporal-ai refresh-metrics` queries OpenObserve SQL API
4. Metrics are calculated and stored in local `redb` database
5. Recommendations include success rate in scoring (15% weight)

### 14.5 Setup Instructions

**1. Start Local OpenObserve**:

```bash
just temporal-ai-observe-start
```

**2. Import Dashboard**:

```bash
# Via API
curl -X POST http://localhost:5080/api/default/dashboards \
  -H "Authorization: Basic $(echo -n root@example.com:password | base64)" \
  -d @ops/openobserve/dashboards/temporal-ai-patterns.json

# Or via UI: Settings → Dashboards → Import → Upload JSON
```

**3. Configure Alerts**:

```bash
# Import all alerts
for alert in ops/openobserve/alerts/temporal-ai-*.json; do
  curl -X POST http://localhost:5080/api/default/alerts \
    -H "Authorization: Basic $(echo -n root@example.com:password | base64)" \
    -d @"$alert"
done

# Configure email destination
curl -X POST http://localhost:5080/api/default/destinations \
  -H "Authorization: Basic $(echo -n root@example.com:password | base64)" \
  -d @ops/openobserve/alerts/destinations.json
```

**4. Verify Setup**:

```bash
# Refresh metrics
just temporal-ai-refresh-metrics DAYS=7

# Query patterns (should show success rates)
just temporal-ai-query "test pattern" TOP=5

# Check dashboard
open http://localhost:5080/dashboards/temporal-ai-patterns
```

### 14.6 Troubleshooting

**No metrics appearing in dashboard**:

1. Verify OpenObserve is running: `curl http://localhost:5080/healthz`
2. Check Vector is sending data: `tail -f tmp/vector-traces.log`
3. Verify stream exists: `curl http://localhost:5080/api/default/streams`
4. Check credentials: `sops -d .secrets.env.sops | grep OPENOBSERVE`

**Stale metrics in recommendations**:

- Metrics are refreshed manually via `just temporal-ai-refresh-metrics`
- Set up cron job for automatic refresh (see 14.4)
- Check last refresh time in database: `just temporal-ai-stats`

**Alerts not triggering**:

1. Verify alert is enabled in OpenObserve UI
2. Check email destination is configured
3. Test SMTP settings in OpenObserve
4. Review alert logs: `curl http://localhost:5080/api/default/alerts/logs`

**Dashboard queries failing**:

- Ensure `temporal_ai_recommendations` stream exists
- Verify data is being ingested: check Vector logs
- Test SQL query manually in OpenObserve UI
- Check time range filter matches data availability

### 14.7 SQL Query Examples

**Find low-performing patterns**:

```sql
SELECT pattern_id, success_rate, error_rate, recommendation_count
FROM temporal_ai_recommendations
WHERE success_rate < 0.6
ORDER BY success_rate ASC
LIMIT 10;
```

**Success rate trend over time**:

```sql
SELECT
  time_bucket('1h', timestamp) as hour,
  AVG(success_rate) as avg_success_rate
FROM temporal_ai_recommendations
WHERE timestamp >= now() - interval '7 days'
GROUP BY hour
ORDER BY hour;
```

**Patterns with high latency**:

```sql
SELECT pattern_id, avg_latency_ms, success_rate
FROM temporal_ai_recommendations
WHERE avg_latency_ms > 100
ORDER BY avg_latency_ms DESC;
```

### 14.8 References

**Configuration Files**:

- Dashboard: `ops/openobserve/dashboards/temporal-ai-patterns.json`
- Alerts: `ops/openobserve/alerts/temporal-ai-*.json`
- Email Destination: `ops/openobserve/alerts/destinations.json`

**Documentation**:

- Temporal AI README: `crates/temporal-ai/README.md`
- Implementation Plan: `.gemini/antigravity/brain/.../implementation_plan.md`

**Specifications**:

- DEV-PRD-032: AI Workflow PRD
- DEV-SDS-020: AI Guidance SDS
- DEV-ADR-018: AI Workflow ADR

---

## 15. References

- [DEV-ADR-016](../dev_adr.md) — Architecture Decision
- [DEV-SDS-017](../dev_sds.md) — System Design Specification
- [DEV-PRD-017](../dev_prd.md) — Product Requirement
- [dev_tdd_observability.md](../dev_tdd_observability.md) — TDD Phase Plan
- [Vector Documentation](https://vector.dev/docs)
- [OpenObserve Docs](https://openobserve.ai/docs)
- [Tokio Tracing Crate](https://github.com/tokio-rs/tracing)

---

## 15. Exit Criteria

✅ `just observe-start` and `just observe-verify` both succeed.
✅ `vector validate` passes locally and in CI.
✅ OpenObserve dashboard shows live traces from staging.
✅ Redaction verified by test span inspection.
✅ Docs, ADR, SDS, PRD cross-linked and published.
