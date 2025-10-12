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

| Event | Action | Response |
| --- | --- | --- |
| Application emits tracing spans or structured log events | Data passes through Rust tracing layer, exported via OTLP to local Vector agent | Data validated & transformed; compliant OTLP payload emitted |
| Vector agent receives OTLP data | Applies sampling, redaction, enrichment via VRL | Transformed stream routed to OpenObserve sink |
| Vector fails validation or connection | just observe-verify or CI detects invalid config | Developer alerted via failing test and descriptive error |
| Developer queries OpenObserve | Unified metrics/logs/traces rendered with millisecond latency | Dashboards and API endpoints become queryable for AI pipelines |

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

| ID | Story | Acceptance Criteria |
| --- | --- | --- |
| PRD-017-A | As a developer, I can run `just observe-start` to launch the Vector agent and see it accept OTLP data locally. | Vector starts and logs listening on 0.0.0.0:4317. |
| PRD-017-B | As a maintainer, I can run `just observe-verify` to validate configuration end-to-end. | Command prints “✅ Trace ingested into OpenObserve.” |
| PRD-017-C | As an AI researcher, I can query historical traces via OpenObserve’s SQL endpoint to build datasets. | SQL query returns expected span IDs, durations, and contextual fields. |
| PRD-017-D | As an SRE, I can adjust sampling/redaction rules in `vector.toml` and see effects within one minute. | Modified rules visible in Vector logs and verified by test ingestion. |

### DX & Operational Metrics

| Metric | Target | Measurement |
| --- | ---: | --- |
| Vector config validation success | 100% | `vector validate` step in CI |
| Span ingestion latency (p95) | < 250 ms | End-to-end test trace |
| OTLP data loss | < 0.1% | Error counter in Vector logs |
| Sampling ratio accuracy | ±5% | Compare raw vs stored span counts |
| Redaction coverage | 100% of configured PII fields | Regex audit on test dataset |

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
