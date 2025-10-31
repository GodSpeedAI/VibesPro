# VibePDK AI-Assisted System Analysis and Integration Plan

## Purpose

Document the GitHub Copilot + VS Code AI workflow shipped with the VibePDK Cookiecutter template and define a pragmatic plan to transplant that spec-driven, AI-assisted stack into VibesPro.

## Template vs Generated Scope

-   **Template repository (`VibesPro/…`)** – This codebase is the Copier _source_. Any assets we import or modify must land inside the template directories (for example, `templates/{{project_slug}}/.github/`, `templates/docs/`, `templates/{{project_slug}}/tools/…`) so every future generation picks them up automatically.
-   **Generated project** – When Copier renders the template, the emitted repo should already contain the AI guardrails (.github instructions, prompts, chat modes, spec tooling, just recipes, MCP descriptors, etc.). The integration plan below focuses on wiring these assets into the template, then validating that the generated project inherits them without post-processing.
-   **Maintainer documentation (`docs/aiassist/`)** – Files under `docs/aiassist/` describe how to evolve the template itself; they are not copied into generated workspaces unless we add explicit templates.

## VibePDK AI Stack Overview

### 1. `.github` (AI policy + runtime guidance)

-   **`copilot-instructions.md`** – top-level constitution enforcing spec-first, TDD, traceability, and type safety.
-   **`instructions/`** – modular guardrails (context, general, performance, security, style, testing, docs/dev-docs/src, commit-msg). Each file scopes directives with precedence metadata and cross-links to specs.
-   **`prompts/`** – curated prompt catalog covering spec lifecycle (feature bootstrap → plan ADR/PRD/SDS/TS → tasks), transcript conversion, traceability updates, prompt linting, debug, and performance/security reviews. Frontmatter encodes domain/task IDs, token budgets, default model (`GPT-5 mini`), and allowed tools.
-   **`chatmodes/`** – specialized chat modes (TDD phases, debug flow, spec personas, product/UX/DevOps personas) aligning with prompts and instructions.
-   **`models.yaml`** – centralizes default chat/prompt model selections.
-   **`workflows/`** – CI jobs (`markdownlint`, `node-tests`, `spec-guard`) enforcing documentation hygiene, Nx/pnpm tests, and spec traceability.

### 2. `docs/` (spec-driven knowledge base)

-   **Spec corpus** – ADR/PRD/SDS/TS documents plus DEV-\* counterparts with matrix IDs.
-   **`specs/THREAD/...` scaffolding** – templated specs, plans, and task lists generated via `just spec-*` commands.
-   **Traceability assets** – `spec_index.md`, `dev_spec_index.md`, `traceability_matrix.md`, plus onboarding/how-to/how-it-works guides.
-   **AI context bundle** – generated into `docs/ai_context_bundle/` for chat modes.

### 3. `justfile` & scripts (automation)

-   **Spec workflow commands** – `spec-feature`, `spec-plan`, `spec-tasks` create spec skeletons.
-   **AI workflow commands** – `ai-context-bundle`, `ai-validate`, `ai-scaffold`, plus TDD/Debug phase helpers (`tdd-red`, `debug-fix`, etc.).
-   **Tooling scripts** – `scripts/bundle-context.sh`, `plan_techstack.sh`, `sync_techstack.sh`, `spec_feature.sh`, `run_prompt.sh`, `measure_tokens.sh`.

### 4. `mcp/`

-   **`tool_index.md`** & example tool descriptors showing how to register MCP servers (`.vscode/mcp.json`) with environment-based auth guidance.

### 5. `generators/`

-   **Nx plugin** (`service/generator.ts`, `_utils/stack*.ts`) that reads resolved tech stack metadata (`tools/transformers/.derived/techstack.resolved.json`) and scaffolds services in language-specific templates, honoring feature flags (`VIBEPDK_USE_STACK_DEFAULTS`).

### 6. Supporting directories

-   **`tools/`** – automation for audit, CALM transforms, docs, metrics, prompt linting, spec management, testing.
-   **`hooks/`** – Cookiecutter pre/post generation hooks enforcing naming, Python version, and providing next steps.

## Current VibesPro Snapshot

| Template Area                                                              | Current State                                                                                                                         | Notes                                                                                                                                      |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `templates/{{project_slug}}/.github`                                       | Mirrors only a subset of merger guidance; lacks modular instructions, prompts, chat modes, models manifest, and spec-guard workflows. | Need to import VibePDK `.github` assets and reconcile with merger-specific instructions before regeneration.                               |
| Template docs (`templates/docs/**` & `templates/{{project_slug}}/docs/**`) | High-level architecture docs exist, but there’s no AI workflow bundle or spec lifecycle runbooks.                                     | Extend templates to emit AI context bundle docs and usage guides; keep maintainer copies under `docs/aiassist/`.                           |
| Root docs (`docs/**`)                                                      | Extensive spec documents + this integration folder.                                                                                   | Use as authoritative guidance for template maintainers; optionally expose curated versions via templates.                                  |
| Automation (`justfile`, scripts)                                           | Root `justfile` is rich for maintainers, but template `justfile.j2` lacks spec/AI recipes.                                            | Port VibePDK recipes into `justfile.j2` and ensure scripts referenced exist under `templates/{{project_slug}}/scripts/` (or add new ones). |
| MCP (`templates/{{project_slug}}/mcp/`)                                    | Directory absent.                                                                                                                     | Add MCP descriptors and document `.vscode/mcp.json` configuration for generated repos.                                                     |
| Generators                                                                 | Copier Jinja templates and supporting tools exist, but no stack-aware Nx generator like VibePDK’s.                                    | Import/adapt VibePDK generator utilities so generated workspaces can scaffold services with stack defaults.                                |
| CI workflows (`.github/workflows` in template)                             | Generated project currently inherits minimal workflows.                                                                               | Expand template workflows with prompt lint, spec guard, markdown lint, and Nx tests to match VibePDK’s enforcement.                        |

## Integration Plan

### Phase 0 — Prep & Specifications

-   Confirm/assign spec IDs (MERGE-TASK-###, ADR-MERGE-###, etc.) for this initiative.
-   Capture spec deltas in `docs/specs/` (feature spec → ADR/PRD/SDS/TS → tasks) following TDD mandate.

### Phase 1 — `.github` Alignment

1. Copy `{{cookiecutter.project_slug}}/.github/` from VibePDK into `templates/{{project_slug}}/.github/` (stage under `templates/{{project_slug}}/.github.ai-import/` if needed while reconciling).
2. Merge instruction files into `templates/{{project_slug}}/.github/instructions/` preserving precedence metadata.
    - Resolve overlaps with merger-specific `copilot-instructions.md` so generated projects carry both HexDDD+VibePDK guidance.
    - Adopt VibePDK’s `commit-msg.instructions.md`, `ai-workflows.*`, security/perf/style docs, and ensure template frontmatter precedence stays consistent.
3. Add prompt/chatmode catalog to `templates/{{project_slug}}/.github/prompts/` and `templates/{{project_slug}}/.github/chatmodes/`; document usage in template README.
4. Introduce `templates/{{project_slug}}/.github/models.yaml` and update maintainer docs about default model expectations.
5. Replace/augment template workflows under `templates/{{project_slug}}/.github/workflows/`: add `spec-guard`, `markdownlint`, `node-tests`, and reconcile with existing generated-project workflows to avoid duplicate runs.

### Phase 2 — Documentation System

1. Maintain `docs/aiassist/` as the maintainer knowledge base (including this report) and add runbooks covering spec lifecycle, prompt usage, and chat mode selection for template contributors.
2. Create template equivalents (for example `templates/{{project_slug}}/docs/ai_workflows.md.j2` or extend existing docs templates) so generated projects receive user-facing guidance.
3. Port VibePDK’s `docs/ai_context_bundle` generation flow into `templates/{{project_slug}}/scripts/` and ensure the generated project’s `justfile.j2` can rebuild it.
4. Align traceability assets: update template docs (`templates/docs/**`) to reference VibesPro specs, and run `pnpm spec:matrix` against the template to confirm links.
5. Refresh onboarding docs (`templates/{{project_slug}}/README.md.j2`, tutorial templates, etc.) to reference the AI workflows bundled into generated projects.

### Phase 3 — Automation & Tooling

1. Extend `templates/{{project_slug}}/justfile.j2` with VibePDK spec + AI recipes (namespaced `spec-*`, `ai-*`, TDD/Debug helpers) and ensure referenced scripts live under `templates/{{project_slug}}/scripts/`.
2. Validate script compatibility; materialize any missing shell scripts by copying/adapting VibePDK versions into the template (or parameterize existing `.j2` variants).
3. Ensure generated projects include the necessary package scripts (`pnpm prompt:lint`, `pnpm spec:matrix`, Nx tasks) by updating `package.json.j2` and workspace configuration.
4. Document automation in both maintainer docs (`docs/reference/just-recipes.md`) and template docs/tutorals so end users understand the commands.

### Phase 4 — MCP & VS Code Integration

1. Add `templates/{{project_slug}}/mcp/` with MCP descriptors (`tool_index.md`, sample `*.tool.md`) adapted from VibePDK.
2. Document manual `.vscode/mcp.json` setup in both maintainer docs and template output (e.g., README sections) without committing secrets.

### Phase 5 — Generators & Stack Defaults

1. Import VibePDK `generators/` Nx plugin pieces into `templates/{{project_slug}}/tools/generators/` (or equivalent) and adapt them to Copier-specific paths.
2. Wire resolved tech stack detection into the template’s type/stack transformer pipeline so generated projects can scaffold services from resolved metadata.
3. Add environment flags (`VIBEPRO_USE_STACK_DEFAULTS`) consistent with VibePDK behavior and expose guidance in template docs.
4. Update generator tests (`tests/**`) or add new Nx generator unit tests targeting the generated project to maintain coverage.

### Phase 6 — CI & Quality Gates

1. Integrate prompt lint + traceability checks into template workflow files so generated repos run them out of the box.
2. Add an `ai-validate` composite step (lint, typecheck, Nx tests) to generated-project CI, ensuring compatibility with environments where pnpm/Nx might be absent.
3. Add template-level validation to this repo’s CI: after Copier test generation, verify the emitted project includes the AI assets and workflows (extend existing `generation-smoke-tests.yml`).

### Phase 7 — Onboarding & Adoption

1. Update README + `docs/tutorials/` with AI workflow walkthrough.
2. Record sample session transcripts demonstrating spec → prompt → implementation pipeline.
3. Schedule periodic `spec-housekeeping` and `traceability_matrix` audits.

## Risks & Mitigations

-   **Instruction conflicts** – Review merged `.github` files to keep merger-specific rules dominant; annotate precedence in frontmatter.
-   **CI duplication** – Consolidate existing workflows with imported ones to avoid redundant Nx/test runs.
-   **Script drift** – Harmonize shell compatibility (bash vs POSIX); ensure `set -euo pipefail` where appropriate.
-   **Model availability** – Confirm target models (`GPT-5 mini`) accessible; provide fallback models in docs.
-   **Spec debt** – Enforce `spec-*` commands and matrix updates in CI to prevent regressions.

## Immediate Next Actions

1. Approve/assign spec IDs and open corresponding specs in `docs/specs/`.
2. Stage `.github` import and begin reconciliation (focus on instructions + prompts).
3. Update `justfile` with `spec-*` and `ai-*` recipes; smoke-test scripts locally.
4. Run `pnpm prompt:lint` and `pnpm spec:matrix` to verify tooling after import.
5. Wire `spec-guard.yml` into CI and monitor first pipeline run.

Once these steps land, VibesPro will inherit the full VibePDK AI-assisted, spec-driven development experience with consistent developer workflows across the merged platform.
