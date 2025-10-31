<!--
Use this template for *every* PR in the TDD+TBD workflow.

Branching rules:
- Sub-branches: dev/task/<KEY>-<slug>/(red|green|refactor|regression|gen/<generator>)
- Task PRs: dev/task/<KEY>-<slug> → base: dev (NEVER main)
-->

# 🧪 TDD PR • <Replace with clear, task-focused title>

**Task**: `TASK-### — <short title>`
**Phase**: <kbd>RED</kbd> | <kbd>GREEN</kbd> | <kbd>REFACTOR</kbd> | <kbd>REGRESSION</kbd> | <kbd>GENERATOR-SPEC</kbd>
**Base → Head**: `<base-branch>` ← `<your-branch>`
**Targets**: `dev` only (never `main`)
**Labels**: `tdd:<phase>`, `size:<XS|S|M>`, `generator-spec?`

---

## ✍️ Summary (What & Why)

-   **What**: One sentence that a busy reviewer can grok in 5 seconds.
-   **Why**: Link the requirement (PRD-### / ADR-### / SDS-###) this enforces.

> ℹ️ Keep scope tiny (≤ ~200 LOC). If larger, split into multiple PRs per phase.

---

## 🧩 Traceability

-   **ADR**: ADR-\_\_\_
-   **PRD**: PRD-\_\_\_
-   **SDS**: SDS-\_\_\_
-   **TDD Plan**: link to the plan section for `TASK-###`

---

## 🧭 Ownership (Nx)

| Type          | Projects                      | Notes                            |
| ------------- | ----------------------------- | -------------------------------- |
| **Primary**   | `apps/...`, `libs/...`        | Owner(s) below will auto-review. |
| **Secondary** | `tools/...`, `generators/...` | Avoid cross-task edits.          |

**Affected (suggested)**

```bash
pnpm nx print-affected --select=projects
```

---

## ✅ Phase Checklist

<details>
<summary>🔴 RED — tests-first (should fail for the right reason)</summary>

-   [ ] Only tests added (no prod code)
-   [ ] Failure reason matches expectation (paste snippet below)
-   [ ] Deterministic fixtures; no network/secret access

**Expected failing output (short)**

```text
<copy the most relevant failing assertion here>
```

</details>

<details>
<summary>🟢 GREEN — minimal code to pass</summary>

-   [ ] Smallest change to pass all new tests
-   [ ] No extra features
-   [ ] Local run green

</details>

<details>
<summary>🔵 REFACTOR — structure only</summary>

-   [ ] Kept tests green
-   [ ] Improved naming, duplication, seams (link to diffs)
-   [ ] Consider split to new `libs/*` if boundary emerged

</details>

<details>
<summary>🔄 REGRESSION — whole-suite confidence</summary>

-   [ ] Unit + integration + contract (and e2e if applicable) passing
-   [ ] Coverage ≥ threshold (see table)
-   [ ] Perf delta within 10% baseline

</details>

<details>
<summary>🧰 GENERATOR-SPEC (if this PR is a generator specification)</summary>

-   [ ] Follows `docs/generators/GENERATOR_SPEC.md` template
-   [ ] Options (`schema.json`/`schema.d.ts`) enumerated
-   [ ] Acceptance tests defined (spec-level, not code)

</details>

---

## 🧱 Commands & Gates

```bash
# Always bundle context (ADRs/PRDs/SDS/instructions)
just ai-context-bundle

# Focused tests (per project or file)
pnpm nx test <project> -- --runTestsByPath <relative-spec-path>

# Phase/Workspace regression for affected projects
pnpm nx run-many -t test -p <affected-projects>

# Pre-merge validation (lint/types/tests/coverage)
just ai-validate
```

**Coverage (paste)**

| Project | Lines | Branches | Functions | Statements |
| ------- | ----: | -------: | --------: | ---------: |
| <proj>  |   95% |      92% |       96% |        95% |

---

## 🧠 MCP Notes (context & review aids)

-   **context7**: sources bundled (ADRs/PRDs/SDS/related specs): ✅ / ⛔︎
-   **ref**: seams/duplication checked (notes): `<1–2 bullets>`
-   **exa**: 3–5 refs added in PR description comment: ✅ / ⛔︎

> The GitHub MCP flow will: ensure base branch exists (`dev`), open Draft PR, set labels, require checks, and auto-assign reviewers via CODEOWNERS.

---

## 👀 Reviewer Guide

-   **Focus**: Does this PR advance _only_ the declared TDD phase for `TASK-###`?
-   **Reject** if: scope creep, cross-task edits, or missing validation (`just ai-validate`).
-   **Approve** if: tiny diff, correct phase behavior, all checks green.

---

## 🧯 Risk & Rollback

-   Risk level: Low / Medium / High
-   Rollback plan: Revert commit `<sha>` (all files listed by diff), no migrations/secrets touched.
