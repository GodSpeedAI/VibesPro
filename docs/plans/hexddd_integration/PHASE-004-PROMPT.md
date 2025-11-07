# VibesPro - PHASE-004: Type Safety & CI Integration

> **Platform Agent**: Complete this phase to enforce strict type safety and automate type synchronization across the entire stack.

---

## Mission: Eliminate runtime type errors with compiler-enforced safety and automated type drift detection

Enforce TypeScript strict mode and Python mypy strict mode across all code, implement automated type sync workflows that regenerate types from Supabase schemas, and integrate validation into CI/CD pipelines and pre-commit hooks—ensuring zero `any` types and zero type drift.

---

## Success Criteria (Binary Pass/Fail)

-   [ ] **TypeScript Strict Mode Enforced**: `tsconfig.base.json` has `strict: true`, ESLint catches all `any` usage, zero violations in codebase
-   [ ] **Python Strict Mode Enforced**: `mypy --strict` passes, ≥95% type coverage, all public APIs fully typed
-   [ ] **Type Sync Workflow Operational**: GitHub Actions workflow auto-generates types from Supabase migrations, creates PRs on drift
-   [ ] **Pre-commit Hooks Validate Types**: Husky hooks run `tsc --noEmit` and `mypy --strict`, block commits with type errors
-   [ ] **CI Type Gates Pass**: All CI checks (`pnpm tsc --noEmit`, `uv run mypy --strict`, `pnpm nx run-many -t lint`) GREEN
-   [ ] **Zero Type Violations**: No `any` types in TypeScript, no `type: ignore` in Python (except documented exceptions)
-   [ ] **Type Generator Integration**: `nx run type-generator:generate` produces TypeScript and Python types from Supabase schema
-   [ ] **Zero CI Failures**: All quality gates pass
-   [ ] **Zero Technical Debt**: Follows strict typing guidelines from `.github/instructions/style.*.instructions.md`
-   [ ] **Production Ready**: Documentation includes migration guide for existing code, justfile recipes for type workflows

**Failure Mode**: If any criterion fails, continue iterating until all pass. Do not proceed to PHASE-005 with type violations or broken workflows.

---

## Context: Why This Matters

**Current State**: VibesPro lacks strict type enforcement. TypeScript allows `any` types, Python code has no mypy validation, Supabase schema changes require manual type updates, and developers discover type mismatches at runtime instead of compile time.

**Impact**:

-   **Template Users**: Generate projects with loose typing—`any` escapes everywhere, bugs slip through
-   **Type Safety**: Manual type sync between Supabase and app code—schema drift causes production errors
-   **Developer Experience**: Runtime errors instead of compile-time errors—debugging takes 10× longer
-   **CI/CD**: No type validation gates—broken types merge to main, break production
-   **Maintenance**: Type violations accumulate—technical debt grows, refactoring becomes impossible
-   **Cost of Inaction**: Production bugs from type mismatches, hours wasted debugging, team velocity drops

**Target State**:

-   Compiler catches all type errors before runtime (TypeScript + Python)
-   Supabase schema changes auto-generate types—zero manual sync, zero drift
-   Pre-commit hooks block type violations locally—fast feedback loop
-   CI enforces types as quality gate—no broken types reach main
-   Type coverage metrics tracked—regression impossible

**Risk Level**: **HIGH** → **LOW** (after completion, type errors eliminated at compile time, not runtime)

---

## Phase 1: Strict Type Configuration (Cycles A + B) (Sprint 1, Day 1)

### Task 1A: TypeScript Strict Mode Configuration

**What**: Enable TypeScript strict mode, add ESLint rules to ban `any`, fix all existing violations

**Branch**: `feature/ts-strict`

**Implementation Steps**:

1. **🔴 RED Phase - Audit current type violations**:

```bash
# Find all 'any' usage
pnpm eslint . --ext .ts,.tsx --rule '@typescript-eslint/no-explicit-any: error' --format json > tmp/any-violations.json

# Expected: Many violations (this is the baseline we'll fix)
```

2. **Update `tsconfig.base.json`** with strict settings:

```json
{
    "$schema": "https://json.schema.org/draft-07/schema",
    "compileOnSave": false,
    "compilerOptions": {
        "rootDir": ".",
        "sourceMap": true,
        "declaration": false,
        "moduleResolution": "node",
        "emitDecoratorMetadata": true,
        "experimentalDecorators": true,
        "importHelpers": true,
        "target": "ES2022",
        "module": "ESNext",
        "lib": ["ES2022", "DOM"],
        "skipLibCheck": true,
        "skipDefaultLibCheck": true,
        "baseUrl": ".",

        // STRICT MODE - New additions
        "strict": true,
        "noUncheckedIndexedAccess": true,
        "noImplicitReturns": true,
        "noFallthroughCasesInSwitch": true,
        "noUnusedLocals": true,
        "noUnusedParameters": true,
        "forceConsistentCasingInFileNames": true,
        "esModuleInterop": true,
        "allowSyntheticDefaultImports": true,

        // Paths (existing)
        "paths": {
            "@shared/web": ["libs/shared/web/src/index.ts"],
            "@shared/domain": ["libs/shared/domain/src/index.ts"]
        }
    },
    "exclude": ["node_modules", "tmp", "dist", "coverage"]
}
```

3. **Update `.eslintrc.json`** to ban `any`:

```json
{
    "extends": ["eslint:recommended", "plugin:@typescript-eslint/recommended", "plugin:@typescript-eslint/recommended-requiring-type-checking", "plugin:@nx/typescript"],
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "ecmaVersion": 2022,
        "sourceType": "module",
        "project": ["./tsconfig.base.json", "./tsconfig.*.json"]
    },
    "plugins": ["@typescript-eslint", "@nx"],
    "rules": {
        // Ban 'any' completely
        "@typescript-eslint/no-explicit-any": "error",
        "@typescript-eslint/no-unsafe-assignment": "error",
        "@typescript-eslint/no-unsafe-call": "error",
        "@typescript-eslint/no-unsafe-member-access": "error",
        "@typescript-eslint/no-unsafe-return": "error",

        // Enforce type annotations
        "@typescript-eslint/explicit-function-return-type": [
            "error",
            {
                "allowExpressions": true,
                "allowTypedFunctionExpressions": true
            }
        ],
        "@typescript-eslint/explicit-module-boundary-types": "error",

        // Prevent common errors
        "@typescript-eslint/no-floating-promises": "error",
        "@typescript-eslint/await-thenable": "error",
        "@typescript-eslint/no-misused-promises": "error",

        // Consistency
        "@typescript-eslint/consistent-type-imports": [
            "error",
            {
                "prefer": "type-imports"
            }
        ]
    },
    "overrides": [
        {
            "files": ["*.test.ts", "*.test.tsx", "*.spec.ts"],
            "rules": {
                "@typescript-eslint/no-explicit-any": "warn"
            }
        }
    ]
}
```

4. **🟢 GREEN Phase - Fix existing violations systematically**:

**Strategy**: Fix violations library by library, starting with shared libs

```typescript
// Example: libs/shared/web/src/api-client.ts
// Before (uses 'any'):
async request(method: string, path: string, options?: any): Promise<any> {
  // ...
}

// After (fully typed):
async request<TResponse>(
  method: string,
  path: string,
  options?: RequestInit
): Promise<TResponse> {
  const url = `${this.baseUrl}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...this.defaultHeaders,
    ...(options?.headers as Record<string, string> || {})
  };

  const response = await fetch(url, {
    method,
    headers,
    ...options,
    signal: AbortSignal.timeout(this.timeout)
  });

  if (!response.ok) {
    throw new ApiError(response.status, await response.text());
  }

  return response.json() as Promise<TResponse>;
}
```

**Common patterns**:

-   Replace `any` with `unknown` + type guards
-   Use generics for flexible typing
-   Add explicit return types to all functions
-   Use `Record<string, unknown>` for object types
-   Use discriminated unions for complex types

5. **🔵 REFACTOR Phase - Add type utilities**:

```typescript
// libs/shared/web/src/type-guards.ts
/**
 * Type guard utilities for runtime validation
 */
export function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isString(value: unknown): value is string {
    return typeof value === "string";
}

export function isNumber(value: unknown): value is number {
    return typeof value === "number" && !isNaN(value);
}

export function hasProperty<K extends string>(obj: unknown, key: K): obj is Record<K, unknown> {
    return isObject(obj) && key in obj;
}

// Example usage with API responses
export function validateApiResponse<T>(data: unknown, validator: (val: unknown) => val is T): T {
    if (!validator(data)) {
        throw new TypeError("Invalid API response shape");
    }
    return data;
}
```

6. **Add CI type check job** (preview for Cycle C):

```yaml
# .github/workflows/type-check.yml
name: Type Check

on:
    pull_request:
        branches: [main]
    push:
        branches: [main]

jobs:
    typescript:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v4
            - uses: actions/setup-node@v4
              with:
                  node-version: "20"
            - run: corepack enable
            - run: pnpm install
            - run: pnpm tsc --noEmit
```

**Exit Criteria**:

-   [ ] `tsconfig.base.json` has all strict options enabled
-   [ ] ESLint rules ban `any` with error level
-   [ ] All existing `any` violations fixed (or documented exceptions in comments)
-   [ ] `pnpm tsc --noEmit` passes with zero errors
-   [ ] `pnpm nx run-many -t lint` passes with zero `any` violations
-   [ ] Type guard utilities created for runtime validation
-   [ ] **Traceability**: Code references DEV-ADR-029, DEV-SDS-029, DEV-PRD-030

---

### Task 1B: Python mypy Strict Mode Configuration

**What**: Enable mypy strict mode, add type hints to all Python code, achieve ≥95% coverage

**Branch**: `feature/py-strict`

**Implementation Steps**:

1. **🔴 RED Phase - Audit current type coverage**:

```bash
# Run mypy with strict mode to see baseline
uv run mypy --strict . > tmp/mypy-baseline.txt 2>&1 || true

# Expected: Many errors (this is the baseline)
```

2. **Create `mypy.ini`** at repository root:

```ini
[mypy]
# Global strict settings
strict = True
python_version = 3.11

# Strictness flags (explicit for clarity)
warn_unused_configs = True
warn_redundant_casts = True
warn_unused_ignores = True
warn_return_any = True
warn_unreachable = True

# No implicit optionals
no_implicit_optional = True
strict_optional = True

# Generics and Any
disallow_any_generics = True
disallow_subclassing_any = True

# Untyped definitions
disallow_untyped_defs = True
disallow_incomplete_defs = True
disallow_untyped_calls = True
disallow_untyped_decorators = True

# Imports
no_implicit_reexport = True
warn_no_return = True

# Per-module overrides (temporary during migration)
[mypy-tests.*]
# Allow some leniency in tests during migration
disallow_untyped_defs = False
disallow_untyped_calls = False

[mypy-tools.*]
# Tools can be lenient during migration
disallow_untyped_defs = False

# Third-party libraries without stubs
[mypy-pytest.*]
ignore_missing_imports = True

[mypy-shellspec.*]
ignore_missing_imports = True
```

3. **Update `pyproject.toml`** with mypy config:

```toml
[project]
name = "vibes-pro"
version = "0.1.0"
description = "Copier template for hexagonal architecture + DDD"
requires-python = ">=3.11"

[tool.mypy]
python_version = "3.11"
strict = true
warn_redundant_casts = true
warn_unused_configs = true
disallow_any_generics = true
no_implicit_reexport = true

[[tool.mypy.overrides]]
module = "tests.*"
disallow_untyped_defs = false

[tool.ruff]
target-version = "py311"
line-length = 100

[tool.ruff.lint]
select = [
  "E",   # pycodestyle errors
  "W",   # pycodestyle warnings
  "F",   # pyflakes
  "I",   # isort
  "N",   # pep8-naming
  "UP",  # pyupgrade
  "ANN", # flake8-annotations (type hints)
  "B",   # flake8-bugbear
  "A",   # flake8-builtins
]
ignore = [
  "ANN101", # Missing type annotation for self
  "ANN102", # Missing type annotation for cls
]

[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = "test_*.py"
python_classes = "Test*"
python_functions = "test_*"
```

4. **🟢 GREEN Phase - Add type hints systematically**:

**Strategy**: Start with domain layer (pure Python), then application, then infrastructure

```python
# Example: libs/shared/domain/unit_of_work.py
# Before (no types):
from typing import Protocol

class UnitOfWork(Protocol):
    def begin(self): ...
    def commit(self): ...
    def rollback(self): ...

# After (fully typed):
from typing import Protocol, TypeVar, Generic
from collections.abc import Awaitable

T = TypeVar('T')

class UnitOfWork(Protocol):
    """Protocol for transactional boundaries in hexagonal architecture."""

    async def begin(self) -> None:
        """Start a new transaction."""
        ...

    async def commit(self) -> None:
        """Commit the current transaction."""
        ...

    async def rollback(self) -> None:
        """Rollback the current transaction."""
        ...

    def register_new(self, entity: T) -> None:
        """Register a new entity to be persisted."""
        ...

    def register_dirty(self, entity: T) -> None:
        """Register an entity that has been modified."""
        ...

    def register_deleted(self, entity: T) -> None:
        """Register an entity to be deleted."""
        ...
```

**Common patterns**:

-   Use `Protocol` for interfaces (replaces abstract base classes)
-   Use `TypeVar` and `Generic` for flexible typing
-   Use `collections.abc` types (`Awaitable`, `Callable`, `Sequence`)
-   Add docstrings with type information
-   Use `NewType` for domain-specific types

5. **🔵 REFACTOR Phase - Add type aliases and NewTypes**:

```python
# libs/shared/domain/types.py
"""Domain-specific type definitions."""
from typing import NewType
from uuid import UUID

# Strong typing for domain IDs
UserId = NewType('UserId', UUID)
OrderId = NewType('OrderId', UUID)
ProductId = NewType('ProductId', UUID)

# Value objects as types
Email = NewType('Email', str)
PhoneNumber = NewType('PhoneNumber', str)
Money = NewType('Money', int)  # Cents to avoid float issues

# Example usage
def get_user_by_id(user_id: UserId) -> User | None:
    """Fetch user by ID with strong typing."""
    ...
```

6. **Add justfile recipe for type checking**:

```makefile
# justfile
type-check-python:
    @echo "🔍 Running Python type checks..."
    uv run mypy --strict .
    @echo "✅ Python type checks passed"

type-check-all:
    @echo "🔍 Running all type checks..."
    pnpm tsc --noEmit
    uv run mypy --strict .
    @echo "✅ All type checks passed"
```

**Exit Criteria**:

-   [ ] `mypy.ini` configured with strict mode
-   [ ] `pyproject.toml` has mypy configuration
-   [ ] All Python modules have type hints
-   [ ] `uv run mypy --strict .` passes with zero errors
-   [ ] Type coverage ≥95% (verify with `mypy --html-report coverage`)
-   [ ] Domain-specific `NewType` definitions created
-   [ ] **Traceability**: Code references DEV-ADR-029, DEV-SDS-029, DEV-PRD-030

---

## Phase 2: Automation & CI Integration (Cycles C + D) (Sprint 1, Days 2-3)

### Task 2A: Type Sync CI Workflow

**What**: Create GitHub Actions workflow to auto-generate types from Supabase and create PRs on drift

**Branch**: `feature/type-sync-ci`

**Dependencies**: Tasks 1A, 1B complete (strict modes enforced)

**Implementation Steps**:

1. **Create type-sync workflow** at `.github/workflows/type-sync.yml`:

```yaml
name: Type Sync from Supabase

on:
    # Trigger on Supabase migration changes
    push:
        branches: [main]
        paths:
            - "supabase/migrations/**"
            - "docker/docker-compose.supabase.yml"
            - ".github/workflows/type-sync.yml"

    # Manual trigger
    workflow_dispatch:

    # Weekly sync to catch external schema changes
    schedule:
        - cron: "0 2 * * 0" # Sunday 2 AM UTC

jobs:
    type-sync:
        runs-on: ubuntu-latest
        permissions:
            contents: write
            pull-requests: write

        steps:
            - name: Checkout repository
              uses: actions/checkout@v4
              with:
                  fetch-depth: 0

            - name: Setup Node.js
              uses: actions/setup-node@v4
              with:
                  node-version: "20"
                  cache: "pnpm"

            - name: Setup Python
              uses: actions/setup-python@v5
              with:
                  python-version: "3.11"
                  cache: "pip"

            - name: Install dependencies
              run: |
                  corepack enable
                  pnpm install --frozen-lockfile
                  pip install uv
                  uv pip install -r requirements.txt

            - name: Start Supabase dev stack
              run: |
                  pnpm nx supabase-devstack:start
                  # Wait for healthy
                  timeout 300 bash -c 'until curl -f http://localhost:54321/health; do sleep 5; done'
              env:
                  POSTGRES_PASSWORD: ${{ secrets.POSTGRES_PASSWORD }}
                  JWT_SECRET: ${{ secrets.JWT_SECRET }}
                  ANON_KEY: ${{ secrets.ANON_KEY }}
                  SERVICE_ROLE_KEY: ${{ secrets.SERVICE_ROLE_KEY }}

            - name: Generate types from Supabase schema
              run: pnpm nx run type-generator:generate
              env:
                  SUPABASE_URL: http://localhost:54321
                  SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SERVICE_ROLE_KEY }}

            - name: Stop Supabase dev stack
              if: always()
              run: pnpm nx supabase-devstack:stop

            - name: Check for type drift
              id: drift-check
              run: |
                  if git diff --exit-code libs/shared/database-types libs/shared/type_system; then
                    echo "drift=false" >> $GITHUB_OUTPUT
                    echo "✅ No type drift detected"
                  else
                    echo "drift=true" >> $GITHUB_OUTPUT
                    echo "⚠️ Type drift detected"
                    git diff --stat libs/shared/database-types libs/shared/type_system
                  fi

            - name: Validate TypeScript types
              if: steps.drift-check.outputs.drift == 'true'
              run: pnpm tsc --noEmit

            - name: Validate Python types
              if: steps.drift-check.outputs.drift == 'true'
              run: uv run mypy --strict libs/shared/type_system

            - name: Create Pull Request
              if: steps.drift-check.outputs.drift == 'true'
              uses: peter-evans/create-pull-request@v6
              with:
                  token: ${{ secrets.GITHUB_TOKEN }}
                  commit-message: "chore(types): sync types from Supabase schema [skip ci]"
                  title: "🔄 Type Sync: Auto-generated from Supabase schema changes"
                  body: |
                      ## Automated Type Sync

                      This PR was automatically generated by the type-sync workflow.

                      **Changes detected in**:
                      - TypeScript: `libs/shared/database-types`
                      - Python: `libs/shared/type_system`

                      **Triggered by**:
                      - Supabase migration changes
                      - Scheduled weekly sync

                      **Validation**:
                      - ✅ TypeScript: `pnpm tsc --noEmit` passed
                      - ✅ Python: `mypy --strict` passed

                      **Review Checklist**:
                      - [ ] Verify generated types match schema intent
                      - [ ] Check for breaking changes in existing code
                      - [ ] Update dependent code if necessary
                      - [ ] Merge when ready
                  branch: auto/type-sync-${{ github.run_number }}
                  delete-branch: true
                  labels: |
                      type-sync
                      automated
                      dependencies
```

2. **Create type generator target** (if not exists) at `tools/type-generator/project.json`:

```json
{
    "name": "type-generator",
    "targets": {
        "generate": {
            "executor": "nx:run-commands",
            "options": {
                "commands": ["echo '🔄 Generating TypeScript types from Supabase...'", "supabase gen types typescript --local > libs/shared/database-types/src/index.ts", "echo '🔄 Generating Python types from Supabase...'", "python tools/type-generator/generate_python_types.py", "echo '✅ Type generation complete'"],
                "parallel": false,
                "cwd": "."
            }
        },
        "validate": {
            "executor": "nx:run-commands",
            "options": {
                "commands": ["pnpm tsc --noEmit", "uv run mypy --strict libs/shared/type_system"],
                "parallel": false
            }
        }
    }
}
```

3. **Create Python type generator script** at `tools/type-generator/generate_python_types.py`:

```python
#!/usr/bin/env python3
"""Generate Python types from Supabase schema."""
import json
import subprocess
from pathlib import Path
from typing import Any

def generate_python_types() -> None:
    """Generate Python type stubs from Supabase schema."""
    output_dir = Path("libs/shared/type_system/src")
    output_dir.mkdir(parents=True, exist_ok=True)

    # Get schema from Supabase
    result = subprocess.run(
        ["supabase", "db", "dump", "--local", "--data-only=false", "--schema=public"],
        capture_output=True,
        text=True,
        check=True
    )

    schema_sql = result.stdout

    # Parse schema and generate Python types
    # (This is simplified - real implementation would parse SQL properly)
    types_content = '''"""Auto-generated types from Supabase schema.

DO NOT EDIT MANUALLY - Generated by tools/type-generator/generate_python_types.py
"""
from dataclasses import dataclass
from datetime import datetime
from uuid import UUID
from typing import Optional

@dataclass
class User:
    """User table type."""
    id: UUID
    email: str
    created_at: datetime
    updated_at: datetime

# Add more types based on schema...
'''

    output_file = output_dir / "__init__.py"
    output_file.write_text(types_content)

    print(f"✅ Generated Python types at {output_file}")

if __name__ == "__main__":
    generate_python_types()
```

4. **Add justfile recipe**:

```makefile
# justfile
type-sync:
    @echo "🔄 Syncing types from Supabase..."
    pnpm nx supabase-devstack:start
    pnpm nx run type-generator:generate
    pnpm nx supabase-devstack:stop
    just type-check-all
    @echo "✅ Type sync complete"
```

**Exit Criteria**:

-   [ ] Type-sync workflow created and tested
-   [ ] Workflow triggers on Supabase migration changes
-   [ ] Workflow creates PR when type drift detected
-   [ ] Generated types pass TypeScript and Python validation
-   [ ] Manual trigger works: can run workflow via Actions tab
-   [ ] Weekly scheduled sync configured
-   [ ] **Traceability**: Workflow references DEV-PRD-031, DEV-SDS-030

---

### Task 2B: Pre-commit Hooks for Type Validation

**What**: Add Husky pre-commit hooks to validate types locally before commits

**Branch**: `feature/pre-commit-hooks`

**Dependencies**: Tasks 1A, 1B complete

**Implementation Steps**:

1. **Install Husky** (if not already installed):

```bash
pnpm add -D husky
pnpm exec husky init
```

2. **Create pre-commit hook** at `.husky/pre-commit`:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "🔍 Running pre-commit type checks..."

# TypeScript type check
echo "  Checking TypeScript types..."
if ! pnpm tsc --noEmit; then
  echo "❌ TypeScript type check failed"
  exit 1
fi
echo "  ✅ TypeScript types OK"

# Python type check
echo "  Checking Python types..."
if ! uv run mypy --strict .; then
  echo "❌ Python type check failed"
  exit 1
fi
echo "  ✅ Python types OK"

# Check if Supabase schema changed
if git diff --cached --name-only | grep -qE 'supabase/migrations/.*\.sql$'; then
  echo "⚠️  Supabase migration detected - regenerating types..."

  # Start Supabase temporarily
  pnpm nx supabase-devstack:start > /dev/null 2>&1

  # Generate types
  pnpm nx run type-generator:generate

  # Stop Supabase
  pnpm nx supabase-devstack:stop > /dev/null 2>&1

  # Check for type drift
  if ! git diff --quiet libs/shared/database-types libs/shared/type_system; then
    echo ""
    echo "❌ Type drift detected after migration!"
    echo "   The following files have changes:"
    git diff --stat libs/shared/database-types libs/shared/type_system
    echo ""
    echo "   Please review and stage the generated type files:"
    echo "   git add libs/shared/database-types libs/shared/type_system"
    echo ""
    echo "   Or run: just type-sync"
    exit 1
  fi

  echo "  ✅ Types already in sync with schema"
fi

echo "✅ All pre-commit checks passed"
```

3. **Make hook executable**:

```bash
chmod +x .husky/pre-commit
```

4. **Create commit-msg hook** at `.husky/commit-msg` (existing, ensure it doesn't conflict):

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Existing commit message validation
# ... keep existing logic ...

# No additional type checks needed here
```

5. **Add hook bypass instructions** to `docs/CONTRIBUTING.md`:

````markdown
## Pre-commit Hooks

This repository uses Husky to run type checks before commits.

### Normal workflow

```bash
git add .
git commit -m "feat: add feature"
# Hooks run automatically
```
````

### Bypass hooks (emergency only)

```bash
git commit --no-verify -m "fix: hotfix"
```

### If hooks fail

1. Fix type errors shown in output
2. Run `just type-check-all` to verify locally
3. Commit again

### Supabase schema changes

If you modify `supabase/migrations/*.sql`:

1. Hooks will auto-generate types
2. Review generated files
3. Stage them: `git add libs/shared/database-types libs/shared/type_system`
4. Commit again

```

```

6. **Update justfile with hook management**:

```makefile
# justfile
install-hooks:
    @echo "🔧 Installing pre-commit hooks..."
    pnpm exec husky install
    chmod +x .husky/pre-commit
    chmod +x .husky/commit-msg
    @echo "✅ Hooks installed"

skip-hooks:
    @echo "⚠️  Bypassing pre-commit hooks (use sparingly!)"
    git commit --no-verify
```

**Exit Criteria**:

-   [ ] Husky installed and configured
-   [ ] Pre-commit hook validates TypeScript types
-   [ ] Pre-commit hook validates Python types
-   [ ] Hook detects Supabase schema changes and regenerates types
-   [ ] Hook is executable and runs automatically
-   [ ] Documentation explains hook workflow and bypass
-   [ ] **Traceability**: Hooks reference DEV-SDS-030

---

## Phase 3: Validation & Documentation (Sprint 1, Day 3)

### Task 3A: CI Integration Testing

**What**: Verify all type checks pass in CI, test workflow triggers

**Implementation Steps**:

1. **Test type-sync workflow manually**:

```bash
# Trigger workflow via GitHub Actions UI
# Or via gh CLI:
gh workflow run type-sync.yml

# Monitor run:
gh run watch
```

2. **Test pre-commit hooks locally**:

```bash
# Create a commit with type error
echo "const x: string = 123;" >> libs/shared/web/src/test.ts
git add libs/shared/web/src/test.ts
git commit -m "test: type error"

# Expected: Hook blocks commit with clear error message
```

3. **Create integration test** at `tests/integration/type-safety.test.ts`:

```typescript
import { execSync } from "child_process";

describe("Type Safety Integration", () => {
    it("TypeScript strict mode catches any usage", () => {
        // This test should fail to compile if we try to use 'any'
        const example: unknown = { foo: "bar" };

        // Must use type guard, not 'any'
        if (typeof example === "object" && example !== null && "foo" in example) {
            const typed = example as { foo: string };
            expect(typed.foo).toBe("bar");
        }
    });

    it("tsc --noEmit passes with zero errors", () => {
        const output = execSync("pnpm tsc --noEmit", { encoding: "utf-8" });
        expect(output).not.toContain("error TS");
    });

    it("type-generator produces valid types", () => {
        execSync("pnpm nx run type-generator:generate", { stdio: "pipe" });

        // Verify generated files exist
        expect(() => {
            execSync("test -f libs/shared/database-types/src/index.ts");
        }).not.toThrow();

        // Verify they pass type checks
        execSync("pnpm tsc --noEmit");
    }, 60000);
});
```

**Exit Criteria**:

-   [ ] Type-sync workflow runs successfully end-to-end
-   [ ] Pre-commit hooks block type violations
-   [ ] CI integration tests pass
-   [ ] All quality gates GREEN

---

### Task 3B: Documentation & Migration Guide

**What**: Document type safety practices and provide migration guide for existing code

**Implementation Steps**:

1. **Create type safety guide** at `docs/TYPE_SAFETY.md`:

````markdown
# Type Safety Guide

VibesPro enforces strict type safety across TypeScript and Python.

## TypeScript

### Configuration

-   `strict: true` in `tsconfig.base.json`
-   ESLint bans `any` usage
-   All functions must have explicit return types

### Best Practices

**Use `unknown` instead of `any`**:

```typescript
// ❌ Bad
function parse(data: any): any {
    return JSON.parse(data);
}

// ✅ Good
function parse<T>(data: string): T {
    return JSON.parse(data) as T;
}

// ✅ Better with validation
function parseWithGuard<T>(data: string, validator: (val: unknown) => val is T): T {
    const parsed: unknown = JSON.parse(data);
    if (!validator(parsed)) {
        throw new TypeError("Invalid data shape");
    }
    return parsed;
}
```
````

**Use type guards for runtime validation**:

```typescript
function isUser(val: unknown): val is User {
    return typeof val === "object" && val !== null && "id" in val && "email" in val;
}
```

## Python

### Configuration

-   `mypy --strict` enabled
-   All public APIs must be typed
-   Use `Protocol` for interfaces

### Best Practices

**Type all function signatures**:

```python
# ❌ Bad
def process_data(data):
    return data.strip()

# ✅ Good
def process_data(data: str) -> str:
    return data.strip()
```

**Use NewType for domain types**:

```python
from typing import NewType
from uuid import UUID

UserId = NewType('UserId', UUID)

def get_user(user_id: UserId) -> User:
    ...
```

## Type Sync Workflow

Types are auto-generated from Supabase schema.

### Automatic (CI)

-   Workflow runs on Supabase migration changes
-   Creates PR with updated types
-   Review and merge PR

### Manual (Local)

```bash
just type-sync
```

## Troubleshooting

### "Type 'any' is not allowed"

Use `unknown` with type guards or generics.

### "Cannot find module types"

Run `pnpm install` to regenerate types.

### "mypy error: incompatible type"

Add explicit type annotations.

```

```

2. **Create migration guide** at `docs/MIGRATION_TYPE_SAFETY.md`:

````markdown
# Type Safety Migration Guide

Guide for adding strict types to existing code.

## TypeScript Migration

### Step 1: Fix ESLint violations

```bash
pnpm nx run-many -t lint --fix
```
````

### Step 2: Fix TypeScript errors

```bash
pnpm tsc --noEmit
# Fix errors one by one
```

### Step 3: Common fixes

**Replace `any` with generics**:

```typescript
// Before
function map(arr: any[], fn: any): any[] {
    return arr.map(fn);
}

// After
function map<T, U>(arr: T[], fn: (item: T) => U): U[] {
    return arr.map(fn);
}
```

## Python Migration

### Step 1: Add type hints incrementally

Start with public APIs, then internal functions.

### Step 2: Run mypy

```bash
uv run mypy --strict .
```

### Step 3: Fix errors systematically

Work module by module, starting with domain layer.

```

```

3. **Update traceability matrix** at `docs/traceability_matrix.md`:

```markdown
| Spec ID     | Implementation               | Tests                              | Status |
| ----------- | ---------------------------- | ---------------------------------- | ------ |
| DEV-ADR-029 | tsconfig.base.json (strict)  | tests/integration/type-safety.test | ✅     |
| DEV-PRD-030 | .github/workflows/type-check | CI runs on all PRs                 | ✅     |
| DEV-PRD-031 | .github/workflows/type-sync  | Auto-creates PRs on drift          | ✅     |
| DEV-SDS-029 | .eslintrc.json, mypy.ini     | pnpm lint, mypy --strict           | ✅     |
| DEV-SDS-030 | .husky/pre-commit            | Manual testing                     | ✅     |
```

**Exit Criteria**:

-   [ ] Type safety guide documents best practices
-   [ ] Migration guide helps with existing code
-   [ ] Traceability matrix updated
-   [ ] All documentation reviewed and accurate

---

## Pre-Work: Required Reading (25 min)

**Priority Order** (read in this sequence):

1. `docs/dev_adr.md` (section DEV-ADR-029) — 5 min: Strict typing decision
2. `docs/dev_sds.md` (sections DEV-SDS-029, DEV-SDS-030) — 10 min: Configuration design
3. `docs/dev_prd.md` (sections DEV-PRD-030, DEV-PRD-031) — 5 min: Type check requirements
4. `.github/instructions/style.frontend.instructions.md` — 3 min: TypeScript style
5. `.github/instructions/style.python.instructions.md` — 2 min: Python style
6. Skim: `docs/ARCHITECTURE.md` — Context on type flow through layers

**Context Check**: After reading, you should understand:

-   Why strict typing matters (catch errors at compile time)
-   TypeScript strict mode options
-   Python mypy strict configuration
-   Type sync workflow (Supabase → generated types)
-   Pre-commit hook purpose (fast feedback)

---

## Execution Protocol

### Decision-Making Authority

You are **authorized** to:

-   Choose type guard patterns and utilities
-   Add type aliases for common patterns
-   Create domain-specific NewTypes in Python
-   Add temporary `@ts-expect-error` with justification comments
-   Configure mypy overrides for test files

You **must ask** before:

-   Disabling strict mode for any module
-   Adding `any` types (must use `unknown` instead)
-   Changing core TypeScript/Python configuration
-   Modifying CI workflow triggers
-   Bypassing type checks in production code

### Quality Gates

Run after **each task** completion:

```bash
# Task 1A (TypeScript)
pnpm tsc --noEmit                            # Must pass - zero errors
pnpm nx run-many -t lint                     # Must pass - zero any violations

# Task 1B (Python)
uv run mypy --strict .                       # Must pass - zero errors
uv run mypy --html-report coverage           # Coverage ≥95%

# Task 2A (Type Sync)
gh workflow run type-sync.yml                # Must succeed
gh run watch                                 # Monitor completion

# Task 2B (Hooks)
git commit -m "test"                         # Must run hooks
# Intentional type error should be caught

# Integration
pnpm test:integration --testPathPatterns=type-safety  # Must pass
```

**After all tasks complete**:

```bash
pnpm tsc --noEmit                            # Must pass
uv run mypy --strict .                       # Must pass
pnpm nx run-many -t build,test,lint --all    # Must pass
just spec-guard                              # Must pass
```

### Iteration Protocol

If any check fails:

1. Analyze error messages (TypeScript/mypy are usually clear)
2. Fix type violations (don't add `any` or `type: ignore`)
3. Re-run quality gates
4. Continue until all pass

**Do not proceed to next task with type violations.**

---

## Output Format

After completing each task, provide:

```markdown
## [Task ID] Status: [COMPLETE|BLOCKED]

### Changes Made

-   Created: [list of new files]
-   Modified: [list of changed files]
-   Type violations fixed: [count]

### Verification Results

-   [ ] TypeScript: `pnpm tsc --noEmit` (0 errors)
-   [ ] Python: `uv run mypy --strict` (0 errors)
-   [ ] Lint: `pnpm nx run-many -t lint` (0 violations)
-   [ ] Type coverage: [percentage]%

### Configuration

-   [ ] tsconfig.base.json: strict mode enabled
-   [ ] mypy.ini: strict mode enabled
-   [ ] ESLint: any banned
-   [ ] CI: workflows configured

### Traceability

-   Spec IDs: [DEV-ADR-XXX, DEV-SDS-XXX, DEV-PRD-XXX]
-   Commit: [example message]

### Blockers (if any)

[Description + solution]

### Next Steps

[Next task]
```

---

## Anti-Patterns to Avoid

❌ **Don't**: Add `any` types to "fix" errors quickly
✅ **Do**: Use `unknown` with type guards or proper generics

❌ **Don't**: Use `@ts-ignore` or `type: ignore` without explanation
✅ **Do**: Add detailed comment explaining why it's necessary (rare)

❌ **Don't**: Disable strict mode for entire modules
✅ **Do**: Fix violations systematically, module by module

❌ **Don't**: Skip type annotations in Python ("it's obvious")
✅ **Do**: Annotate all public APIs and complex functions

❌ **Don't**: Bypass pre-commit hooks regularly
✅ **Do**: Fix issues locally, use `--no-verify` only for emergencies

❌ **Don't**: Merge type-sync PRs without review
✅ **Do**: Review generated types for breaking changes

❌ **Don't**: Use type assertions without validation
✅ **Do**: Validate at runtime with type guards or Zod schemas

---

## Codebase Intelligence Sources

**Essential Files**:

-   `docs/dev_adr.md` — ADR-029 (strict typing)
-   `docs/dev_sds.md` — SDS-029, SDS-030 (configuration)
-   `docs/dev_prd.md` — PRD-030, PRD-031 (requirements)
-   `.github/instructions/style.frontend.instructions.md` — TypeScript style
-   `.github/instructions/style.python.instructions.md` — Python style

**Reference Implementations**:

-   Study existing `libs/shared/web` for type patterns
-   Review `libs/shared/domain` for Protocol usage
-   Check `.github/workflows/` for CI patterns

**API/Library Documentation**:

-   TypeScript Handbook: https://www.typescriptlang.org/docs/handbook/
-   mypy Documentation: https://mypy.readthedocs.io/
-   Supabase Type Generation: https://supabase.com/docs/guides/api/generating-types
-   Husky: https://typicode.github.io/husky/

**Related Prior Work**:

-   PHASE-002: UoW/EventBus type patterns
-   PHASE-003: ApiClient type patterns

---

## Special Considerations

### Performance

-   Type checking adds CI time—parallelize checks when possible
-   Incremental type checking (TypeScript's `--incremental` flag)
-   Cache mypy results in CI

### Security

-   Type safety prevents many injection attacks (validated inputs)
-   Never bypass types for user input validation
-   Type guards must validate structure, not just cast

### Compatibility

-   TypeScript 5.x required for latest strict features
-   Python 3.11+ for better type inference
-   Supabase CLI must support type generation

### Migration Strategy

-   Fix domain layer first (pure types, no framework deps)
-   Then application layer (use cases)
-   Then infrastructure last (external deps may need ignores)
-   Tests can be more lenient during migration

### Observability

-   Track type coverage metrics over time
-   Log type-sync workflow runs
-   Alert on type drift that persists >1 week

---

## Begin Execution

Start with **Pre-Work reading**, then proceed to **Phase 1, Task 1A** (TypeScript Strict Mode).

**Workflow**:

1. Read all pre-work docs (25 min)
2. Create branch `feature/ts-strict`
3. Enable strict mode, fix all violations
4. Run quality gates
5. Create branch `feature/py-strict` (parallel with Task 1A)
6. Enable mypy strict, add type hints
7. Run quality gates
8. Create branch `feature/type-sync-ci`
9. Implement workflow
10. Test workflow end-to-end
11. Create branch `feature/pre-commit-hooks`
12. Add hooks, test locally
13. Document and update traceability
14. Update `docs/plans/hexddd_integration/PHASE-004-TYPE_SAFETY_CI.md` status to GREEN
15. Update `docs/traceability_matrix.md`

Report status after completing each task using the output format above.

---

**Traceability Matrix Update Required**: After phase completion, add entries:

-   DEV-ADR-029 → `tsconfig.base.json`, `mypy.ini`
-   DEV-SDS-029 → `.eslintrc.json`, `pyproject.toml`
-   DEV-SDS-030 → `.husky/pre-commit`, `.github/workflows/type-sync.yml`
-   DEV-PRD-030 → CI type check jobs
-   DEV-PRD-031 → Type-sync workflow
