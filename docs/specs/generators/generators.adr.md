# GENERATORS ADRs

<!-- matrix_ids: [] -->

## DEV-ADR-008 — CALM + Wasp + Nx synergy (semantics over single-spec generation)

- Decision: Use CALM (architecture semantics/policy) over a Wasp-style single spec; Nx generators scaffold reversible polyglot services; IaC artifacts are downstream.
- Rationale: Clear separation of intent vs constraints; design-time guarantees.
- DX Impact: Deterministic scaffolds; safer service boundaries; reversible changes.

## DEV-ADR-019 — Complete Generator Specification Template for JIT AI Generator Creation

Status: Active

Context

- The `GENERATOR_SPEC.md` template in `templates/{{project_slug}}/docs/specs/generators/` contains TODO placeholders (line 16 and throughout Sections 3, 7, 8, 9, 10, and Review Checklist).
- Generator-first development policy (`.github/instructions/generators-first.instructions.md`) mandates scaffolding with Nx generators before writing custom code.
- AI agents attempting to create bespoke generators from the incomplete template produce hallucinated code due to missing schema documentation, validation examples, and acceptance criteria.
- Existing generators (`generators/service/`, example specs in `templates/{{project_slug}}/docs/specs/generators/data-access.generator.spec.md`) demonstrate patterns but lack comprehensive guidance for all generator types.

Decision

- Complete the `GENERATOR_SPEC.md` template with production-ready content covering all sections (1–14), eliminating TODO placeholders.
- Provide comprehensive schema documentation: JSON Schema draft-07 examples for all property types (string, number, boolean, array, enum, conditional), all `x-prompt` types (input, list, confirmation, multiselect), and all `$default` sources (argv, projectName, workspaceName).
- Include schema ↔ TypeScript type mapping matrix to prevent drift between `schema.json` and `schema.d.ts`.
- Document generator composition patterns (calling other Nx generators, conditional file emission).
- Supply AI-specific quick-start instructions, categorized troubleshooting guide, and validation automation commands.
- Implement using trunk-based development with three MECE TDD cycles (A–C), each on dedicated feature branches off `dev`.

Rationale

- **Zero hallucination:** Complete spec enables AI agents to generate valid Nx generators in one attempt without external context.
- **Generator-first enforcement:** Comprehensive examples reinforce scaffolding-before-coding workflow.
- **Type safety:** Mapping matrix and validation examples prevent schema/TypeScript divergence.
- **AI enablement:** Quick-start section reduces cognitive load; troubleshooting taxonomy accelerates debugging.
- **Maintainability:** Executable tests ensure spec stays current; regression harness catches breaking changes.
- **Composability:** Generator composition patterns enable meta-generators and advanced workflows.

Consequences

| Area           | Positive                                                              | Trade–off                                            |
| -------------- | --------------------------------------------------------------------- | ---------------------------------------------------- |
| AI Development | AI agents can create generators JIT with <5 min turnaround            | Initial investment: 10–15 hours across three cycles  |
| Type Safety    | Schema/TypeScript parity enforced via tests and mapping table         | Must maintain synchronization in future spec updates |
| Documentation  | Single source of truth for all generator patterns                     | Requires periodic refresh as Nx devkit evolves       |
| Testing        | Comprehensive RED/GREEN/REFACTOR/REGRESSION test coverage             | Test maintenance overhead for spec validation        |
| Onboarding     | New contributors can author generators without deep Nx expertise      | Requires learning spec template structure            |
| Quality        | Validation automation (`ajv`, `just spec-guard`) catches errors early | CI pipeline adds ~30s for spec validation checks     |
| Portability    | Template generates correctly via Copier in all generated projects     | Must test template generation flow after each cycle  |

Implementation Requirements (MECE Cycles)

**Cycle A — Template Foundations & Tests** (`feature/generator-spec-cycle-a`)

1. Implement Jest tests using `tests/generators/utils.ts` to validate spec completeness
   - **DRI:** QA Team
   - **Dependencies:** Existing test harness, copier setup
   - **Artifacts:** `tests/generators/spec-template.test.ts`, `tests/generators/spec-completeness.test.ts`
   - **Exit criteria:** RED tests fail on TODO detection, pass after minimal stub content added

2. Stub Sections 1, 3–10 with "TBD" comments (plan-level, not in template)
   - **DRI:** Documentation Team
   - **Artifacts:** Updated `GENERATOR_SPEC.md` with section headers and minimal examples
   - **Exit criteria:** Tests pass, `grep "TODO:" GENERATOR_SPEC.md` returns zero matches

**Cycle B — Schema & Pattern Depth** (`feature/generator-spec-cycle-b`)

1. Populate comprehensive schema guidance with all validation types
   - **DRI:** Platform Team
   - **Dependencies:** Context7 Nx docs, existing generator schemas
   - **Artifacts:** Complete Section 3 with schema matrix, Section 3.5 pattern library
   - **Exit criteria:** Schema examples cover all types, mapping table complete, AJV validation passes

2. Document generator composition and conditional templates
   - **DRI:** Architecture Team
   - **Artifacts:** Section 6 supplement, composition examples
   - **Exit criteria:** Examples executable, references to existing Nx patterns validated

**Cycle C — AI Enablement & Regression Safety** (`feature/generator-spec-cycle-c`)

1. Write AI quick-start, troubleshooting taxonomy, MCP guidance
   - **DRI:** AI/ML Team
   - **Artifacts:** Sections 13–14, MCP assistance checklist
   - **Exit criteria:** AI simulation test passes, troubleshooting covers all common errors

2. Add validation automation and regression harness
   - **DRI:** DevOps Team
   - **Artifacts:** ShellSpec tests, `just ai-validate` integration
   - **Exit criteria:** Full test suite passes, template generation produces TODO-free output

Related Specs

- DEV-PRD-019 — Generator Spec Completion Product Requirements
- DEV-SDS-019 — Generator Spec Completion Design Specification
- `.github/instructions/generators-first.instructions.md` — Generator-first policy
- `docs/plans/generator_spec_completion_plan.md` — Implementation plan with TDD cycles

Migration Strategy

- Phase 1 (Cycle A): Establish test infrastructure and minimal spec outline
- Phase 2 (Cycle B): Fill schema/pattern content, validate with existing generators
- Phase 3 (Cycle C): Add AI guidance, automate validation, run full regression
- Post-implementation: Update `just ai-context-bundle` to include new template guidance

Validation

- All tests in `tests/generators/spec-*.test.ts` pass
- `shellspec tests/shell/generator-spec-workflow_spec.sh` succeeds
- `just test-generation` produces spec without TODOs in `../test-output`
- AJV validation of sample schemas returns zero errors
- `just ai-validate` and `just spec-guard` pass clean
- Traceability matrix updated with new spec IDs

## Developer ergonomics considerations (summary)

- Progressive disclosure of options; sensible defaults; opinionated naming.
- Idempotent tasks; hot-reload for instructions and modes.
- Clear precedence rules; consistent folder conventions; ready-to-run samples.

---

## DEV-ADR-019 — Supabase as Single Source of Truth for Schema & Types

Status: Active

Context: The project requires a consistent and reliable type system that spans across the database, backend (Python/FastAPI), and frontend (TypeScript/Next.js). Maintaining separate type definitions manually is error-prone and leads to drift.

Decision: Use Supabase PostgreSQL database schema as the single source of truth for all data models and types. Supabase's built-in type generation capabilities will be used to automatically create TypeScript types directly from the database schema. Python models (Pydantic) will be generated to mirror this schema for the backend.

Rationale:

- **Consistency:** Eliminates drift between frontend, backend, and database types.
- **Reliability:** The database schema is the most rigid and reliable contract.
- **Efficiency:** Automates the creation and maintenance of type definitions, reducing developer overhead.
- **Tooling:** Leverages Supabase's mature and well-supported type generation features.

Consequences:

- All data model changes MUST start at the database schema level.
- A robust workflow for schema migrations and subsequent type regeneration is required.
- The development workflow becomes tightly coupled to the Supabase ecosystem.

---

## DEV-ADR-021 — Domain-Driven Structure with Nx Generators for Scaffolding

Status: Active

Context: The project's architecture needs to be scalable, maintainable, and enforce clear boundaries between different parts of the application. The creation of new features should be consistent and efficient.

Decision: Organize the codebase using a Domain-Driven Design (DDD) structure within the Nx monorepo. Libraries will be structured by domain (e.g., `libs/<domain>`) and further subdivided into layers (`domain`, `application`, `infrastructure`, `ui`, `api`). A custom orchestrator generator (`@vibepro/domain`) will be created to scaffold the entire structure for a new domain. This generator will leverage specialized, off-the-shelf generators for specific layers:

- **Backend API:** `@nxlv/python` will be used to scaffold FastAPI applications.
- **UI Components:** `@nx-extend/shadcn-ui` will be used to generate type-safe UI components.
- **Frontend Application:** The appropriate Nx plugin (`@nx/next`, `@nx/remix`, or `@nx/expo`) will be used based on the project configuration.

Rationale:

- **Scalability:** DDD provides clear boundaries, allowing teams to work on different domains in parallel.
- **Consistency:** A primary generator orchestrating specialized generators ensures all domains follow the same structure and conventions.
- **Efficiency:** Automates boilerplate creation, allowing developers to focus on business logic.
- **Architectural Safety:** Nx dependency rules can be used to enforce boundaries between domains and layers.
- **Leverages Ecosystem:** Uses well-maintained community generators, reducing custom code.

Consequences:

- Requires an upfront investment in building and maintaining the main `@vibepro/domain` orchestrator generator.
- Developers need to be trained on the DDD structure and how to use the primary generator.
- The project becomes dependent on the continued maintenance of external Nx generators.

---

## DEV-ADR-023 — Idempotent Nx Generators with Regression Tests

Status: Active

Context: HexDDD ADR-007 establishes that generators must be rerunnable without creating diffs. VibesPro relies heavily on generators to scaffold template outputs, but no binding decision presently enforces idempotent behavior or regression tests.

Decision: Treat generator idempotency as a non-negotiable requirement. Every generator must read before it writes, rely on deterministic formatting helpers, and include automated regression tests that execute the generator twice to assert zero diffs.

Rationale:

- Prevents generator drift and merge conflicts in generated projects.
- Enables safe, repeatable scaffolding for AI-driven automation and CI smoke tests.
- Aligns the template with HexDDD’s proven workflow for generator stability.

Consequences:

- Generator authors must adopt deterministic write patterns (AST, markers, sorted outputs).
- Test suites expand to cover double-run assertions (Jest/ShellSpec) and will fail on non-idempotent code.
- CI pipelines need to execute new generator regression tests.

## DEV-ADR-028 — Nx Generator Composition Pattern for Full-Stack Applications

Status: Active

Context: HexDDD ADR-012 consolidates React surface generators into a single, configurable workflow. VibesPro needs to support **frontend frameworks** (Next.js, Remix, Expo) and **Python/FastAPI backends** while avoiding maintenance burden of custom generators. Nx provides official, well-maintained generators (`@nx/next`, `@nx/remix`, `@nx/expo`, `@nxlv/python`) that handle framework-specific scaffolding. VibesPro's type system relies on **FastAPI-OpenAPI-Pydantic** chain that enables end-to-end type syncing via Supabase.

Decision: Create thin wrapper generators that **compose** official Nx generators using `externalSchematic` API, then apply post-generation transformations to inject:

- **Frontend**: Shared-web patterns, hexagonal architecture imports, VibesPro conventions
- **Backend**: FastAPI + Logfire bootstrap, Pydantic schemas, hexagonal ports/adapters, Supabase type-sync integration

Rationale:

- **Leverage Official Generators**: Nx generators stay updateable; we don't fork/maintain framework-specific code.
- **Control Integration Points**: Wrapper applies shared libraries, error handling, and hexagonal structure after Nx scaffolding.
- **Low Maintenance Burden**: Only update wrappers when Nx introduces breaking API changes.
- **Composition Over Creation**: Aligns with "generators-first" principle and Nx best practices.
- **Future-Proof**: New Nx features (e.g., RSC updates, Expo SDK changes, FastAPI patterns) flow through automatically.
- **Type-Safe Full Stack**: Python backend generators ensure Pydantic models sync with Supabase schema for end-to-end type safety.

Consequences:

- Wrapper generators depend on Nx generator APIs (require version compatibility testing).
- Post-generation transformations must be idempotent and well-tested.
- Need to document which Nx versions are supported and how to handle breaking changes.
- Backend wrappers must integrate with existing `libs/python/vibepro_logging.py` and hexagonal patterns from PHASE-002.
- Slightly more complex setup than pure custom generators, but massively reduced long-term maintenance.
