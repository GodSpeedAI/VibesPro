# Developer Software Design Specification (DX-first)

Audience: Developers as end-users
Scope: Design for discoverability, usability, and maintainability

---

## DEV-SDS-001 — Repository layout for discoverability (addresses DEV-PRD-001, DEV-PRD-007)
- Principle: Put the obvious things in obvious places.
- Design:
  - `.github/copilot-instructions.md` — repo-wide guidance.
  - `.github/instructions/*.instructions.md` — MECE components: security, performance, style, general, context.
  - `.github/prompts/*.prompt.md` — reusable prompt templates; frontmatter metadata.
  - `.github/chatmodes/*.chatmode.md` — 8 personas; synergy notes.
  - `.vscode/settings.json` — prompt/mode discovery locations; safe defaults.
  - `scripts/` — orchestration helpers; token metrics; A/B wrappers.
- DX Effect: Zero-hunt for files; predictable imports; fast onboarding.

## DEV-SDS-002 — Instruction stacking algorithm (addresses DEV-PRD-002, DEV-PRD-006)
- Contract: Ordered list of instruction files → concatenated with precedence.
- Rules:
  - Order: repo-wide → mode → prompt; later items may override earlier ones only where documented.
  - Pruning: remove duplicate headings/sections; cap tokens per stack via metrics.
- Error modes: Missing file, circular include, token overflow; provide clear messages.

## DEV-SDS-003 — Persona chat modes (addresses DEV-PRD-003)
- Structure: Frontmatter (name, description, tools, model) + body instructions + synergy section (links to security/perf/style instructions).
- UX: One-click selection; consistent output format; guidance for handoffs between roles.

## DEV-SDS-004 — Tasks orchestrator pattern (addresses DEV-PRD-004, DEV-PRD-010)
- Inputs: prompt file, variant flag, target selection (file/folder), metrics toggle.
- Outputs: logged token/latency; variant label.
- Behavior: Run prompt, collect metrics, optionally split traffic 50/50 for A/B.

## DEV-SDS-005 — Security defaults and trust (addresses DEV-PRD-005)
- Defaults: Disable chat.tools.autoApprove; honor workspace trust; prepend safety instructions.
- Validation: CI job verifies settings.json posture and presence of safety instructions in stacks.

## DEV-SDS-006 — Prompt-as-code lifecycle (addresses DEV-PRD-007)
- Stages: Edit → Lint → Plan (preview effective prompt) → Run (A/B) → Evaluate → Merge.
- Artifacts: Lint report, plan diff, metrics dashboard.

## DEV-SDS-007 — CALM/Wasp/Nx bridging (addresses DEV-PRD-008)
- Contract: Wasp-style spec drives features; CALM defines interfaces/controls; Nx generators output reversible services.
- Validation: CALM controls run pre-generation; fail fast on violations.

## DEV-SDS-008 — Declarative-first with hooks (addresses DEV-PRD-009)
- Design: Keep configuration declarative; expose hooks in tasks for retrieval, branching, and post-processing.
- Guardrails: Limit hook scope and sanitize inputs.

## DEV-SDS-009 — Evaluation hooks and token budgets (addresses DEV-PRD-010)
- Design: Token/latency logging always on when tasks run; optional quality/safety post-processing.
- Budgets: Per-mode budgets with warnings and hard caps; configurable thresholds.

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

Artifacts: .mise.toml, Justfile targets verify:*, docs updates.

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

Artifacts: .github/workflows/* snippets, CI docs.

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

| Layer | Component | Role | Implementation artifacts |
|---|---:|---|---|
| Instrumentation | tracing / tracing‑opentelemetry | Emit structured spans, metrics, and logs from Rust services | crates/vibepro-observe/src/lib.rs |
| Pipeline | Vector | Receive OTLP, sample, redact, enrich | ops/vector/vector.toml |
| Storage & Analytics | OpenObserve | Columnar unified store + SQL/UI | External service (staging/prod) |
| Integration | Just + CI | Local run, validation, CI checks | Justfile, .github/workflows/env-check.yml |

Architecture (logical flow)
```
Rust App (tracing macros, tracing_subscriber, tracing_opentelemetry)
  └─OTLP/gRPC→ Vector (host binary: otel sources, VRL transforms, otlp sink)
      └─OTLP/HTTP or gRPC→ OpenObserve (columnar store, SQL + UI)
```

---

### Design details

1) Instrumentation layer (Rust)
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

2) Data pipeline layer (Vector)
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

3) Storage & analytics (OpenObserve)
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
- Docs: `docs/observability/README.md`
- Secrets: `.secrets.env.sops`
- CI validation: `.github/workflows/env-check.yml` (vector validate)
- Tests: `tests/ops/test_vector_config.sh`, `tests/ops/test_openobserve_sink.sh`

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
