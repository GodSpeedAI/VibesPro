# PHASE-003: Nx-Composed React Generators (Next.js, Remix, Expo)

**Status:** Ready for Execution (Updated for Nx Composition Pattern)
**Duration:** 8-10 hours
**Parallelization:** 5 cycles (A, then B ∥ C ∥ D, then E)
**Critical Path:** Yes (A → B → E)
**Dependencies:** PHASE-001 + PHASE-002 complete
**Owner:** Frontend Agent

---

## 🎯 Phase Objectives

Create wrapper generators that **compose** official Nx generators (`@nx/next`, `@nx/remix`, `@nx/expo`) and apply post-generation transformations to inject shared-web patterns, hexagonal architecture, and VibesPro conventions.

### Success Criteria

-   [ ] Shared web assets library created (`libs/shared/web`) ✅ **COMPLETE**
-   [ ] Next.js wrapper generator delegates to `@nx/next` and injects shared-web
-   [ ] Remix wrapper generator delegates to `@nx/remix` and injects shared-web
-   [ ] Expo wrapper generator delegates to `@nx/expo` and injects shared-web
-   [ ] All wrappers apply idempotent transformations
-   [ ] Generated apps build successfully with official Nx generators + our enhancements
-   [ ] **Evidence**: `nx g @vibes-pro/generators:web-app` works for all frameworks; apps build and import shared-web correctly

### Traceability

| Requirement | Cycle   | Validation                               |
| ----------- | ------- | ---------------------------------------- |
| DEV-ADR-028 | All     | Nx composition pattern implemented       |
| DEV-PRD-029 | B, C, D | Wrapper generators functional            |
| DEV-SDS-028 | A, B-D  | Shared assets + post-gen transformations |
| Idempotency | E       | Double-run tests                         |

---

## 📊 Cycles Overview (UPDATED)

| Cycle | Owner          | Branch                          | Depends On | Parallel With | Duration | Status  |
| ----- | -------------- | ------------------------------- | ---------- | ------------- | -------- | ------- |
| **A** | Frontend Agent | `feature/shared-web-assets`     | PHASE-002  | None          | 2h       | ✅ DONE |
| **B** | Frontend Agent | `feature/nx-wrapper-nextjs`     | A          | C, D          | 2.5h     | Pending |
| **C** | Frontend Agent | `feature/nx-wrapper-remix`      | A          | B, D          | 2.5h     | Pending |
| **D** | Frontend Agent | `feature/nx-wrapper-expo`       | A          | B, C          | 2.5h     | Pending |
| **E** | Frontend Agent | `feature/gen-react-idempotency` | B, C, D    | None          | 1.5h     | Pending |

---

## ⚡ Cycle A: Shared Web Assets Library ✅ COMPLETE

**Status**: Merged to dev (commit `3e4d6dc`)

**Deliverables**:

-   Type-safe API client
-   Zod validation schemas
-   Environment configuration (Next.js, Remix, Expo compatible)
-   Error handling utilities

**See**: `PHASE-003-FINAL-SUMMARY.md` for details.

---

## ⚡ Cycle B: Next.js Wrapper Generator (UPDATED)

**Owner:** Frontend Agent
**Branch:** `feature/nx-wrapper-nextjs`
**Duration:** 2.5 hours

### Objectives

Create wrapper generator that:

1. Invokes `@nx/next:application` via `externalSchematic()`
2. Applies post-generation transformations for shared-web integration

### Implementation Strategy

```typescript
// tools/generators/web-app/generator.ts
import { externalSchematic, Tree } from "@nx/devkit";

export async function webAppGenerator(tree: Tree, options: WebAppSchema) {
    if (options.framework === "next") {
        // 1. Delegate to official Nx Next.js generator
        await externalSchematic(tree, "@nx/next", "application", {
            name: options.name,
            style: "css",
            appDir: options.routerStyle === "app", // App Router vs Pages Router
        });

        // 2. Apply shared-web integration
        await injectSharedWebImports(tree, options);
        await addApiClientExample(tree, options);
        await addErrorBoundary(tree, options);
    }

    return () => {
        // Post-install tasks
    };
}
```

### Post-Generation Transformations

**App Router** (`app/page.tsx`):

```typescript
import { ApiClient, env } from "@vibes-pro/shared-web";

export default async function Home() {
    const client = new ApiClient({ baseUrl: env.API_URL });
    // ... rest of generated code
}
```

**Pages Router** (`pages/index.tsx`):

```typescript
import { ApiClient, env } from "@vibes-pro/shared-web";
import type { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async () => {
    const client = new ApiClient({ baseUrl: env.API_URL });
    // ... rest of generated code
};
```

### Tests

```typescript
// Test that wrapper invokes Nx generator correctly
it("should delegate to @nx/next:application", async () => {
    const result = await webAppGenerator(tree, {
        name: "my-app",
        framework: "next",
        routerStyle: "app",
    });

    expect(tree.exists("apps/my-app/next.config.js")).toBe(true);
});

// Test that shared-web is injected
it("should inject shared-web imports", async () => {
    await webAppGenerator(tree, { name: "my-app", framework: "next" });

    const pageContent = tree.read("apps/my-app/app/page.tsx", "utf-8");
    expect(pageContent).toContain("from '@vibes-pro/shared-web'");
});
```

---

## ⚡ Cycle C: Remix Wrapper Generator (UPDATED)

**Owner:** Frontend Agent
**Branch:** `feature/nx-wrapper-remix`
**Duration:** 2.5 hours

### Remix-Specific Composition

```typescript
// Delegate to @nx/remix
await externalSchematic(tree, "@nx/remix", "application", {
    name: options.name,
    unitTestRunner: "vitest",
});

// Inject loader pattern with ApiClient
await injectRemixLoader(tree, options);
```

**Generated Route** (`app/routes/_index.tsx`):

```typescript
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { ApiClient, env } from "@vibes-pro/shared-web";

export async function loader({ request }: LoaderFunctionArgs) {
    const client = new ApiClient({ baseUrl: env.API_URL });
    const data = await client.get("/api/example");
    return json(data);
}

export default function Index() {
    const data = useLoaderData<typeof loader>();
    return <div>{/* use data */}</div>;
}
```

---

## ⚡ Cycle D: Expo Wrapper Generator (UPDATED)

**Owner:** Frontend Agent
**Branch:** `feature/nx-wrapper-expo`
**Duration:** 2.5 hours

### React Native Integration

```typescript
// Delegate to @nx/expo
await externalSchematic(tree, "@nx/expo", "application", {
    name: options.name,
    e2eTestRunner: "none", // Add later if needed
});

// Inject React Native-compatible API client usage
await injectExpoApiClient(tree, options);
```

**Generated App** (`App.tsx`):

```typescript
import { useState, useEffect } from "react";
import { View, Text } from "react-native";
import { ApiClient, env } from "@vibes-pro/shared-web";

export default function App() {
    const [data, setData] = useState(null);

    useEffect(() => {
        const client = new ApiClient({ baseUrl: env.API_URL });
        client.get("/api/example").then(setData).catch(console.error);
    }, []);

    return (
        <View>
            <Text>{JSON.stringify(data)}</Text>
        </View>
    );
}
```

---

## ⚡ Cycle E: Idempotency Validation (UPDATED)

**Owner:** Frontend Agent
**Branch:** `feature/gen-react-idempotency`
**Duration:** 1.5 hours
**Depends On:** B, C, D complete

### Double-Run Tests

```bash
# Test each wrapper generator
nx g @vibes-pro/generators:web-app test-next --framework=next --routerStyle=app
nx g @vibes-pro/generators:web-app test-next --framework=next --routerStyle=app --dry-run

# Assert no file changes on second run
git diff --exit-code apps/test-next/

# Repeat for Remix and Expo
```

### Idempotency Strategy

Use transformation guards:

```typescript
function injectSharedWebImports(tree: Tree, appPath: string) {
    const content = tree.read(appPath, "utf-8");

    // Guard: Only inject if not already present
    if (content.includes("from '@vibes-pro/shared-web'")) {
        return; // Already injected, skip
    }

    // Inject import
    const updatedContent = addImport(content, "@vibes-pro/shared-web", ["ApiClient", "env"]);
    tree.write(appPath, updatedContent);
}
```

---

## Key Changes from Original Plan

### What Changed

1. **Composition Over Creation**: Use `externalSchematic()` instead of building custom templates
2. **Official Generators**: Delegate to `@nx/next`, `@nx/remix`, `@nx/expo`
3. **Post-Generation Pattern**: Transform generated files instead of template-based generation
4. **Reduced Complexity**: ~60% less code to maintain (no framework-specific templates)
5. **Future-Proof**: Nx updates flow through automatically

### What Stays the Same

1. **Cycle A** (shared-web): Already complete, no changes needed
2. **Success Criteria**: Same outcomes (apps build, shared-web integrated, idempotent)
3. **Test Strategy**: Still need E2E tests and idempotency validation
4. **Documentation**: Still provide per-framework examples

---

## Nx Version Compatibility

**Target**: Nx 22.x (current)  
**Tested Against**:

-   `@nx/next@22.0.2`
-   `@nx/remix@22.0.2`
-   `@nx/expo@22.0.2`

**Upgrade Path**: When Nx 23.x releases, test wrappers against new API; update only if breaking changes.

**Documentation**: Track in `docs/NX_VERSION_MATRIX.md`

---

## Success Metrics

-   [ ] Wrapper generators invoke official Nx generators successfully
-   [ ] Generated apps compile and run (`nx build`, `nx serve`)
-   [ ] Shared-web imports present in all generated entry files
-   [ ] Double-run produces zero file changes (idempotent)
-   [ ] Official Nx features (e.g., React Server Components) work without modification
-   [ ] Nx generator updates don't break wrappers (verify quarterly)

# tests/generators/react_spec.sh

Describe 'React Generator Idempotency'
It 'Next.js App Router is idempotent'

```bash
nx g @ddd-plugin/ddd:web-app test-next-app --framework=next --routerStyle=app
first_hash=$(find apps/test-next-app -type f -exec md5sum {} \; | sort | md5sum)

nx g @ddd-plugin/ddd:web-app test-next-app --framework=next --routerStyle=app
second_hash=$(find apps/test-next-app -type f -exec md5sum {} \; | sort | md5sum)

[ "$first_hash" = "$second_hash" ]
```

End

It 'Next.js Pages Router is idempotent'

```bash
nx g @ddd-plugin/ddd:web-app test-next-pages --framework=next --routerStyle=pages
first_hash=$(find apps/test-next-pages -type f -exec md5sum {} \; | sort | md5sum)

nx g @ddd-plugin/ddd:web-app test-next-pages --framework=next --routerStyle=pages
second_hash=$(find apps/test-next-pages -type f -exec md5sum {} \; | sort | md5sum)

[ "$first_hash" = "$second_hash" ]
```

End

It 'Remix generator is idempotent'

```bash
nx g @ddd-plugin/ddd:web-app test-remix --framework=remix
first_hash=$(find apps/test-remix -type f -exec md5sum {} \; | sort | md5sum)

nx g @ddd-plugin/ddd:web-app test-remix --framework=remix
second_hash=$(find apps/test-remix -type f -exec md5sum {} \; | sort | md5sum)

[ "$first_hash" = "$second_hash" ]
```

End

It 'Expo generator is idempotent'

```bash
nx g @ddd-plugin/ddd:web-app test-expo --framework=expo
first_hash=$(find apps/test-expo -type f -exec md5sum {} \; | sort | md5sum)

nx g @ddd-plugin/ddd:web-app test-expo --framework=expo
second_hash=$(find apps/test-expo -type f -exec md5sum {} \; | sort | md5sum)

[ "$first_hash" = "$second_hash" ]
```

End
End

```

---

## ✅ Phase Validation Checklist

-   [ ] Shared web library: API client + schemas + env
-   [ ] Next.js (App Router): Scaffolds with shared assets
-   [ ] Next.js (Pages Router): Scaffolds with shared assets
-   [ ] Remix: Scaffolds v2.15+ with loaders
-   [ ] Expo: Scaffolds React Native with shared client
-   [ ] All surfaces: Build successfully (Next App, Next Pages, Remix, Expo)
-   [ ] Idempotency: All double-run tests pass
-   [ ] **PHASE-003 marked GREEN in Master Plan**

---

**Next Steps**: Proceed to PHASE-004 (Type Safety & CI)
```
