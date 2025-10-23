# Spec-Kit Integration: Phased Implementation Plan

This document outlines the phased implementation of the `speckit-integration.md` plan, following MECE TDD cycles.

## Phase 1: Introduce Metadata, Linter, and Constitution (Warnings Only)

- [x] **Cycle 1: Central Model Configuration**

  - **RED (PRD-014):** Write a failing test in a new `lint.test.js` that asserts the linter errors when a prompt's `model` key does not exist in `.github/models.yaml`.
  - **GREEN (DEV-PRD-007):** Implement the minimal logic in `tools/prompt/lint.js` to load `models.yaml` and validate the `model` key.
  - **REFACTOR:** Ensure the YAML parsing is robust and error handling is clean.
  - **REGRESSION:** Run existing `spec-guard` tests to ensure no regressions.
  - Update checklist

- [x] **Cycle 2: "Constitution & Gates" Instruction**

  - **RED (PRD-017):** Add a test case to `lint.test.js` that fails if a prompt does not reference a valid instruction file.
  - **GREEN (DEV-PRD-010):** Create `{{ project_slug }}/.github/instructions/ai-workflows.constitution.instructions.md`. Update `lint.js` to validate instruction references.
  - **REFACTOR:** Abstract instruction validation logic.
  - **REGRESSION:** Run `spec-guard` tests.
  - Update checklist

- [x] **Cycle 3: Spec/Plan/Tasks Templates**

  - **RED (SDS-003):** Write a failing Copier generation test that checks for the existence of the new `spec.*.md` templates.
  - **GREEN (DEV-SDS-003):** Create the following files in `{{ project_slug }}/.github/prompts`:
    - `spec.feature.template.md`
    - `spec.plan.adr.prompt.md`
    - `spec.plan.prd.prompt.md`
    - `spec.plan.sds.prompt.md`
    - `spec.plan.ts.prompt.md`
    - `spec.plan.task.prompt.md`
    - `spec.tasks.template.md`
  - **REFACTOR:** N/A (file creation).
  - **REGRESSION:** Run Copier generation tests.
  - Update checklist

- [x] **Cycle 4: Linter Frontmatter Checks (`thread`, `matrix_ids`)**
  - **RED (TS-001):** Add failing tests to `lint.test.js` for missing `thread` and `matrix_ids` frontmatter in the new spec templates.
  - **GREEN (DEV-TS-001):** Update `lint.js` to check for the presence of `thread` and `matrix_ids`, issuing warnings only.
  - **REFACTOR:** Organize linter checks for clarity.
  - **REGRESSION:** Run `spec-guard` tests.
  - Update checklist

## Phase 2: Naming Taxonomy and Just-first Workflows

- [x] **Cycle 1: `justfile` Scaffolding Recipes**

  - **RED (PRD-002):** Write a shell test that fails to execute `just spec-feature THREAD=test`.
  - **GREEN (DEV-PRD-002):** Add the `spec-feature`, `spec-plan`, and `spec-tasks` recipes to the `justfile`.
  - **REFACTOR:** Ensure recipes are clear and use variables effectively.
  - **REGRESSION:** Manually run existing `just` recipes to ensure they still work.
  - ✅ **Cycle 1 COMPLETED**

- [x] **Cycle 2: `justfile` Linter and Matrix Recipes**

  - **RED (PRD-007):** Write a shell test that fails to execute `just prompt-lint` and `just spec-matrix`.
  - **GREEN (DEV-PRD-007):** Add the `prompt-lint` and `spec-matrix` recipes to the `justfile`.
  - **REFACTOR:** N/A.
  - **REGRESSION:** Manually run existing `just` recipes.
  - ✅ **Cycle 2 COMPLETED**

- [x] **Cycle 3: Traceability Matrix Updates (`thread`, `matrix_ids`)**

  - **RED (SDS-003):** Create a test in a new `matrix.test.js` that fails to link a spec/plan/tasks triplet by `thread`.
  - **GREEN (DEV-SDS-003):** Update `tools/spec/matrix.js` to parse `thread` and `matrix_ids` from frontmatter and link triplets.
  - **REFACTOR:** Improve the matrix generation logic for readability.
  - **REGRESSION:** Run existing `spec-guard` tests.
  - ✅ **Cycle 3 COMPLETED**

- [x] **Cycle 4: CI Integration**
  - **RED (TS-002):** N/A (manual check).
  - **GREEN (DEV-TS-002):** Update `.github/workflows/spec-guard.yml` to call `just prompt-lint` and `just spec-matrix`.
  - **REFACTOR:** Consolidate CI steps where possible.
  - **REGRESSION:** Monitor CI runs to ensure existing checks still pass.
  - ✅ **Cycle 4 COMPLETED**

## Phase 3: Cleanup and Enforcement

- [x] **Cycle 1: Linter Enforcement (Errors)**

  - **RED (PRD-014):** Change the linter tests for frontmatter and model validation to expect errors instead of warnings.
  - **GREEN (DEV-PRD-014):** Update `lint.js` to throw errors for violations.
  - **REFACTOR:** N/A.
  - **REGRESSION:** Run `spec-guard` tests.
  - Update checklist
  - ✅ **Cycle 1 COMPLETED**

- [x] **Cycle 2: Migrate Legacy Files**
  - **RED (PRD-017):** Run `just prompt-lint` and identify a legacy file that fails the new checks.
  - **GREEN (DEV-PRD-017):** Manually update the legacy file to conform to the new frontmatter and naming conventions. Repeat for all legacy files.
  - **REFACTOR:** N/A (manual process).
  - **REGRESSION:** Run `spec-guard` tests.
  - Update checklist
  - ✅ **Cycle 2 COMPLETED**
