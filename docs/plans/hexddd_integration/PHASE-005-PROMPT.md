# VibesPro HexDDD Integration - PHASE-005: Integration, Documentation & Final Validation

> **Agent Instructions**: This prompt guides you through the final phase of HexDDD integration - validating the complete system end-to-end, updating all documentation, completing traceability, and publishing migration guides.

---

## Mission: Deliver production-ready HexDDD integration with complete documentation, 100% spec traceability, and validated end-to-end functionality

---

## Success Criteria (Binary Pass/Fail)

-   [ ] **End-to-End Validation Complete**: All smoke tests pass (generators, hexagonal boundaries, type safety, UoW/EventBus, Supabase stack)
-   [ ] **Zero CI Failures**: `just test`, `just ai-validate`, `just spec-guard`, `pnpm nx run-many -t build --all`, `just test-generation` all GREEN
-   [ ] **Documentation 100% Current**: README, ARCHITECTURE, ENVIRONMENT, generator guides, AGENTS.md all reflect HexDDD integration
-   [ ] **Traceability Matrix Complete**: 23/23 specs mapped (100% coverage) with implementations and validation methods documented
-   [ ] **Migration Guide Published**: `docs/MIGRATION_HEXDDD.md` complete with step-by-step upgrade path for existing projects
-   [ ] **Production Ready**: All phase branches merged to `dev`, PR ready for `main`, changelog updated, v1.0.0-hexddd tag created

**Failure Mode**: If any criterion fails, continue iterating until all pass. Do not proceed to deployment until all gates are GREEN.

---

## Context: Why This Matters

**Current State**: Phases 1-4 have delivered idempotent generators, hexagonal architecture foundations (UoW/EventBus), Nx boundary enforcement, Supabase dev stack, universal React generator (Next.js/Remix/Expo), and strict type safety. However, these components exist in isolation without comprehensive end-to-end validation, complete documentation, or migration guidance for existing projects.

**Impact**: Without proper integration validation, production deployments risk runtime failures at component boundaries. Missing documentation blocks adoption by teams unfamiliar with hexagonal architecture patterns. Incomplete traceability makes compliance audits and future maintenance difficult. Users with existing VibesPro projects have no clear upgrade path.

**Target State**: A fully validated, production-ready HexDDD integration with comprehensive documentation enabling seamless adoption. All 23 specifications (DEV-ADR-023-029, DEV-PRD-024-031, DEV-SDS-023-030) mapped to implementations with validation methods. Clear migration path for existing projects. Knowledge artifacts ready for team knowledge sharing and long-term maintenance.

**Risk Level**: MEDIUM → LOW (after completion, all integration risks mitigated through comprehensive testing)

---

## Phase 1: End-to-End Validation & Documentation (Sprint 5)

### Task 1A: End-to-End Smoke Test Suite

**What**: Create comprehensive smoke test suite validating all HexDDD components in integration.

**Implementation Steps**:

1. **Create master smoke test script** at `tests/e2e/hexddd-integration-smoke.sh`:

```bash
#!/bin/bash
# tests/e2e/hexddd-integration-smoke.sh

set -e

echo "=== HexDDD Integration Smoke Tests ==="

# 1. Generator Idempotency
echo "Testing generator idempotency..."
just test-generators || exit 1

# 2. Hexagonal Boundaries
echo "Testing Nx boundary enforcement..."
pnpm nx run-many -t lint --all || exit 1

# 3. Type Safety
echo "Testing TypeScript strict mode..."
pnpm tsc --noEmit || exit 1
echo "Testing Python mypy strict..."
uv run mypy --strict || exit 1

# 4. UoW/EventBus Integration
echo "Testing UoW/EventBus contracts..."
pnpm nx test shared-domain || exit 1

# 5. Universal React Generator
echo "Testing Next.js App Router generator..."
nx g @ddd-plugin/ddd:web-app smoke-next --framework=next --routerStyle=app --no-interactive
nx build smoke-next || exit 1

echo "Testing Next.js Pages Router generator..."
nx g @ddd-plugin/ddd:web-app smoke-next-pages --framework=next --routerStyle=pages --no-interactive
nx build smoke-next-pages || exit 1

echo "Testing Remix generator..."
nx g @ddd-plugin/ddd:web-app smoke-remix --framework=remix --no-interactive
nx build smoke-remix || exit 1

echo "Testing Expo generator..."
nx g @ddd-plugin/ddd:web-app smoke-expo --framework=expo --no-interactive
nx build smoke-expo || exit 1

# 6. Supabase Dev Stack
echo "Testing Supabase dev stack..."
if ! nx run supabase-devstack:start; then
  echo "Supabase start failed"
  exit 1
fi

SUPABASE_HEALTH_URL=${SUPABASE_HEALTH_URL:-http://localhost:54323}
MAX_ATTEMPTS=20
SLEEP_SECONDS=2
attempt=1
until curl -fs "${SUPABASE_HEALTH_URL}" >/dev/null; do
  if [ "${attempt}" -ge "${MAX_ATTEMPTS}" ]; then
    echo "Supabase failed health checks after $((MAX_ATTEMPTS * SLEEP_SECONDS))s"
    nx run supabase-devstack:stop || true
    exit 1
  fi
  attempt=$((attempt + 1))
  sleep "${SLEEP_SECONDS}"
done
nx run supabase-devstack:stop

# 7. Type Sync Workflow
echo "Testing type sync..."
nx run type-generator:generate
git diff --exit-code libs/shared/database-types || (
  echo "Type drift detected (expected if schema changed)"
)

echo "✅ All smoke tests passed!"
```

-   Make script executable: `chmod +x tests/e2e/hexddd-integration-smoke.sh`
-   Add to justfile: `just test-e2e` alias

2. **Create TypeScript/Jest integration test suite** at `tests/integration/hexddd-integration.test.ts`:

```typescript
// tests/integration/hexddd-integration.test.ts
import { UnitOfWork, InMemoryUnitOfWork } from "@shared/domain/unit-of-work";
import { EventBus, InMemoryEventBus } from "@shared/application/event-bus";
import { ApiClient } from "@shared/web/api-client";
import { execSync } from "child_process";
import * as fs from "fs";

describe("HexDDD Integration", () => {
    describe("Hexagonal Architecture", () => {
        let uow: UnitOfWork;
        let eventBus: EventBus;
        let testEvents: any[];

        beforeEach(() => {
            uow = new InMemoryUnitOfWork();
            testEvents = [];
            eventBus = new InMemoryEventBus();

            eventBus.subscribe("test.event", (event) => {
                testEvents.push(event);
            });
        });

        it("UoW manages transactions correctly", async () => {
            const testEntity = { id: "test-id", name: "test" };

            await uow.begin();
            expect(uow).toHaveProperty("isInTransaction");

            uow.registerNew(testEntity);
            await uow.commit();

            expect(testEvents.length).toBe(0);

            await uow.begin();
            uow.registerNew({ ...testEntity, id: "rollback-test" });
            await uow.rollback();

            expect(testEvents.length).toBe(0);
        });

        it("EventBus dispatches domain events", async () => {
            const domainEvent = {
                type: "test.event",
                payload: { entityId: "test-123", action: "created" },
                timestamp: new Date().toISOString(),
            };

            await eventBus.dispatch(domainEvent);

            expect(testEvents).toHaveLength(1);
            expect(testEvents[0]).toMatchObject({
                type: "test.event",
                payload: { entityId: "test-123", action: "created" },
            });
        });
    });

    describe("Type Safety", () => {
        it("API client uses generated types", () => {
            const client = new ApiClient();

            type GeneratedUser = {
                id: string;
                email: string;
                created_at: string;
            };

            const mockUser: GeneratedUser = {
                id: "123",
                email: "test@example.com",
                created_at: new Date().toISOString(),
            };

            expect(client).toHaveProperty("createUser");
            expect(typeof client.createUser).toBe("function");
        });

        it("Python types match TypeScript types", async () => {
            const tsTypes = execSync('find libs -name "*.ts" -exec grep -l "interface\\|type " {} \\;', { encoding: "utf-8" }).split(/\r?\n/).filter(Boolean);

            const pyTypes = execSync('find libs -name "*.py" -exec grep -l "Protocol\\|@dataclass" {} \\;', { encoding: "utf-8" }).split(/\r?\n/).filter(Boolean);

            expect(tsTypes.length).toBeGreaterThan(0);
            expect(pyTypes.length).toBeGreaterThan(0);
        });
    });

    describe("Generators", () => {
        it("all generators produce valid projects", async () => {
            const generators = [
                { project: "test-next-app", args: "--framework=next --routerStyle=app", label: "Next.js App Router" },
                { project: "test-next-pages", args: "--framework=next --routerStyle=pages", label: "Next.js Pages Router" },
                { project: "test-remix", args: "--framework=remix", label: "Remix" },
                { project: "test-expo", args: "--framework=expo", label: "Expo" },
            ];

            for (const { project, args, label } of generators) {
                execSync(`nx g @ddd-plugin/ddd:web-app ${project} ${args}`, { stdio: "pipe" });
                try {
                    const output = execSync(`pnpm nx build ${project}`, { encoding: "utf-8", stdio: "pipe" });
                    expect(output).toBeTruthy();
                } catch (error) {
                    throw new Error(`${label} build failed: ${(error as Error).message}`);
                }
            }
        });

        it("generator idempotency prevents file overwrites", async () => {
            const testProjectPath = "tmp/test-idempotency";
            try {
                execSync(`nx g @ddd-plugin/ddd:web-app test-app --framework=next --directory=${testProjectPath}`, { stdio: "pipe" });

                const modifiedContent = "// Custom user modification";
                execSync(`echo "${modifiedContent}" >> ${testProjectPath}/apps/test-app/pages/index.tsx`);

                execSync(`nx g @ddd-plugin/ddd:web-app test-app --framework=next --directory=${testProjectPath}`, { stdio: "pipe" });

                const fileContent = execSync(`cat ${testProjectPath}/apps/test-app/pages/index.tsx`, {
                    encoding: "utf-8",
                });

                expect(fileContent).toContain(modifiedContent);
            } finally {
                fs.rmSync(testProjectPath, { recursive: true, force: true });
            }
        });
    });
});
```

-   Ensure test runs with `pnpm test:jest tests/integration/hexddd-integration.test.ts`
-   Add to CI workflow in `.github/workflows/ci.yml`

3. **Create ShellSpec CLI validation** at `tests/integration/hexddd-cli-integration.sh`:

```bash
#!/bin/bash
# tests/integration/hexddd-cli-integration.sh

Describe "HexDDD CLI Integration Tests"
  Setup "Verify test environment"
    export NODE_ENV=test
    export NX_CLI_THEME=light
    export VERBOSE=true
  End

  Describe "Nx Generator Commands"
    It "generates Next.js app successfully"
      When run nx g @ddd-plugin/ddd:web-app cli-test-next --framework=next --no-interactive
      The status should be success
      The file "apps/cli-test-next/next.config.js" should exist
    End

    It "generates Remix app successfully"
      When run nx g @ddd-plugin/ddd:web-app cli-test-remix --framework=remix --no-interactive
      The status should be success
      The file "apps/cli-test-remix/app/routes/_index.tsx" should exist
    End

    It "generates Expo app successfully"
      When run nx g @ddd-plugin/ddd:web-app cli-test-expo --framework=expo --no-interactive
      The status should be success
      The file "apps/cli-test-expo/app.json" should exist
    End

    It "generates domain with proper boundaries"
      When run nx g @ddd-plugin/ddd:hex-domain cli-test-domain
      The status should be success
      The file "libs/cli-test-domain/domain/src/index.ts" should exist
    End
  End

  Describe "Supabase Dev Stack"
    It "starts Supabase stack successfully"
      When run timeout 60s nx run supabase-devstack:start
      The status should be success
      The output should include "Up"
    End

    It "stops Supabase stack successfully"
      When run nx run supabase-devstack:stop
      The status should be success
    End
  End

  Describe "Type Safety Enforcement"
    It "enforces Nx boundary violations"
      When run echo "import '../../../../../libs/domain';" > apps/test-boundary/index.ts
      And run nx lint apps/test-boundary
      The status should be failure
      The output should include "External import of domain"
    End
  End
End
```

**Exit Criteria**:

-   [ ] `bash tests/e2e/hexddd-integration-smoke.sh` passes with zero failures
-   [ ] `pnpm test:jest tests/integration/hexddd-integration.test.ts` passes all assertions
-   [ ] `shellspec tests/integration/hexddd-cli-integration.sh` passes all examples
-   [ ] All generated apps build successfully (Next.js App/Pages, Remix, Expo)
-   [ ] Supabase stack starts, health checks pass, and stops cleanly

---

### Task 1B: Core Documentation Updates

**What**: Update README, ARCHITECTURE, and ENVIRONMENT docs to reflect complete HexDDD integration.

**Implementation Steps**:

1. **Update README.md** with HexDDD integration overview:

-   Add "Hexagonal Architecture" section after project introduction
-   Include quick start commands for generators
-   Add badges for test coverage and build status
-   Content:

    ```markdown

    ```

`````

1. **Update README.md** with HexDDD integration overview:

-   Add "Hexagonal Architecture" section after project introduction
-   Include quick start commands for generators
-   Add badges for test coverage and build status
-   Content:

```markdown
## Hexagonal Architecture

This project uses hexagonal (ports & adapters) architecture:

-   **Domain Layer**: Pure business logic (`libs/*/domain`)
-   **Application Layer**: Use cases (`libs/*/application`)
-   **Infrastructure Layer**: Adapters (`libs/*/infrastructure`)    All generators enforce these boundaries automatically.

    ### Quick Start

    ```bash
    # Generate a new domain
    nx g @ddd-plugin/ddd:hex-domain user-management

    # Generate a React app
    nx g @ddd-plugin/ddd:web-app admin-portal --framework=next

    # Start Supabase dev stack
    nx run supabase-devstack:start
    ```

    ### Architecture Enforcement

    Nx tags enforce dependency constraints:

    -   Domain layers cannot import from application or infrastructure
    -   Application layers can only import from domain
    -   Infrastructure implements interfaces defined in application

    Violations fail CI with clear error messages.

    ```

2. **Update docs/ARCHITECTURE.md**:

-   Add "Unit of Work Pattern" section with code examples
-   Add "Event-Driven Architecture" section with EventBus usage
-   Add "Hexagonal Layers" diagram (mermaid)
-   Add "Nx Boundary Enforcement" section
-   Content additions:

```markdown
### Unit of Work Pattern

The UoW pattern manages transactional boundaries across repositories:

```typescript
import { UnitOfWork } from "@shared/domain";

class CreateUserUseCase {
    constructor(private uow: UnitOfWork) {}

        async execute(dto: CreateUserDto): Promise<User> {
            await this.uow.begin();
            try {
                const user = User.create(dto);
                this.uow.registerNew(user);
                await this.uow.commit();
                return user;
            } catch (error) {
                await this.uow.rollback();
                throw error;
            }
        }
    }
    ```
    ````

    ### Event-Driven Architecture

    Domain events enable loose coupling between bounded contexts:

    ```typescript
    import { EventBus } from "@shared/application";

    eventBus.subscribe("user.created", async (event) => {
        await sendWelcomeEmail(event.payload.userId);
    });

    await eventBus.dispatch({
        type: "user.created",
        payload: { userId: user.id },
        timestamp: new Date().toISOString(),
    });
    ```

    ### Hexagonal Layers

    ```mermaid
    graph TD
        A[Domain Layer] -->|Pure Logic| B[Application Layer]
        B -->|Ports/Interfaces| C[Infrastructure Layer]
        C -->|Implements| B
        D[UI/API] -->|Uses| B
    ```

    ```

3. **Update docs/ENVIRONMENT.md**:

-   Add "Supabase Dev Stack" section after mise/SOPS
-   Include Docker Compose commands
-   Add health check instructions
-   Content:

```markdown
## Supabase Dev Stack

Local Supabase instance for development:

```bash
    # Start stack (PostgreSQL, PostgREST, GoTrue, Storage, Realtime)
    nx run supabase-devstack:start

    # Access services
    # - Studio: http://localhost:54323
    # - API: http://localhost:54321
    # - DB: postgresql://postgres:postgres@localhost:54322/postgres

    # Health check
    curl http://localhost:54323/health

    # Stop stack
    nx run supabase-devstack:stop

    # Clean data (reset to migrations)
    nx run supabase-devstack:reset
    ```
    ````

    **Auto-start**: Configure `.mise.toml` to auto-start Supabase:

    ```toml
    [tasks.dev]
    run = "nx run supabase-devstack:start && nx serve"
    ```

    ```

    ```

**Exit Criteria**:

-   [ ] README includes hexagonal architecture overview and quick start commands
-   [ ] ARCHITECTURE.md documents UoW/EventBus patterns with code examples
-   [ ] ARCHITECTURE.md includes mermaid diagram showing hexagonal layers
-   [ ] ENVIRONMENT.md documents Supabase dev stack setup and commands
-   [ ] All internal links validated with `just docs-lint`

---

### Task 1C: Generator Usage Documentation

**What**: Create comprehensive usage guides for all generators in `docs/generators/`.

**Implementation Steps**:

1. **Create docs/generators/ directory structure**:

```bash
mkdir -p docs/generators
touch docs/generators/README.md
touch docs/generators/hex-domain.md
touch docs/generators/web-app.md
`````

2. **Create docs/generators/README.md** (generator index):

```markdown
# Generator Usage Guides

This directory contains detailed usage guides for all Nx generators.

## Available Generators

| Generator    | Purpose                                    | Guide                                           |
| ------------ | ------------------------------------------ | ----------------------------------------------- |
| `hex-domain` | Create hexagonal domain with layers        | [hex-domain.md](../../generators/hex-domain.md) |
| `web-app`    | Universal React app (Next.js, Remix, Expo) | [web-app.md](../../generators/web-app.md)       |

## Common Options

All generators support:

-   `--dry-run`: Preview changes without writing files
-   `--no-interactive`: Skip prompts (use defaults or CLI args)
-   `--help`: Show all available options

## Idempotency

All generators are idempotent - safe to run multiple times. They:

-   Skip files that already exist unchanged
-   Preserve user modifications
-   Update only configuration files when schemas change
```

3. **Create docs/generators/hex-domain.md**:

````markdown
# hex-domain Generator

Creates a new bounded context with hexagonal architecture layers.

## Usage

```bash
nx g @ddd-plugin/ddd:hex-domain <domain-name> [options]
```
````

## Options

| Option        | Type       | Default    | Description              |
| ------------- | ---------- | ---------- | ------------------------ |
| `name`        | string     | (required) | Domain name (kebab-case) |
| `--directory` | string     | `libs/`    | Output directory         |
| `--language`  | ts\|python | `ts`       | Implementation language  |

## Generated Structure

```
libs/<domain-name>/
├── domain/          # Pure business logic
│   ├── src/
│   │   ├── entities/
│   │   ├── value-objects/
│   │   └── index.ts
│   └── project.json (tags: ["type:domain", "scope:<domain-name>"])
├── application/     # Use cases
│   ├── src/
│   │   ├── use-cases/
│   │   ├── ports/
│   │   └── index.ts
│   └── project.json (tags: ["type:application", "scope:<domain-name>"])
└── infrastructure/  # Adapters
    ├── src/
    │   ├── repositories/
    │   ├── services/
    │   └── index.ts
    └── project.json (tags: ["type:infrastructure", "scope:<domain-name>"])
```

## Examples

```bash
# TypeScript domain
nx g @ddd-plugin/ddd:hex-domain user-management

# Python domain
nx g @ddd-plugin/ddd:hex-domain billing --language=python

# Custom directory
nx g @ddd-plugin/ddd:hex-domain orders --directory=libs/commerce
```

## Nx Tag Enforcement

The generator automatically configures Nx tags to enforce dependency rules:

-   Domain cannot import application or infrastructure
-   Application can only import domain
-   Infrastructure implements application ports

Violations fail linting with clear error messages.

```

```

4. **Create docs/generators/web-app.md**:

````markdown
# web-app Generator

Universal React app generator supporting Next.js (App/Pages Router), Remix, and Expo.

## Usage

```bash
nx g @ddd-plugin/ddd:web-app <app-name> [options]
```
````

## Options

| Option          | Type              | Default    | Description                |
| --------------- | ----------------- | ---------- | -------------------------- |
| `name`          | string            | (required) | App name (kebab-case)      |
| `--framework`   | next\|remix\|expo | `next`     | React framework            |
| `--routerStyle` | app\|pages        | `app`      | Next.js router (App/Pages) |
| `--directory`   | string            | `apps/`    | Output directory           |

## Framework Templates

### Next.js App Router

```bash
nx g @ddd-plugin/ddd:web-app admin --framework=next --routerStyle=app
```

Generates:

-   `app/` directory with layouts/pages
-   API routes in `app/api/`
-   Shared `ApiClient` integration
-   TypeScript strict mode

### Next.js Pages Router

```bash
nx g @ddd-plugin/ddd:web-app marketing --framework=next --routerStyle=pages
```

Generates:

-   `pages/` directory with routes
-   API routes in `pages/api/`
-   `getServerSideProps`/`getStaticProps` examples

### Remix

```bash
nx g @ddd-plugin/ddd:web-app dashboard --framework=remix
```

Generates:

-   `app/routes/` with loaders/actions
-   Shared `ApiClient` integration
-   Server-side session handling

### Expo

```bash
nx g @ddd-plugin/ddd:web-app mobile --framework=expo
```

Generates:

-   Expo Router structure
-   React hooks for API calls
-   Platform-specific code organization

## Shared Features

All generated apps include:

-   Shared `ApiClient` from `@shared/web`
-   TypeScript strict mode
-   ESLint + Prettier configuration
-   Jest test setup
-   Build/serve Nx targets

## Examples

```bash
# Next.js with App Router (default)
nx g @ddd-plugin/ddd:web-app admin

# Next.js with Pages Router
nx g @ddd-plugin/ddd:web-app marketing --routerStyle=pages

# Remix app
nx g @ddd-plugin/ddd:web-app dashboard --framework=remix

# Expo mobile app
nx g @ddd-plugin/ddd:web-app mobile --framework=expo

# Custom directory
nx g @ddd-plugin/ddd:web-app portal --directory=apps/customer-facing
```

**Exit Criteria**:

-   [ ] `docs/generators/README.md` exists with generator index
-   [ ] `docs/generators/hex-domain.md` documents all options and examples
-   [ ] `docs/generators/web-app.md` documents all frameworks and router styles
-   [ ] All code examples validated (can copy-paste and run)
-   [ ] Internal links between guides functional

---

### Task 1D: AGENTS.md and Copilot Instructions Update

**What**: Update AGENTS.md and .github/copilot-instructions.md to include hexagonal architecture and Nx tag enforcement guidance.

**Implementation Steps**:

1. **Update AGENTS.md** with hexagonal architecture rules:

-   Add after existing Nx configuration
-   Content:

    ```markdown

    ```

````

1. **Update AGENTS.md** with hexagonal architecture rules:

-   Add after existing Nx configuration
-   Content:

```markdown
# Hexagonal Architecture Guidelines

## Layer Dependency Rules (ENFORCED BY NX TAGS)    **CRITICAL**: These rules are enforced by Nx linting. Violations will fail CI.

    ### Domain Layer (`type:domain`)

    -   **CAN**: Define entities, value objects, domain events, repository interfaces
    -   **CANNOT**: Import from application or infrastructure layers
    -   **CANNOT**: Import external libraries (except standard library)
    -   **REASON**: Domain must be pure business logic, framework-agnostic

    ### Application Layer (`type:application`)

    -   **CAN**: Import from domain layer only
    -   **CAN**: Define use cases, ports (interfaces for infrastructure)
    -   **CANNOT**: Import from infrastructure layer
    -   **CANNOT**: Import UI frameworks
    -   **REASON**: Use cases orchestrate domain logic, define contracts for infrastructure

    ### Infrastructure Layer (`type:infrastructure`)

    -   **CAN**: Import from domain and application layers
    -   **CAN**: Import external libraries (database clients, HTTP libraries, etc.)
    -   **CAN**: Implement application ports
    -   **REASON**: Adapters implement technical details, replaceable without affecting business logic

    ## Nx Tag Configuration

    Every `project.json` must include tags:

    ```json
    {
        "tags": [
            "type:domain", // or application, infrastructure
            "scope:user-management" // bounded context name
        ]
    }
    ```

## Validation

Run `pnpm nx run-many -t lint --all` to validate boundaries.

Example violation error:

````

A project tagged with "type:domain" cannot depend on projects tagged with "type:infrastructure"

```

```

2. **Update .github/copilot-instructions.md**:

-   Add hexagonal architecture section before "Coding Standards"
-   Content:

````markdown
### Hexagonal Architecture Enforcement

**Before creating any new code in `libs/`, check the layer you're working in:**

1.  **Domain Layer** (`libs/*/domain/`):

    -   Pure TypeScript/Python with ZERO external dependencies
    -   Define entities, value objects, domain events
    -   Use dependency injection for repository interfaces
    -   Example:

    ```typescript
    // ✅ CORRECT: Pure domain entity
    export class User {
        constructor(
            private readonly id: UserId,
            private readonly email: Email,
        ) {}

        changeEmail(newEmail: Email): void {
            // Pure business logic
        }
    }

    // ❌ WRONG: External dependency in domain
    import { createClient } from "@supabase/supabase-js";
    ```

2.  **Application Layer** (`libs/*/application/`):

        - Import domain entities and value objects
        - Define use cases (orchestrate domain logic)
        - Define ports (interfaces for infrastructure)
        - Example:

            ```typescript
            // ✅ CORRECT: Use case with port
            export class CreateUserUseCase {
                constructor(private userRepo: UserRepository) {} // Port

                async execute(dto: CreateUserDto): Promise<User> {
                    const user = User.create(dto);
                    await this.userRepo.save(user);
                    return user;
                }
            }

            // ❌ WRONG: Direct infrastructure dependency
            import { SupabaseUserRepository } from "@infrastructure/repositories";
            ```

    3. **Infrastructure Layer** (`libs/*/infrastructure/`):

        - Implement application ports
        - Use external libraries (Supabase, Prisma, etc.)
        - Handle technical concerns (HTTP, DB, file I/O)
        - Example:

            ```typescript
            // ✅ CORRECT: Infrastructure implements port
            export class SupabaseUserRepository implements UserRepository {
                constructor(private supabase: SupabaseClient) {}

                async save(user: User): Promise<void> {
                    await this.supabase.from("users").insert(user.toDTO());
                }
            }
            ```

**Validation**: Run `pnpm nx run-many -t lint --all` after changes.
````

**Exit Criteria**:

-   [ ] AGENTS.md includes hexagonal architecture rules with examples
-   [ ] AGENTS.md documents Nx tag enforcement with violation examples
-   [ ] .github/copilot-instructions.md includes layer-specific guidance
-   [ ] All code examples are syntactically correct and follow project conventions
-   [ ] `pnpm nx run-many -t lint --all` passes after updates

---

## Phase 2: Traceability Matrix & Migration Guide (Sprint 5)

### Task 2A: Complete Traceability Matrix

**What**: Update `docs/traceability_matrix.md` with 100% spec coverage (23/23 specs mapped).

**Implementation Steps**:

1. **Update docs/traceability_matrix.md** with complete HexDDD integration traceability:

```markdown
## HexDDD Integration Traceability

| Spec ID     | Type | Requirement            | Implementation                                                   | Validation             | Status |
| ----------- | ---- | ---------------------- | ---------------------------------------------------------------- | ---------------------- | ------ |
| DEV-ADR-023 | ADR  | Idempotent generators  | `tests/generators/utils/idempotency.ts`                          | `just test-generators` | ✅     |
| DEV-ADR-024 | ADR  | UoW/EventBus           | `libs/shared/domain`, `libs/shared/application`                  | Integration tests      | ✅     |
| DEV-ADR-025 | ADR  | Nx boundaries          | `nx.json` tags + lint rules                                      | `pnpm nx lint`         | ✅     |
| DEV-ADR-026 | ADR  | Supabase stack         | `docker/docker-compose.supabase.yml`                             | Smoke test             | ✅     |
| DEV-ADR-027 | ADR  | Nx upgrade             | `docs/runbooks/nx_upgrade.md`                                    | Manual process         | ✅     |
| DEV-ADR-028 | ADR  | Universal React gen    | `generators/react/`                                              | Framework builds       | ✅     |
| DEV-ADR-029 | ADR  | Strict typing          | `tsconfig.base.json`, `mypy.ini`                                 | Type checks            | ✅     |
| DEV-PRD-024 | PRD  | Idempotent workflow    | Double-run tests                                                 | ShellSpec + Jest       | ✅     |
| DEV-PRD-025 | PRD  | Dependency constraints | Nx enforce-module-boundaries                                     | Lint                   | ✅     |
| DEV-PRD-026 | PRD  | Transactional UoW      | UoW contracts + adapters                                         | Unit tests             | ✅     |
| DEV-PRD-027 | PRD  | Supabase automation    | Docker Compose + Nx targets                                      | Start/stop tests       | ✅     |
| DEV-PRD-028 | PRD  | Nx upgrade gate        | Runbook + validation suite                                       | Manual                 | ✅     |
| DEV-PRD-029 | PRD  | Universal React gen    | Single generator, 4 surfaces (Next App, Next Pages, Remix, Expo) | Build tests            | ✅     |
| DEV-PRD-030 | PRD  | Strict typing gate     | TS + Python strict configs                                       | CI checks              | ✅     |
| DEV-PRD-031 | PRD  | Type sync CI           | GitHub Actions workflow                                          | Type drift detection   | ✅     |
| DEV-SDS-023 | SDS  | Idempotency patterns   | Pattern library + docs                                           | Code review            | ✅     |
| DEV-SDS-024 | SDS  | Tag configuration      | nx.json + project.json tags                                      | Lint                   | ✅     |
| DEV-SDS-025 | SDS  | UoW/EventBus impl      | Contracts + in-memory adapters                                   | Tests                  | ✅     |
| DEV-SDS-026 | SDS  | Supabase tooling       | Docker Compose + env files                                       | Smoke                  | ✅     |
| DEV-SDS-027 | SDS  | Upgrade runbook        | `docs/runbooks/nx_upgrade.md`                                    | Manual                 | ✅     |
| DEV-SDS-028 | SDS  | React gen design       | Generator schema + templates                                     | E2E                    | ✅     |
| DEV-SDS-029 | SDS  | Strict type config     | Config files + lint rules                                        | CI                     | ✅     |
| DEV-SDS-030 | SDS  | Type sync workflow     | Workflows + hooks                                                | CI + local             | ✅     |

**Coverage**: 23/23 (100%)

## Validation Commands

| Spec Category        | Command                                                                 | Expected Result              |
| -------------------- | ----------------------------------------------------------------------- | ---------------------------- |
| Generators           | `just test-generators`                                                  | All idempotency tests pass   |
| Hexagonal Boundaries | `pnpm nx run-many -t lint --all`                                        | No boundary violations       |
| Type Safety          | `pnpm tsc --noEmit && uv run mypy --strict`                             | No type errors               |
| UoW/EventBus         | `pnpm nx test shared-domain shared-application`                         | All unit tests pass          |
| Supabase Stack       | `nx run supabase-devstack:start && curl http://localhost:54323/health`  | HTTP 200 OK                  |
| React Generators     | `just test-e2e`                                                         | All framework builds succeed |
| Type Sync            | `nx run type-generator:generate && git diff libs/shared/database-types` | No drift or expected drift   |
| Full Integration     | `just spec-guard`                                                       | All gates GREEN              |
```

2. **Verify all spec IDs exist** in source docs:

-   Cross-reference against `docs/dev_adr.md`, `docs/dev_prd.md`, `docs/dev_sds.md`
-   Ensure no orphaned spec IDs in matrix
-   Ensure no missing spec IDs from source docs

3. **Add validation automation** to justfile:

```bash
# justfile addition
verify-traceability:
  #!/usr/bin/env bash
  echo "Verifying traceability matrix completeness..."

  # Extract spec IDs from source docs
  SOURCE_SPECS=$(grep -Eo 'DEV-(ADR|PRD|SDS)-[0-9]{3}' docs/dev_*.md | sort -u)

  # Extract spec IDs from traceability matrix
  MATRIX_SPECS=$(grep -Eo 'DEV-(ADR|PRD|SDS)-[0-9]{3}' docs/traceability_matrix.md | sort -u)

  # Find missing specs
  MISSING=$(comm -23 <(echo "$SOURCE_SPECS") <(echo "$MATRIX_SPECS"))

  if [ -n "$MISSING" ]; then
    echo "❌ Missing specs in traceability matrix:"
    echo "$MISSING"
    exit 1
  fi

  echo "✅ Traceability matrix complete (100% coverage)"
```

**Exit Criteria**:

-   [ ] All 23 specs (DEV-ADR-023-029, DEV-PRD-024-031, DEV-SDS-023-030) present in matrix
-   [ ] Each spec mapped to implementation files and validation methods
-   [ ] All Status fields marked ✅ (GREEN)
-   [ ] `just verify-traceability` passes
-   [ ] Coverage shows 23/23 (100%)

---

### Task 2B: Migration Guide for Existing Projects

**What**: Create `docs/MIGRATION_HEXDDD.md` with step-by-step upgrade path for existing VibesPro projects.

**Implementation Steps**:

1. **Create docs/MIGRATION_HEXDDD.md** with complete migration workflow:

````markdown
# HexDDD Integration Migration Guide

## For Existing VibesPro Projects

If you generated a project **before** the HexDDD integration, follow these steps to upgrade.

### Prerequisites

-   Existing VibesPro project (pre-HexDDD)
-   Git repository with clean working directory
-   Copier installed: `pipx install copier`

### Migration Steps

#### 1. Backup Current State

```bash
git checkout -b pre-hexddd-backup
git commit -am "Backup before HexDDD migration"
git checkout main
```
````

````

#### 2. Update Template Dependencies

```bash
copier update
```

Answer prompts (or use `--defaults` to keep existing answers).

#### 3. Retrofit Generators (Idempotent - Safe to Re-run)

All generators are now idempotent. Re-run them to add missing structure:

```bash
# Re-run domain generator (will not overwrite custom code)
nx g @ddd-plugin/ddd:hex-domain my-existing-domain

# Re-run web app generators
nx g @ddd-plugin/ddd:web-app my-existing-app --framework=next
```

**What happens**: Generators will:

-   Skip files that already exist and are unchanged
-   Preserve your custom modifications
-   Update only configuration files (project.json, tsconfig.json)

#### 4. Add Nx Boundary Tags

Update all `project.json` files in `libs/`:

```json
{
    "tags": [
        "type:domain", // Choose: domain, application, infrastructure
        "scope:my-domain" // Bounded context name
    ]
}
```

**Validation**:

```bash
pnpm nx run-many -t lint --all
```

#### 5. Enable Strict Type Checking

**TypeScript** (tsconfig.base.json):

```json
{
    "compilerOptions": {
        "strict": true,
        "noUncheckedIndexedAccess": true,
        "noImplicitReturns": true,
        "noFallthroughCasesInSwitch": true
    }
}
```

**Python** (mypy.ini):

```ini
[mypy]
strict = True
warn_unused_configs = True
warn_redundant_casts = True
warn_unused_ignores = True
```

**Fix type errors**:

```bash
# TypeScript
pnpm tsc --noEmit

# Python
uv run mypy --strict
```

Incrementally fix errors. Use `// @ts-expect-error` with justification for unavoidable cases.

#### 6. Integrate UoW/EventBus (Optional)

If your domain needs transactions or events:

```typescript
import { UnitOfWork, InMemoryUnitOfWork } from "@shared/domain";
import { EventBus, InMemoryEventBus } from "@shared/application";

// In your use case
class CreateOrderUseCase {
    constructor(
        private uow: UnitOfWork,
        private eventBus: EventBus,
    ) {}

    async execute(dto: CreateOrderDto): Promise<Order> {
        await this.uow.begin();
        try {
            const order = Order.create(dto);
            this.uow.registerNew(order);
            await this.uow.commit();

            await this.eventBus.dispatch({
                type: "order.created",
                payload: { orderId: order.id },
                timestamp: new Date().toISOString(),
            });

            return order;
        } catch (error) {
            await this.uow.rollback();
            throw error;
        }
    }
}
```

#### 7. Set Up Supabase Dev Stack (Optional)

```bash
# Start Supabase stack
nx run supabase-devstack:start

# Verify health
curl http://localhost:54323/health

# Access Studio
open http://localhost:54323
```

#### 8. Run Migration Validation

```bash
# Ensure everything still works
just test
just ai-validate
just spec-guard

# Test all builds
pnpm nx run-many -t build --all

# Test generation workflow
just test-generation
```

#### 9. Update CI/CD Pipelines

If you have custom CI workflows, add type sync workflow:

```yaml
# .github/workflows/type-sync.yml
name: Type Sync

on:
    schedule:
        - cron: "0 2 * * *" # Daily at 2 AM
    workflow_dispatch:

jobs:
    type-sync:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v4
            - uses: ./.github/actions/setup
            - name: Generate types
              run: nx run type-generator:generate
            - name: Check for drift
              run: |
                  if ! git diff --exit-code libs/shared/database-types; then
                    echo "Type drift detected"
                    exit 1
                  fi
```

#### 10. Commit Migration

```bash
git add .
git commit -m "chore: migrate to HexDDD integration [DEV-ADR-023, DEV-ADR-024, DEV-ADR-025]

- Retrofit idempotent generators
- Add Nx boundary tags
- Enable TypeScript/Python strict mode
- Integrate UoW/EventBus patterns
- Set up Supabase dev stack
- Add type sync CI workflow

Refs: DEV-PRD-024, DEV-SDS-023
Risk: Breaking changes in strict mode (mitigated with incremental fixes)"
```

### Breaking Changes

**None** - All changes are additive and backward-compatible.

Existing code continues to work. New features (UoW, EventBus, Supabase) are opt-in.

### Rollback Procedure

If migration fails:

```bash
git checkout pre-hexddd-backup
git branch -D main
git checkout -b main
```

### Support

-   Questions? Open an issue at https://github.com/GodSpeedAI/VibesPro/issues
-   Documentation: `docs/plans/hexddd_integration/`
-   Slack: #vibes-pro-support

### Post-Migration Checklist

-   [ ] All tests pass (`just test`)
-   [ ] All builds succeed (`pnpm nx run-many -t build --all`)
-   [ ] Linting passes (`pnpm nx run-many -t lint --all`)
-   [ ] Type checks pass (`pnpm tsc --noEmit`, `uv run mypy --strict`)
-   [ ] Supabase stack operational (if using)
-   [ ] CI/CD pipelines updated and GREEN
-   [ ] Team notified of new patterns (UoW, EventBus)

```

```

**Exit Criteria**:

-   [ ] `docs/MIGRATION_HEXDDD.md` exists with complete 10-step migration workflow
-   [ ] All commands tested and verified functional
-   [ ] Rollback procedure documented and tested
-   [ ] Migration guide includes breaking changes section (none expected)
-   [ ] Post-migration checklist comprehensive and actionable

---

## Pre-Work: Required Reading (25 minutes)

**Priority Order** (read in this sequence):

1. `docs/plans/hexddd_integration/PHASE-001-IDEMPOTENCY.md` — Generator idempotency patterns (5 min)
2. `docs/plans/hexddd_integration/PHASE-002-HEXAGONAL_FOUNDATIONS.md` — UoW/EventBus architecture (7 min)
3. `docs/plans/hexddd_integration/PHASE-003-UNIVERSAL_REACT_GENERATOR.md` — React generator design (6 min)
4. `docs/plans/hexddd_integration/PHASE-004-TYPE_SAFETY_CI.md` — Type safety enforcement (5 min)
5. Skim: `docs/dev_adr.md`, `docs/dev_prd.md`, `docs/dev_sds.md` — Spec context (2 min)

**Context Check**: After reading, you should understand:

-   How generators achieve idempotency (hash comparison, file existence checks)
-   UoW/EventBus contracts and their role in hexagonal architecture
-   How Nx tags enforce layer boundaries
-   Type safety enforcement strategy (strict modes, CI workflows, pre-commit hooks)
-   The 23 specifications this phase completes

---

## Execution Protocol

### Decision-Making Authority

You are **authorized** to:

-   Write test scripts (smoke tests, integration tests, ShellSpec specs)
-   Update documentation files (README, ARCHITECTURE, ENVIRONMENT, generators/)
-   Add content to AGENTS.md and .github/copilot-instructions.md
-   Create migration guide with step-by-step instructions
-   Update traceability matrix with 100% spec coverage
-   Add justfile recipes for validation automation

You **must ask** before:

-   Modifying existing generator code (Phase 1-3 deliverables)
-   Changing Nx configuration (nx.json, project.json tags)
-   Modifying CI/CD workflows (.github/workflows/)
-   Adding new dependencies to package.json or pyproject.toml
-   Changing architecture decisions documented in ADRs

### Quality Gates

Run after **each task** completion:

```bash
# Smoke tests
bash tests/e2e/hexddd-integration-smoke.sh  # Must pass - all generators, boundaries, type safety

# Integration tests
pnpm test:jest tests/integration/hexddd-integration.test.ts  # Must pass - UoW/EventBus/generators

# ShellSpec CLI tests
shellspec tests/integration/hexddd-cli-integration.sh  # Must pass - CLI commands

# Documentation linting
just docs-lint  # Must pass - link checking, markdown format

# Traceability verification
just verify-traceability  # Must pass - 100% spec coverage

# Full validation suite
just spec-guard  # Must pass - all quality gates
```

### Iteration Protocol

If any check fails:

1. Analyze failure root cause (read error messages completely)
2. Fix issue in appropriate file(s)
3. Re-run failed check + all dependent checks
4. Continue until all pass

**Do not proceed to next task with failing checks.**

---

## Output Format

After completing each task, provide:

```markdown
## [Task ID] Status: [COMPLETE|BLOCKED]

### Changes Made

-   [Bullet list of files created/modified]
-   [Key implementation decisions]

### Verification Results

-   [ ] Tests pass: [command output summary]
-   [ ] Documentation updated: [affected files]
-   [ ] Links validated: [just docs-lint result]

### Blockers (if any)

[Description + proposed solution + help needed]
```

---

## Anti-Patterns to Avoid

❌ **Don't**: Write tests that pass without actually validating functionality (false positives)
✅ **Do**: Write tests that fail when expected behavior breaks (use assertions liberally)

❌ **Don't**: Update documentation without testing all code examples
✅ **Do**: Copy-paste every code snippet and verify it runs/compiles

❌ **Don't**: Mark specs as complete (✅) in traceability matrix without verification commands
✅ **Do**: Document exact commands used to validate each spec

❌ **Don't**: Skip migration guide testing ("looks good enough")
✅ **Do**: Follow migration guide step-by-step in a test project to verify it works

❌ **Don't**: Create orphaned documentation (not linked from anywhere)
✅ **Do**: Add links from README/ARCHITECTURE to all new docs, verify with `just docs-lint`

❌ **Don't**: Assume existing tests cover new integration paths
✅ **Do**: Write explicit integration tests for UoW+EventBus, generators+builds, Supabase stack

---

## Codebase Intelligence Sources

**Essential Files**:

-   `docs/dev_adr.md` — Architecture decisions (DEV-ADR-023-029)
-   `docs/dev_prd.md` — Product requirements (DEV-PRD-024-031)
-   `docs/dev_sds.md` — Software design specs (DEV-SDS-023-030)
-   `docs/traceability_matrix.md` — Existing traceability (update with HexDDD specs)

**Relevant Prior Work**:

-   PHASE-001: Generator idempotency patterns
-   PHASE-002: UoW/EventBus implementations (`libs/shared/domain`, `libs/shared/application`)
-   PHASE-003: Universal React generator (`generators/react/`, `libs/shared/web`)
-   PHASE-004: Type safety configs (`tsconfig.base.json`, `mypy.ini`, `.github/workflows/type-sync.yml`)

**Reference Implementations**:

-   `tests/generators/idempotency.test.ts` — Existing generator tests to extend
-   `libs/shared/domain/src/unit-of-work.ts` — UoW contracts to test
-   `libs/shared/application/src/event-bus.ts` — EventBus contracts to test
-   `docker/docker-compose.supabase.yml` — Supabase stack to validate

**API/Library Documentation**:

-   Nx testing: https://nx.dev/recipes/running-tasks/run-tests
-   ShellSpec: https://shellspec.info/
-   Supabase: https://supabase.com/docs/guides/self-hosting/docker
-   Jest: https://jestjs.io/docs/getting-started

---

## Special Considerations

### Test Reliability

-   All smoke tests must be idempotent (can run multiple times)
-   Clean up generated test artifacts (apps/smoke-_, tmp/_)
-   Use timeouts for health checks (Supabase may take 30+ seconds to start)
-   Expect generator re-runs to be no-ops (verify with hash comparisons)

### Documentation Freshness

-   All code examples must be syntactically valid (test with TypeScript compiler/Python interpreter)
-   All commands must be tested in actual shell (bash/zsh)
-   All links must be validated with `just docs-lint`
-   Screenshots/diagrams should be reproducible (use mermaid for diagrams)

### Traceability Accuracy

-   Every spec ID must exist in source docs (dev_adr.md, dev_prd.md, dev_sds.md)
-   Every implementation path must be an actual file in the codebase
-   Every validation method must be a runnable command
-   100% coverage means ALL 23 specs mapped, not just "most"

### Migration Testing

-   Test migration guide on a clean pre-HexDDD project clone
-   Verify all commands work in both bash and zsh
-   Document any platform-specific issues (Linux/macOS/Windows)
-   Test rollback procedure to ensure it works

---

## Begin Execution

Start with **Pre-Work reading**, then proceed to **Phase 1, Task 1A**.

Report status after completing each task using the output format above.

After completing all tasks, run the complete validation suite:

```bash
bash tests/e2e/hexddd-integration-smoke.sh
pnpm test:jest tests/integration/hexddd-integration.test.ts
shellspec tests/integration/hexddd-cli-integration.sh
just docs-lint
just verify-traceability
just spec-guard
pnpm nx run-many -t build --all
just test-generation
```

When all gates are GREEN, Phase 5 (and the complete HexDDD integration project) is COMPLETE. 🎉
````
