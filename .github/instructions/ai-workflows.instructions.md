---
description: "AI workflows policy (TDD/Debug)"
applyTo: "**"
kind: instructions
domain: ai-workflows
precedence: 20
---

# AI Workflows Policy (TDD, Debug)

This policy keeps AI-assisted flows safe, portable, and maintainable.

- **Generator-First Policy**
  - **ALWAYS check for Nx generators before writing code**: See `.github/instructions/generators-first.instructions.md`
  - Use `just ai-scaffold name=<generator>` to scaffold components/libs/apps first
  - Only write custom code after confirming no appropriate generator exists
  - Cross-reference with `.github/instructions/nx.instructions.md` for Nx MCP server tools
- Namespacing
  - Use `ai-*` names for Just recipes (e.g., `ai-context-bundle`). Chat modes now use domain.task pattern (e.g., `tdd.red`, `debug.start`).
- Prompt dedupe
  - Extend existing prompts where possible. Only add new ones prefixed `vibecoder-`.
  - Cross-link prompts from chat modes; avoid drift by centralizing shared guidance.
- Context bundle
  - Generate context with `just ai-context-bundle` → `docs/ai_context_bundle/`.
  - Include CALM (`architecture/calm/**`) and `techstack.yaml`; keep script read-only except output.
- Tooling and portability
  - Degrade gracefully when tools are missing (pnpm/Nx). Recipes should not fail hard.
  - Use portable shell (Bash/POSIX) and avoid OS-specific features.
- Security
  - No external assistant CLIs (RooCode/Aider) or auto-approve settings.
  - Use env vars for MCP tool auth; never commit secrets.
- Validation
  - `just ai-validate` runs lint/typecheck if scripts exist and Nx tests when available.
- Documentation
  - Keep this file authoritative for AI workflow conventions; update if modes/recipes change.
