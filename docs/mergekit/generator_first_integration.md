# Generator-First Integration Blueprint

**Document ID**: MERGE-GEN-STRAT-001  
**Last Updated**: 2025-09-22  
**Traceability**: Aligns with PRD-MERGE-004, SDS-MERGE-002, TS-MERGE-003

This blueprint explains how VibePDK's AI-assisted scaffolding patterns are merged with HexDDD's hexagonal architecture templates to create a single Copier-driven generator. The emphasis is on first-class project creation; retrofitting legacy projects is intentionally out of scope.

## 1. Source Inputs

-   **HexDDD Monorepo** (`/home/sprime01/projects/HexDDD/`)
    -   Nx generators for domains, applications, and infrastructure layers
    -   Shared type generation utilities
    -   Reference justfile and workspace configuration
-   **VibePDK Platform** (`/home/sprime01/projects/VibePDK/`)
    -   AI workflow scripts and prompt libraries
    -   Documentation patterns and developer experience helpers
    -   Temporal learning bootstrap utilities

## 2. Integration Objectives

1. Deliver Copier templates capable of scaffolding complete, runnable applications that respect hexagonal + DDD boundaries.
2. Embed AI-enhanced workflows (temporal learning, context capture, suggestion engines) directly into the generated projects.
3. Provide an ergonomic developer experience (justfile tasks, Nx orchestration, uv/pnpm setup) without adding runtime coupling to the merger framework.
4. Maintain strict type safety across TypeScript and Python components.

## 3. Consolidation Strategy

### 3.1 Template Alignment

-   Convert HexDDD generators into Copier-compatible templates located under `templates/{{project_slug}}/`.
-   Fold VibePDK documentation and tooling into the `templates/docs/` and `templates/tools/` hierarchies.
-   Standardise naming (kebab-case for slugs, snake_case for template variables) and ensure all placeholders use Copier syntax.

### 3.2 AI Workflow Embedding

-   Place temporal database bootstrapping scripts in `templates/{{project_slug}}/temporal_db/`.
-   Include AI context processors and suggestion engines under `templates/{{project_slug}}/tools/ai/`.
-   Expose justfile commands (`just ai:analyze`, `just ai:train`) that wire into the generated tooling.

### 3.3 Build & Automation

-   Reuse HexDDD's Nx workspace configuration as the baseline (`nx.json`, `workspace generators`, caching rules).
-   Provide `just` tasks that orchestrate pnpm, uv, and Nx, mirroring the hybrid workflow defined in MERGE-TASK-002.
-   Ensure type generation utilities are installed with every scaffold via post-generation hooks.

### 3.4 Documentation Experience

-   Use the documentation generator (`tools/docs/generator.{js,py}`) to produce README, architecture, and API guides.
-   Maintain Copier templates for docs to allow generated projects to refresh their documentation after changes.
-   Validate documentation through CI using the integration test workflow.

## 4. Quality Safeguards

### 4.1 Specification Checklist

-   Every template or hook added must cite its originating ADR/PRD task ID (TRACE-MATRIX-001).
-   New utilities must pass strict TypeScript and Python type checks (`pnpm typecheck`, `uv run mypy`).
-   Generated projects must satisfy `tests/integration/project-generation.test.ts` and `tests/integration/performance.test.ts`.

### 4.2 Tooling Guardrails

-   `hooks/pre_gen.py` enforces valid project metadata before generation.
-   `hooks/post_gen.py` executes setup commands (`pnpm install`, `uv sync --dev`, `just build`).
-   CI uses `.github/workflows/integration-tests.yml` to run generation, AI workflow validation, and performance checks across a matrix of options.

## 5. Operational Notes

-   Legacy template conversion scripts have been removed; focus all efforts on the forward-looking Copier ecosystem.
-   The repository contains no compatibility layers for previous scaffolding systems; any such needs should be addressed in a separate migration-focused project.
-   When porting updates from HexDDD or VibePDK, prefer drop-in replacement of template fragments over bespoke rewrites to maintain parity with upstream improvements.

---

Maintainers should revisit this document whenever the template structure, AI tooling, or build orchestration changes. Keep the alignment with PRD-MERGE-004 and ADR-MERGE-002 to ensure the generator-first vision remains intact.
