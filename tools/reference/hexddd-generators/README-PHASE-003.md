# PHASE-003 Wrapper Generators

Nx wrapper generators that compose official framework generators with VibesPro's shared infrastructure and hexagonal architecture patterns.

## Overview

This phase implements wrapper generators for:

- **Frontend**: Next.js (App Router + Pages Router), Remix, Expo
- **Backend**: FastAPI with Logfire + Hexagonal Architecture

All generators follow the **composition pattern**: delegate to official Nx generators, then apply VibesPro-specific transformations.

## Usage

### Frontend Web App Generator

Generate Next.js, Remix, or Expo apps with shared-web integration:

```bash
# Next.js with App Router (RSC)
nx g @vibes-pro/ddd:web-app my-app --framework=next --routerStyle=app

# Next.js with Pages Router (SSR)
nx g @vibes-pro/ddd:web-app my-app --framework=next --routerStyle=pages

# Remix
nx g @vibes-pro/ddd:web-app my-app --framework=remix

# Expo (React Native)
nx g @vibes-pro/ddd:web-app my-app --framework=expo
```

### Backend API Service Generator

Generate FastAPI services with Logfire instrumentation and hexagonal architecture:

```bash
# Full-featured FastAPI service
nx g @vibes-pro/ddd:api-service my-api

# Without Logfire
nx g @vibes-pro/ddd:api-service my-api --withLogfire=false

# Without hexagonal structure
nx g @vibes-pro/ddd:api-service my-api --withHexagonal=false

# Custom directory
nx g @vibes-pro/ddd:api-service my-api --directory=services
```

## What Gets Generated

### Frontend Apps

All frontend apps receive:

1. **Shared-web integration**: Automatic imports from `@shared/web`
2. **API client helpers**: Framework-specific wrappers around `fetchJson`
3. **Example usage**: Working examples of API calls in the framework's pattern

**Next.js App Router** (`app/page.tsx`):

```typescript
import { fetchJson, ENV } from '@shared/web';
// RSC-ready API calls
```

**Next.js Pages Router** (`pages/index.tsx`):

```typescript
import { fetchJson, ENV } from '@shared/web';
import type { GetServerSideProps } from 'next';
// getServerSideProps pattern
```

**Remix** (`app/routes/_index.tsx`):

```typescript
import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { fetchJson, ENV } from '@shared/web';
// Loader/action pattern
```

**Expo** (`App.tsx`):

```typescript
import { fetchJson, ENV } from '@shared/web';
import { View, Text } from 'react-native';
// React Native compatible
```

### Backend Services

FastAPI services receive:

1. **Hexagonal Architecture** (default):

    ```
    apps/my-api/
    ├── domain/
    │   ├── entities/
    │   └── value_objects/
    ├── application/
    │   ├── ports/
    │   │   └── repository.py      # Protocol definitions
    │   └── use_cases/
    ├── infrastructure/
    │   └── adapters/
    │       ├── in_memory/          # Test adapters
    │       └── supabase/           # Production adapters
    ├── main.py                     # FastAPI app
    ├── schemas.py                  # Pydantic models
    └── tests/
        └── test_main.py
    ```

2. **Logfire Instrumentation** (default):
    - Automatic bootstrap in `main.py`
    - Configured logger with categories
    - Structured logging ready to use

3. **Pydantic Type Sync**:
    - `schemas.py` with `BaseSchema`
    - Ready for auto-generation from Supabase (PHASE-004)

4. **OpenAPI Export**:
    - `/api/openapi.json` endpoint
    - Enables frontend type generation

## Shared Web Library

The `@shared/web` library is automatically created/ensured with:

```typescript
// libs/shared/web/src/lib/client.ts
export async function fetchJson<T>(url: string): Promise<T>;

// libs/shared/web/src/lib/errors.ts
export type AppError = ValidationError | NetworkError | UnexpectedError;

// libs/shared/web/src/lib/env.ts
export const ENV = { API_URL: process.env.NX_API_URL ?? '/api' };

// libs/shared/web/src/lib/schemas.ts
// Zod schemas (to be expanded in PHASE-004)
```

## Idempotency

All generators are **fully idempotent**:

- Multiple runs produce identical output
- Guards prevent duplicate injections
- Existing files are checked before writing

Run the same generator twice:

```bash
nx g @vibes-pro/ddd:web-app test-app --framework=next
nx g @vibes-pro/ddd:web-app test-app --framework=next  # No duplicates
```

## Testing

### Unit Tests

```bash
# Test web-app generator
nx test hexddd-generators --testFile=web-app/generator.spec.ts

# Test api-service generator
nx test hexddd-generators --testFile=api-service/generator.spec.ts
```

### Integration Tests

```bash
# Run full integration test suite
bash tests/integration/phase-003-generators.sh
```

This validates:

- All 4 frontend/backend generators work
- Shared-web integration is correct
- Hexagonal structure is complete
- Logfire instrumentation is present
- OpenAPI export is configured

## Architecture

### Composition Pattern

```typescript
export async function webAppGenerator(tree: Tree, options: Schema) {
    // 1. Delegate to official Nx generator
    await tryGenerateNextApp(tree, options);

    // 2. Apply VibesPro transformations
    if (options.apiClient !== false) {
        await injectSharedWebIntoNextApp(tree, options);
    }

    // 3. Ensure shared library exists
    ensureSharedWeb(tree, options);
}
```

**Benefits**:

- Nx updates flow through automatically
- Minimal maintenance burden (~60% less code)
- Official generator features work out of the box

### Transformation Guards

All transformations check before modifying:

```typescript
if (content.includes('@shared/web')) {
    return; // Already injected, skip
}
```

This ensures **true idempotency**.

## What's Next

**PHASE-004**: Type Safety & CI Integration

- Strict TypeScript/Python type checking
- Automated type sync from Supabase
- CI/CD pipeline integration

**PHASE-005**: Integration & Documentation

- End-to-end examples
- Deployment guides
- Performance benchmarks

## Traceability

| Component       | Plan              | Implementation             | Tests |
| --------------- | ----------------- | -------------------------- | ----- |
| Next.js Wrapper | PHASE-003 Cycle B | `web-app/generator.ts`     | ✅    |
| Remix Wrapper   | PHASE-003 Cycle C | `web-app/generator.ts`     | ✅    |
| Expo Wrapper    | PHASE-003 Cycle D | `web-app/generator.ts`     | ✅    |
| FastAPI Wrapper | PHASE-003 Cycle F | `api-service/generator.ts` | ✅    |
| Shared Web Lib  | PHASE-003 Cycle A | Merged (commit `3e4d6dc`)  | ✅    |
| Idempotency     | PHASE-003 Cycle E | All generators             | ✅    |

## References

- **Plan**: `docs/plans/hexddd_integration/PHASE-003-UNIVERSAL_REACT_GENERATOR.md`
- **Prompt**: `docs/plans/hexddd_integration/PHASE-003-PROMPT.md`
- **Nx Composition**: https://nx.dev/extending-nx/recipes/composing-generators
