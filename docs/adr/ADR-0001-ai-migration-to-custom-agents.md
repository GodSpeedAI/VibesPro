---
adrs: ADR-0001
title: Migrate Legacy Copilot Chat Modes to VS Code / GitHub Custom Agents
status: Proposed
date: 2025-11-14
deciders:
    - AI Enablement Working Group
matrix_ids:
    - DEV-PRD-007
    - DEV-ADR-003
    - DEV-ADR-007
    - DEV-SDS-006
---

## Context

The repository still carries Copilot "chat mode" personas and helper scripts that pre-date VS Code / GitHub custom agents. While `.github/agents/*.agent.md` already mirrors most personas, orchestration still depends on legacy assets (e.g., `.github/chatmodes/*.chatmode.md` templates, `scripts/normalize_chatmodes.{js,mjs}`, `scripts/check_all_chatmodes.mjs`, `scripts/check_model_lint.mjs`, `scripts/bundle-context.sh`, `scripts/spec_feature.sh`, `scripts/run_prompt.sh`) and distributed guardrails via `*/AGENT.md`. The desired target is a smaller, intentional set of custom agents that orchestrate MCP tools (`context7`, `exa`, `ref`, `nx`, `github`, `microsoft-docs`, `memory`, `vibe-check`) across the Prompt-Driven / Spec-Driven pipeline (idea → spec → plan → implementation → review → tests → knowledge persistence) described in `docs/dev_prd.md`, `docs/dev_sds.md`, `docs/dev_tdd*.md`, and `docs/hybrid-context-workflow.md`.

## Current State Summary

- **Persona assets**
    - Templates still ship 32 legacy chatmodes under `templates/{{project_slug}}/.github/chatmodes/*.chatmode.md`, ensuring downstream projects inherit outdated Copilot configuration alongside new `.github/agents/*.agent.md` files.
    - `.github/agents/` mirrors those personas (debug suite, TDD stages, product personas, security, DevOps, platform, etc.) but lacks consolidation into purpose-built core agents.
    - Repository-wide guardrails live in `AGENT.md` files for `apps/`, `architecture/`, `docs/`, `generators/`, `hooks/`, `libs/`, `ops/`, `scripts/`, `temporal_db/`, `tests/`, `tools/`, `templates/`, and `.github/`, which the current flow expects chat modes to interpret manually.
- **AI scripts + automation**
    - `scripts/normalize_chatmodes.{js,mjs}` keeps frontmatter normalized, `scripts/check_all_chatmodes.mjs` validates references, and `scripts/check_model_lint.mjs` lint-checks model declarations.
    - `scripts/bundle-context.sh` and `scripts/spec_feature.sh` power prompt/PDD workflows, while `scripts/run_prompt.sh` executes `.github/prompts/*.prompt.md` with the current instruction stack.
    - These utilities are wired into docs (`docs/devkit-prompts-instructions-integration.md`, `_template_AGENTS.md`) and CI gatekeepers (`just prompt-lint`, `tests/shell/scripts/*_spec.sh`).
- **MCP usage**
    - `.mcp.json` and `.gemini/settings.json` register the local Nx MCP server (`"command": "npx", "args": ["nx", "mcp"]`).
    - Prompt and agent files (e.g., `.github/agents/tdd.vibepro.agent.md`, `.github/prompts/debug.ci.prompt.md`, `_template_AGENTS.md`) explicitly call out `Context7/*`, `Exa Search/*`, `Ref/*`, `Memory Tool/*`, `Vibe Check/*`, `github/*`, `microsoftdocs/mcp/*`, and `Nx Mcp Server/*` for discovery, grounding, and governance.
    - `_template_AGENTS.md` describes the orchestration pattern (Memory Tool → Context7/Ref → Exa → store learnings) but the legacy flow still binds that guidance to chatmode-era tooling.
- **PDD/SDD pipeline**
    - `docs/dev_prd.md`, `docs/dev_sds.md`, `docs/dev_tdd.md`, `docs/dev_tdd_observability.md`, `docs/implementation-hybrid-context.md`, `docs/hybrid-context-workflow.md`, and `temporal_db/README.md` define the lifecycle from idea capture to persistence (temporal DB keys such as `spec:{id}:{timestamp_nanos}`).
    - Scripts and prompts enforce the lifecycle but rely on persona proliferation rather than a small set of role-specialized agents.

## Decision

Adopt a consolidated custom-agent architecture rooted in VS Code / GitHub agents, retiring the legacy Copilot chatmodes once parity is achieved. The new system will:

1. **Standardize on six core agents** that encapsulate the PDD/SDD lifecycle and toolchain:
    - `planner.core.agent.md` – converts ideas into actionable plans, aligning with `docs/hybrid-context-workflow.md` and `docs/generator_plan_review.md`.
    - `spec.author.agent.md` – drives PRD/SDS/TS authoring using `docs/dev_prd*.md`, `docs/dev_sds*.md`, and `docs/spec_index.md`.
    - `implementer.core.agent.md` – executes generator-first implementation (`.github/instructions/generators-first.instructions.md`, `AGENTS.md`) with Nx + MCP context.
    - `reviewer.core.agent.md` – enforces review, traceability, and testing expectations via `docs/dev_tdd*.md` and `docs/traceability_matrix.md`.
    - `context.curator.agent.md` – tends `scripts/bundle-context.sh`, `docs/ai_context_bundle/`, and knowledge persistence (temporal DB, `_template_AGENTS.md`).
    - `mcp.orchestrator.agent.md` – manages MCP connections (`context7`, `exa`, `ref`, `nx`, `github`, `microsoft-docs`, `memory`, `vibe-check`) and validates tool health per `_template_AGENTS.md`.
2. **Map each pipeline phase to those agents**, allowing existing guardrails (AGENT.md files, instructions stack) to be composed per task without duplicating personas.
3. **Defer validation commands** to established specifications (`docs/dev_tdd.md`, `docs/dev_tdd_observability.md`, `docs/dev_prd.md`, `docs/dev_sds.md`), ensuring this ADR does not introduce competing instructions for running tests.

## Target State Summary

- **Minimal agent roster** lives under `.github/agents/` with cross-linking to instructions and AGENT.md guardrails; legacy persona agents remain only as thin adapters referencing the new cores until downstream templates can drop them.
- **MCP ritual**
    - `context7` and `ref` deliver canonical API docs, `microsoft-docs` (per `.github/agents/tdd.vibepro.agent.md`) handles Microsoft Learn coverage, `exa` supplements real-time examples, `nx` surfaces workspace insights, `github` handles repo state, `memory` persists insights, and `vibe-check` enforces governance.
    - `.mcp.json` (and eventual per-workspace overrides) encode these servers so custom agents can reuse a single configuration surface.
- **PDD/SDD architecture** binds idea capture to spec authoring, plan synthesis, implementation, review, test, and knowledge persistence:
    - Idea inputs come from `docs/ideation-insights.md`, `docs/implementation-hybrid-context.md`.
    - Spec authoring references `docs/dev_prd*.md`, `docs/dev_sds*.md`, `docs/dev_technical-specifications.md`.
    - Planning references `docs/generator_plan_review.md`, `docs/generator-workflow-diagram.md`.
    - Implementation leverages generator-first rules plus Nx MCP data (`AGENTS.md`, `.github/instructions/generators-first.instructions.md`, `.github/instructions/nx.instructions.md`).
    - Review/testing lean on `docs/dev_tdd*.md`, `tests/shell/scripts/*`, and `just` recipes (per docs) without restating commands here.
    - Knowledge persistence handled via `temporal_db/README.md` and `docs/ai_context_bundle/`.

## Migration Plan

1. **Discovery**
    - Catalog remaining chatmodes, agents, scripts, and AGENT.md dependencies (already captured in this ADR).
    - Identify downstream templates (`templates/{{project_slug}}/.github/chatmodes`, `templates/{{project_slug}}/.github/agents`, `templates/AGENT.md`) that need updating.
2. **Design**
    - Draft the six core agent files with explicit links to MCP tools and instruction stacks.
    - Define how legacy personas map to the new cores (e.g., `debug.*` delegates to `implementer.core` + `reviewer.core`).
    - Update `_template_AGENTS.md` and `AGENT-MAP.md` to reflect the new architecture.
3. **Implementation**
    - Create the new `.github/agents/*.agent.md` files, refactor existing agents to reference them, and adjust `AGENT.md` guardrails to highlight the new routing.
    - Update scripts (`scripts/normalize_chatmodes.*`, `scripts/check_all_chatmodes.mjs`, `scripts/bundle-context.sh`) to operate on the new agent set and deprecate chatmode assumptions.
    - Adjust templates (`templates/{{project_slug}}/.github/agents`, `.github/chatmodes`) so synthesized projects receive the core agents.
4. **Validation**
    - Follow testing and validation guidance already defined in `docs/dev_tdd.md`, `docs/dev_tdd_observability.md`, `docs/devkit-prompts-instructions-integration.md`, and related specs to verify the new agents behave as expected (no new commands defined here).
    - Ensure MCP endpoints remain reachable (context7/ref/exa/nx/github/microsoft-docs/memory/vibe-check) via `.mcp.json` and `just` workflows.
5. **Rollout**
    - Remove legacy chatmode files once the templates and scripts default to the new agents.
    - Communicate the change in `docs/project_state.md` and update `docs/traceability_matrix.md` with the new ADR ID.

## Constraints

- **Generator-first + Nx requirements** remain in force (`.github/instructions/generators-first.instructions.md`, `AGENTS.md`, `.github/instructions/nx.instructions.md`).
- **Hexagonal architecture and security guardrails** from `.github/instructions/security.instructions.md`, `.github/instructions/ai-workflows.constitution.instructions.md`, and `.github/instructions/general.instructions.md` must remain authoritative; agents cannot bypass them.
- **Microsoft Learn MCP availability** is mandatory because multiple prompts (`.github/agents/tdd.vibepro.agent.md`, `_template_AGENTS.md`) expect `microsoftdocs/mcp/*` to ground Azure/VS Code decisions.
- **Prompt-as-code lifecycle** (DEV-ADR-007) continues to treat agent files like code: linted via existing scripts, validated via `just prompt-lint`, documented in `_template_AGENTS.md`.

## Non-goals

- Rewriting every persona immediately; thin compatibility layers may remain temporarily.
- Changing the existing testing/validation commands or introducing parallel `just` recipes (this ADR defers to the specs listed above).
- Altering temporal DB schemas or AI context bundle tooling beyond aligning them with the new agents.

## Follow-up Actions

1. Land the six core `.github/agents/*` files and document their responsibilities in `_template_AGENTS.md`.
2. Update `templates/{{project_slug}}` so downstream projects ship only the core agents, referencing this ADR.
3. Re-run traceability updates (`docs/traceability_matrix.md`, `docs/dev_adr.md`) to reference `ADR-0001`.
