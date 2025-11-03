# TDD Plan Review: GENERATOR_SPEC.md Completion

## Executive Summary

-   The plan embraces full TDD phases and links to real repo assets, giving a solid scaffold for future work.
-   GREEN/REFACTOR phases already inject rich examples (schema snippets, Nx devkit code) that will help AI consumers.
-   Critical issues: multiple TODO sections in the spec remain unaddressed, RED tests rely on non-existent helpers, and generator-first/CI conventions are only partially honored.
-   Overall assessment: **Needs Major Revision** before execution.

## Detailed Gap Analysis

### Completeness Gaps

-   Phase 2 only patches Section 3 & 7–8; Sections 1, 4–6, 9–10, MCP hooks, and Review Checklist still have TODO placeholders with no planned work.
-   Schema coverage omits numeric validations (e.g., `minItems`, `maximum`), confirmation/multiselect prompts, and `$default` sources beyond `argv`.
-   No tasks document generator composition, conditional file emission, or schema.d.ts synchronization guidance—checklist items remain unchecked.
-   MCP assistance placeholders (Section 10) and roll-back safety tactics (Section 9) never receive content or tests.

### Technical Debt Issues

-   RED tests call `readSpecTemplate`, `aiGenerateSchema`, `parseGeneratorSpec`, etc. which are undefined; plan lacks steps to implement or stub them.
-   Assertions like `expect(specContent).toContain('domain entity pattern')` will still fail because even the proposed GREEN content lacks those exact strings.
-   Commands `pnpm test tests/generators/spec-*.test.ts` and `pnpm nx g domain ...` do not exist in this workspace; violates integration reality.
-   Spec IDs remain `DEV-PRD-TBD`; spec-driven governance requires establishing or reserving concrete IDs before coding.

### AI Agent Usability Concerns

-   Plan lacks a quick-start / high-level summary; AI consumers must chase 10+ sections to assemble the workflow.
-   Examples stop at JSON Schema + TS interface; no mapping table or tips for maintaining schema.d.ts parity.
-   Absent confirmation/multiselect `x-prompt` patterns and `$default` walkthroughs → AIs risk hallucinating unsupported prompt formats.
-   Troubleshooting section is helpful but mixed severity items; no dedicated error taxonomy or pointer to validation scripts.

### Codebase Integration Gaps

-   Tests ignore existing Jest utility patterns (`createTreeWithEmptyWorkspace`) and the copier-based harness in utils.ts.
-   Plan instructs running direct `pnpm nx g <generator>` inside template repo; generator lives in generated project, so dry-run should happen in test-output.
-   No mention of updating documentation siblings (nx-generators-guide.md, traceability matrix) per repo conventions.
-   Regression checklist does not include guard rails like `just ai-validate` or `just spec-guard`, both already standardized.

### Generators-First Alignment

-   Tests never ensure the spec describes how to invoke `just ai-scaffold` / Nx generate flow; meta-generator usage is undocumented.
-   No coverage of meta-generators or generator composition patterns, undermining “generator creates generators” target.
-   Plan doesn’t highlight using Nx MCP tools to validate project graph or generator registration.

### Verification Gaps

-   Acceptance criteria don’t require automated detection of lingering TODOs (e.g., via grep) or schema validation with `ajv`.
-   AI agent simulation test lacks success metrics (e.g., verifying `nx lint` / `nx test` on generated code).
-   No baseline comparison against official Nx generators (app/lib/component) despite referencing them earlier.

## Improvement Opportunities

-   Add an AI quick-start (inputs → outputs) plus a mapping table `schema.json ←→ schema.d.ts`.
-   Introduce validation automation: run `ajv`, `pnpm lint`, `just spec-guard`, and `grep TODO`.
-   Document generator composition workflows (calling other Nx generators, orchestrating `nx run-many`).
-   Expand MCP section with actionable context7/ref/exa queries and pre-approved docs to fetch.
-   Provide visual architecture (e.g., layer diagram) alongside the mermaid decision tree.

## Comprehensive Patch

### Critical Patches (Must-Fix)

1. Fill remaining spec TODO sections (Purpose & Scope, Outputs, Targets, Conventions, Rollback, MCP hooks, Review Checklist).

    - Location: Phase 2 (add Tasks 2.5–2.9) and GREEN acceptance criteria.
    - Reason: Unpatched TODOs violate success criteria and will fail RED tests.
    - Implementation: Define concrete prose/templates + examples per section; ensure tests assert their presence.

2. Rework RED tests to use existing tooling and realistic expectations.

    - Location: Phase 1 Test Suite definitions.
    - Reason: Undefined helpers and non-existent strings make the RED step impossible to execute.
    - Implementation: Replace with Jest + copier harness (`readFileSync`, utils.ts), adjust assertions to match final wording, add TODO detection regex.

3. Align commands with workspace practices (`just` recipes, `nx run-many`, copier outputs).
    - Location: Acceptance criteria, regression steps, and script snippets across phases.
    - Reason: Current commands will fail in this repo; breaks TDD loop.
    - Implementation: Use `just test-generation`, `just ai-validate`, run generators inside test-output.

### High-Priority Patches

1. Enrich schema coverage (numeric, array, boolean) and prompt types.

    - Location: Task 2.1 schema section + Pattern library.
    - Reason: Checklist demands coverage of all option types; prevents AI hallucinations.
    - Implementation: Add examples for numbers (`minimum`, `maximum`), arrays with `uniqueItems`, confirmation/multiselect `x-prompt`, `$default` sources (`projectName`, `workspaceName`).

2. Add explicit synchronization guidance for schema.json ↔ `schema.d.ts`.

    - Location: Section 3 (new “Type Mapping Matrix”) and Phase 2 acceptance criteria.
    - Reason: Prevent drift; requested in checklist.
    - Implementation: Provide table mapping each property to TS type + validation rules, plus instructions for regeneration.

3. Document generator composition & conditional templates.
    - Location: Section 3.5 / new Section 6 supplement.
    - Reason: Enables meta-generators and advanced patterns aligned with strategic goal.
    - Implementation: Add examples of calling other generators via `runNxCommand`, include conditional file emission using template filters.

### Medium-Priority Enhancements

1. Introduce AI Quick Start & high-level checklist.

    - Location: Section 13 (AI instructions) intro.
    - Reason: Reduce cognitive load for autonomous agents.
    - Implementation: Add summary table (Inputs/Outputs/Tests) + step-by-step bullet list.

2. Expand troubleshooting into categorized table (schema, runtime, tests) with references to validation scripts.

    - Location: Section 14.
    - Reason: Faster debugging; improves AI guidance.

3. Add validation tooling steps (ajv, lint, spec-guard) inside regression phase.
    - Location: Phase 4 tasks.
    - Reason: Reinforces quality gates & automation.

### Optional Improvements

1. Provide flowchart for generator composition (meta-generator path).
2. Add link matrix cross-referencing spec with docs/instructions.
3. Include sample telemetry/observability hooks (aligned with logging instructions) for future automation.

## Revised Plan Structure

-   Phase 1 (RED): focus on realistic Jest/copier tests + TODO detection.
-   Phase 2 (GREEN): Task breakdown per spec section (1–10 + MCP) with schema matrix and prompt gallery.
-   Phase 3 (REFACTOR): Decision tree + AI quick start + troubleshooting table.
-   Phase 4 (REGRESSION): Copier rerun, ajv validation, `just ai-validate`, AI simulation harness.
-   Appendices: Reference table, validation scripts, spec IDs assignment process.

## Validation Checklist

-   [ ] Every spec section (1–12 + MCP + new AI/Troubleshooting) has concrete content with no TODO markers.
-   [ ] Schema examples span string/number/boolean/array/enum + all `x-prompt` types and `$default` sources.
-   [ ] Tests rely on implemented utilities, fail on missing content, and pass after GREEN.
-   [ ] Commands leverage `just`/`nx` workflows and run inside generated projects.
-   [ ] Spec explains generator composition and conditional templates.
-   [ ] AI quick-start, type mapping matrix, and troubleshooting table present.
-   [ ] Regression plan covers ajv validation, `just ai-validate`, `just spec-guard`, and AI simulation success metrics.

## Recommended Next Steps

1. Update Phase 1 tests to use real copier harness and TODO detection.
2. Add Phase 2 tasks to patch remaining spec sections with schema/prompt enhancements and type mapping.
3. Rework regression/validation commands to align with existing `just` and Nx workflows; document spec ID assignment.
