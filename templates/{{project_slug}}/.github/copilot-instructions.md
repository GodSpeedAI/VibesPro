# Repository‑Wide Copilot Instructions

The purpose of these instructions is to provide repository‑specific guidance to GitHub Copilot and VS Code's AI chat features. These instructions apply to every file in the repository.

## 🎯 Core Principles (HIGHEST PRIORITY)

- **Generator-First Requirement**: Before writing any new code, ALWAYS check if an Nx generator exists to scaffold it. Use `just ai-scaffold name=<generator>` or consult `.github/instructions/generators-first.instructions.md` and `.github/instructions/nx.instructions.md`. Only write custom code after confirming no appropriate generator exists.
- **Security First**: Never write or modify `.vscode/settings.json` or `.vscode/tasks.json` without explicit user confirmation. Avoid setting `chat.tools.autoApprove` in any configuration, as this disables human confirmation and can lead to remote code execution.

## 📋 General Guidelines

- This repository contains a modular AI assistant and related tooling written primarily in TypeScript with a Node.js runtime. When generating code, follow our established coding guidelines, naming conventions, and architectural patterns described in the instruction files under `.github/instructions`.sitory‑Wide Copilot Instructions

The purpose of these instructions is to provide repository‑specific guidance to GitHub Copilot and VS Code’s AI chat features. These instructions apply to every file in the repository.

- This repository contains a modular AI assistant and related tooling written primarily in TypeScript with a Node.js runtime. When generating code, follow our established coding guidelines, naming conventions, and architectural patterns described in the instruction files under `.github/instructions`.
- Always prioritize security: never write or modify `.vscode/settings.json` or `.vscode/tasks.json` without explicit user confirmation. Avoid setting `chat.tools.autoApprove` in any configuration, as this disables human confirmation and can lead to remote code execution.
- Use composition over inheritance when designing classes. Favor small, testable functions and modules. Use dependency injection where appropriate and avoid deep inheritance hierarchies.
- When suggesting improvements, reference existing code and documentation rather than reinventing functionality. Use relative import paths and keep modules loosely coupled.
- Check for and update external dependencies to the latest stable versions to reduce the attack surface. Do not add packages with known vulnerabilities.
- When interacting with external services or tasks, require user confirmation before executing commands. Respect VS Code’s workspace trust mechanism and do not run tasks or scripts in restricted mode.
- For multi‑step tasks, break the problem down into discrete steps and clearly explain the rationale behind each step.
- Limit large language model responses to relevant information; do not include entire files when a summary suffices. Encourage token efficiency and performance‑conscious design.
- Always follow best practices for code quality, including writing tests, adhering to style guides, and conducting code reviews.
- Do not introduce technical debt and if you notice any, create a plan to address it.

For more detailed guidelines, see the individual instruction files in `.github/instructions`.

## Spec-driven workflow and ordering
- Prefer architectural and interface constraints first: ADR → SDS/Technical Specs → PRD → DEV-* specs (DEV-PRD/DEV-ADR/DEV-SDS/DEV-TS).
- If conflicts arise, capture a short “Spec Gaps” note in the relevant doc and propose 2–3 options.
- Maintain traceability: reference spec IDs in code/doc comments and commits, and keep the matrix up to date.

See: `docs/spec_index.md`, `docs/dev_spec_index.md`, and `docs/traceability_matrix.md` (if present).

## Commit messages and reviews
- Follow `.github/instructions/commit-msg.instructions.md` for commit messages.
- Summaries should explain what/why with spec IDs, note risks and mitigations, and keep the subject ≤ 72 chars in imperative mood.

## MCP tools (optional)
- Tool descriptors live under `mcp/` with a `tool_index.md` and individual `*.tool.md` files.
- Do not hardcode secrets; read tokens from environment variables in settings or runtime.
- These descriptors are optional and may be used to document available tools for MCP-aware setups.

## Using AI workflows (TDD, Debug)
- Chat modes added under `.github/chatmodes/`:
  - TDD: `tdd.red`, `tdd.green`, `tdd.refactor`
  - Debug: `debug.start`, `debug.repro`, `debug.isolate`, `debug.fix`, `debug.refactor`, `debug.regress`
- Prompts: `.github/prompts/tdd.workflow.prompt.md`, `.github/prompts/debug.workflow.prompt.md` (kept concise; align to specs and CALM).
- Context bundle: run `just ai-context-bundle` to generate `docs/ai_context_bundle/` (contains CALM + tech stack + key docs). Chat modes reference this path.
- Validation: `just ai-validate` runs lint/typecheck and optional Nx tests.
- Scaffolding: `just ai-scaffold name=<generator>` wraps `pnpm exec nx g` (safe if pnpm/Nx missing).

See: `.github/instructions/ai-workflows.instructions.md` for conventions and risk mitigations.
