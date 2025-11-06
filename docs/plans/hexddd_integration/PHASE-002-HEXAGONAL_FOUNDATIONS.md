# PHASE-002: Hexagonal Architecture Foundations

**Status:** Ready for Execution
**Duration:** 8-10 hours
**Parallelization:** 4 cycles (A ∥ B, then C ∥ D)
**Critical Path:** Yes (A → C → D)
**Dependencies:** PHASE-001 complete
**Owner:** Domain Agent

---

## 🎯 Phase Objectives

Establish the core hexagonal architecture abstractions (Unit of Work, Event Bus) and enforcement mechanisms (Nx dependency tags, Supabase dev stack) that all domains will use.

### Success Criteria

-   [ ] Unit of Work contracts implemented in TypeScript and Python
-   [ ] Event Bus abstractions implemented with in-memory defaults
-   [ ] Nx dependency tags configured and enforced via lint
-   [ ] Supabase dev stack operational with Docker Compose
-   [ ] Integration tests validate transactional boundaries
-   [ ] **Evidence**: `pnpm nx run-many -t lint` passes boundary checks

### Traceability

| Requirement | Cycle   | Validation                  |
| ----------- | ------- | --------------------------- |
| DEV-ADR-024 | A, B, C | UoW/EventBus abstractions   |
| DEV-ADR-025 | D       | Nx tag enforcement          |
| DEV-ADR-026 | D       | Supabase dev stack          |
| DEV-PRD-025 | D       | Boundary violations = 0     |
| DEV-PRD-026 | A, B, C | Transactional tests pass    |
| DEV-PRD-027 | D       | Dev stack starts < 5min     |
| DEV-SDS-024 | D       | Tag taxonomy documented     |
| DEV-SDS-025 | A, B, C | Contracts + adapters        |
| DEV-SDS-026 | D       | Docker Compose + Nx targets |

---

## 📊 Cycles Overview

### Cycle Summary Table

| Cycle | Owner          | Branch                     | Depends On | Parallel With | Duration | Deliverables                             |
| ----- | -------------- | -------------------------- | ---------- | ------------- | -------- | ---------------------------------------- |
| **A** | Domain Agent   | `feature/uow-typescript`   | PHASE-001  | B             | 3h       | UoW TS contracts + in-memory adapter     |
| **B** | Domain Agent   | `feature/uow-python`       | PHASE-001  | A             | 3h       | UoW Python protocols + in-memory adapter |
| **C** | Domain Agent   | `feature/event-bus`        | A, B       | D             | 2h       | EventBus contracts (TS + Python)         |
| **D** | Platform Agent | `feature/nx-tags-supabase` | PHASE-001  | C             | 3h       | Nx tags + Supabase dev stack             |

---

## ⚡ Cycle A: Unit of Work (TypeScript)

**Owner:** Domain Agent
**Branch:** `feature/uow-typescript`
**Duration:** 3 hours

### 🔴 RED Phase

```typescript
// libs/shared/domain/src/unit-of-work.test.ts
import { UnitOfWork } from "./unit-of-work";
import { InMemoryUnitOfWork } from "./adapters/in-memory-uow";

describe("UnitOfWork Contract", () => {
    it("should commit transactionally", async () => {
        const uow = new InMemoryUnitOfWork();
        // Test transaction commit
        // Expected: FAIL (interface doesn't exist)
    });

    it("should rollback on failure", async () => {
        // Test transaction rollback
        // Expected: FAIL
    });
});
```

### 🟢 GREEN Phase

```typescript
// libs/shared/domain/src/unit-of-work.ts
export interface UnitOfWork {
    begin(): Promise<void>;
    commit(): Promise<void>;
    rollback(): Promise<void>;
    registerNew<T>(entity: T): void;
    registerDirty<T>(entity: T): void;
    registerDeleted<T>(entity: T): void;
}

// libs/shared/domain/src/adapters/in-memory-uow.ts
export class InMemoryUnitOfWork implements UnitOfWork {
    private newEntities: any[] = [];
    private dirtyEntities: any[] = [];
    private deletedEntities: any[] = [];
    private inTransaction = false;

    async begin(): Promise<void> {
        this.inTransaction = true;
    }

    async commit(): Promise<void> {
        if (!this.inTransaction) throw new Error("No transaction active");
        // Simulate commit
        this.clear();
        this.inTransaction = false;
    }

    async rollback(): Promise<void> {
        this.clear();
        this.inTransaction = false;
    }

    registerNew<T>(entity: T): void {
        this.newEntities.push(entity);
    }

    registerDirty<T>(entity: T): void {
        this.dirtyEntities.push(entity);
    }

    registerDeleted<T>(entity: T): void {
        this.deletedEntities.push(entity);
    }

    private clear(): void {
        this.newEntities = [];
        this.dirtyEntities = [];
        this.deletedEntities = [];
    }
}
```

### 🔵 REFACTOR Phase

-   Extract repository pattern interfaces
-   Add Supabase adapter skeleton
-   Document transaction boundaries
-   Add decorator for automatic UoW injection

### 📋 Cycle A Checklist

-   [ ] UoW interface defined
-   [ ] In-memory adapter implemented
-   [ ] Unit tests pass
-   [ ] Documentation complete

---

## ⚡ Cycle B: Unit of Work (Python)

**Owner:** Domain Agent
**Branch:** `feature/uow-python`
**Duration:** 3 hours

### 🔴 RED Phase

```python
# libs/shared/domain/unit_of_work.py
from typing import Protocol

class UnitOfWork(Protocol):
    async def begin(self) -> None: ...
    async def commit(self) -> None: ...
    async def rollback(self) -> None: ...
```

### 🟢 GREEN Phase

```python
# libs/shared/domain/adapters/in_memory_uow.py
class InMemoryUnitOfWork:
    def __init__(self):
        self._new_entities = []
        self._dirty_entities = []
        self._deleted_entities = []
        self._in_transaction = False

    async def begin(self) -> None:
        self._in_transaction = True

    async def commit(self) -> None:
        if not self._in_transaction:
            raise RuntimeError('No transaction active')
        self._clear()
        self._in_transaction = False

    async def rollback(self) -> None:
        self._clear()
        self._in_transaction = False

    def _clear(self) -> None:
          self._new_entities.clear()
          self._dirty_entities.clear()
          self._deleted_entities.clear()
```

### 🔵 REFACTOR Phase

-   Extract repository pattern interfaces
-   Add async context manager support
-   Document transaction boundaries
-   Add type hints for better IDE support
-   Add exception handling and rollback guarantees

### 📋 Cycle B Checklist

-   [ ] UnitOfWork protocol defined
-   [ ] InMemoryUnitOfWork implementation complete
-   [ ] Unit tests pass
-   [ ] Documentation complete
-   [ ] TypeScript parity maintained

---

## ⚡ Cycle C: Event Bus Abstractions

**Owner:** Domain Agent
**Branch:** `feature/event-bus`
**Duration:** 2 hours
**Depends On:** Cycles A + B

### 🔴 RED Phase

```typescript
// libs/shared/domain/src/event-bus.test.ts
import { EventBus } from "./event-bus";
import { InMemoryEventBus } from "./adapters/in-memory-event-bus";

describe("EventBus Contract", () => {
    it("should dispatch domain events to subscribers", async () => {
        const eventBus = new InMemoryEventBus();
        let receivedEvent = null;

        eventBus.subscribe("test.event", (event) => {
            receivedEvent = event;
        });

        await eventBus.dispatch({
            type: "test.event",
            payload: { id: "123", action: "created" },
        });

        // Test event dispatch
        // Expected: FAIL (interfaces don't exist)
    });

    it("should handle multiple subscribers for same event", async () => {
        // Test multiple subscriptions
        // Expected: FAIL
    });
});
```

### 🟢 GREEN Phase

```typescript
// libs/shared/domain/src/event-bus.ts
export interface EventBus {
    subscribe<T>(eventType: string, handler: (event: T) => void | Promise<void>): void;
    unsubscribe(eventType: string, handler: Function): void;
    dispatch<T>(event: { type: string; payload: T }): Promise<void>;
}

// libs/shared/domain/src/adapters/in-memory-event-bus.ts
export class InMemoryEventBus implements EventBus {
    private subscriptions = new Map<string, Set<Function>>();

    subscribe<T>(eventType: string, handler: (event: T) => void | Promise<void>): void {
        if (!this.subscriptions.has(eventType)) {
            this.subscriptions.set(eventType, new Set());
        }
        this.subscriptions.get(eventType)!.add(handler);
    }

    unsubscribe(eventType: string, handler: Function): void {
        this.subscriptions.get(eventType)?.delete(handler);
    }

    async dispatch<T>(event: { type: string; payload: T }): Promise<void> {
        const handlers = this.subscriptions.get(event.type);
        if (!handlers) return;

        await Promise.all(Array.from(handlers).map((handler) => Promise.resolve(handler(event))));
    }
}
```

### 🔵 REFACTOR Phase

-   Add event filtering and wildcards
-   Support synchronous and asynchronous handlers
-   Add event replay capabilities
-   Add dead letter queue for failed events
-   Add event metadata (timestamps, correlation IDs)
-   Implement typed event system

### 📋 Cycle C Checklist

-   [ ] EventBus interface defined
-   [ ] InMemoryEventBus implementation complete
-   [ ] Unit tests pass
-   [ ] Documentation complete
-   [ ] Cross-language parity maintained

---

## ⚡ Cycle D: Nx Tags & Supabase Dev Stack

**Owner:** Platform Agent
**Branch:** `feature/nx-tags-supabase`
**Duration:** 3 hours

### Nx Tag Taxonomy

```json
// nx.json
{
    "targetDefaults": {
        "@nx/enforce-module-boundaries": [
            "error",
            {
                "depConstraints": [
                    {
                        "sourceTag": "type:domain",
                        "onlyDependOnLibsWithTags": ["type:domain"]
                    },
                    {
                        "sourceTag": "type:application",
                        "onlyDependOnLibsWithTags": ["type:domain", "type:application"]
                    },
                    {
                        "sourceTag": "type:infrastructure",
                        "onlyDependOnLibsWithTags": ["type:domain", "type:application", "type:infrastructure"]
                    }
                ]
            }
        ]
    }
}
```

### Supabase Dev Stack

```yaml
# docker/docker-compose.supabase.yml
version: "3.8"
services:
    postgres:
        image: supabase/postgres:15
        ports:
            - "5432:5432"
        environment:
            POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-supabase}
            POSTGRES_DB: postgres
            PGDATA: /var/lib/postgresql/data/pgdata
        volumes:
            - ./scripts/init:/docker-entrypoint-initdb.d
            - ./scripts/seed:/scripts/seed
        healthcheck:
            test: ["CMD-SHELL", "pg_isready -U postgres"]
            interval: 5s
            timeout: 5s
            retries: 5

    redis:
        image: redis:7-alpine
        ports:
            - "6379:6379"
        command: redis-server --appendonly yes
        volumes:
            - redis-data:/data
        healthcheck:
            test: ["CMD", "redis-cli", "ping"]
            interval: 5s
            timeout: 3s
            retries: 5

    gotrue:
        image: supabase/gotrue:v2.99.0
        ports:
            - "54321:54321"
        depends_on:
            postgres:
                condition: service_healthy
        environment:
            API_EXTERNAL_URL: http://localhost:54321
            GOTRUE_API_HOST: 0.0.0.0
            GOTRUE_API_PORT: 54321
            DB_DRIVER: postgres
            DB_DATABASE_URL: postgresql://postgres:${POSTGRES_PASSWORD:-supabase}@postgres:5432/postgres
            SITE_URL: http://localhost:3000
            JWT_SECRET: ${JWT_SECRET:-super-secret-jwt-token}
            ANON_KEY: ${ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9}
            SERVICE_ROLE_KEY: ${SERVICE_ROLE_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9}
            GOTRUE_UI_ADMIN_EMAIL: admin@supabase.io
            GOTRUE_UI_ADMIN_PASSWORD: password

    realtime:
        image: supabase/realtime:v2.25.45
        ports:
            - "54323:54323"
        depends_on:
            postgres:
                condition: service_healthy
        environment:
            DB_HOST: postgres
            DB_PORT: 5432
            DB_USER: postgres
            DB_PASSWORD: ${POSTGRES_PASSWORD:-supabase}
            DB_DATABASE: postgres
            DB_AFTER_CONNECT_QUERY: "SET search_path TO _realtime"
            API_JWT_SECRET: ${JWT_SECRET:-super-secret-jwt-token}

    storage:
        image: supabase/storage-api:v0.43.11
        ports:
            - "54324:54324"
        depends_on:
            postgres:
                condition: service_healthy
            redis:
                condition: service_healthy
        environment:
            ANON_KEY: ${ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9}
            SERVICE_KEY: ${SERVICE_ROLE_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9}
            POSTGREST_URL: http://postgrest:54321
            DATABASE_URL: postgresql://postgres:${POSTGRES_PASSWORD:-supabase}@postgres:5432/postgres
            FILE_SIZE_LIMIT: 52428800
            STORAGE_BACKEND: file
            FILE_STORAGE_DRIVER: disk
            TENANT_ID: stub
            ENABLE_S3_SSE: false

    studio:
        image: supabase/studio:20231023
        ports:
            - "54323:3000"
        depends_on:
            postgres:
                condition: service_healthy
            gotrue:
                condition: service_started
            realtime:
                condition: service_started
            storage:
                condition: service_started
        environment:
            STUDIO_PG_META_URL: http://meta:54321
            POSTGRES_HOST: postgres
            POSTGRES_HOSTNAME: postgres
            POSTGRES_DB: postgres
            POSTGRES_PORT: 5432
            POSTGRES_USER: postgres
            POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-supabase}
            GOTRUE_API_URL: http://gotrue:54321
            GOTRUE_API_ANON_KEY: ${ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9}
            GOTRUE_API_SERVICE_ROLE_KEY: ${SERVICE_ROLE_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9}
            LOGFLARE_API_KEY: ${LOGFLARE_API_KEY:-set_this}
            LOGFLARE_NODE_ID: studio
            SLACK_WEBHOOK_URL: ${SLACK_WEBHOOK_URL:-""}

volumes:
    postgres-data:
    redis-data:
```

```json
// tools/supabase/project.json
{
    "targets": {
        "supabase-devstack:start": {
            "executor": "nx:run-commands",
            "options": {
                "command": "docker compose -f docker/docker-compose.supabase.yml up -d",
                "cwd": "."
            }
        },
        "supabase-devstack:stop": {
            "executor": "nx:run-commands",
            "options": {
                "command": "docker compose -f docker/docker-compose.supabase.yml down",
                "cwd": "."
            }
        },
        "supabase-devstack:reset": {
            "executor": "nx:run-commands",
            "options": {
                "command": "docker compose -f docker/docker-compose.supabase.yml down -v && docker compose -f docker/docker-compose.supabase.yml up -d",
                "cwd": "."
            }
        },
        "supabase-devstack:status": {
            "executor": "nx:run-commands",
            "options": {
                "command": "docker compose -f docker/docker-compose.supabase.yml ps",
                "cwd": "."
            }
        },
        "supabase-devstack:seed": {
            "executor": "nx:run-commands",
            "options": {
                "command": "docker exec -i $(docker compose -f docker/docker-compose.supabase.yml ps -q postgres) psql -U postgres -d postgres -f /scripts/seed/01-seed.sql",
                "cwd": "."
            }
        },
        "supabase-devstack:logs": {
            "executor": "nx:run-commands",
            "options": {
                "command": "docker compose -f docker/docker-compose.supabase.yml logs -f",
                "cwd": "."
            }
        }
    }
}
```

---

## ✅ Phase Validation Checklist

-   [ ] UoW TypeScript: Interface + adapter + tests
-   [ ] UoW Python: Protocol + adapter + tests
-   [ ] EventBus: Contracts + in-memory implementations
-   [ ] Nx Tags: Enforced via lint, zero violations
-   [ ] Supabase Dev Stack: Starts successfully, accessible at localhost:54323
-   [ ] Integration tests: Transactional boundaries validated
-   [ ] **PHASE-002 marked GREEN in Master Plan**

---

**Next Steps**: Proceed to PHASE-003 (Universal React Generator)
