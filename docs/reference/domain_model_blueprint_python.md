# Domain Model Blueprint for Python Backend Generators

## Purpose

This document codifies the domain-driven design (DDD) and hexagonal architecture assets that the Python backend generators produce for VibesPro-generated projects. Use it to understand what the generators scaffold by default, how the layers collaborate, and where to extend the model when tailoring a specific product domain.

## Layered Architecture Overview

| Layer          | Responsibility                                     | Default Artifacts                                                                                          | Nx Location / Tags                                     |
| -------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Domain         | Pure business logic and invariants                 | Entities, Value Objects, Aggregates, Domain Events, Domain Services, Specifications, Exceptions, Factories | `libs/{domain}/domain` (`type:domain`)                 |
| Application    | Orchestrates use cases via ports                   | Use Cases, DTOs (pydantic), Ports (Repository, UnitOfWork, EventBus, Cache)                                | `libs/{domain}/application` (`type:application`)       |
| Infrastructure | Implements ports and integrations                  | In-memory adapters, DB adapters, message broker adapters, mappers, transaction helpers                     | `libs/{domain}/infrastructure` (`type:infrastructure`) |
| Interface      | Translates external inputs to application commands | FastAPI controllers/routers, CLI or worker adapters, transport schemas                                     | `apps/*` or `libs/{domain}/interface`                  |
| Cross-cutting  | Workspace wiring & docs                            | `project.json`, `pyproject.toml`, README, tests, traceability docs                                         | repo-level metadata                                    |

## What the Python generators produce (summary)

-   Domain (pure business logic, no infra imports)

    -   Entities (identity objects) — e.g. `entities/order.py`
    -   Value Objects (immutable, equality semantics) — e.g. `value_objects/money.py`
    -   Aggregates & Aggregate Roots — `aggregates/order_aggregate.py`
    -   Domain Events — `events/order_created.py` (dataclass / TypedDict)
    -   Domain Services, Specifications, Exceptions — `services/*.py`, `specifications/*.py`, `errors/*.py`
    -   Factories / Test Builders — `factories/order_factory.py`

-   Application (use cases, DTOs, ports)

    -   Use cases (application services) — `use_cases/create_order.py` (async-first)
    -   DTOs / input schemas — `dto/create_order_dto.py` (pydantic Models)
    -   Ports / Protocols — `ports/order_repository.py`, `ports/unit_of_work.py`, `ports/event_bus.py`
    -   Helpers for dependency injection or UoW/EventBus wiring

-   Infrastructure (adapters implementing ports)

    -   In-memory adapters for tests — `adapters/in_memory/in_memory_order_repo.py`, `in_memory_uow.py`, `in_memory_event_bus.py`
    -   DB adapter skeletons (SQLAlchemy, asyncpg, Supabase) — e.g. `adapters/sqlalchemy/order_repo.py`
    -   Message bus adapters (asyncio, Kafka scaffolds) — `adapters/kafka/event_bus.py`
    -   Mappers for persistence ↔ domain — `mappers/order_mapper.py`
    -   Alembic migration scaffolding when DB option is chosen

-   Interface (delivery adapters)

    -   FastAPI controllers / routers — `interface/http/controllers/orders_controller.py`
    -   Pydantic request/response schemas — `interface/http/schemas.py`
    -   App factory / TestClient wiring for local tests — `interface/main.py`

-   Tests & docs
    -   Unit tests with `pytest` + `pytest-asyncio`
    -   Integration tests using in-memory adapters or optional Supabase dev stack
    -   `README.md`, `docs/traceability.md`, and `project.json` (Nx metadata)

## Sample scaffolded file tree for an `orders` domain

This layout mirrors the TypeScript blueprint but uses Python package conventions, pydantic, Protocols, and `async` patterns.

```text
libs/orders/
├── domain/
│   ├── orders_domain/
│   │   ├── __init__.py
│   │   ├── entities/
│   │   │   ├── __init__.py
│   │   │   ├── order.py
│   │   │   └── order_id.py
│   │   ├── value_objects/
│   │   │   ├── __init__.py
│   │   │   ├── money.py
│   │   │   └── email.py
│   │   ├── aggregates/
│   │   │   ├── __init__.py
│   │   │   └── order_aggregate.py
│   │   ├── events/
│   │   │   ├── __init__.py
│   │   │   └── order_created.py
│   │   ├── errors/
│   │   │   ├── __init__.py
│   │   │   └── order_error.py
│   │   └── factories/
│   │       └── order_factory.py
│   ├── tests/
│   │   └── unit/
│   │       ├── test_order_entity.py
│   │       └── test_value_objects.py
│   └── README.md
├── application/
│   ├── orders_application/
│   │   ├── __init__.py
│   │   ├── ports/
│   │   │   ├── __init__.py
│   │   │   ├── order_repository.py         # typing.Protocol
│   │   │   └── unit_of_work.py
│   │   ├── use_cases/
│   │   │   ├── __init__.py
│   │   │   └── create_order.py            # async def execute(...)
│   │   └── dto/
│   │       └── create_order_dto.py        # pydantic models
│   └── tests/
│       └── unit/test_create_order_usecase.py
├── infrastructure/
│   ├── orders_infrastructure/
│   │   ├── adapters/
│   │   │   ├── in_memory/
│   │   │   │   ├── in_memory_order_repo.py
│   │   │   │   ├── in_memory_uow.py
│   │   │   │   └── in_memory_event_bus.py
│   │   │   └── sqlalchemy/
│   │   │       └── sqlalchemy_order_repo.py
│   │   └── mappers/order_mapper.py
│   └── tests/integration/test_uow_transactional.py
├── interface/
│   └── orders_api/
│       ├── http/controllers/orders_controller.py
│       ├── http/schemas/http_create_order_schema.py
│       └── main.py
├── pyproject.toml
├── project.json
├── pytest.ini
└── README.md
```

## Python-specific patterns, conventions and tools

-   Protocols & typing

    -   Ports are `typing.Protocol` classes in `application/ports/` so infrastructure implements them without import cycles.

-   Async-first patterns

    -   Use `async def` / `await` for use-cases and adapters where IO is expected.
    -   UnitOfWork implements async context manager semantics (either `__aenter__/__aexit__` or explicit `begin/commit/rollback`).

-   Pydantic for DTOs & validation

    -   Incoming/outgoing schemas are `pydantic.BaseModel` classes under `interface/*/schemas`.
    -   FastAPI `Depends` is used to inject use-cases and adapters in route handlers.

-   FastAPI wiring

    -   `main.py` provides an application factory to make TestClient-based tests simple and to support containerized entrypoints.

-   Persistence skeletons

    -   SQLAlchemy (sync) or SQLAlchemy + asyncpg (async) adapters are scaffolded based on template choices.
    -   Supabase adapters are provided as a skeleton with TODOs and mapping helpers.

-   Event bus & async queues

    -   `in_memory_event_bus.py` uses `asyncio.Queue` and `asyncio.create_task` for handler execution; Kafka/Rabbit adapters are skeletons.

-   Testing stack
    -   `pytest` + `pytest-asyncio` for async tests.
    -   `conftest.py` fixtures for in-memory adapters are generated to make tests deterministic and fast.

## Typical file contracts (examples)

-   `application/ports/unit_of_work.py`

    -   Defines a `Protocol` for UnitOfWork with `async def __aenter__/__aexit__` or `async def begin()/commit()/rollback()` and resource registration APIs.

-   `infrastructure/adapters/in_memory/in_memory_uow.py`
    -   Implements UnitOfWork as an async context manager so tests call use-cases like:

```py
async with InMemoryUnitOfWork() as uow:
    await create_order_usecase.execute(dto)
```

-   `interface/http/controllers/orders_controller.py`
    -   FastAPI APIRouter that maps pydantic request models → application DTOs → use-cases and converts domain exceptions into proper problem responses.

## Testing, CI and dev DX

-   Tests

    -   Unit tests for domain & application layers; integration tests for transactional boundaries and adapter contracts.
    -   Use in-memory adapters for fast CI; optional Supabase dev stack for deeper integration tests (wired via `just` targets in generated projects).

-   Tooling
    -   `pyproject.toml` for packaging and dependency pins; `requirements-dev.txt` for developer tools.
    -   `project.json` includes Nx targets for `test`, `lint`, and `build` to keep generated projects consistent with workspace conventions.

## Extensibility & guidance

-   Add adapters (search, analytics, notifications) by implementing the application ports in a new `infrastructure` adapter.
-   If you need a new generator pattern, prefer adding an Nx generator under `generators/` and wire `just` recipes for developer ergonomics.

## Operational guidance

1. Generator-first: run `pnpm exec nx list` / `just ai-scaffold name=@nxlv/python:app` before adding new code.
2. Follow hexagonal dependency flow: domain ← application ← infrastructure. Nx tags + lint rules will help enforce this.
3. Keep traceability: reference PRD/ADR/SDS spec IDs in README and commit messages.

## Quick reference

-   Use `pydantic` for DTOs, `typing.Protocol` for ports, `async` patterns for IO, and `pytest` for tests.
-   Generated projects include `project.json`, a minimal `pyproject.toml`, test scaffolds, and `README.md` that documents where to implement features and tests.

## Summary

The Python blueprint mirrors the TypeScript variant in structure and intent but uses Python idioms: Protocols, Pydantic, async context managers, and pytest. It provides a consistent, generator-first scaffold that enforces separation of concerns and makes it straightforward to implement, test, and swap infrastructure adapters.
