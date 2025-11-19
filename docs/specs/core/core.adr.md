# CORE ADRs

<!-- matrix_ids: [] -->

## DEV-ADR-020 — Schema-First Development with Automated Type Propagation

Status: Active

Context: To leverage Supabase as the source of truth (DEV-ADR-019), a clear development workflow is needed. Changes to data models must be propagated throughout the entire system efficiently and safely.

Decision: Adopt a strict "schema-first" development workflow. All changes to data models will be implemented as SQL database migrations. These migrations will trigger an automated pipeline that regenerates TypeScript and Python types, which are then consumed by the respective frontend and backend applications.

Rationale:

- **Traceability:** SQL migrations provide a clear, version-controlled history of all data model changes.
- **Automation:** Reduces the risk of human error during type updates.
- **Safety:** Compile-time errors in frontend and backend code will immediately flag any breaking changes resulting from a schema update.

Consequences:

- Developers need to be proficient in writing SQL migrations.
- The CI/CD pipeline must include steps for running migrations and executing the type generation process.
- Initial setup requires integrating Supabase CLI and Nx generators into a cohesive pipeline.

---

## DEV-ADR-022 — Hexagonal Architecture (Ports & Adapters) for Decoupling

Status: Active

Context: To ensure that the application's core business logic is maintainable, testable, and independent of external technologies, a clear separation of concerns is required. The current domain-driven structure needs a more formal pattern for managing dependencies between the core logic and external systems like the database, APIs, and UIs.

Decision: Formally adopt Hexagonal (Ports & Adapters) architecture.

- **Core Logic:** The `domain` and `application` layers will contain the core business logic and will have no dependencies on external technologies.
- **Ports:** The application's boundaries will be defined by `ports`, which are technology-agnostic interfaces (or `protocol` types in Python using abstract base classes only where necessary) located within the `application` layer. These ports define contracts for data persistence and other external interactions (e.g., `IUserRepository`).
- **Adapters:** Concrete implementations of ports are called `adapters`.
    - **Driven Adapters:** These implement ports for backend services. For example, a `SupabaseUserRepository` in the `infrastructure` layer will implement the `IUserRepository` port.
    - **Driving Adapters:** These drive the application's core logic. For example, FastAPI controllers in the `api` layer or UI components in the `ui` layer will use application services via their ports.

Rationale:

- **Decoupling:** The core logic is completely decoupled from the implementation details of external services.
- **Testability:** The core logic can be tested in isolation by providing mock implementations of ports.
- **Flexibility:** External technologies can be swapped out by simply writing a new adapter (e.g., replacing Supabase with another database) without changing the core logic.

Consequences:

- Introduces a higher level of abstraction, which may increase the initial learning curve.
- Results in a greater number of files and interfaces to manage.
- Requires consistent use of dependency injection to provide concrete adapters to the application's core.

## DEV-ADR-024 — Unit of Work and Event Bus as First-Class Abstractions

Status: Active

Context: HexDDD ADR-006 and SDS-009/010 describe UoW and Event Bus seams that keep business logic transactional and event-driven. VibesPro references hexagonal patterns but does not currently require these primitives in generated domains.

Decision: Ship canonical Unit of Work and Event Bus abstractions (with TypeScript interfaces and Python typing.Protocols) in every generated bounded context, including in-memory defaults and extension points for adapters (Supabase, message brokers, etc.).

Rationale:

- Guarantees the application layer remains persistence-agnostic and testable.
- Provides opinionated starting points for transactional workflows and eventual consistency.
- Mirrors HexDDD scaffolding so users migrating projects retain behavior parity.

Consequences:

- Generators must emit contracts plus baseline adapters and integration tests.
- Documentation and samples explain how to replace in-memory adapters with infrastructure implementations.
- Additional validation hooks ensure UoW/Event Bus are wired through FastAPI/React entry points.

## DEV-ADR-025 — Enforce Dependency Boundaries via Nx Tags

Status: Active

Context: HexDDD ADR-008 enforces architectural boundaries using Nx tags and lint rules. VibesPro mentions hexagonal layering but lacks a formal, enforceable constraint system.

Decision: Annotate every generated project with a standardized tag taxonomy (`scope:*`, `type:*`, `layer:*`) and enforce import rules using `@nx/enforce-module-boundaries` and Nx Conformance (when available).

Rationale:

- Preserves hexagonal architecture at scale by preventing cross-layer and cross-domain coupling.
- Provides automated guardrails for contributors and AI agents alike.
- Keeps generated projects aligned with HexDDD’s enforcement strategy.

Consequences:

- Generators must stamp tags into `project.json` manifests.
- Lint configuration becomes non-optional; lint failures block merges.
- Conformance checks add modest CI cost but catch violations early.

## DEV-ADR-029 — Strict Typing Policy Across Languages

Status: Active

Context: HexDDD ADR-010 mandates TypeScript `strict` mode and Python `mypy --strict`, along with modern type features. VibesPro’s specs cite type safety goals but do not enforce strict compiler/type-check settings.

Decision: Mandate strict TypeScript compiler options and Python mypy strict mode in all generated projects, encouraging the use of `satisfies`, branded types, `typing.Protocol`, and PEP 695 aliases.

Rationale:

- Ensures type regressions fail fast and prevents implicit any usage.
- Aligns with Supabase-driven schema workflows by catching drift at compile time.
- Matches HexDDD’s standard for strongly typed multi-language stacks.

Consequences:

- Templates must include strict compiler settings and lint rules rejecting `any`.
- Contributors may need onboarding to advanced typing patterns.
- CI pipelines must run TypeScript and Python type checks with zero-warning thresholds.
