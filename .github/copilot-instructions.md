# AI Agent Instructions for VibesPro

VibesPro is a **Generative Development Environment** that synthesizes production-ready Nx monorepos with hexagonal architecture. It uses Copier + Jinja2 to generate projects and maintains institutional memory via a Rust-based temporal database. Generate new projects with `copier copy gh:GodSpeedAI/VibesPro my-project`.

## Architecture Overview

```
VibesPro/
├── templates/{{project_slug}}/    # Copier templates (Jinja2) → generates complete projects
├── generators/                    # Nx generators (TypeScript) → scaffolds libs/apps/components
│   ├── generator/                 # Meta-generator: creates new generators
│   └── service/                   # Service generator: hexagonal architecture
├── libs/                          # Shared libraries (hexagonal layers: domain/application/infrastructure)
├── tools/                         # Dev utilities (TypeScript + Python)
├── tests/                         # Unit, integration, shell tests
├── temporal_db/                   # Institutional memory (Rust + redb)
├── supabase/                      # Database migrations and seeds
└── ops/                           # Observability (Vector, OpenObserve, Logfire)
```

**Hexagonal Flow**: Dependencies point inward only: `infrastructure → application → domain`. Domain is pure—no I/O, no frameworks. Use ports (interfaces) in application layer, adapters (implementations) in infrastructure. See `hexagonal-architecture.instructions.md` for patterns.

## Instruction Index

Match your task to the right instruction file in `.github/instructions/`:

| File                                        | Precedence | When to Use                                             |
| ------------------------------------------- | ---------- | ------------------------------------------------------- |
| `security.instructions.md`                  | **10**     | Auth, secrets, `.vscode/*.json`, SOPS — **ALWAYS WINS** |
| `generators-first.instructions.md`          | 15         | Scaffolding new code — check for Nx generator first     |
| `hexagonal-architecture.instructions.md`    | 16         | Domain entities, use cases, ports/adapters patterns     |
| `architecture.instructions.md`              | 18         | System design, type contracts, environment parity       |
| `ai-workflows.constitution.instructions.md` | 20         | TDD/debugging workflows, AI agent constitution          |
| `temporal-db.instructions.md`               | 25         | Querying/recording patterns in institutional memory     |
| `ci-workflow.instructions.md`               | 30         | Pre-commit, validation gates, CI/CD                     |
| `testing.instructions.md`                   | 35         | Test strategies, ShellSpec, coverage targets            |
| `general.instructions.md`                   | 50         | General conventions when no specific rule applies       |
| `commit-msg.instructions.md`                | —          | Commit format: `type(scope): message [SPEC-ID]`         |
| `style.python.instructions.md`              | —          | Python: mypy strict, ruff, type hints                   |
| `style.frontend.instructions.md`            | —          | TypeScript: strict mode, no `any`                       |

Check directory-specific `AGENT.md` files for local context (e.g., `libs/AGENT.md`, `generators/AGENT.md`). See `AGENT-MAP.md` for full navigation.

## Essential Commands

| Task                | Command                     | Notes                                      |
| ------------------- | --------------------------- | ------------------------------------------ |
| **Setup**           | `just setup`                | Installs pnpm, uv, bun, creates `.venv`    |
| **Validate**        | `just ai-validate`          | Lint + typecheck + tests + AGENT links     |
| **Test all**        | `just test`                 | Node + Python + integration                |
| **Template test**   | `just test-generation`      | Validates Copier output in `./test-output` |
| **Scaffold**        | `just ai-scaffold name=...` | Runs Nx generator (e.g., `@nx/js:lib`)     |
| **Dev servers**     | `just dev`                  | Starts all Nx serve targets                |
| **Database**        | `just supabase-start`       | Postgres on 54322, Studio on 54323         |
| **Type generation** | `just gen-types`            | TS + Python types from Supabase schema     |
| **Pre-commit**      | `just pre-commit`           | Runs all formatting/lint hooks             |
| **Health check**    | `just doctor`               | Diagnoses environment issues               |

## Generator-First Development

**Before writing ANY new code**, check for an Nx generator:

```bash
pnpm exec nx list                        # List all generators
pnpm exec nx list @nx/js                 # Check specific plugin
just ai-scaffold name=@nx/js:lib         # Run via just recipe
just generator-new my-gen domain         # Create custom generator
```

Custom generators in `generators/` follow hexagonal patterns. Use the meta-generator to create new generators. See `generators/AGENT.md` for the full guide.

## Temporal Database Workflow

The temporal database captures institutional memory. **Query it before major decisions:**

```bash
just temporal-ai-query "patterns for order domain"   # Search existing patterns
just temporal-ai-stats                               # View database stats
just setup-ai                                        # Initialize/Repair DB & CLI
```

**Workflow:**

1. **Query** temporal_db for relevant ADRs and patterns before implementing
2. **Implement** following hexagonal architecture
3. **Record** successful patterns for future reference
4. **Learn** from anti-patterns to avoid repeating mistakes

See `temporal-db.instructions.md` for integration details.

## Template Development (Copier + Jinja2)

Templates in `templates/{{project_slug}}/` use Jinja2 with `.j2` suffix:

- **Variables** from `copier.yml`: `{{ project_name }}`, `{{ project_slug }}`, `{{ domain_name }}`
- **Conditionals**: `{% if include_ai_workflows %}...{% endif %}`
- **Raw blocks** for nested templates: `{% raw %}{{variable}}{% endraw %}`
- **Test changes**: `just test-generation` (outputs to `./test-output`)

Key files: `copier.yml` (questions/validation), `hooks/post_gen.py` (post-generation setup).

## Type Sync (Multi-Language)

TypeScript (`strict`), Python (`mypy --strict`), Rust. Keep types synchronized:

```bash
just gen-types-ts    # Supabase → libs/shared/types/src/database.types.ts
just gen-types-py    # TS types → libs/shared/types-py/src/models.py
just check-types     # Verify types are committed and up-to-date
```

## TDD Workflow

```bash
just tdd-red        # 🔴 Write failing test
just tdd-green      # 🟢 Minimal implementation to pass
just tdd-refactor   # ♻️ Improve code, keep tests green
```

Use corresponding VS Code chat modes: `tdd.red`, `tdd.green`, `tdd.refactor`.

## Debug Workflow

```bash
just debug-start    # Normalize bug report
just debug-repro    # Write failing test
just debug-isolate  # Instrument and narrow root cause
just debug-fix      # Apply minimal fix
just debug-refactor # Clean up fix
just debug-regress  # Run full regression
```

## CI/CD Validation

```bash
# Before committing
just ai-validate           # Full validation suite
just pre-commit            # Format + lint hooks

# After template changes
just test-generation       # Copier output validation

# Spec documentation
just spec-guard            # Traceability + prompt lint
```

## Observability Stack

```
App → OpenTelemetry SDK → Vector (PII redaction) → Logfire + OpenObserve
```

| Command                       | Purpose                       |
| ----------------------------- | ----------------------------- |
| `just observe-start`          | Start Vector pipeline         |
| `just observe-openobserve-up` | Start OpenObserve (Docker)    |
| `just observe-test-all`       | Full observability test suite |

Set `VIBEPRO_OBSERVE=1` to enable OTLP export. Config: `ops/vector/vector.toml`.

## Commit Format

```
type(scope): message [SPEC-ID]
```

Example: `feat(auth): add rate limiter [PRD-042]`

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`. **CRITICAL: Changes must trace to specs in `docs/specs/`.**

## Anti-Patterns

- ❌ Writing code without checking generators first
- ❌ Modifying `.vscode/settings.json` or enabling `chat.tools.autoApprove`
- ❌ Committing secrets (use SOPS: `sops exec-env .secrets.env.sops '<command>'`)
- ❌ Running framework CLIs directly (use `nx run` or Just recipes)
- ❌ Skipping `just test-generation` after template changes
- ❌ Adding dependencies without ADR discussion
- ❌ Not querying temporal_db before major architectural decisions
- ❌ Domain layer importing infrastructure (violates hexagonal rules)
- ❌ Not tracing changes to specs in `docs/specs/`
- ❌ Manually creating configuration files that should be generated then modified accordingly
