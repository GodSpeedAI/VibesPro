# AI Agent Instructions for VibesPro

VibesPro is an AI-native meta-infrastructure: it synthesizes Nx-based, hexagonal apps, ships an embedded AI dev team (architects/TDD/debug), and captures temporal learning for patterns/decisions. Each generated app inherits the same Devbox + mise + SOPS + Just stack and guardrails.

This file routes you to the right specialist guidance in `.github/instructions/`. Keep the cross-cutting rules, then consult the module that matches your task.

## Core Development Principles

- Security beats everything: follow `security.instructions.md`; never auto-approve tools or expose secrets.
- Build from specs with generator-first + TDD: start with Nx generators/Just recipes, write the failing test first per `ai-workflows.constitution.instructions.md`, generate configuration file from thier native tools then modify the generated config files accordingly.
- Preserve traceability and reproducibility: stick to Devbox + mise + SOPS + Just; tag work with spec IDs/ADRs and keep types in sync across languages.

## How to use this map

- Match the trigger below and open that instruction file before implementing.
- If multiple apply: Security → AI workflows constitution → Generator-first/Nx → Architecture → Testing/Refactoring/Debugging → Documentation/Performance.
- When unsure or contexts conflict, ask for the missing input and let the user override.

## Specialized Context Routing

- Designing architecture, new libs/apps, or touching templates (`templates/{{project_slug}}/**`)? → Consult `@architecture.instructions.md` (hexagonal boundaries, typed contracts, generator-first flow, environment parity).
- Working on tests or touching `**/*.test.*`, `tests/**`, or adding repros? → Consult `@testing.instructions.md` (TDD gates, layouts, commands).
- Handling auth/secrets, external I/O, `.vscode/*.json`, or threat reviews? → Consult `@security.instructions.md` (canonical guardrails, STRIDE notes, SOPS).
- Seeing `TODO optimize`, slow paths/pipelines, or token pressure? → Consult `@performance.instructions.md` (measure-first, prompt slimming, caching).
- Updating docs/READMEs/comments or traceability matrices? → Consult `@documentation.instructions.md` and `.github/instructions/docs.instructions.md` (formatting inside `docs/`).
- Debugging failing builds/tests or regressions? → Consult `@debugging.instructions.md` (repro → instrument → isolate).
- Asked to "clean up", "simplify", or rename/move code with no behavior change? → Consult `@refactoring.instructions.md` (small steps, boundary-safe).
- Scaffolding or tweaking Nx config? → Consult `@generators-first.instructions.md` and `@nx.instructions.md` (generator selection, MCP tools).
- Using personas/prompts? → Start with `@ai-workflows.constitution.instructions.md`, then `@ai-workflows.instructions.md` for workflow norms.

## Meta

- Prompts/personas live in `.github/prompts/*.prompt.md` and `.github/agents/*.agent.md`; lint with `just prompt-lint`.
- Default commands: `just ai-validate` (fast), `just test` (full), `just test-generation` (templates), `just ai-scaffold name=<generator>` (scaffold).
- Specs drive everything: PRD/SDS/TS/ADR IDs belong in commits; update `docs/traceability_matrix.md` when behavior changes.
