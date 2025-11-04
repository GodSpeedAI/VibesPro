# TDD Plan Review: VS Code Chat Participant integration for automated prompt execution

## 1. Executive Summary

-   Strengths: Plan embraces explicit Red-Green-Refactor-Regress cadence; enumerates concrete test artifacts for every target file; captures documentation/metrics updates alongside code work.
-   Critical Gaps: Spec identifiers (`DEV-ADR-018`, `DEV-PRD-019`, `DEV-SDS-018`, `DEV-SPEC-012`) are already live for unrelated initiatives, so reuse would break traceability; scaffolding bypasses generator-first policy and places the extension outside {{project_slug}}, meaning generated workspaces would miss the feature; unit/integration tests rely on the `vscode` runtime without introducing the VS Code test harness, so the proposed RED steps cannot even execute.
-   Overall Assessment: Needs Major Revision; Confidence: Medium; Recommendation: Patch then proceed.

## 2. Context Analysis

### 2.1 Relevant Specifications

-   dev_prd.md — DEV-PRD-004 (task orchestration), DEV-PRD-007 (prompt lifecycle), DEV-PRD-010 (evaluation hooks) mandate automated execution, validation, and metrics for prompts but already occupy the ID space the plan tries to reuse.
-   dev_sds.md — DEV-SDS-004/-006/-009 define orchestration flow, lint-plan-run stages, and token budget enforcement, all of which must be upheld by any new automation.
-   dev_technical-specifications.md — DEV-SPEC-004/-005 state that prompt execution must route through run_prompt.sh tasks and that metrics collection remains mandatory; DEV-SPEC-011 lists a “Minimal Node CLI” as the planned enhancement, underscoring that the shell stub is intentional for now.
-   dev_adr.md — DEV-ADR-018 already covers the temporal AI guidance fabric; any new Chat Participant architecture needs a fresh ADR slot with a new ID.
-   project_state.md flags “Prompt Execution Integration” as planned work but, in ai-assisted-spec-driven-framework.report.md, the current decision is to keep run_prompt.sh a discoverability stub until a spec is approved.

### 2.2 Codebase Patterns

-   run_prompt.sh is a small POSIX-shell wrapper kept intentionally minimal, with behaviour validated via ShellSpec in run_prompt_spec.sh.
-   Prompt utilities in `tools/prompt/*.js` are CommonJS modules consumed by Node scripts and Jest tests; they live under tools and are shipped into generated projects via Copier templates.
-   The monorepo Nx workspace only includes `templates/*` and `tools/*` in package.json workspaces; anything created under `extensions/` would be ignored by pnpm and Nx.
-   Root tsconfig.json sets `"noEmit": true` and `"module": "ESNext"`, so extending it directly for a CommonJS VS Code bundle requires overriding those choices.
-   Jest currently runs against the tests tree and has no configuration for the VS Code extension test runner; ShellSpec and Node tests are the only harnesses in place.

### 2.3 External Research

-   `vscode.chat.createChatParticipant` requires pairing a handler with the participant ID declared in package.json; the handler runs inside the VS Code extension host and streams results through `ChatResponseStream`.
-   Testing VS Code APIs needs the official `@vscode/test-electron` (or `@vscode/test-web`) harness; plain Jest imports of `vscode` will fail because the module is only provided inside the extension host.
-   Packaging extensions demands a dedicated bundle (esbuild, rollup, or vsce) and, when using proposed APIs, the manifest must list `enabledApiProposals`; otherwise the extension cannot load advanced chat features.

## 3. Gap Analysis

### 3.1 Specification Alignment

-   Gap 1 (Critical): Plan reuses `DEV-ADR-018`, `DEV-PRD-019`, `DEV-SDS-018`, `DEV-SPEC-012`, which already describe temporal AI fabric, generator spec template, structured logging, and existing runbooks; reusing them would corrupt traceability (dev_adr.md line 282, dev_prd.md line 303, dev_sds.md line 373).
-   Gap 2 (High): Plan introduces new specs without updating spec_index.md or traceability_matrix.md, so even if IDs were unique the matrix would drift.
-   Gap 3 (Medium): Existing specs expect run_prompt.sh to remain the orchestration entrypoint (DEV-SPEC-004/DEV-PRD-004); plan never states how the extension cooperates with that contract.

### 3.2 TDD Methodology

-   Gap 1 (Critical): RED tests import `vscode` in Jest without the VS Code test harness or module mocks; they would throw immediately, preventing the TDD cycle from starting.
-   Gap 2 (High): ShellSpec RED test `When run test -f` only asserts manifest absence but never proves the manifest is generated via the template flow; no regression ensures the generated project contains it.
-   Gap 3 (Medium): No regression phase verifies that `just ai-validate`, `just test-generation`, or existing ShellSpec suites still pass after bundling the extension.

### 3.3 Completeness

-   Gap 1 (Critical): Extension lives in `extensions/prompt-executor/`, outside Copier templates, so generated workspaces will not receive it; pnpm workspace configuration omits that path.
-   Gap 2 (High): No steps to register the extension as an Nx project or to add build/test targets; `nx run-many` would ignore the code.
-   Gap 3 (High): Packaging, publishing, and VS Code manifest updates (icons, activation events, dependencies, enableProposedApi) are absent so the feature cannot ship.
-   Gap 4 (Medium): Plan assumes direct imports from `tools/prompt/*.js`, but the relative path shown will not resolve inside the compiled extension bundle.

### 3.4 Technical Debt

-   Gap 1 (High): Extending root tsconfig.json inherits `"noEmit": true`; plan omits overrides, so `tsc` would still skip emission.
-   Gap 2 (Medium): Duplication of `js-yaml` dependency—already present at workspace level—without explaining bundler impact.
-   Gap 3 (Medium): Path handling in `loadPromptFile` trusts user input; plan promises sanitisation later but never adds tests for traversal attacks.

### 3.5 Codebase Integration

-   Gap 1 (Critical): Generator-first policy is ignored; no `pnpm exec nx list` or `just ai-scaffold` step precedes manual scaffolding.
-   Gap 2 (High): package.json workspaces omit `extensions/**`, so `pnpm install` inside that folder would generate a nested lockfile breaking repo tooling.
-   Gap 3 (Medium): Jest config lacks mapping to `extensions/**`; adding tests without updating jest.config.json means they won’t run in CI.

### 3.6 Verification & Validation

-   Gap 1 (High): No addition to `just ai-validate` or `just test` ensuring extension tests run.
-   Gap 2 (Medium): No smoke or integration test ensures the Chat Participant command actually runs inside VS Code using the project’s prompts.
-   Gap 3 (Medium): Acceptance metrics (execution <3s, token accuracy) lack measurement strategy or instrumentation.

### 3.7 AI Agent Usability

-   Gap 1 (Medium): Plan tries to expose `.prompt-metrics/` but never defines schema or storage churn limits; agents could accumulate unbounded artifacts.
-   Gap 2 (Low): Command surface (run, `/metrics`, `/ab-test`) lacks discovery prompts or fallback guidance for unsupported contexts.

## 4. Improvement Opportunities

-   Introduce new spec IDs (`DEV-ADR-023`, `DEV-PRD-024`, `DEV-SDS-024`, `DEV-SPEC-013`) and wire them into spec_index.md and the traceability matrix.
-   Relocate the extension into `templates/{{project_slug}}/tools/vscode-prompt-exec/` (or similar), scaffolded with `just ai-scaffold name=@nx/node:lib`, so every generated project inherits it.
-   Add an adapter so the Chat Participant shells out to run_prompt.sh rather than re-implementing validation, maintaining a single execution path.
-   Adopt the official VS Code test harness with Nx/Jest integration and document how to run it via `just`.
-   Define build/package tasks (esbuild + vsce) and link them to `just ai-validate` to keep CI consistent.
-   Harden path handling and metrics storage via explicit sanitisation helpers and new tests.

## 5. Comprehensive Patch

### 5.1 Critical Patches

1. **Patch: Allocate new spec IDs and update references**

    - Location: “Specifications to Create/Update” section (Phase 0) and every later occurrence.
    - Reason: Prevent traceability conflicts with existing DEV-PRD/ADR/SDS records.
    - Required Change:
        ```markdown
        -##### 1. DEV-ADR-018 — VS Code Chat Participant Integration Architecture
        +##### 1. DEV-ADR-023 — VS Code Chat Participant Integration Architecture
        ...
        -##### 2. DEV-PRD-019 — Automated Prompt Execution System
        +##### 2. DEV-PRD-024 — Automated Prompt Execution System
        ...
        -##### 3. DEV-SDS-018 — Prompt Execution Extension Design
        +##### 3. DEV-SDS-024 — Prompt Execution Extension Design
        ...
        -##### 4. DEV-SPEC-012 — Prompt Execution Operational Runbook
        +##### 4. DEV-SPEC-013 — Prompt Execution Operational Runbook
        ```
    - Validation: Confirm all subsequent references in the plan, docs, and traceability updates use the new IDs.

2. **Patch: Enforce generator-first scaffolding under templates**

    - Location: Insert after “Analysis Complete ✅”.
    - Reason: Align with generators-first.instructions.md and ensure generated workspaces receive the extension.
    - Required Change:

        ```markdown
        #### Generator-First Scaffolding (MANDATORY)

        1. Run `pnpm exec nx list` to confirm an existing generator is unavailable.
        2. Execute `just ai-scaffold name=@nx/node:lib path=templates/{{project_slug}}/tools/prompt-exec name=prompt-exec-extension` to create the TypeScript library inside the template.
        3. Add `templates/{{project_slug}}/tools/prompt-exec` to the root `package.json` workspaces array; update `nx.json` if a new project entry is required.
        4. Commit scaffold before authoring custom logic (RED phase begins only after this baseline exists).
        ```

    - Validation: `pnpm install` runs without creating nested lockfiles; generated project contains the new library.

3. **Patch: Establish VS Code test harness prior to RED tests**

    - Location: Prepend to “Phase 1: RED - Extension Scaffold & Failing Tests”.
    - Reason: RED tests need the VS Code runtime to load.
    - Required Change:

        ```markdown
        #### VS Code Test Harness Setup (Pre-RED)

        -   Add `@vscode/test-electron` as a devDependency in `templates/{{project_slug}}/tools/prompt-exec/package.json`.
        -   Create `templates/{{project_slug}}/tools/prompt-exec/src/test/runWithVscode.ts` invoking the VS Code test runner.
        -   Register a Jest project entry (or Nx target) that shells out to the VS Code runner, ensuring RED tests execute inside the extension host.
        ```

    - Validation: Running the new harness yields the expected “module not found” failures instead of hard crashes.

### 5.2 High-Priority Patches

1. **Patch: Clarify interaction with run_prompt.sh**
    - Replace the GREEN command handler snippet with a design note explaining the handler should invoke the shell script (via `child_process.spawn`) and stream outputs, keeping validation logic centralised.
2. **Patch: Add packaging targets**
    - Append a subsection defining `nx build prompt-exec-extension` using esbuild and `vsce package`, plus `just prompt-exec:package` for CI integration.
3. \*\*Patch: Update doc plan to touch spec_index.md, traceability_matrix.md, and `docs/templates/...` so specs stay coherent.

### 5.3 Medium-Priority Enhancements

-   Introduce path sanitisation and traversal tests in `prompt-loader` (e.g., rejecting `../` paths).
-   Specify metrics retention strategy (rotating files, size limits) and corresponding regression tests.
-   Document bundler configuration (Node vs browser target) to avoid surprises during packaging.

### 5.4 Optional Improvements

-   Add UX guidance for `/ab-test` to surface when metrics directory is empty.
-   Provide quick commands for toggling between shell script and Chat Participant for teams still bootstrapping.

### 5.5 Phase-Specific Improvements

-   GREEN: Replace handwritten YAML parsing with a reusable helper that calls existing lint.js, avoiding duplicate logic.
-   RED: Add harness smoke tests ensuring the extension activates within VS Code and the participant ID matches the manifest.
-   REFACTOR: Plan to extract a “promptExecutionService” that both the shell script and participant can call, reducing duplication.
-   REGRESSION: Extend `just test-generation` to assert the generated project’s extensions.json suggests installing the new extension.

### 5.6 Revised Structure

-   Current issues: RED/Green steps assume scaffolding exists; tests ignore harness; packaging/distribution absent.
-   Recommended structure:
    1. Phase 0 — Spec alignment, generator scaffold, workspace wiring.
    2. Phase 1 — Harness + failing activation tests.
    3. Phase 2 — Minimal participant invoking run_prompt.sh.
    4. Phase 3 — Validation/metrics integration through shared utilities.
    5. Phase 4 — A/B testing and telemetry.
    6. Phase 5 — Packaging, CI wiring, docs/traceability updates.

## 6. Validation Checklist

-   [ ] All requirements from DEV-PRD-004/007/010 and new DEV-PRD-024 are mapped to plan steps.
-   [ ] TDD flow references a runnable VS Code harness before GREEN work.
-   [ ] Every target file (run_prompt.sh, `tools/prompt/*.js`, extension library) has plan coverage.
-   [ ] Generator-first policy is enforced and template paths updated.
-   [ ] CI tasks (`just ai-validate`, `just test-generation`) include extension tests/builds.
-   [ ] Acceptance metrics include measurable instrumentation.
-   [ ] Traceability matrix updates list new spec IDs and artifacts.

## 7. Implementation Roadmap

### 7.1 Patch Priority Order

1. Update plan/spec references to new IDs and propagate to supporting docs.
2. Add generator-first/template scaffolding instructions.
3. Insert VS Code test harness setup and rewrite RED phases accordingly.
4. Rework GREEN steps to call existing script and shared utilities.
5. Define packaging/CI steps and documentation updates.

### 7.2 Effort Estimates

-   Critical patches: ~1.0 day (spec rewrite + template scaffolding + harness notes).
-   High priority: ~1.5 days (integration with script, packaging, doc updates).
-   Medium/optional: ~1.0 day combined.

### 7.3 Dependencies

-   Requires confirmation of new spec IDs from docs owners.
-   Depends on updating package.json workspaces and Nx config once scaffolding is defined.
-   Packaging tasks require selecting a bundler (esbuild/webpack) and ensuring it is available in the template.

### 7.4 Risks

-   Introducing the extension into templates may lengthen generated project setup unless bundling is automated.
-   VS Code APIs for Chat Participants are still evolving; enabling proposals might block marketplace publishing unless properly guarded.
-   Tight coupling to prompt could break if those scripts change signature; shared service extraction mitigates this.

## 8. Recommended Next Steps

1. Approve or adjust the proposed new spec IDs and confirm the feature belongs in generated projects rather than the template repo itself.
2. Decide on the bundler/package strategy (esbuild + vsce, webpack, or plain Node) so the plan can document exact build steps.
3. Green-light the generator-first scaffolding approach (Nx library inside {{project_slug}}) before rewriting the plan.

## 9. Open Questions

-   Should the Chat Participant run the shell script verbatim or embed Node logic, given performance and security considerations?
-   Do we need a marketplace-ready VS Code extension, or is a locally packaged extension sufficient for generated workspaces?
-   Is there an expectation to support multi-root workspaces, and if so, how should the plan adapt prompt resolution and metrics paths?
