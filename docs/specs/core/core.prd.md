# CORE PRDs

<!-- matrix_ids: [] -->

## DEV-PRD-020 — End-to-End Type Safety from Database to UI

-   Description: As a developer, I want a single, unified type system that ensures data consistency from the PostgreSQL database schema through the FastAPI backend to the Next.js frontend so that I can prevent entire classes of bugs related to type mismatches.
-   EARS: When I update the database schema, the system shall automatically generate and propagate corresponding TypeScript and Pydantic types, causing compile-time errors in any part of the application that is not compliant with the new schema.
-   DX Metrics: Type-related runtime errors reduced by >90%; developer confidence in refactoring is high; zero manual synchronization of types between layers.
-   Supported by: DEV-ADR-019, DEV-ADR-020, DEV-SDS-019, DEV-SDS-020

---

## DEV-PRD-023 — Decoupled and Testable Business Logic

-   Description: As a developer, I want the core business logic to be completely independent of external frameworks and services (like the database or UI) so that it can be tested in isolation and the external dependencies can be swapped out without rewriting the core logic.
-   EARS: When I write tests for an application service, I shall be able to provide a mock implementation of its data repository port so that the test runs without a live database connection.
-   DX Metrics: Unit test coverage for the `application` layer > 95%; time to write a new business logic test is low due to easy mocking of ports.
-   Supported by: DEV-ADR-022, DEV-SDS-022

---

## DEV-PRD-022 — Seamless Database Schema Migration and Type Regeneration

-   Description: As a developer, I want a simple, command-line driven workflow for creating database migrations and regenerating all associated types so that I can update data models with a single, atomic action.
-   EARS: When I run the `just db-migrate-and-gen` command, the system shall create a new SQL migration file, apply it to the local database, and trigger the full type generation and propagation pipeline.
-   DX Metrics: A complete schema-to-UI type update can be performed with a single command; migration and generation process completes in < 60 seconds.
-   Supported by: DEV-ADR-020, DEV-SDS-019, DEV-SDS-020

---

## DEV-PRD-025 — Dependency Constraint Enforcement

-   Description: As a developer, I want Nx tag rules that block disallowed imports so that hexagonal boundaries cannot be violated accidentally.
-   EARS: When linting the workspace, the system shall raise an error if a `type:domain` project imports `type:infrastructure` or crosses prohibited `scope` combinations.
-   DX Metrics: Zero merged lint violations; dependency graph remains policy-compliant in CI.
-   Supported by: DEV-ADR-025, DEV-SDS-024

---

## DEV-PRD-026 — Transactional Unit of Work and Event Bus

-   Description: As an application engineer, I want generated domains to include Unit of Work and Event Bus seams so that transactional and event-driven flows are available without boilerplate.
-   EARS: When scaffolding a domain, the generator shall create contracts plus in-memory implementations and default wiring through FastAPI and React adapters.
-   DX Metrics: Application layer tests run without external services; ≥95% of new use cases leverage the provided abstractions.
-   Supported by: DEV-ADR-024, DEV-SDS-025

---

## DEV-PRD-030 — Strict Typing Gate

-   Description: As a developer, I want strict TypeScript and Python type-checking enforced so that schema drift and implicit anys fail fast.
-   EARS: When CI runs, the system shall execute `pnpm tsc --noEmit` with strict mode and `uv run mypy --strict`, failing on warnings or disallowed `any` usage.
-   DX Metrics: Zero tolerated `any` occurrences; mypy strict compliance ≥95%.
-   Supported by: DEV-ADR-029, DEV-SDS-029

---

## DEV-PRD-031 — Type Sync CI and Local Hooks

-   Description: As a contributor, I want automatic type regeneration in CI and optional pre-commit hooks so that Supabase-driven types never drift.
-   EARS: When a schema migration is introduced, CI shall regenerate types and fail on uncommitted diffs; an optional pre-commit hook shall perform the same workflow locally.
-   DX Metrics: No type drift on main; optional hook adoption ≥70% among active contributors.
-   Supported by: DEV-ADR-026, DEV-ADR-029, DEV-SDS-030
