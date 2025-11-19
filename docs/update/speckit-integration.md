# Spec-Driven Feature Adoption Plan — spec-kit-main → {{ project_slug }}

## 1) Executive Summary

Adopt spec-kit’s phase-gated workflow (spec → plan → tasks) and validation gates (Constitution Check, TDD-first, numbered tasks) while keeping VibePDK’s prompt/mode/instruction inventory, traceability matrix, and Node+pytest tooling. Spec IDs explicitly refer to Traceability Matrix artifact IDs (e.g., ADR/ARD, PRD, SDS, TS, TASK). We’ll extend the linter to support multipart IDs via frontmatter, centralize model config via `.github/models.yaml`, enforce naming/frontmatter, and expose Nx/bash/pnpm implementations through Just recipes—low-risk, reversible, and without auto-approve.

## 2) Assumptions and Constraints

- Python: 3.12, uv only (no pip).
- Node: 24.x with Corepack enabled; pnpm.
- Typing: strict (Python/TS), no Any.
- Safety posture: no auto-approve, no unsolicited `.vscode` changes.
- Naming taxonomy: <domain>.<task>[.<phase>].<kind>.md with required frontmatter.
- Spec ID semantics:
    - Spec IDs are the Traceability Matrix IDs (matrix artifacts), not a new SPEC-#### series.
    - Supported families include ADR/ARD, PRD, SDS, TS, TASK, and project-prefixed variants (e.g., DEV-PRD-###).
- Repos:
    - Template lives under `{{ project_slug }}`.
    - Prompts/modes/instructions under `{{ project_slug }}/.github`.
- Existing tooling:
    - Prompt lint and traceability (`tools/prompt/*`, `tools/spec/matrix.js`).
    - Tests: pytest hooks + Node checks.
- Central model config: `{{ project_slug }}/.github/models.yaml` (authoritative).

## 3) Comparative Analysis (High-Level)

- Prompts
    - Current: Broad set under `.github/prompts/*.prompt.md`.
    - spec-kit: Phase-gated spec/plan/tasks with gates.
    - Verdict: Merge. Keep coverage; adopt phase-gated structure and checks. Add family-specific plan prompts (e.g., `spec.plan.prd.prompt.md`).

- Chat modes
    - Current: Persona/product/debug/TDD.
    - spec-kit: Complementary.
    - Verdict: Keep; ensure modes reference centralized models/instructions.

- Instructions
    - Current: Modular safety/testing posture.
    - spec-kit: Constitution/gates guidance.
    - Verdict: Merge. Add “Constitution & Gates” instruction and reference it.

- Traceability
    - Current: `tools/spec/matrix.js` + docs.
    - spec-kit: Discipline + gating.
    - Verdict: Merge. Extend matrix to understand multipart IDs and spec threads.

- Context bundling
    - Current: CALM/techstack bundle.
    - spec-kit: Compatible.
    - Verdict: Keep; reference where useful.

- Tooling
    - Current: Node scripts (lint/matrix), pytest hooks.
    - spec-kit: CLI concepts (/plan, /tasks), numbering, paths.
    - Verdict: Adopt selectively. Implement flows as Just recipes (delegating to pnpm/Nx/bash).

- CI
    - Current: Lint/tests via Node/Python.
    - spec-kit: Aligns.
    - Verdict: Merge. Add taxonomy/frontmatter checks; ramp to errors.

- Docs/process
    - Current: Dev specs/reports.
    - spec-kit: Focused templates + constitution.
    - Verdict: Merge. Add templates, link them.

## 4) Gap Matrix

- Phase-gated templates (spec → plan → tasks)
    - Value: Predictable flow; clear gates.
    - Complexity: Low—add templates/recipes; update linter.
    - Risk: Adoption friction—phase rollout.

- Constitution Check and gating
    - Value: Less tech debt via simplicity/TDD.
    - Complexity: Medium—encode checks; docs.
    - Risk: Overstrict—ramp warnings → errors.

- Numbered, parallelizable tasks
    - Value: Clear execution/concurrency.
    - Complexity: Low—template-driven.

- Family-specific plan prompts (ADR/ARD, PRD, SDS, TS, TASK)
    - Value: Domain-appropriate guidance per artifact.
    - Complexity: Low—derive from base plan template.

- Central model config usage
    - Value: Single source of truth.
    - Complexity: Low—validate references.

- Frontmatter + naming enforcement
    - Value: Discoverability/automation.
    - Complexity: Medium—linter + CI.
    - Risk: Legacy failures—phase-in.

## 5) Adoption Decisions

- Adopt spec-kit’s spec/plan/tasks templates, with family-specific plan prompts.
    - Files: `spec.feature.template.md`, `spec.plan.{adr|prd|sds|ts|task}.prompt.md`, `spec.tasks.template.md`.
    - Benefits: Clear, testable artifacts per family; consistent gates.

- Add “Constitution & Gates” instruction and reference in prompts/modes.
    - File: `ai-workflows.constitution.instructions.md`.

- Enforce frontmatter + naming via linter/CI; multipart ID support.
    - Required frontmatter (minimum):
        - title, description
        - domain, task, kind; phase (optional)
        - matrix_ids: [e.g., "ADR-001", "PRD-010"] (singular id allowed for legacy)
        - status, version
        - model (key in `.github/models.yaml`), tools
        - thread: stable slug tying spec/plan/tasks (e.g., `auth-0007`)

- Replace spec-kit CLI flows with Just recipes (primary UX).
    - Recipes delegate to pnpm, Nx, or bash.

- Centralize model selection via `.github/models.yaml`.

## 6) Integration Design

- File-level changes (taxonomy + frontmatter)
    - Add to `{{ project_slug }}/.github/prompts`:
        - `spec.feature.template.md`
        - `spec.plan.adr.prompt.md` (ADR/ARD)
        - `spec.plan.prd.prompt.md`
        - `spec.plan.sds.prompt.md`
        - `spec.plan.ts.prompt.md`
        - `spec.plan.task.prompt.md`
        - `spec.tasks.template.md`
    - Add `{{ project_slug }}/.github/instructions/ai-workflows.constitution.instructions.md`.
    - Templates include:
        - `thread: <slug>`
        - `matrix_ids: []` (with examples per family)
        - Required keys listed above.

- Tooling updates
    - Extend `tools/prompt/lint.js`:
        - Filename taxonomy: <domain>.<task>[.<phase>].<kind>.md
        - Required frontmatter keys
        - Validate model key exists in `.github/models.yaml`
        - Validate `matrix_ids` entries match allowed patterns:
            - ^(ADR|ARD|PRD|SDS|TS|TASK|DEV-ADR|DEV-PRD|DEV-SDS)-\d{3,4}$
        - Allow legacy singular `id` and normalize to `matrix_ids: [id]`
        - Optional: size/budget checks; Constitution gate warnings → errors on schedule

- Traceability updates
    - Enhance `tools/spec/matrix.js` to:
        - Parse `thread` and `matrix_ids` from frontmatter
        - Link spec/plan/tasks triplets by `thread`
        - For each ID in `matrix_ids`, list contributing artifacts (spec/plan/tasks)
        - Warn for incomplete triplets per thread
        - Respect docs-only specs (`docs_only: true` or `phase: docs`)

- Just recipes (primary), delegating to pnpm/Nx/bash
    - Add to `justfile`:
        - `spec-feature THREAD=`: scaffold `/docs/specs/{THREAD}/spec.md` from `spec.feature.template.md`
        - `spec-plan THREAD= FAMILY=`: scaffold `/docs/specs/{THREAD}/plan.{FAMILY}.md` using `spec.plan.{family}.prompt.md`
        - `spec-tasks THREAD=`: scaffold `/docs/specs/{THREAD}/tasks.md` from `spec.tasks.template.md`
        - `spec-matrix`: `node tools/spec/matrix.js`
        - `prompt-lint`: run linter with new checks
    - Families: `adr|prd|sds|ts|task`
    - Each recipe may call:
        - pnpm scripts (portable), Nx targets, or bash

- Optional pnpm scripts (secondary)
    - Mirror Just actions in `package.json` for CI or direct use.

- Model selection centralization
    - Prompts/modes use `model: <key>`; linter validates against `.github/models.yaml`.

- Docs-only support
    - `docs_only: true` (or `phase: docs`) allows no `tasks.md`; matrix handles accordingly.

- CI
    - Run `just prompt-lint` and `just spec-matrix`.
    - Constitution gating ramps: warnings → errors after grace period.

- Testing strategy
    - Python (uv): Copier render tests include new files.
    - Node: unit tests for linter/matrix behaviors.
    - Integration: ensure Corepack/pnpm/Nx available in CI.

## 7) Rollout Plan (Phased, Low-Risk)

- Phase 1: Introduce metadata and linter (warnings only)
    - Add templates + Constitution instructions.
    - Add `thread` and `matrix_ids` to new artifacts.
    - CI runs `just prompt-lint` (non-blocking).

- Phase 2: Naming taxonomy and Just-first workflows
    - New/changed files must follow taxonomy/frontmatter (errors for changed files; legacy warned).
    - Adopt family-specific plan prompts.
    - Just is canonical interface; pnpm/Nx/bash are implementations.

- Phase 3: Cleanup
    - Migrate legacy files; remove stubs/duplicates.
    - Linter errors for all violations.

- Rollback
    - Additive until Phase 3; disable rules/remove recipes to revert.

## 8) Risks and Mitigations

- Token budget drift
    - Mitigation: concise templates; size checks.

- Naming fragmentation during transition
    - Mitigation: phased rollout; redirects and docs.

- CI breakage from stricter rules
    - Mitigation: warnings first; scope to changed files; timed escalation.

- Ergonomics
    - Mitigation: Just recipes with clear help; minimal ceremony.

## 9) Acceptance Criteria

- Linter enforces taxonomy/frontmatter; validates `matrix_ids` and models.
- Constitution gating ramps per schedule; CI green with uv and pnpm/Corepack.
- No auto-approve tools; no `.vscode` edits.
- Matrix links spec/plan/tasks by `thread` and aggregates across `matrix_ids`.
- Just recipes scaffold spec/plan/tasks per family and run lints/matrix.

## 10) Decisions

- Spec IDs = Traceability Matrix IDs (ADR/ARD, PRD, SDS, TS, TASK, and project-prefixed variants).
- Family-specific plan prompts: `spec.plan.{family}.prompt.md`.
- `matrix_ids` frontmatter replaces the prior single-ID assumption; `thread` ties the triplet.
- CI gating: warnings → errors ramp.
- `tasks.md` optional for docs-only specs (`docs_only: true` or `phase: docs`).
