# VibesPro - PHASE-003: Nx-Composed Full-Stack Generators (Frontend + Backend)

> **Full-Stack Agent**: Implement wrapper generators that compose official Nx generators with VibesPro's shared infrastructure and hexagonal architecture patterns.

---

## Mission: Create Nx wrapper generators for all application surfaces

Build wrapper generators that delegate to official Nx framework generators and apply post-generation transformations to inject shared libraries, hexagonal architecture, and VibesPro conventions:

-   **Frontend**: `@nx/next`, `@nx/remix`, `@nx/expo` with shared-web integration
-   **Backend**: `@nxlv/python` with FastAPI + Logfire + Pydantic + Supabase type-sync

**Key Principle**: Compose, don't replace. Let Nx generators handle framework scaffolding, we add VibesPro conventions.

---

## Success Criteria (Binary Pass/Fail)

-   [ ] **Shared Web Library Complete**: `libs/shared/web` provides ApiClient, Zod schemas, env config, error handling ✅ **DONE**
-   [ ] **Next.js Wrapper Generator**: Delegates to `@nx/next:application`, injects shared-web integration, supports both App Router and Pages Router
-   [ ] **Remix Wrapper Generator**: Delegates to `@nx/remix:application`, injects shared-web integration with loader/action patterns
-   [ ] **Expo Wrapper Generator**: Delegates to `@nx/expo:application`, injects shared-web integration for React Native
-   [ ] **FastAPI Wrapper Generator**: Delegates to `@nxlv/python:fastapi-application`, injects Logfire + hexagonal architecture + Pydantic type-sync
-   [ ] **Zero Duplication**: All frontends import from `@vibes-pro/shared-web`, all backends use hexagonal ports/adapters
-   [ ] **Idempotency Validated**: Double-run tests pass for all 4 wrapper generators (frontend + backend)
-   [ ] **Backend Services Auto-Instrument**: Generated FastAPI apps include Logfire bootstrap and export OpenAPI schemas
-   [ ] **Zero CI Failures**: `pnpm nx run-many -t build,test,lint` passes for all generated apps
-   [ ] **Production Ready**: Both `nx g @vibes-pro/generators:web-app` and `nx g @vibes-pro/generators:api-service` work

**Failure Mode**: If any criterion fails, continue iterating until all pass.

---

## Context: Why This Matters

**Current State**: VibesPro has shared web infrastructure (`libs/shared/web`) but no generators to scaffold frontend OR backend applications that use it.

**Impact**:

-   **Template Users**: Cannot quickly scaffold Next.js/Remix/Expo/FastAPI apps with VibesPro conventions
-   **Frontend Development**: Must manually wire up shared-web library in each new frontend app
-   **Backend Development**: Must manually configure Logfire, hexagonal architecture, and Pydantic schemas for each service
-   **Type Safety**: Manual schema integration—drift inevitable between Supabase, backend, and frontend
-   **Hexagonal Architecture**: No enforcement of ports/adapters patterns
-   **Observability**: No automatic Logfire instrumentation

**Target State**:

-   **Frontend**: `nx g @vibes-pro/generators:web-app my-app --framework=next` scaffolds with shared-web integration
-   **Backend**: `nx g @vibes-pro/generators:api-service my-api` scaffolds with Logfire + hexagonal architecture + Pydantic
-   All frameworks automatically configured with VibesPro conventions
-   Type-safe infrastructure ready to use out of the box
-   Consistent patterns across all surfaces (web + mobile + API)

**Risk Level**: **LOW** (composition pattern minimizes maintenance burden)

---

## Phase 1: Next.js Wrapper Generator (Cycle B)

### Task 1: Create Next.js Wrapper

**What**: Create generator that composes `@nx/next:application` with shared-web integration

**Branch**: `feature/nx-wrapper-nextjs`

**Implementation Steps**:

1. **Generator already exists** at `tools/reference/hexddd-generators/web-app/generator.ts`:

```typescript
async function tryGenerateNextApp(tree: Tree, options: WebAppGeneratorSchema) {
    try {
        const { applicationGenerator } = require("@nx/next/src/generators/application/application");
        const appNames = names(options.name);
        const directory = joinPathFragments("apps", appNames.fileName);
        const appDir = options.routerStyle !== "pages";

        await applicationGenerator(tree, {
            name: appNames.fileName,
            directory,
            style: "css",
            unitTestRunner: "jest",
            linter: "eslint",
            appDir,
        });
    } catch (e) {
        console.warn("[web-app] @nx/next not available or failed, proceeding with shared lib only");
    }
}
```

2. **Add post-generation transformations** to inject shared-web imports:

```typescript
async function injectSharedWebIntoNextApp(tree: Tree, options: WebAppGeneratorSchema) {
    const appNames = names(options.name);
    const projectRoot = joinPathFragments("apps", appNames.fileName);

    if (options.routerStyle === "app") {
        // App Router: inject into app/page.tsx
        const pagePath = joinPathFragments(projectRoot, "app/page.tsx");
        if (tree.exists(pagePath)) {
            const content = tree.read(pagePath, "utf-8");
            const updatedContent = `import { ApiClient, ENV } from '@vibes-pro/shared-web';\n\n${content}`;
            tree.write(pagePath, updatedContent);
        }
    } else {
        // Pages Router: inject into pages/index.tsx
        const indexPath = joinPathFragments(projectRoot, "pages/index.tsx");
        if (tree.exists(indexPath)) {
            const content = tree.read(indexPath, "utf-8");
            const updatedContent = `import { ApiClient, ENV } from '@vibes-pro/shared-web';\nimport type { GetServerSideProps } from 'next';\n\n${content}`;
            tree.write(indexPath, updatedContent);
        }
    }

    // Add example API client usage
    await addApiClientExample(tree, projectRoot, options.routerStyle);
}

async function addApiClientExample(tree: Tree, projectRoot: string, routerStyle: string) {
    const exampleDir = joinPathFragments(projectRoot, "src/lib");
    tree.write(
        joinPathFragments(exampleDir, "api-client.ts"),
        `import { ApiClient, ENV } from '@vibes-pro/shared-web';

export const apiClient = new ApiClient({
  baseUrl: ENV.API_URL,
});

export async function fetchExample() {
  return apiClient.get('/api/example');
}
`,
    );
}
```

3. **Update main generator** to call Next.js flow:

```typescript
export async function webAppGenerator(tree: Tree, options: WebAppGeneratorSchema) {
    if (options.framework === "next") {
        await tryGenerateNextApp(tree, options);
        if (options.apiClient !== false) {
            await injectSharedWebIntoNextApp(tree, options);
        }
    }
    // ... other frameworks

    if (options.apiClient !== false) {
        ensureSharedWeb(tree, options);
    }

    await formatFiles(tree);
}
```

**Exit Criteria**:

-   [ ] Wrapper delegates to `@nx/next:application` correctly
-   [ ] App Router apps (`--routerStyle=app`) scaffold with RSC patterns
-   [ ] Pages Router apps (`--routerStyle=pages`) scaffold with SSR patterns
-   [ ] Both styles import from `@vibes-pro/shared-web`
-   [ ] Generated apps include example API client usage
-   [ ] `pnpm nx build <generated-app>` succeeds for both router styles
-   [ ] **Traceability**: DEV-ADR-028, DEV-PRD-029

---

## Phase 2: Remix Wrapper Generator (Cycle C)

### Task 2: Create Remix Wrapper

**What**: Create generator that composes `@nx/remix:application` with shared-web integration

**Branch**: `feature/nx-wrapper-remix`

**Implementation Steps**:

1. **Implement Remix delegation** (already exists):

```typescript
async function tryGenerateRemixApp(tree: Tree, options: WebAppGeneratorSchema) {
    try {
        const { applicationGenerator } = require("@nx/remix/generators");
        const appNames = names(options.name);
        const directory = joinPathFragments("apps", appNames.fileName);

        await applicationGenerator(tree, {
            name: appNames.fileName,
            directory,
            linter: "eslint",
            unitTestRunner: "jest",
        });
    } catch (e) {
        console.warn("[web-app] @nx/remix not available or failed, proceeding with shared lib only");
    }
}
```

2. **Add Remix-specific transformations** for loader pattern:

```typescript
async function injectSharedWebIntoRemixApp(tree: Tree, options: WebAppGeneratorSchema) {
    const appNames = names(options.name);
    const projectRoot = joinPathFragments("apps", appNames.fileName);
    const indexRoute = joinPathFragments(projectRoot, "app/routes/_index.tsx");

    if (tree.exists(indexRoute)) {
        const loaderExample = `import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { ApiClient, ENV } from '@vibes-pro/shared-web';

export async function loader({ request }: LoaderFunctionArgs) {
  const client = new ApiClient({ baseUrl: ENV.API_URL });
  try {
    const data = await client.get('/api/health');
    return json(data);
  } catch (error) {
    return json({ error: 'Failed to load data' }, { status: 500 });
  }
}

export default function Index() {
  const data = useLoaderData<typeof loader>();
  
  return (
    <div>
      <h1>Welcome to ${options.name}</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
`;
        tree.write(indexRoute, loaderExample);
    }
}
```

3. **Wire into main generator**:

```typescript
export async function webAppGenerator(tree: Tree, options: WebAppGeneratorSchema) {
    if (options.framework === "remix") {
        await tryGenerateRemixApp(tree, options);
        if (options.apiClient !== false) {
            await injectSharedWebIntoRemixApp(tree, options);
        }
    }
    // ... rest
}
```

**Exit Criteria**:

-   [ ] Wrapper delegates to `@nx/remix:application` correctly
-   [ ] Generated app includes loader pattern with ApiClient
-   [ ] Imports from `@vibes-pro/shared-web` work correctly
-   [ ] `pnpm nx build <remix-app>` succeeds
-   [ ] **Traceability**: DEV-ADR-028, DEV-PRD-029

---

## Phase 3: Expo Wrapper Generator (Cycle D)

### Task 3: Create Expo Wrapper

**What**: Create generator that composes `@nx/expo:application` with shared-web integration

**Branch**: `feature/nx-wrapper-expo`

**Implementation Steps**:

1. **Implement Expo delegation** (already exists):

```typescript
async function tryGenerateExpoApp(tree: Tree, options: WebAppGeneratorSchema) {
    try {
        const gen = require("@nx/expo/src/generators/application/application").default;
        const appNames = names(options.name);
        const directory = joinPathFragments("apps", appNames.fileName);

        await gen(tree, {
            name: appNames.fileName,
            directory,
            linter: "eslint",
            unitTestRunner: "jest",
        });
    } catch (e) {
        console.warn("[web-app] @nx/expo not available or failed, proceeding with shared lib only");
    }
}
```

2. **Add React Native transformations**:

```typescript
async function injectSharedWebIntoExpoApp(tree: Tree, options: WebAppGeneratorSchema) {
    const appNames = names(options.name);
    const projectRoot = joinPathFragments("apps", appNames.fileName);
    const appTsx = joinPathFragments(projectRoot, "src/app/App.tsx");

    if (tree.exists(appTsx)) {
        const expoExample = `import { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { ApiClient, ENV } from '@vibes-pro/shared-web';

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const client = new ApiClient({ baseUrl: ENV.API_URL });
    
    client.get('/api/health')
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text>Error: {error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to ${options.name}</Text>
      <Text>{JSON.stringify(data, null, 2)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
});
`;
        tree.write(appTsx, expoExample);
    }
}
```

**Exit Criteria**:

-   [ ] Wrapper delegates to `@nx/expo:application` correctly
-   [ ] Generated app uses ApiClient in React Native environment
-   [ ] Imports from `@vibes-pro/shared-web` work (platform-agnostic fetch)
-   [ ] `pnpm nx start <expo-app>` succeeds
-   [ ] **Traceability**: DEV-ADR-028, DEV-PRD-029

---

## Phase 4: FastAPI Wrapper Generator (Cycle F)

### Task 4: Create FastAPI Wrapper with Logfire + Hexagonal Architecture

**What**: Create generator that composes `@nxlv/python:fastapi-application` with Logfire instrumentation, hexagonal architecture, and Pydantic type-sync

**Branch**: `feature/nx-wrapper-fastapi`

**Parallel With**: Cycles B, C, D (can run in parallel with frontend generators)

**Implementation Steps**:

1. **Create api-service generator structure**:

```bash
pnpm exec nx g @nx/plugin:generator api-service --project=ddd-plugin
```

2. **Define schema** at `generators/api-service/schema.json`:

```json
{
    "$schema": "https://json-schema.org/draft-07/schema",
    "id": "ApiService",
    "title": "Create a FastAPI backend service",
    "type": "object",
    "properties": {
        "name": {
            "type": "string",
            "description": "Service name",
            "$default": { "$source": "argv", "index": 0 }
        },
        "directory": {
            "type": "string",
            "description": "Directory where the service is placed",
            "default": "apps"
        },
        "withLogfire": {
            "type": "boolean",
            "description": "Include Logfire instrumentation",
            "default": true
        },
        "withHexagonal": {
            "type": "boolean",
            "description": "Include hexagonal architecture structure",
            "default": true
        },
        "tags": {
            "type": "string",
            "description": "Tags for Nx dependency graph"
        }
    },
    "required": ["name"]
}
```

3. **Implement generator logic**:

```typescript
// generators/api-service/generator.ts
import { Tree, formatFiles, joinPathFragments, names } from "@nx/devkit";
import { ApiServiceGeneratorSchema } from "./schema";

async function tryGenerateFastAPIApp(tree: Tree, options: ApiServiceGeneratorSchema) {
    try {
        const { applicationGenerator } = require("@nxlv/python/src/generators/fastapi-application/generator");
        const appNames = names(options.name);
        const directory = joinPathFragments(options.directory || "apps", appNames.fileName);

        await applicationGenerator(tree, {
            name: appNames.fileName,
            directory,
        });
    } catch (e) {
        console.warn("[api-service] @nxlv/python not available or failed, proceeding with manual setup");
    }
}

async function injectLogfireBootstrap(tree: Tree, options: ApiServiceGeneratorSchema) {
    if (!options.withLogfire) return;

    const appNames = names(options.name);
    const projectRoot = joinPathFragments(options.directory || "apps", appNames.fileName);
    const mainPath = joinPathFragments(projectRoot, "main.py");

    if (tree.exists(mainPath)) {
        const content = tree.read(mainPath, "utf-8");

        // Guard: Check if already injected
        if (content.includes("from libs.python.vibepro_logging import")) {
            return;
        }

        const logfireImports = `from libs.python.vibepro_logging import (
    bootstrap_logfire,
    configure_logger,
    LogCategory,
)

`;

        // Inject after FastAPI import
        const updatedContent = content.replace(/from fastapi import FastAPI\n/, `from fastapi import FastAPI\n${logfireImports}`);

        // Add bootstrap call after app initialization
        const withBootstrap = updatedContent.replace(/(app = FastAPI\([^)]*\))/, `$1\n\nbootstrap_logfire(app, service="${options.name}")\nlogger = configure_logger("${options.name}")`);

        tree.write(mainPath, withBootstrap);
    }
}

async function addHexagonalStructure(tree: Tree, options: ApiServiceGeneratorSchema) {
    if (!options.withHexagonal) return;

    const appNames = names(options.name);
    const projectRoot = joinPathFragments(options.directory || "apps", appNames.fileName);

    // Create hexagonal directories
    const dirs = [`${projectRoot}/domain/entities`, `${projectRoot}/domain/value_objects`, `${projectRoot}/application/ports`, `${projectRoot}/application/use_cases`, `${projectRoot}/infrastructure/adapters/in_memory`, `${projectRoot}/infrastructure/adapters/supabase`];

    dirs.forEach((dir) => {
        tree.write(`${dir}/__init__.py`, "");
    });

    // Add repository port example
    tree.write(
        `${projectRoot}/application/ports/repository.py`,
        `"""Repository port (interface) following hexagonal architecture."""
from typing import Protocol, TypeVar, Generic
from domain.entities import Entity

T = TypeVar('T', bound=Entity)

class Repository(Protocol[T]):
    """Generic repository protocol for domain entities."""
    
    async def find_by_id(self, id: str) -> T | None:
        """Find entity by ID."""
        ...
    
    async def save(self, entity: T) -> None:
        """Save entity."""
        ...
    
    async def delete(self, id: str) -> None:
        """Delete entity by ID."""
        ...
`,
    );

    // Add domain entity example
    tree.write(
        `${projectRoot}/domain/entities/__init__.py`,
        `"""Domain entities following hexagonal architecture."""
from dataclasses import dataclass
from datetime import datetime

@dataclass
class Entity:
    """Base entity with common fields."""
    id: str
    created_at: datetime
    updated_at: datetime
`,
    );
}

async function configurePydanticTypeSync(tree: Tree, options: ApiServiceGeneratorSchema) {
    const appNames = names(options.name);
    const projectRoot = joinPathFragments(options.directory || "apps", appNames.fileName);
    const schemasPath = joinPathFragments(projectRoot, "schemas.py");

    tree.write(
        schemasPath,
        `"""Pydantic schemas for ${options.name}.

AUTO-GENERATED from Supabase schema - do not edit manually.
Regenerate with: just gen-types
"""
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime

class BaseSchema(BaseModel):
    """Base schema with common fields."""
    model_config = ConfigDict(from_attributes=True)
    
    id: str = Field(description="UUID primary key")
    created_at: datetime
    updated_at: datetime

# Add your domain-specific schemas here
# They will be auto-generated from Supabase in PHASE-004
`,
    );
}

async function addOpenAPIExport(tree: Tree, options: ApiServiceGeneratorSchema) {
    const appNames = names(options.name);
    const projectRoot = joinPathFragments(options.directory || "apps", appNames.fileName);
    const mainPath = joinPathFragments(projectRoot, "main.py");

    if (tree.exists(mainPath)) {
        const content = tree.read(mainPath, "utf-8");

        // Guard: Check if already added
        if (content.includes("/api/openapi.json")) {
            return;
        }

        const openapiEndpoint = `

@app.get("/api/openapi.json", include_in_schema=False)
def export_openapi():
    """Export OpenAPI schema for frontend type generation."""
    return app.openapi()
`;

        tree.write(mainPath, content + openapiEndpoint);
    }
}

export async function apiServiceGenerator(tree: Tree, options: ApiServiceGeneratorSchema) {
    await tryGenerateFastAPIApp(tree, options);

    if (options.withLogfire !== false) {
        await injectLogfireBootstrap(tree, options);
    }

    if (options.withHexagonal !== false) {
        await addHexagonalStructure(tree, options);
    }

    await configurePydanticTypeSync(tree, options);
    await addOpenAPIExport(tree, options);

    await formatFiles(tree);
}

export default apiServiceGenerator;
```

4. **Create tests**:

```typescript
// generators/api-service/generator.spec.ts
import { createTreeWithEmptyWorkspace } from "@nx/devkit/testing";
import { Tree } from "@nx/devkit";
import { apiServiceGenerator } from "./generator";

describe("api-service generator", () => {
    let tree: Tree;

    beforeEach(() => {
        tree = createTreeWithEmptyWorkspace();
    });

    it("should create hexagonal directory structure", async () => {
        await apiServiceGenerator(tree, {
            name: "test-api",
        });

        expect(tree.exists("apps/test-api/domain/entities/__init__.py")).toBe(true);
        expect(tree.exists("apps/test-api/application/ports/repository.py")).toBe(true);
        expect(tree.exists("apps/test-api/infrastructure/adapters/supabase/__init__.py")).toBe(true);
    });

    it("should inject Logfire bootstrap", async () => {
        await apiServiceGenerator(tree, {
            name: "test-api",
            withLogfire: true,
        });

        const mainContent = tree.read("apps/test-api/main.py", "utf-8");
        expect(mainContent).toContain("from libs.python.vibepro_logging import");
        expect(mainContent).toContain('bootstrap_logfire(app, service="test-api")');
    });

    it("should add OpenAPI export endpoint", async () => {
        await apiServiceGenerator(tree, {
            name: "test-api",
        });

        const mainContent = tree.read("apps/test-api/main.py", "utf-8");
        expect(mainContent).toContain("/api/openapi.json");
        expect(mainContent).toContain("def export_openapi():");
    });

    it("should be idempotent (double-run produces same output)", async () => {
        const options = { name: "test-api" };

        await apiServiceGenerator(tree, options);
        const firstRun = tree.listChanges();

        await apiServiceGenerator(tree, options);
        const secondRun = tree.listChanges();

        expect(firstRun).toEqual(secondRun);
    });
});
```

**Exit Criteria**:

-   [ ] Wrapper delegates to `@nxlv/python:fastapi-application` correctly
-   [ ] Generated service includes Logfire instrumentation
-   [ ] Hexagonal architecture directories created (domain, application, infrastructure)
-   [ ] Repository port example included
-   [ ] Pydantic schemas.py file created with base schema
-   [ ] OpenAPI export endpoint added to main.py
-   [ ] Generated service structure follows PHASE-002 hexagonal patterns
-   [ ] `uv run pytest apps/<service-name>` passes
-   [ ] **Traceability**: DEV-ADR-028, DEV-PRD-029, PHASE-002 hexagonal foundations

---

## Phase 5: Validation & Idempotency (Cycle E)

### Task 5: Comprehensive Testing (Frontend + Backend)

**What**: Ensure all wrapper generators (frontend + backend) are idempotent and build successfully

**Branch**: `feature/gen-idempotency`

**Dependencies**: Cycles B, C, D, F complete

**Implementation Steps**:

1. **Create unit tests** for each wrapper:

```typescript
// tests/web-app-generator.spec.ts
import { createTreeWithEmptyWorkspace } from "@nx/devkit/testing";
import { Tree } from "@nx/devkit";
import { webAppGenerator } from "./generator";

describe("web-app generator", () => {
    let tree: Tree;

    beforeEach(() => {
        tree = createTreeWithEmptyWorkspace();
    });

    it("should delegate to @nx/next for Next.js apps", async () => {
        await webAppGenerator(tree, {
            name: "test-next",
            framework: "next",
            routerStyle: "app",
        });

        expect(tree.exists("apps/test-next/next.config.js")).toBe(true);
        expect(tree.exists("apps/test-next/app/page.tsx")).toBe(true);
    });

    it("should inject shared-web imports", async () => {
        await webAppGenerator(tree, {
            name: "test-next",
            framework: "next",
            apiClient: true,
        });

        const content = tree.read("apps/test-next/app/page.tsx", "utf-8");
        expect(content).toContain("@vibes-pro/shared-web");
    });

    it("should be idempotent (double-run produces same output)", async () => {
        const options = { name: "test-app", framework: "next" as const };

        await webAppGenerator(tree, options);
        const firstRun = tree.listChanges();

        await webAppGenerator(tree, options);
        const secondRun = tree.listChanges();

        expect(firstRun).toEqual(secondRun);
    });
});
```

2. **Create integration tests**:

```bash
#!/bin/bash
# tests/integration/generator-build.sh

set -e

echo "=== Frontend Generators ==="

echo "Testing Next.js App Router generation and build..."
pnpm exec nx g @vibes-pro/generators:web-app test-next-app \
  --framework=next --routerStyle=app --no-interactive
pnpm exec nx build test-next-app

echo "Testing Next.js Pages Router generation and build..."
pnpm exec nx g @vibes-pro/generators:web-app test-next-pages \
  --framework=next --routerStyle=pages --no-interactive
pnpm exec nx build test-next-pages

echo "Testing Remix generation and build..."
pnpm exec nx g @vibes-pro/generators:web-app test-remix \
  --framework=remix --no-interactive
pnpm exec nx build test-remix

echo "Testing Expo generation..."
pnpm exec nx g @vibes-pro/generators:web-app test-expo \
  --framework=expo --no-interactive
# Note: Expo builds are more complex, verify structure exists
test -f apps/test-expo/app.json

echo "=== Backend Generators ==="

echo "Testing FastAPI service generation..."
pnpm exec nx g @vibes-pro/generators:api-service test-api --no-interactive

# Verify hexagonal structure
test -d apps/test-api/domain/entities
test -d apps/test-api/application/ports
test -d apps/test-api/infrastructure/adapters

# Verify Logfire integration
grep -q "bootstrap_logfire" apps/test-api/main.py

# Verify OpenAPI export
grep -q "/api/openapi.json" apps/test-api/main.py

# Run tests (if available)
if [ -f apps/test-api/tests/test_main.py ]; then
  uv run pytest apps/test-api/tests/test_main.py -v
fi

echo "✅ All wrapper generators validated successfully (frontend + backend)!"
```

3. **Add to CI pipeline**:

```yaml
# .github/workflows/generators.yml
name: Generator Tests

on: [pull_request]

jobs:
    test-wrappers:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v3
            - uses: pnpm/action-setup@v2
            - uses: actions/setup-node@v3
              with:
                  node-version: "20"
                  cache: "pnpm"

            - run: pnpm install
            - run: pnpm nx run-many -t test --projects=tag:generator
            - run: bash tests/integration/web-app-build.sh
```

**Exit Criteria**:

-   [ ] All unit tests pass for 4 wrapper generators (3 frontend + 1 backend)
-   [ ] Integration tests verify all apps build successfully
-   [ ] Backend hexagonal structure validated (domain, application, infrastructure)
-   [ ] Backend Logfire instrumentation verified
-   [ ] Idempotency tests pass (double-run produces identical output for all generators)
-   [ ] CI pipeline includes generator validation for frontend + backend
-   [ ] **Traceability**: Idempotency requirements validated

---

## Documentation Updates

### Generator README

Create `tools/reference/hexddd-generators/web-app/README.md`:

````markdown
# Web App Generator

Wrapper generator that composes official Nx framework generators with VibesPro's shared infrastructure.

## Usage

### Next.js (App Router)

```bash
nx g @vibes-pro/generators:web-app my-app --framework=next --routerStyle=app
```
````

### Next.js (Pages Router)

```bash
nx g @vibes-pro/generators:web-app my-app --framework=next --routerStyle=pages
```

### Remix

```bash
nx g @vibes-pro/generators:web-app my-app --framework=remix
```

### Expo

```bash
nx g @vibes-pro/generators:web-app my-app --framework=expo
```

## What It Does

1. **Delegates** to official Nx generators (`@nx/next`, `@nx/remix`, `@nx/expo`)
2. **Injects** shared-web library imports and usage examples
3. **Ensures** `libs/shared/web` exists with ApiClient, schemas, env config

## Shared Infrastructure

All generated apps import from `@vibes-pro/shared-web`:

-   `ApiClient` - Type-safe HTTP client with error handling
-   Zod schemas - Runtime validation
-   `ENV` - Framework-agnostic environment variables
-   Error types - Standardized error handling

## Architecture

This generator follows the **Nx Composition Pattern**:

-   Official Nx generators handle framework scaffolding
-   Post-generation transformations inject VibesPro conventions
-   Minimal maintenance burden (Nx updates don't break our generators)

See `PHASE-003-UNIVERSAL_REACT_GENERATOR.md` for full architecture details.

```

---

## Traceability Matrix

| Component | ADR | PRD | SDS | Test Coverage |
|-----------|-----|-----|-----|---------------|
| Shared Web Library | DEV-ADR-028 | DEV-PRD-029 | DEV-SDS-028 | ✅ Unit + Integration |
| Next.js Wrapper | DEV-ADR-028 | DEV-PRD-029 | DEV-SDS-028 | Pending |
| Remix Wrapper | DEV-ADR-028 | DEV-PRD-029 | DEV-SDS-028 | Pending |
| Expo Wrapper | DEV-ADR-028 | DEV-PRD-029 | DEV-SDS-028 | Pending |
| FastAPI Wrapper | DEV-ADR-028 | DEV-PRD-029 | DEV-SDS-028 | Pending |
| Idempotency (All) | DEV-ADR-028 | N/A | DEV-SDS-028 | Pending |

---

## Next Steps

After PHASE-003 completion:
1. **PHASE-004**: Type Safety & CI Integration (strict TypeScript + Python mypy + automated type sync)
2. **PHASE-005**: Integration & Documentation (end-to-end examples, deployment guides)
3. **PHASE-006**: Advanced Features (multi-tenancy, RBAC, event sourcing patterns)

---

## References

- **Plan**: `docs/plans/hexddd_integration/PHASE-003-UNIVERSAL_REACT_GENERATOR.md`
- **Implementation**: `tools/reference/hexddd-generators/web-app/`
- **Shared Library**: `libs/shared/web/` (commit `3e4d6dc`)
- **Nx Composition Pattern**: https://nx.dev/extending-nx/recipes/composing-generators
```
