# VibeCoding: AI-Assisted Development Hub ✨

Welcome to the all-in-one guide for using VS Code + GitHub Copilot in this template. This is your single source of truth for prompts, chat modes, workflows, and tools.

---

## Quick start 🚀

1) Bundle context (CALM + tech stack)
- Run: `just ai-context-bundle`
- Output: `docs/ai_context_bundle/`

2) Pick a mode
- TDD phases: tdd.red → tdd.green → tdd.refactor
- Debug phases: debug.start → repro → isolate → fix → refactor → regress

3) Validate
- Run: `just ai-validate` (safe NO-OP if scripts/projects missing)

4) Scaffold (optional)
- Run: `just ai-scaffold name=@nx/js:lib`

---

## What is here 🧭

- Tutorials — do it step-by-step.
- How-to guides — task-focused playbooks.
- Reference — definitive lists and settings.
- Explanations — background, principles, and design rationale.

Use the sidebar below to jump to what you need.

### Contents
- Tutorials
  - Getting started with TDD + Copilot → `tutorials/getting-started-tdd.md`
- How-to guides
  - Bundle context → `how-to/bundle-context.md`
  - Use chat modes → `how-to/use-chat-modes.md`
  - Scaffold with Nx → `how-to/scaffold-with-nx.md`
  - Validate repo → `how-to/validate-repo.md`
  - Configure MCP tools → `how-to/configure-mcp.md`
- Reference
  - Chat modes → `reference/chat-modes.md`
  - Prompts → `reference/prompts.md`
  - Just recipes → `reference/just-recipes.md`
  - FAQ → `reference/faq.md`
- Explanations
  - Why this workflow → `explanation/ai-workflows-rationale.md`
  - Architecture-aware context → `explanation/architecture-aware-context.md`

---

## Best practices ✅
- Always start from spec IDs; keep changes small and traceable.
- Stay Lean; escalate only when ambiguity spans multiple specs.
- Keep tests close to code and run them frequently.
- Use MCP tools via `.vscode/mcp.json` with env vars; commit no secrets.

See also: `.github/instructions/ai-workflows.instructions.md`.
