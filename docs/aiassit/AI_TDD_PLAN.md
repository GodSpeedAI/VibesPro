# AI-Assisted Integration TDD Implementation Plan

## 1. Inputs & Traceability Sources

- **Architectural Decisions:** `AI_ADR.md`
- **Product Requirements:** `AI_PRD.md`
- **Software Design:** `AI_SDS.md`
- **Technical Specifications:** `AI_TS.md`
- **Integration Blueprint:** `vibepdk-ai-integration-plan.md`
- **Upstream Asset Source:** `/home/sprime01/projects/VibePDK/{{cookiecutter.project_slug}}/` (authoritative files to copy into template directories)

## 2. Requirement Dependency Graph

```mermaid
graph TD
  ADR1[AI_ADR-001 Template Propagation] --> PRD1[AI_PRD-001 Consolidated Governance]
  ADR2[AI_ADR-002 .github Governance] --> PRD1
  ADR5[AI_ADR-005 CI Validation] --> PRD1
  ADR1 --> PRD2[AI_PRD-002 Dual Documentation]
  ADR3[AI_ADR-003 Dual Docs Streams] --> PRD2
  ADR1 --> PRD3[AI_PRD-003 Automation]
  ADR4[AI_ADR-004 Automation & Tools] --> PRD3
  ADR2 --> PRD4[AI_PRD-004 MCP & Generators]
  ADR4 --> PRD4
  ADR1 --> PRD5[AI_PRD-005 Continuous Validation]
  ADR5 --> PRD5
  PRD1 --> SDS1[AI_SDS-001 Template Assets]
  PRD2 --> SDS2[AI_SDS-002 Documentation]
  PRD3 --> SDS3[AI_SDS-003 Automation]
  PRD4 --> SDS3
  PRD5 --> SDS4[AI_SDS-004 CI Safeguards]
  SDS1 --> TS1[AI_TS-001 Tech Stack]
  SDS1 --> TS2[AI_TS-002 Integration]
  SDS3 --> TS4[AI_TS-004 Performance]
  SDS4 --> TS3[AI_TS-003 Security]
  SDS4 --> TS5[AI_TS-005 Observability]
```

## 3. Phase Overview Matrix

| Phase | Duration | Parallel Agents | Dependencies | Critical Path | Status |
| --- | --- | --- | --- | --- | --- |
| PHASE-001 | 2-3 days | Up to 3 agents (A, B, C) | None | ✅ Yes | ✅ **COMPLETE** (All 3 tasks passing) |
| PHASE-002 | 2 days | 2 agents (A, C) | PHASE-001 | ✅ Yes | ✅ **COMPLETE** (Both tasks passing) |
| PHASE-003 | 2-3 days | 3 agents (A, B, C) | PHASE-001 | ✅ Yes | ✅ **COMPLETE** (All 3 tasks passing) |
| PHASE-004 | 3 days | 2 agents (B, C) | PHASE-001, PHASE-003 | ✅ Yes | ✅ **COMPLETE** (Both tasks passing) |
| PHASE-005 | 1-2 days | 1-2 agents (A, B) | PHASE-001 → PHASE-004 | ✅ Yes | 🔄 Partial (TASK-011 ✅, TASK-012 pending) |

---

## 4. PHASE-001 ☑ Foundation Infrastructure Alignment

- **Duration:** 2-3 days
- **Dependencies:** None
- **Parallel Agents:** Recommend full utilization of A, B, C
- **MECE Coverage:** `.github` asset propagation, workflow import, baseline generation test harness
- **Rollback Strategy:** Retain current `templates/{{project_slug}}/.github/` backup (`.github.pre-ai/`), revert via Git if smoke test fails

### ✅ TASK-001: Import VibePDK `.github` Instructions & Prompts

- **Traceability:** AI_ADR-001, AI_ADR-002, AI_PRD-001, AI_SDS-001, AI_TS-002
- **Agent Assignment:** Agent A
- **Parallel Compatibility:** Independent of TASK-002 & TASK-003
- **Estimated Time:** 4 hours
- **MECE Boundary:** Copy & reconcile instruction/prompt/chatmode assets only (no workflows)
- **Status:** ✅ **COMPLETE** - All 3 tests passing (copier.yml variables added)
- **Source Assets to Copy:**
  - `/home/sprime01/projects/VibePDK/{{cookiecutter.project_slug}}/.github/copilot-instructions.md`
  - `/home/sprime01/projects/VibePDK/{{cookiecutter.project_slug}}/.github/instructions/`
  - `/home/sprime01/projects/VibePDK/{{cookiecutter.project_slug}}/.github/prompts/`
  - `/home/sprime01/projects/VibePDK/{{cookiecutter.project_slug}}/.github/chatmodes/`
  - `/home/sprime01/projects/VibePDK/{{cookiecutter.project_slug}}/.github/models.yaml`

#### ✅ RED — TASK-001 Failing Tests

```text
Test file: tests/integration/generation/github-assets.spec.ts

Scenario: "Generated project includes merged Copilot instructions"
- Arrange: Run Copier into tmp dir using current template
- Act: Inspect `.github` contents of generated project
- Assert: Expect presence of imported instruction files with correct precedence metadata
```

- Checklist:
  - [x] Create new test file with deterministic fixture generation (`tests/integration/github-assets.spec.ts`)
  - [x] Mock environment to run copier (leveraged `runCopierGeneration` helper in `tests/utils/generation-smoke.ts`)
  - [x] Assert missing file message before copy (initial failure reproduced prior to import; now guarded by regression test)

#### ✅ GREEN — TASK-001 Minimal Implementation

- [x] Copy directories from VibePDK into `templates/{{project_slug}}/.github/`
- [x] Update `templates/{{project_slug}}/.github/copilot-instructions.md.j2` (if templated) merging HexDDD specifics with VibePDK content
- [x] All assets verified: instructions/, prompts/, chatmodes/, models.yaml present
- [x] Added missing copier.yml variables: `primary_domains`, `project_purpose`, `tech_stack_summary`

#### ✅ REFACTOR — TASK-001 Code Quality

- [x] Deduplicate instruction precedence comments
- [x] Assets properly organized in template structure
- [x] Template variables properly configured in copier.yml

#### ✅ REGRESSION — TASK-001 System Integrity

- [x] Assets copied and verified (instructions, prompts, chatmodes, models.yaml)
- [x] Integration tests passing (3/3) ✅
- [x] Copier generation successful with all required variables

### ✅ TASK-002: Import & Adapt `.github/workflows`

- **Traceability:** AI_ADR-002, AI_ADR-005, AI_PRD-001, AI_PRD-005, AI_SDS-004, AI_TS-003, AI_TS-004
- **Agent Assignment:** Agent B
- **Parallel Compatibility:** Independent of TASK-001 (works in parallel), requires coordination with TASK-003 for smoke tests
- **Estimated Time:** 5 hours
- **MECE Boundary:** Workflow YAML files and required composite actions only
- **Status:** ✅ **COMPLETE** - All 2 tests passing (comprehensive copier fix applied)
- **Source Assets to Copy:**
  - `/home/sprime01/projects/VibePDK/{{cookiecutter.project_slug}}/.github/workflows/markdownlint.yml`
  - `/home/sprime01/projects/VibePDK/{{cookiecutter.project_slug}}/.github/workflows/node-tests.yml`
  - `/home/sprime01/projects/VibePDK/{{cookiecutter.project_slug}}/.github/workflows/spec-guard.yml`

#### ✅ RED — TASK-002 Failing Tests

```yaml
# New workflow test: tests/workflows/ci-workflow.e2e.yml
- Ensure generated project workflow names exist
- Mock GitHub Actions run via `act` or harness script asserting required jobs
```

- Checklist:
  - [x] Write script in `tests/ci/verify-workflows.test.ts`
  - [x] Script fails due to missing workflow file names (confirmed during pre-import baseline run)

#### ✅ GREEN — TASK-002 Minimal Implementation

- [x] Copy workflow YAML files (markdownlint.yml, node-tests.yml, spec-guard.yml)
- [x] Rename all workflow files to .j2 extension for copier processing
- [x] Rename composite action files to .j2 extension
- [x] Move root `.github/` → `.github-repo/` to prevent template conflicts
- [x] Configure copier `_subdirectory: "templates/{% raw %}{{project_slug}}{% endraw %}"` using Context7 Copier docs
- [x] Simplify spec-guard.yml to use `just spec-guard` command

#### ✅ REFACTOR — TASK-002 Code Quality

- [x] Workflow job names align with project conventions
- [x] No hardcoded secrets or repository-specific references
- [x] Proper YAML formatting and structure
- [x] Composite actions (setup-node-pnpm, setup-just) properly referenced

#### ✅ REGRESSION — TASK-002 System Integrity

- [x] Workflows copied and verified in generated projects (2/2 tests passing) ✅
- [x] Composite actions directory created and action.yml files present
- [x] Workflows correctly reference composite actions via `uses: ./.github/actions/setup-node-pnpm`
- [x] Copier generation successful with `_subdirectory` configuration

### ✅ TASK-003: Generation Smoke Test Harness

- **Traceability:** AI_ADR-005, AI_PRD-005, AI_SDS-004, AI_TS-004, AI_TS-005
- **Agent Assignment:** Agent C
- **Parallel Compatibility:** Runs with TASK-001/TASK-002; integration sync afterward
- **Estimated Time:** 4 hours
- **MECE Boundary:** Only generation smoke test updates (no docs or workflows)
- **Status:** ✅ **COMPLETE** - All 1 test passing (prompt frontmatter fixed)
- **Source Guidance:** reuse `/home/sprime01/projects/VibePDK/tests/test_cookiecutter_generation.py`

#### ✅ RED — TASK-003 Failing Tests

- [x] Create `tests/integration/template_smoke.test.ts` verifying generated project passes `pnpm prompt:lint` & `pnpm spec:matrix`
- [x] Test file exists and properly structured
- [x] Prompt lint validation confirms frontmatter requirements

#### ✅ GREEN — TASK-003 Minimal Implementation

- [x] Smoke test file created and structured
- [x] Test harness logic implemented
- [x] Fixed missing frontmatter fields in project.describe-context.prompt.md (kind, domain, task, matrix_ids, budget)
- [x] Fixed missing frontmatter fields in speckit_merge.prompt.md.j2 (kind, domain, task, thread, matrix_ids, budget)
- [x] Changed models from 'gpt-4o'/'GPT-5 (Preview)' to valid models in models.yaml

#### ✅ REFACTOR — TASK-003 Code Quality

- [x] Test file properly organized
- [x] Uses shared test utilities where appropriate
- [x] Prompt files follow consistent frontmatter schema

#### ✅ REGRESSION — TASK-003 System Integrity

- [x] Test passing (1/1) ✅
- [x] All prompt files pass frontmatter validation
- [x] Both prompt:lint and spec:matrix commands execute successfully

---

## 5. PHASE-002 ☑ Documentation System Delivery

- **Duration:** 2 days
- **Dependencies:** PHASE-001
- **Parallel Agents:** 2 (A, C)
- **Rollback Strategy:** Keep `templates/docs/` backup; revert if doc lint fails

### ☑ TASK-004: Maintainer Doc Alignment

- **Traceability:** AI_ADR-003, AI_PRD-002, AI_SDS-002, AI_TS-005
- **Agent:** Agent A
- **Estimated Time:** 3 hours
- **MECE Boundary:** `docs/aiassit/` updates only
- **Source Assets:** `/home/sprime01/projects/VibePDK/docs/devkit-prompts-instructions-integration.md`

#### RED — TASK-004 Failing Tests

- [x] Add tests in `tests/docs/maintainer-docs.test.ts` ensuring presence of ADR/PRD/SDS/TS references

#### GREEN — TASK-004 Minimal Implementation

- [x] Update docs referencing new files from PHASE-001 (no duplication)

#### REFACTOR — TASK-004 Code Quality

- [x] Ensure cross-links use relative paths validated against generated project

#### REGRESSION — TASK-004 System Integrity

- [x] `pnpm test:jest -- --runInBand tests/docs/maintainer-docs.test.ts`
- [ ] Optional: run `pnpm lint:md` to mirror markdown linting in follow-up sweep

### ✅ TASK-005: Template Doc Emission

- **Traceability:** AI_ADR-003, AI_PRD-002, AI_SDS-002, AI_TS-002
- **Agent:** Agent C
- **Estimated Time:** 4 hours
- **MECE Boundary:** Only template doc templates (`templates/{{project_slug}}/docs/**`, README)
- **Status:** ✅ **COMPLETE** - All 2 tests passing (copier paths fixed)
- **Source Assets:** `/home/sprime01/projects/VibePDK/{{cookiecutter.project_slug}}/docs/` and `/home/sprime01/projects/VibePDK/{{cookiecutter.project_slug}}/README.md`

#### ✅ RED — TASK-005 Failing Tests

- [x] Create generation test verifying doc files exist & include AI onboarding section
- [x] Test file properly structured
- [x] Fixed hardcoded 'templates/test-project/' paths after _subdirectory configuration

#### ✅ GREEN — TASK-005 Minimal Implementation

- [x] Copy and adapt doc templates replacing references with VibesPro context
- [x] Documentation files verified: README.md, commit_message_guidelines.md, dev_* files
- [x] AI onboarding content integrated
- [x] Updated test paths to match copier _subdirectory configuration (files at workspace root, not nested)

#### ✅ REFACTOR — TASK-005 Code Quality

- [x] Documentation properly structured and formatted
- [x] Cross-references use relative paths
- [x] Test paths align with actual copier generation structure

#### ✅ REGRESSION — TASK-005 System Integrity

- [x] All tests passing (2/2) ✅
- [x] Baseline documentation files copy correctly
- [x] AI onboarding guidance present and properly formatted

- [x] Documentation assets copied and verified
- ⚠️ Integration tests blocked by copier generation
- **Same Blocker:** Missing copier.yml template variables

---

## 6. PHASE-003 □ Automation & Tooling Enablement

- **Duration:** 2-3 days
- **Dependencies:** PHASE-001
- **Parallel Agents:** 3
- **Rollback Strategy:** Keep previous `justfile.j2` & scripts under `scripts/legacy/`

### ✅ TASK-006: Justfile Recipes Expansion

- **Traceability:** AI_ADR-004, AI_PRD-003, AI_SDS-003, AI_TS-004
- **Agent:** Agent A
- **Source Assets to Copy:** `/home/sprime01/projects/VibePDK/{{cookiecutter.project_slug}}/justfile`
- **Tests:** `tests/unit/just-recipes.test.ts`
- **Status:** ✅ **COMPLETE** - All 12 tests passing (duplicate recipe removed)

#### ✅ RED — TASK-006 Failing Tests

- [x] Author unit tests asserting new `just` recipes are listed
- [x] Tests created (12 total) checking for recipe presence
- [x] All tests now passing

#### ✅ GREEN — TASK-006 Minimal Implementation

- [x] All required recipes present: spec-matrix, clean, setup, test-generation, ai-context-bundle, ai-validate, ai-scaffold, tdd-red, tdd-green, tdd-refactor, prompt-lint, spec-guard
- [x] Removed duplicate spec-guard recipe definition (line 404 conflicted with line 40)
- [x] Kept comprehensive CI version at line 40 with all required commands

#### ✅ REFACTOR — TASK-006 Code Quality

- [x] All recipes properly defined and functional
- [x] Recipe usage documented with comments
- [x] Proper parameterization for template variables
- [x] No duplicate definitions

#### ✅ REGRESSION — TASK-006 System Integrity

- [x] All 12 tests passing ✅
- [x] Justfile syntax valid (no errors from `just --list`)
- [x] All AI workflow recipes accessible

### ✅ TASK-007: Shell Script Import & Adaptation

- **Traceability:** AI_ADR-004, AI_PRD-003, AI_SDS-003, AI_TS-001
- **Agent:** Agent B
- **Source Assets to Copy:** `/home/sprime01/projects/VibePDK/{{cookiecutter.project_slug}}/scripts/*.sh`
- **Tests:** `tests/integration/scripts/bundle-context.test.ts`
- **Status:** ✅ Complete (8/8 tests passing)

#### ✅ RED — TASK-007 Failing Tests

- [x] Write integration tests invoking scripts via Node child process
- [x] Tests created and properly structured (8 tests)
- [x] All tests now passing

#### ✅ GREEN — TASK-007 Minimal Implementation

- [x] Script copied: bundle-context.sh verified present
- [x] Proper shebangs and error handling
- [x] Environment variable guards implemented

#### ✅ REFACTOR — TASK-007 Code Quality

- [x] Scripts follow best practices (set -euo pipefail)
- [x] Proper logging and error handling
- [x] Well-documented with comments

#### ✅ REGRESSION — TASK-007 System Integrity

- [x] All 8 tests passing
- [x] Scripts properly integrated into template
- **Status:** Fully complete and validated

### ✅ TASK-008: Package Script Wiring

- **Traceability:** AI_ADR-004, AI_PRD-003, AI_SDS-003, AI_TS-001
- **Agent:** Agent C
- **Source Assets to Copy:** `/home/sprime01/projects/VibePDK/{{cookiecutter.project_slug}}/package.json`
- **Tests:** `tests/unit/package-scripts.test.ts`
- **Status:** ✅ **COMPLETE** - All 16 tests passing (scripts added)

#### ✅ RED — TASK-008 Failing Tests

- [x] Add unit tests reading rendered `package.json` ensuring scripts exist
- [x] 16 tests created
- [x] Tests properly checking for script presence
- [x] All tests now passing

#### ✅ GREEN — TASK-008 Minimal Implementation

- [x] Scripts `prompt:lint` and `spec:matrix` present and verified
- [x] Added `test:node` script to template package.json.j2: "node tools/test/node-smoke.cjs"
- [x] Added `lint:shell` script to root package.json with shellcheck fallback
- [x] All 16 tests now passing

#### ✅ REFACTOR — TASK-008 Code Quality

- [x] Scripts properly formatted
- [x] Dependencies appropriately categorized
- [x] All required scripts present in both root and template
- [x] Proper error handling (shellcheck fallback if not installed)

#### ✅ REGRESSION — TASK-008 System Integrity

- [x] All 16 tests passing ✅
- [x] Root package.json has all required scripts
- [x] Template package.json.j2 includes all necessary scripts for generated projects

---

## 7. PHASE-004 ✅ MCP & Generator Integration

- **Duration:** 3 days
- **Dependencies:** PHASE-001, PHASE-003
- **Parallel Agents:** 2 (B, C)
- **Rollback Strategy:** Add feature flag `ENABLE_VIBEPDK_MCP=false` to disable new features during rollback
- **Status:** ✅ Completed (2025-10-02)

### ✅ TASK-009: MCP Descriptor Import

- **Traceability:** AI_ADR-002, AI_ADR-004, AI_PRD-004, AI_SDS-003, AI_TS-002
- **Agent:** Agent B
- **Source Assets to Copy:** `/home/sprime01/projects/VibePDK/{{cookiecutter.project_slug}}/mcp/`
- **Tests:** `tests/unit/mcp-descriptor.test.ts`
- **Status:** ✅ Completed (2025-10-02)

#### RED — TASK-009 Failing Tests ✅

- [x] Create unit tests validating descriptor files render with correct placeholders
- [x] Assert failure due to missing files in template
- **Result:** Created 13 comprehensive tests, all failing as expected

#### GREEN — TASK-009 Minimal Implementation ✅

- [x] Copy `tool_index.md` and descriptors, adapting environment variable docs
- [x] Introduce template variables for auth guidance
- **Result:** Copied and adapted 2 files to `templates/{{project_slug}}/mcp/`

#### REFACTOR — TASK-009 Code Quality ✅

- [x] Consolidate repeated instructions into partial includes or shared sections
- [x] Ensure Markdown lint passes
- **Result:** Enhanced documentation with security best practices, quick start guide, comprehensive tool addition instructions

#### REGRESSION — TASK-009 System Integrity ✅

- [x] `pnpm lint:docs` (for template docs) passes
- [x] Unit tests for descriptors stay green
- **Result:** All 13 tests passing, markdown lint clean, no regression in existing test suite

### ✅ TASK-010: Stack-Aware Generator Integration

- **Traceability:** AI_ADR-004, AI_PRD-004, AI_SDS-003, AI_TS-002, AI_TS-003
- **Agent:** Agent C
- **Source Assets to Copy:** `/home/sprime01/projects/VibePDK/{{cookiecutter.project_slug}}/generators/`
- **Tests:** `tests/unit/stack_defaults.test.ts`
- **Status:** ✅ Completed (2025-10-02)

#### ✅ RED — TASK-010 Failing Tests

- [x] Build unit tests mocking tech stack JSON to expect generator outputs
- [x] Tests fail due to missing generator utilities
- **Result:** Created 3 comprehensive tests for stack defaults (fastapi, express, empty stack)

#### ✅ GREEN — TASK-010 Minimal Implementation

- [x] Copy generator utilities and adjust import paths for Copier template structure
- [x] Ensure environment flag `VIBEPRO_USE_STACK_DEFAULTS` toggles defaults
- **Result:** Implemented stack.ts, stack_defaults.ts, and enhanced service generator with feature flag

#### ✅ REFACTOR — TASK-010 Code Quality

- [x] Extract shared types to generator utilities
- [x] Add exhaustive error handling for missing tech stack files
- **Result:** Proper TypeScript interfaces, comprehensive error handling with warnings, traceability comments

#### ✅ REGRESSION — TASK-010 System Integrity

- [x] Run `pnpm exec jest tests/unit/stack_defaults.test.ts` - All 3 tests passing
- [x] Generator utilities copied to both root and template directories
- **Result:** No regressions in existing test suite

---

## 8. PHASE-005 □ CI & Regression Hardening

- **Duration:** 1-2 days
- **Dependencies:** All prior phases
- **Parallel Agents:** 2 (A, B)
- **Rollback Strategy:** Revert workflow triggers to previous baseline if failure rate spikes

### ✅ TASK-011: Template CI Pipeline Update

- **Traceability:** AI_ADR-005, AI_PRD-005, AI_SDS-004, AI_TS-003, AI_TS-004, AI_TS-005
- **Agent:** Agent A
- **Tests:** `tests/ci/template-ci.test.ts`
- **Status:** ✅ Completed (2025-10-02)
- **Commit:** `b479443` (pushed to feat/template-ci-TASK-011)

#### ✅ RED — TASK-011 Failing Tests

- [x] Extend CI verification tests ensuring new workflow steps present
- [x] Tests fail because pipeline not updated
- **Result:** Created 11 comprehensive tests (2 initially failing: test-generation step and documentation comments)

#### ✅ GREEN — TASK-011 Minimal Implementation

- [x] Update template CI workflows to run `just test-generation`, `pnpm prompt:lint`, `pnpm spec:matrix`
- [x] Ensure caching keys align with Nx and pnpm guidance
- [x] Added comprehensive documentation headers to spec-guard.yml
- [x] Installed yaml@2.8.1 for workflow parsing in tests
- **Result:** All 11 tests passing

#### ✅ REFACTOR — TASK-011 Code Quality

- [x] Factor shared workflow steps into reusable composite actions if practical
- [x] Document environment variable requirements in workflow comments
- [x] Created .github/actions/setup-node-pnpm/action.yml composite action
- [x] Created .github/actions/setup-just/action.yml composite action
- [x] Refactored spec-guard.yml and node-tests.yml to use composite actions
- [x] Reduced ~80 lines of duplicated setup code
- **Result:** Tests remain green, significantly improved maintainability

#### ✅ REGRESSION — TASK-011 System Integrity

- [x] Run CI smoke test via `tests/ci/template-ci.test.ts`
- [x] All 11 TASK-011 tests passing
- [x] No regressions in existing test suite
- [x] Composite actions properly integrated

### □ TASK-012: Generated Project CI Validation

- **Traceability:** AI_ADR-005, AI_PRD-005, AI_SDS-004, AI_TS-004
- **Agent:** Agent B
- **Tests:** `tests/integration/generated-ci-regression.test.ts`

#### RED — TASK-012 Failing Tests

- [ ] Add integration test generating project and executing CI scripts in dry-run mode
- [ ] Expect failure until workflows updated

#### GREEN — TASK-012 Minimal Implementation

- [ ] Update generated project workflows to align with template changes
- [ ] Ensure `corepack enable` & pnpm detection logic included

#### REFACTOR — TASK-012 Code Quality

- [ ] Optimize workflow step ordering for runtime efficiency
- [ ] Add annotations linking failures to guardrail documentation

#### REGRESSION — TASK-012 System Integrity

- [ ] Run generated project full suite within containerized environment
- [ ] Confirm `AI_traceability.md` regenerated without deltas

---

## 9. Parallel Execution Guide

### Agent Assignment Strategy

- **Agent A:** Template configuration & documentation alignment (Tasks 001, 004, 006, 011)
- **Agent B:** CI & MCP orchestration (Tasks 002, 007, 009, 012)
- **Agent C:** Automation runtime & generator integration (Tasks 003, 005, 008, 010)

```mermaid
gantt
  title Parallel Agent Execution Timeline
  dateFormat  YYYY-MM-DD
  axisFormat  %m/%d
  section Agent A
    TASK-001 :a1, 2025-09-29, 0.5d
    TASK-004 :a4, after a1, 0.5d
    TASK-006 :a6, after a4, 1d
    TASK-011 :a11, after a6, 0.5d
  section Agent B
    TASK-002 :b2, 2025-09-29, 0.5d
    TASK-007 :b7, after b2, 1d
    TASK-009 :b9, after b7, 1d
    TASK-012 :b12, after b9, 0.5d
  section Agent C
    TASK-003 :c3, 2025-09-29, 0.5d
    TASK-005 :c5, after c3, 0.5d
    TASK-008 :c8, after c5, 0.5d
    TASK-010 :c10, after c8, 1d
```

### Coordination Points

| Sync Point | Tasks Converging | Integration Required | Agent Handoff |
| --- | --- | --- | --- |
| SYNC-001 | TASK-001, TASK-002, TASK-003 | Generated `.github` + workflows + smoke tests | A → C |
| SYNC-002 | TASK-004, TASK-005 | Maintainer vs template docs alignment | A ↔ C |
| SYNC-003 | TASK-006, TASK-007, TASK-008 | Ensure justfile recipes reference scripts and package commands | A → B → C |
| SYNC-004 | TASK-009, TASK-010 | Generators reference MCP descriptors | B → C |
| SYNC-005 | TASK-011, TASK-012 | Template & generated CI parity | A ↔ B |

---

## 10. MECE Validation Checklist

### Mutual Exclusivity

- [ ] No two tasks copy or modify the same source file simultaneously
- [ ] Interfaces between `.github`, docs, automation, MCP, and CI remain clearly defined
- [ ] Test suites scoped per task (unit vs integration) without shared fixtures
- [ ] Parallel agents coordinate via sync points to avoid overlapping edits

### Collective Exhaustiveness

- [ ] Every AI_PRD requirement has at least one associated task
- [ ] Error paths (missing assets, failing tests, absent env vars) have tests in respective tasks
- [ ] Performance validation covered by TASK-003/TASK-012 regression runs
- [ ] Security guidance enforced via workflow imports and MCP integration tests

---

## 11. Task Granularity & Test Matrix

| Task ID | Requirements | Planned Tests | Files Modified | Agent | Parallel? | Status |
| --- | --- | --- | --- | --- | --- | --- |
| TASK-001 | AI_ADR-001, AI_PRD-001, AI_SDS-001 | 3 integration | 5+ | A | ✅ | ✅ Impl Complete (copier blocker) |
| TASK-002 | AI_ADR-002, AI_PRD-001, AI_SDS-004 | 2 integration, 1 contract | 3 | B | ✅ | ✅ Impl Complete (copier blocker) |
| TASK-003 | AI_ADR-005, AI_PRD-005, AI_SDS-004 | 2 integration | 2 | C | ✅ | ✅ Test Created (copier blocker) |
| TASK-004 | AI_ADR-003, AI_PRD-002, AI_SDS-002 | 2 unit | 4 | A | ✅ | ✅ Complete (5/5 tests ✅) |
| TASK-005 | AI_ADR-003, AI_PRD-002, AI_SDS-002 | 2 integration | 5 | C | ✅ | ✅ Impl Complete (copier blocker) |
| TASK-006 | AI_ADR-004, AI_PRD-003, AI_SDS-003 | 3 unit | 3 | A | ✅ | 🔄 Partial (1/12 tests) |
| TASK-007 | AI_ADR-004, AI_PRD-003, AI_SDS-003 | 2 integration | 4 | B | ✅ | ✅ Complete (8/8 tests ✅) |
| TASK-008 | AI_ADR-004, AI_PRD-003, AI_SDS-003 | 2 unit | 2 | C | ✅ | 🔄 Partial (14/16 tests) |
| TASK-009 | AI_ADR-002, AI_PRD-004, AI_SDS-003 | 3 unit | 3 | B | ✅ | ✅ Complete (13/13 tests ✅) |
| TASK-010 | AI_ADR-004, AI_PRD-004, AI_SDS-003 | 3 unit, 1 integration | 4 | C | ✅ | ✅ Complete (3/3 tests ✅) |
| TASK-011 | AI_ADR-005, AI_PRD-005, AI_SDS-004 | 2 integration | 3 | A | ✅ | ✅ Complete (11/11 tests ✅) |
| TASK-012 | AI_ADR-005, AI_PRD-005, AI_SDS-004 | 2 integration | 2 | B | ✅ | 🔄 Pending |

---

## 12. Test Categories & Timing Targets

| Test Type | Max Duration | Scope | Owner |
| --- | --- | --- | --- |
| Unit | ≤ 100 ms | Individual functions/scripts | Task owner |
| Integration | ≤ 1 s | Generated project behaviors | Task owner |
| Contract | ≤ 500 ms | Workflow & MCP descriptors | Interface owner |
| E2E | ≤ 5 s | `just test-generation` pipeline | Shared during regression |

---

## 13. Phase Exit Quality Gates

- [ ] All RED tests created and failing initially
- [ ] GREEN implementations minimal & passing scoped tests
- [ ] REFACTOR changes maintain green suite
- [ ] REGRESSION runs include `pnpm test`, `just test-generation`, `pnpm prompt:lint`, `pnpm spec:matrix`
- [ ] Code coverage ≥ 80% for new modules (enforced via `pnpm test -- --coverage`)
- [ ] Security scanning (`pnpm audit`) clean
- [ ] Documentation updated (`docs/aiassit/` and template docs) per phase outputs

---

## 14. Rollback & Contingency Per Phase

- **PHASE-001:** Keep `templates/{{project_slug}}/.github` snapshot; revert if generated project fails smoke test
- **PHASE-002:** Version docs; revert to previous commit if lint or tests fail
- **PHASE-003:** Feature flag new commands via `JUST_ENABLE_AI_CMDS`; disable if command failures observed
- **PHASE-004:** Wrap MCP/generator usage in `ENABLE_VIBEPRO_USE_STACK_DEFAULTS`; revert to plain generators if stack parsing fails
- **PHASE-005:** Maintain prior CI workflows; redeploy by toggling GitHub workflow enablement

---

## 15. Completion Checklist

### Phase Completion Status

- [x] **PHASE-001:** Foundation Infrastructure Alignment ✅ Implementation Complete
  - TASK-001 ✅ Assets copied (tests blocked by copier.yml)
  - TASK-002 ✅ Workflows copied (tests blocked by copier.yml)
  - TASK-003 ✅ Test created (blocked by copier.yml)
- [x] **PHASE-002:** Documentation System Delivery ✅ Complete
  - TASK-004 ✅ 5/5 tests passing
  - TASK-005 ✅ Docs copied (tests blocked by copier.yml)
- [ ] **PHASE-003:** Automation & Tooling Enablement 🔄 Partial (2/3 tasks)
  - TASK-006 🔄 Partial (1/12 tests, needs recipes)
  - TASK-007 ✅ 8/8 tests passing
  - TASK-008 🔄 Partial (14/16 tests, needs test:node)
- [x] **PHASE-004:** MCP & Generator Integration ✅ Complete (2/2 tasks)
  - TASK-009 ✅ 13/13 tests passing
  - TASK-010 ✅ 3/3 tests passing
- [ ] **PHASE-005:** CI & Regression Hardening 🔄 Partial (1/2 tasks)
  - TASK-011 ✅ 11/11 tests passing
  - TASK-012 🔄 Pending

### Individual Task Status

- [x] TASK-001: Import VibePDK `.github` Instructions & Prompts ✅ Implementation Complete (tests blocked by copier.yml)
- [x] TASK-002: Import & Adapt `.github/workflows` ✅ Implementation Complete (tests blocked by copier.yml)
- [x] TASK-003: Generation Smoke Test Harness ✅ Test Created (blocked by copier.yml)
- [x] TASK-004: Maintainer Doc Alignment ✅ Complete (5/5 tests passing)
- [x] TASK-005: Template Doc Emission ✅ Implementation Complete (tests blocked by copier.yml)
- [ ] TASK-006: Justfile Recipes Expansion 🔄 Partial (1/12 tests, needs additional recipes)
- [x] TASK-007: Shell Script Import & Adaptation ✅ Complete (8/8 tests passing)
- [ ] TASK-008: Package Script Wiring 🔄 Partial (14/16 tests, needs test:node script)
- [x] TASK-009: MCP Descriptor Import ✅ Complete (13/13 tests passing)
- [x] TASK-010: Stack-Aware Generator Integration ✅ Complete (3/3 tests passing)
- [x] TASK-011: Template CI Pipeline Update ✅ Complete (11/11 tests passing)
- [ ] TASK-012: Generated Project CI Validation 🔄 Pending

### Critical Blockers

**⚠️ Copier Template Variables Missing** (Affects TASK-001, 002, 003, 005):
- Need to add to `copier.yml`:
  - `primary_domains` (used in copilot-instructions.md.j2)
  - `project_purpose` (used in copilot-instructions.md.j2)
  - `tech_stack_summary` (optional in copilot-instructions.md.j2)
- **Impact:** 5 test suites with copier generation tests cannot pass until these are added
- **Workaround:** All implementation artifacts are in place; only test execution is blocked

### Remaining Work

**High Priority:**
1. ⚠️ **Add missing copier.yml variables** (unblocks 5 test suites)
2. TASK-006: Add missing justfile recipes (11 recipes needed)
3. TASK-008: Add `test:node` script to package.json
4. TASK-012: Implement Generated Project CI Validation

**Low Priority:**
5. Clean up obsolete snapshot files (3 files from stack_defaults tests)

### Final Verification (Upon All Tasks Complete)

- [ ] All tasks completed with traceability recorded in commit messages (reference AI_ADR/PRD/SDS/TS IDs)
- [ ] Traceability matrix regenerated (`AI_traceability.md` → confirm coverage)
- [ ] Generated project validated end-to-end and archived as proof artifact
- [ ] Parallel agent retrospectives logged describing blockers & sync outcomes
- [ ] Ready for integration into main branch pending review

### Current Focus Areas

**Immediate Actions:**
1. 🔥 Fix copier.yml: Add `primary_domains`, `project_purpose`, `tech_stack_summary`
2. Complete TASK-006: Import justfile recipes from VibePDK
3. Complete TASK-008: Add test:node script
4. Start TASK-012: Generated Project CI Validation

**Test Status Summary:**
- ✅ **Fully Passing:** 5 tasks (TASK-004, 007, 009, 010, 011) = 40/40 tests
- 🔄 **Partial:** 2 tasks (TASK-006: 1/12, TASK-008: 14/16) = 15/28 tests
- ⚠️ **Blocked by Copier:** 4 tasks (TASK-001, 002, 003, 005) = 0/10 tests (implementation complete)
- □ **Not Started:** 1 task (TASK-012)

**Overall Implementation Progress: 10/12 tasks have code complete (83%)**
**Overall Test Success: 55/78 tests passing (70%, excluding copier-blocked tests)**
