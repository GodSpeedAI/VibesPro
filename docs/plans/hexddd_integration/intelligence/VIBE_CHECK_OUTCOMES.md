# VIBE_CHECK_OUTCOMES

Date: 2025-11-05

## Context

This vibe-check captures assumptions, uncertainties, mitigations and next actions after the PHASE-000 intelligence work (Nx workspace snapshot, PR diffs for #49/#50/#51, Context7 Nx docs, Exa searches and an idempotency test harness prototype).

## Top assumptions

-   The generator templates added in PRs are the canonical source for generator behavior and will be used by AI-driven scaffolding.
-   CI runs relevant to PR activity are discoverable via `gh api repos/.../actions/runs` and are retained long enough to download logs.
-   ID generation, schema validation, and deterministic file writes are sufficient to avoid common generator hallucination failure modes.

## Primary uncertainties (high-priority)

1. CI evidence: which workflow runs and job logs correspond to the PR commits we inspected (we found many runs on `feature/integrateddb` but initial SHAs didn't match runs).

    - Impact: High — prevents us from seeing real test failures.
    - Mitigation: Use PR-level checks (`gh pr view --json headRefOid,mergeCommit` and `gh pr checks`) and search runs by branch.

2. Generator completeness vs. AI prompts: whether the `GENERATOR_SPEC.md` template contains all fields required to avoid hallucinations when an AI agent creates a generator.

    - Impact: High — missing fields can cause invalid generated projects.
    - Mitigation: Add AJV validation, schema→TS parity tests, and golden-sample generator runs (automated).

3. Idempotency coverage: tests were added but an idempotency harness wasn't present until now. We created a configurable harness but it needs to be run against representative generators.
    - Impact: High — non-idempotent generators are a major risk.
    - Mitigation: Run harness in CI with a curated set of sample generators; require passing before merging generator spec changes.

## Lower-priority uncertainties

-   Traceability completeness (ADR/PRD links exist but we must confirm all code changes reference spec IDs).
-   Long-term maintenance: who owns generator templates and how to version them for generated projects.

## Confidence levels (quick)

-   Confidence in repo evidence collected: Medium — file diffs and commits are present, but CI logs linking to exact commits remain to be collected.
-   Confidence in recommended mitigations: High — AJV + idempotency + golden runs will materially reduce hallucination/flake risk.

## Concrete mitigations & short actions

1. Gather CI logs: For each PR (49/50/51) use `gh pr view <n> --json headRefOid,mergeCommit` then list runs by branch/sha and download logs. (script `scripts/fetch_github_actions_logs.sh` exists and `gh` commands were used interactively).
2. Wire AJV: Add an AJV validation step in `just ai-validate` and in `.github/workflows/ai-guidance.yml` to fail PRs on schema regressions.
3. Idempotency gate: Add the idempotency harness to CI (small matrix of sample generator commands) and require pass for generator-related PRs.
4. Golden-sample jobs: Add a targeted CI job that runs a full generate→build→test cycle for one small generated project per generator family (Next, Remix, Expo, Python service).

## Open questions to resolve (next meeting)

-   Which specific generators should be included in the golden-sample set?
-   Who will be the DRI (owner) for generator template maintenance?
-   Retention policy for Actions logs — do we need to adjust retention so we can always retrieve run artifacts for important PRs?

## Appendix: quick checklist to close vibe items

-   [ ] Fetch and archive CI logs for PRs 49/50/51.
-   [ ] Add AJV validation to `just ai-validate`.
-   [ ] Add idempotency harness runs into `ai-guidance.yml` (matrix).
-   [ ] Create golden-sample CI job(s) for generator verification.

# VIBE_CHECK_RECAP

Status: draft
Date: 2025-11-05

## Purpose

Capture metacognitive checks: surfaced assumptions, edge cases, hidden complexity, and invalidation scenarios for the HexDDD plan.

## Assumptions to validate

-   Nx generators will be available for component/library scaffolding.
-   Workspace uses Nx >= 19.x (verify).
-   Type drift is resolvable with CI regeneration.

## Edge cases

-   Conflicting tags causing circular dependencies
-   Supabase schema changes that require manual intervention
-   Incompatible UoW patterns across JS/Python runtimes

## Hidden complexity

-   AST-based idempotent changes are non-trivial across template formats
-   Testing idempotency across macOS/Linux/CI environments

## Invalidation scenarios

-   Upstream HexDDD repo changes major layout or generator APIs
-   Nx plugin versions diverge and remove required hooks

## Next steps

-   Run the `vibe-check` MCP tool (or equivalent reasoning step) and paste answers into each section.
-   Assign confidence levels (High/Medium/Low) per assumption.
