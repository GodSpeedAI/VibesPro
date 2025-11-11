# PHASE-003: Nx-Composed Full-Stack Generators (Frontend + Backend)

**Status:** Ready for Execution (Updated for Nx Composition Pattern)
**Duration:** 10-12 hours
**Parallelization:** 6 cycles (A, then B ∥ C ∥ D ∥ F, then E)
**Critical Path:** Yes (A → B → E)
**Dependencies:** PHASE-001 + PHASE-002 complete
**Owner:** Full-Stack Agent

---

## 🎯 Phase Objectives

Create wrapper generators that **compose** official Nx generators and apply post-generation transformations to inject shared libraries, hexagonal architecture, and VibesPro conventions:

-   **Frontend**: `@nx/next`, `@nx/remix`, `@nx/expo` with shared-web integration
-   **Backend**: `@nxlv/python` with FastAPI + Logfire + Pydantic + Supabase type-sync

### Success Criteria

-   [ ] Shared web assets library created (`libs/shared/web`) ✅ **COMPLETE**
-   [ ] Next.js wrapper generator delegates to `@nx/next` and injects shared-web
-   [ ] Remix wrapper generator delegates to `@nx/remix` and injects shared-web
-   [ ] Expo wrapper generator delegates to `@nx/expo` and injects shared-web
-   [ ] FastAPI wrapper generator delegates to `@nxlv/python` and injects Logfire + hexagonal patterns
-   [ ] All wrappers apply idempotent transformations
-   [ ] Generated apps build successfully with official Nx generators + our enhancements
-   [ ] Backend services auto-instrument with Logfire and export OpenAPI schemas
-   [ ] **Evidence**: `nx g @vibes-pro/generators:web-app` and `nx g @vibes-pro/generators:api-service` work; apps build and integrate correctly

### Traceability

| Requirement | Cycle      | Validation                                  |
| ----------- | ---------- | ------------------------------------------- |
| DEV-ADR-028 | All        | Nx composition pattern (frontend + backend) |
| DEV-PRD-029 | B, C, D, F | Wrapper generators functional               |
| DEV-SDS-028 | A, B-D, F  | Shared assets + post-gen transformations    |
| Idempotency | E          | Double-run tests (frontend + backend)       |

---

## 📊 Cycles Overview (UPDATED)

| Cycle | Owner             | Branch                       | Depends On | Parallel With | Duration | Status  |
| ----- | ----------------- | ---------------------------- | ---------- | ------------- | -------- | ------- |
| **A** | Frontend Agent    | `feature/shared-web-assets`  | PHASE-002  | None          | 2h       | ✅ DONE |
| **B** | Frontend Agent    | `feature/nx-wrapper-nextjs`  | A          | C, D, F       | 2.5h     | Pending |
| **C** | Frontend Agent    | `feature/nx-wrapper-remix`   | A          | B, D, F       | 2.5h     | Pending |
| **D** | Frontend Agent    | `feature/nx-wrapper-expo`    | A          | B, C, F       | 2.5h     | Pending |
| **F** | Backend Agent     | `feature/nx-wrapper-fastapi` | A          | B, C, D       | 2.5h     | Pending |
| **E** | Integration Agent | `feature/gen-idempotency`    | B, C, D, F | None          | 2h       | Pending |

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

## ⚡ Cycle F: FastAPI Wrapper Generator (NEW)

**Owner:** Backend Agent
**Branch:** `feature/nx-wrapper-fastapi`
**Duration:** 2.5 hours
**Parallel With:** B, C, D

### Objectives

Create wrapper generator that:

1. Invokes `@nxlv/python:uv-project` (v21.0.4+) via `externalSchematic()` to create Python project
2. Adds FastAPI dependencies and scaffolding on top of the generated project
3. Applies post-generation transformations for Logfire bootstrap, hexagonal architecture, and Pydantic type-sync

### Implementation Strategy

```typescript
// tools/generators/api-service/generator.ts
import { externalSchematic, Tree } from "@nx/devkit";

export async function apiServiceGenerator(tree: Tree, options: ApiServiceSchema) {
    // 1. Delegate to @nxlv/python:uv-project (base Python project)
    await externalSchematic(tree, "@nxlv/python", "uv-project", {
        name: options.name,
        projectType: "application",
        directory: options.directory || "apps",
        linter: "ruff", // Modern Python linter
        unitTestRunner: "pytest",
        buildSystem: "uv", // Fast package manager
    });

    // 2. Add FastAPI dependencies to pyproject.toml
    await addFastAPIDependencies(tree, options);

    // 3. Scaffold FastAPI application structure
    await scaffoldFastAPIApp(tree, options);

    // 4. Apply VibesPro patterns
    await injectLogfireBootstrap(tree, options);
    await addHexagonalStructure(tree, options);
    await configurePydanticTypeSync(tree, options);
    await addOpenAPIExport(tree, options);

    return () => {
        // Post-install tasks: uv sync
    };
}
```

### Post-Generation Transformations

#### 0. Add FastAPI Dependencies

```typescript
async function addFastAPIDependencies(tree: Tree, options: ApiServiceSchema) {
    const pyprojectPath = `apps/${options.name}/pyproject.toml`;
    const content = tree.read(pyprojectPath, "utf-8");

    // Parse TOML and add FastAPI dependencies
    const pyproject = parse(content);

    if (!pyproject.project.dependencies) {
        pyproject.project.dependencies = [];
    }

    // Add FastAPI and related packages
    const fastapiDeps = [
        "fastapi>=0.115.0",
        "uvicorn[standard]>=0.32.0",
        "pydantic>=2.9.0",
        "python-multipart>=0.0.12", // For file uploads
    ];

    pyproject.project.dependencies.push(...fastapiDeps);

    // Write back to file
    tree.write(pyprojectPath, stringify(pyproject));
}

async function scaffoldFastAPIApp(tree: Tree, options: ApiServiceSchema) {
    const appPath = `apps/${options.name}`;
    const moduleName = options.name.replace(/-/g, "_");

    // Create main.py with basic FastAPI app
    tree.write(
        `${appPath}/${moduleName}/main.py`,
        `"""FastAPI application for ${options.name}"""
from fastapi import FastAPI

app = FastAPI(
    title="${options.name}",
    description="Service for ${options.name}",
    version="0.1.0",
)

@app.get("/")
async def root() -> dict[str, str]:
    return {"message": "Hello from ${options.name}"}

@app.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "healthy", "service": "${options.name}"}
`,
    );

    // Create __init__.py for proper module structure
    tree.write(`${appPath}/${moduleName}/__init__.py`, `"""${options.name} service module"""\n`);
}
```

#### 1. Logfire Bootstrap Injection

```typescript
function injectLogfireBootstrap(tree: Tree, options: ApiServiceSchema) {
    const mainPath = `apps/${options.name}/main.py`;
    const content = tree.read(mainPath, "utf-8");

    // Guard: Check if already injected
    if (content.includes("from libs.python.vibepro_logging import")) {
        return;
    }

    // Inject imports and bootstrap
    const updatedContent = `from fastapi import FastAPI
from libs.python.vibepro_logging import (
    bootstrap_logfire,
    configure_logger,
    LogCategory,
)

app = FastAPI(
    title="${options.name}",
    description="Service for ${options.name}",
    version="0.1.0",
)

bootstrap_logfire(app, service="${options.name}")
logger = configure_logger("${options.name}")

@app.get("/")
def health_check() -> dict[str, str]:
    logger.info("health check", category=LogCategory.APP)
    return {"status": "healthy", "service": "${options.name}"}
`;

    tree.write(mainPath, updatedContent);
}
```

#### 2. Hexagonal Structure

```typescript
async function addHexagonalStructure(tree: Tree, options: ApiServiceSchema) {
    const basePath = `apps/${options.name}`;

    // Create hexagonal directories
    const dirs = [`${basePath}/domain/entities`, `${basePath}/domain/value_objects`, `${basePath}/application/ports`, `${basePath}/application/use_cases`, `${basePath}/infrastructure/adapters/in_memory`, `${basePath}/infrastructure/adapters/supabase`];

    dirs.forEach((dir) => tree.write(`${dir}/.gitkeep`, ""));

    // Add port example (Repository protocol)
    tree.write(
        `${basePath}/application/ports/repository.py`,
        `from typing import Protocol
from domain.entities import Entity

class Repository(Protocol):
    async def find_by_id(self, id: str) -> Entity | None: ...
    async def save(self, entity: Entity) -> None: ...
`,
    );
}
```

#### 3. Pydantic Type-Sync Configuration

```typescript
function configurePydanticTypeSync(tree: Tree, options: ApiServiceSchema) {
    const schemasPath = `apps/${options.name}/schemas.py`;

    tree.write(
        schemasPath,
        `# AUTO-GENERATED from Supabase schema - do not edit manually
# Regenerate with: just gen-types
from pydantic import BaseModel, Field
from datetime import datetime

class BaseSchema(BaseModel):
    """Base schema with common fields"""
    id: str = Field(description="UUID primary key")
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True  # Enable ORM mode for SQLAlchemy
`,
    );
}
```

#### 4. OpenAPI Schema Export

```typescript
function addOpenAPIExport(tree: Tree, options: ApiServiceSchema) {
    const mainPath = `apps/${options.name}/main.py`;
    const content = tree.read(mainPath, "utf-8");

    // Add OpenAPI export endpoint
    const openapiEndpoint = `
@app.get("/api/openapi.json", include_in_schema=False)
def export_openapi():
    """Export OpenAPI schema for frontend type generation"""
    return app.openapi()
`;

    tree.write(mainPath, content + openapiEndpoint);
}
```

### Generated Service Structure

```
apps/my-service/
├── main.py                    # FastAPI app with Logfire bootstrap
├── schemas.py                 # Pydantic models (Supabase-synced)
├── domain/
│   ├── entities/
│   └── value_objects/
├── application/
│   ├── ports/
│   │   └── repository.py     # Protocol definitions
│   └── use_cases/
├── infrastructure/
│   └── adapters/
│       ├── in_memory/        # Test adapters
│       └── supabase/         # Production adapters
└── tests/
    └── test_main.py
```

### Validation Tests

```bash
# Generate service
nx g @vibes-pro/generators:api-service my-api

# Verify base Python project was created by @nxlv/python:uv-project
test -f apps/my-api/pyproject.toml
test -f apps/my-api/.python-version

# Verify FastAPI dependencies were added
grep "fastapi" apps/my-api/pyproject.toml
grep "uvicorn" apps/my-api/pyproject.toml
grep "pydantic" apps/my-api/pyproject.toml

# Verify FastAPI app was scaffolded
test -f apps/my-api/my_api/main.py
grep "FastAPI" apps/my-api/my_api/main.py

# Verify hexagonal structure
ls -la apps/my-api/application/ports/
ls -la apps/my-api/infrastructure/adapters/

# Install dependencies and run
cd apps/my-api
uv sync
uv run uvicorn my_api.main:app --host 0.0.0.0 --port 8000 &

# Verify Logfire instrumentation
uv run pytest tests/test_main.py -v

# Verify OpenAPI export
curl http://localhost:8000/api/openapi.json | jq '.info'

# Cleanup
pkill -f uvicorn
```

---

## ⚡ Cycle E: Idempotency Validation (UPDATED)

**Owner:** Integration Agent
**Branch:** `feature/gen-idempotency`
**Duration:** 2 hours
**Depends On:** B, C, D, F complete

### Double-Run Tests (Frontend + Backend)

```bash
# Test frontend generators
nx g @vibes-pro/generators:web-app test-next --framework=next --routerStyle=app
nx g @vibes-pro/generators:web-app test-next --framework=next --routerStyle=app --dry-run
git diff --exit-code apps/test-next/

# Test backend generator
nx g @vibes-pro/generators:api-service test-api
nx g @vibes-pro/generators:api-service test-api --dry-run
git diff --exit-code apps/test-api/

# Repeat for Remix, Expo
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
2. **Official Generators**: Delegate to `@nx/next`, `@nx/remix`, `@nx/expo`, `@nxlv/python:uv-project` (v21.0.4+)
3. **FastAPI Scaffolding**: Build custom FastAPI structure on top of `uv-project` base (no native FastAPI generator exists)
4. **Post-Generation Pattern**: Transform generated files instead of template-based generation
5. **Backend Integration**: Added Cycle F for Python/FastAPI wrapper generator (scaffolds FastAPI on `uv-project` base)
6. **Type-Sync Architecture**: Backend generators now integrate FastAPI-OpenAPI-Pydantic chain for Supabase type syncing
7. **Reduced Complexity**: ~60% less code to maintain (no framework-specific templates, leverage official generators)
8. **Future-Proof**: Nx updates flow through automatically for both frontend and backend

### What Stays the Same

1. **Cycle A** (shared-web): Already complete, no changes needed
2. **Success Criteria**: Same outcomes (apps build, shared libraries integrated, idempotent)
3. **Test Strategy**: Still need E2E tests and idempotency validation (now includes backend)
4. **Hexagonal Architecture**: PHASE-002 patterns still apply (ports/adapters for backend)
5. **Documentation**: Still provide per-framework examples

---

## Nx Version Compatibility

**Target**: Nx 22.x (current)
**Tested Against**:

-   `@nx/next@22.0.2`
-   `@nx/remix@22.0.2`
-   `@nx/expo@22.0.2`
-   `@nxlv/python@21.0.4` (uses `uv-project` generator)

**Upgrade Path**: When Nx 23.x releases, test wrappers against new API; update only if breaking changes.

**Documentation**: Track in `docs/NX_VERSION_MATRIX.md`

---

## Success Metrics

### Frontend Generators

-   [ ] Wrapper generators invoke official Nx generators successfully (`@nx/next`, `@nx/remix`, `@nx/expo`)
-   [ ] Generated apps compile and run (`nx build`, `nx serve`)
-   [ ] Shared-web imports present in all generated entry files
-   [ ] Double-run produces zero file changes (idempotent)
-   [ ] Official Nx features (e.g., React Server Components) work without modification

### Backend Generator

-   [ ] Wrapper generator invokes `@nxlv/python:uv-project` (v21.0.4+) successfully
-   [ ] FastAPI dependencies added to generated `pyproject.toml`
-   [ ] FastAPI app scaffolded with `main.py` and basic endpoints
-   [ ] Generated services include Logfire bootstrap from `libs/python/vibepro_logging.py`
-   [ ] Hexagonal structure (domain/application/infrastructure) scaffolded correctly
-   [ ] Pydantic schemas configured for Supabase type-sync
-   [ ] OpenAPI schema export endpoint (`/api/openapi.json`) responds correctly
-   [ ] FastAPI services compile and run (`uv run uvicorn main:app`)
-   [ ] Double-run produces zero file changes (idempotent)
-   [ ] Logfire OpenTelemetry instrumentation active (verified via tests)

### Integration

-   [ ] Nx generator updates don't break wrappers (verify quarterly)
-   [ ] End-to-end smoke test: Frontend app calls backend API successfully
-   [ ] Type-sync workflow: Backend OpenAPI schema → Frontend types (planned PHASE-004)

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

It 'FastAPI generator is idempotent'

```bash
nx g @ddd-plugin/ddd:api-service test-api
first_hash=$(find apps/test-api -type f -exec md5sum {} \; | sort | md5sum)

nx g @ddd-plugin/ddd:api-service test-api
second_hash=$(find apps/test-api -type f -exec md5sum {} \; | sort | md5sum)

[ "$first_hash" = "$second_hash" ]
```

End
End

```

---

## ✅ Phase Validation Checklist

### Frontend

-   [ ] Shared web library: API client + schemas + env ✅ **COMPLETE**
-   [ ] Next.js (App Router): Scaffolds with shared assets
-   [ ] Next.js (Pages Router): Scaffolds with shared assets
-   [ ] Remix: Scaffolds v2.15+ with loaders
-   [ ] Expo: Scaffolds React Native with shared client
-   [ ] All frontend apps build successfully (`nx build`)

### Backend

-   [ ] FastAPI service: Scaffolds with Logfire bootstrap
-   [ ] Hexagonal structure: domain/application/infrastructure directories created
-   [ ] Pydantic schemas: Type-sync headers present
-   [ ] OpenAPI export: `/api/openapi.json` endpoint responds
-   [ ] Backend service runs successfully (`uv run uvicorn main:app`)

### Integration & Idempotency

-   [ ] All double-run tests pass (frontend + backend)
-   [ ] End-to-end test: Frontend → Backend API call works
-   [ ] **PHASE-003 marked GREEN in Master Plan**

---

**Next Steps**: Proceed to PHASE-004 (Type Safety & CI with full-stack type-sync workflow)
```
