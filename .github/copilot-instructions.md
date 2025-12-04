# AI Agent Instructions for VibesPro

VibesPro is a **Cognitive Infrastructure Platform**—it synthesizes production-ready Nx monorepos with hexagonal architecture, embeds 32+ specialized AI development agents, and maintains institutional memory via a Rust-based temporal database. Generate new projects with `copier copy gh:GodSpeedAI/VibesPro my-project`.

## Architecture Overview

```
VibesPro
├── templates/{{project_slug}}/   # Project synthesis engine → generated codebases
├── generators/                   # Nx generators for hexagonal scaffolding
├── libs/                         # Shared libraries (domain/application/infrastructure layers)
├── temporal_db/                  # Institutional memory (patterns, decisions, learnings)
├── architecture/calm/            # C4 diagrams and ADRs (CALM methodology)
└── .github/instructions/         # 20 specialized instruction files (MECE)
```

**Hexagonal Flow**: `infrastructure → application → domain` (dependencies point inward). Domain stays pure—no I/O. Use ports/adapters at boundaries.

**Multi-Language**: TypeScript (`strict`), Python (`mypy --strict`), Rust. Keep types in sync: `just gen-types-ts` → `just gen-types-py`.

## Essential Commands

| Task                    | Command                            | Notes                                      |
| ----------------------- | ---------------------------------- | ------------------------------------------ |
| **First-time setup**    | `just setup`                       | Installs pnpm, uv, creates `.venv`         |
| **Fast validation**     | `just ai-validate`                 | Lint, typecheck, AGENT links, tests        |
| **Full test suite**     | `just test`                        | Node + Python + integration                |
| **Template generation** | `just test-generation`             | Validates Copier output in `./test-output` |
| **Scaffold code**       | `just ai-scaffold name=@nx/js:lib` | Always use generators before writing code  |
| **Run dev servers**     | `just dev`                         | Starts all Nx serve targets                |
| **Health check**        | `just doctor`                      | Diagnoses environment issues               |
| **Generate types**      | `just gen-types`                   | TypeScript + Python from Supabase schema   |
| **Prompt lint**         | `just prompt-lint`                 | Validates `.github/prompts/*.prompt.md`    |

## Generator-First Development (Non-Negotiable)

**Before writing any code**, check for an Nx generator:

```bash
pnpm exec nx list                    # See all available generators
just ai-scaffold name=@nx/js:lib     # Scaffold a library
just ai-scaffold name=@nx/react:component  # Scaffold a component
```

Custom generators in `generators/` follow hexagonal patterns (domain/application/infrastructure layers).

## Change Workflow

1. **Spec first**: Changes must trace to PRD/SDS/TS/ADR in `docs/specs/`
2. **TDD mandatory**: Red → Green → Refactor (see `just tdd-red`, `just tdd-green`, `just tdd-refactor`)
3. **Generator-first**: Scaffold before coding
4. **Validate**: `just ai-validate` must pass
5. **Commit format**: `type(scope): message [SPEC-ID]` (e.g., `feat(auth): add rate limiter [PRD-042]`)

## Instruction Routing

Match your task to the right `.github/instructions/*.instructions.md`:

| Trigger                          | Instruction File                                         |
| -------------------------------- | -------------------------------------------------------- |
| Architecture/new libs/templates  | `architecture.instructions.md`                           |
| Writing tests                    | `testing.instructions.md`                                |
| Auth/secrets/`.vscode/*.json`    | `security.instructions.md` (highest priority)            |
| Performance/optimization         | `performance.instructions.md`                            |
| Debugging failures               | `debugging.instructions.md`                              |
| Refactoring (no behavior change) | `refactoring.instructions.md`                            |
| Nx scaffolding                   | `generators-first.instructions.md`, `nx.instructions.md` |
| TDD/AI workflows                 | `ai-workflows.constitution.instructions.md`              |

**Priority order**: Security → AI Constitution → Generator-First → Architecture → Testing → Others

## Key Patterns

- **AGENT.md files**: Each directory has context-specific agent instructions. Check `libs/AGENT.md`, `scripts/AGENT.md`, etc.
- **CALM architecture**: Living documentation in `architecture/calm/` using C4 model hierarchy
- **Temporal DB**: Query `temporal_db/` before major architectural decisions for historical patterns
- **Template changes**: Edit `templates/{{project_slug}}/**/*.j2`, then `just test-generation` to validate

## Template Development (Copier + Jinja2)

VibesPro generates projects via Copier. Templates live in `templates/{{project_slug}}/`:

```bash
# Test template generation (outputs to ./test-output)
just test-generation

# Validate specific template tests
just test-template              # Quick non-interactive test
just test-template-logfire      # Logfire scaffolding validation
```

**Jinja2 Conventions:**

- Template files use `.j2` suffix (e.g., `justfile.j2`, `package.json.j2`)
- Variables from `copier.yml` questions: `{{ project_name }}`, `{{ project_slug }}`, `{{ domain_name }}`
- Conditional sections: `{% if include_ai_workflows %}...{% endif %}`
- Raw blocks for nested templates: `{% raw %}{{project_slug}}{% endraw %}`

**Key files:**

- `copier.yml` — User questions and validation rules
- `hooks/post_gen.py` — Post-generation setup (runs after Copier)
- `templates/{{project_slug}}/` — All generated project files

## Supabase & Data Layer

Local Supabase stack via Docker Compose:

| Command                                   | Purpose                                      |
| ----------------------------------------- | -------------------------------------------- |
| `just supabase-start`                     | Start Postgres + Studio (ports 54322/54323)  |
| `just supabase-stop`                      | Stop the stack                               |
| `just supabase-reset`                     | Wipe data and re-seed                        |
| `just db-migrate`                         | Apply migrations from `supabase/migrations/` |
| `just db-seed`                            | Run `supabase/seed.sql`                      |
| `just db-migration-create NAME=add_users` | Create timestamped migration                 |
| `just db-psql`                            | Connect to database shell                    |

**Type generation workflow:**

```bash
just gen-types-ts    # Supabase → libs/shared/types/src/database.types.ts
just gen-types-py    # TS types → libs/shared/types-py/src/models.py
just gen-types       # Both in sequence
just check-types     # Verify types are committed and up-to-date
```

## Observability Stack (Vector + Logfire + OpenObserve)

```
┌─────────────────────────┐
│ App (Rust/Python/TS)    │
│ OpenTelemetry SDK       │
└───────────┬─────────────┘
            │ OTLP (4317 gRPC / 4318 HTTP)
            ▼
┌─────────────────────────┐
│ Vector (edge collector) │
│ PII redaction + routing │
└───────────┬─────────────┘
            │
    ┌───────┴───────┐
    ▼               ▼
Logfire         OpenObserve
(tracing)       (long-term)
```

**Commands:**

| Command                       | Purpose                       |
| ----------------------------- | ----------------------------- |
| `just observe-start`          | Start Vector pipeline         |
| `just observe-openobserve-up` | Start OpenObserve (Docker)    |
| `just observe-validate`       | Validate Vector config        |
| `just test-logs`              | Run all logging tests         |
| `just test-logfire`           | Logfire smoke validation      |
| `just observe-test-all`       | Full observability test suite |

**Feature flag:** Set `VIBEPRO_OBSERVE=1` to enable OTLP export.

**Key files:**

- `ops/vector/vector.toml` — Vector sources, transforms, sinks
- `tools/vector/traces_sanitize.vrl` — PII redaction rules
- `crates/vibepro-observe/` — Rust tracing crate

## Debug Workflow (6-Step Process)

Follow the structured debug cycle via chat modes and Just recipes:

| Phase       | Command               | Chat Mode        | Purpose                                  |
| ----------- | --------------------- | ---------------- | ---------------------------------------- |
| 1. Start    | `just debug-start`    | `debug.start`    | Normalize bug report, plan repro         |
| 2. Repro    | `just debug-repro`    | `debug.repro`    | Write failing test that reproduces issue |
| 3. Isolate  | `just debug-isolate`  | `debug.isolate`  | Narrow root cause with instrumentation   |
| 4. Fix      | `just debug-fix`      | `debug.fix`      | Apply minimal change to pass tests       |
| 5. Refactor | `just debug-refactor` | `debug.refactor` | Clean up fix, remove debug code          |
| 6. Regress  | `just debug-regress`  | `debug.regress`  | Run full regression suite                |

**Workflow:**

1. Open the corresponding chat mode in VS Code
2. Reference `docs/ai_context_bundle` for project context
3. Follow the phase-specific guidance
4. Move to next phase only when current phase criteria met

## Anti-Patterns

- ❌ Writing code without checking generators first
- ❌ Modifying `.vscode/settings.json` or enabling `chat.tools.autoApprove`
- ❌ Committing secrets (use SOPS: `sops exec-env .secrets.env.sops '<command>'`)
- ❌ Bypassing TDD cycle or skipping `just ai-validate`
- ❌ Adding dependencies without ADR discussion
- ❌ Running framework CLIs directly (use `nx run` or Just recipes)
- ❌ Editing Vector/observability configs without running `just test-logs`
- ❌ Skipping `just test-generation` after template change
- ❌ Manually creating config files that can be generated
