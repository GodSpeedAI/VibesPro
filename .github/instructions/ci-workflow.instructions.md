---
description: 'CI/CD workflow and validation gates'
applyTo: '.github/workflows/**,justfile'
kind: instructions
domain: ci
precedence: 30
---

# CI/CD Workflow & Validation Gates

## Pre-Commit Checklist

Before committing, run these validation gates:

```bash
# Full validation (recommended before push)
just ai-validate

# Individual checks (if debugging specific failures)
just pre-commit              # All pre-commit hooks
just validate-generator-schemas  # Generator JSON schemas
just test-generation         # Template generation
just test                    # All tests
```

## Validation Order

```
┌────────────────────────────────────────────────────────────┐
│                    just ai-validate                         │
├────────────────────────────────────────────────────────────┤
│  1. validate-generator-schemas  → JSON schema validation    │
│  2. check_agent_links.py        → AGENT.md link integrity  │
│  3. pre-commit hooks            → Linting, formatting       │
│  4. pnpm lint                   → ESLint, TypeScript        │
│  5. pnpm typecheck              → mypy, tsc strict          │
│  6. nx run-many --target=test   → All project tests         │
│  7. test-logfire                → Observability smoke test  │
└────────────────────────────────────────────────────────────┘
```

## GitHub Actions CI

The main CI workflow (`.github/workflows/ci.yml`) runs on every PR:

| Job                | Purpose                           | Command                               |
| ------------------ | --------------------------------- | ------------------------------------- |
| `lint`             | Code style and static analysis    | `just lint`                           |
| `typecheck`        | TypeScript + Python type checking | `just typecheck`                      |
| `test-unit`        | Unit tests (Node + Python)        | `just test-node` + `just test-python` |
| `test-integration` | Template generation + integration | `just test-generation`                |
| `security`         | Dependency vulnerability scanning | `just security-audit`                 |

## Spec-Guard (Documentation Validation)

```bash
# Full documentation and spec validation
just spec-guard
```

This runs:

- `pnpm spec:matrix` - Traceability matrix validation
- `pnpm prompt:lint` - Prompt file structure
- `pnpm run lint:md` - Markdown linting
- `node scripts/check_all_agents.mjs` - AGENT.md file validation
- `node tools/docs/link_check.js` - Documentation link checking

## Template Validation

After changing any file in `templates/{{project_slug}}/`:

```bash
# Full template generation test
just test-generation

# Quick template smoke test
just test-template

# Logfire template validation
just test-template-logfire
```

The `test-generation` recipe:

1. Creates `./test-output` from templates
2. Runs `pnpm install` in generated project
3. Attempts `nx run-many --target=build`
4. Runs integration smoke tests

## Commit Message Format

```
type(scope): message [SPEC-ID]

# Types: feat, fix, docs, style, refactor, test, chore
# Scope: affected area (auth, orders, generators, etc.)
# SPEC-ID: Reference to PRD/SDS/ADR
```

Examples:

```
feat(orders): add order cancellation logic [PRD-042]
fix(generators): resolve service template path issue [BUG-123]
docs(architecture): update hexagonal diagram [ADR-005]
```

## PR Checklist

Before creating a PR:

- [ ] `just ai-validate` passes locally
- [ ] `just test-generation` passes (if templates changed)
- [ ] Commit messages follow format
- [ ] Changes trace to spec IDs
- [ ] AGENT.md updated if patterns changed
- [ ] No secrets committed (use SOPS)

## Quick CI Fix Commands

```bash
# Fix formatting issues
just format
just pre-commit

# Regenerate types after schema changes
just gen-types

# Verify generated code is committed
just check-types
```

See also: `commit-msg.instructions.md`, `testing.instructions.md`, `security.instructions.md`
