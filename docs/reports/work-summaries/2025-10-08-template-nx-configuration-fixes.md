# Template Nx Configuration Fixes

**Date**: 2025-10-08
**Author**: AI Assistant
**Type**: Template Enhancement
**Status**: In Progress

## Summary

Incorporating fixes from the SEA project generation to prevent Nx and TypeScript configuration issues in future generated projects. This addresses critical missing configuration files and dependency issues discovered during project generation.

## Issues Identified from SEA Project

### Critical Configuration Missing

1. **nx.json.j2**: Missing `namedInputs` section

    - Causes: Nx daemon crashes with "invalid fileset" errors
    - Impact: Build, test, and lint commands fail completely

2. **libs/core/project.json**: Missing entirely

    - Causes: Nx cannot detect the core library as a project
    - Impact: Project not recognized in Nx graph, no task execution

3. **TypeScript Configurations**: Missing lib and spec configs

    - `libs/core/tsconfig.json` - missing
    - `libs/core/tsconfig.lib.json` - missing
    - `libs/core/tsconfig.spec.json` - missing
    - Causes: Module resolution conflicts, no test compilation setup

4. **libs/core/index.ts**: Missing library entry point

    - Causes: Path mappings have no target file
    - Impact: Imports fail

5. **pnpm-workspace.yaml**: Missing

    - Causes: pnpm warnings about workspace configuration
    - Impact: Suboptimal monorepo setup

6. **ESLint Configuration**: Missing

    - Root `.eslintrc.json` - missing
    - `libs/core/.eslintrc.json` - missing
    - Packages: @nx/eslint, eslint, @typescript-eslint/\* - missing

7. **Jest Configuration**: Missing

    - Root `jest.config.js` - missing
    - Root `jest.preset.js` - missing
    - `libs/core/jest.config.ts` - missing
    - Packages: @nx/jest, jest, ts-jest, @types/jest - missing

8. **Dependencies**: Missing critical packages

    - `tslib` - required by `importHelpers: true`
    - ESLint packages
    - Jest packages

9. **Module Resolution Conflict**
    - tsconfig.base.json uses `moduleResolution: "bundler"`
    - But projects may need `moduleResolution: "node"` for CommonJS
    - Causes: TypeScript compilation errors

## Fixes to Implement

### 1. Fix nx.json.j2 - Add namedInputs

```json
{
    "version": 2,
    "npmScope": "{{ project_slug }}",
    "namedInputs": {
        "default": ["{projectRoot}/**/*", "sharedGlobals"],
        "production": ["default", "!{projectRoot}/**/?(*.)+(spec|test).[jt]s?(x)?(.snap)", "!{projectRoot}/tsconfig.spec.json", "!{projectRoot}/jest.config.[jt]s", "!{projectRoot}/.eslintrc.json"],
        "sharedGlobals": ["{workspaceRoot}/babel.config.json"]
    },
    "affected": {
        "defaultBase": "origin/main"
    },
    "cli": {
        "packageManager": "pnpm"
    },
    "generators": {
        "@nx/js:lib": {
            "buildable": true
        }
    },
    "targetDefaults": {
        "build": {
            "dependsOn": ["^build"],
            "inputs": ["production", "^production"]
        },
        "test": {
            "inputs": ["default", "^production", "{workspaceRoot}/jest.preset.js"]
        },
        "lint": {
            "inputs": ["default", "^production", "{workspaceRoot}/.eslintrc.json"]
        }
    }
}
```

### 2. Create libs/core/project.json.j2

New file with Nx project configuration for the core library.

### 3. Create TypeScript Configuration Files

-   `libs/core/tsconfig.json.j2` - Base config
-   `libs/core/tsconfig.lib.json.j2` - Library compilation (with `moduleResolution: "node"`)
-   `libs/core/tsconfig.spec.json.j2` - Test compilation
-   `libs/core/index.ts` - Library entry point

### 4. Create pnpm-workspace.yaml.j2

Simple workspace configuration for pnpm.

### 5. Create ESLint Configurations

-   `.eslintrc.json.j2` - Root ESLint config
-   `libs/core/.eslintrc.json.j2` - Project ESLint config

### 6. Create Jest Configurations

-   `jest.config.js.j2` - Root Jest config
-   `jest.preset.js.j2` - Jest preset
-   `libs/core/jest.config.ts.j2` - Project Jest config

### 7. Update package.json.j2 Dependencies

Add missing packages:

```json
{
    "devDependencies": {
        "@nx/eslint": "21.6.4",
        "@nx/eslint-plugin": "21.6.4",
        "@nx/jest": "21.6.4",
        "@nx/js": "21.6.4",
        "@nx/node": "21.6.4",
        "@nx/workspace": "21.6.4",
        "@types/jest": "30.0.0",
        "@types/node": "^20.0.0",
        "@typescript-eslint/eslint-plugin": "8.46.0",
        "@typescript-eslint/parser": "8.46.0",
        "eslint": "9.37.0",
        "jest": "30.2.0",
        "nx": "21.6.4",
        "ts-jest": "29.4.4",
        "tslib": "2.8.1",
        "typescript": "^5.0.0"
    }
}
```

### 8. Update tsconfig.base.json.j2

Add path mapping:

```json
{
    "paths": {
        "@{{ project_slug }}/core": ["libs/core/index.ts"]
    }
}
```

### 9. Create Sample Test File

`libs/core/domain/sample-entity.spec.ts` - Demonstrates working test setup

## Implementation Plan

1. ✅ Document issues and fixes (this file)
2. ✅ Update nx.json.j2 with namedInputs
3. ✅ Create libs/core/project.json.j2
4. ✅ Create TypeScript configuration files
5. ✅ Create pnpm-workspace.yaml.j2
6. ✅ Create ESLint configurations
7. ✅ Create Jest configurations
8. ✅ Update package.json.j2 dependencies
9. ✅ Update tsconfig.base.json.j2 paths
10. ✅ Create sample test file
11. ✅ Create apps/ directory placeholder
12. ⏳ Test generation with fixed template
13. ⏳ Commit changes

## Testing Strategy

After implementing fixes:

1. Generate a new test project: `copier copy . /tmp/test-fix`
2. Verify Nx detects projects: `cd /tmp/test-fix && npx nx show projects`
3. Run all targets: `npx nx run-many --target=build,lint,test --all`
4. Verify no errors: All targets should pass

## Expected Outcomes

✅ Generated projects will have:

-   Working Nx project detection
-   Functional build, lint, and test targets
-   Proper TypeScript compilation
-   ESLint code quality checks
-   Jest unit testing framework
-   No daemon crashes
-   No missing dependency errors
-   No module resolution conflicts

## References

-   SEA Project Fix Summary: `/home/sprime01/projects/SEA/docs/work-summaries/2025-10-08-nx-configuration-fix.md`
-   Nx Documentation: https://nx.dev
-   Project Standards: `.github/instructions/`

## Compliance

-   ✅ Follows generator-first policy (uses Nx structure)
-   ✅ Security: No secrets, no auto-approve
-   ✅ Testing: Includes Jest setup
-   ✅ Traceability: Documented in this summary
