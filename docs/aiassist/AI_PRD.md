# AI-Assisted Integration Product Requirements Document

## AI_PRD-001 — Generated projects ship with consolidated AI governance

- **Related ADRs:** AI_ADR-001, AI_ADR-002
- **Requirement (EARS):** When generating a project, the Copier template shall populate the `.github` directory with the merged instructions, prompts, chat modes, model defaults, and workflows so that developers receive spec-driven guidance immediately.
- **User Stories:**
    - As a project maintainer, I need every generated repository to include the same AI workflows so that contributors follow a consistent process.
    - As a developer, I want preconfigured chat modes and prompts so that I can interact with Copilot using the project’s conventions.
- **Acceptance Criteria:**
    1. Generated repositories contain `copilot-instructions.md`, modular instruction files, prompt catalog, chat modes, `models.yaml`, and CI workflows.
    2. Prompt linting passes in the generated workspace using the default tooling.
    3. Documentation within the generated repository references the AI guidance files.
- **Success Metrics:**
    - 100% of generated repositories include the consolidated `.github` assets.
    - Prompt lint pipeline passes in ≥ 95% of CI runs for newly generated projects.

## AI_PRD-002 — Documentation available for maintainers and generated users

- **Related ADRs:** AI_ADR-001, AI_ADR-003
- **Requirement (EARS):** When updating the template, the maintainers shall provide AI workflow documentation in `docs/aiassist/`, and the Copier template shall emit user-facing AI guidance into generated docs so that both audiences understand expectations.
- **User Stories:**
    - As a template maintainer, I need a canonical reference to evolve the AI system.
    - As a generated-project user, I want accessible instructions describing AI workflows without hunting through maintainer notes.
- **Acceptance Criteria:**
    1. `docs/aiassist/` contains maintainer-focused ADR, PRD, SDS, TS, and integration plan documents.
    2. Generated projects include AI workflow onboarding material referenced from their README or docs tree.
    3. Documentation updates link to relevant spec IDs.
- **Success Metrics:**
    - 100% of generated projects expose an AI onboarding document.
    - Maintainer docs are updated within one release cycle of major AI workflow changes.

## AI_PRD-003 — Automation for spec and AI workflows in generated projects

- **Related ADRs:** AI_ADR-001, AI_ADR-004
- **Requirement (EARS):** When running developer commands, the generated project shall expose `just` recipes and package scripts that scaffold specs, bundle AI context, lint prompts, and run AI validation so that teams follow the mandated lifecycle.
- **User Stories:**
    - As a developer, I want a single command to bundle AI context before using chat modes.
    - As a tech lead, I need traceability tooling to be one command away to enforce compliance.
- **Acceptance Criteria:**
    1. `just --list` in a generated repo includes `spec-*`, `ai-*`, TDD, and debug recipes.
    2. Corresponding shell scripts exist and execute successfully on Linux and macOS.
    3. Package scripts provide `prompt:lint`, `spec:matrix`, and `ai-validate` orchestration.
- **Success Metrics:**
    - Developers report < 5 minutes setup time to run AI workflows locally.
    - Spec matrix generation succeeds in ≥ 95% of CI runs for generated projects.

## AI_PRD-004 — MCP tools and stack-aware generators available post-generation

- **Related ADRs:** AI_ADR-002, AI_ADR-004
- **Requirement (EARS):** When configuring AI tools, the generated project shall include MCP descriptors and stack-aware generator utilities so that teams can register external tools and scaffold services using the resolved tech stack.
- **User Stories:**
    - As an AI engineer, I want documented MCP descriptors to integrate external sources quickly.
    - As a platform engineer, I need generator defaults that honor the tech stack metadata.
- **Acceptance Criteria:**
    1. Generated repositories contain `mcp/tool_index.md` and example tool descriptors.
    2. Stack-aware Nx generators are available and tested via unit or integration tests.
    3. Documentation explains environment variables required for MCP integration.
- **Success Metrics:**
    - 100% of generated projects expose MCP descriptors.
    - Generator tests achieve ≥ 90% pass rate across supported configurations.

## AI_PRD-005 — Continuous validation for template and generated outputs

- **Related ADRs:** AI_ADR-001, AI_ADR-005
- **Requirement (EARS):** When CI executes, the template repository and generated projects shall run prompt lint, spec matrix checks, AI validation, and smoke tests so that regressions are caught before release.
- **User Stories:**
    - As a release manager, I want automated confidence that AI workflows remain intact.
    - As a developer, I need failing CI to communicate which AI guardrail broke.
- **Acceptance Criteria:**
    1. Template CI invokes Copier to generate a project and runs the AI validation suite against it.
    2. Generated-project CI definitions include prompt lint, spec matrix, and AI validation steps.
    3. CI logs clearly reference failing guardrails with remediation guidance.
- **Success Metrics:**
    - Less than 5% of CI runs fail due to missing AI assets.
    - Mean time to detect AI workflow regressions < 1 day.
