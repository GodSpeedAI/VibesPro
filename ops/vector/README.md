# `ops/vector/README.md`

## 1. Purpose

Operational guide for the **Vector** edge collector used in VibePro’s Rust-native observability pipeline (**DEV-ADR-016**, **DEV-SDS-017**, **DEV-PRD-017**).
Vector receives **OTLP** traffic from services, performs **sampling/redaction/enrichment**, and forwards to **OpenObserve**.

---

## 2. Topology & Ports

```
 ┌────────────────────────────┐
 │ VibePro service (Rust)     │
 │ tracing → OTLP exporter    │
 └──────────────┬─────────────┘
                │ OTLP gRPC (4317) / OTLP HTTP (4318)
                ▼
 ┌────────────────────────────┐
 │ Vector (host binary)       │
 │ sources.otel_*             │
 │ transforms.*  (VRL)        │
 │ sinks.otlp  → OpenObserve  │
 └──────────────┬─────────────┘
                │ HTTPS OTLP
                ▼
      OpenObserve (ingestion)
```

**Defaults**

- **4317** → OTLP/gRPC (preferred)
- **4318** → OTLP/HTTP
- Outbound: HTTPS to `${OPENOBSERVE_URL}` with bearer `${OPENOBSERVE_TOKEN}`

---

## 3. Key Files

| Path                     | Purpose                                                          |
| :----------------------- | :--------------------------------------------------------------- |
| `ops/vector/vector.toml` | Vector configuration (sources → transforms → sinks)              |
| `Justfile`               | `observe:start`, `observe:verify`, `observe:logs` targets        |
| `.secrets.env.sops`      | `OPENOBSERVE_URL`, `OPENOBSERVE_TOKEN`, optional `OTLP_ENDPOINT` |

---

## 4. Quickstart

### 4.1 Local run

```bash
devbox shell
mise install
just observe:start
```

Expected log (Vector):

```
listening on 0.0.0.0:4317
```

### 4.2 Send a test span

```bash
export VIBEPRO_OBSERVE=1
export OTLP_ENDPOINT=http://127.0.0.1:4317
just observe:smoke:otlp     # or: cargo run --features otlp --manifest-path apps/observe-smoke/Cargo.toml
```

### 4.3 End-to-end verify

```bash
just observe:verify
```

---

## 5. Validation & CI

- **Local syntax check**

    ```bash
    vector validate ops/vector/vector.toml
    ```

- **CI**: `.github/workflows/env-check.yml` runs `vector validate` and the smoke test:

    ```yaml
    - name: Validate Vector config
      run: vector validate ops/vector/vector.toml

    - name: Ops smoke test (stdout + OTLP)
      run: sh -eu tests/ops/test_observe_smoke.sh
    ```

---

## 6. VRL Recipes (copy-ready)

> Place under `[transforms.*]` blocks in `vector.toml`. Chain with `inputs = ["previous_stage"]`.

### 6.1 Tail-biased sampling (keep slow/error traces)

```toml
[transforms.sample_slow_or_error]
type    = "sample"
inputs  = ["otel_traces"]
rate    = 0.20                          # keep 20% baseline
condition = '''
  .status == "error" || (exists(.attributes.duration_ms) && to_int!(.attributes.duration_ms) > 500)
'''
```

### 6.2 PII redaction (emails, tokens)

```toml
[transforms.redact_pii]
type   = "remap"
inputs = ["sample_slow_or_error"]
source = '''
  if exists(.user_email) { .user_email = replace!(.user_email, r"[^@]+@[^@]+", "[REDACTED]") }
  if exists(.headers.authorization) { .headers.authorization = "[REDACTED]" }
  if exists(.attributes.api_key) { .attributes.api_key = "[REDACTED]" }
'''
```

### 6.3 Static enrichment (host, app version, env)

```toml
[transforms.enrich_static]
type   = "remap"
inputs = ["redact_pii"]
source = '''
  .application_version = get_env!("APP_VERSION", default: "dev")
  .environment = get_env!("APP_ENV", default: "local")
  .host = get_hostname!()
'''
```

### 6.4 Drop noisy health checks

```toml
[transforms.drop_health]
type   = "filter"
inputs = ["enrich_static"]
condition = '!(exists(.http_target) && .http_target == "/health")'
```

### 6.5 Route to sink (OpenObserve)

```toml
[sinks.otlp]
type    = "opentelemetry"
inputs  = ["drop_health"]
endpoint = "${OPENOBSERVE_URL}"
compression = "gzip"
request = { concurrency = 4 }
auth = { strategy = "bearer", token = "${OPENOBSERVE_TOKEN}" }
```

> Chain order suggestion in `vector.toml`: `otel_traces → sample_slow_or_error → redact_pii → enrich_static → drop_health → sinks.otlp`

---

## 7. Configuration Skeleton (example)

```toml
# --- Sources ---
[sources.otel_traces]
type    = "opentelemetry"
address = "0.0.0.0:4317"

[sources.otel_logs]
type    = "opentelemetry"
address = "0.0.0.0:4318"

# --- Transforms (VRL chain) ---
[transforms.sample_slow_or_error]
type    = "sample"
inputs  = ["otel_traces"]
rate    = 0.20
condition = '''
  .status == "error" || (exists(.attributes.duration_ms) && to_int!(.attributes.duration_ms) > 500)
'''

[transforms.redact_pii]
type   = "remap"
inputs = ["sample_slow_or_error"]
source = '''
  if exists(.user_email) { .user_email = replace!(.user_email, r"[^@]+@[^@]+", "[REDACTED]") }
'''

[transforms.enrich_static]
type   = "remap"
inputs = ["redact_pii"]
source = '''
  .application_version = get_env!("APP_VERSION", default: "dev")
  .host = get_hostname!()
'''

[transforms.drop_health]
type   = "filter"
inputs = ["enrich_static"]
condition = '!(exists(.http_target) && .http_target == "/health")'

# --- Sink ---
[sinks.otlp]
type     = "opentelemetry"
inputs   = ["drop_health"]
endpoint = "${OPENOBSERVE_URL}"
auth     = { strategy = "bearer", token = "${OPENOBSERVE_TOKEN}" }
```

---

## 8. Performance Tuning

| Lever                            | Effect                                       | Where                           |
| :------------------------------- | :------------------------------------------- | :------------------------------ |
| `rate` / `condition` in `sample` | Reduce ingest volume, keep high-value traces | `[transforms.sample_*]`         |
| `compression = "gzip"`           | Lower egress cost                            | `[sinks.otlp]`                  |
| `request.concurrency`            | Increase throughput                          | `[sinks.otlp.request]`          |
| Drop transforms early            | Avoid wasted CPU on soon-to-drop events      | Order transforms by selectivity |
| Use gRPC (4317)                  | Lower overhead vs HTTP                       | OTLP exporter + source          |

Target budgets (staging guidance): CPU < **3%** per core at ~1k spans/s; memory < **200MB** with moderate buffering.

---

## 9. Security & Governance

- **Secrets**: Only in `.secrets.env.sops` (`OPENOBSERVE_URL`, `OPENOBSERVE_TOKEN`).
- **Redaction**: Enforce VRL rules for PII before the sink.
- **Activation**: Application export is gated by `VIBEPRO_OBSERVE=1`.
- **Audit**: Keep `vector.toml` changes in PRs; CI validates syntax to prevent misroutes.
- **Networking**: Restrict ingress to 4317/4318 on localhost where possible; egress to the OpenObserve domain only.

---

## 10. Troubleshooting Matrix

| Symptom                            | Likely Cause                        | Quick Check                                              | Fix                                    |
| :--------------------------------- | :---------------------------------- | :------------------------------------------------------- | :------------------------------------- |
| `vector validate` fails            | TOML/VRL syntax error               | `vector validate ops/vector/vector.toml`                 | Fix offending block; commit            |
| No listening on 4317               | Port occupied / startup error       | `lsof -i :4317` ; tail `/tmp/vector.log`                 | Free port or change `address`          |
| Spans not visible in OO            | Wrong endpoint/token                | `echo $OPENOBSERVE_URL`, `echo ${OPENOBSERVE_TOKEN:0:6}` | Update `.secrets.env.sops`; re-encrypt |
| High CPU usage                     | Sampling too low / noisy transforms | Review rates & order of transforms                       | Increase sampling; drop early          |
| PII visible downstream             | Redaction rule missing              | Inspect transform chain inputs/outputs                   | Add/adjust VRL; add test span          |
| CI failing “Vector config invalid” | Drift between PR and base           | See workflow logs for the failing section                | Rebase or fix config                   |

---

## 11. Just Targets (reference)

```just
observe:start:
 vector --config ops/vector/vector.toml --watch

observe:verify:
 vector validate ops/vector/vector.toml
 VIBEPRO_OBSERVE=1 OTLP_ENDPOINT=${OTLP_ENDPOINT:-http://127.0.0.1:4317} \
 cargo run --features otlp --manifest-path apps/observe-smoke/Cargo.toml

observe:logs:
 tail -n +1 -f /tmp/vector.log || true
```

---

## 12. References

- [DEV-ADR-016](/docs/specs/observability/observability.adr.md) — Adoption decision
- [DEV-SDS-017](/docs/specs/observability/observability.sds.md) — System design
- [DEV-PRD-017](/docs/specs/observability/observability.prd.md) — Product requirements
- [Observability Guide](/docs/observability/README.md) — Developer how-to
- Vector docs: [https://vector.dev/docs/](https://vector.dev/docs/)
- OpenObserve docs: [https://openobserve.ai/docs/](https://openobserve.ai/docs/)

---

## 13. Exit Criteria (for ops readiness)

- `vector validate` passes locally and in CI.
- `just observe:start` exposes 4317/4318 and forwards spans.
- `just observe:verify` succeeds; OpenObserve shows incoming traces.
- Sampling + redaction rules reviewed and signed off by security.
