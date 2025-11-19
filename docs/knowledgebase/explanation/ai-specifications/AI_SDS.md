# AI-Assisted Integration Software Design Specification

## AI_SDS-001 — Template asset layout and propagation

- **Implements PRDs:** AI_PRD-001, AI_PRD-003
- **Overview:** Organize AI workflow assets inside the Copier template so that generated repositories receive them automatically.
- **Components & Responsibilities:**
    - `templates/{{project_slug}}/.github/`: Houses instructions, prompts, chat modes, models, and workflows.
    - `templates/{{project_slug}}/package.json.j2`: Defines scripts for prompt lint, spec matrix, AI validation, and Nx tasks.
    - `tools/` (template-level and generated output) scripts provide shared automation for prompt linting and traceability updates.
- **Interfaces:**
    - Copier rendering pipeline copies template assets to the generated project root.
    - Nx CLI and pnpm scripts consume the files to run tests and linting.
- **Data Flow:** Instructions and prompts feed Copilot; workflows execute in CI to validate the assets.
- **Error Handling:** Missing assets cause CI jobs to fail with explicit error messages pointing to the absent file; template smoke tests verify presence prior to release.
- **Testing Strategy:**
    - Unit tests for script execution (mocking shell behavior where practical).
    - Integration test inside template CI that generates a project and asserts asset presence.

## AI_SDS-002 — Documentation delivery pipeline

- **Implements PRDs:** AI_PRD-002
- **Overview:** Provide two documentation channels—maintainer-focused in `docs/aiassist/` and generated-project onboarding via template docs.
- **Components & Responsibilities:**
    - Maintainer docs: `docs/aiassist/` stores ADR, PRD, SDS, TS, integration plan, and traceability files.
    - Template docs: `templates/{{project_slug}}/docs/**` and `templates/{{project_slug}}/README.md.j2` provide user-facing instructions.
    - Synchronization script (optional) detects drift between maintainer guidance and template outputs.
- **Interfaces:**
    - Maintainers update Markdown files directly.
    - Generated users consume docs through static site generators or direct Markdown reading.
- **Data Flow:** Maintainer decisions flow into template doc templates, which Copier renders.
- **Error Handling:** Template smoke tests inspect generated docs for required section headers; failure emits actionable messages.
- **Testing Strategy:**
    - Markdown lint and link checking across both maintainer and template docs.
    - Snapshot tests verifying rendered docs include AI workflow sections.

## AI_SDS-003 — Automation and workflow commands

- **Implements PRDs:** AI_PRD-003, AI_PRD-004
- **Overview:** Embed `just` recipes, shell scripts, and package scripts that orchestrate spec scaffolding, AI context bundling, prompt linting, MCP documentation, and generator utilities.
- **Components & Responsibilities:**
    - `templates/{{project_slug}}/justfile.j2`: Defines `spec-*`, `ai-*`, TDD, debug, and validation commands.
    - `templates/{{project_slug}}/scripts/`: Hosts shell scripts such as `bundle-context.sh`, `plan_techstack.sh`, `sync_techstack.sh`, and spec helpers.
    - `templates/{{project_slug}}/mcp/`: Contains `tool_index.md` and example tool descriptors.
    - Generator utilities under `templates/{{project_slug}}/tools/generators/` provide stack-aware scaffolding.
- **Interfaces:**
    - Developers invoke `just` commands; scripts interact with pnpm, Nx, Python, and shell utilities.
    - MCP configuration references environment variables and `.vscode/mcp.json` instructions documented for users.
- **Data Models:**
    - Tech stack JSON (`tools/transformers/.derived/techstack.resolved.json`) informs generator defaults.
    - MCP descriptor metadata (YAML/Markdown) describes tool IDs, commands, and environment requirements.
- **Error Handling:**
    - Scripts exit with non-zero codes and clear messaging when prerequisites are missing (e.g., pnpm absent).
    - Generator execution logs warnings rather than failing when optional stack defaults are unavailable.
- **Testing Strategy:**
    - Unit tests for generator utilities using Nx testing harness.
    - End-to-end tests running key `just` commands inside the generated project during CI.

## AI_SDS-004 — Continuous integration safeguards

- **Implements PRDs:** AI_PRD-001, AI_PRD-005
- **Overview:** Ensure both template and generated projects run validation suites that confirm AI assets remain functional.
- **Components & Responsibilities:**
    - Template CI workflows (`.github/workflows`) trigger: prompt lint, spec matrix, generation smoke tests, AI validation, Nx/node tests.
    - Generated-project workflows (rendered from template) replicate prompt lint, spec matrix, AI validation, and Nx tests.
    - Reporting hooks annotate pull requests with failures referencing relevant guardrails.
- **Interfaces:**
    - GitHub Actions orchestrate steps; Nx and pnpm provide execution contexts.
    - Generated workspace CI integrates with project-level tooling (e.g., adapters for Jenkins or other runners if needed).
- **Error Handling:**
    - Workflow steps fail fast with descriptive log output pointing to missing assets or failing scripts.
    - Template CI halts release pipelines until issues are resolved.
- **Testing Strategy:**
    - Periodic dry runs of workflows to validate tokens and timeouts.
    - Regression tests verifying failure modes (e.g., intentionally removing a prompt file to ensure CI fails as expected).
