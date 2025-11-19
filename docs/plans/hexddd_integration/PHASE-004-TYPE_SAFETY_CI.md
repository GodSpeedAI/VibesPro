# PHASE-004: Type Safety & CI Integration

**Status:** Ready for Execution
**Duration:** 6-8 hours
**Parallelization:** 4 cycles (A ∥ B, then C ∥ D)
**Critical Path:** Yes (A → C → D)
**Dependencies:** PHASE-003 complete
**Owner:** Platform Agent

---

## 🎯 Phase Objectives

Enforce strict type safety across TypeScript and Python, implement automated type sync workflows, and integrate validation into CI/CD pipelines.

### Success Criteria

- [ ] TypeScript strict mode enforced (zero `any` types)
- [ ] Python mypy strict mode enforced (≥95% coverage)
- [ ] Automated type sync CI workflow operational
- [ ] Pre-commit hooks validate types locally
- [ ] All type checks pass in CI
- [ ] **Evidence**: `pnpm tsc --noEmit && uv run mypy --strict` both GREEN

### Traceability

| Requirement | Cycle | Validation                |
| ----------- | ----- | ------------------------- |
| DEV-ADR-029 | A, B  | Strict typing enforced    |
| DEV-PRD-030 | A, B  | Type check gates in CI    |
| DEV-PRD-031 | C, D  | Automated type sync       |
| DEV-SDS-029 | A, B  | Config files + lint rules |
| DEV-SDS-030 | C, D  | Workflows + hooks         |

---

## 📊 Cycles Overview

| Cycle | Owner          | Branch                     | Depends On | Parallel With | Duration |
| ----- | -------------- | -------------------------- | ---------- | ------------- | -------- |
| **A** | Platform Agent | `feature/ts-strict`        | PHASE-003  | B             | 2h       |
| **B** | Platform Agent | `feature/py-strict`        | PHASE-003  | A             | 2h       |
| **C** | Platform Agent | `feature/type-sync-ci`     | A, B       | D             | 3h       |
| **D** | Platform Agent | `feature/pre-commit-hooks` | A, B       | C             | 1h       |

---

## ⚡ Cycle A: TypeScript Strict Configuration

**Duration:** 2 hours

### tsconfig.base.json

```json
{
    "compilerOptions": {
        "strict": true,
        "noUncheckedIndexedAccess": true,
        "noImplicitReturns": true,
        "noFallthroughCasesInSwitch": true,
        "forceConsistentCasingInFileNames": true,
        "skipLibCheck": true
    }
}
```

### ESLint Rules

```json
// .eslintrc.json
{
    "rules": {
        "@typescript-eslint/no-explicit-any": "error",
        "@typescript-eslint/no-unsafe-assignment": "error",
        "@typescript-eslint/no-unsafe-call": "error"
    }
}
```

---

## ⚡ Cycle B: Python mypy Strict Configuration

**Duration:** 2 hours

### mypy.ini

```ini
[mypy]
strict = True
warn_unused_ignores = True
disallow_any_generics = True
warn_return_any = True
no_implicit_reexport = True

[mypy-tests.*]
ignore_errors = False
```

### pyproject.toml

```toml
[tool.mypy]
python_version = "3.11"
strict = true
warn_redundant_casts = true
warn_unused_configs = true
```

---

## ⚡ Cycle C: Type Sync CI Workflow

**Duration:** 3 hours
**Depends On:** A + B

### GitHub Actions Workflow

```yaml
# .github/workflows/type-sync.yml
name: Type Sync

on:
    push:
        paths:
            - "supabase/migrations/**"
            - ".github/workflows/type-sync.yml"
    workflow_dispatch:
    schedule:
        - cron: "0 2 * * 0" # Weekly Sunday 2 AM

jobs:
    type-sync:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v4

            - name: Setup Node
              uses: actions/setup-node@v4
              with:
                  node-version: "20"

            - name: Setup Python
              uses: actions/setup-python@v5
              with:
                  python-version: "3.11"

            - name: Install dependencies
              run: |
                  pnpm install
                  uv pip install -r requirements.txt

            - name: Generate types from Supabase
              run: nx run type-generator:generate

            - name: Check for type drift
              id: drift-check
              run: |
                  if git diff --exit-code; then
                    echo "drift=false" >> $GITHUB_OUTPUT
                  else
                    echo "drift=true" >> $GITHUB_OUTPUT
                  fi

            - name: Validate TypeScript types
              run: pnpm tsc --noEmit

            - name: Validate Python types
              run: uv run mypy --strict

            - name: Create PR if drift detected
              if: steps.drift-check.outputs.drift == 'true'
              uses: peter-evans/create-pull-request@v5
              with:
                  commit-message: "chore(types): sync types from Supabase schema"
                  title: "Type Sync: Auto-generated from schema changes"
                  branch: auto/type-sync
```

---

## ⚡ Cycle D: Pre-commit Hooks

**Duration:** 1 hour

### Husky Setup

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run type checks
pnpm tsc --noEmit
uv run mypy --strict

# Regenerate types if schema changed
if git diff --cached --name-only | grep -q 'supabase/migrations'; then
  echo "Schema change detected, regenerating types..."
  pnpm nx run type-generator:generate
  if git diff --quiet libs/shared/database-types libs/shared/type_system; then
    echo "Types already in sync."
  else
    echo "Type drift detected. Run 'just type-sync' and review generated artifacts before committing."
    git diff --stat libs/shared/database-types libs/shared/type_system
    exit 1
  fi
fi
```

### justfile Targets

```makefile
# justfile
type-check:
    pnpm tsc --noEmit
    uv run mypy --strict

type-sync:
    pnpm nx run type-generator:generate
    just type-check
```

---

## ✅ Phase Validation Checklist

- [ ] TypeScript: `strict: true`, zero `any` violations
- [ ] Python: `mypy --strict` passes, ≥95% coverage
- [ ] CI Workflow: Type sync runs on schema changes
- [ ] Pre-commit Hooks: Local type validation
- [ ] All tests: Pass with strict types
- [ ] **PHASE-004 marked GREEN in Master Plan**

---

**Next Steps**: Proceed to PHASE-005 (Integration & Documentation)
