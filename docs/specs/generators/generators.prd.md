# GENERATORS PRDs

<!-- matrix_ids: [] -->

## DEV-PRD-008 — CALM/Wasp/Nx integration

- Description: As a developer, I want architecture semantics validated over a single-source spec with reversible generators so that scaffolding stays consistent.
- EARS: Given a spec change, the system shall run CALM controls and regenerate services deterministically.
- DX Metrics: Control violations caught in CI 100%; generator determinism verified.
- Supported by: DEV-ADR-008

## DEV-PRD-019 — Complete Generator Specification Template for JIT Generator Creation

- Description: As a developer writing bespoke Nx generators, I want a complete, AI-friendly specification template so that AI agents can scaffold valid generators just-in-time without hallucinations or missing required sections.
- EARS: When an AI agent reads `GENERATOR_SPEC.md`, the system shall provide comprehensive schema documentation (JSON Schema draft-07), validation examples (pattern, enum, conditional), `x-prompt` types (input, list, confirmation, multiselect), `$default` sources (argv, projectName, workspaceName), generator composition patterns, acceptance test templates, implementation hints using `@nx/devkit`, troubleshooting taxonomy, and validation automation commands—all without TODO placeholders.
- DX Metrics: AI generator creation time < 5 minutes; zero hallucinated schema properties; 100% type parity between `schema.json` and `schema.d.ts`; generator creation success rate on first attempt > 90%; template generation produces zero TODO markers in generated projects.

### EARS (Event → Action → Response)

| Event                                         | Action                                                                                       | Response                                                                  |
| --------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| AI agent requests generator creation          | Agent reads `GENERATOR_SPEC.md` from generated project                                       | Spec provides complete schema examples, validation rules, and patterns    |
| Developer runs generator with invalid inputs  | Schema validation fails with clear error message                                             | Developer receives actionable feedback pointing to validation rules       |
| AI generates `schema.json` from spec guidance | Spec includes type mapping matrix and JSON Schema draft-07 examples                          | Generated schema aligns exactly with `schema.d.ts` interface              |
| Developer runs `just test-generation`         | Copier generates project with completed spec template                                        | `grep "TODO:" GENERATOR_SPEC.md` returns zero matches                     |
| AI needs generator composition example        | Spec Section 6 provides patterns for calling other Nx generators                             | AI correctly implements multi-generator workflows                         |
| Developer encounters schema validation error  | Spec Section 14 provides categorized troubleshooting guide                                   | Developer resolves issue in < 2 minutes using guidance                    |
| CI validates generated project                | Spec includes validation commands (`ajv`, `just spec-guard`)                                 | Automated checks catch schema drift before merge                          |
| AI agent attempts to create meta-generator    | Spec documents generator composition and conditional template patterns                       | Meta-generator successfully scaffolds other generators                    |
| Developer queries for prompt type options     | Spec includes all `x-prompt` types with examples                                             | Developer selects appropriate prompt type (list/confirmation/multiselect) |
| AI generates tests for new generator          | Spec Section 8 provides test templates matching existing patterns in `tests/generators/*.ts` | Tests align with project conventions and pass on first run                |

### Goals

- **Zero Hallucination:** AI agents produce valid Nx generators without inventing unsupported schema features
- **Type Safety:** Schema ↔ TypeScript synchronization enforced via mapping matrix and tests
- **Generator-First Enforcement:** Comprehensive examples reinforce scaffolding-before-coding workflow
- **Composability:** Document generator composition patterns for meta-generators and advanced workflows
- **AI Enablement:** Quick-start section reduces cognitive load; troubleshooting accelerates debugging
- **Validation Automation:** Executable tests ensure spec stays current; regression catches breaking changes

### Non-Goals

- Replace Nx official documentation (spec references but doesn't duplicate it)
- Support non-JSON Schema validation formats (explicitly JSON Schema draft-07 only)
- Generate runtime generator code automatically (spec is guidance, not code generation)
- Cover all possible generator patterns (focus on common patterns: domain, service, component, adapter)

### User Stories

| ID        | Story                                                                                                                          | Acceptance Criteria                                                                                             |
| --------- | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| PRD-019-A | As an AI agent, I can read `GENERATOR_SPEC.md` and generate a valid `schema.json` with all property types correctly validated. | Generated schema passes `npx ajv validate` with zero errors.                                                    |
| PRD-019-B | As a developer, I can verify schema/TypeScript alignment using the mapping matrix in the spec.                                 | Mapping table shows exact correspondence; manual inspection confirms parity.                                    |
| PRD-019-C | As an AI agent, I can implement generator composition by following spec Section 6 patterns.                                    | Generator successfully calls other Nx generators; project graph remains valid.                                  |
| PRD-019-D | As a developer, I can troubleshoot schema validation errors using spec Section 14 categorized guide.                           | Developer resolves error in < 2 minutes without external searches.                                              |
| PRD-019-E | As a QA engineer, I can run automated spec validation to detect TODO placeholders.                                             | `grep -R "TODO:" GENERATOR_SPEC.md` returns zero matches after GREEN phase.                                     |
| PRD-019-F | As a developer, I can run `just test-generation` and get a project with complete generator spec.                               | Generated project's spec contains no TODOs; all sections have concrete content.                                 |
| PRD-019-G | As an AI agent, I can generate acceptance tests from spec Section 8 templates that match project conventions.                  | Tests use `tests/generators/utils.ts`, align with existing patterns, and pass on first run.                     |
| PRD-019-H | As a developer, I can validate generated schemas using commands from the spec.                                                 | `npx ajv validate`, `just ai-validate`, `just spec-guard` execute successfully and provide actionable feedback. |
| PRD-019-I | As a contributor, I can create a new generator type using the spec as my only reference.                                       | New generator passes all validation checks without consulting external Nx docs.                                 |
| PRD-019-J | As an AI agent, I can implement all `x-prompt` types (input, list, confirmation, multiselect) using spec examples.             | Generated prompts render correctly in Nx Console and CLI; user input validates per schema rules.                |

### DX & Operational Metrics

| Metric                              |      Target | Measurement                                                        |
| ----------------------------------- | ----------: | ------------------------------------------------------------------ |
| AI generator creation time          | < 5 minutes | Time from spec read to working generator with passing tests        |
| Schema hallucination rate           |          0% | Percentage of AI-generated schemas with invalid/unsupported fields |
| Schema ↔ TypeScript alignment      |        100% | Automated validation comparing `schema.json` to `schema.d.ts`      |
| First-attempt success rate          |       > 90% | Generators that pass validation without manual fixes               |
| TODO elimination rate               |        100% | Zero TODO markers in generated project specs                       |
| Developer troubleshooting time      | < 2 minutes | Average time to resolve validation errors using spec guide         |
| Test alignment with conventions     |        100% | Generated tests use project utilities and pass without edits       |
| Spec sections with concrete content |        100% | All 14 sections complete with examples (no TBDs or placeholders)   |
| Generator composition success       |       > 95% | Meta-generators successfully orchestrate multiple generators       |
| Validation automation coverage      |        100% | AJV, lint, spec-guard execute and provide clear feedback           |

### Implementation Phases (MECE TDD Cycles)

**Cycle A — Template Foundations & Tests** (`feature/generator-spec-cycle-a`)

- Implement Jest tests for spec completeness, TODO detection, section validation
- Create minimal spec outline with section headers and stub content
- Integrate with existing test harness (`tests/generators/utils.ts`)
- Exit criteria: RED tests pass, zero TODOs in template

**Cycle B — Schema & Pattern Depth** (`feature/generator-spec-cycle-b`)

- Complete schema documentation with all validation types and prompt examples
- Add schema ↔ TypeScript mapping matrix
- Document generator composition and conditional template patterns
- Populate pattern library (domain, service, component, adapter)
- Exit criteria: AJV validation passes, all schema types covered, composition examples executable

**Cycle C — AI Enablement & Regression Safety** (`feature/generator-spec-cycle-c`)

- Write AI quick-start instructions and workflow steps
- Create categorized troubleshooting guide (Schema/Runtime/Tests)
- Add MCP assistance section with context7/ref/exa queries
- Implement validation automation integration (`just ai-validate`, `just spec-guard`)
- Add ShellSpec regression tests for full workflow
- Exit criteria: AI simulation test passes, full test suite passes, template generates cleanly

### Dependencies

- `.github/instructions/generators-first.instructions.md` — Generator-first policy
- `.github/instructions/testing.instructions.md` — Testing guidelines
- `tests/generators/utils.ts` — Existing test harness
- `generators/service/schema.json` — Example generator schema
- `templates/{{project_slug}}/docs/specs/generators/data-access.generator.spec.md` — Example completed spec
- Context7 MCP — Nx generator documentation (`/websites/nx_dev`)
- `.tessl/usage-specs/tessl/npm-nx/docs/generators-executors.md` — Nx devkit usage

### Acceptance Tests

- `tests/generators/spec-template.test.ts` — Validates template completeness
- `tests/generators/spec-completeness.test.ts` — Detects TODO placeholders
- `tests/generators/ai-agent-simulation.test.ts` — Simulates AI generator creation workflow
- `tests/shell/generator-spec-workflow_spec.sh` — End-to-end template generation validation
- Schema validation: `npx ajv validate -s schema.json -d test-data.json`
- CI integration: `just spec-guard` includes spec validation

### Success Criteria

- All tests in `tests/generators/spec-*.test.ts` pass
- `shellspec tests/shell/generator-spec-workflow_spec.sh` succeeds
- `just test-generation` produces spec without TODOs in `../test-output`
- AJV validation of sample schemas returns zero errors
- `just ai-validate` and `just spec-guard` pass clean
- AI agent can generate valid generator from spec alone in < 5 minutes
- Traceability matrix updated with spec IDs (DEV-PRD-019, DEV-SDS-019, DEV-ADR-019)
- Documentation reviewed and approved by platform team

### Supported By

- DEV-SDS-019 — Generator Spec Completion Design Specification
- DEV-ADR-019 — Complete Generator Specification Template ADR
- `docs/plans/generator_spec_completion_plan.md` — Implementation plan with TDD cycles
- `docs/generator_plan_review.md` — Gap analysis and improvement recommendations

### PII Redaction Rules (Vector)

Automatically redact these patterns:

- `user_email`, `email`: replaced with `[REDACTED]`
- `authorization`, `Authorization`: replaced with `[REDACTED]`
- `password`, `token`, `api_key`: replaced with `[REDACTED]`

Implemented via Vector VRL transforms before OpenObserve sink.

### Retention Policy

- **Logs:** 14-30 days (shorter than traces)
- **Traces:** 30-90 days (per DEV-PRD-017)
- **Audit logs:** 90 days minimum (compliance requirement)

Configured per OpenObserve stream/index.

### Language-Specific Implementations

**Rust (tracing):**

```rust
use tracing::{info, warn, error};
info!(category = "app", user_id_hash = "abc123", "request accepted");
warn!(category = "security", action = "auth_failure", "auth failed");
```

**Node (pino):**

```typescript
import { logger } from "@vibepro/node-logging/logger";
const log = logger();
log.info({ category: "app", user_id_hash: "abc123" }, "request accepted");
log.warn({ category: "security", action: "auth_failure" }, "auth failed");
```

**Python (Logfire SDK) - Design Target:**

```python
from fastapi import FastAPI
import logfire

app = FastAPI()
logfire.configure(service_name="user-api")
logfire.instrument_fastapi(app)      # automatic request spans

logger = logfire.logger
logger.info("request accepted", category="app", user_id_hash="abc123")
logger.warning("auth failed", category="security", action="auth_failure")
```

**Python OTLP Export Configuration - Design Target:**

```bash
export OTEL_EXPORTER_OTLP_ENDPOINT="http://localhost:4318"
export OTEL_EXPORTER_OTLP_PROTOCOL="http/protobuf"
export OTEL_SERVICE_NAME="user-api"
```

Set the endpoint to Vector (local) or OpenObserve directly, depending on environment. The Logfire SDK will respect standard OpenTelemetry variables, so no additional configuration files will be required to switch destinations.

**Note:** The Python Logfire bootstrap function (`libs/python/vibepro_logging.py`) is now implemented; see that module for configuration details. DEV-TDD cycle 2A will extend coverage where additional instrumentation is required.

Enable additional instrumentation (e.g., `requests`, `httpx`, SQL drivers) using Logfire's optional helpers where relevant to the service.

### Dependencies

- DEV-ADR-017 — JSON-First Structured Logging with Trace Correlation
- DEV-ADR-016 — Rust-Native Observability Pipeline (transport layer)
- DEV-SDS-018 — Structured Logging Design Specification (to be created)
- `ops/vector/vector.toml` — OTLP logs source and PII redaction transforms
- `libs/node-logging/logger.ts` — Node pino wrapper
- `libs/python/vibepro_logging.py` — Logfire bootstrap for Python services
- `pyproject.toml` — `logfire` dependency declaration aligned with structlog removal

### Acceptance Tests

- `tests/ops/test_vector_logs_config.sh` — Validates Vector logs source and transforms
- `tests/ops/test_log_redaction.sh` — Confirms PII redaction behavior
- `tests/ops/test_log_trace_correlation.sh` — Verifies trace context in logs
- `tools/logging/test_pino.js` — Quick validation of Node logger
- `tools/logging/test_logfire.py` — Quick validation of Python Logfire instrumentation

### Success Criteria

- All language-specific loggers emit identical JSON schema
- 100% of logs include trace context when `VIBEPRO_OBSERVE=1`
- ≥95% of FastAPI endpoints emit Logfire-generated spans without manual decorators
- PII redaction tests pass with 0 leaks
- Log query performance improves by > 50% vs unstructured logs
- Documentation complete in `docs/ENVIRONMENT.md` and `docs/observability/README.md`
- Logging tests green in CI

### Supported By

- DEV-SDS-018 — Structured Logging Design (to be created)
- DEV-ADR-017 — Architecture Decision
- docs/ENVIRONMENT.md §9 — Logging Policy (to be added)
- docs/observability/README.md §11 — Governance & Cost Controls (to be updated)

## DEV-PRD-021 — Automated Scaffolding of Type-Safe Modules

- Description: As a developer, I want to use a single Nx generator to scaffold new features or domains, including all necessary layers (domain, API, UI), so that I can create new modules quickly and consistently for the chosen frontend surface (Next.js App Router, Next.js Pages Router, Remix, or Expo).
- EARS: When I run the domain generator, the system shall create a full set of libraries for the domain, pre-populated with:
    - A FastAPI backend API using `@nxlv/python`.
    - Type-safe Shadcn UI components using `@nx-extend/shadcn-ui`.
    - All layers connected to the unified type system.
- DX Metrics: Time to create a new, fully-wired CRUD module < 15 minutes; 100% consistency in folder structure and naming conventions across domains.
- Supported by: DEV-ADR-021, DEV-SDS-021, `copier.yml`

---

## DEV-PRD-024 — Idempotent Generator Workflow

- Description: As a template maintainer, I want every Nx generator to be rerunnable without diffs so that automated scaffolding remains safe across environments.
- EARS: When a generator runs twice with identical options, the second run shall produce zero filesystem changes and an automated regression test shall assert that behavior.
- DX Metrics: 100% of generators have double-run tests; CI fails on any non-idempotent output.
- Supported by: DEV-ADR-023, DEV-SDS-023

---

## DEV-PRD-029 — Nx-Composed Full-Stack App Generator

- Description: As a developer, I want wrapper generators that leverage official Nx generators (`@nx/next`, `@nx/remix`, `@nx/expo` for frontend; `@nxlv/python` for backend) and automatically inject shared libraries, typed clients, hexagonal architecture patterns, and FastAPI-Pydantic-Supabase type-sync integration.
- EARS:
    - **Frontend**: When I invoke `nx g @vibes-pro/generators:web-app my-app --framework=remix`, the system shall (1) delegate to `@nx/remix` for framework scaffolding, (2) inject imports from `@vibes-pro/shared-web`, (3) apply hexagonal structure patterns, and (4) remain idempotent under repeated runs. Applies to Next.js (App/Pages Router), Remix, and Expo.
    - **Backend**: When I invoke `nx g @vibes-pro/generators:api-service my-service`, the system shall (1) delegate to `@nxlv/python` for FastAPI scaffolding, (2) inject Logfire bootstrap from `libs/python/vibepro_logging.py`, (3) apply hexagonal ports/adapters from PHASE-002, (4) configure Pydantic models for Supabase type-sync, and (5) remain idempotent under repeated runs.
- DX Metrics: All supported surfaces scaffold in < 30 seconds; wrapper + Nx generator combination builds successfully; idempotency tests pass; 100% of Nx wrapper generators use official plugin targets (`@nx/next`, `@nx/remix`, `@nx/expo`, `@nxlv/python`) and remain compatible with at least two downstream minor releases without requiring forks; backend services auto-instrument with Logfire OpenTelemetry.
- Supported by: DEV-ADR-028, DEV-SDS-028

---
