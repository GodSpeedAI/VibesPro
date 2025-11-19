# Domain Model Blueprint for Generated Projects

## Purpose

This document codifies the domain-driven design (DDD) and hexagonal architecture assets that every VibesPro-generated project produces. Use it to understand what the generators scaffold by default, how the layers collaborate, and where to extend the model when tailoring a specific product domain.

## Layered Architecture Overview

| Layer          | Responsibility                                     | Default Artifacts                                                                                          | Nx Location / Tags                                     |
| -------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Domain         | Pure business logic and invariants                 | Entities, Value Objects, Aggregates, Domain Events, Domain Services, Specifications, Exceptions, Factories | `libs/{domain}/domain` (`type:domain`)                 |
| Application    | Orchestrates use cases via ports                   | Use Cases, DTOs, Ports (Repository, UnitOfWork, EventBus, Cache, External API)                             | `libs/{domain}/application` (`type:application`)       |
| Infrastructure | Implements ports and integrations                  | In-memory adapters, DB adapters, message broker adapters, mappers, transaction helpers                     | `libs/{domain}/infrastructure` (`type:infrastructure`) |
| Interface      | Translates external inputs to application commands | HTTP/GraphQL/CLI controllers, routes, transport DTOs, validators, e2e tests                                | `libs/{domain}/interface` or `apps/*`                  |
| Cross-cutting  | Workspace wiring & documentation                   | Nx project.json, tags, targets, README, traceability docs, test scaffolds                                  | Project root collateral                                |

## Domain Layer

The domain layer is dependency-free and encoded in strict TypeScript/Python types. Generators enforce immutability where appropriate and discourage `any`, ensuring type-safe imports.

### Entities and Value Objects

- Entities capture identity-rich aggregates (e.g., `Order`, `User`).
- Value Objects model immutable concepts (e.g., `Money`, `Email`) with validation baked in.
- Constructors shield invariants; factories or static builders hide validation complexity.

### Aggregates and Domain Events

- Aggregates define transactional consistency boundaries with clear roots (`OrderAggregate`).
- Domain events (`OrderCreatedEvent`) are emitted from aggregates and carry metadata (timestamps, correlation IDs).
- Event payloads keep transport concerns out of the domain by remaining serializable primitives/value objects.

### Domain Services, Specifications, and Exceptions

- Stateless domain services house logic that does not belong to a single entity.
- Specification/predicate classes provide reusable business-rule checks.
- Domain-specific exceptions/errors signal invariant breaks without leaking infrastructure concerns.

### Factories and Builders

- Factories encapsulate aggregate creation (e.g., seeding child entities, default states).
- Test builders allow quick aggregate instantiation inside unit tests while preserving invariants.

## Application Layer

The application layer orchestrates use cases and defines all inbound/outbound contracts so that infrastructure can be swapped without touching business logic.

### Use Cases and DTOs

- Each use case (e.g., `CreateOrderUseCase`) exposes a single execute method returning DTOs or void.
- DTOs live alongside use cases and act as serialization boundaries between application and interface layers.

### Ports and Contracts

- Repository ports describe persistence operations using domain-friendly signatures.
- Additional ports ship for cache, search, external APIs, and notification channels depending on generator options.
- Ports are exported via barrel files to keep imports concise throughout the workspace.

### Unit of Work and Event Bus

- A UnitOfWork port standardizes transactional boundaries (`begin`, `commit`, `rollback`, resource registration).
- EventBus contracts expose `publish`/`subscribe` APIs with strongly typed payloads.
- Decorators/helpers are generated to inject UoW and EventBus implementations into use cases.

### Application Testing Support

- Jest/pytest unit test scaffolds accompany every use case and port, encouraging red→green development.
- Test doubles (e.g., in-memory repositories) are colocated for fast and deterministic suites.

## Infrastructure Layer

Infrastructure projects implement the contracts published by the application layer and remain swappable.

### Adapter Families

- In-memory adapters power local development and unit/integration tests.
- Database adapters (Supabase/Postgres skeletons) outline persistence mappings and TODO markers for data access code.
- Message bus adapters (Kafka/Rabbit/etc.) provide event bus implementations with retry/dead-letter hooks.

### Mappers and Transaction Utilities

- Mappers convert between domain objects and persistence/transport schemas to keep models pure.
- Transaction helpers ensure UnitOfWork semantics stay consistent regardless of backing data store.

### Nx Metadata and Targets

- Each infrastructure lib ships with `project.json` targets for build, lint, and test plus tags enforcing `domain <- application <- infrastructure` rules.
- Generators pre-wire Just/Nx commands (e.g., `nx run orders-infrastructure:test`) so CI usage is turnkey.

## Interface Layer

Interface adapters expose the application layer to delivery channels (HTTP, CLI, messaging, etc.).

### Presentation Adapters

- HTTP controllers and route modules translate incoming transport DTOs to application DTOs.
- CLI or GraphQL adapters can be toggled on depending on template options, each preloaded with validation and error mapping patterns.

### Validation and DTO Mapping

- Zod/Yup (TS) or Pydantic (Python) schemas validate inbound payloads before calling use cases.
- Response DTOs map back to transport representations without leaking domain internals.

### End-to-End Coverage

- E2E test harnesses live beside interface adapters and show how to boot the stack using in-memory infrastructure defaults.

## Testing and Documentation Assets

- Unit, integration, and E2E test skeletons accompany every layer to enforce coverage from the outset.
- README files summarize the domain, reference relevant spec IDs (DEV/PRD/SDS), and highlight generated Nx commands.
- Traceability docs (`docs/traceability.md`) map files to specs/ADRs, supporting compliance and reviews.

## Sample Generated File Tree ("orders" Domain)

```text
libs/orders/
├── domain/
│   ├── src/
│   │   ├── entities/
│   │   │   ├── order.ts
│   │   │   └── order-id.ts
│   │   ├── value-objects/
│   │   │   ├── money.ts
│   │   │   └── order-status.ts
│   │   ├── aggregates/
│   │   │   └── order-aggregate.ts
│   │   ├── events/
│   │   │   └── order-created.event.ts
│   │   ├── errors/
│   │   │   └── order-error.ts
│   │   ├── factories/
│   │   │   └── order-factory.ts
│   │   └── index.ts
│   ├── tests/
│   │   └── unit/
│   │       └── entities/
│   │           └── order.test.ts
│   └── README.md
├── application/
│   ├── src/
│   │   ├── ports/
│   │   │   ├── order-repository.port.ts
│   │   │   ├── unit-of-work.port.ts
│   │   │   └── event-bus.port.ts
│   │   ├── use-cases/
│   │   │   ├── create-order.usecase.ts
│   │   │   └── cancel-order.usecase.ts
│   │   ├── dto/
│   │   │   └── create-order.dto.ts
│   │   └── index.ts
│   ├── tests/
│   │   └── unit/
│   │       └── use-cases/
│   │           └── create-order.test.ts
│   └── README.md
├── infrastructure/
│   ├── src/
│   │   ├── adapters/
│   │   │   ├── in-memory/
│   │   │   │   ├── in-memory-order-repo.ts
│   │   │   │   ├── in-memory-uow.ts
│   │   │   │   └── in-memory-event-bus.ts
│   │   │   ├── supabase/
│   │   │   │   └── supabase-order-repo.ts
│   │   │   └── kafka/
│   │   │       └── kafka-event-bus.ts
│   │   ├── mappers/
│   │   │   └── order-mapper.ts
│   │   └── index.ts
│   ├── tests/
│   │   └── integration/
│   │       └── uow-transactional.test.ts
│   └── README.md
├── interface/
│   ├── http/
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   │   └── orders.controller.ts
│   │   │   ├── routes/
│   │   │   │   └── orders.routes.ts
│   │   │   └── dto/
│   │   │       └── http-create-order.dto.ts
│   │   └── tests/
│   │       └── e2e/
│   │           └── orders.api.test.ts
│   └── README.md
├── project.json
├── jest.config.ts
├── README.md
└── docs/
    └── traceability.md
```

## Extensibility Options

- Additional adapters (search, analytics, notification) can be generated or copied by rerunning the relevant Nx generators.
- Process managers/sagas, projection/read-model pipelines, and CLI interfaces are opt-in additions supported by the template prompts.
- Builders and fixtures are lightweight so teams can expand them without touching core domain logic.

## Operational Guidance

1. Follow the generator-first rule: list available generators with `pnpm exec nx list` before authoring code.
2. Use Just recipes (`just test-generation`, `just ai-validate`) to validate template changes end-to-end.
3. Keep dependency flow `domain ← application ← infrastructure`; Nx tagging plus lint rules will enforce it, but design reviews should verify it early.
4. Update traceability docs whenever new artifacts map to PRD/DEV spec IDs to preserve spec-driven development discipline.
