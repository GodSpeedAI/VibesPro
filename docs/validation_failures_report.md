# Validation Failures Report

## Summary

The `ai-validate` command is failing primarily due to test failures in the `ai-context-tools` project, which seems to be acting as a catch-all test runner for the workspace.

- **Failing Command**: `nx run ai-context-tools:test`
- **Impact**: 35 failed test files, 130 failed tests.
- **Primary Error**: `ReferenceError: jest is not defined`

## Analysis

### 1. Misconfigured Scope

The `ai-context-tools` project (defined in `tools/ai/project.json`) has a `vitest.config.ts` that includes test files from the entire workspace:

```typescript
// tools/ai/vitest.config.ts
export default defineConfig({
    test: {
        // ...
        include: [
            "tests/**/*.{test,spec}.ts",
            "generators/**/*.{test,spec}.ts",
            "tools/**/*.{test,spec}.ts",
            "libs/**/*.{test,spec}.ts", // <--- Problem: Includes everything
        ],
        // ...
    },
});
```

This causes `ai-context-tools` to run tests for projects that are not part of it (e.g., `libs/shared/web`). These projects may be designed for Jest, not Vitest, or rely on Jest globals that are not present in this Vitest environment.

### 2. Jest vs Vitest Incompatibility

The tests in `libs/shared/web` (e.g., `api-client.spec.ts`) explicitly use `jest.fn()`, `jest.mock()`, etc.

```typescript
// libs/shared/web/src/lib/__tests__/api-client.spec.ts
afterEach(() => {
    jest.restoreAllMocks(); // Fails here
});
```

The `ai-context-tools` test runner is Vitest ("command": "vitest run..."). While Vitest has a compatible API, it requires `vi` instead of `jest` unless `globals: true` is set _and_ the `jest` object is shimmed or the code is migrated to use `vi`. Although `globals: true` is set in `vitest.config.ts`, `jest` is not automatically aliased to `vi`.

## Recommended Plan

1.  **Correct the Scope**: Modify `tools/ai/vitest.config.ts` to only include tests relevant to `ai-context-tools` (likely `tools/ai/src/**/*.spec.ts` if that matches, or `tests/integration/ai-workflows.test.ts`? Need to verify what `ai-context-tools` is supposed to test).
    - _Correction_: `ai-context-tools` seems to be a tooling library. It should probably not be running `libs/` tests.
2.  **Migrate or Shim Jest**: If we _must_ run these tests with dependencies on `jest`, we should either:
    - Migrate the code to use `vi` instead of `jest`.
    - Or, in `vitest.setup.ts`, aliasing `globalThis.jest = vi`.

## Proposed Fix

Given the `ai-context-tools` name, it should likely restrict its test scope. I will start by restricting the scope in `tools/ai/vitest.config.ts` to exclude `libs/` unless that is intentional (it seems unintentional for a "tool" to run all "lib" tests).

## Additional Findings (Tools/AI)

After fixing the scope, `ai-context-tools` failures persisted in its own unit tests (`context-manager.test.ts` and `temporal-ai-client.spec.ts`) with `TypeError: AIContextManager is not a constructor`.

### Investigation

1.  The module `tools/ai/src/context-manager.ts` loads correctly, but named exports (`AIContextManager`) resolve to `undefined` in tests.
2.  This project uses `"type": "module"` and `tsconfig` references `NodeNext`.
3.  Tests rely on a `__vite_ssr_exportName__` polyfill in `tests/setup/vitest.setup.ts`. Removing this polyfill causes `ReferenceError: __vite_ssr_exportName__ is not defined`.
4.  Even with the polyfill, exports remain undefined, suggesting a mismatch between how Vitest transforms the code (expecting `__vite_ssr_exportName__` to define exports) and how the polyfill or environment captures them.

### Recommendation

The `tools/ai` project configuration (NodeNext + Vitest) seems unstable.

- **Short term**: Exclude `tools/ai` from `ai-validate` or mark these tests as known failures.
- **Long term**: Reconfigure `tools/ai` to use standard `ESNext` modules for testing, or fix the `__vite_ssr_exportName__` shim to correctly populate module exports in this environment.

For now, the critical fix was scoping `vitest.config.ts` to prevent it from running unrelated `libs/` tests (which caused 130+ failures).
