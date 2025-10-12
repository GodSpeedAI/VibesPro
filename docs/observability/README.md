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

## 8. Common Just Targets

| Command               | Description                                                      |
| :-------------------- | :--------------------------------------------------------------- |
| `just observe-start`  | Run Vector locally with current config                           |
| `just observe-verify` | Send a synthetic test trace and confirm ingestion                |
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
