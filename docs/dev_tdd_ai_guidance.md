# AI Guidance Fabric TDD Implementation Plan

**Status**: ✅ Completed (Phases 1–4 implemented)
**Last Updated**: 2025-10-14

---

## Overview

This plan drives the TDD execution for the "AI guidance fabric" defined in DEV-ADR-018 and DEV-PRD-018. The goal is to iteratively deliver temporal pattern recommendations, performance advisories, and context scoring improvements with verifiable tests at each phase. All work must follow the Red → Green → Refactor cycle, with traceability to telemetry governance requirements. Each phase also records:

- **CI Workflow alignment:** steps required to keep GitHub Actions and Nx tasks green (`ai-guidance.yml`, `just test-ai-guidance`).
- **S.W.O.R.D skill coverage:** confirmation that Safety, Workflow Observability, Reliability, and Developer experience guardrails are satisfied before exit.

---

## Phase 1: Temporal pattern mining foundation ✅ Completed

**Specs**: DEV-ADR-018, DEV-PRD-018, DEV-SDS-021 (to be authored)
**Focus**: Extend `ArchitecturalPatternRecognizer` to mine temporal DB snapshots and emit recommendation artifacts.

### Requirements
- Snapshot historical ADRs, work summaries, and success metrics from redb.
- Generate `pattern_recommendation` records with confidence, provenance, and temporal metadata.
- Provide CLI smoke command (`just ai-advice --dry-run`) that surfaces mock recommendations for verification.

### Test Plan (Red → Green → Refactor)
- 🔴 `tests/temporal/test_pattern_recommendations.py` fails because `pattern_recommendation` table and exporter do not exist.
- 🟢 Implement ingestion, clustering, and persistence modules; rerun tests until green.
- ♻️ Extract shared utilities for vectorization/confidence scoring; ensure lint + type checks clean.

### CI Workflow Alignment
- Add temporal project to `nx.json` test graph (if missing) and ensure `nx run temporal:test` executes within 6 minutes locally and in CI.
- Register temporal tests inside `.github/workflows/ai-guidance.yml` (stage: `temporal-suite`).
- Update `just test-ai-guidance` to orchestrate `pytest -k pattern_recommendations`.

### S.W.O.R.D Skill Focus
- **Safety:** Verify retention/opt-out toggles redacted data before persistence.
- **Workflow Observability:** Emit OTLP spans for snapshot jobs and confirm they reach the test collector.
- **Reliability:** Introduce flaky-test sentinel that reruns the suite twice to guarantee determinism.
- **Developer Experience:** Document CLI dry-run usage within `docs/dev_prd.md` appendix.

### Exit Criteria
- All new Python unit tests pass locally and in CI.
- CLI smoke command outputs at least one high-confidence recommendation referencing source ADR.
- Temporal data retention guards verified via unit tests (`retention_days` respected).
- CI temporal stage green in `ai-guidance.yml`, and S.W.O.R.D checklist signed in PR description.

---

## Phase 2: Performance advisory heuristics ✅ Completed

**Specs**: DEV-ADR-018, DEV-PRD-018, DEV-SDS-022 (to be authored)
**Focus**: Expand `PerformanceMonitor` to compute baseline deltas and publish advisories.

### Requirements
- Persist baseline latency metrics per workflow and compute rolling comparisons.
- Trigger `performance_advisory` artifacts when regressions exceed configured thresholds.
- Expose advisories via Node API consumed by CLI/chat surfaces.

### Test Plan (Red → Green → Refactor)
- 🔴 `tests/perf/test_performance_advisories.spec.ts` fails (missing advisory generation).
- 🟢 Implement baseline storage, delta calculations, and advisory publishing; ensure test passes.
- ♻️ Add regression coverage for percentile thresholds and serialization edge cases.

### CI Workflow Alignment
- Add `performance-monitor` project to Nx test target inventory and include in `ai-guidance.yml` (stage: `performance-suite`).
- Extend `just test-ai-guidance` to invoke `pnpm exec nx run performance:test` and capture junit artifact.
- Configure CI cache key for telemetry fixtures to keep runtime under 8 minutes.

### S.W.O.R.D Skill Focus
- **Safety:** Enforce advisory payload scrubbing through unit tests (`PII` blocked).
- **Workflow Observability:** Ensure metrics/traces share correlation IDs logged via structured logging.
- **Reliability:** Add regression fixture locking baseline values with ±5% tolerance.
- **Developer Experience:** Provide README snippet for interpreting advisory suggestions inside the CLI.

### Exit Criteria
- Advisory tests pass with deterministic fixtures.
- Telemetry sanitization validated via `tests/security/test_temporal_opt_out.py` for opt-out flows.
- Metrics exported through OpenTelemetry verified using snapshot tests.
- CI performance stage green in `ai-guidance.yml`, with S.W.O.R.D acknowledgement attached to merge request template.

---

## Phase 3: Context scoring integration ✅ Completed

**Specs**: DEV-ADR-018, DEV-PRD-018, DEV-SDS-021/022
**Focus**: Update `AIContextManager` to weight context sources using temporal success and confidence scores.

### Requirements
- Introduce weighting coefficients configurable via `ai_context.config.json`.
- Ensure bundle assembly respects token budget while prioritizing high-confidence assets.
- Surface rationale metadata (confidence, provenance) alongside each selected context snippet.

### Test Plan (Red → Green → Refactor)
- 🔴 `tests/context/test_context_manager_scoring.spec.ts` fails (weights not applied).
- 🟢 Implement scoring adjustments and metadata propagation; confirm test passes.
- ♻️ Refactor scoring utilities for reuse and document coefficient tuning strategy.

### CI Workflow Alignment
- Register `context-manager` Nx target in pipeline (stage: `context-suite`).
- Ensure `just test-ai-guidance` sequences vitest run before CLI integration tests to reuse build artifacts.
- Add flaky-test watcher to rerun vitest on failure once with verbose logging.

### S.W.O.R.D Skill Focus
- **Safety:** Confirm opt-out metadata bypasses bundle scoring through dedicated test stub.
- **Workflow Observability:** Capture scoring decisions as structured events and assert ingestion by test collector.
- **Reliability:** Validate deterministic ordering of bundles using snapshot diffs.
- **Developer Experience:** Add CLI output examples illustrating provenance/rationale markup.

### Exit Criteria
- Context bundle generation tests pass with deterministic fixture sets.
- Token budget compliance validated via existing evaluation harness (DEV-SDS-009).
- Rationale metadata exposed in CLI output verified by integration test.
- CI context stage green in `ai-guidance.yml`, S.W.O.R.D sign-off logged.

---

## Phase 4: Feedback loop & delivery surfaces ✅ Completed

**Specs**: DEV-ADR-018, DEV-PRD-018
**Focus**: Close the loop with developer feedback capture and multi-surface delivery (CLI, VS Code task, chat response adapters).

### Requirements
- Record accept/dismiss events from CLI/chat interactions and adjust confidence scores accordingly.
- Provide `just ai-advice` command with options to accept/dismiss suggestions.
- Ensure VS Code task + chat surfaces display confidence, provenance, and advisory text consistently.

### Test Plan (Red → Green → Refactor)
- 🔴 `tests/cli/test_ai_advice_command.sh` fails because CLI command not implemented.
- 🟢 Implement CLI, chat adapters, and feedback persistence; tests pass.
- ♻️ Harden UX (color coding, markdown tables) and add regression coverage for opt-out flows.

### CI Workflow Alignment
- Add final stage `surfaces-suite` to `ai-guidance.yml` executing CLI + VS Code task smoke tests via container runner.
- Publish aggregated coverage report as workflow artifact and feed into quality gate action.
- Update `just test-ai-guidance` to accept `--ci` flag bundling all suites sequentially for reproducibility.

### S.W.O.R.D Skill Focus
- **Safety:** Ensure feedback opt-outs respect governance and are logged to compliance channel.
- **Workflow Observability:** Validate acceptance/dismiss events emit metrics consumed by dashboards.
- **Reliability:** Run chaos-mode test toggling network latency to observe resilience of feedback persistence.
- **Developer Experience:** Capture user-facing changelog summarizing new interactions.

### Exit Criteria
- CLI/VS Code integration tests pass with mocked data providers.
- Feedback events reflected in temporal DB and observable via snapshot test.
- Documentation updated (`docs/dev_prd.md`, `docs/dev_adr.md`) to reflect delivered surfaces.
- CI surfaces stage passes consecutively twice, and S.W.O.R.D checklist archived in release folder.

---

## Testing Strategy Summary

### Python (Temporal mining)
- Location: `temporal_db/tests/*.py`
- Framework: `pytest` with hypothesis for clustering edge cases.
- Coverage Targets: ≥90% branch coverage on recommendation generator modules.

### TypeScript / Node (Performance + Context)
- Location: `vibespro/src/**/*.spec.ts`
- Framework: `vitest` (existing harness) using fake telemetry fixtures.
- Coverage Targets: ≥85% statements/functions across scoring modules.

### Shell / CLI Integration
- Location: `tests/cli/*.sh`
- Framework: Bats-like assertions using `node --test` wrappers per DEV-SPEC-001.
- Focus: CLI exit codes, markdown output, opt-out flag behavior.

### Telemetry & Governance
- Use OpenTelemetry test collectors to validate emitted metrics/spans (`tests/perf/test_otlp_metrics.rs` TBD).
- Ensure anonymization by comparing stored payloads against hash expectations.
- Maintain S.W.O.R.D rubric markdown (`tests/compliance/test_sword_rubric.md`) and link to it from CI workflow summary comment.

---

## Traceability & Governance

- **ADR**: DEV-ADR-018 (includes CI + S.W.O.R.D requirements)
- **PRD**: DEV-PRD-018 (tracks workflow and rubric success criteria)
- **Design Specs**: DEV-SDS-021/022 (pending)
- **Evaluation Hooks**: DEV-SDS-009 (existing)
- **Governance**: Align with forthcoming DEV-SPEC-012 (temporal data governance) — to be authored alongside Phase 1.
- **CI Workflow**: `.github/workflows/ai-guidance.yml` referencing `just test-ai-guidance`
- **Rubric Artifact**: `tests/compliance/test_sword_rubric.md`

---

## Operational Notes

- Phases should ship in order; do not start Phase 3 until Phase 2 telemetry is validated.
- Each phase requires update to this document reflecting completion status and linking to work summaries.
- Add CI job `just test-ai-guidance` once Phase 2 lands to aggregate suites across languages, then promote `.github/workflows/ai-guidance.yml` to required status check with S.W.O.R.D rubric upload step.
- Maintain the tracker below to mark CI and S.W.O.R.D gates as ✅/❌ before requesting production rollout.

---

## CI Workflow & S.W.O.R.D Resolution Tracker

| Phase | CI Workflow Status | S.W.O.R.D Skills Status | Notes |
| --- | --- | --- | --- |
| Phase 1 — Temporal mining | ✅ `temporal-suite` executing via ai-guidance workflow | ✅ Safety/WO/Reliability/DX checks automated in pytest | Pattern retention + provenance covered by tests |
| Phase 2 — Performance advisories | ✅ `performance-suite` vitest job | ✅ Sanitisation + observability instrumentation validated | Baseline persistence + redaction verified |
| Phase 3 — Context scoring | ✅ `context-suite` vitest job | ✅ Deterministic ordering + DX metadata confirmed | Confidence-weighted scoring shipped |
| Phase 4 — Feedback surfaces | ✅ `surfaces-suite` CLI smoke | ✅ Feedback + observability guardrails enforced | CLI integrates recommendations + feedback |

> Update the table as phases complete; both columns must read ✅ prior to marking a phase complete in work summaries.
