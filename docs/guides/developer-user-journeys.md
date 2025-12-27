---
title: 'Developer & User Journeys (Intended Operation)'
date: 2025-12-27
status: draft
matrix_ids: []
---

# Developer & User Journeys (Intended Operation)

This document describes the intended end-to-end journeys for VibesPro as a **Generative Development Environment (GDE)**, with emphasis on user experience, touchpoints, and where the system enforces standards.

## Personas

### 1) Template Consumer

Developers who generate a new project from VibesPro and expect a working, production-ready baseline.

### 2) Template Maintainer

Contributors who evolve the templates, generators, and tooling that VibesPro ships.

### 3) AI-Assisted Developer

Developers who use the AI guidance assets (prompts/agents/instructions) while building or refactoring.

## Journey A: Template Consumer (Generate → Setup → Dev → Validate)

### A0. Preflight (expectations)

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
- Run the post-generation hook (`hooks/post_gen.py`) to apply conditional stacks and guardrails.

**User experience requirements**

- Clear prompts; safe defaults; meaningful validation messages.
- Optional features (AI workflows, Supabase, observability, security hardening) are opt-in/opt-out and behave predictably.

### A2. Setup (tiered)

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

### A3. Develop (generator-first)

**Primary workflows**

- Scaffold changes using Nx generators (preferred) rather than manual boilerplate:
  - `pnpm exec nx list`
  - `just ai-scaffold name=...`
  - custom generators under `generators/`

**System responsibilities**

- Enforce architecture boundaries (hexagonal dependency direction).
- Make the “right thing” easy: sensible generators, examples, and templates.

### A4. Validate (local CI parity)

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

### B0. Preflight (repo context)

- **User goal**: Change the generator/template system without breaking downstream projects.
- **Success**: `just ai-validate` and `just test-generation` are green; template invariants are satisfied; no new drift in docs/links/specs.

### B1. Locate the change surface

- **Template changes**: `templates/{{project_slug}}/**`
- **Copier configuration**: `copier.yml`, `.copierignore`
- **Copier hooks**: `hooks/pre_gen.py`, `hooks/post_gen.py`
- **Generators**: `generators/**`
- **Tooling**: `tools/**`
- **Ops templates**: `templates/{{project_slug}}/ops/**`

### B2. Validate template invariants (fast)

```bash
just copier-quick-validate
just copier-smoke-test
```

### B3. Validate full generation + build (slower)

```bash
just test-generation
```

### B4. Validate CI parity locally (deep)

```bash
./scripts/ci-local.sh all
./scripts/ci-local.sh docker
```

### B5. Release discipline

- Ensure no template contamination (local state, caches, plaintext env files).
- Ensure tests and workflows don’t depend on developer machine artifacts.
- Ensure docs are updated and link checks remain green.

## Journey C: AI-Assisted Developer (Intent → Specs → Implement)

### C0. Pick the right AI “entry point”

- Prompts: `.github/prompts/*.prompt.md`
- Agents: `.github/agents/*.agent.md`
- Instruction stacking: `.github/instructions/*.instructions.md`
- Context routing: `.github/copilot-instructions.md` (index-first)

### C1. Follow spec-driven development where required

- Create/update specs under `docs/specs/` (ADR/PRD/SDS/TS).
- Keep traceability up to date (matrix and references).

### C2. Implement with generators-first bias

- Use existing Nx generators or create one via the meta-generator:
  - `just generator-new <name> type=custom`
  - `just generator-new-hex <name> type=domain`

### C3. Validate and tighten feedback loops

- `just ai-validate`
- Targeted tests relevant to the changed area.

## Operational Journey D: Observability (Vector → OpenObserve → Metrics Loop)

### D1. Start local collectors

- Vector config: `ops/vector/vector.toml`
- OpenObserve stack: `ops/openobserve/docker-compose.yml`

### D2. Ensure secrets are handled correctly

- Secrets are stored in `.secrets.env.sops` and injected at runtime.
- Temporary plaintext env files must be ephemeral and not committed.

### D3. Verify PII redaction

- VRL macros: `tools/vector/macros.vrl`
- Tests: `tests/ops/*`

---

1. Intended State & How It’s Supposed to Work (end-to-end)
   VibesPro is designed as a Generative Development Environment (GDE) that turns “intent” into a production-ready Nx monorepo with hexagonal architecture, plus a governance and “institutional memory” layer.

The primary user journey (Template Consumer)
Generate a new project via Copier:
copier copy gh:GodSpeedAI/VibesPro my-project
Template root is controlled by copier.yml (\_subdirectory: templates/{{project_slug}}).
Post-generation automation runs:
post*gen.py (invoked by copier.yml \_tasks).
Intended responsibilities: sanitize inputs, remove/keep optional stacks, do safe setup steps.
Boot the environment:
just setup (tiered setup: core, db, observe, AI/temporal, mocks).
Develop using generator-first workflows:
Use Nx + custom generators (@vibespro/generator, @vibespro/service-generator) + just wrappers.
Operate with observability and memory:
Vector pipeline (vector.toml) for OTLP ingest + PII redaction.
OpenObserve setup (ops/openobserve/*) for dashboards/alerts.
Temporal AI (crates/temporal-ai) for pattern extraction + similarity query, with “learning loop”.
The maintainer journey (Template Maintainer)
Modify template sources under templates/{{project_slug}}/**.
Validate with “generation smoke” and invariants:
just test-generation
just copier-smoke-test
just ai-validate
Ensure traceability/spec tooling remains consistent (spec-guard, link checks, prompt linting). 2) What’s Actually There (key subsystems & integration points)
Copier template system: copier.yml, .copierignore, pre_gen.py, post_gen.py, templates/{{project_slug}}/**.
Nx orchestration: nx.json, pnpm-workspace.yaml, root package.json.
Custom Nx generators:
generators/generator/_ (meta-generator)
generators/service/_ (service generator)
Tooling: tools/\*\* (spec matrix, link checks, template validation, type generator, etc.).
Temporal memory:
Lightweight “temporal*db” library: temporal_db/*
Full Temporal AI engine: crates/temporal-ai/_
Ops/observability:
Vector: ops/vector/_ + VRL macros: macros.vrl
OpenObserve: ops/openobserve/_
Governance/AI guidance surface area:
.github/instructions/*, .github/prompts/*, .github/agents/_
ce.manifest.jsonc and .mcp.json (Nx MCP server)
