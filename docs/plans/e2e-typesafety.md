## Plan: End-to-End Type Safety & Generator Infrastructure

Establish a production-ready Nx generator ecosystem (installing missing plugins and implementing wrapper generators) to support a bi-directional type safety pipeline (DB→TS→Python and Python→OpenAPI→TS).

### Architecture: Bi-Directional Flow & Hexagonal DDD

The system relies on a strict Hexagonal Architecture (Ports & Adapters) enforced by custom Nx generators that wrap official plugins.

1.  **Flow A: Database-First (DB → TS → Python)**
    - **Source**: Supabase Database Schema.
    - **Artifacts**: TypeScript interfaces (for DB clients) and Python Pydantic models (for Repositories).
    - **Tools**: `supabase gen types`, custom translation scripts.
    - **Hexagonal Context**: Generated Pydantic models serve as **Infrastructure Adapters** (mapping DB rows to Domain Entities).

2.  **Flow B: Code-First API (Python → OpenAPI → TS)**
    - **Source**: FastAPI Pydantic Models (DTOs) & Routes.
    - **Artifacts**: `openapi.json` spec and TypeScript API Client (for Frontend).
    - **Tools**: FastAPI OpenAPI export, `@nxlv/python`, OpenAPI generator (e.g., Orval).
    - **Hexagonal Context**: API DTOs define the **Driving Adapter** interface (HTTP API) exposed to the frontend.

### Steps

1.  **Generator Infrastructure (Prerequisite)**
    - [ ] Install missing plugins: `@nx/next`, `@nx/remix`, `@nx/expo`, `@nxlv/python`.
    - [ ] Port `tools/reference/hexddd-generators/api-service` to `generators/api-service`.
        - **Delegation**: Must call `@nxlv/python` to scaffold the base FastAPI app.
        - **Post-Gen Injection**:
            - Inject **Logfire** bootstrap (`vibepro_logging`) into `main.py`.
            - Scaffold **Hexagonal Structure** (`domain/`, `ports/`, `adapters/`).
            - Add **OpenAPI Export Endpoint** (`/api/openapi.json`) to `main.py` for Flow B.
            - Create `schemas.py` configured for Pydantic type sync (Flow A).
    - [ ] Port `tools/reference/hexddd-generators/web-app` to `generators/web-app`.
        - **Delegation**: Must call `@nx/next`, `@nx/remix`, or `@nx/expo` based on user choice.
        - **Post-Gen Injection**:
            - Inject shared library imports (`@vibes-pro/shared-web`).
            - Configure API client provider to consume Flow B artifacts.
    - [ ] Verify generators with `just test-generation`.

2.  **Setup & Tooling (Type Safety)**
    - [x] Devbox fallback installer is present (`scripts/devbox_boot.sh` uses `scripts/install_supabase.sh`).
    - [x] Add `devbox-fix` helper to temporarily patch generated flakes: `scripts/devbox_fix_pin.sh` (use `just devbox-fix`).
    - [x] Add `datamodel-code-generator` to pyproject.toml.
    - [ ] Add OpenAPI generator tools (e.g., `@openapitools/openapi-generator-cli` or `orval`).

3.  **Flow A Implementation (DB → TS → Python)**
    - [x] Scaffold `libs/shared/types` (TS).
    - [x] Implement `just gen-types-ts` (Supabase → TS).
    - [x] Implement `just gen-types-py` (TS → Python Pydantic).
    - [x] Verify with ShellSpec tests.

4.  **Backend Scaffolding (via Generators)**
    - [ ] Scaffold Python Backend using `generators/api-service`.
    - [ ] Ensure generator configures `pyproject.toml` and dependency injection for DB types.
    - [ ] Verify Hexagonal structure: Domain entities should be isolated from DB models (eg. ports, adapters, abstract adapters -for testing, eventbus/message bus, UoW, etc).

5.  **Flow B Implementation (Python → OpenAPI → TS)**
    - [ ] Implement `just gen-api-spec`: Script to dump `openapi.json` from FastAPI app without running server.
    - [ ] Implement `just gen-api-client`: Generate TypeScript client from `openapi.json`.
    - [ ] Add ShellSpec tests for API spec generation.

6.  **CI Guardrails**
    - [x] Implement `just check-types` (detects stale types).
    - [ ] Update `check-types` to verify BOTH Flow A and Flow B.
    - [ ] Add GitHub Actions workflow.

7.  **Documentation**
    - [x] Update `docs/ENVIRONMENT.md` with `devbox-fix` instructions and fallback guides.
    - [ ] Document the full bi-directional workflow and generator usage.

### Further Considerations

1.  **Reference Code**: Use `tools/reference/hexddd-generators` as the source of truth for generator logic.
2.  **Testing Strategy**: Use `just test-generation` for generators and ShellSpec for type pipelines.
3.  **Production Quality**: Design the `check-types` command for CI usage (exit code 1 on diff) to prevent drift.
