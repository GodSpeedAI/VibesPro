---
kind: prompt
domain: tdd
task: trunk-based-plan
thread: tdd-tbd
matrix_ids: []
budget: M
precedence: high
mode: 'agent'
model: GPT-5 mini
tools: ['codebase', 'search', 'runTests']
description: 'Lay out trunk-based development flow for TDD cycles across tasks and branches.'
---

# Prompt: tdd-tbd

## Instructions

When invoked under `tdd-tbd` chatmode, **implement a TDD plan via Trunk-Based Development** as follows:

1. **Inputs**
   - Read the provided TDD plan (or generate from ADR/PRD/SDS if absent).
   - Identify tasks (`TASK-###`) and their Nx project ownership.

2. **Create a Branching & PR Plan**
   - Ensure `dev` exists; if not, create from `main`.
   - For each task:
     - Create `dev/task/<task-key>-<slug>` from `dev` (Draft PR → `dev`).
     - Create sub-branches for cycles:
       - `.../red`, `.../green`, `.../refactor`, `.../regression` (each PR → task branch).
     - If generator specs are required, create `.../gen/<generator-name>` PRs → task branch.
   - Define commit naming, labels, reviewers, and required checks.

3. **MCP Action List (GitHub)**
   For each branch/PR, list **exact MCP operations**:
   - `ensureBranch({ name, fromRef })`
   - `openPullRequest({ base, head, title, body, draft: true })`
   - `setLabels({ pr, labels: [...] })`
   - `assignReviewers({ pr, users: [...], teams: [...] })`
   - `postComment({ pr, body })`
   - `enableAutoMerge({ pr, method: "SQUASH" })` (where policy allows)
   - `mergePullRequest({ pr })` once checks pass
   - `protectBranch({ name, requiredChecks: [...] })` (if missing)

4. **Per-Cycle Work Template**
   For each task, output a block like this:

````markdown
### TASK-<key> — <title> (Nx Owners: <projects>)

**Branches**

- Task: `dev/task/<key>-<slug>`
- Cycles:
  - RED: `dev/task/<key>-<slug>/red`
  - GREEN: `dev/task/<key>-<slug>/green`
  - REFACTOR: `dev/task/<key>-<slug>/refactor`
  - REGRESSION: `dev/task/<key>-<slug>/regression`
- (Optional) Generator Specs:
  - `dev/task/<key>-<slug>/gen/<generator-name>`

**MCP (GitHub) Actions**

1. ensureBranch(task) → open Draft PR to `dev` (`[TASK <key>] init branch`)
2. ensureBranch(red) → open Draft PR to task; label: `tdd:red`, `size/S`
3. ensureBranch(green) → PR to task; label: `tdd:green`
4. ensureBranch(refactor) → PR to task; label: `tdd:refactor`
5. ensureBranch(regression) → PR to task; label: `tdd:regression`
6. (If needed) ensureBranch(gen/<name>) → PR to task; label: `generator-spec`

**Tests & Checks**

- RED: add failing tests only; confirm failure reason.
- GREEN: minimal code to pass.
- REFACTOR: structure only; tests remain green.
- REGRESSION: full suite; perf baseline; coverage threshold.

**Nx / just Commands**

```bash
just ai-context-bundle
pnpm nx test <project> -- --runTestsByPath <path>     # RED/GREEN focus
pnpm nx run-many -t test -p <affected-projects>       # REGRESSION
just test-template-logfire                            # Validate Logfire env scaffolding
just ai-validate
```
````

**Exit Criteria**

- Sub-branch PR merged (squash) into task branch with all checks green.
- Task PR promoted from Draft → Ready; merged (squash) into `dev`.

```

5) **Labels / Review / Merge Rules**
- Labels: `tdd:<phase>`, `generator-spec`, `size/<XS|S|M>`
- Reviewers: code owners of affected Nx projects
- Merge:
  - Sub-branches → **SQUASH** to task branch
  - Task branch → **SQUASH** to `dev`
- `main` remains release-only (protected).

6) **Risk Controls**
- Keep PRs small; avoid cross-task file edits.
- Enforce required checks: `just ai-validate`, Nx test targets, lint, typecheck, coverage.
- Auto-close stale sub-branches after merge.

7) **Context & Reasoning MCPs**
- **context7**: include ADR/PRD/SDS snippets relevant to this task’s API/Domain.
- **ref**: verify MECE boundaries and highlight any overlap/cycle risk.
- **exa**: attach 3–5 external references (docs, examples) to PR body.

---

## Output Format
Produce a **Branching & PR Execution Plan** for all tasks, with the Per-Cycle Work Template filled in, plus a summary table:

| Task | Task Branch | Cycle Branches | Generator Branches | PR → Task | PR → dev |
|------|-------------|----------------|--------------------|-----------|---------|

End with the exact list of MCP actions in execution order.
```
