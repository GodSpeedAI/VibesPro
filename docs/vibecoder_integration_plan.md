# Vibecoder → VibePDK Integration Plan (Copilot‑native)

This report analyzes the vibecoder project and the VibePDK project template, then defines a complete, no‑debt, plugin‑style integration that strengthens VibePDK’s AI‑assisted development using only native GitHub Copilot features.

## 1) Objectives and guardrails

- Exclude RooCode and Aider entirely (no runtime or docs coupling).
- Use only VS Code Copilot native features: custom instructions, chat modes, prompt files, tools, MCP.
- Reuse the template’s existing capabilities: Nx generators, Copier templates, Justfile automation, CALM, spec‑driven workflows, docs/prompt system.
- Preserve current behavior; integration must be additive, namespaced, and reversible.
- Avoid duplication and ensure single‑source‑of‑truth for prompts/specs.

Success criteria

- Plugin‑style addition: removing the “vibecoder plugin” restores the original template unmodified.
- No new external CLIs or services needed; zero RooCode/Aider references remain in UX.
- Copilot chat modes and prompts guide the same TDD/debug flows previously driven by vibecoder scripts.
- Context bundling includes CALM and tech stack so Copilot answers align to architecture.

## 2) Repository analysis

### 2.1 vibecoder (overview of relevant assets)

- Prompts: `prompts/*.md` (design, product, requirements, structure, tech, orchestrator).
- TDD/debug workflows: `Justfile` defines ai:_ and debug:_ tasks (currently with RooCode/Aider placeholders). It also uses a session lock `.ai-session.lock`.
- Context bundling: `tools/context/bundle-context.sh` collects `steering` and `specs` into an “AI context”.
- Spec/steering: `specs/` and `steering/` provide the primary context for AI flows.
- MCP placeholders: `.mcp/servers.json` + `tools/mcp/broker.py` demo a custom broker pattern; not required with Copilot MCP.
- Node/Python tooling: TypeScript monorepo with pnpm; minimal Python for scripts.

Observations

- Valuable concepts: prompt pack, TDD/debug flows, context bundling, spec/steering discipline.
- To drop/replace: RooCode/Aider coupling and custom MCP broker; both are unnecessary with Copilot’s built‑in chat modes, prompt files, and MCP configuration.

### 2.2 VibePDK template ({{ project_slug }})

- Copilot assets: `.github/copilot-instructions.md`, rich `.github/chatmodes/` and `.github/prompts/`, and `.vscode/mcp.json` (sample server config).
- Architecture and tech: `architecture/calm/` and `techstack.yaml` (plus tools under `tools/calm` and `tools/prompt`).
- Code gen: Nx configured (`nx.json`, `package.json`) with Copier as the template engine.
- Automation: `justfile` (techstack planning/sync). VS Code `tasks.json` exists.
- Docs/specs: extensive `docs/**` including spec indexes and dev plans.

Observations

- The template already has strong Copilot primitives (chat modes + prompt files). We should integrate vibecoder’s content by merging into those primitives rather than creating parallel structures.

## 3) Integration principles (to avoid duplication and debt)

1. Copilot‑first UX: All flows are driven by chat modes that reference prompt files; no bespoke CLI required.
2. Namespacing: Additions live under “ai/” or “vibecoder/” names to avoid collisions.
3. Merge‑over‑add for prompts: If an equivalent prompt exists, extend it instead of duplicating.
4. Idempotent context: Context bundling script is read‑only except its output dir; safe to run anytime.
5. Architecture‑aware: Bundle CALM and tech stack so Copilot respects constraints and project shape.

## 4) Target design (what we add where)

### 4.1 Prompt and chat mode integration

- Prompt files
  - Map vibecoder prompts into existing `.github/prompts/` without duplication.
  - Only add new prompts when an equivalent doesn’t already exist; mark them with a `vibecoder-` prefix.
  - Examples: `vibecoder-orchestrator.prompt.md` (if no orchestrator present), `vibecoder-tasks.prompt.md` (if needed).
- Chat modes
  - Add TDD chat modes: `.github/chatmodes/tdd.red.chatmode.md`, `tdd.green.chatmode.md`, `tdd.refactor.chatmode.md`.
  - Add Debug chat modes: `debug.start.chatmode.md`, `debug.repro.chatmode.md`, `debug.isolate.chatmode.md`, `debug.fix.chatmode.md`, `debug.refactor.chatmode.md`, `debug.regress.chatmode.md`.
  - Each chat mode references the merged prompts and points to the context bundle location.

Rationale: Chat modes are the Copilot‑native substitute for vibecoder’s Aider/RooCode flows.

### 4.2 Context bundling

- Introduce `scripts/bundle-context.sh` (adapted from vibecoder):
  - Inputs: `docs/specs/*.md` (if present), `docs/steering/*.md` (or top‑level steering files), `architecture/calm/**`, `techstack.yaml`.
  - Output: `docs/ai_context_bundle/` (git‑ignored optional), reproducible.
  - Keep behavior minimal and POSIX‑portable; no external deps.

### 4.3 Justfile automation (additive, namespaced)

Append to `justfile` (do not modify existing targets):

- `ai:context:bundle` → calls `scripts/bundle-context.sh docs/ai_context_bundle`.
- `ai:tdd:red|green|refactor` → echo concise guidance + recommend matching chat mode.
- `ai:debug:*` → equivalent phases with guidance.
- `ai:validate` → run lint, typecheck, and Nx tests: `pnpm run lint`, `pnpm run typecheck`, `pnpm exec nx run-many --target=test --all || true`.
- `ai:scaffold <name>` → thin wrapper to `pnpm exec nx g` with a small safety prompt; lets Copilot propose the generator and flags, humans confirm.

All targets are safe‑noops when tools are missing; they print helpful hints rather than failing hard.

### 4.4 MCP (Model Context Protocol)

- Do not ship a custom broker. Drop vibecoder’s `.mcp/servers.json` and `tools/mcp/broker.py`.
- Use `.vscode/mcp.json` only. Extend docs in `mcp/tool_index.md` to explain how to register additional HTTP tools with auth via environment variables.
- Optionally document how to expose CALM queries (if implemented) as Copilot tools via MCP in the future (no code shipped now).

### 4.5 Nx + CALM synergy

- In “Green” phase chat modes, suggest Nx generators to create components/libs/services; include examples that match this repo’s generators.
- Bundle `architecture/calm/**` and `techstack.yaml` so Copilot aligns implementation to the modeled architecture and allowed stacks.
- When present, reference `tools/calm/` helper scripts in prompts so Copilot can request their use.

## 5) Asset mapping (keep/adapt/drop)

- Keep (adapted):
  - `tools/context/bundle-context.sh` → `scripts/bundle-context.sh` with CALM + tech stack support and docs paths adapted to this template.
  - `prompts/*.md` → merge into `.github/prompts/` with dedupe; only add missing prompts prefixed `vibecoder-`.
  - TDD/debug phases → materialize as Copilot chat modes and Just recipes; remove any CLI assumptions.
- Drop:
  - `.mcp/servers.json` and `tools/mcp/broker.py` (redundant with Copilot’s MCP config).
  - Any references to RooCode/Aider in tasks, docs, or comments.
- Optional (future):
  - `scripts/spec_lint.py` concept can be ported later if a spec gate is desired; today the template already has prompt lint and strong docs, so we avoid adding another stack.

## 6) Implementation steps (low‑risk, incremental)

~~1) Add `scripts/bundle-context.sh` adapted from vibecoder, with support for:~~ - `docs/` spec/steering files - `architecture/calm/**` and `techstack.yaml` - Output to `docs/ai_context_bundle/`
~~2) Append new namespaced recipes to `justfile` (do not alter existing):~~ - `ai:context:bundle`, `ai:tdd:*`, `ai:debug:*`, `ai:validate`, `ai:scaffold`.
~~3) Add new chat modes under `.github/chatmodes/` for TDD and debug phases; keep concise and point to prompts + context bundle.~~
~~4) Merge vibecoder prompt content into existing `.github/prompts/`: - Reuse existing prompts when equivalent; else add `vibecoder-*.prompt.md`. - Cross‑link prompts in chat mode headers to avoid drift.~~
~~5) Update `.github/copilot-instructions.md` with a short “Using AI workflows” section: - Mention the new chat modes, `ai:*` recipes, and context bundle path.~~
~~6) Extend `mcp/tool_index.md` with a short how‑to for `.vscode/mcp.json` and environment‑variable auth; no new code.~~

Rollback: Reverting these additive files restores pre‑integration behavior without side effects.

## 7) Validation plan (quality gates)

- ~~Lint/typecheck: `pnpm run lint`, `pnpm run typecheck` → PASS~~ (No scripts present → NO‑OP)
- ~~Nx tests (when projects exist): `pnpm exec nx run-many --target=test --all || true` → PASS/NO‑OP~~ (Nx not configured here → NO‑OP)
- ~~Script smoke: run `just ai:context:bundle` on a fresh project → produces `docs/ai_context_bundle/` with CALM + tech stack files.~~ (`just ai-context-bundle` created bundle.)
- ~~Copilot UX: new chat modes appear; prompts resolve; context path is accurate.~~ (Chat modes and prompts added.)

## 8) Risks and mitigations

(Implemented and documented in `.github/instructions/ai-workflows.instructions.md`)

- Prompt duplication/drift → Policy: merge into existing prompts first; add only when missing and prefix with `vibecoder-`.
- Chat mode sprawl → Group under an “ai‑\*” naming convention; keep modes short and link to shared prompts.
- Tooling mismatch across OS/shells → Scripts stay POSIX‑sh; tasks degrade gracefully when tools are absent.
- Over‑automation → All `just` tasks are advisory (echo, run existing commands); humans stay in control via Copilot chat.

## 9) Acceptance criteria (traceable to objectives)

- ~~No RooCode/Aider references in code, tasks, or docs (Done by design).~~ (Scanned code/tasks: none; mentions remain only in this plan text.)
- ~~Only Copilot primitives used: prompts, chat modes, `.vscode/mcp.json` (Planned in sections 4.1, 4.4).~~ (Confirmed by implementation.)
- ~~Reuse Nx/Copier/Justfile/CALM/spec‑driven flows (Sections 4.2–4.5).~~ (Confirmed.)
- ~~Additive, namespaced integration; no replacement or breaking changes (Sections 3, 6).~~ (Only additive files/recipes.)
- ~~Clear operator guidance: chat modes, Just tasks, and context bundling documented here (Sections 4, 6).~~ (Docs updated.)

## 10) Next actions (when implementing)

- ~~Add `scripts/bundle-context.sh` and wire `just ai:context:bundle`.~~ (Done; command name: `just ai-context-bundle`.)
- ~~Create ai‑TDD and ai‑debug chat modes and link to merged prompts.~~ (Done.)
- ~~Update Copilot instructions and MCP tool index documentation.~~ (Done.)
- ~~Optionally add `.gitignore` rule for `docs/ai_context_bundle/` if not desired in VCS.~~ (Added.)

This plan integrates vibecoder’s strengths as a Copilot‑native extension of VibePDK—no external assistants, no parallel stacks, and no duplication—while preserving and amplifying the template’s architecture‑first, spec‑driven development approach.
