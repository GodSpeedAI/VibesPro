# VibesPro Copilot Instructions

This is a **Copier template repository** that generates production-ready monorepo projects. You're working on the template itself, not a generated project.

## Architecture Essentials

### Generator-First Development

**Before writing any code, check for an Nx generator.** This project follows a strict generator-first policy:

- Run `pnpm exec nx list` to see available generators
- Use `just ai-scaffold name=@nx/js:lib` for scaffolding (preferred)
- Directly: `pnpm exec nx g @nx/js:lib my-library`
- See `.github/instructions/generators-first.instructions.md` for full workflow

### Spec-Driven Development (Mandatory)

All changes flow through formal specifications:

1. **PRD** (Product Requirements) → **SDS** (Software Design) → **TS** (Technical Spec) → **Task**
2. Every commit MUST reference spec IDs in commit body (e.g., `PRD-042`, `SDS-009`)
3. Use chat modes: `#spec.lean`, `#spec.wide` for specification generation
4. Specs live in `docs/specs/` with traceability matrix tracking
5. Run `just spec-guard` before PRs to validate specs and traceability

### TDD Workflow (Non-Negotiable)

Follow strict Red-Green-Refactor cycles:

- **Red**: Write failing test first (use `#tdd.red` chat mode)
- **Green**: Implement minimum code to pass (use `#tdd.green`)
- **Refactor**: Clean up while keeping tests green (use `#tdd.refactor`)
- Never skip tests; never implement without failing test first

## Build System & Commands

### Task Runner: Just

Use `just` (not npm/make) for all workflows:

```bash
just setup              # Initialize environment (Node + Python + tools)
just build              # Auto-detects Nx or direct build
just test               # Run all tests (detects strategy)
just spec-guard         # Pre-PR validation (specs, lint, tests)
just dev                # Start development servers
just prompt-lint        # Validate AI prompts
just spec-matrix        # Generate traceability matrix
```

### Nx Monorepo

- **Always use Nx for tasks**: `nx run`, `nx run-many`, `nx affected`
- **Access Nx MCP server tools**: Use `nx_workspace`, `nx_project_details`, `nx_docs`
- Build cache enabled by default; parallel execution configured
- Projects configured with `project.json` or inferred from folder structure

### Package Management

- **pnpm** for Node (v9.0.0+, corepack enabled)
- **uv** for Python (package manager + virtualenv)
- Workspace defined in `pnpm-workspace.yaml` with `templates/*` and `tools/*`

## Project Structure

### Distributed AGENT.md System

Context-specific guidance in each directory (see `AGENT-MAP.md`):

- `.github/AGENT.md` - AI workflows (prompts, chat modes, instructions)
- `docs/AGENT.md` - Specifications (ADR, PRD, SDS, traceability)
- `libs/AGENT.md` - Business logic (hexagonal architecture)
- `tools/AGENT.md` - Development utilities
- `generators/AGENT.md` - Nx generators and scaffolding
- `templates/AGENT.md` - Jinja2 templates for Copier

### Key Directories

```
.github/
  ├── instructions/       # AI coding rules (precedence-based)
  ├── prompts/           # Reusable AI prompts (.prompt.md)
  └── chatmodes/         # Chat mode definitions (domain.task.chatmode.md)
docs/specs/              # PRD, SDS, TS, traceability matrix
domain/                  # Domain models (domain.yaml)
libs/                    # Shared libraries (hexagonal layers)
apps/                    # Application entry points
generators/              # Nx generators (custom scaffolding)
templates/               # Copier template files (.j2)
tests/                   # Node tests, ShellSpec, fixtures
tools/                   # CLI utilities (Node.js)
scripts/                 # Shell scripts (bash)
```

## Testing Strategy

### Test Types

- **Node tests**: `tests/unit/**/*.test.js` using `node:assert` (no Jest for tools)
- **ShellSpec**: `tests/shell/**/*_spec.sh` for shell script testing
- **Integration**: `tests/integration/**/*.test.js` for end-to-end flows
- **Nx tests**: Jest for generated projects (run via `nx test`)

### Running Tests

```bash
just test                    # Run all tests (auto-detect)
pnpm test                    # Run Nx test targets
pnpm test:jest              # Jest with config
pnpm test:integration       # Integration tests only
shellspec                   # Run ShellSpec tests (if installed)
shellcheck scripts/*.sh     # Static analysis for shell scripts
```

## Tech Stack (Template Context)

### Languages

- **TypeScript** (5.9+) - Primary for libs/tools
- **Python** (3.12+) - FastAPI services, ML pipelines
- **Rust** (1.75+) - Performance-critical components (temporal_db)
- **Bash** - Scripts and automation

### Core Dependencies (see `techstack.yaml`)

- **Web**: FastAPI, Nx, React
- **Data**: Supabase (Postgres + pgvector + auth), Redis
- **AI**: DSPy, LiteLLM, ZenML
- **Auth**: Ory Kratos/Hydra, Supabase Auth
- **Observability**: OpenTelemetry, LGTM stack (local)
- **Testing**: Pytest, Jest, Playwright, ShellSpec

### Generated Project Stack

When VibesPro generates a project, it includes:

- Nx workspace with build/test/lint targets
- TypeScript/Python project structure
- Hexagonal architecture scaffolding
- Pre-configured CI/CD (GitHub Actions)
- Documentation templates (Diataxis framework)

## AI Workflow Conventions

### Chat Modes (domain.task pattern)

Use specialized chat modes in `.github/chatmodes/`:

- **TDD**: `#tdd.red`, `#tdd.green`, `#tdd.refactor`
- **Debug**: `#debug.start`, `#debug.isolate`, `#debug.fix`
- **Spec**: `#spec.lean`, `#spec.wide`, `#spec.nfr`
- **Persona**: `#persona.system-architect`, `#persona.senior-backend`

### Prompt Files

Reusable prompts in `.github/prompts/*.prompt.md`:

- Frontmatter metadata (model, tools, temperature, max_tokens)
- Variables: `${selection}`, `${fileBasename}`, `${workspaceFolder}`
- Validation: `just prompt-lint` checks structure and model refs

### Instruction Files

Precedence-based guidance in `.github/instructions/`:

- Frontmatter: `description`, `applyTo`, `kind`, `domain`, `precedence`
- Lower precedence number = higher priority (10 > 50)
- Referenced by chat modes and enforced by pre-commit hooks

## Security & Quality Gates

### Security

- Never commit secrets (use env vars or secret stores)
- `.vscode/mcp.json` must not contain hardcoded tokens
- Run `pnpm env:audit` to check for leaked secrets
- See `.github/instructions/security.instructions.md`

### Pre-PR Checklist

```bash
just spec-guard  # Runs everything below
  ├── pnpm spec:matrix         # Traceability matrix
  ├── pnpm prompt:lint         # Prompt validation
  ├── pnpm lint:md             # Markdown linting
  ├── node tools/docs/link_check.js
  ├── pnpm test:node           # Node smoke tests
  └── pnpm env:audit           # Secret scanning
```

### Commit Message Format

```
type(scope): description

Body with spec references (PRD-042, SDS-009)
and rationale for changes.

Risks/Mitigations:
- Risk: potential X
- Mitigation: Y
```

## Common Patterns

### Hexagonal Architecture

Generated projects follow hexagonal (ports & adapters):

- **Domain**: Core business logic (entities, value objects)
- **Application**: Use cases, orchestration
- **Infrastructure**: Adapters (DB, HTTP, messaging)
- See `libs/` for examples and `domain/domain.yaml` for service definitions

### Copier Template Variables

When working on templates:

- Use Jinja2 syntax: `{{ project_slug }}`, `{% if feature_enabled %}`
- Variables defined in `copier.yml`
- Test generation: `just generate` → `../test-output`

### MCP Server Configuration

Nx MCP server configured in `.vscode/mcp.json`:

- Transport: stdio
- Command: `npx -y @nx/mcp-server@latest`
- Env: `NX_WORKSPACE_ROOT=${workspaceFolder}`

## Quick Reference

### When Adding Features

1. Check `.github/instructions/` for domain-specific rules
2. Run `pnpm exec nx list` for available generators
3. Create specs first (PRD → SDS → TS)
4. Use `#tdd.red` chat mode to write failing test
5. Implement with generator or minimal code
6. Run `just spec-guard` before committing

### When Debugging

1. Use `#debug.start` chat mode for structured debugging
2. Check `tools/monitoring/` for observability utilities
3. Use `just test TARGET` for focused testing
4. Consult `AGENT-MAP.md` for context-specific guidance

### When Documenting

1. Follow Diataxis framework (tutorial, how-to, explanation, reference)
2. Add ADRs to `docs/specs/adr/` for architectural decisions
3. Update traceability matrix: `pnpm spec:matrix`
4. Link specs in commit messages and PR descriptions

---

**Remember**: This is a template repository. Changes here affect all future generated projects. Test generation thoroughly with `just generate`.
