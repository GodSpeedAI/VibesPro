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

- [ ] Unit of Work contracts implemented in TypeScript and Python
- [ ] Event Bus abstractions implemented with in-memory defaults
- [ ] Nx dependency tags configured and enforced via lint
- [ ] Supabase dev stack operational with Docker Compose
- [ ] Integration tests validate transactional boundaries
- [ ] **Evidence**: `pnpm nx run-many -t lint` passes boundary checks

### Traceability

| Requirement | Cycle | Validation |
|-------------|-------|------------|
| DEV-ADR-024 | A, B, C | UoW/EventBus abstractions |
| DEV-ADR-025 | D | Nx tag enforcement |
| DEV-ADR-026 | D | Supabase dev stack |
| DEV-PRD-025 | D | Boundary violations = 0 |
| DEV-PRD-026 | A, B, C | Transactional tests pass |
| DEV-PRD-027 | D | Dev stack starts < 5min |
| DEV-SDS-024 | D | Tag taxonomy documented |
| DEV-SDS-025 | A, B, C | Contracts + adapters |
| DEV-SDS-026 | D | Docker Compose + Nx targets |

---

## 📊 Cycles Overview

### Cycle Summary Table

| Cycle | Owner | Branch | Depends On | Parallel With | Duration | Deliverables |
|-------|-------|--------|------------|---------------|----------|-------------|
| **A** | Domain Agent | `feature/uow-typescript` | PHASE-001 | B | 3h | UoW TS contracts + in-memory adapter |
| **B** | Domain Agent | `feature/uow-python` | PHASE-001 | A | 3h | UoW Python protocols + in-memory adapter |
| **C** | Domain Agent | `feature/event-bus` | A, B | D | 2h | EventBus contracts (TS + Python) |
| **D** | Platform Agent | `feature/nx-tags-supabase` | PHASE-001 | C | 3h | Nx tags + Supabase dev stack |

---

## ⚡ Cycle A: Unit of Work (TypeScript)

**Owner:** Domain Agent  
**Branch:** `feature/uow-typescript`  
**Duration:** 3 hours

### 🔴 RED Phase

```typescript
// libs/shared/domain/src/unit-of-work.test.ts
import { UnitOfWork } from './unit-of-work';
import { InMemoryUnitOfWork } from './adapters/in-memory-uow';

describe('UnitOfWork Contract', () => {
  it('should commit transactionally', async () => {
    const uow = new InMemoryUnitOfWork();
    // Test transaction commit
    // Expected: FAIL (interface doesn't exist)
  });

  it('should rollback on failure', async () => {
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
    if (!this.inTransaction) throw new Error('No transaction active');
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

- Extract repository pattern interfaces
- Add Supabase adapter skeleton
- Document transaction boundaries
- Add decorator for automatic UoW injection

### 📋 Cycle A Checklist

- [ ] UoW interface defined
- [ ] In-memory adapter implemented
- [ ] Unit tests pass
- [ ] Documentation complete

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

---

## ⚡ Cycle C: Event Bus Abstractions

**Owner:** Domain Agent  
**Branch:** `feature/event-bus`  
**Duration:** 2 hours  
**Depends On:** Cycles A + B

### Deliverables

- Event Bus interface (TS + Python)
- In-memory event bus implementations
- Event subscription mechanisms
- Integration tests for event dispatch

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
version: '3.8'
services:
  postgres:
    image: supabase/postgres:15
    ports:
      - "5432:5432"
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}

  studio:
    image: supabase/studio:latest
    ports:
      - "54323:3000"
```

```json
// tools/supabase/project.json
{
  "targets": {
    "supabase-devstack:start": {
      "executor": "nx:run-commands",
      "options": {
        "command": "docker-compose -f docker/docker-compose.supabase.yml up -d"
      }
    },
    "supabase-devstack:stop": {
      "executor": "nx:run-commands",
      "options": {
        "command": "docker-compose -f docker/docker-compose.supabase.yml down"
      }
    }
  }
}
```

---

## ✅ Phase Validation Checklist

- [ ] UoW TypeScript: Interface + adapter + tests
- [ ] UoW Python: Protocol + adapter + tests
- [ ] EventBus: Contracts + in-memory implementations
- [ ] Nx Tags: Enforced via lint, zero violations
- [ ] Supabase Dev Stack: Starts successfully, accessible at localhost:54323
- [ ] Integration tests: Transactional boundaries validated
- [ ] **PHASE-002 marked GREEN in Master Plan**

---

**Next Steps**: Proceed to PHASE-003 (Universal React Generator)