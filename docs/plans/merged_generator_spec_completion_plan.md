# Generator Spec Completion Master Plan

> Audience: Junior AI agent working in parallel with other agents. Always read this plan top-to-bottom before acting. Generator-first policy is mandatory.
>
> Source merger: synthesizes `docs/tmp/sandbox.md` and `docs/plans/generator_spec_completion_plan.md`; when guidance conflicts, the latter’s directives take precedence.

## 1. How To Use This Plan

-   [ ] Confirm workspace trust and read `.github/instructions/generators-first.instructions.md`.
-   [ ] Use the GitHub MCP server to branch from `dev` (see Section 2).
-   [ ] Follow the assigned cycle (start with Cycle A unless otherwise directed).
-   [ ] After each milestone, update this checklist and record a summary in `docs/work-summaries/`.
-   [ ] Run regression checks defined in Section 6 before requesting review.

## 2. Branching & Coordination Rules

-   [ ] Branch naming pattern: `feature/generator-spec-cycle-<a|b|c>-<agent-initials>`.
-   [ ] Always sync with `origin/dev` via GitHub MCP before starting.
-   [ ] Parallelization matrix:
    -   Cycle A must finish before Cycle B or C.
    -   Cycle B and C can run in parallel once Cycle A GREEN phase completes.
-   [ ] Use GitHub MCP tasks for branch creation, pushes, and PRs; raise CI issues through the same channel.

## 3. Cycle Overview (MECE)

**MECE Principle**: Mutually Exclusive, Collectively Exhaustive - A framework ensuring each cycle addresses distinct aspects of generator specification while covering all necessary components comprehensively.

-   **Cycle A — Template Foundations & Tests (Blocking for others)**
    -   RED focus: executable Jest suites for template validation and AI workflows.
    -   GREEN focus: outline + partial fills for Sections 1–4, zero TODO placeholders in touched sections.
    -   **Dependencies**: Complete before Cycles B and C can begin
-   **Cycle B — Schema & Pattern Depth (Depends on Cycle A)**
    -   Expand JSON Schema documentation with type mapping matrix, validation patterns, and Nx generator examples
    -   Build pattern gallery covering domain entities, services, components, and conditional templates
    -   Implement generator composition guidance and @nx/devkit integration patterns
    -   **Dependencies**: Requires Cycle A GREEN completion
-   **Cycle C — AI Enablement & Regression Safety (Depends on Cycle A, parallel with B)**
    -   Develop AI agent workflow instructions with MCP tooling integration and troubleshooting taxonomy
    -   Establish validation automation with AJV schema validation and regression safeguards
    -   Create comprehensive testing strategy including Jest, ShellSpec, and end-to-end validation
    -   **Dependencies**: Can run parallel to Cycle B once Cycle A is complete

## 4. Detailed Cycle Checklists

### 4.1 Cycle A — Template Foundations & Tests

-   [ ] **Preparation**

    -   Read `templates/{{project_slug}}/docs/specs/generators/GENERATOR_SPEC.md` and the example `templates/{{project_slug}}/docs/specs/generators/data-access.generator.spec.md` to understand target structure (per DEV-PRD-019-A/B).
    -   Use GitHub MCP → `createBranch` to branch from `origin/dev` into `feature/generator-spec-cycle-a-<agent>`.
    -   Pull latest `dev` via GitHub MCP (`syncBranch`) and confirm clean status with `git status` (through MCP run command).
    -   Capture initial assumptions in Memory MCP (`ai-notes`) so future cycles can reference context.
    -   Run `just ai-validate` to establish baseline (expect failures due to missing tests/spec content).

-   [ ] **TDD Phase A (RED)** — Target specs: DEV-PRD-019-C/D/E, DEV-SDS-019 “Detailed Design Sections”

    -   Create/Update `tests/generators/spec-template.test.ts` using existing harness `tests/generators/utils.ts`; assert Sections 1–4 contain no `TODO` strings and required headings exist.
    -   Add `tests/generators/ai-agent-creation.test.ts` (new file) that simulates AI agent steps using `runGenerator` stub data described in sandbox.md (lines 60-120). Tests should currently fail because spec lacks guidance.
    -   Add `tests/generators/spec-completeness.test.ts` to scan for `TODO`, `TBD`, and empty subsections. Base logic on sandbox Phase 3 but align assertions with DEV-SDS-019 exit criteria.
    -   For each test file, annotate top-of-file comments with linked specs (e.g., `// Traceability: DEV-PRD-019, DEV-SDS-019`).
    -   Run `pnpm test tests/generators/spec-*.test.ts` (should fail). Record failure summary in plan (Section 4.1).

-   [ ] **TDD Phase A (GREEN)** — Target specs: DEV-SDS-019 Sections 1, 3, 3.1, 3.5; DEV-ADR-019 Implementation Requirements #1-#3

    -   Update `templates/{{project_slug}}/docs/specs/generators/GENERATOR_SPEC.md`:
        -   Section 1 (Purpose & Scope): incorporate decision tree and non-goals described in DEV-SDS-019.
        -   Section 3 (Inputs/Options) subsections 3.0–3.2: add schema property taxonomy, prompt types, default sources using examples from sandbox Phase 2.
        -   Introduce Type Mapping Matrix table (Section 3.1) exactly as defined in DEV-SDS-019, referencing schema ↔ TypeScript mapping.
        -   Add Section 3.5 stub entries for pattern categories with short descriptions (full content handled in Cycle B).
    -   Ensure all new content uses Markdown tables and code fences per docs guardrails.
    -   Re-run `pnpm test tests/generators/spec-*.test.ts`; confirm previously failing tests now pass.

-   [ ] **Refactor & Regression**

    -   Run `just ai-validate` and `just spec-guard`; document outcomes in plan.
    -   Use Vibe Check MCP to confirm no missed assumptions; log determination in Memory MCP for next cycles.
    -   Confirm `grep -R "TODO" templates/{{project_slug}}/docs/specs/generators/GENERATOR_SPEC.md` returns only TODOs assigned to later cycles.
    -   Update Section 4.1 checklist with notes, then commit via GitHub MCP including message `test(generator-spec): complete cycle a foundations [DEV-PRD-019]`.
    -   Open draft PR targeting `dev`; attach failing/passing test outputs in PR description.

-   [ ] **Dependencies**
    -   **Prerequisites**: Workspace trust established, `.github/instructions/generators-first.instructions.md` reviewed
    -   **Specification Prerequisites**: DEV-PRD-019-A/B approved, target template structure defined
    -   **Tooling Prerequisites**: GitHub MCP server configured, Memory MCP accessible
    -   **Content Prerequisites**: `templates/{{project_slug}}/docs/specs/generators/GENERATOR_SPEC.md` exists for validation
    -   **Sequential Dependencies**: Must complete all phases (RED → GREEN → REFACTOR → REGRESSION) before proceeding

### 4.2 Cycle B — Schema & Pattern Depth

-   [ ] **Preparation**

    -   Wait for Cycle A GREEN to merge (check plan updates + PR status via GitHub MCP); sync branch from `dev`.
    -   Create `feature/generator-spec-cycle-b-<agent>` using GitHub MCP.
    -   Review Cycle A Memory MCP notes and `docs/generator_plan_review.md` schema gaps section.
    -   Use Context7 (`/websites/nx_dev`) to gather latest Nx schema examples for generators; store key snippets via Memory MCP.

-   [ ] **TDD Phase B (RED)** — Target specs: DEV-PRD-019-F/G, DEV-SDS-019 Sections 3.5, 6, 7

    -   Extend `tests/generators/spec-template.test.ts` with cases covering schema enums, conditional logic, and prompt types; assert example JSON blocks exist.
    -   Add new test `tests/generators/schema-to-types.test.ts` verifying schema ↔ TypeScript parity using the matrix (check `schema.d.ts` vs `schema.json`).
    -   Enhance `tests/generators/spec-completeness.test.ts` to ensure each pattern category (Domain, Service, Component, Conditional) has a sample table.
    -   Run tests (expect RED failures) and document results in plan.

-   [ ] **TDD Phase B (GREEN)**

    -   Populate Section 3.5 in `GENERATOR_SPEC.md` with full pattern definitions including schema snippets, TypeScript interfaces, sample `pnpm nx g` invocations, and expected file outputs (pull adapters from `generators/service/` as references).
    -   Add Section 6 content on generator composition (calling other generators, conditional templates) using code fences from sandbox GREEN tasks.
    -   Expand Section 7 with implementation hints for `@nx/devkit` helpers, ensuring coverage of `generateFiles`, `formatFiles`, and `addProjectConfiguration`.
    -   Update `templates/{{project_slug}}/docs/specs/generators/data-access.generator.spec.md` to align examples with new template fields.
    -   Re-run `pnpm test tests/generators/*schema*.test.ts` and entire generator suite; ensure all pass.

-   [ ] **Refactor & Regression**
    -   Use Exa MCP to verify external best practices for schema validation; document citations in spec footnotes.
    -   Run `just ai-validate`, `pnpm lint`, and `just test-generation` to confirm generated projects include updated spec.
    -   Capture learnings in Memory MCP and update plan progress notes.
    -   Commit via GitHub MCP with message `feat(generator-spec): deepen schema patterns [DEV-SDS-019]` and push draft PR (or update existing).

### 4.3 Cycle C — AI Enablement & Regression Safety

-   [ ] **Preparation**

    -   May run in parallel with Cycle B once Cycle A merges; sync `dev` and branch `feature/generator-spec-cycle-c-<agent>` via GitHub MCP.
    -   Review `DEV-PRD-019-H/I/J` metrics and `DEV-SDS-019` sections 8, 13, 14, Exit Criteria.
    -   Use Ref MCP to pull documentation on AI prompt workflows and troubleshooting patterns; store references.

-   [ ] **TDD Phase C (RED)** — Target specs: DEV-PRD-019-H/I/J, DEV-SDS-019 Sections 8, 10, 13, 14, Error Modes & Recovery

    -   Extend `tests/generators/ai-agent-creation.test.ts` to include error injection (invalid schema, missing section) verifying troubleshooting guidance.
    -   Create `tests/generators/validation-automation.test.ts` ensuring commands `ajv`, `just ai-validate`, `just spec-guard`, `just test-generation` are documented in spec.
    -   Add ShellSpec test `tests/shell/generator-spec-workflow_spec.sh` executing high-level workflow; expect failures until GREEN.

-   [ ] **TDD Phase C (GREEN)**

    -   Complete Sections 8, 10, 13, 14 in `GENERATOR_SPEC.md` with acceptance test templates, MCP usage guidance, AI workflow steps, troubleshooting taxonomy, and error mode resolutions.
    -   Add validation automation callouts throughout spec; include checkboxes referencing commands.
    -   Introduce new appendix (if not present) referencing MCP tools usage per DEV-SDS-019 “Implementation Dependencies”.
    -   Update `docs/plans/generator_spec_completion_plan.md` to cross-link final workflow.
    -   Ensure tests from RED phase pass and ShellSpec suite succeeds.

-   [ ] **Refactor & Regression**
    -   Use Vibe Check MCP to evaluate remaining risks and document mitigation steps in plan.
    -   Run full regression: `just ai-validate`, `just spec-guard`, `just test`, `just test-generation`, and relevant GitHub Actions via GitHub MCP (`workflowDispatch`).
    -   Confirm CI workflows succeed; if failures occur, use GitHub MCP issues/comments to resolve.
    -   Update plan with completion notes, commit (`docs: finalize generator spec ai enablement [DEV-PRD-019]`), and request review.

## 5. MCP Tooling Strategy

-   **Context7**: Fetch authoritative Nx generator docs (`/websites/nx_dev`, `/nrwl/nx`) during schema/pattern research (Cycle B).
-   **Exa**: Pull up-to-date generator patterns and schema validation techniques from public repos; cite findings in spec footnotes (Cycle B).
-   **Ref**: Retrieve documentation snippets for AI workflow, JSON Schema, or troubleshooting guides; store references when enriching Sections 8–14 (Cycle C).
-   **Vibe Check**: Run before finalizing each cycle to catch assumption gaps and document outcomes in plan (all cycles).
-   **Nx MCP**: Inspect workspace graph (`nx_workspace`) before modifying generator patterns; verify target availability with `nx_project_details` (Cycles A & B).
-   **Memory Tool**: Record decisions, test outcomes, and remaining TODOs after each working session to aid subsequent cycles.
-   **GitHub MCP**: Mandatory for branch creation, syncing, creating commits/PRs, and retrying CI workflows upon failure.

## 6. Regression Safeguards

-   [ ] `pnpm test tests/generators/spec-*.test.ts` — Execute Jest test suite for template validation
-   [ ] `pnpm test tests/generators/*schema*.test.ts` — Run schema validation and type parity tests
-   [ ] `pnpm test tests/generators/validation-automation.test.ts` — Execute automated validation command tests
-   [ ] `shellspec tests/shell/generator-spec-workflow_spec.sh` — Run end-to-end ShellSpec workflow validation
-   [ ] `just ai-validate` — Execute linting and type checking validation
-   [ ] `just spec-guard` — Run comprehensive specification and documentation guard
-   [ ] `just test` — Execute complete test suite (Node, Python, Shell, Integration)
-   [ ] `just test-generation` — Validate template generation flow produces working projects
-   [ ] GitHub Actions: `ci.yml`, `docs.yml`, `spec-guard.yml` (trigger or monitor via GitHub MCP) — Run CI workflows for continuous integration
-   [ ] Ensure `../test-output` generated project contains updated spec with zero TODO markers (`grep -R "TODO" ../test-output/docs/specs/generators/GENERATOR_SPEC.md`) — Verify generated project has complete specification

## 7. Traceability

-   `DEV-ADR-019`: Enforced by branching rules (Section 2), generator-first adherence, and MECE cycles (Section 3).
-   `DEV-PRD-019`: Addressed via cycle deliverables—user stories A-E (Cycle A), F-G (Cycle B), H-J (Cycle C).
-   `DEV-SDS-019`: Reflected in sections updated within `GENERATOR_SPEC.md`, new tests, and MCP integration strategy.
-   Update `docs/traceability_matrix.md` after each cycle to map spec IDs → files (`templates/.../GENERATOR_SPEC.md`, `tests/generators/*.ts`, `docs/plans/*.md`).

## 8. Completion Ritual

-   [ ] Update this plan with completion notes.
-   [ ] Add a dated summary in `docs/work-summaries/` (e.g., `generator-spec-cycle-a.md`).
-   [ ] Notify maintainers via GitHub MCP with PR number and results of regression checks.
