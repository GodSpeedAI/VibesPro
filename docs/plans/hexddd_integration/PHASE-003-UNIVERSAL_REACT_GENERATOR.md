# PHASE-003: Universal React Generator (Next.js, Remix, Expo)

**Status:** Ready for Execution
**Duration:** 10-12 hours
**Parallelization:** 5 cycles (A, then B ∥ C ∥ D, then E)
**Critical Path:** Yes (A → B → E)
**Dependencies:** PHASE-001 + PHASE-002 complete
**Owner:** Frontend Agent

---

## 🎯 Phase Objectives

Create a single, unified generator that scaffolds Next.js, Remix, or Expo applications with shared type-safe API clients, validation schemas, and hexagonal architecture patterns.

### Success Criteria

-   [ ] Shared web assets library created (`libs/shared/web`)
-   [ ] Next.js generator scaffolds App Router apps
-   [ ] Remix generator scaffolds v2.15+ apps
-   [ ] Expo generator scaffolds React Native apps
-   [ ] All frameworks use shared API client + schemas
-   [ ] All generators idempotent (double-run tests pass)
-   [ ] **Evidence**: All 3 frameworks build successfully

### Traceability

| Requirement | Cycle   | Validation                   |
| ----------- | ------- | ---------------------------- |
| DEV-ADR-028 | All     | Universal generator pattern  |
| DEV-PRD-029 | B, C, D | Framework-specific scaffolds |
| DEV-SDS-028 | A       | Shared assets strategy       |
| Idempotency | E       | Double-run tests             |

---

## 📊 Cycles Overview

| Cycle | Owner          | Branch                          | Depends On | Parallel With | Duration |
| ----- | -------------- | ------------------------------- | ---------- | ------------- | -------- |
| **A** | Frontend Agent | `feature/shared-web-assets`     | PHASE-002  | None          | 2h       |
| **B** | Frontend Agent | `feature/gen-nextjs`            | A          | C, D          | 3h       |
| **C** | Frontend Agent | `feature/gen-remix`             | A          | B, D          | 3h       |
| **D** | Frontend Agent | `feature/gen-expo`              | A          | B, C          | 3h       |
| **E** | Frontend Agent | `feature/gen-react-idempotency` | B, C, D    | None          | 2h       |

---

## ⚡ Cycle A: Shared Web Assets Library

**Owner:** Frontend Agent
**Branch:** `feature/shared-web-assets`
**Duration:** 2 hours

### Objectives

Create `libs/shared/web` with type-safe API client, Zod schemas, error handling, and environment configuration that all React frameworks share.

### Deliverables

```typescript
// libs/shared/web/src/api-client.ts
import type { DatabaseTypes } from "@shared/database-types";

export class ApiClient {
    constructor(private baseUrl: string) {}

    async get<T>(path: string): Promise<T> {
        // Type-safe fetch wrapper
    }
}

// libs/shared/web/src/schemas.ts
import { z } from "zod";

export const UserSchema = z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    // Maps to Supabase-generated types
});

// libs/shared/web/src/env.ts
export const env = {
    API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
    // Framework-agnostic env access
};
```

---

## ⚡ Cycle B: Next.js Generator

**Owner:** Frontend Agent
**Branch:** `feature/gen-nextjs`
**Duration:** 3 hours

### Generator Spec

```typescript
// generators/react/schema.json
{
  "$schema": "https://json-schema.org/draft-07/schema",
  "properties": {
    "name": { "type": "string" },
    "framework": { "enum": ["next", "remix", "expo"] },
    "routerStyle": { "enum": ["app", "pages"], "default": "app" },
    "apiClient": { "type": "boolean", "default": true }
  },
  "required": ["name", "framework"]
}
```

### Implementation

```typescript
// generators/react/files/next/app/page.tsx__tmpl__
import { ApiClient } from "@shared/web";

export default async function HomePage() {
    const client = new ApiClient(process.env.NEXT_PUBLIC_API_URL);
    const data = await client.get("/api/example");
    return <div>{/* Use data */}</div>;
}
```

---

## ⚡ Cycle C: Remix Generator

**Owner:** Frontend Agent
**Branch:** `feature/gen-remix`
**Duration:** 3 hours

### Remix-Specific Patterns

```typescript
// generators/react/files/remix/app/routes/_index.tsx__tmpl__
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { ApiClient, env } from "@shared/web";

export async function loader({ request }: LoaderFunctionArgs) {
    const client = new ApiClient(env.API_URL);
    const data = await client.get("/api/example");
    return json(data);
}

export default function Index() {
    const data = useLoaderData<typeof loader>();
    return <div>{/* Use data */}</div>;
}
```

---

## ⚡ Cycle D: Expo Generator

**Owner:** Frontend Agent
**Branch:** `feature/gen-expo`
**Duration:** 3 hours

### React Native Setup

```typescript
// generators/react/files/expo/App.tsx__tmpl__
import { useState, useEffect } from "react";
import { ApiClient, env } from "@shared/web";
import { Text, View } from "react-native";

export default function App() {
    const [data, setData] = useState(null);

    useEffect(() => {
        const client = new ApiClient(env.API_URL);
        client.get("/api/example").then(setData);
    }, []);

    return (
        <View>
            <Text>{JSON.stringify(data)}</Text>
        </View>
    );
}
```

---

## ⚡ Cycle E: Idempotency Validation

**Owner:** Frontend Agent
**Branch:** `feature/gen-react-idempotency`
**Duration:** 2 hours
**Depends On:** B, C, D complete

### Double-Run Tests

```bash
# tests/generators/react_spec.sh
Describe 'React Generator Idempotency'
  It 'Next.js generator is idempotent'
    nx g @ddd-plugin/ddd:web-app test-next --framework=next
    first_hash=$(find apps/test-next -type f -exec md5sum {} \; | sort | md5sum)

    nx g @ddd-plugin/ddd:web-app test-next --framework=next
    second_hash=$(find apps/test-next -type f -exec md5sum {} \; | sort | md5sum)

    [ "$first_hash" = "$second_hash" ]
  End
End
```

---

## ✅ Phase Validation Checklist

-   [ ] Shared web library: API client + schemas + env
-   [ ] Next.js: Scaffolds App Router with shared assets
-   [ ] Remix: Scaffolds v2.15+ with loaders
-   [ ] Expo: Scaffolds React Native with shared client
-   [ ] All frameworks: Build successfully
-   [ ] Idempotency: All double-run tests pass
-   [ ] **PHASE-003 marked GREEN in Master Plan**

---

**Next Steps**: Proceed to PHASE-004 (Type Safety & CI)
