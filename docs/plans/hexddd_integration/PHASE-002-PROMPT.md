# VibesPro - PHASE-002: Hexagonal Architecture Foundations

> **Domain Agent**: Complete this phase to establish core hexagonal architecture abstractions and enforcement mechanisms.

---

## Mission: Establish production-ready hexagonal architecture patterns with transactional boundaries and enforcement

Implement Unit of Work and Event Bus abstractions in TypeScript and Python, configure Nx dependency tags to enforce layer boundaries, and deploy a Supabase dev stack—ensuring all domains have consistent, tested patterns for transactional integrity and event-driven communication.

---

## Success Criteria (Binary Pass/Fail)

-   [ ] **UoW Contracts Complete**: TypeScript and Python Unit of Work interfaces implemented with in-memory adapters, passing all transactional tests
-   [ ] **EventBus Abstractions Complete**: Cross-language Event Bus contracts with in-memory implementations, supporting pub/sub patterns
-   [ ] **Zero Boundary Violations**: `pnpm nx run-many -t lint` passes with Nx dependency tag enforcement (type:domain, type:application, type:infrastructure)
-   [ ] **Supabase Dev Stack Operational**: Docker Compose stack starts in <5 minutes, all services healthy (postgres, redis, gotrue, realtime, storage, studio)
-   [ ] **Integration Tests Pass**: Transactional boundary tests validate commit/rollback behavior across both languages
-   [ ] **Zero CI Failures**: All quality gates pass (tests, linters, builds)
-   [ ] **Zero Technical Debt**: Follows hexagonal architecture principles (DEV-ADR-024, DEV-SDS-025), MECE instruction stacking
-   [ ] **Production Ready**: Documentation complete, traceability matrix updated with spec IDs

**Failure Mode**: If any criterion fails, continue iterating until all pass. Do not proceed to PHASE-003 with incomplete foundations.

---

## Context: Why This Matters

**Current State**: VibesPro lacks core hexagonal architecture infrastructure. Generated projects have no standardized patterns for transactional boundaries, event-driven communication, or layer separation enforcement. Developers implementing domain logic must invent these patterns per-project, leading to inconsistency and bugs.

**Impact**:

-   **Template Users**: Cannot scaffold projects with proven transactional patterns—must build UoW/EventBus from scratch
-   **Domain Teams**: No enforcement of hexagonal boundaries—infrastructure can leak into domain layer
-   **Platform Team**: Cannot provide consistent dev stacks—each project configures Supabase differently
-   **Cost of Inaction**: Architectural drift, data corruption from improper transaction handling, coupling violations

**Target State**:

-   All generated projects inherit battle-tested UoW and EventBus abstractions
-   Nx lint automatically catches layer boundary violations (domain cannot import infrastructure)
-   Supabase dev stack provisions in <5 minutes via single command
-   Integration tests demonstrate proper transactional behavior as reference implementations

**Risk Level**: **HIGH** → **LOW** (after completion, all future domains build on verified foundations)

---

## Phase 1: Core Abstractions (Cycles A + B + C) (Sprint 1)

### Task 1A: Unit of Work - TypeScript Implementation

**What**: Create TypeScript UoW interface and in-memory adapter following TDD workflow

**Branch**: `feature/uow-typescript`

**Implementation Steps**:

1. **🔴 RED Phase - Create failing tests** in `libs/shared/domain/src/unit-of-work.test.ts`:

    - Test `begin()` → `commit()` transaction lifecycle
    - Test `rollback()` clears dirty/new/deleted entity tracking
    - Test `registerNew()`, `registerDirty()`, `registerDeleted()` entity tracking
    - Test error when committing without active transaction
    - Expected: ALL FAIL (interfaces don't exist yet)

2. **🟢 GREEN Phase - Implement minimal passing code**:

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
        // Implementation per PHASE-002 spec
    }
    ```

3. **🔵 REFACTOR Phase - Improve design**:

    - Extract repository pattern interfaces
    - Add Supabase adapter skeleton (stub only, real impl in later phase)
    - Document transaction boundaries in JSDoc comments
    - Consider decorator for automatic UoW injection in use cases

4. **Test coverage**:
    - Transaction lifecycle (begin → commit → rollback)
    - Entity tracking (new/dirty/deleted)
    - Error conditions (commit without begin, double commit)
    - Verification: `pnpm test:jest --testPathPatterns=unit-of-work.test`

**Exit Criteria**:

-   [ ] UnitOfWork interface defined in `libs/shared/domain/src/unit-of-work.ts`
-   [ ] InMemoryUnitOfWork adapter passes all tests
-   [ ] Code coverage ≥ 90% for UoW module
-   [ ] Documentation includes transaction boundary examples
-   [ ] **Traceability**: Code references DEV-ADR-024, DEV-SDS-025

---

### Task 1B: Unit of Work - Python Implementation

**What**: Create Python UoW protocol and in-memory adapter with TypeScript feature parity

**Branch**: `feature/uow-python`

**Implementation Steps**:

1. **🔴 RED Phase - Create failing tests** in `libs/shared/domain/tests/test_unit_of_work.py`:

    - Test async transaction lifecycle (`await begin()` → `await commit()`)
    - Test rollback clears entity tracking
    - Test entity registration methods
    - Test exception handling for invalid transaction states
    - Expected: ALL FAIL (protocol doesn't exist)

2. **🟢 GREEN Phase - Implement protocol and adapter**:

    ```python
    # libs/shared/domain/unit_of_work.py
    from typing import Protocol, TypeVar

    T = TypeVar('T')

    class UnitOfWork(Protocol):
        async def begin(self) -> None: ...
        async def commit(self) -> None: ...
        async def rollback(self) -> None: ...
        def register_new(self, entity: T) -> None: ...
        def register_dirty(self, entity: T) -> None: ...
        def register_deleted(self, entity: T) -> None: ...

    # libs/shared/domain/adapters/in_memory_uow.py
    class InMemoryUnitOfWork:
        # Implementation per PHASE-002 spec
    ```

3. **🔵 REFACTOR Phase - Enhance with Python idioms**:

    - Add async context manager support (`async with uow:`)
    - Extract repository pattern interfaces
    - Add comprehensive type hints (mypy --strict compliance)
    - Document transaction boundaries in docstrings
    - Add exception handling with custom exception types

4. **Test coverage**:
    - All TypeScript test scenarios replicated in Python
    - Async context manager behavior
    - Type checking with mypy --strict
    - Verification: `pytest libs/shared/domain/tests/test_unit_of_work.py -v`

**Exit Criteria**:

-   [ ] UnitOfWork protocol defined with full type hints
-   [ ] InMemoryUnitOfWork implementation passes all tests
-   [ ] mypy --strict passes with zero errors
-   [ ] Documentation includes async context manager usage examples
-   [ ] Feature parity with TypeScript implementation maintained
-   [ ] **Traceability**: Code references DEV-ADR-024, DEV-SDS-025

---

### Task 1C: Event Bus Abstractions (TypeScript + Python)

**What**: Implement cross-language Event Bus contracts with in-memory pub/sub

**Branch**: `feature/event-bus`

**Dependencies**: Cycles A + B must complete first (UoW patterns inform EventBus design)

**Implementation Steps**:

1. **🔴 RED Phase - Create failing tests**:

    - TypeScript: `libs/shared/domain/src/event-bus.test.ts`

        - Test single subscriber receives event
        - Test multiple subscribers for same event type
        - Test unsubscribe removes handler
        - Test async handlers execute sequentially
        - Test error aggregation when handlers fail

    - Python: `libs/shared/domain/tests/test_event_bus.py`

        - Mirror all TypeScript test scenarios
        - Test async handler execution

    - Expected: ALL FAIL (interfaces don't exist)

2. **🟢 GREEN Phase - Implement contracts**:

    ```typescript
    // libs/shared/domain/src/event-bus.ts
    export interface EventBus {
        subscribe<T>(eventType: string, handler: (event: T) => void | Promise<void>): void;
        unsubscribe(eventType: string, handler: Function): void;
        dispatch<T>(event: { type: string; payload: T }): Promise<void>;
    }

    // libs/shared/domain/src/adapters/in-memory-event-bus.ts
    export class InMemoryEventBus implements EventBus {
        // Implementation per PHASE-002 spec with Promise.allSettled
    }
    ```

    ```python
    # libs/shared/domain/event_bus.py
    from typing import Protocol, Callable, Awaitable, Union, TypeVar, Generic, Any

    T = TypeVar('T')

    class EventBus(Protocol):
        def subscribe(self, event_type: str, handler: Callable[[T], Union[None, Awaitable[None]]]) -> None: ...
        def unsubscribe(self, event_type: str, handler: Callable) -> None: ...
        async def dispatch(self, event: dict[str, Any]) -> None: ...
    ```

3. **🔵 REFACTOR Phase - Add advanced features**:

    - Event filtering and wildcard subscriptions (`user.*` matches `user.created`, `user.updated`)
    - Event replay capabilities (store last N events)
    - Dead letter queue for failed events
    - Event metadata (timestamps, correlation IDs, causation IDs)
    - Typed event system (use generics for type safety)

4. **Integration test**:
    - Create `tests/integration/event-bus-integration.test.ts`
    - Test cross-module event flow (one module publishes, another subscribes)
    - Test integration with UoW (events dispatched after successful commit)

**Exit Criteria**:

-   [ ] EventBus interface defined in both languages
-   [ ] InMemoryEventBus implementations pass all tests
-   [ ] Cross-language parity maintained (same features in TS and Python)
-   [ ] Error handling documented (failed handlers, invalid event types)
-   [ ] Integration test demonstrates pub/sub between modules
-   [ ] **Traceability**: Code references DEV-ADR-024, DEV-SDS-025

---

## Phase 2: Enforcement & Infrastructure (Cycle D) (Sprint 1)

### Task 2A: Nx Dependency Tag Enforcement

**What**: Configure Nx tags to enforce hexagonal layer boundaries via lint

**Branch**: `feature/nx-tags-supabase`

**Implementation Steps**:

1. **Update `nx.json` with tag taxonomy**:

    ```json
    {
        "targetDefaults": {
            "lint": {
                "cache": true,
                "inputs": ["default", "{workspaceRoot}/.eslintrc.json"],
                "executor": "@nx/eslint:lint",
                "options": {
                    "lintFilePatterns": ["{projectRoot}/**/*.ts"]
                }
            }
        }
    }
    ```

2. **Create `.eslintrc.json` with boundary enforcement** (Nx requires @nx/enforce-module-boundaries to live in ESLint config, not nx.json):

    ```json
    {
        "extends": ["plugin:@nx/typescript"],
        "rules": {
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

3. **Tag existing libraries**:

    - Add `"tags": ["type:domain"]` to `libs/shared/domain/project.json`
    - Create sample application and infrastructure libs to test enforcement
    - Intentionally violate boundary (domain imports infrastructure) to verify lint catches it

4. **Document tag taxonomy** in `docs/ARCHITECTURE.md`:
    - `type:domain` - Pure business logic, no external dependencies
    - `type:application` - Use cases orchestrating domain logic
    - `type:infrastructure` - Adapters implementing ports (DB, APIs, etc.)

**Exit Criteria**:

-   [ ] Nx dependency tags configured in `nx.json`
-   [ ] `pnpm nx run-many -t lint` passes for valid dependencies
-   [ ] `pnpm nx run-many -t lint` FAILS when domain imports infrastructure (test violation, then remove)
-   [ ] Tag taxonomy documented in `docs/ARCHITECTURE.md`
-   [ ] **Traceability**: Configuration references DEV-ADR-025, DEV-SDS-024, DEV-PRD-025

---

### Task 2B: Supabase Dev Stack

**What**: Provision Supabase services via Docker Compose with Nx targets

**Branch**: `feature/nx-tags-supabase` (same as 2A, can work in parallel with C)

**Implementation Steps**:

1. **Create Docker Compose file** at `docker/docker-compose.supabase.yml`:

    - Services: postgres, redis, gotrue (auth), realtime, storage, studio
    - All services depend on postgres with healthcheck
    - Environment variables loaded from `.env.local` (created from `.env.example`)
    - Per PHASE-002 spec (see attachment for full YAML)

2. **Create Nx targets** in `tools/supabase/project.json`:

    ```json
    {
        "name": "supabase",
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
                    "command": "psql -h localhost -U postgres -d postgres -f docker/scripts/seed/01-seed.sql",
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

3. **Create seed SQL** at `docker/scripts/seed/01-seed.sql`:

    - Create sample tables for testing (users, posts, etc.)
    - Insert test data
    - Document in `docs/ENVIRONMENT.md` section "Local Supabase Stack"

4. **Update `.env.example`** with Supabase configuration:

    ```bash
    POSTGRES_PASSWORD=your-super-secret-password
    JWT_SECRET=your-jwt-secret-at-least-32-characters-long
    ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
    SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
    GOTRUE_UI_ADMIN_EMAIL=admin@example.com
    GOTRUE_UI_ADMIN_PASSWORD=admin-password
    LOGFLARE_API_KEY=your-logflare-key
    ```

5. **Create justfile recipes** for convenience:

    ```bash
    # justfile additions
    supabase-start:
        pnpm nx supabase-devstack:start

    supabase-stop:
        pnpm nx supabase-devstack:stop

    supabase-reset:
        pnpm nx supabase-devstack:reset

    supabase-seed:
        pnpm nx supabase-devstack:seed
    ```

**Exit Criteria**:

-   [ ] Docker Compose file creates all services with proper dependencies
-   [ ] `pnpm nx supabase-devstack:start` brings up stack in <5 minutes
-   [ ] All services show "healthy" in `pnpm nx supabase-devstack:status`
-   [ ] Supabase Studio accessible at `http://localhost:54323`
-   [ ] Seed data loads successfully via `pnpm nx supabase-devstack:seed`
-   [ ] Documentation includes setup instructions and troubleshooting
-   [ ] **Traceability**: Configuration references DEV-ADR-026, DEV-SDS-026, DEV-PRD-027

---

### Task 2C: Integration Tests for Transactional Boundaries

**What**: Validate UoW behavior with integration tests using Supabase dev stack

**Branch**: `feature/nx-tags-supabase` (depends on 2B completing)

**Implementation Steps**:

1. **Create integration test** at `tests/integration/uow-supabase.test.ts`:

    ```typescript
    import { SupabaseUnitOfWork } from "@vibes-pro/shared/domain/adapters";
    import { createClient } from "@supabase/supabase-js";

    describe("UnitOfWork with Supabase", () => {
        let uow: SupabaseUnitOfWork;
        let client: SupabaseClient;

        beforeAll(async () => {
            // Start Supabase stack, wait for health
            client = createClient(/* ... */);
            uow = new SupabaseUnitOfWork(client);
        });

        it("should commit transaction and persist entities", async () => {
            await uow.begin();
            uow.registerNew({ id: "123", name: "Test User" });
            await uow.commit();

            // Verify data persisted in postgres
            const { data } = await client.from("users").select("*").eq("id", "123");
            expect(data).toHaveLength(1);
        });

        it("should rollback transaction and discard entities", async () => {
            await uow.begin();
            uow.registerNew({ id: "456", name: "Rollback User" });
            await uow.rollback();

            // Verify data NOT persisted
            const { data } = await client.from("users").select("*").eq("id", "456");
            expect(data).toHaveLength(0);
        });
    });
    ```

2. **Create Python integration test** at `tests/integration/test_uow_supabase.py`:

    - Mirror TypeScript test scenarios
    - Use async Supabase client
    - Verify transaction isolation

3. **Add CI workflow** to run integration tests:
    - Start Supabase stack before tests
    - Run integration tests with timeout
    - Stop stack after tests (cleanup)

**Exit Criteria**:

-   [ ] Integration tests pass in local environment
-   [ ] Integration tests pass in CI
-   [ ] Tests demonstrate commit/rollback behavior with real database
-   [ ] Python and TypeScript integration tests both passing
-   [ ] **Traceability**: Tests reference DEV-PRD-026

---

## Pre-Work: Required Reading (30 min)

**Priority Order** (read in this sequence):

1. `docs/dev_adr.md` (sections DEV-ADR-024, DEV-ADR-025, DEV-ADR-026) — 10 min: Hexagonal architecture decisions
2. `docs/dev_sds.md` (sections DEV-SDS-024, DEV-SDS-025, DEV-SDS-026) — 10 min: Design specifications for UoW/EventBus/Nx tags
3. `docs/ARCHITECTURE.md` — 5 min: Hexagonal layer definitions and dependency rules
4. `docs/plans/hexddd_integration/PHASE-002-HEXAGONAL_FOUNDATIONS.md` — 5 min: Full technical specification
5. Skim: `docs/dev_prd.md` (sections DEV-PRD-025, DEV-PRD-026, DEV-PRD-027), `.github/instructions/testing.instructions.md` — Context on requirements and testing strategy

**Context Check**: After reading, you should understand:

-   Hexagonal architecture layer boundaries (domain → application → infrastructure)
-   Unit of Work pattern purpose (transactional consistency)
-   Event Bus pattern purpose (decoupled event-driven communication)
-   Nx dependency tags enforcement mechanism
-   Supabase dev stack services and their roles

---

## Execution Protocol

### Decision-Making Authority

You are **authorized** to:

-   Choose test assertion libraries (prefer `node:assert` and `pytest` as specified)
-   Refactor internal implementations for clarity (extract helper functions, add types)
-   Add additional edge case tests beyond minimum requirements
-   Create utility functions to reduce test boilerplate
-   Add JSDoc/docstring comments for public APIs

You **must ask** before:

-   Adding npm packages or Python dependencies not in `package.json`/`pyproject.toml`
-   Changing public API signatures (UnitOfWork, EventBus interfaces)
-   Modifying CI/CD workflows (`.github/workflows/*`)
-   Changing Nx configuration beyond tag taxonomy
-   Modifying Docker Compose service versions or architecture

### Quality Gates

Run after **each task** completion:

```bash
pnpm test:jest --testPathPatterns=<task-module>   # Must pass - unit tests for current task
pnpm nx run-many -t lint                           # Must pass - no boundary violations
pnpm nx run-many -t build                          # Must pass - TypeScript compilation
pytest libs/shared/domain/tests -v                 # Must pass - Python unit tests
mypy --strict libs/shared/domain                   # Must pass - Python type checking
```

**After all tasks in a cycle complete**:

```bash
pnpm test:jest                                     # Must pass - all unit tests
pnpm test:integration                              # Must pass - integration tests
pnpm nx run-many -t lint                           # Must pass - all lint checks
pnpm nx run-many -t build                          # Must pass - all builds
just spec-guard                                    # Must pass - spec matrix + prompt lint
```

**Before marking phase complete**:

```bash
pnpm nx supabase-devstack:start                    # Must succeed in <5 min
pnpm nx supabase-devstack:status                   # All services healthy
pnpm test:integration                              # Must pass with real Supabase stack
pnpm nx supabase-devstack:stop                     # Cleanup
```

### Iteration Protocol

If any check fails:

1. Analyze failure root cause (read error messages completely)
2. Fix issue following TDD cycle if applicable (update test → fix code → refactor)
3. Re-run all checks for current task
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

-   [ ] Tests pass: `pnpm test:jest --testPathPatterns=<pattern>` (X/X tests passing)
-   [ ] Lint passes: `pnpm nx run-many -t lint` (0 violations)
-   [ ] Build passes: `pnpm nx run-many -t build` (0 errors)
-   [ ] Documentation updated: [affected files]

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

❌ **Don't**: Implement partial transaction support ("will add rollback later")
✅ **Do**: Complete full UoW contract in each cycle (begin/commit/rollback/register methods)

❌ **Don't**: Skip Python implementation ("TypeScript is enough")
✅ **Do**: Maintain feature parity across both languages per DEV-ADR-024

❌ **Don't**: Test only happy paths (successful commits)
✅ **Do**: Test error conditions, rollbacks, invalid states, concurrent transactions

❌ **Don't**: Hardcode Supabase credentials in Docker Compose or code
✅ **Do**: Use environment variables loaded from `.env.local` (not committed)

❌ **Don't**: Create "TODO: implement later" comments for core functionality
✅ **Do**: Implement complete functionality or file a separate issue for future enhancements

❌ **Don't**: Skip refactor phase to move faster
✅ **Do**: Follow strict Red-Green-Refactor cycle per `.github/instructions/testing.instructions.md`

❌ **Don't**: Mix concerns in one module (UoW + EventBus in same file)
✅ **Do**: Keep abstractions separated, follow single responsibility principle

---

## Codebase Intelligence Sources

**Essential Files**:

-   `docs/ARCHITECTURE.md` — Hexagonal layer definitions
-   `docs/dev_adr.md` — Architectural decisions (DEV-ADR-024, 025, 026)
-   `docs/dev_sds.md` — Design specifications (DEV-SDS-024, 025, 026)
-   `docs/dev_prd.md` — Product requirements (DEV-PRD-025, 026, 027)
-   `.github/instructions/testing.instructions.md` — TDD workflow and testing conventions
-   `.github/instructions/generators-first.instructions.md` — Generator-first development policy
-   `.github/copilot-instructions.md` — General development guidelines

**Reference Implementations**:

-   Look for existing repository patterns in `libs/` (if any) to maintain consistency
-   Study existing Nx configuration in `nx.json` for lint setup patterns

**API/Library Documentation**:

-   Nx Dependency Boundaries: https://nx.dev/core-features/enforce-module-boundaries
-   Supabase Docker Setup: https://supabase.com/docs/guides/self-hosting/docker
-   Jest Testing: https://jestjs.io/docs/getting-started
-   Pytest: https://docs.pytest.org/en/stable/

**Related Prior Work**:

-   PHASE-001 (dependency): Ensure PHASE-001 is marked complete before starting
-   Check git log for any existing UoW/EventBus implementations to avoid duplication

---

## Special Considerations

### Performance

-   InMemoryEventBus must handle ≥100 subscribers without degradation
-   Event dispatch with Promise.allSettled to prevent single handler failure from blocking others
-   Consider event queue size limits to prevent memory leaks

### Security

-   Never commit `.env.local` with real Supabase credentials
-   Use SOPS for production secrets per DEV-ADR-013
-   Ensure Docker Compose healthchecks prevent race conditions on startup

### Compatibility

-   TypeScript strict mode enabled (`strict: true` in `tsconfig.json`)
-   Python mypy strict mode required (`mypy --strict`)
-   Node.js LTS version per `.mise.toml`
-   Python 3.11+ required per `.mise.toml`

### Observability

-   Add structured logging to UoW operations (begin/commit/rollback)
-   Add correlation IDs to events for distributed tracing
-   Log EventBus subscription/dispatch events for debugging

---

## Begin Execution

Start with **Pre-Work reading**, then proceed to **Phase 1, Task 1A** (UoW TypeScript).

**Workflow**:

1. Read all pre-work docs (30 min)
2. Create branch `feature/uow-typescript`
3. Follow TDD cycle for Task 1A (🔴 RED → 🟢 GREEN → 🔵 REFACTOR)
4. Run quality gates
5. Report status using output format
6. Proceed to Task 1B (Python) in parallel if desired
7. Complete Task 1C (EventBus) after A + B
8. Complete Task 2A + 2B in parallel
9. Complete Task 2C (integration tests)
10. Run final validation
11. Update `docs/plans/hexddd_integration/PHASE-002-HEXAGONAL_FOUNDATIONS.md` status to GREEN
12. Update `docs/traceability_matrix.md` with new implementations

Report status after completing each task using the output format above.

---

**Traceability Matrix Update Required**: After phase completion, add entries mapping:

-   DEV-ADR-024 → `libs/shared/domain/src/unit-of-work.ts`, `libs/shared/domain/event_bus.py`
-   DEV-SDS-025 → `libs/shared/domain/src/adapters/in-memory-uow.ts`, etc.
-   DEV-PRD-026 → `tests/integration/uow-supabase.test.ts`
