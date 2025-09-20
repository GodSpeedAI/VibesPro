# VibePDK AI Agent Playbook

## Purpose & Scope
This playbook explains how the Cookiecutter template at `{{ project_slug }}/` orchestrates Copilot instructions, chat modes, prompts, and supporting tooling. Use it when you customize or operate the generated project so every agent (human or AI) follows the same guardrails defined in `docs/dev_prd.md`, `docs/dev_implementation_plan.md`, and the `.github` policy files that ship with the template.

## Core Tenets
- **Traceable by design** — Every change cites spec IDs from `docs/dev_spec_index.md` and related PRD/ADR/SDS references. Chat responses should echo those IDs to keep `traceability_matrix.md` accurate.
- **Instruction stacking, not ad hoc priming** — `.github/instructions/*.md` compose from general ⇒ domain ⇒ testing ⇒ style per precedence rules in `.github/instructions/ai-workflows.instructions.md`.
- **Lean context, explicit bundles** — Generate shared context with `just ai-context-bundle` (`scripts/bundle-context.sh`). Chat modes assume the bundle exists under `docs/ai_context_bundle/`.
- **Security defaults first** — Follow `.github/instructions/security.instructions.md`; never enable `chat.tools.autoApprove` and keep MCP secrets out of version control.
- **Strategic debt only** — Default to documented best practices. When you must incur debt, record the rationale, exit criteria, and owner in the relevant spec (`docs/dev_prd.md`, ADRs, or `docs/vibelog.txt`) so it stays deliberate and timeboxed.
- **TDD & debug cadence** — Workflows in `justfile` (`tdd-*`, `debug-*`) mirror chat modes (`tdd.red`, `debug.start`, etc.) and prompts such as `.github/prompts/tdd.workflow.prompt.md`.
- **Prompt-as-code lifecycle** — Treat `.github/prompts/*.prompt.md` and `.github/chatmodes/*.chatmode.md` as first-class code. Lint and preview with `pnpm lint:shell`, `tools/prompt/*`, or `just ai-validate` before committing.
- **Portability over tooling lock-in** — Scripts in `scripts/` rely on POSIX shell and degrade gracefully when Nx/pnpm are absent (`just ai-scaffold` prints manual commands when needed).

## Agent Stack Overview
There are five cooperating layers. Activate them intentionally and cite the source file so others can follow along.

| Layer | Focus | Primary assets |
|-------|-------|----------------|
| Foundation guardrails | Shared safety, context, testing, and style | `.github/instructions/*.md`
| Execution workflows | TDD and debugging phases wired to chat modes & prompts | `.github/chatmodes/tdd.*`, `.github/chatmodes/debug.*`, `.github/prompts/tdd.workflow.prompt.md`
| Planning & spec | Lean/wide spec elaboration, planning, feature gating | `.github/chatmodes/spec.*`, `.github/chatmodes/planning.plan.chatmode.md`, `.github/prompts/spec.*`
| Specialist personas | Role-specific guidance for architect, PM, QA, UX, security, DevOps | `.github/chatmodes/persona.*`, `.github/chatmodes/product.*`, `.github/chatmodes/sec.*`
| Ops & support | Platform bootstrap, tech stack sync, MCP tools | `.github/chatmodes/platform.*`, `.github/prompts/tool.techstack.sync.prompt.md`, `mcp/tool_index.md`

### 1. Foundation Guardrails (Instruction Agents)
- **General & context** — `.github/instructions/general.instructions.md` and `context.instructions.md` keep responses concise, cite sources, and encourage retrieval rather than speculation.
- **AI workflow policy** — `ai-workflows.instructions.md` defines naming, token budgeting, and validation requirements that every workflow agent follows.
- **Security** — `security.instructions.md` is canonical. Reference it whenever generating settings, scripts, or MCP configs.
- **Testing & performance** — `testing.instructions.md` enforces red/green/refactor gates; `performance.instructions.md` covers profiling requests. Pair them with relevant prompts (e.g., `test-hardening.prompt.md`).
- **Language style** — `style.python.instructions.md` and `style.frontend.instructions.md` scope to server/client code paths; observe them before scaffolding new modules.
- **Docs & commit hygiene** — `docs.instructions.md`, `dev-docs.instructions.md`, and `commit-msg.instructions.md` align doc updates with Diátaxis and ensure commits carry spec IDs (backed by `.husky/commit-msg`).

### 2. Execution Workflows (Chat Mode Agents)
- **TDD triad** — `tdd.red`, `tdd.green`, `tdd.refactor` map to `just tdd-*` recipes. Start with failing tests, implement minimally, then refactor while keeping specs in sync. Use `.github/prompts/vibecoder-tdd.prompt.md` or `tdd.workflow.prompt.md` when you need structured dialogue.
- **Debug pipeline** — `debug.start → debug.repro → debug.isolate → debug.fix → debug.refactor → debug.regress` align with `just debug-*` helpers and `debug.workflow.prompt.md`. Capture reproduction steps in `tests/` or scripts before editing code.
- **Runtime instrumentation** — `debug.isolate` encourages adding temporary metrics/logs, backed by `tools/metrics/logger.js` described in `docs/dev_implementation_plan.md`.

### 3. Planning & Spec Agents
- **Spec shaping** — `spec.lean.chatmode.md` for lightweight discovery; escalate to `spec.wide.chatmode.md` when multi-spec alignment is required.
- **Change orchestration** — `.github/prompts/spec.change.prompt.md`, `.github/prompts/spec.implement.prompt.md`, and `.github/prompts/spec.traceability.update.prompt.md` enforce updates across `docs/dev_spec_index.md`, `traceability_matrix.md`, and `spec_index.md`.
- **Planning** — `planning.plan.chatmode.md`, `product.features-list.chatmode.md`, and `platform.target-platforms.chatmode.md` support backlog shaping, while `.github/prompts/spec.items.load.prompt.md` loads existing scope for review.

### 4. Specialist Persona Agents
Group personas by the problems they solve:
- **Architecture & systems** — `persona.system-architect.chatmode.md` leverages CALM (`architecture/calm/*`) and the rationale in `docs/vibecoding/explanation/architecture-aware-context.md` to validate topology decisions.
- **Backend & frontend engineering** — `persona.senior-backend.chatmode.md` honors Python style rules and Nx conventions; `persona.senior-frontend.chatmode.md` references React/TS guidance and UI prompts (`ui.react.create-component.prompt.md`).
- **Product & UX** — `product.manager.chatmode.md`, `product.problem-statement.chatmode.md`, `persona.ux-ui.chatmode.md`, and `persona.ux-ui-designer.chatmode.md` coordinate customer outcomes with design artifacts.
- **Quality & security** — `persona.qa.chatmode.md` drives acceptance & regression suites; `sec.analyst.chatmode.md` aligns with `sec.review.prompt.md` and the security instructions.
- **DevOps & deployment** — `devops.audit.chatmode.md` and `devops.deployment.chatmode.md` reference `docs/devkit-prompts-instructions-integration.md` plus `tools/` automation (e.g., prompt linting, repo health checks).

### 5. Ops & Support Agents
- **Platform bootstrap** — `platform.bootstrap.prompt.md` and `platform.target-platforms.chatmode.md` coordinate Nx generators (`just ai-scaffold`) with CALM outputs.
- **Tech stack sync** — Run `just plan-techstack` before `just sync-techstack`; the ops prompt (`tool.techstack.sync.prompt.md`) keeps `techstack.yaml` and derived artifacts aligned with `techstack.schema.json`.
- **MCP tooling** — Document integrations in `mcp/tool_index.md`; configure servers via `.vscode/mcp.json` while keeping secrets external. Pair with persona/chat modes that rely on external data sources.

## Supporting Prompts, Tools & Scripts
- Prompts live in `.github/prompts/`; each carries YAML frontmatter for stacking. Validate with `tools/prompt/lint.js` & `tools/prompt/plan_preview.js` (see `docs/dev_implementation_plan.md` for test coverage expectations).
- Shell scripts under `scripts/` (bundle context, sync tech stack) log friendly guidance and exit non-destructively when prerequisites are missing.
- `justfile` is the command surface. Recipes prefixed `ai-` bundle context, validate lint/test, and scaffold Nx assets without side effects if pnpm/Nx are unavailable.
- Tests in `tests/` enforce repo layout, security posture, and prompt linting. Run `pnpm test` or `just ai-validate` after updating agents to ensure guardrails still pass.

## Operating Rhythm
1. **New feature** — Start in `spec.lean` or `spec.wide`, update specs/docs via spec prompts, bundle context, run `just tdd-red`, then proceed through TDD chat modes with `vibecoder-tdd.prompt.md`. Keep spec IDs in commit messages per `.github/instructions/commit-msg.instructions.md`.
2. **Bug fix** — Trigger `debug.start` to normalize the report, capture failing tests in `debug.repro`, isolate with instrumentation, fix/refactor, and close with `debug.regress` plus `just ai-validate`.
3. **Hardening / audits** — Use `test-hardening.prompt.md`, `perf.analyze.prompt.md`, or `sec.review.prompt.md` alongside QA/DevOps personas. Update `traceability_matrix.md` and `vibelog.txt` when follow-up is required.

## Governance & Maintenance
- Version prompts/chat modes alongside code. Include spec IDs and rationale in every PR; the `.husky/commit-msg` hook enforces compliance.
- When adding or adjusting instructions, follow precedence rules in `ai-workflows.instructions.md` and keep `.github/models.yaml` updated if model defaults change.
- Validate migrations with `just ai-validate` plus targeted tests under `tests/`. Regenerate the AI context bundle before sharing transcripts.
- Document changes in `docs/vibecoding/README.md` or subordinate guides so onboarding stays accurate. Use `onboarding.overview.chatmode.md` to brief new contributors on the latest workflows.

Keeping these agents aligned ensures generated projects stay portable, secure, and spec-driven — the core promise of VibePDK.
