# VibePDK AI Agent Playbook

## Purpose & Scope

This playbook explains how the Cookiecutter template at `{{ project_slug }}/` orchestrates Copilot instructions, chat modes, prompts, and supporting tooling. Use it when you customize or operate the generated project so every agent (human or AI) follows the same guardrails defined in the [AI Specifications](./ai-specifications/) and the `.github` policy files that ship with the template.

## Core Tenets

- **Traceable by design** — Every change cites spec IDs from the [AI Specifications](./ai-specifications/) (PRD, ADR, SDS). Chat responses should echo those IDs to keep the [Traceability Matrix](./ai-specifications/AI_traceability.md) accurate.
- **Instruction stacking, not ad hoc priming** — `.github/instructions/*.md` compose from general ⇒ domain ⇒ testing ⇒ style per precedence rules in `.github/instructions/ai-workflows.instructions.md`.
- **Lean context, explicit bundles** — Generate shared context with the [`just ai-context-bundle`](../how-to/bundle-context.md) command. Chat modes assume the bundle exists under `docs/ai_context_bundle/`.
- **Security defaults first** — Follow the [Security Hardening Integration Guide](../how-to/security/integrate-security-hardening.md); never enable `chat.tools.autoApprove` and keep MCP secrets out of version control.
- **Strategic debt only** — Default to documented best practices. When you must incur debt, record the rationale, exit criteria, and owner in the relevant [specification document](./ai-specifications/).
- **TDD & debug cadence** — Workflows in the [`justfile`](../reference/just-recipes.md) (`tdd-*`, `debug-*`) mirror the [TDD and Debug Chat Modes](../reference/chat-modes.md) and associated [prompts](../reference/prompts.md). This is the foundation for the [Getting Started with TDD](../tutorials/getting-started-tdd.md) tutorial.
- **Prompt-as-code lifecycle** — Treat [prompts](../reference/prompts.md) and [chat modes](../reference/chat-modes.md) as first-class code. Lint and preview them, or run `just ai-validate` to [validate the repo](../how-to/validate-repo.md) before committing.
- **Portability over tooling lock-in** — Scripts in `scripts/` rely on POSIX shell and degrade gracefully when Nx/pnpm are absent ([`just ai-scaffold`](../how-to/scaffold-with-nx.md) prints manual commands when needed).

## Agent Stack Overview

There are five cooperating layers. Activate them intentionally and cite the source file so others can follow along.

| Layer                        | Focus                                                                                                           | Primary assets                                           |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| **1. Foundation Guardrails** | Shared safety, context, testing, and style                                                                      | `.github/instructions/*.md`                              |
| **2. Execution Workflows**   | TDD and debugging phases wired to [Chat Modes](../reference/chat-modes.md) & [Prompts](../reference/prompts.md) | `.github/chatmodes/tdd.*`, `.github/chatmodes/debug.*`   |
| **3. Planning & Spec**       | Lean/wide spec elaboration, planning, feature gating                                                            | `.github/chatmodes/spec.*`, `.github/prompts/spec.*`     |
| **4. Specialist Personas**   | Role-specific guidance for architect, PM, QA, UX, security, DevOps                                              | `.github/chatmodes/persona.*`                            |
| **5. Ops & Support**         | Platform bootstrap, tech stack sync, [MCP tools](../how-to/configure-mcp.md)                                    | `.github/chatmodes/platform.*`, `.github/prompts/tool.*` |

### 1. Foundation Guardrails (Instruction Agents)

- **General & context** — `.github/instructions/general.instructions.md` and `context.instructions.md` keep responses concise, cite sources, and encourage retrieval rather than speculation.
- **AI workflow policy** — `ai-workflows.instructions.md` defines naming, token budgeting, and validation requirements that every workflow agent follows.
- **Security** — `security.instructions.md` is canonical. Reference it when generating settings, scripts, or MCP configs. See the [Security How-To Guides](../how-to/security/) for more.
- **Testing & performance** — `testing.instructions.md` enforces red/green/refactor gates; `performance.instructions.md` covers profiling requests.
- **Language style** — `style.python.instructions.md` and `style.frontend.instructions.md` scope to server/client code paths.
- **Docs & commit hygiene** — `commit-msg.instructions.md` aligns with our [Commit Message Guidelines](../how-to/write-commit-messages.md) and ensures commits carry spec IDs.

### 2. Execution Workflows (Chat Mode Agents)

- **TDD Triad** — The `tdd.red`, `tdd.green`, and `tdd.refactor` chat modes map to the [`just tdd-*`](../reference/just-recipes.md) recipes. This workflow is the foundation of our [TDD Tutorial](../tutorials/getting-started-tdd.md).
- **Debug Pipeline** — The `debug.start → debug.repro → debug.isolate → debug.fix → debug.refactor → debug.regress` chat modes align with [`just debug-*`](../reference/just-recipes.md) helper commands.
- **Runtime Instrumentation** — `debug.isolate` encourages adding temporary metrics/logs, backed by `tools/metrics/logger.js` as described in the [MergeKit Implementation Plan](./mergekit/IMPLEMENTATION-PLAN.md).

### 3. Planning & Spec Agents

- **Spec Shaping** — Use the `spec.lean` and `spec.wide` [chat modes](../reference/chat-modes.md) for discovery and alignment.
- **Change Orchestration** — Use the spec-related [prompts](../reference/prompts.md) to enforce updates across the [AI Specifications](./ai-specifications/).

### 4. Specialist Persona Agents

Group personas by the problems they solve:

- **Architecture & Systems** — `persona.system-architect.chatmode.md` leverages CALM and the rationale in [Architecture-Aware Context](./architecture-aware-context.md) to validate topology decisions.
- **Backend & Frontend Engineering** — Personas like `persona.senior-backend.chatmode.md` and `persona.senior-frontend.chatmode.md` honor the relevant style rules and Nx conventions.
- **Quality & Security** — Personas like `persona.qa.chatmode.md` and `sec.analyst.chatmode.md` align with our security instructions and the procedures in [Run Security Tests](../how-to/security/run-security-tests.md).
- **DevOps & Deployment** — Personas like `devops.audit.chatmode.md` and `devops.deployment.chatmode.md` reference the [AI Workflow Maintenance Guide](../how-to/maintain-ai-workflow.md) and `tools/` automation.

### 5. Ops & Support Agents

- **Platform Bootstrap** — `platform.bootstrap.prompt.md` and `platform.target-platforms.chatmode.md` coordinate Nx generators, as detailed in [Scaffold with Nx](../how-to/scaffold-with-nx.md).
- **Tech Stack Sync** — The `tool.techstack.sync.prompt.md` prompt keeps `techstack.yaml` and derived artifacts aligned with `techstack.schema.json`.
- **MCP Tooling** — [Configure MCP Tools](../how-to/configure-mcp.md) via `.vscode/mcp.json` while keeping secrets external.

## Supporting Prompts, Tools & Scripts

- **[Prompts](../reference/prompts.md)** live in `.github/prompts/`.
- Shell scripts under `scripts/` (e.g., for [bundling context](../how-to/bundle-context.md)) are designed to be portable.
- The **[`justfile`](../reference/just-recipes.md)** is the main command surface. Recipes prefixed `ai-` are for core AI workflows.
- Tests in `tests/` enforce repo layout and security posture. Run `just ai-validate` to [validate the repo](../how-to/validate-repo.md) after updating agents.

## Operating Rhythm

1. **New Feature** — Start with a `spec.*` chat mode, update specs, [bundle context](../how-to/bundle-context.md), run `just tdd-red`, then proceed through the [TDD chat modes](../reference/chat-modes.md). Follow the [commit message guidelines](../how-to/write-commit-messages.md).
2. **Bug Fix** — Trigger a `debug.*` chat mode, capture failing tests, isolate, fix, and refactor. Close with `debug.regress` and `just ai-validate`.
3. **Hardening / Audits** — Use security-focused prompts alongside QA/DevOps personas. See the [Security How-To Guides](../how-to/security/) for more.

## Governance & Maintenance

- Version prompts and chat modes with code. Enforce spec IDs in commit messages per the [guidelines](../how-to/write-commit-messages.md).
- When adding instructions, follow precedence rules and keep `.github/models.yaml` updated.
- [Validate migrations](../how-to/validate-repo.md) with `just ai-validate` and targeted tests.
- Document changes in the relevant section of this knowledge base to keep onboarding accurate.

Keeping these agents aligned ensures generated projects stay portable, secure, and spec-driven — the core promise of VibePDK.
