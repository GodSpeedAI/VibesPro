# Developer Technical Specifications

Audience: Developers and CI maintainers

---

## DEV-SPEC-001 — Environment setup

-   Requirements: Node.js LTS, Git, VS Code, GitHub Copilot (and Chat), bash/pwsh.
-   Trust: Open folder in trusted mode; do not enable auto-approve for tools.
-   Install: No extra packages needed; repo is self-contained.

## DEV-SPEC-002 — Directory contracts

-   Prompts live in `.github/prompts/` and end with `.prompt.md`.
-   Instructions live in `.github/instructions/` and end with `.instructions.md`.
-   Chat modes live in `.github/chatmodes/` and end with `.chatmode.md`.
-   Scripts in `scripts/` must be pwsh/bash compatible; avoid secrets.

## DEV-SPEC-003 — Build/lint tasks

-   Markdown: markdownlint + link-check (CI step).
-   Prompt lint: schema check for frontmatter, title present, token estimate < 4096. Note: TOKEN_BUDGET = 4096 is the canonical value for validation.

## DEV-SPEC-004 — Orchestration tasks

-   Run prompts: tasks called “Run: <Name>” invoke `scripts/run_prompt.sh <file> [--config=...]`.
-   Measure tokens: tasks "Measure Tokens: <Name>" invoke `scripts/measure_tokens.sh <file>`.
-   On Windows pwsh, bash scripts require WSL or Git Bash; alternatively mirror with `.ps1` wrappers (future work).

## DEV-SPEC-005 — Evaluation and metrics

-   Always collect token usage and latency when running tasks.
-   Persist summaries to `transcript.md` (append) or dedicated logs under `./.logs/` (future optional).

## DEV-SPEC-006 — CI/CD feedback

-   CI checks: markdown lint, link check, prompt lint, security posture check for `.vscode/settings.json`.
-   Blocking rules: broken links, missing frontmatter, unsafe settings fail build.

## DEV-SPEC-007 — Security posture

-   Ensure `.vscode/settings.json` does not enable chat.tools.autoApprove.
-   Never hardcode secrets in scripts; use env vars and VS Code variables.

## DEV-SPEC-008 — Testing strategy

-   Unit tests for utility scripts (token estimation, plan diff) via a simple Node test harness or bash bats (future optional).
-   Golden tests for prompts: snapshot the rendered stack and compare on PR.

## DEV-SPEC-009 — Traceability matrix

| Source                           | Target(s)                                  |
| -------------------------------- | ------------------------------------------ |
| DEV-ADR-001 Native substrate     | DEV-PRD-001, DEV-SDS-001, DEV-SPEC-001/002 |
| DEV-ADR-002 Instruction stacking | DEV-PRD-002, DEV-SDS-002, DEV-SPEC-003/004 |
| DEV-ADR-003 Personas             | DEV-PRD-003, DEV-SDS-003                   |
| DEV-ADR-004 Security defaults    | DEV-PRD-005, DEV-SDS-005, DEV-SPEC-006/007 |
| DEV-ADR-005 Tasks orchestrator   | DEV-PRD-004, DEV-SDS-004, DEV-SPEC-004/005 |
| DEV-ADR-006 Prompt lifecycle     | DEV-PRD-007, DEV-SDS-006, DEV-SPEC-003/008 |
| DEV-ADR-007 CALM/Wasp/Nx         | DEV-PRD-008, DEV-SDS-007                   |
| DEV-ADR-008 Declarative-first    | DEV-PRD-009, DEV-SDS-008                   |
| DEV-ADR-009 Evaluation hooks     | DEV-PRD-010, DEV-SDS-009, DEV-SPEC-005     |

## DEV-SPEC-010 — Operational runbooks (lightweight)

-   Add a new prompt: create `.github/prompts/<name>.prompt.md`, add frontmatter, validate via token measure task.
-   Add a new persona: create `.github/chatmodes/<role>.chatmode.md`, link to instruction files.
-   Extend tasks: duplicate an existing task in `.vscode/tasks.json`, adjust args; keep labels consistent.

## DEV-SPEC-011 — Future enhancements (non-blocking)

-   Windows `.ps1` wrappers for scripts.
-   Token budget config per mode in a central JSON.
-   Minimal Node CLI to render and lint stacks cross-platform.
