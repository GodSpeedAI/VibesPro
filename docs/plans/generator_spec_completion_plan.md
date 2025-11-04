# Generator Spec Completion Plan

## 1. Purpose & Scope

-   Deliver a production-ready `GENERATOR_SPEC.md` template that eliminates TODO placeholders, aligns with generator-first policy, and enables AI agents to author Nx generators without hallucination.
-   Apply trunk-based development with short-lived feature branches (`base: dev`) for up to three junior AI agents working in parallel.
-   Map each change to forthcoming spec IDs (spec IDs are assigned during Cycle A implementation) and update the traceability matrix upon completion.

## 2. Key Remediation Themes

1. **Spec Completeness:** Fill Sections 1–12 plus MCP hooks, review checklist, and appendices with concrete guidance (schema coverage, outputs, rollback, MCP lookups).
2. **Executable TDD:** Replace hypothetical helpers with real Jest/copier harnesses, automate TODO detection, and gate progress on failing → passing tests.
3. **Schema Depth & Type Parity:** Document numeric/array validations, all `x-prompt` types, `$default` sources, and provide a schema ↔ TypeScript mapping matrix.
4. **Generator-First Integration:** Teach generator composition, conditional templates, and Nx MCP validation flows; align commands with `just`/`nx` recipes.
5. **AI Enablement & Safety:** Supply quick-start instructions, categorized troubleshooting, validation automation (AJV, `just ai-validate`, `just spec-guard`), and measurable success checks.

## 3. Workstream Decomposition (MECE TDD Cycles)

Each cycle aligns to a dedicated branch naming pattern `feature/generator-spec-cycle-<n>` (base `dev`). Agents should merge sequentially once their acceptance criteria pass.

### 3.1 Cycle A — Template Foundations & Tests

-   **Objective:** Rebuild RED tests with real utilities, cover full spec sections, and define doc content plan.
-   **Dependencies:** Spec IDs will be assigned during Cycle A implementation.
-   **Deliverables:** Updated Jest suites in `tests/generators/`, initial spec outline without TODOs, branch `feature/generator-spec-cycle-a`.
-   **TDD Checklist:**
    -   [ ] **RED:**
        -   Implement Jest tests using `tests/generators/utils.ts` to read `GENERATOR_SPEC.md`, fail on `TODO:` regex, verify section headers exist, and simulate copier output location.
        -   Add TODO-detection command (e.g., `grep -R "TODO:" templates/{{project_slug}}/docs/specs/generators/GENERATOR_SPEC.md`).
    -   [ ] **GREEN:**
        -   Stub minimal content for Sections 1, 3, 4, 5, 8, 9, 10 to satisfy new tests while marking gaps via "TBD" comments in plan (not in template).
        -   Update template to reference `just ai-scaffold` and generated project invocation paths.
    -   [ ] **REFACTOR:**
        -   Extract shared test helpers (e.g., `readGeneratorSpecTemplate`), ensure tests use `createTreeWithEmptyWorkspace` only where necessary.
        -   Document spec IDs placeholders in plan (`DEV-PRD-TBD` → assigned IDs once confirmed).
    -   [ ] **REGRESSION:**
        -   Run `pnpm test tests/generators/spec-template.test.ts` (expected PASS) and ensure `just ai-validate` runs clean.
        -   Record updates in `docs/generator_plan_review.md` if variances occur.

### 3.2 Cycle B — Schema & Pattern Depth

-   **Objective:** Complete Inputs/Options, outputs, targets, conventions, and pattern library with full validation coverage and schema ↔ type parity.
-   **Deliverables:** Finalized Sections 3–7, new "Type Mapping Matrix", expanded pattern gallery, branch `feature/generator-spec-cycle-b`.
-   **TDD Checklist:**
    -   [ ] **RED:**
        -   Extend tests to assert presence of numeric (`minimum`, `maximum`), array (`minItems`, `uniqueItems`), boolean, enum, conditional, and all `x-prompt` types (input/list/confirmation/multiselect).
        -   Add test ensuring `$default` sources include `argv`, `projectName`, `workspaceName`.
    -   [ ] **GREEN:**
        -   Populate schema guidance with JSON examples, confirm `schema.d.ts` snippet mirrors properties; introduce mapping table linking each property to TypeScript definition and validation keywords.
        -   Document generator composition (calling other Nx generators) and conditional file emission patterns.
    -   [ ] **REFACTOR:**
        -   Consolidate repeated JSON snippets via shared partials or links; ensure consistent terminology ("generator", "spec template").
        -   Update references to existing Nx schemas with precise file paths.
    -   [ ] **REGRESSION:**
        -   Validate template with `npx ajv validate -s templates/{{project_slug}}/docs/specs/generators/examples/domain-entity.schema.json -d tests/fixtures/generator-schema-sample.json` (create fixtures as needed).
        -   Execute `just test-generation` followed by `grep -i "TODO" ../test-output/docs/specs/generators/GENERATOR_SPEC.md` (expect zero matches).

### 3.3 Cycle C — AI Enablement & Regression Safety

-   **Objective:** Deliver AI quick-start, troubleshooting taxonomy, MCP guidance, validation automation, and full regression harness.
-   **Deliverables:** Sections 8–14 finalized, AI agent workflow, regression scripts, branch `feature/generator-spec-cycle-c`.
-   **TDD Checklist:**
    -   [ ] **RED:**
        -   Create Jest integration `tests/generators/ai-agent-simulation.test.ts` that fails until spec instructs end-to-end flow (dry run + lint/test minimal generator).
        -   Author ShellSpec `tests/shell/generator-spec-workflow_spec.sh` expecting TODO-free output.
    -   [ ] **GREEN:**
        -   Write AI quick-start summary, categorized troubleshooting table (Schema, Runtime, Tests), MCP assistance checklist with context7/ref/exa queries.
        -   Add validation commands to Regression section (`just ai-validate`, `just spec-guard`, `pnpm test`).
    -   [ ] **REFACTOR:**
        -   Insert decision tree (Mermaid) and ensure content leverages numbered subsections, cross-link to `.github/instructions/*` and `docs/nx-generators-guide.md`.
        -   Ensure documentation uses consistent vocabulary and removes redundancy from earlier cycles.
    -   [ ] **REGRESSION:**
        -   Run full suite: `pnpm test tests/generators`, `shellspec tests/shell/generator-spec-workflow_spec.sh`, `just spec-guard`.
        -   Update `docs/traceability_matrix.md` with assigned spec IDs and new tests.

## 4. Validation & Quality Gates

1. `pnpm test tests/generators` — unit/integration coverage.
2. `shellspec tests/shell/generator-spec-workflow_spec.sh` — end-to-end CLI verification.
3. `just ai-validate` and `just spec-guard` — lint/type/spec bundle gates.
4. `just test-generation` followed by TODO grep — ensure generated projects ship the updated template.
5. Ajv validation of sample schemas — guarantees JSON Schema correctness.

## 5. Coordination & Branching Rules

1. Base branch for all work: `dev`. Merge each cycle sequentially after approvals.
2. Keep branches short-lived (<3 days). Rebase onto `dev` before PR submission.
3. Use commit messages referencing assigned spec IDs (e.g., `feat(generators): expand schema guidance [DEV-PRD-067]`).
4. Document progress in `docs/work-summaries/` per cycle to capture learning for temporal DB ingestion.

## 6. Traceability & Follow-Ups

1. Request official spec IDs (PRD/SDS) and update plan header plus template references.
2. After Cycle C, refresh `docs/traceability_matrix.md` to map spec sections → tests → template outputs.
3. Notify maintainers to rerun `just ai-context-bundle` so AI personas ingest the new template guidance.
4. Schedule a post-implementation security review (use `.github/prompts/sec.review.prompt.md`) to ensure no regressions in generator execution safety.
