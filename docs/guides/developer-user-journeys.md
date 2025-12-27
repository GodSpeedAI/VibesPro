---
title: 'Developer & User Journeys (Intended Operation)'
date: 2025-12-27
status: draft
matrix_ids: []
---

# Developer & User Journeys (Intended Operation)

This document describes the intended end-to-end journeys for VibesPro as a **Generative Development Environment (GDE)**. It details how the system turns "intent" into a production-ready Nx monorepo with hexagonal architecture, emphasizing user experience, touchpoints, and institutional memory validation.

## Personas

### 1) Template Consumer

Developers who generate a new project from VibesPro and expect a working, production-ready baseline.

### 2) Template Maintainer

Contributors who evolve the templates, generators, and tooling that VibesPro ships.

### 3) AI-Assisted Developer

Developers who use the AI guidance assets (prompts/agents/instructions) while building or refactoring.

## Journey A: Template Consumer (Generate → Setup → Dev → Validate)

### A0. Preflight (Expectations)

- **User goal**: Bootstrap a new project with clean architecture, strong defaults, and working quality gates.
- **Success**: Generation succeeds, setup succeeds, `just test` and `just build` succeed, and the repo contains no unsafe defaults (plaintext secrets, local state, broken CI).

### A1. Generate the project

**Primary entrypoint**

```bash
copier copy gh:GodSpeedAI/VibesPro my-project
```

**System responsibilities**

- Ask layman-friendly questions (see `copier.yml`).
- Render the template from `templates/{{project_slug}}/`.
- Run the post-generation hook (`hooks/post_gen.py`) to apply conditional stacks and guardrails (inputs sanitization, optional stack removal).

**User experience requirements**

- Clear prompts; safe defaults; meaningful validation messages.
- Optional features (AI workflows, Supabase, observability, security hardening) are opt-in/opt-out and behave predictably.

### A2. Setup (Tiered)

**Core setup**

```bash
cd my-project
just setup
```

**Optional stacks**

- `just setup-db` (Supabase/local PostgreSQL)
- `just setup-observe` (Vector/OpenObserve/Logfire)
- `just setup-ai` (Temporal AI + embeddings model)
- `just setup-mocks` (Mountebank + Testcontainers)

**System responsibilities**

- Provide fast, deterministic local bootstrap.
- Degrade gracefully if optional tools are missing (Docker, Vector, etc.), with actionable instructions.

### A3. Develop (Generator-First)

**Primary workflows**

- Scaffold changes using Nx generators (preferred) rather than manual boilerplate:
  - `pnpm exec nx list`
  - `just ai-scaffold name=...`
  - Custom generators under `generators/` (@vibespro/generator, @vibespro/service-generator)

**System responsibilities**

- Enforce architecture boundaries (hexagonal dependency direction).
- Make the “right thing” easy: sensible generators, examples, and templates.

### A4. Validate (Local CI Parity)

**Primary validation loop**

```bash
just ai-validate
```

**Expected outcomes**

- Linters run and pass.
- Typechecking passes (TS + Python).
- Tests pass (Node + Python + integration + template generation smoke where applicable).
- Spec guardrails pass (`just spec-guard`) if used by the generated project.

## Journey B: Template Maintainer (Change → Test → Ship)

### B0. Preflight (Repo Context)

- **User goal**: Change the generator/template system without breaking downstream projects.
- **Success**: `just ai-validate` and `just test-generation` are green; template invariants are satisfied; no new drift in docs/links/specs.

### B1. Locate the Change Surface

- **Template changes**: `templates/{{project_slug}}/**`
- **Copier configuration**: `copier.yml`, `.copierignore`
- **Copier hooks**: `hooks/pre_gen.py`, `hooks/post_gen.py`
- **Generators**: `generators/**`
- **Tooling**: `tools/**`
- **Ops templates**: `templates/{{project_slug}}/ops/**`

### B2. Validate Template Invariants (Fast)

```bash
just copier-quick-validate
just copier-smoke-test
```

### B3. Validate Full Generation + Build (Slower)

```bash
just test-generation
```

### B4. Validate CI Parity Locally (Deep)

```bash
./scripts/ci-local.sh all
./scripts/ci-local.sh docker
```

### B5. Release Discipline

- Ensure no template contamination (local state, caches, plaintext env files).
- Ensure tests and workflows don’t depend on developer machine artifacts.
- Ensure docs are updated and link checks remain green.

## Journey C: AI-Assisted Developer (Intent → Specs → Implement)

### C0. Pick the Right AI “Entry Point”

- **Prompts**: `.github/prompts/*.prompt.md`
- **Agents**: `.github/agents/*.agent.md`
- **Instruction stacking**: `.github/instructions/*.instructions.md`
- **Context routing**: `.github/copilot-instructions.md` (Index-First)

### C1. Follow Spec-Driven Development

- Create/update specs under `docs/specs/` (ADR/PRD/SDS/TS).
- Keep traceability up to date (matrix and references).

### C2. Implement with Generators-First Bias

- Use existing Nx generators or create one via the meta-generator:
  - `just generator-new <name> type=custom`
  - `just generator-new-hex <name> type=domain`

### C3. Validate and Tighten Feedback Loops

- `just ai-validate`
- Targeted tests relevant to the changed area.

## Journey D: Operational/Observability

### D1. Start Local Collectors

- **Vector config**: `ops/vector/vector.toml` (OTLP ingest + PII redaction)
- **OpenObserve stack**: `ops/openobserve/docker-compose.yml` (Dashboards/Alerts)

### D2. Ensure Secrets are Handled Correctly

- Secrets are stored in `.secrets.env.sops` and injected at runtime.
- Temporary plaintext env files must be ephemeral and not committed.

### D3. Verify PII Redaction

- **VRL macros**: `tools/vector/macros.vrl`
- **Tests**: `tests/ops/*`

### D4. Temporal Memory

- **Libraries**: `temporal_db/*`
- **Engine**: `crates/temporal-ai/*` (Pattern extraction, similarity query, learning loop)

## Journey E: Data Evolution (Schema → Types → Code)

### E0. The Source of Truth (Database)

- **Schema changes**: SQL migrations in `supabase/migrations/`.
- **Apply changes**: `just db-migrate`

### E1. Generate Isomorphic Types

**Command**

```bash
just gen-types
```

_(Runs `just gen-types-ts` then `just gen-types-py`)_

**System responsibilities**

1.  **Introspect**: Reads local Supabase schema (via CLI, direct PG connection, or SupaBase MCP server).
2.  **TypeScript**: Generates `libs/shared/types/src/database.types.ts` (Supabase standard).
3.  **Python**: Transpiles TS interfaces to Pydantic models in `libs/shared/types-py/src/models.py`.

### E2. Consume Types (Frontend/Node)

- **Import**: `import { Database } from '@vibespro/shared/types';`
- **Supabase Client**: Automatically typed via generic injection.

### E3. Consume Types (Python/Backend)

- **Import**: `from libs.shared.types_py.models import TableName`
- **Validation**: Pydantic models enforce schema at runtime for AI agents and backend logic.

## Reference: Key Subsystems & Integration Points

| Subsystem                    | Components                                                                                  |
| :--------------------------- | :------------------------------------------------------------------------------------------ |
| **Copier Template System**   | `copier.yml`, `.copierignore`, `pre_gen.py`, `post_gen.py`, `templates/{{project_slug}}/**` |
| **Nx Orchestration**         | `nx.json`, `pnpm-workspace.yaml`, root `package.json`                                       |
| **Custom Nx Generators**     | `generators/generator/*` (meta), `generators/service/*` (service)                           |
| **Tooling**                  | `tools/**` (spec matrix, link checks, template validation, type generator)                  |
| **Temporal Memory**          | `temporal_db/*` (Lib), `crates/temporal-ai/*` (Engine)                                      |
| **Ops & Observability**      | `ops/vector/*` (Vector + VRL), `ops/openobserve/*` (OpenObserve)                            |
| **Governance & AI Guidance** | `.github/instructions/*`, `.github/prompts/*`, `.github/agents/*`                           |
| **Manifest**                 | `ce.manifest.jsonc` and `.mcp.json` (Nx MCP server)                                         |
