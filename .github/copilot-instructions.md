# AI Agent Instructions for VibesPro

> **🎯 Core Concept**: VibesPro is a **Copier template repository** that synthesizes production-ready Nx monorepos. You modify Jinja2 templates in `templates/{{project_slug}}/`, test with `just test-generation`, and changes affect all future synthesized applications.

## Critical Mental Model

**VibesPro Repository Architecture:**

- **THIS repo** = Jinja2 templates + synthesis tooling + AI workflow system
- **Synthesized applications** = Complete Nx monorepos created by `copier copy`
- **Your changes** propagate to all future synthesized projects
- **Test locally** with `just test-generation` → `../test-output` before committing

## Essential Workflows

### 1. Setup & Validation

```bash
just setup              # First time: installs Node, Python, tools
just test-generation    # Test template generates correctly
just spec-guard         # Full quality gate before PR
just ai-validate        # Quick lint + typecheck
```

### 2. Generator-First Development (MANDATORY)

**Never write code before checking for an Nx generator:**

```bash
pnpm exec nx list                          # List all generators
pnpm exec nx list @nx/react                # Check specific plugin
just ai-scaffold name=@nx/js:lib           # Scaffold THEN customize
```

**Why:** Ensures consistent structure, proper Nx config, hexagonal compliance.

### 3. Template Modification Flow

```bash
# 1. Modify Jinja2 template in templates/{{project_slug}}/
# 2. Test synthesis
just test-generation

# 3. Verify synthesized application works
cd ../test-output
pnpm install
pnpm exec nx run-many --target=build --all

# 4. Commit with spec ID
git commit -m "feat(template): add X [DEV-PRD-042]"
```

## Architecture Guardrails

### Hexagonal Architecture (Non-Negotiable)

Dependencies ONLY flow inward: `infrastructure → application → domain`

```typescript
// ❌ WRONG: Domain depends on infrastructure
class User {
    save() {
        await db.users.insert(this);
    } // NO DATABASE IN DOMAIN!
}

// ✅ CORRECT: Application coordinates through ports
class CreateUserUseCase {
    constructor(private userRepo: UserRepository) {} // Interface/port
    async execute(dto: CreateUserDto) {
        const user = User.create(dto); // Pure domain logic
        await this.userRepo.save(user); // Through port
    }
}
```

**Key rule:** Domain layer has ZERO external dependencies (no DB, no HTTP, no frameworks).

### Type Safety (Strict)

- TypeScript: `strict: true`, NO `any` (use `unknown` + type guards)
- Python: `mypy --strict`, full type coverage required
- All public APIs must be 100% typed

## Key Just Recipes (Primary Interface)

Just orchestrates all workflows. **Use these instead of raw commands:**

```bash
just setup              # Install Node + Python + tools (first time)
just test-generation    # Test full template → application synthesis
just test               # All tests (Node + Python + Shell + integration)
just ai-validate        # Quick: lint + typecheck
just spec-guard         # Full gate: specs + prompts + docs validation
just ai-scaffold        # Nx generator with error handling
just prompt-lint        # Validate .github/prompts/*.prompt.md
```

**See `justfile` for the complete recipe catalog.**

## Specification-Driven Development

**Every change traces to formal specs:**

- **DEV-PRD-\***: Product requirements (`docs/dev_prd.md`)
- **DEV-SDS-\***: Software design (`docs/dev_sds.md`)
- **DEV-ADR-\***: Architecture decisions (`docs/dev_adr.md`)
- **DEV-TS-\***: Technical specs (`docs/dev_technical-specifications.md`)

**Commit format:** `type(scope): message [SPEC-ID]`

```bash
# Example
git commit -m "feat(synthesis): add Logfire integration [DEV-PRD-018]"
```

**Traceability:** Update `docs/traceability_matrix.md` when implementing specs.

## Critical File Locations

### Template System

- `copier.yml` - Questions and variables for generation
- `templates/{{project_slug}}/` - Jinja2 templates (what gets synthesized)
- `hooks/post_gen.py` - Post-generation processing
- `tests/fixtures/test-data.yml` - Default test answers

### AI Workflow System

- `.github/instructions/*.instructions.md` - Modular guidance (MECE principle)
- `.github/prompts/*.prompt.md` - Reusable prompt templates
- `.github/chatmodes/*.chatmode.md` - Specialized personas stored per file
- `tools/prompt/` - Prompt linting and planning tools
- `tools/ai/` - Context bundling and scaffolding

### Testing

- `tests/unit/` - Node.js unit tests (Jest)
- `tests/integration/` - Template generation tests
- `tests/shell/` - ShellSpec tests for scripts
- `tests/template/` - Copier template validation
- `tests/fixtures/` - Test data and mocks

### Temporal Learning

- `temporal_db/` - Rust redb database
- Stores: specifications, patterns, architectural decisions
- Keys: `spec:{id}:{timestamp_nanos}`, `pattern:{id}:{timestamp_nanos}`
- See `temporal_db/README.md` for query patterns

## Environment Stack (Layered Isolation)

**Layer 1: Devbox** - OS packages (git, curl, jq, postgresql)
**Layer 2: mise** - Runtime versions (Node, Python, Rust)
**Layer 3: SOPS** - Secret encryption (.secrets.env.sops)
**Layer 4: Just** - Task orchestration (portable commands)

**All layers configured via declarative files:** `devbox.json`, `.mise.toml`, `.sops.yaml`, `justfile`

**Why this matters:** Synthesized applications inherit this exact stack → deterministic environments everywhere.

## Security Guardrails (HIGHEST PRIORITY)

**Security overrides ALL other guidelines.**

### Critical Rules

1. **NEVER modify** `.vscode/settings.json` or `.vscode/tasks.json` without explicit confirmation
    - Reason: Can enable `chat.tools.autoApprove` → RCE
2. **Always sanitize inputs** - Never interpolate untrusted data into shell/SQL
3. **Use SOPS for secrets** - Never commit plaintext credentials
4. **Validate at boundaries** - Use type guards (Zod, io-ts) at I/O points
5. **Respect workspace trust** - Don't execute code in untrusted folders

**Security review:** Use `.github/prompts/sec.review.prompt.md` for audits.

## Testing Best Practices

**Match approach to complexity:**

- **TDD (test-first)**: Complex business logic, security-sensitive code
- **Code-first + tests**: Simple CRUD, straightforward transformations
- **Benchmarks**: Performance-critical paths (after implementation)

### Running Tests

```bash
just test              # All tests (Node + Python + Shell + integration)
just test-python       # pytest (skip pre-commit with SKIP env)
just test-node         # Jest unit + integration
just test-generation   # Full template → application synthesis flow
```

**Test locations:**

- `tests/unit/` - Node.js (Jest), Python (pytest)
- `tests/integration/` - Template synthesis smoke tests
- `tests/shell/` - ShellSpec for scripts
- `temporal_db/tests/` - Rust (cargo test)

## AI Workflow System

### Modular Instructions (MECE Principle)

Instructions in `.github/instructions/` stack by precedence:

1. `security.instructions.md` (10) - HIGHEST
2. `ai-workflows.constitution.instructions.md` (10)
3. `generators-first.instructions.md` (15)
4. `testing.instructions.md` (35)
5. `general.instructions.md` (50)

**Never contradict higher-precedence instructions.**

### Chat Modes & Prompts

- **Personas** live in `.github/chatmodes/` (e.g., `tdd.red`, `debug.start`, `persona.navigator`)
- **Prompts** in `.github/prompts/` (e.g., `spec.implement.prompt.md`, `tdd.workflow.prompt.md`)
- **Validate prompts:** `just prompt-lint`
- **Context bundling:** `just ai-context-bundle` → `docs/ai_context_bundle/`

### Temporal Learning Database

- **Location:** `temporal_db/` (Rust redb)
- **Stores:** Specs, patterns, architectural decisions
- **Key format:** `spec:{id}:{timestamp_nanos}`, `pattern:{id}:{timestamp_nanos}`
- **Use:** Query before major architectural decisions (see `temporal_db/README.md`)

## Quick Reference

### Before Writing Code

1. **Check for generator:** `pnpm exec nx list` → `just ai-scaffold name=<generator>`
2. **Review specs:** Check `docs/dev_prd.md`, `dev_sds.md`, `dev_adr.md`
3. **Verify architecture:** Ensure hexagonal dependency flow (`infrastructure → application → domain`)

### After Changes

1. **Validate:** `just ai-validate` (lint + typecheck)
2. **Test synthesis:** `just test-generation` (template → application)
3. **Spec guard:** `just spec-guard` (full quality gate)
4. **Commit:** `type(scope): message [SPEC-ID]`

### Red Flags (STOP)

- ❌ Creating libs/apps without Nx generators
- ❌ TypeScript `any` (use `unknown` + type guards)
- ❌ Domain layer importing infrastructure
- ❌ Modifying `.vscode/*.json` without approval
- ❌ Missing spec ID in commit

## Key Resources

- **Detailed instructions:** `.github/instructions/*.instructions.md`
- **Specs:** `docs/dev_prd.md`, `dev_sds.md`, `dev_adr.md`, `dev_technical-specifications.md`
- **Environment:** `docs/ENVIRONMENT.md` (Devbox + mise + SOPS + Just)
- **Traceability:** `docs/traceability_matrix.md`
- **Nx rules:** `AGENTS.md`
- **Temporal DB:** `temporal_db/README.md`

**This file provides the 20% of knowledge needed for 80% of tasks. For edge cases, consult the modular instructions and specs.**
