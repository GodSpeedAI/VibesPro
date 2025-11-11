# Task: Restore ESLint Strict Mode and Fix All Type Safety Issues

## Objective

Fix all ESLint violations in the `tools/` and `tests/` directories, then restore strict ESLint checking in the CI pipeline. This task requires iterative fixing with periodic validation until all checks pass with `--max-warnings 0`.

## Context

### Repository: VibesPro

**Type**: Copier template repository that generates production-ready Nx monorepos
**Architecture**: Hexagonal (DDD) with strict separation of concerns
**Key Principle**: Generator-first development - always use Nx generators before writing code

### Current State

ESLint strict mode was temporarily disabled in `.github/workflows/type-safety.yml` due to **123 violations** (91 errors, 32 warnings) across the codebase. The CI workflow currently runs:

```yaml
- name: Run ESLint with Type Checking
  run: pnpm exec eslint tools tests --ext .ts || true # Non-blocking
```

**Your goal**: Fix all violations and change this to:

```yaml
- name: Run ESLint with Type Checking
  run: pnpm exec eslint tools tests --ext .ts --max-warnings 0
```

### ESLint Issue Breakdown

Based on analysis, the violations are:

| Rule                                               | Count | Description                                                         |
| -------------------------------------------------- | ----- | ------------------------------------------------------------------- |
| Parsing errors                                     | 50    | TypeScript parsing issues (likely from tsconfig project references) |
| `@typescript-eslint/prefer-nullish-coalescing`     | 29    | Using `\|\|` instead of `??`                                        |
| `@typescript-eslint/no-explicit-any`               | 15    | Using `any` type                                                    |
| `@typescript-eslint/no-require-imports`            | 11    | Using CommonJS `require()` in TS files                              |
| `@typescript-eslint/no-unused-vars`                | 9     | Unused variables                                                    |
| `@typescript-eslint/explicit-function-return-type` | 6     | Missing return types                                                |
| `@typescript-eslint/no-non-null-assertion`         | 3     | Using `!` non-null assertions                                       |

### Files in Scope

-   `tools/**/*.ts` - CLI tools, generators, AI utilities, docs generators
-   `tests/**/*.ts` - Unit, integration, and CI tests

**Excludes** (per tsconfig.json):

-   `node_modules/`, `dist/`, `coverage/`, `tmp/`, `.nx/`
-   `templates/**` (Jinja2 templates)
-   `tools/reference/**/*` (legacy reference code)

## Environment & Tooling

### Tech Stack

-   **Runtime**: Node.js 20+ (managed by `mise`)
-   **Package Manager**: pnpm (via Corepack)
-   **Monorepo**: Nx 22.0.2
-   **TypeScript**: 5.5.4 with strict mode enabled
-   **ESLint**: 9.38.0 (flat config)
-   **Python**: 3.11 (for some tools, managed by `mise`)

### Environment Layers

```
Devbox (OS packages) → mise (runtimes) → SOPS (secrets) → Just (tasks) → pnpm/uv
```

### Key Commands

```bash
# Setup (if needed)
just setup                    # Install all dependencies

# Validation during iteration
pnpm exec eslint tools tests --ext .ts --max-warnings 0  # Must pass
pnpm exec tsc --noEmit       # TypeScript check (must pass)
just ai-validate             # Full validation suite

# Testing
pnpm test                    # Run all tests
pnpm exec nx run-many --target=test --all

# Pre-commit hooks
git commit                   # Runs prettier, ruff, shellcheck, etc.
```

### Configuration Files

-   **ESLint**: `eslint.config.cjs` (flat config, uses TypeScript plugin)
-   **TypeScript**: `tsconfig.json` (strict mode enabled)
-   **Package Manager**: `package.json` (scripts defined)

## ESLint Configuration (eslint.config.cjs)

Current config enforces:

```javascript
rules: {
  '@typescript-eslint/no-explicit-any': 'error',  // Ban 'any' completely
  '@typescript-eslint/explicit-function-return-type': 'warn',
  '@typescript-eslint/prefer-nullish-coalescing': 'warn',
  '@typescript-eslint/no-unused-vars': 'error',
  '@typescript-eslint/no-require-imports': 'error',
  // ... more rules
}
```

Parser configured with project references:

```javascript
parserOptions: {
  project: ['./tsconfig.json'],
  tsconfigRootDir: __dirname,
}
```

## TypeScript Configuration (tsconfig.json)

Strict mode enabled:

```json
{
    "compilerOptions": {
        "strict": true,
        "noUncheckedIndexedAccess": true,
        "noImplicitReturns": true,
        "noFallthroughCasesInSwitch": true,
        "noUnusedLocals": true,
        "noUnusedParameters": true,
        "noImplicitOverride": true,
        "jsx": "react-jsx"
    }
}
```

## Iterative Workflow

### Phase 1: Setup & Analysis (5 min)

1. **Verify environment**:

    ```bash
    node --version  # Should be 20+
    pnpm --version
    pnpm exec nx --version  # Should be 22.0.2
    ```

2. **Run initial check** to get current state:

    ```bash
    pnpm exec eslint tools tests --ext .ts --format json > eslint-report.json
    pnpm exec eslint tools tests --ext .ts | tee eslint-output.txt
    ```

3. **Analyze output**:
    - Count total issues
    - Group by file
    - Prioritize by fix difficulty

### Phase 2: Fix Violations (Iterative)

**Strategy**: Fix in order of ease and impact

#### 2.1 Low-Hanging Fruit (~30 min)

**a) Replace `||` with `??` (29 violations)**

Pattern:

```typescript
// ❌ Before
const value = config.setting || "default";

// ✅ After
const value = config.setting ?? "default";
```

**b) Remove unused variables (9 violations)**

-   Delete truly unused ones
-   Prefix with `_` if required by function signature: `_unusedParam`

**c) Fix require imports (11 violations)**

Pattern:

```typescript
// ❌ Before
const module = require("./module");

// ✅ After
import module from "./module";
// or for CommonJS modules
import * as module from "./module";
```

#### 2.2 Add Type Annotations (~45 min)

**a) Function return types (6 violations)**

Pattern:

```typescript
// ❌ Before
function processData(input: string) {
    return input.toLowerCase();
}

// ✅ After
function processData(input: string): string {
    return input.toLowerCase();
}
```

**b) Replace `any` with proper types (15 violations)**

Common patterns:

```typescript
// ❌ Using any
function handle(data: any) { ... }

// ✅ Option 1: Generic type parameter
function handle<T>(data: T): T { ... }

// ✅ Option 2: Specific interface
interface DataPayload {
  id: string;
  value: number;
}
function handle(data: DataPayload) { ... }

// ✅ Option 3: Use unknown for truly dynamic data
function handle(data: unknown) {
  if (typeof data === 'object' && data !== null) {
    // Type guard
  }
}
```

**c) Remove non-null assertions (3 violations)**

Pattern:

```typescript
// ❌ Before
const value = obj.property!;

// ✅ After - Add null check
const value = obj.property ?? defaultValue;
// or
if (obj.property === undefined) {
    throw new Error("Property is required");
}
const value = obj.property;
```

#### 2.3 Fix Parsing Errors (50 violations) (~1-2 hours)

These may be caused by:

1. **Invalid tsconfig project references** - Check `eslint.config.cjs` parserOptions
2. **Missing type definitions** - Install `@types/*` packages if needed
3. **Syntax errors** - Run `pnpm exec tsc --noEmit` to identify

**Debugging approach**:

```bash
# Check which files have parsing errors
pnpm exec eslint tools tests --ext .ts --format json | \
  jq '.[] | select(.messages[].fatal == true) | .filePath'

# Test TypeScript compilation
pnpm exec tsc --noEmit --project tsconfig.json
```

**Common fixes**:

-   Update imports/exports to use ESM syntax
-   Ensure all referenced types are imported
-   Check for circular dependencies

### Phase 3: Validation Loop (Continuous)

**Run after each batch of fixes** (~20-50 files):

```bash
# 1. Check ESLint progress
pnpm exec eslint tools tests --ext .ts 2>&1 | tail -3
# Look for: "✖ X problems (Y errors, Z warnings)"

# 2. Verify TypeScript still compiles
pnpm exec tsc --noEmit || echo "❌ TypeScript errors introduced!"

# 3. Run tests to ensure no regressions
pnpm test || echo "⚠️  Tests failing - review changes"

# 4. Format code
pnpm exec prettier --write "tools/**/*.ts" "tests/**/*.ts"
```

**Checkpoint**: If errors increase or tests fail, revert last batch:

```bash
git diff HEAD tools/ tests/ > last-changes.patch
git checkout -- tools/ tests/
# Review patch, fix issue, reapply carefully
```

### Phase 4: Final Validation & CI Update (~15 min)

1. **Full ESLint check with strict mode**:

    ```bash
    pnpm exec eslint tools tests --ext .ts --max-warnings 0
    ```

    Expected output: **No problems found ✅**

2. **Run full test suite**:

    ```bash
    pnpm test
    pnpm exec nx run-many --target=test --all
    ```

3. **Run full validation**:

    ```bash
    just ai-validate
    ```

4. **Update CI workflow**:

    Edit `.github/workflows/type-safety.yml`:

    ```yaml
    - name: Run ESLint with Type Checking
      run: pnpm exec eslint tools tests --ext .ts --max-warnings 0
    ```

5. **Commit changes**:

    ```bash
    git add tools/ tests/ .github/workflows/type-safety.yml
    git commit -m "fix(eslint): restore strict mode and fix all type safety violations

    - Replace || with ?? for nullish coalescing (29 fixes)
    - Remove explicit any types and add proper type annotations (15 fixes)
    - Convert require() to import statements (11 fixes)
    - Remove unused variables (9 fixes)
    - Add explicit function return types (6 fixes)
    - Remove non-null assertions with proper null checks (3 fixes)
    - Fix TypeScript parsing errors (50 fixes)
    - Restore --max-warnings 0 in type-safety.yml CI workflow

    All ESLint violations in tools/ and tests/ directories are now resolved.
    Type safety CI will now fail on any new warnings or errors."
    ```

## Success Criteria

-   [ ] `pnpm exec eslint tools tests --ext .ts --max-warnings 0` exits with code 0
-   [ ] `pnpm exec tsc --noEmit` passes (no TypeScript errors)
-   [ ] `pnpm test` passes (all tests green)
-   [ ] `just ai-validate` passes
-   [ ] `.github/workflows/type-safety.yml` updated with strict ESLint check
-   [ ] Changes committed with descriptive message and spec ID if applicable
-   [ ] CI passes on push (verify GitHub Actions)

## Common Pitfalls & Solutions

### Issue: "Parsing error: Cannot read file 'tsconfig.json'"

**Solution**: ESLint can't find TypeScript config

```bash
# Check tsconfig.json exists and is valid
pnpm exec tsc --showConfig

# Verify ESLint parserOptions in eslint.config.cjs
```

### Issue: Tests fail after fixing types

**Solution**: Type changes may expose bugs

```bash
# Run tests for specific file
pnpm exec jest tools/ai/src/context-manager.test.ts

# Review test expectations - may need updating
```

### Issue: Too many files to fix manually

**Solution**: Use automated fixers where safe

```bash
# Auto-fix safe rules (prefer-nullish-coalescing, etc.)
pnpm exec eslint tools tests --ext .ts --fix

# Review auto-fixes before committing
git diff tools/ tests/
```

### Issue: Circular dependencies breaking builds

**Solution**: Refactor to break cycles

```typescript
// Extract shared types to separate file
// types/shared.ts
export interface SharedType { ... }

// file1.ts imports from types/shared.ts
// file2.ts imports from types/shared.ts
```

## Architecture Guidelines

### Hexagonal Architecture (Critical)

When fixing types, **respect dependency flow**:

```
infrastructure → application → domain
```

**Rules**:

-   Domain layer: NO external dependencies (DB, HTTP, frameworks)
-   Application layer: Coordinates through ports (interfaces)
-   Infrastructure: Implements ports

Example:

```typescript
// ❌ WRONG: Domain depends on infrastructure
class User {
    async save() {
        await db.users.insert(this); // NO!
    }
}

// ✅ CORRECT: Application coordinates through ports
interface UserRepository {
    save(user: User): Promise<void>;
}

class CreateUserUseCase {
    constructor(private userRepo: UserRepository) {}

    async execute(dto: CreateUserDto): Promise<void> {
        const user = User.create(dto); // Pure domain logic
        await this.userRepo.save(user); // Through port
    }
}
```

## Additional Resources

-   **Repo instructions**: `.github/copilot-instructions.md` (full AI agent guidance)
-   **Environment setup**: `docs/ENVIRONMENT.md`
-   **Testing guide**: `.github/instructions/testing.instructions.md`
-   **ESLint docs**: https://eslint.org/docs/latest/
-   **TypeScript handbook**: https://www.typescriptlang.org/docs/handbook/

## Estimated Time

-   **Setup & Analysis**: 5 minutes
-   **Low-hanging fruit**: 30 minutes
-   **Type annotations**: 45 minutes
-   **Parsing errors**: 1-2 hours
-   **Validation & CI update**: 15 minutes

**Total**: ~2.5-3.5 hours (assuming focused, uninterrupted work)

## Tips for Autonomous Agents

1. **Work in small batches**: Fix 5-10 files, validate, commit
2. **Use git frequently**: Create checkpoints to roll back if needed
3. **Test incrementally**: Don't fix everything then test - test as you go
4. **Read error messages carefully**: ESLint errors include fix suggestions
5. **Check related files**: Fixing one file may break imports in another
6. **Use TypeScript compiler as guide**: `tsc --noEmit` catches issues ESLint might miss
7. **Respect pre-commit hooks**: They'll auto-format and may catch issues

## Final Notes

This task is **specification-driven** - refer to specs when needed:

-   `docs/dev_prd.md` - Product requirements
-   `docs/dev_sds.md` - Software design specs
-   `docs/dev_technical-specifications.md` - Technical details

Use **generator-first approach**: Before writing new code, check for Nx generators:

```bash
pnpm exec nx list              # See all available generators
just ai-scaffold name=<gen>    # Use generator to scaffold
```

**Security**: Never commit secrets. Use env vars and `.secrets.env.sops` for sensitive data.

Good luck! 🚀
