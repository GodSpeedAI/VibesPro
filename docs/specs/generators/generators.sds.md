# GENERATORS SDSs

<!-- matrix_ids: [] -->

## DEV-SDS-021 — Nx Generator Design for Type-Safe Scaffolding (addresses DEV-PRD-021)

- Principle: Generators enforce consistency and accelerate development by embedding architectural patterns into generated code.
- Design:
    - **Domain Generator (`@vibepro/domain`):** This will be the primary generator. It will take a domain name as input (e.g., `auth`). It will orchestrate calls to other, more specific generators.
    - **Generated Libraries:** The generator will create the following libraries, each with a `project.json` file containing appropriate Nx tags for dependency management:
        - `libs/auth/domain`: Contains pure domain models (interfaces/classes) that wrap the raw generated DB types.
        - `libs/auth/application`: Contains application services/use cases.
        - `libs/auth/infrastructure`: Contains Supabase repository implementations for data access.
        - `libs/auth/api`: Contains FastAPI routes, scaffolded using the `@nxlv/python` generator, using the application services and Pydantic models.
        - `libs/auth/ui`: Contains frontend components and hooks for the domain, tailored to the selected `app_framework` (Next.js, Remix, or Expo). Type-safe UI components will be generated using `@nx-extend/shadcn-ui`.
    - **Type Integration:** The generated code will be pre-wired with imports from `libs/shared/types` and `libs/shared/types-py`, ensuring immediate type safety.
    - **Templates:** The generator will use a set of template files (`<files>`) that are processed to insert the domain name and other variables.
- Artifacts: `tools/generators/domain/`, including `index.ts`, `schema.json`, and `files/` templates.
- Cross-references: DEV-ADR-021, DEV-PRD-021, `copier.yml` (`app_framework`)

---

## DEV-SDS-023 — Generator Idempotency Pattern Library (addresses DEV-PRD-024)

- Principle: Generators must be rerunnable with zero diffs; deterministic patterns are documented and enforced.
- Deterministic Writes: Use `readProjectConfiguration`, `tree.exists`, and AST/marker utilities to avoid overwriting existing content blindly.
- Formatting: Call `formatFiles(tree)` and preserve sorted exports/imports to keep outputs stable.
- Tests: Provide Jest specs that run the generator twice and assert `git diff --exit-code === 0`, plus ShellSpec smoke tests mirroring HexDDD’s idempotency suite.
- Tooling: Add a shared helper in `tests/generators/` for double-run assertions; integrate with CI (`just spec-guard`).

## DEV-SDS-028 — Nx-Composed Full-Stack Generator Design (addresses DEV-PRD-029)

### Frontend Generators

- **Composition Strategy**: Use Nx `externalSchematic()` API to invoke official generators:
    - Next.js: `@nx/next:application` (with `--appDir=true|false` for App/Pages Router)
    - Remix: `@nx/remix:application`
    - Expo: `@nx/expo:application`
- **Options**: `name`, `framework` (`next|remix|expo`), `routerStyle` (`app|pages` for Next.js only), `includeSharedWeb` (bool, default: true).
- **Post-Generation Transformations**:
    1. Inject `@vibes-pro/shared-web` imports in entry files (app layout, root routes, App.tsx).
    2. Add API client initialization examples with proper env config.
    3. Inject error boundary components using shared error handlers.
    4. Add example pages demonstrating API client usage (optional via `--includeExamplePage`).
- **Shared Assets Integration**: Ensure `libs/shared/web` exists; if missing, generate it first (or error with clear message).
- **Idempotency**: Transformation logic checks for existing imports/patterns before injecting; uses DEV-SDS-023 idempotent wrapper.
- **Version Compatibility**: Document supported Nx versions (track in `docs/NX_VERSION_MATRIX.md`); test against Nx 22.x initially.

### Backend Generators (Python/FastAPI)

- **Composition Strategy**: Use Nx `externalSchematic()` API to invoke `@nxlv/python:fastapi-application`.
- **Options**: `name`, `directory` (default: `apps`), `includePorts` (bool, default: true, generates hexagonal ports/adapters).
- **Post-Generation Transformations**:
    1. Inject Logfire bootstrap from `libs/python/vibepro_logging.py` into `main.py`:
        ```python
        from libs.python.vibepro_logging import bootstrap_logfire, configure_logger
        bootstrap_logfire(app, service="<service-name>")
        logger = configure_logger("<service-name>")
        ```
    2. Add hexagonal port/adapter scaffolding:
        - `application/ports/` (Repository, UnitOfWork protocols)
        - `infrastructure/adapters/in_memory/` (test adapters)
        - `domain/` (entity/value object stubs)
    3. Configure Pydantic models with Supabase type-sync comment headers:
        ```python
        # AUTO-GENERATED from Supabase schema - do not edit manually
        from pydantic import BaseModel
        ```
    4. Add OpenAPI schema export endpoint for frontend type generation.
- **Shared Infrastructure Integration**: Ensure `libs/python/vibepro_logging.py` and `libs/shared/domain/python/ports/` exist (from PHASE-002).
- **Idempotency**: Check for existing Logfire imports, port directories before injecting.
- **Version Compatibility**: Track `@nxlv/python` versions alongside `@nx/*` in `docs/NX_VERSION_MATRIX.md`.

### Unified Testing Strategy

- **Unit Tests**: Verify `externalSchematic` invocation and transformation logic for both frontend and backend.
- **E2E Tests**: Scaffold each framework (Next.js, Remix, Expo, FastAPI), run build/serve, verify:
    - Frontend: shared-web imports present, API client works
    - Backend: Logfire instrumentation active, hexagonal structure present, OpenAPI endpoint responds
- **Idempotency Tests**: Run generator twice, assert no file changes for both frontend and backend.
- **Type-Sync Integration Test**: Generate FastAPI service, export OpenAPI schema, verify Pydantic models align with Supabase types.

### Documentation Requirements

- Provide per-framework examples showing both Nx-native workflow and VibesPro wrapper usage.
- Document backend FastAPI-OpenAPI-Pydantic type chain and Supabase integration points.
- Include upgrade path for both frontend (`@nx/*`) and backend (`@nxlv/python`) generator changes.
