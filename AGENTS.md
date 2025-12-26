# AGENTS.md

VibesPro is a **Generative Development Environment** that synthesizes production-ready Nx monorepos with hexagonal architecture. It uses Copier + Jinja2 to generate projects and maintains institutional memory via a Rust-based temporal database.

**Don't clone this repo** — generate your project with: `copier copy gh:GodSpeedAI/VibesPro my-project`

## Project Overview

| Component        | Description                                                            |
| ---------------- | ---------------------------------------------------------------------- |
| **templates/**   | Copier templates (Jinja2) → generates complete projects                |
| **generators/**  | Nx generators (TypeScript) → scaffolds libs/apps/components            |
| **libs/**        | Shared libraries (hexagonal layers: domain/application/infrastructure) |
| **tools/**       | Dev utilities (TypeScript + Python)                                    |
| **temporal_db/** | Institutional memory (Rust + redb)                                     |
| **tests/**       | Unit, integration, shell tests                                         |
| **ops/**         | Observability (Vector, OpenObserve, Logfire)                           |

**Hexagonal Architecture**: Dependencies point inward only: `infrastructure → application → domain`. Domain is pure—no I/O, no frameworks.

## Setup Commands

```bash
# Core setup (Node, pnpm, Python, uv)
just setup

# Optional tiers
just setup-db       # Supabase + PostgreSQL (port 54322)
just setup-observe  # Vector + OpenObserve + Logfire
just setup-ai       # Temporal AI CLI + embeddings
just setup-all      # Everything above
```

**Prerequisites**: Node ≥20, Python ≥3.11, pnpm ≥8.0, Docker (for database)

## Development Workflow

```bash
just dev                    # Start all Nx serve targets
just dev-full               # Full stack (DB + observability + mocks + dev servers)
just build                  # Build all projects
just format                 # Format Python + Node code
```

### Generator-First Development

**Before writing ANY new code**, check for an Nx generator:

```bash
pnpm exec nx list                     # List all generators
pnpm exec nx list @nx/js              # Check specific plugin
just ai-scaffold name=@nx/js:lib      # Run via just recipe
just generator-new my-gen domain      # Create custom generator
```

Custom generators in `generators/` follow hexagonal patterns. Use the meta-generator to create new generators.

### Temporal Database Usage

Query for existing patterns before major decisions:

```bash
just temporal-ai-query "patterns for order domain"   # Search patterns
just temporal-ai-stats                               # View database stats
```

## Testing Instructions

### Run All Tests

```bash
just test                   # Node + Python + integration tests
just ai-validate            # Full validation (lint + typecheck + tests + AGENT links)
```

### Specific Test Types

```bash
# Node.js tests
pnpm test                             # Run Nx test targets
pnpm test:jest                        # Direct Jest execution
pnpm test:jest --watch                # Watch mode

# Python tests
just test-python                      # pytest with pre-commit skip

# Generator tests
just test-generators                  # Nx generator tests
just test-generator-smoke             # Generator smoke tests

# Template generation
just test-generation                  # Full Copier template validation
just test-template                    # Quick non-interactive template test

# Integration
pnpm test:integration                 # Integration test suite
pnpm test:e2e                         # End-to-end tests (300s timeout)
```

### Test Patterns

- Test files: `test_*.py`, `*_test.py`, `*.test.ts`, `*.spec.ts`
- Jest config: `jest.config.json`
- Pytest config: `pytest.ini`, `pyproject.toml`
- Coverage: `pnpm test:jest:coverage`

### Template Test Notes

Template tests skip pre-commit hooks that mutate files during fixture commits. Use `COPIER_SKIP_PROJECT_SETUP=1` to avoid heavy post-gen setup.

## Code Style

### TypeScript

- Strict mode, no `any` types
- ESLint config: `.eslintrc.json`, `eslint.config.cjs`
- Prettier for formatting
- Format: `pnpm exec nx format --all`

### Python

- mypy strict mode (all `disallow_*` and `warn_*` flags enabled)
- ruff for linting: `uv run ruff check .`
- Target version: Python 3.11
- Line length: 100 chars

### Lint Commands

```bash
just lint                   # Python + Node + templates
pnpm lint                   # Node linting
uv run ruff check .         # Python linting
uv run mypy .               # Python type checking
```

## Build and Deployment

```bash
# Build
just build                  # Auto-detect strategy (Nx or direct)
just build-nx               # Nx parallel build (3 workers)
pnpm build                  # npm script build

# Type generation (from Supabase schema)
just gen-types-ts           # Generate TypeScript types
just gen-types-py           # Generate Python Pydantic models
just gen-types              # Both above
just check-types            # Verify types are committed and current
```

### Database Commands

```bash
just supabase-start         # Start local Supabase (PostgreSQL 54322, Studio 54323)
just supabase-stop          # Stop stack
just supabase-reset         # Reset with fresh migrations + seed
just db-migrate             # Apply migrations from supabase/migrations/
just db-seed                # Seed database
just db-psql                # Connect to database
```

## Pre-Commit and CI

```bash
just pre-commit             # Run all pre-commit hooks
just commit-ready           # Format, lint, stage changes
just spec-guard             # Full spec validation (matrix, prompts, links, schemas)
```

### CI Workflow

1. TypeScript typecheck: `pnpm exec tsc --noEmit`
2. Install deps: `pnpm install --frozen-lockfile`, `uv sync --group dev --all-extras --frozen`
3. Build: `pnpm build`
4. Lint: `pnpm lint`, `uv run ruff check .`
5. Test: `pnpm test:jest`, `uv run pytest`
6. Template validation: `just test-generation`

### Required CI Checks

- All tests pass (`pnpm test`, `pytest`)
- No lint errors
- TypeScript compiles without errors
- Template generation succeeds

## Pull Request Guidelines

### Commit Format

```
type(scope): message [SPEC-ID]
```

Example: `feat(auth): add rate limiter [PRD-042]`

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**CRITICAL**: Changes must trace to specs in `docs/specs/`.

### Before Submitting

```bash
just ai-validate            # Must pass
just pre-commit             # Fix any formatting issues
```

## Observability

```
App → OpenTelemetry SDK → Vector (PII redaction) → Logfire + OpenObserve
```

```bash
just observe-start          # Start Vector pipeline
just observe-openobserve-up # Start OpenObserve (Docker)
just observe-test-all       # Full observability test suite
```

Set `VIBEPRO_OBSERVE=1` to enable OTLP export. Config: `ops/vector/vector.toml`.

## TDD Workflow

```bash
just tdd-red                # 🔴 Write failing test
just tdd-green              # 🟢 Minimal implementation to pass
just tdd-refactor           # ♻️ Improve code, keep tests green
```

## Debug Workflow

```bash
just debug-start            # Normalize bug report
just debug-repro            # Write failing test
just debug-isolate          # Instrument and narrow root cause
just debug-fix              # Apply minimal fix
just debug-refactor         # Clean up fix
just debug-regress          # Run full regression
```

## Anti-Patterns to Avoid

- ❌ Writing code without checking for generators first
- ❌ Modifying `.vscode/settings.json` or enabling `chat.tools.autoApprove`
- ❌ Committing secrets (use SOPS: `sops exec-env .secrets.env.sops '<command>'`)
- ❌ Running framework CLIs directly (use `nx run` or Just recipes)
- ❌ Skipping `just test-generation` after template changes
- ❌ Adding dependencies without ADR discussion
- ❌ Not querying temporal_db before major architectural decisions
- ❌ Domain layer importing infrastructure (violates hexagonal rules)
- ❌ Not tracing changes to specs in `docs/specs/`

## Directory-Specific Context

Check `AGENT.md` files in subdirectories for local context:

| Directory      | AGENT.md | Purpose                                      |
| -------------- | -------- | -------------------------------------------- |
| `.github/`     | ✓        | AI prompts, instructions, chat modes         |
| `docs/`        | ✓        | Specifications (ADR, PRD, SDS, traceability) |
| `libs/`        | ✓        | Hexagonal architecture layers                |
| `generators/`  | ✓        | Nx generators, scaffolding                   |
| `templates/`   | ✓        | Copier/Jinja2 templates                      |
| `tests/`       | ✓        | Testing infrastructure                       |
| `tools/`       | ✓        | Development utilities                        |
| `scripts/`     | ✓        | Shell automation, justfile                   |
| `temporal_db/` | ✓        | Rust temporal database                       |
| `ops/`         | ✓        | Observability stack                          |

See `ce.manifest.jsonc` for the complete artifact registry.

## Instruction Precedence

When multiple guidelines conflict, follow this precedence:

1. `security.instructions.md` (10) — **ALWAYS WINS**
2. `generators-first.instructions.md` (15)
3. `hexagonal-architecture.instructions.md` (16)
4. `architecture.instructions.md` (18)
5. `ai-workflows.constitution.instructions.md` (20)
6. `temporal-db.instructions.md` (25)
7. `ci-workflow.instructions.md` (30)
8. `testing.instructions.md` (35)
9. `general.instructions.md` (50)

Detailed instructions in `.github/instructions/`.

## Quick Reference

| Task            | Command                     |
| --------------- | --------------------------- |
| Setup           | `just setup`                |
| Validate        | `just ai-validate`          |
| Test all        | `just test`                 |
| Template test   | `just test-generation`      |
| Scaffold        | `just ai-scaffold name=...` |
| Dev servers     | `just dev`                  |
| Database        | `just supabase-start`       |
| Type generation | `just gen-types`            |
| Pre-commit      | `just pre-commit`           |
| Health check    | `just doctor`               |
