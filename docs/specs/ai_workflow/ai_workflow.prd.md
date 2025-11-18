# AI WORKFLOW PRDs

<!-- matrix_ids: [] -->

## DEV-PRD-001 — Native configuration-only prompt system

-   Description: As a developer, I want to manage prompts/instructions/modes using only native VS Code and GitHub Copilot files so that I can start immediately without extra tools.
-   EARS: When setting up a project, the system shall enable prompts and instructions via repository files without custom DSLs.
-   DX Metrics: Onboarding < 15 min; zero non-native dependencies.
-   Supported by: DEV-ADR-001, DEV-ADR-009

## DEV-PRD-002 — Modular instruction stacking

-   Description: As a developer, I want modular instruction files I can stack per task so that I can tailor behavior quickly.
-   EARS: Given a task, the system shall allow selecting and ordering instruction files.
-   DX Metrics: Time to modify behavior < 5 min; diff size small and isolated.
-   Supported by: DEV-ADR-002, DEV-ADR-006, DEV-ADR-007

## DEV-PRD-003 — Persona chat modes (8 roles)

-   Description: As a developer, I want curated chat modes for key roles so that I can get phase-appropriate guidance without re-priming.
-   EARS: When choosing a persona, the system shall load the corresponding chat mode with synergistic instruction overlays.
-   DX Metrics: Context switching reduced (>20%); mode adoption >80% of interactions.
-   Supported by: DEV-ADR-003, DEV-ADR-006

## DEV-PRD-004 — Task-based orchestration and A/B testing

-   Description: As a developer, I want tasks to run prompts, inject context, and A/B test variants so that I can evaluate changes quickly.
-   EARS: Given two variants, the system shall route inputs and collect token/latency metrics.
-   DX Metrics: Variant switch < 1 min; results logged 100%.
-   Supported by: DEV-ADR-004, DEV-ADR-010

## DEV-PRD-006 — Context window optimization

-   Description: As a developer, I want context ordering and pruning so that prompts remain within token budgets.
-   EARS: Given configured locations, the system shall load files in a defined order and avoid redundant content.
-   DX Metrics: Token overflows < 2%; average tokens per interaction reduced >15%.
-   Supported by: DEV-ADR-006, DEV-ADR-010

## DEV-PRD-007 — Prompt-as-code lifecycle

-   Description: As a developer, I want prompts to be versioned, linted, tested, and previewed so that changes are safe and reversible.
-   EARS: When proposing a change, the system shall provide lint and a dry-run plan before apply.
-   DX Metrics: Rollback MTTR < 5 min; regression defects reduced >25%.
-   Supported by: DEV-ADR-007

## DEV-PRD-009 — Declarative-first with escape hatches

-   Description: As a developer, I want declarative defaults with optional task/script hooks so that I can do advanced flows without complexity by default.
-   EARS: When needed, the system shall allow orchestration scripts without changing base configuration.
-   DX Metrics: 80/20 split: 80% flows declarative; 20% advanced via tasks.
-   Supported by: DEV-ADR-009

## DEV-PRD-010 — Evaluation hooks & budgets

-   Description: As a developer, I want token/latency logging and optional content checks so that I can optimize quality and cost.
-   EARS: When running prompts, the system shall log metrics and optionally run safety/quality checks.
-   DX Metrics: 100% metric capture; monthly token cost variance <10%.
-   Supported by: DEV-ADR-010, DEV-ADR-004

## DEV-PRD-032 — AI pattern intelligence & performance co-pilot

-   Description: As a developer, I want the assistant to surface proven architecture patterns, performance insights, and curated context so that my next steps align with successful historical decisions.

### EARS (Event → Action → Response)

| Event                                        | Action                                                                             | Response                                                                                    |
| -------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Developer requests implementation guidance   | Temporal engine queries historical ADRs, pattern recognitions, and success metrics | Assistant returns recommended patterns with confidence %, linked artifacts, and rationale   |
| Performance regression detected in telemetry | PerformanceMonitor compares spans against baselines                                | Assistant surfaces advisory with suggested remediation (e.g., prune context, cache results) |
| Context bundle assembled for AI session      | AIContextManager scores sources using temporal success + confidence metadata       | Bundle includes high-value snippets while respecting token budget                           |
| Developer dismisses suggestion               | Feedback recorded in temporal DB                                                   | Confidence for similar future suggestions is reduced and rationale updated                  |

### Goals

-   Provide proactive, high-confidence guidance that cites prior successful artifacts.
-   Automate performance advisories using telemetry deltas and heuristics.
-   Improve context relevance scores by incorporating historical usage success into bundling.
-   Keep developers in flow by delivering recommendations directly in CLI/UI touchpoints.

### Non-Goals

-   Building an entirely new UI; leverage existing CLI/chat surfaces for surfacing insights.
-   Replacing human review of architectural changes; AI guidance remains assistive.
-   Ingesting ungoverned production data; scope limited to project telemetry stored in redb.

### User Stories

| ID        | Story                                                                                                                   | Acceptance Criteria                                                                       |
| --------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| PRD-019-A | As a backend developer, I get pattern suggestions that reference successful service designs when I start a new module.  | Recommendation includes pattern name, originating ADR/commit, and ≥70% confidence.        |
| PRD-019-B | As a performance-focused engineer, I receive automated advisories when code generation exceeds baseline execution time. | Advisory highlights delta vs baseline, impacted spans, and suggested fix.                 |
| PRD-019-C | As a developer invoking `just ai-context-bundle`, I see context sources ranked by historical success.                   | Bundle output lists confidence weight per source and stays under configured token budget. |
| PRD-019-D | As a tech lead, I can audit why the assistant made a recommendation.                                                    | Every suggestion links to provenance metadata (tests, ADRs, commits).                     |
| PRD-019-E | As a developer, I can opt out of temporal data usage for sensitive tasks.                                               | Opt-out flag prevents that session's data from persisting and is logged for governance.   |

### Functional Requirements

-   Temporal mining jobs run on a schedule (hourly/daily) and on-demand when major specs merge.
-   Pattern recommendations store `pattern_id`, `confidence`, `source_artifacts`, and `last_success_timestamp`.
-   Performance advisories trigger when spans exceed baseline by configurable percentage or percentile.
-   AIContextManager scoring weights incorporate `confidence` and `success_rate` inputs with tunable coefficients.
-   Recommendations surfaced through CLI (`just ai-advice`), VS Code task output, and chat responses include markdown summaries and quick actions.
-   Feedback loop records developer acceptance/dismissal to adjust future confidence.

### Data & Telemetry Requirements

-   All stored temporal data must honor retention policy (default 90 days) with anonymized identifiers.
-   Governance layer enforces PII redaction before persistence and respects opt-out metadata.
-   Metrics exported via OpenTelemetry include success rate, adoption rate, and advisory effectiveness.

### Dependencies

-   DEV-ADR-018 — Temporal AI intelligence fabric for guidance & optimization
-   DEV-SDS-021 — AI guidance fabric design (to be authored)
-   DEV-SDS-022 — Performance heuristics design (to be authored)
-   docs/dev_tdd_ai_guidance.md — TDD implementation roadmap
-   temporal_db schema migrations (crates/temporal or equivalent) adding recommendation/advisory tables

### Acceptance Tests

-   `tests/temporal/test_pattern_recommendations.py` — Validates clustering output structure and confidence scoring.
-   `tests/perf/test_performance_advisories.spec.ts` — Ensures advisories trigger on baseline regressions and include remediation text.
-   `tests/context/test_context_manager_scoring.spec.ts` — Verifies scoring weights and token budget compliance.
-   `tests/cli/test_ai_advice_command.sh` — Exercises CLI surface for recommendations with mocked data.
-   `tests/security/test_temporal_opt_out.py` — Confirms opt-out sessions bypass persistence and redact identifiers.
-   `.github/workflows/ai-guidance.yml` — CI orchestrator running `nx run-many --target=test --projects temporal,performance,context` plus `just test-ai-guidance` wrapper.
-   `tests/compliance/test_sword_rubric.md` — Markdown-based smoke checklist ensuring Safety, Workflow Observability, Reliability, and Developer experience (S.W.O.R.D) guardrails are acknowledged per release.

### Success Criteria

-   ≥80% of surfaced suggestions cite prior successful artifacts and link to provenance.
-   Performance advisories reduce repeat regressions for the same span by 25% over rolling 30 days.
-   Context bundle relevance score (per existing evaluation hooks) improves by ≥15% without exceeding token budgets.
-   Opt-out compliance rate = 100% (no persisted data when flag enabled).
-   Developer satisfaction (post-experiment survey) improves by 1.0 point on a 5-point scale.
-   CI workflow `ai-guidance.yml` remains green across merge queue with ≤2% flake rate, and S.W.O.R.D rubric sign-offs are captured in release notes.

### Supported By

-   DEV-ADR-018 — Temporal AI intelligence fabric for guidance & optimization
-   DEV-SDS-021/022 — Design specifications (to be authored)
-   docs/dev_tdd_ai_guidance.md — TDD execution plan
-   Existing evaluation hooks (DEV-SDS-009) for measuring suggestion effectiveness
-   docs/dev_tdd_ai_guidance.md — CI workflow & S.W.O.R.D closure checklist

---

## Development environment requirements

-   Editor: VS Code latest (workspace trust respected).
-   Extensions: GitHub Copilot/Chat; optional linting/mermaid preview.
-   OS: Windows/macOS/Linux; shell per team standard (PowerShell noted).
-   Repo: .github/instructions, .github/prompts, .github/chatmodes, .vscode/settings.json, tasks.
-   CI: Lint prompts, run token-budget checks, enforce security defaults.

## DX success metrics (global)

-   Onboarding time ≤ 15 minutes with documented steps.
-   Build/open project time ≤ 30 seconds to first productive action.
-   Debugging round-trip ≤ 2 minutes for common flows.
-   Prompt change cycle ≤ 10 minutes from edit → test → merge.

---
