# VibesPro - PHASE-003: Universal React Generator

> **Frontend Agent**: Complete this phase to create a unified generator for Next.js, Remix, and Expo with shared type-safe infrastructure.

---

## Mission: Build one generator to rule all React frameworks with zero duplication

Create a single, universal Nx generator that scaffolds Next.js (App Router + Pages Router), Remix, and Expo applications—all sharing type-safe API clients, validation schemas, and hexagonal architecture patterns from a common web assets library.

---

## Success Criteria (Binary Pass/Fail)

-   [ ] **Shared Web Library Complete**: `libs/shared/web` provides ApiClient, Zod schemas, env config, error handling used by all frameworks
-   [ ] **Next.js App Router Generator**: Scaffolds RSC-ready apps with shared API client, builds successfully
-   [ ] **Next.js Pages Router Generator**: Scaffolds getServerSideProps/getStaticProps apps with shared client, builds successfully
-   [ ] **Remix Generator**: Scaffolds v2.15+ apps with loader/action patterns using shared client, builds successfully
-   [ ] **Expo Generator**: Scaffolds React Native apps with shared client (platform-agnostic fetch), builds successfully
-   [ ] **Zero Duplication**: All 4 frameworks import from `@shared/web`, no copy-pasted API logic
-   [ ] **Idempotency Validated**: Double-run tests pass for all 4 generators (hash stability)
-   [ ] **Zero CI Failures**: `pnpm nx run-many -t build,test,lint` passes for all generated apps
-   [ ] **Zero Technical Debt**: Follows generator patterns from PHASE-001, hexagonal from PHASE-002
-   [ ] **Production Ready**: Documentation includes framework-specific examples, traceability matrix updated

**Failure Mode**: If any criterion fails, continue iterating until all pass. Do not proceed to PHASE-004 with broken generators.

---

## Context: Why This Matters

**Current State**: VibesPro lacks frontend application generators. Template users must manually configure Next.js/Remix/Expo apps, duplicate API client logic across frameworks, manually wire up type-safe schemas, and manage framework-specific patterns inconsistently.

**Impact**:

-   **Template Users**: Cannot scaffold production-ready frontend apps—must spend hours setting up each framework
-   **Development Teams**: Duplicate API client code across 4 surfaces—bug fixes need 4× the work
-   **Type Safety**: Manual schema mapping between Supabase types and frontend—drift inevitable
-   **Hexagonal Architecture**: No enforcement of ports/adapters in frontend—infrastructure leaks into UI
-   **Cost of Inaction**: Weeks of setup time per project, inconsistent patterns, maintenance nightmare

**Target State**:

-   One command generates Next.js/Remix/Expo apps: `nx g @ddd-plugin/ddd:web-app my-app --framework=next`
-   All frameworks share battle-tested API client from `libs/shared/web`
-   Type-safe schemas auto-sync with Supabase types (prepared for PHASE-004)
-   Hexagonal ports/adapters enforced via Nx boundaries
-   Consistent patterns across all surfaces—fix once, benefit everywhere

**Risk Level**: **MEDIUM** → **LOW** (after completion, frontend development accelerates 10x with proven patterns)

---

## Phase 1: Shared Infrastructure (Cycle A) (Sprint 1, Day 1)

### Task 1A: Shared Web Assets Library

**What**: Create `libs/shared/web` with framework-agnostic API client, Zod schemas, env config

**Branch**: `feature/shared-web-assets`

**Implementation Steps**:

1. **Generate shared library using Nx**:

```bash
# Use generator-first approach per DEV-ADR-001
pnpm exec nx g @nx/js:lib shared-web --directory=libs/shared --buildable --publishable=false
```

2. **🔴 RED Phase - Create failing tests**:

```typescript
// libs/shared/web/src/api-client.test.ts
import { ApiClient } from "./api-client";

describe("ApiClient", () => {
    it("should make GET requests with type safety", async () => {
        const client = new ApiClient("http://localhost:8000");
        const result = await client.get<{ id: string }>("/api/test");
        // Expected: FAIL (ApiClient doesn't exist)
    });

    it("should handle errors gracefully", async () => {
        const client = new ApiClient("http://localhost:8000");
        await expect(client.get("/api/404")).rejects.toThrow();
        // Expected: FAIL
    });

    it("should include auth headers when configured", async () => {
        const client = new ApiClient("http://localhost:8000", {
            headers: { Authorization: "Bearer token" },
        });
        // Test auth header inclusion
        // Expected: FAIL
    });
});
```

3. **🟢 GREEN Phase - Implement API client**:

```typescript
// libs/shared/web/src/api-client.ts
export interface ApiClientConfig {
    baseUrl: string;
    headers?: Record<string, string>;
    timeout?: number;
}

export class ApiClient {
    private baseUrl: string;
    private defaultHeaders: Record<string, string>;
    private timeout: number;

    constructor(baseUrl: string, config?: Partial<ApiClientConfig>) {
        this.baseUrl = baseUrl;
        this.defaultHeaders = config?.headers || {};
        this.timeout = config?.timeout || 30000;
    }

    async get<T>(path: string, options?: RequestInit): Promise<T> {
        return this.request<T>("GET", path, options);
    }

    async post<T>(path: string, body: unknown, options?: RequestInit): Promise<T> {
        return this.request<T>("POST", path, { ...options, body: JSON.stringify(body) });
    }

    async put<T>(path: string, body: unknown, options?: RequestInit): Promise<T> {
        return this.request<T>("PUT", path, { ...options, body: JSON.stringify(body) });
    }

    async delete<T>(path: string, options?: RequestInit): Promise<T> {
        return this.request<T>("DELETE", path, options);
    }

    private async request<T>(method: string, path: string, options?: RequestInit): Promise<T> {
        const url = `${this.baseUrl}${path}`;
        const headers = {
            "Content-Type": "application/json",
            ...this.defaultHeaders,
            ...(options?.headers || {}),
        };

        const response = await fetch(url, {
            method,
            headers,
            ...options,
            signal: AbortSignal.timeout(this.timeout),
        });

        if (!response.ok) {
            throw new ApiError(response.status, await response.text());
        }

        return response.json();
    }
}

export class ApiError extends Error {
    constructor(
        public status: number,
        message: string,
    ) {
        super(`API Error ${status}: ${message}`);
        this.name = "ApiError";
    }
}
```

4. **Implement Zod schemas**:

```typescript
// libs/shared/web/src/schemas.ts
import { z } from "zod";

// Base schemas that mirror Supabase types
export const UuidSchema = z.string().uuid();
export const EmailSchema = z.string().email();
export const TimestampSchema = z.string().datetime();

// Domain schemas (will integrate with Supabase types in PHASE-004)
export const UserSchema = z.object({
    id: UuidSchema,
    email: EmailSchema,
    created_at: TimestampSchema,
    updated_at: TimestampSchema,
});

export type User = z.infer<typeof UserSchema>;

// Export validation helpers
export const validateUser = (data: unknown): User => {
    return UserSchema.parse(data);
};
```

5. **Environment configuration**:

```typescript
// libs/shared/web/src/env.ts
/**
 * Framework-agnostic environment variable access
 * Supports Next.js, Remix, Expo env patterns
 */
export const env = {
    // API configuration
    API_URL: getEnvVar("NEXT_PUBLIC_API_URL", "PUBLIC_API_URL", "EXPO_PUBLIC_API_URL") || "http://localhost:8000",

    // Supabase configuration (for direct client usage)
    SUPABASE_URL: getEnvVar("NEXT_PUBLIC_SUPABASE_URL", "PUBLIC_SUPABASE_URL", "EXPO_PUBLIC_SUPABASE_URL"),
    SUPABASE_ANON_KEY: getEnvVar("NEXT_PUBLIC_SUPABASE_ANON_KEY", "PUBLIC_SUPABASE_ANON_KEY", "EXPO_PUBLIC_SUPABASE_ANON_KEY"),
};

function getEnvVar(...keys: string[]): string | undefined {
    for (const key of keys) {
        const value = process.env[key];
        if (value) return value;
    }
    return undefined;
}
```

6. **🔵 REFACTOR Phase - Add error handling and utilities**:

```typescript
// libs/shared/web/src/error-handler.ts
import { ApiError } from "./api-client";

export interface ErrorResponse {
    message: string;
    code: string;
    details?: unknown;
}

export function handleApiError(error: unknown): ErrorResponse {
    if (error instanceof ApiError) {
        return {
            message: error.message,
            code: `HTTP_${error.status}`,
            details: error.status,
        };
    }

    if (error instanceof Error) {
        return {
            message: error.message,
            code: "UNKNOWN_ERROR",
        };
    }

    return {
        message: "An unexpected error occurred",
        code: "UNKNOWN_ERROR",
    };
}
```

**Exit Criteria**:

-   [ ] `libs/shared/web` library created with buildable configuration
-   [ ] ApiClient implemented with GET/POST/PUT/DELETE methods
-   [ ] Zod schemas defined for common domain types
-   [ ] Environment configuration supports Next.js/Remix/Expo patterns
-   [ ] Error handling utilities complete
-   [ ] All unit tests pass: `pnpm nx test shared-web`
-   [ ] Build succeeds: `pnpm nx build shared-web`
-   [ ] **Traceability**: Code references DEV-ADR-028, DEV-SDS-028

---

## Phase 2: Framework Generators (Cycles B + C + D) (Sprint 1, Days 2-3)

### Task 2A: Next.js Generator (App Router + Pages Router)

**What**: Create generator supporting both App Router (RSC) and Pages Router patterns

**Branch**: `feature/gen-nextjs`

**Dependencies**: Task 1A complete (shared web library exists)

**Implementation Steps**:

1. **Create generator structure**:

```bash
pnpm exec nx g @nx/plugin:generator web-app --project=ddd-plugin
```

2. **Define schema** at `generators/web-app/schema.json`:

```json
{
    "$schema": "https://json-schema.org/draft-07/schema",
    "id": "WebApp",
    "title": "Create a web application",
    "type": "object",
    "properties": {
        "name": {
            "type": "string",
            "description": "Application name",
            "$default": { "$source": "argv", "index": 0 }
        },
        "framework": {
            "type": "string",
            "description": "Web framework",
            "enum": ["next", "remix", "expo"],
            "x-prompt": "Which framework would you like to use?"
        },
        "routerStyle": {
            "type": "string",
            "description": "Next.js router style (only for framework=next)",
            "enum": ["app", "pages"],
            "default": "app"
        },
        "directory": {
            "type": "string",
            "description": "Directory where the app is placed",
            "default": "apps"
        },
        "tags": {
            "type": "string",
            "description": "Tags for Nx dependency graph"
        }
    },
    "required": ["name", "framework"]
}
```

3. **Implement generator logic** at `generators/web-app/generator.ts`:

```typescript
import { Tree, formatFiles, installPackagesTask, generateFiles, joinPathFragments } from "@nx/devkit";
import { WebAppGeneratorSchema } from "./schema";

export async function webAppGenerator(tree: Tree, options: WebAppGeneratorSchema) {
    const projectRoot = joinPathFragments(options.directory, options.name);

    // Choose template based on framework
    if (options.framework === "next") {
        await generateNextApp(tree, options, projectRoot);
    } else if (options.framework === "remix") {
        await generateRemixApp(tree, options, projectRoot);
    } else if (options.framework === "expo") {
        await generateExpoApp(tree, options, projectRoot);
    }

    await formatFiles(tree);
    return () => {
        installPackagesTask(tree);
    };
}

async function generateNextApp(tree: Tree, options: WebAppGeneratorSchema, projectRoot: string) {
    const templatePath = options.routerStyle === "app" ? "./files/next-app" : "./files/next-pages";

    generateFiles(tree, joinPathFragments(__dirname, templatePath), projectRoot, {
        ...options,
        tmpl: "",
        offsetFromRoot: "../../", // Adjust based on depth
    });

    // Add to workspace
    addProjectConfiguration(tree, options.name, {
        root: projectRoot,
        projectType: "application",
        sourceRoot: `${projectRoot}/src`,
        targets: {
            build: {
                executor: "@nx/next:build",
                options: { outputPath: `dist/${projectRoot}` },
            },
            serve: {
                executor: "@nx/next:server",
                options: { dev: true, port: 3000 },
            },
        },
        tags: options.tags?.split(",") || ["type:application", "framework:next"],
    });
}
```

4. **Create Next.js App Router templates** at `generators/web-app/files/next-app/`:

```typescript
// app/page.tsx__tmpl__
import { ApiClient } from '@shared/web';

export default async function HomePage() {
  const client = new ApiClient(process.env.NEXT_PUBLIC_API_URL!);

  try {
    const data = await client.get<{ message: string }>('/api/health');
    return (
      <main>
        <h1>Welcome to <%= name %></h1>
        <p>{data.message}</p>
      </main>
    );
  } catch (error) {
    return <div>Error loading data</div>;
  }
}
```

```typescript
// app/layout.tsx__tmpl__
import "./global.css";

export const metadata = {
    title: "<%= name %>",
    description: "Generated by VibesPro",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
```

5. **Create Next.js Pages Router templates** at `generators/web-app/files/next-pages/`:

```typescript
// pages/index.tsx__tmpl__
import { GetServerSideProps } from 'next';
import { ApiClient } from '@shared/web';

interface HomePageProps {
  data: { message: string };
}

export default function HomePage({ data }: HomePageProps) {
  return (
    <main>
      <h1>Welcome to <%= name %></h1>
      <p>{data.message}</p>
    </main>
  );
}

export const getServerSideProps: GetServerSideProps<HomePageProps> = async () => {
  const client = new ApiClient(process.env.NEXT_PUBLIC_API_URL!);
  const data = await client.get<{ message: string }>('/api/health');

  return { props: { data } };
};
```

6. **Add Next.js configuration templates**:

```javascript
// next.config.js__tmpl__
/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    transpilePackages: ["@shared/web"],
    env: {
        NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    },
};

module.exports = nextConfig;
```

**Exit Criteria**:

-   [ ] Generator creates App Router apps with RSC patterns
-   [ ] Generator creates Pages Router apps with getServerSideProps
-   [ ] Both styles import from `@shared/web` (no duplication)
-   [ ] Generated apps include next.config.js with proper transpilation
-   [ ] `pnpm nx build <generated-app>` succeeds for both router styles
-   [ ] Tests validate both `--routerStyle=app` and `--routerStyle=pages`
-   [ ] **Traceability**: Generator references DEV-ADR-028, DEV-PRD-029

---

### Task 2B: Remix Generator

**What**: Create generator for Remix v2.15+ apps with loader/action patterns

**Branch**: `feature/gen-remix`

**Dependencies**: Task 1A complete

**Implementation Steps**:

1. **Extend generator from Task 2A** to handle `framework=remix`:

```typescript
async function generateRemixApp(tree: Tree, options: WebAppGeneratorSchema, projectRoot: string) {
    generateFiles(tree, joinPathFragments(__dirname, "./files/remix"), projectRoot, {
        ...options,
        tmpl: "",
    });

    addProjectConfiguration(tree, options.name, {
        root: projectRoot,
        projectType: "application",
        sourceRoot: `${projectRoot}/app`,
        targets: {
            build: {
                executor: "@nx/remix:build",
                options: { outputPath: `dist/${projectRoot}` },
            },
            serve: {
                executor: "@nx/remix:serve",
                options: { port: 3000 },
            },
        },
        tags: options.tags?.split(",") || ["type:application", "framework:remix"],
    });
}
```

2. **Create Remix templates** at `generators/web-app/files/remix/`:

```typescript
// app/routes/_index.tsx__tmpl__
import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { ApiClient, env } from '@shared/web';

export async function loader({ request }: LoaderFunctionArgs) {
  const client = new ApiClient(env.API_URL);
  const data = await client.get<{ message: string }>('/api/health');
  return json(data);
}

export default function Index() {
  const data = useLoaderData<typeof loader>();

  return (
    <main>
      <h1>Welcome to <%= name %></h1>
      <p>{data.message}</p>
    </main>
  );
}
```

```typescript
// app/root.tsx__tmpl__
import { Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration } from "@remix-run/react";

export default function App() {
    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <Meta />
                <Links />
            </head>
            <body>
                <Outlet />
                <ScrollRestoration />
                <Scripts />
                <LiveReload />
            </body>
        </html>
    );
}
```

3. **Add Remix configuration**:

```javascript
// remix.config.js__tmpl__
/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
    ignoredRouteFiles: ["**/.*"],
    serverModuleFormat: "esm",
    future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
    },
};
```

**Exit Criteria**:

-   [ ] Generator creates Remix v2.15+ apps with loader patterns
-   [ ] Generated app imports from `@shared/web`
-   [ ] `pnpm nx build <remix-app>` succeeds
-   [ ] Loader functions use ApiClient correctly
-   [ ] **Traceability**: Code references DEV-ADR-028, DEV-PRD-029

---

### Task 2C: Expo Generator

**What**: Create generator for React Native apps using Expo

**Branch**: `feature/gen-expo`

**Dependencies**: Task 1A complete

**Implementation Steps**:

1. **Extend generator** to handle `framework=expo`:

```typescript
async function generateExpoApp(tree: Tree, options: WebAppGeneratorSchema, projectRoot: string) {
    generateFiles(tree, joinPathFragments(__dirname, "./files/expo"), projectRoot, {
        ...options,
        tmpl: "",
    });

    addProjectConfiguration(tree, options.name, {
        root: projectRoot,
        projectType: "application",
        sourceRoot: `${projectRoot}/src`,
        targets: {
            start: {
                executor: "@nx/expo:start",
                options: { port: 8081 },
            },
            build: {
                executor: "@nx/expo:build",
                options: { platform: "all" },
            },
        },
        tags: options.tags?.split(",") || ["type:application", "framework:expo", "platform:mobile"],
    });
}
```

2. **Create Expo templates** at `generators/web-app/files/expo/`:

```typescript
// App.tsx__tmpl__
import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { ApiClient, env } from '@shared/web';

export default function App() {
  const [data, setData] = useState<{ message: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const client = new ApiClient(env.API_URL);

    client.get<{ message: string }>('/api/health')
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
      <Text style={styles.title}>Welcome to <%= name %></Text>
      <Text>{data?.message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
});
```

```json
// app.json__tmpl__
{
    "expo": {
        "name": "<%= name %>",
        "slug": "<%= name %>",
        "version": "1.0.0",
        "orientation": "portrait",
        "icon": "./assets/icon.png",
        "userInterfaceStyle": "light",
        "splash": {
            "image": "./assets/splash.png",
            "resizeMode": "contain",
            "backgroundColor": "#ffffff"
        },
        "assetBundlePatterns": ["**/*"],
        "ios": {
            "supportsTablet": true
        },
        "android": {
            "adaptiveIcon": {
                "foregroundImage": "./assets/adaptive-icon.png",
                "backgroundColor": "#ffffff"
            }
        },
        "web": {
            "favicon": "./assets/favicon.png"
        }
    }
}
```

**Exit Criteria**:

-   [ ] Generator creates Expo apps with React Native setup
-   [ ] Generated app imports from `@shared/web` (platform-agnostic fetch)
-   [ ] `pnpm nx start <expo-app>` succeeds
-   [ ] API client works in React Native environment
-   [ ] **Traceability**: Code references DEV-ADR-028, DEV-PRD-029

---

## Phase 3: Validation & Documentation (Cycle E) (Sprint 1, Day 4)

### Task 3A: Idempotency Validation

**What**: Ensure all generators pass double-run tests with hash stability

**Branch**: `feature/gen-react-idempotency`

**Dependencies**: Tasks 2A, 2B, 2C complete

**Implementation Steps**:

1. **Create ShellSpec tests** at `tests/generators/react_spec.sh`:

```bash
#!/bin/bash
# ShellSpec tests for React generator idempotency

Describe 'React Generator Idempotency'
  Describe 'Next.js App Router'
    It 'generates identical output on second run'
      # Clean slate
      rm -rf tmp/test-next-app

      # First generation
      pnpm exec nx g @ddd-plugin/ddd:web-app test-next-app \
        --framework=next --routerStyle=app --directory=tmp --no-interactive
      first_hash=$(find tmp/test-next-app -type f -exec sha256sum {} \; | sort | sha256sum)

      # Second generation
      pnpm exec nx g @ddd-plugin/ddd:web-app test-next-app \
        --framework=next --routerStyle=app --directory=tmp --no-interactive
      second_hash=$(find tmp/test-next-app -type f -exec sha256sum {} \; | sort | sha256sum)

      The variable first_hash should equal "$second_hash"

      # Cleanup
      rm -rf tmp/test-next-app
    End
  End

  Describe 'Next.js Pages Router'
    It 'generates identical output on second run'
      rm -rf tmp/test-next-pages

      pnpm exec nx g @ddd-plugin/ddd:web-app test-next-pages \
        --framework=next --routerStyle=pages --directory=tmp --no-interactive
      first_hash=$(find tmp/test-next-pages -type f -exec sha256sum {} \; | sort | sha256sum)

      pnpm exec nx g @ddd-plugin/ddd:web-app test-next-pages \
        --framework=next --routerStyle=pages --directory=tmp --no-interactive
      second_hash=$(find tmp/test-next-pages -type f -exec sha256sum {} \; | sort | sha256sum)

      The variable first_hash should equal "$second_hash"

      rm -rf tmp/test-next-pages
    End
  End

  Describe 'Remix'
    It 'generates identical output on second run'
      rm -rf tmp/test-remix

      pnpm exec nx g @ddd-plugin/ddd:web-app test-remix \
        --framework=remix --directory=tmp --no-interactive
      first_hash=$(find tmp/test-remix -type f -exec sha256sum {} \; | sort | sha256sum)

      pnpm exec nx g @ddd-plugin/ddd:web-app test-remix \
        --framework=remix --directory=tmp --no-interactive
      second_hash=$(find tmp/test-remix -type f -exec sha256sum {} \; | sort | sha256sum)

      The variable first_hash should equal "$second_hash"

      rm -rf tmp/test-remix
    End
  End

  Describe 'Expo'
    It 'generates identical output on second run'
      rm -rf tmp/test-expo

      pnpm exec nx g @ddd-plugin/ddd:web-app test-expo \
        --framework=expo --directory=tmp --no-interactive
      first_hash=$(find tmp/test-expo -type f -exec sha256sum {} \; | sort | sha256sum)

      pnpm exec nx g @ddd-plugin/ddd:web-app test-expo \
        --framework=expo --directory=tmp --no-interactive
      second_hash=$(find tmp/test-expo -type f -exec sha256sum {} \; | sort | sha256sum)

      The variable first_hash should equal "$second_hash"

      rm -rf tmp/test-expo
    End
  End
End
```

2. **Create integration tests** at `tests/integration/react-generator.test.ts`:

```typescript
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

describe("React Generator Integration", () => {
    const tmpDir = "tmp/gen-tests";

    beforeAll(() => {
        fs.mkdirSync(tmpDir, { recursive: true });
    });

    afterAll(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it("Next.js App Router app builds successfully", () => {
        const appName = "test-next-app-build";

        execSync(`pnpm exec nx g @ddd-plugin/ddd:web-app ${appName} --framework=next --routerStyle=app --directory=${tmpDir} --no-interactive`, { stdio: "pipe" });

        const buildOutput = execSync(`pnpm exec nx build ${appName}`, {
            encoding: "utf-8",
            stdio: "pipe",
        });

        expect(buildOutput).toContain("Successfully");
    }, 120000);

    it("Next.js Pages Router app builds successfully", () => {
        const appName = "test-next-pages-build";

        execSync(`pnpm exec nx g @ddd-plugin/ddd:web-app ${appName} --framework=next --routerStyle=pages --directory=${tmpDir} --no-interactive`, { stdio: "pipe" });

        const buildOutput = execSync(`pnpm exec nx build ${appName}`, {
            encoding: "utf-8",
            stdio: "pipe",
        });

        expect(buildOutput).toContain("Successfully");
    }, 120000);

    it("Remix app builds successfully", () => {
        const appName = "test-remix-build";

        execSync(`pnpm exec nx g @ddd-plugin/ddd:web-app ${appName} --framework=remix --directory=${tmpDir} --no-interactive`, { stdio: "pipe" });

        const buildOutput = execSync(`pnpm exec nx build ${appName}`, {
            encoding: "utf-8",
            stdio: "pipe",
        });

        expect(buildOutput).toContain("Built in");
    }, 120000);

    it("Expo app bundles successfully", () => {
        const appName = "test-expo-build";

        execSync(`pnpm exec nx g @ddd-plugin/ddd:web-app ${appName} --framework=expo --directory=${tmpDir} --no-interactive`, { stdio: "pipe" });

        // Expo build takes longer, just verify project structure
        const appJsonPath = path.join(tmpDir, appName, "app.json");
        expect(fs.existsSync(appJsonPath)).toBe(true);
    }, 120000);
});
```

3. **Add justfile recipe**:

```bash
# justfile
test-generators-react:
    @echo "Testing React generators..."
    shellspec tests/generators/react_spec.sh
    pnpm test:integration --testPathPatterns=react-generator
```

**Exit Criteria**:

-   [ ] All 4 frameworks pass double-run hash stability tests
-   [ ] All 4 frameworks build successfully in CI
-   [ ] ShellSpec tests pass: `shellspec tests/generators/react_spec.sh`
-   [ ] Integration tests pass: `pnpm test:integration --testPathPatterns=react-generator`
-   [ ] **Traceability**: Tests reference idempotency requirements

---

### Task 3B: Documentation & Examples

**What**: Document generator usage with framework-specific examples

**Implementation Steps**:

1. **Update generator README** at `generators/web-app/README.md`:

````markdown
# Web App Generator

Universal generator for Next.js, Remix, and Expo applications with shared type-safe infrastructure.

## Usage

### Next.js App Router (React Server Components)

```bash
pnpm exec nx g @ddd-plugin/ddd:web-app my-app --framework=next --routerStyle=app
```
````

### Next.js Pages Router (Traditional SSR)

```bash
pnpm exec nx g @ddd-plugin/ddd:web-app my-app --framework=next --routerStyle=pages
```

### Remix

```bash
pnpm exec nx g @ddd-plugin/ddd:web-app my-app --framework=remix
```

### Expo (React Native)

```bash
pnpm exec nx g @ddd-plugin/ddd:web-app my-app --framework=expo
```

## Shared Infrastructure

All generated apps import from `@shared/web`:

-   `ApiClient` - Type-safe HTTP client
-   Zod schemas - Runtime validation
-   Error handling utilities
-   Framework-agnostic env config

## Architecture

Generated apps follow hexagonal architecture:

-   UI layer → Application layer → Domain layer
-   Nx boundaries enforce no infrastructure in UI

```

```

2. **Update main docs** at `docs/ARCHITECTURE.md` (add section):

```markdown
## Frontend Architecture

### Universal React Generator

VibesPro provides a single generator that scaffolds Next.js, Remix, or Expo apps with consistent patterns.

**Shared Assets** (`libs/shared/web`):

-   Type-safe API client with error handling
-   Zod validation schemas
-   Environment configuration (multi-framework)

**Framework Patterns**:

-   Next.js App Router: RSC with async server components
-   Next.js Pages Router: getServerSideProps/getStaticProps
-   Remix: loader/action patterns with deferred data
-   Expo: React hooks with platform-agnostic fetch

**Hexagonal Boundaries**:

-   UI components (type:application, framework:next/remix/expo)
-   API client (type:infrastructure)
-   Domain logic (type:domain) - shared across all surfaces
```

3. **Add to traceability matrix** at `docs/traceability_matrix.md`:

```markdown
| Spec ID     | Implementation                     | Tests                                     | Status |
| ----------- | ---------------------------------- | ----------------------------------------- | ------ |
| DEV-ADR-028 | generators/web-app/generator.ts    | tests/generators/react_spec.sh            | ✅     |
| DEV-PRD-029 | generators/web-app/files/next-app/ | tests/integration/react-generator.test.ts | ✅     |
| DEV-SDS-028 | libs/shared/web/src/api-client.ts  | libs/shared/web/src/api-client.test.ts    | ✅     |
```

**Exit Criteria**:

-   [ ] Generator README documents all 4 frameworks
-   [ ] Architecture docs explain shared infrastructure
-   [ ] Traceability matrix updated with PHASE-003 implementations
-   [ ] Examples included for each framework

---

## Pre-Work: Required Reading (35 min)

**Priority Order** (read in this sequence):

1. `docs/dev_adr.md` (section DEV-ADR-028) — 5 min: Universal generator pattern decision
2. `docs/dev_sds.md` (section DEV-SDS-028) — 10 min: Shared assets strategy and API client design
3. `docs/dev_prd.md` (section DEV-PRD-029) — 5 min: Framework-specific requirements
4. `docs/plans/hexddd_integration/PHASE-001-GENERATOR_IDEMPOTENCY.md` — 10 min: Idempotency patterns to reuse
5. `docs/plans/hexddd_integration/PHASE-002-HEXAGONAL_FOUNDATIONS.md` — 5 min: UoW/EventBus patterns for reference
6. Skim: `.github/instructions/generators-first.instructions.md`, `docs/ARCHITECTURE.md` — Context on generator-first approach

**Context Check**: After reading, you should understand:

-   Universal generator pattern (one generator, multiple frameworks)
-   Shared web library purpose (eliminate duplication)
-   Idempotency enforcement (hash stability, double-run tests)
-   Hexagonal boundaries (UI → Application → Domain)
-   Framework-specific patterns (RSC vs SSR vs loaders vs hooks)

---

## Execution Protocol

### Decision-Making Authority

You are **authorized** to:

-   Choose template file naming conventions (`.tsx__tmpl__` vs `__name__.tsx`)
-   Add framework-specific optimizations (prefetching, caching)
-   Create additional utility functions in `@shared/web`
-   Add more Zod schemas for common types
-   Choose styling approaches (CSS modules, Tailwind, styled-components)

You **must ask** before:

-   Adding npm packages beyond Next.js/Remix/Expo essentials
-   Changing shared web library public API (ApiClient interface)
-   Modifying generator schema (required properties, enums)
-   Adding new frameworks beyond Next.js/Remix/Expo
-   Changing Nx project configuration structure

### Quality Gates

Run after **each task** completion:

```bash
# Shared web library (Task 1A)
pnpm nx test shared-web                      # Must pass - unit tests
pnpm nx build shared-web                     # Must pass - buildable output
pnpm nx lint shared-web                      # Must pass - ESLint

# Generator tasks (2A, 2B, 2C)
pnpm exec nx g @ddd-plugin/ddd:web-app test-<framework> --framework=<framework> --no-interactive
pnpm nx build test-<framework>               # Must pass - generated app builds
pnpm nx lint test-<framework>                # Must pass - generated app lints

# Idempotency (Task 3A)
shellspec tests/generators/react_spec.sh     # Must pass - double-run tests
pnpm test:integration --testPathPatterns=react-generator  # Must pass
```

**After all tasks complete**:

```bash
pnpm nx run-many -t build --all              # Must pass - all apps build
pnpm nx run-many -t lint --all               # Must pass - all lint checks
pnpm nx run-many -t test --all               # Must pass - all tests
just spec-guard                              # Must pass - spec matrix + prompt lint
```

### Iteration Protocol

If any check fails:

1. Analyze failure root cause (build error, lint violation, test failure)
2. Fix issue following TDD if applicable
3. Re-run quality gates for affected task
4. Continue until all pass

**Do not proceed to next task with failing checks.**

---

## Output Format

After completing each task, provide:

```markdown
## [Task ID] Status: [COMPLETE|BLOCKED]

### Changes Made

-   Created: [list of new files with paths]
-   Modified: [list of changed files with paths]
-   Key implementation decisions: [bullet list]

### Verification Results

-   [ ] Tests pass: `<test command>` (X/X tests passing)
-   [ ] Build passes: `<build command>` (0 errors)
-   [ ] Lint passes: `<lint command>` (0 violations)
-   [ ] Documentation updated: [affected files]

### Generated Artifacts

-   [ ] Framework: [next/remix/expo]
-   [ ] Router style: [app/pages/n/a]
-   [ ] Build output: [path to dist]
-   [ ] Example usage: [command to generate + build]

### Traceability

-   Spec IDs referenced: [DEV-ADR-XXX, DEV-SDS-XXX, DEV-PRD-XXX]
-   Commit message: [example conventional commit message with spec IDs]

### Blockers (if any)

[Description + proposed solution + help needed]

### Next Steps

[What task comes next]
```

---

## Anti-Patterns to Avoid

❌ **Don't**: Duplicate API client logic in each framework template
✅ **Do**: Import `ApiClient` from `@shared/web` in all templates

❌ **Don't**: Hardcode API URLs in templates
✅ **Do**: Use `env.API_URL` from shared env config

❌ **Don't**: Create framework-specific validation schemas
✅ **Do**: Use shared Zod schemas from `@shared/web`

❌ **Don't**: Skip idempotency tests ("generator seems to work")
✅ **Do**: Run double-run hash stability tests for all frameworks

❌ **Don't**: Mix template syntaxes (some use `<%= %>`, others use `__name__`)
✅ **Do**: Choose one template syntax and use consistently

❌ **Don't**: Generate apps that violate Nx boundaries (UI imports infrastructure directly)
✅ **Do**: Route all API calls through `@shared/web` which sits in infrastructure layer

❌ **Don't**: Skip documentation ("code is self-explanatory")
✅ **Do**: Document usage examples for each framework with runnable commands

---

## Codebase Intelligence Sources

**Essential Files**:

-   `docs/ARCHITECTURE.md` — Hexagonal layer definitions
-   `docs/dev_adr.md` — ADR-028 (universal generator pattern)
-   `docs/dev_sds.md` — SDS-028 (shared assets strategy)
-   `docs/dev_prd.md` — PRD-029 (framework requirements)
-   `.github/instructions/generators-first.instructions.md` — Generator-first development
-   `.github/instructions/testing.instructions.md` — TDD workflow

**Reference Implementations**:

-   Check `generators/` for existing generator patterns
-   Study `libs/` for library structure examples
-   Review `nx.json` for project configuration patterns

**API/Library Documentation**:

-   Nx Plugin API: https://nx.dev/extending-nx/intro/getting-started
-   Next.js Documentation: https://nextjs.org/docs
-   Remix Documentation: https://remix.run/docs
-   Expo Documentation: https://docs.expo.dev
-   Zod: https://zod.dev

**Related Prior Work**:

-   PHASE-001: Idempotency patterns (reference for double-run tests)
-   PHASE-002: Hexagonal foundations (UoW/EventBus patterns)

---

## Special Considerations

### Performance

-   Shared web library must tree-shake properly (use named exports)
-   API client should support request cancellation (AbortController)
-   Consider bundle size for Expo (React Native has stricter limits)

### Security

-   Never commit example `.env` files with real API keys
-   Use environment variable validation in shared env config
-   API client should sanitize URLs to prevent SSRF

### Compatibility

-   Next.js: Support both 13.x and 14.x (App Router stable in 13.4+)
-   Remix: Target v2.15+ for stable Vite support
-   Expo: Use SDK 50+ for latest React Native
-   Node.js LTS per `.mise.toml`

### Framework-Specific Gotchas

-   **Next.js App Router**: Server components can't use hooks—only client components
-   **Next.js Pages Router**: getServerSideProps runs only on server, not in browser
-   **Remix**: Loaders run on server and client during hydration
-   **Expo**: `process.env` not available—use `expo-constants` for env vars

### Observability

-   Add request IDs to API client for distributed tracing
-   Log framework type and router style during generation
-   Consider integration with Logfire (from PHASE-002 Supabase stack)

---

## Begin Execution

Start with **Pre-Work reading**, then proceed to **Phase 1, Task 1A** (Shared Web Assets).

**Workflow**:

1. Read all pre-work docs (35 min)
2. Create branch `feature/shared-web-assets`
3. Follow TDD cycle for Task 1A (🔴 RED → 🟢 GREEN → 🔵 REFACTOR)
4. Run quality gates
5. Report status using output format
6. Proceed to Phase 2 (Tasks 2A, 2B, 2C can run in parallel if desired)
7. Complete Phase 3 (Task 3A validation + 3B docs)
8. Run final validation
9. Update `docs/plans/hexddd_integration/PHASE-003-UNIVERSAL_REACT_GENERATOR.md` status to GREEN
10. Update `docs/traceability_matrix.md` with new implementations

Report status after completing each task using the output format above.

---

**Traceability Matrix Update Required**: After phase completion, add entries mapping:

-   DEV-ADR-028 → `generators/web-app/generator.ts`
-   DEV-SDS-028 → `libs/shared/web/src/api-client.ts`, `libs/shared/web/src/schemas.ts`
-   DEV-PRD-029 → `generators/web-app/files/next-app/`, `generators/web-app/files/remix/`, `generators/web-app/files/expo/`
