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
[sources.otel_traces]
type = "opentelemetry"
address = "0.0.0.0:4317"

[transforms.redact_email]
type = "remap"
inputs = ["otel_traces"]
source = '''
  .user_email = replace(.user_email, r"[^@]+@[^@]+", "[REDACTED]")
  .application_version = "v0.9.0"
  .host = get_hostname!()
'''

[sinks.otlp]
type = "opentelemetry"
inputs = ["redact_email"]
endpoint = "${OPENOBSERVE_URL}"
auth     = { strategy = "bearer", token = "${OPENOBSERVE_TOKEN}" }
```

Run a syntax check at any time:

```bash
vector validate ops/vector/vector.toml
```

---

## 8. Feature Flags & Runtime Control

### 8.1 VIBEPRO_OBSERVE Flag

The observability stack uses a **runtime feature flag** to control span export behavior:

| Environment Variable | Behavior |
|:---------------------|:---------|
| `VIBEPRO_OBSERVE=1` | **Enabled**: Spans exported to OTLP endpoint (requires `--features otlp`) |
| `VIBEPRO_OBSERVE=0` or unset | **Disabled**: JSON logs only, no OTLP export |

### 8.2 Cargo Feature Flags

The `vibepro-observe` crate uses compile-time feature flags:

```toml
# Cargo.toml - Enable OTLP export capability
[dependencies]
vibepro-observe = { version = "0.1", features = ["otlp"] }

# Or minimal (logs only, no OTLP)
vibepro-observe = "0.1"
```

### 8.3 Usage Patterns

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

### 8.4 Testing Feature Flag Behavior

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

### 8.5 Decision Tree

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

## 9. Common Just Targets

| Command               | Description                                                      |
| :-------------------- | :--------------------------------------------------------------- |
| `just observe-start`  | Run Vector locally with current config                           |
| `just observe-verify` | Send a synthetic test trace and confirm ingestion                |
| `just observe-test-flag` | Test feature flag implementation (Phase 6)                    |
| `just observe-logs`   | Tail Vector logs for debugging                                   |
| `just observe-stop`   | Gracefully stop Vector process                                   |
| `just doctor`         | Show active versions, OTLP endpoint, and observation flag status |

---

## 9. Troubleshooting

| Symptom                            | Diagnosis                                     | Resolution                                       |
| :--------------------------------- | :-------------------------------------------- | :----------------------------------------------- |
| `vector validate` fails            | Invalid TOML / VRL syntax                     | Run `vector validate` locally; fix and re-commit |
| No spans in OpenObserve            | Missing `VIBEPRO_OBSERVE=1` or wrong endpoint | Export flag + check `.secrets.env.sops`          |
| 401 Unauthorized                   | Expired or missing token                      | Rotate via SOPS and re-encrypt                   |
| High CPU usage                     | Sampling too low / debug mode on              | Increase sampling rate or disable debug          |
| CI failure “Vector config invalid” | Config or syntax drift                        | Update pipeline config & rerun tests             |

---

## 10. Example Query Recipes (OpenObserve SQL)

| Use Case                    | Query                                                                                   |
| :-------------------------- | :-------------------------------------------------------------------------------------- |
| Error rate by service       | `SELECT service.name, count(*) FROM traces WHERE status='error' GROUP BY service.name;` |
| Latency distribution        | `SELECT histogram(duration_ms,10) FROM traces WHERE service.name='api';`                |
| High-value span correlation | `SELECT trace_id, span_id, attributes.user_id FROM traces WHERE duration_ms > 1000;`    |

---

## 11. Governance & Cost Controls

* **Sampling:** Defined in `vector.toml` (reduce noise).
* **Redaction:** Apply VRL transforms to mask PII.
* **Retention:** Managed in OpenObserve (default 90 days).
* **Access:** Tokens managed via SOPS; distribution controlled per-environment.

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

## 11.5. Structured Logging Policy & Examples

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
        span_id: req.spanId
    },
    'request accepted'
);

// Security warning
log.warn(
    {
        category: 'security',
        action: 'rate_limit',
        client_ip_hash: hashIP(req.ip)
    },
    'client throttled'
);

// Error log
log.error(
    {
        category: 'app',
        code: 500,
        error: 'ECONNREFUSED'
    },
    'upstream timeout'
);
```

#### Python (via `structlog`)

Library: `libs/python/vibepro_logging.py`

```python
from libs.python.vibepro_logging import configure_logger

log = configure_logger('my-service')

# App log
log.info(
    "request accepted",
    category="app",
    user_id_hash="abc123",
    trace_id=trace_context.trace_id,
    span_id=trace_context.span_id
)

# Security warning
log.warning(
    "client throttled",
    category="security",
    action="rate_limit",
    client_ip_hash=hash_ip(request.remote_addr)
)

# Error log
log.error(
    "upstream timeout",
    category="app",
    code=500,
    error="ECONNREFUSED"
)
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
python3 tools/logging/structlog-quickstart.py
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
just test:logs
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

## 12. References

* [DEV-ADR-016](../dev_adr.md) — Architecture Decision
* [DEV-SDS-017](../dev_sds.md) — System Design Specification
* [DEV-PRD-017](../dev_prd.md) — Product Requirement
* [dev_tdd_observability.md](../dev_tdd_observability.md) — TDD Phase Plan
* [Vector Documentation](https://vector.dev/docs)
* [OpenObserve Docs](https://openobserve.ai/docs)
* [Tokio Tracing Crate](https://github.com/tokio-rs/tracing)

---

## 13. Exit Criteria

✅ `just observe-start` and `just observe-verify` both succeed.
✅ `vector validate` passes locally and in CI.
✅ OpenObserve dashboard shows live traces from staging.
✅ Redaction verified by test span inspection.
✅ Docs, ADR, SDS, PRD cross-linked and published.
