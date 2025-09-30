# Developer Product Requirements Document (DX as the Product)

Audience: Developers as primary users
Scope: Development environment and workflows as product capabilities
Source: transcript.md and ideation synthesis

---

## DEV-PRD-001 — Native configuration-only prompt system
- Description: As a developer, I want to manage prompts/instructions/modes using only native VS Code and GitHub Copilot files so that I can start immediately without extra tools.
- EARS: When setting up a project, the system shall enable prompts and instructions via repository files without custom DSLs.
- DX Metrics: Onboarding < 15 min; zero non-native dependencies.
- Supported by: DEV-ADR-001, DEV-ADR-009

## DEV-PRD-002 — Modular instruction stacking
- Description: As a developer, I want modular instruction files I can stack per task so that I can tailor behavior quickly.
- EARS: Given a task, the system shall allow selecting and ordering instruction files.
- DX Metrics: Time to modify behavior < 5 min; diff size small and isolated.
- Supported by: DEV-ADR-002, DEV-ADR-006, DEV-ADR-007

## DEV-PRD-003 — Persona chat modes (8 roles)
- Description: As a developer, I want curated chat modes for key roles so that I can get phase-appropriate guidance without re-priming.
- EARS: When choosing a persona, the system shall load the corresponding chat mode with synergistic instruction overlays.
- DX Metrics: Context switching reduced (>20%); mode adoption >80% of interactions.
- Supported by: DEV-ADR-003, DEV-ADR-006

## DEV-PRD-004 — Task-based orchestration and A/B testing
- Description: As a developer, I want tasks to run prompts, inject context, and A/B test variants so that I can evaluate changes quickly.
- EARS: Given two variants, the system shall route inputs and collect token/latency metrics.
- DX Metrics: Variant switch < 1 min; results logged 100%.
- Supported by: DEV-ADR-004, DEV-ADR-010

## DEV-PRD-005 — Security posture by default
- Description: As a developer, I want safe defaults and workspace trust enforcement so that I can run prompts confidently.
- EARS: When opening the workspace, the system shall disable auto-approve and apply security instructions globally.
- DX Metrics: 0 insecure defaults; security checks pass rate > 95% pre-merge.
- Supported by: DEV-ADR-005

## DEV-PRD-006 — Context window optimization
- Description: As a developer, I want context ordering and pruning so that prompts remain within token budgets.
- EARS: Given configured locations, the system shall load files in a defined order and avoid redundant content.
- DX Metrics: Token overflows < 2%; average tokens per interaction reduced >15%.
- Supported by: DEV-ADR-006, DEV-ADR-010

## DEV-PRD-007 — Prompt-as-code lifecycle
- Description: As a developer, I want prompts to be versioned, linted, tested, and previewed so that changes are safe and reversible.
- EARS: When proposing a change, the system shall provide lint and a dry-run plan before apply.
- DX Metrics: Rollback MTTR < 5 min; regression defects reduced >25%.
- Supported by: DEV-ADR-007

## DEV-PRD-008 — CALM/Wasp/Nx integration
- Description: As a developer, I want architecture semantics validated over a single-source spec with reversible generators so that scaffolding stays consistent.
- EARS: Given a spec change, the system shall run CALM controls and regenerate services deterministically.
- DX Metrics: Control violations caught in CI 100%; generator determinism verified.
- Supported by: DEV-ADR-008

## DEV-PRD-009 — Declarative-first with escape hatches
- Description: As a developer, I want declarative defaults with optional task/script hooks so that I can do advanced flows without complexity by default.
- EARS: When needed, the system shall allow orchestration scripts without changing base configuration.
- DX Metrics: 80/20 split: 80% flows declarative; 20% advanced via tasks.
- Supported by: DEV-ADR-009

## DEV-PRD-010 — Evaluation hooks & budgets
- Description: As a developer, I want token/latency logging and optional content checks so that I can optimize quality and cost.
- EARS: When running prompts, the system shall log metrics and optionally run safety/quality checks.
- DX Metrics: 100% metric capture; monthly token cost variance <10%.
- Supported by: DEV-ADR-010, DEV-ADR-004

---

## Development environment requirements
- Editor: VS Code latest (workspace trust respected).
- Extensions: GitHub Copilot/Chat; optional linting/mermaid preview.
- OS: Windows/macOS/Linux; shell per team standard (PowerShell noted).
- Repo: .github/instructions, .github/prompts, .github/chatmodes, .vscode/settings.json, tasks.
- CI: Lint prompts, run token-budget checks, enforce security defaults.

## DX success metrics (global)
- Onboarding time ≤ 15 minutes with documented steps.
- Build/open project time ≤ 30 seconds to first productive action.
- Debugging round-trip ≤ 2 minutes for common flows.
- Prompt change cycle ≤ 10 minutes from edit → test → merge.
