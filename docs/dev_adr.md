# Developer Architectural Decision Record (DX-focused)

Audience: Developers as primary users
Scope: Decisions shaping the development environment as a product platform
Source: transcript.md synthesis and repository conventions

---

## DEV-ADR-001 — Native Copilot/VS Code over custom DSL

-   Decision: Use only GitHub Copilot + VS Code native mechanisms (copilot-instructions.md, instructions/_.md, prompts/_.prompt.md, chatmodes/\*.chatmode.md, settings.json, tasks) instead of inventing a YAML DSL.
-   Context: Constraint of "NO custom YAML files or external DSL," need for immediate usability and hot-reload.
-   Rationale: Lower cognitive load; no extra tooling; leverages existing ecosystem; simpler onboarding; safe defaults.
-   DX Impact: Faster setup (<10 min), less context switching, predictable discovery; fewer toolchains to learn.
-   Trade–offs: Less declarative logic in-config; conditional flows handled via tasks/scripts.

## DEV-ADR-002 — MECE modular instruction files with "LoRA-style" stacking

-   Decision: Break guidance into MECE instruction files (security, performance, style, general) and compose per task by ordered stacking.
-   Rationale: Mirrors adapter/LoRA composability; enables reuse and fine-grained overrides.
-   DX Impact: Clear layering, simpler diffs, targeted tweaks; avoids monolithic prompts.
-   Conventions: Left-to-right order determines precedence; repo-wide > mode > prompt can be tuned explicitly.

## DEV-ADR-003 — Custom chat modes as first-class personas (8 roles)

-   Decision: Define chat modes for product-manager, ux-ui-designer, system-architect, senior-frontend-engineer, senior-backend-engineer, qa-test-automation-engineer, devops-deployment-engineer, security-analyst.
-   Rationale: Minimizes cognitive switching; aligns with delivery phases; improves handoffs.
-   DX Impact: One-click persona; consistent outputs; faster planning/implementation flows.

## DEV-ADR-004 — Tasks as orchestration layer (dynamic injection, A/B, token metrics)

-   Decision: Use VS Code tasks to run prompts, inject dynamic context, measure tokens, and support A/B flows via branches/workspaces.
-   Rationale: Declarative files stay simple; tasks provide controlled imperative glue.
-   DX Impact: Repeatable runs; single keybindings/commands; measurable feedback loops.

## DEV-ADR-005 — Security by default: workspace trust and tool safety

-   Decision: Respect workspace trust boundaries; never enable chat.tools.autoApprove; centralize safety instructions.
-   Rationale: Prevent prompt-injection and RCE; protect developer machines.
-   DX Impact: Confidence in running examples; fewer security reviews blocked.

## DEV-ADR-006 — Context window optimization via strategic file ordering

-   Decision: Use chat.promptFilesLocations and chat.modeFilesLocations with curated ordering; prune redundant context.
-   Rationale: Predictable token budgets; reduce noise; improve answer quality.
-   DX Impact: Fewer truncations; faster, more relevant results.

## DEV-ADR-007 — Prompt-as-code lifecycle (VC, lint, test, plan)

-   Decision: Treat prompts/instructions as code: versioned, linted, evaluated (A/B), and "planned" prior to change.
-   Rationale: Reproducibility and rollback; reduces regressions.
-   DX Impact: Safer iteration; observable quality trends; consistent reviews.

## DEV-ADR-008 — CALM + Wasp + Nx synergy (semantics over single-spec generation)

-   Decision: Use CALM (architecture semantics/policy) over a Wasp-style single spec; Nx generators scaffold reversible polyglot services; IaC artifacts are downstream.
-   Rationale: Clear separation of intent vs constraints; design-time guarantees.
-   DX Impact: Deterministic scaffolds; safer service boundaries; reversible changes.

## DEV-ADR-009 — Declarative-first with imperative escape hatches

-   Decision: Keep guidance declarative; use tasks/scripts for branching/conditionals and retrieval.
-   Rationale: Maintains simplicity; avoids DSL creep; enables power when needed.
-   DX Impact: Lower learning curve; flexibility preserved.

## DEV-ADR-010 — Evaluation hooks and token budgets

-   Decision: Provide token usage logging, quality checks, and optional toxicity/safety post-process steps.
-   Rationale: Close the loop on output quality and cost.
-   DX Impact: Faster feedback; predictable spend; structured improvements.

## DEV-ADR-011 — Adopt Devbox as OS dependency boundary

Decision: Use Devbox to provision all OS-level tools for local and CI environments.

Context: Current manuals require host installs; variability causes flakiness.

Rationale: Reproducibility, cross-platform parity, smaller onboarding surface.

DX Impact: Faster "first build," fewer "works on my machine" incidents.

Trade–offs: Devbox binary required; CI runner images may need an extra layer.

## DEV-ADR-012 — Standardize on mise for multi-language runtime management

Decision: Use mise to pin/activate Node, Python, and Rust; remove .python-version and avoid per-language managers in CI.

Context: Prior pyenv and ad-hoc Node/Rust flows drifted.

Rationale: Single tool, consistent PATH, simpler docs/CI.

DX Impact: Zero drift; simpler contributor experience.

Trade–offs: Team must learn mise; initial cache warming in CI.

## DEV-ADR-013 — Secrets managed by SOPS; ephemeral decryption

Decision: Store .secrets.env.sops in Git (encrypted) and decrypt only into process env at runtime; no plaintext .env committed.

Context: Desire to avoid secret sprawl and align local/CI flows.

Rationale: Strong auditability; easy rotation; flexible recipients (AGE/KMS).

DX Impact: Safer by default; minimal friction after keys configured.

Trade–offs: Requires developer key management; CI key plumbing.

## DEV-ADR-014 — Volta compatibility, mise authority, and timed deprecation

Decision: Keep Volta temporarily as a compatibility signal but treat mise as authoritative for Node; fail builds on divergence.

Context: Some contributors use Volta; the repo may include volta pins.

Rationale: Smooth transition, deterministic behavior, one true source.

DX Impact: Clear, early feedback; removal plan avoids confusion.

Trade–offs: Short-term duplication until deprecation window ends.

## DEV-ADR-015 — Minimal CI (no direnv) with explicit SOPS decrypt

Decision: CI uses Devbox + mise and decrypts SOPS via CI secrets; direnv is not used in CI.

Context: direnv adds little value in non-interactive jobs.

Rationale: Simpler pipeline, fewer moving parts; same versions as local.

DX Impact: Faster, more reliable CI; clearer failure modes.

Trade–offs: Need small glue to source decrypted env file.

## DEV-ADR-016 — Adopt Rust‑Native Observability Pipeline (tracing → Vector → OpenObserve)

Status: Proposed → Active (feature‑flagged)

Context
VibePro's execution model is moving toward deterministic, AI‑ready telemetry. Current logging is largely unstructured, preventing reliable correlation and automated analysis. A Rust‑native stack (tracing → Vector → OpenObserve) provides structured OTLP telemetry with low runtime overhead and avoids container‑side agents.

Decision
Implement an opt‑in observability subsystem composed of:

-   tracing + tracing‑opentelemetry for in‑process spans, metrics, and structured logs
-   Vector as the host‑level collector/transformer
-   OpenObserve as the unified long‑term store

Enable via the environment flag: VIBEPRO_OBSERVE=1

Rationale

-   Low overhead: Rust async tracing with minimal allocations
-   Standardized telemetry (OTLP) compatible with AIOps tools
-   Enables AI‑driven RCA and anomaly detection with context‑rich spans
-   Removes dependency on container agents (Vector runs as a host binary)

Consequences

| Area          | Positive                                    | Trade‑off                                            |
| ------------- | ------------------------------------------- | ---------------------------------------------------- |
| Performance   | <1% CPU overhead at ~1k spans/s             | Slight binary size growth                            |
| Developer DX  | Unified API for logs/traces                 | New crate dependency (crates/vibepro-observe)        |
| Ops           | Simplified deploy; fewer moving parts       | Requires Vector rollout policy & binary distribution |
| AI Enablement | Historical OTLP data for feature extraction | Must govern PII fields before ingestion              |

Adoption phases

1. **Phase 1 (Prototype):** Basic tracing integration in `vibepro-observe` crate; Vector + OpenObserve setup in dev environment only
2. **Phase 2 (Alpha):** Expand to Node/Python services; add PII redaction transforms; limited production rollout (10% traffic)
3. **Phase 3 (GA):** Full production rollout; mandatory for new services; observability PRD/SDS required

Related

-   DEV-PRD-017 — Observability Integration Story (create before Phase 3 implementation)
-   docs/dev_tdd_observability.md (v1)

-   DEV-SDS-017 — Observability Design Spec (create before Phase 2 implementation)
-   Traceability: Phase 1 prototypes may proceed without specs; Phases 2+ must reference DEV-SDS-017 and DEV-PRD-017 in commits

Notes

-   Ensure PII/PII‑like fields are redacted or filtered before export.
-   Add automated CI checks for vector config validation and a small benchmark to detect regressions.
-   Document rollout plan for operators (Vector binary distribution, upgrades, and monitoring).

## DEV-ADR-017 — JSON-First Structured Logging with Trace Correlation

Status: Active

Context
VibePro's current logging approach is inconsistent across languages (Rust, Node, Python) with mixed formats (printf-style, JSON, unstructured). This prevents reliable log-trace correlation, PII governance, and cost-effective retention strategies. The existing observability pipeline (DEV-ADR-016) provides the transport layer but needs logging conventions.

Decision
Implement structured, JSON-first logging with mandatory trace correlation across all languages:

-   **Format:** JSON only (machine-first) for all application logs
-   **Correlation:** Every log line carries `trace_id`, `span_id`, `service`, `env`, `version`
-   **PII Protection:** Never emit raw PII from app code; mandatory redaction in Vector
-   **Levels:** `error`, `warn`, `info`, `debug` (no `trace` level—use tracing spans)
-   **Categories:** `app` (default), `audit`, `security` via dedicated field
-   **Transport:** stdout/stderr locally; OTLP to Vector when `VIBEPRO_OBSERVE=1`
-   **Retention:** 14-30 days for logs (shorter than traces)

Language-specific implementations:

-   **Rust:** Continue using `tracing` events (already in place via `vibepro-observe`)
-   **Node:** `pino` with custom formatters for trace context injection
-   **Python:** Replace `structlog` with the Logfire SDK (OpenTelemetry emitter) to auto-instrument FastAPI requests, outbound HTTP clients, and Pydantic validation while emitting the shared JSON schema

Rationale

-   **Consistency:** Same log schema regardless of language/runtime
-   **Correlation:** Enables log ↔ trace navigation in OpenObserve
-   **Python Fidelity:** Logfire surfaces FastAPI spans, Pydantic validation errors, and LLM context with minimal, standardized instrumentation setup such as calling logfire.instrument_fastapi()
-   **Cost Control:** Sampling/redaction at Vector edge; shorter retention than traces
-   **PII Safety:** Centralized redaction rules prevent accidental exposure
-   **Query Performance:** JSON structure enables fast field indexing

Consequences

| Area         | Positive                                                        | Trade–off                                           |
| ------------ | --------------------------------------------------------------- | --------------------------------------------------- |
| Developer DX | Unified logging/tracing API across languages; Python auto-spans | Learn Logfire workflows and manage OTEL env vars    |
| Debugging    | Fast correlation between logs, spans, and Pydantic context      | Must replace legacy structlog wrappers with Logfire |
| Security     | PII redaction enforced at infrastructure layer                  | Vector config complexity                            |
| Cost         | Lower retention costs; efficient queries                        | Initial setup overhead                              |
| Operations   | Consistent log schema for alerting/dashboards                   | Requires Vector transforms validation               |

Implementation Requirements

1. Add Vector OTLP logs source and PII redaction transforms to `ops/vector/vector.toml`
    - **DRI:** Infrastructure Team
    - **Timeline:** Week 1 (2025-11-01 to 2025-11-07)
    - **Phase-exit criteria:** Vector config updated and validated in CI
2. Create `libs/node-logging/logger.ts` with pino wrapper
    - **DRI:** Frontend Platform Team
    - **Timeline:** Week 1-2 (2025-11-01 to 2025-11-14)
    - **Phase-exit criteria:** Logger package published and tests passing
3. Refactor `libs/python/vibepro_logging.py` into a Logfire bootstrap that instruments FastAPI, requests, and async clients

    - **DRI:** Backend Platform Team
    - **Timeline:** Week 2-3 (2025-11-08 to 2025-11-21)
    - **Phase-exit criteria:** Logfire SDK installed, FastAPI instrumentation validated, and smoke test passes in staging

4. Install and configure Logfire SDK in `pyproject.toml`, including default OTEL environment variable templates

    - **DRI:** Backend Platform Team
    - **Timeline:** Week 2 (2025-11-08 to 2025-11-14)
    - **Phase-exit criteria:** All Python services can import and configure Logfire without errors

5. Document logging and tracing policy in `docs/ENVIRONMENT.md` and `docs/observability/README.md`

    - **DRI:** Documentation Team
    - **Timeline:** Week 3-4 (2025-11-15 to 2025-11-28)
    - **Phase-exit criteria:** Documentation reviewed and approved by technical leads

6. Add TDD tests: Vector config validation, PII redaction, trace correlation, Logfire smoke test
    - **DRI:** QA Team
    - **Timeline:** Week 4-5 (2025-11-22 to 2025-12-05)
    - **Phase-exit criteria:** All tests passing in CI with >90% code coverage

Related Specs

-   DEV-ADR-016 — Rust-Native Observability Pipeline (foundation)
-   DEV-PRD-018 — Structured Logging Product Requirements (Logfire upgrade)
-   DEV-SDS-018 — Structured Logging Design Specification (Logfire upgrade)
-   DEV-SPEC-009 — Logging Policy & Examples (documentation)

Migration Strategy

-   Phase 1: Introduce Logfire alongside existing structlog wrapper behind a compatibility facade; update examples and smoke tests.
-   Phase 2: Cut Python services over to Logfire instrumentation (FastAPI, requests, Pydantic) and deprecate structlog usage.
-   Phase 3: Remove structlog dependency, enforce Logfire bootstrap in generators, and lint for legacy imports.
    -   Note: Completed during TDD Phase 4 — `pyproject.toml` now depends solely on `logfire`.

Validation

-   All logs must include: `trace_id`, `span_id`, `service`, `environment`, `application_version`
-   PII fields (email, authorization, tokens) automatically redacted by Vector
-   Tests validate: config correctness, redaction behavior, correlation fields, and Logfire span validation deferred to DEV-TDD cycle 2A

---

## DEV-ADR-018 — Temporal AI intelligence fabric for guidance & optimization

Status: Active

Context

-   Enhanced AI pattern prediction, automated performance optimization, and deeper context awareness are top DX asks, but current capabilities operate independently (temporal DB, pattern recognizer, performance telemetry, and AIContextManager scoring).
-   redb already stores architecture decisions, performance spans, and AI guidance outcomes with timestamps, yet no feedback loop closes the gap between historical success and future recommendations.
-   Developers want proactive, confident suggestions without curating prompts by hand for every task.

Decision

-   Implement embedding-based pattern search using embedding-gemma-300M (GGUF Q4_K_M, 300M params, 768-dim vectors) for semantic similarity over Git commit history.
-   Use rustformers/llm for CPU-only inference and redb for embedded vector storage with zero external dependencies.
-   Build recommendation engine with cosine similarity search, combining similarity scores with recency and usage metrics.
-   Establish shared contracts so that:
    -   Git history → pattern extraction → embedding generation → vector storage pipeline
    -   Semantic search returns top-k patterns ranked by similarity + recency + usage
    -   AIContextManager scoring incorporates pattern confidence and usage success rates when assembling bundles inside token budgets.
-   Ship the fabric in incremental phases with strict TDD coverage tracked in Cycle 3 implementation plan.

Rationale

-   **Higher-confidence guidance:** Semantic search over proven patterns reduces generic answers and aligns suggestions with historical solutions.
-   **Zero external dependencies:** Local CPU inference eliminates API costs and latency; redb provides embedded storage.
-   **Operational awareness:** Performance metrics feed into ranking algorithm to prioritize proven patterns.
-   **Context quality:** Injecting temporal success data into context scoring increases bundle relevance without exceeding budgets.
-   **Proven technology:** embedding-gemma-300M specifically designed for semantic similarity; 300M params balance quality and speed.

Consequences

| Area           | Positive                                                          | Trade–off                                                         |
| -------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------- |
| Developer DX   | Proactive, context-aware recommendations with confidence metadata | Requires ~200MB model download and initial indexing               |
| Data           | Embedded storage in single redb file (~47MB for 10k patterns)     | Must implement retention policies for pattern pruning             |
| Operations     | Background refresh jobs for pattern indexing                      | CPU usage during embedding generation (<500ms per pattern)        |
| Performance    | Sub-second recommendations (<500ms P95 end-to-end)                | Similarity search O(n) scales to ~100k patterns before ANN needed |
| Implementation | Clear specs (DEV-PRD-020, DEV-SDS-020) with Rust/TypeScript FFI   | Coordination needed across Rust core and TypeScript client        |

Implementation Requirements

1. **Phase 3A: Specifications** ✅

    - DEV-PRD-020: Product requirements with EARS tables and user stories
    - DEV-SDS-020: Software design with 6 core components and redb schema
    - DEV-ADR-018: Status updated to Active (this change)

2. **Phase 3B: Embedding Infrastructure**

    - Download embedding-gemma-300M model (~180MB GGUF)
    - Implement `embedder.rs` with llm integration
    - Implement `vector_store.rs` with redb (3 tables: EMBEDDINGS, METADATA, METRICS)
    - Implement `similarity.rs` with SIMD-optimized cosine similarity
    - Implement `pattern_extractor.rs` with git2 for commit parsing
    - Performance targets: <500ms embedding, <100ms search (10k patterns)

3. **Phase 3C: Recommendation Engine**

    - Implement `ranker.rs` with weighted scoring (similarity 50%, recency 20%, usage 30%)
    - Build CLI binary for pattern refresh and query
    - Create TypeScript FFI bindings via NAPI-RS
    - Write integration tests for end-to-end pipeline

4. **Phase 3D: Observability Integration**
    - Implement `observability_aggregator.rs` to query OpenObserve metrics
    - Correlate pattern recommendations with performance data
    - Add tracing spans for all operations
    - Create dashboard queries for recommendation effectiveness

Dependencies

-   Rust crates: `llm`, `redb`, `git2`, `anyhow`, `serde`, `napi`
-   Model: embedding-gemma-300M-Q4_K_M.gguf from Hugging Face
-   TypeScript: NAPI-RS bindings for Node.js integration

---

## DEV-ADR-019 — Complete Generator Specification Template for JIT AI Generator Creation

Status: Active

Context

-   The `GENERATOR_SPEC.md` template in `templates/{{project_slug}}/docs/specs/generators/` contains TODO placeholders (line 16 and throughout Sections 3, 7, 8, 9, 10, and Review Checklist).
-   Generator-first development policy (`.github/instructions/generators-first.instructions.md`) mandates scaffolding with Nx generators before writing custom code.
-   AI agents attempting to create bespoke generators from the incomplete template produce hallucinated code due to missing schema documentation, validation examples, and acceptance criteria.
-   Existing generators (`generators/service/`, example specs in `templates/{{project_slug}}/docs/specs/generators/data-access.generator.spec.md`) demonstrate patterns but lack comprehensive guidance for all generator types.

Decision

-   Complete the `GENERATOR_SPEC.md` template with production-ready content covering all sections (1–14), eliminating TODO placeholders.
-   Provide comprehensive schema documentation: JSON Schema draft-07 examples for all property types (string, number, boolean, array, enum, conditional), all `x-prompt` types (input, list, confirmation, multiselect), and all `$default` sources (argv, projectName, workspaceName).
-   Include schema ↔ TypeScript type mapping matrix to prevent drift between `schema.json` and `schema.d.ts`.
-   Document generator composition patterns (calling other Nx generators, conditional file emission).
-   Supply AI-specific quick-start instructions, categorized troubleshooting guide, and validation automation commands.
-   Implement using trunk-based development with three MECE TDD cycles (A–C), each on dedicated feature branches off `dev`.

Rationale

-   **Zero hallucination:** Complete spec enables AI agents to generate valid Nx generators in one attempt without external context.
-   **Generator-first enforcement:** Comprehensive examples reinforce scaffolding-before-coding workflow.
-   **Type safety:** Mapping matrix and validation examples prevent schema/TypeScript divergence.
-   **AI enablement:** Quick-start section reduces cognitive load; troubleshooting taxonomy accelerates debugging.
-   **Maintainability:** Executable tests ensure spec stays current; regression harness catches breaking changes.
-   **Composability:** Generator composition patterns enable meta-generators and advanced workflows.

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

-   DEV-PRD-019 — Generator Spec Completion Product Requirements
-   DEV-SDS-019 — Generator Spec Completion Design Specification
-   `.github/instructions/generators-first.instructions.md` — Generator-first policy
-   `docs/plans/generator_spec_completion_plan.md` — Implementation plan with TDD cycles

Migration Strategy

-   Phase 1 (Cycle A): Establish test infrastructure and minimal spec outline
-   Phase 2 (Cycle B): Fill schema/pattern content, validate with existing generators
-   Phase 3 (Cycle C): Add AI guidance, automate validation, run full regression
-   Post-implementation: Update `just ai-context-bundle` to include new template guidance

Validation

-   All tests in `tests/generators/spec-*.test.ts` pass
-   `shellspec tests/shell/generator-spec-workflow_spec.sh` succeeds
-   `just test-generation` produces spec without TODOs in `../test-output`
-   AJV validation of sample schemas returns zero errors
-   `just ai-validate` and `just spec-guard` pass clean
-   Traceability matrix updated with new spec IDs

## Developer ergonomics considerations (summary)

-   Progressive disclosure of options; sensible defaults; opinionated naming.
-   Idempotent tasks; hot-reload for instructions and modes.
-   Clear precedence rules; consistent folder conventions; ready-to-run samples.

---

## DEV-ADR-019 — Supabase as Single Source of Truth for Schema & Types

Status: Active

Context: The project requires a consistent and reliable type system that spans across the database, backend (Python/FastAPI), and frontend (TypeScript/Next.js). Maintaining separate type definitions manually is error-prone and leads to drift.

Decision: Use Supabase PostgreSQL database schema as the single source of truth for all data models and types. Supabase's built-in type generation capabilities will be used to automatically create TypeScript types directly from the database schema. Python models (Pydantic) will be generated to mirror this schema for the backend.

Rationale:

-   **Consistency:** Eliminates drift between frontend, backend, and database types.
-   **Reliability:** The database schema is the most rigid and reliable contract.
-   **Efficiency:** Automates the creation and maintenance of type definitions, reducing developer overhead.
-   **Tooling:** Leverages Supabase's mature and well-supported type generation features.

Consequences:

-   All data model changes MUST start at the database schema level.
-   A robust workflow for schema migrations and subsequent type regeneration is required.
-   The development workflow becomes tightly coupled to the Supabase ecosystem.

---

## DEV-ADR-020 — Schema-First Development with Automated Type Propagation

Status: Active

Context: To leverage Supabase as the source of truth (DEV-ADR-019), a clear development workflow is needed. Changes to data models must be propagated throughout the entire system efficiently and safely.

Decision: Adopt a strict "schema-first" development workflow. All changes to data models will be implemented as SQL database migrations. These migrations will trigger an automated pipeline that regenerates TypeScript and Python types, which are then consumed by the respective frontend and backend applications.

Rationale:

-   **Traceability:** SQL migrations provide a clear, version-controlled history of all data model changes.
-   **Automation:** Reduces the risk of human error during type updates.
-   **Safety:** Compile-time errors in frontend and backend code will immediately flag any breaking changes resulting from a schema update.

Consequences:

-   Developers need to be proficient in writing SQL migrations.
-   The CI/CD pipeline must include steps for running migrations and executing the type generation process.
-   Initial setup requires integrating Supabase CLI and Nx generators into a cohesive pipeline.

---

## DEV-ADR-021 — Domain-Driven Structure with Nx Generators for Scaffolding

Status: Active

Context: The project's architecture needs to be scalable, maintainable, and enforce clear boundaries between different parts of the application. The creation of new features should be consistent and efficient.

Decision: Organize the codebase using a Domain-Driven Design (DDD) structure within the Nx monorepo. Libraries will be structured by domain (e.g., `libs/<domain>`) and further subdivided into layers (`domain`, `application`, `infrastructure`, `ui`, `api`). A custom orchestrator generator (`@vibepro/domain`) will be created to scaffold the entire structure for a new domain. This generator will leverage specialized, off-the-shelf generators for specific layers:

-   **Backend API:** `@nxlv/python` will be used to scaffold FastAPI applications.
-   **UI Components:** `@nx-extend/shadcn-ui` will be used to generate type-safe UI components.
-   **Frontend Application:** The appropriate Nx plugin (`@nx/next`, `@nx/remix`, or `@nx/expo`) will be used based on the project configuration.

Rationale:

-   **Scalability:** DDD provides clear boundaries, allowing teams to work on different domains in parallel.
-   **Consistency:** A primary generator orchestrating specialized generators ensures all domains follow the same structure and conventions.
-   **Efficiency:** Automates boilerplate creation, allowing developers to focus on business logic.
-   **Architectural Safety:** Nx dependency rules can be used to enforce boundaries between domains and layers.
-   **Leverages Ecosystem:** Uses well-maintained community generators, reducing custom code.

Consequences:

-   Requires an upfront investment in building and maintaining the main `@vibepro/domain` orchestrator generator.
-   Developers need to be trained on the DDD structure and how to use the primary generator.
-   The project becomes dependent on the continued maintenance of external Nx generators.

---

## DEV-ADR-022 — Hexagonal Architecture (Ports & Adapters) for Decoupling

Status: Active

Context: To ensure that the application's core business logic is maintainable, testable, and independent of external technologies, a clear separation of concerns is required. The current domain-driven structure needs a more formal pattern for managing dependencies between the core logic and external systems like the database, APIs, and UIs.

Decision: Formally adopt Hexagonal (Ports & Adapters) architecture.

-   **Core Logic:** The `domain` and `application` layers will contain the core business logic and will have no dependencies on external technologies.
-   **Ports:** The application's boundaries will be defined by `ports`, which are technology-agnostic interfaces (or `protocol` types in Python using abstract base classes only where necessary) located within the `application` layer. These ports define contracts for data persistence and other external interactions (e.g., `IUserRepository`).
-   **Adapters:** Concrete implementations of ports are called `adapters`.
    -   **Driven Adapters:** These implement ports for backend services. For example, a `SupabaseUserRepository` in the `infrastructure` layer will implement the `IUserRepository` port.
    -   **Driving Adapters:** These drive the application's core logic. For example, FastAPI controllers in the `api` layer or UI components in the `ui` layer will use application services via their ports.

Rationale:

-   **Decoupling:** The core logic is completely decoupled from the implementation details of external services.
-   **Testability:** The core logic can be tested in isolation by providing mock implementations of ports.
-   **Flexibility:** External technologies can be swapped out by simply writing a new adapter (e.g., replacing Supabase with another database) without changing the core logic.

Consequences:

-   Introduces a higher level of abstraction, which may increase the initial learning curve.
-   Results in a greater number of files and interfaces to manage.
-   Requires consistent use of dependency injection to provide concrete adapters to the application's core.

## DEV-ADR-023 — Idempotent Nx Generators with Regression Tests

Status: Active

Context: HexDDD ADR-007 establishes that generators must be rerunnable without creating diffs. VibesPro relies heavily on generators to scaffold template outputs, but no binding decision presently enforces idempotent behavior or regression tests.

Decision: Treat generator idempotency as a non-negotiable requirement. Every generator must read before it writes, rely on deterministic formatting helpers, and include automated regression tests that execute the generator twice to assert zero diffs.

Rationale:

-   Prevents generator drift and merge conflicts in generated projects.
-   Enables safe, repeatable scaffolding for AI-driven automation and CI smoke tests.
-   Aligns the template with HexDDD’s proven workflow for generator stability.

Consequences:

-   Generator authors must adopt deterministic write patterns (AST, markers, sorted outputs).
-   Test suites expand to cover double-run assertions (Jest/ShellSpec) and will fail on non-idempotent code.
-   CI pipelines need to execute new generator regression tests.

## DEV-ADR-024 — Unit of Work and Event Bus as First-Class Abstractions

Status: Active

Context: HexDDD ADR-006 and SDS-009/010 describe UoW and Event Bus seams that keep business logic transactional and event-driven. VibesPro references hexagonal patterns but does not currently require these primitives in generated domains.

Decision: Ship canonical Unit of Work and Event Bus abstractions (with TypeScript interfaces and Python typing.Protocols) in every generated bounded context, including in-memory defaults and extension points for adapters (Supabase, message brokers, etc.).

Rationale:

-   Guarantees the application layer remains persistence-agnostic and testable.
-   Provides opinionated starting points for transactional workflows and eventual consistency.
-   Mirrors HexDDD scaffolding so users migrating projects retain behavior parity.

Consequences:

-   Generators must emit contracts plus baseline adapters and integration tests.
-   Documentation and samples explain how to replace in-memory adapters with infrastructure implementations.
-   Additional validation hooks ensure UoW/Event Bus are wired through FastAPI/React entry points.

## DEV-ADR-025 — Enforce Dependency Boundaries via Nx Tags

Status: Active

Context: HexDDD ADR-008 enforces architectural boundaries using Nx tags and lint rules. VibesPro mentions hexagonal layering but lacks a formal, enforceable constraint system.

Decision: Annotate every generated project with a standardized tag taxonomy (`scope:*`, `type:*`, `layer:*`) and enforce import rules using `@nx/enforce-module-boundaries` and Nx Conformance (when available).

Rationale:

-   Preserves hexagonal architecture at scale by preventing cross-layer and cross-domain coupling.
-   Provides automated guardrails for contributors and AI agents alike.
-   Keeps generated projects aligned with HexDDD’s enforcement strategy.

Consequences:

-   Generators must stamp tags into `project.json` manifests.
-   Lint configuration becomes non-optional; lint failures block merges.
-   Conformance checks add modest CI cost but catch violations early.

## DEV-ADR-026 — Supabase Developer Stack Orchestration

Status: Active

Context: HexDDD ADR-015 bundles a ready-to-run Supabase stack with Nx targets so developers can reproduce schema-driven workflows locally. VibesPro adopts Supabase as the source of truth (DEV-ADR-019/020) but lacks a standardized developer stack.

Decision: Provide Docker Compose assets and Nx run-command targets (`supabase-devstack:start|stop|reset|status`) that orchestrate a local Supabase environment with environment file scaffolding.

Rationale:

-   Ensures local development, CI, and production share identical schema workflows.
-   Simplifies onboarding by replacing manual Supabase CLI steps with templated commands.
-   Supports end-to-end type generation pipelines already defined in DEV-ADR-019/020.

Consequences:

-   Requires maintaining Docker Compose definitions and tooling scripts.
-   Developers need Docker installed; documentation must describe resource requirements.
-   CI jobs may optionally start the stack for integration tests.

## DEV-ADR-027 — Nx Upgrade Cadence and Plugin Matrix

Status: Active

Context: HexDDD ADR-014 defines an explicit upgrade cadence for Nx and its plugins. VibesPro currently performs upgrades ad hoc, leading to potential drift between template and generated projects.

Decision: Adopt a scheduled (e.g., quarterly) Nx upgrade window that runs `nx migrate`, updates first-party plugins and community tooling (Next, Remix, Expo, Python), and documents rollback procedures.

Rationale:

-   Keeps template-generated workspaces aligned with the latest Nx capabilities and security fixes.
-   Reduces incompatibilities between template generators and downstream projects.
-   Provides a predictable maintenance rhythm for the team.

Consequences:

-   Adds recurring maintenance tasks with validation gates (lint, test, type generation).
-   Requires change management documentation (runbooks, migration notes).
-   Potential short-term instability during upgrade windows that must be mitigated via smoke tests.

## DEV-ADR-028 — Nx Generator Composition Pattern for Full-Stack Applications

Status: Active

Context: HexDDD ADR-012 consolidates React surface generators into a single, configurable workflow. VibesPro needs to support **frontend frameworks** (Next.js, Remix, Expo) and **Python/FastAPI backends** while avoiding maintenance burden of custom generators. Nx provides official, well-maintained generators (`@nx/next`, `@nx/remix`, `@nx/expo`, `@nxlv/python`) that handle framework-specific scaffolding. VibesPro's type system relies on **FastAPI-OpenAPI-Pydantic** chain that enables end-to-end type syncing via Supabase.

Decision: Create thin wrapper generators that **compose** official Nx generators using `externalSchematic` API, then apply post-generation transformations to inject:

-   **Frontend**: Shared-web patterns, hexagonal architecture imports, VibesPro conventions
-   **Backend**: FastAPI + Logfire bootstrap, Pydantic schemas, hexagonal ports/adapters, Supabase type-sync integration

Rationale:

-   **Leverage Official Generators**: Nx generators stay updateable; we don't fork/maintain framework-specific code.
-   **Control Integration Points**: Wrapper applies shared libraries, error handling, and hexagonal structure after Nx scaffolding.
-   **Low Maintenance Burden**: Only update wrappers when Nx introduces breaking API changes.
-   **Composition Over Creation**: Aligns with "generators-first" principle and Nx best practices.
-   **Future-Proof**: New Nx features (e.g., RSC updates, Expo SDK changes, FastAPI patterns) flow through automatically.
-   **Type-Safe Full Stack**: Python backend generators ensure Pydantic models sync with Supabase schema for end-to-end type safety.

Consequences:

-   Wrapper generators depend on Nx generator APIs (require version compatibility testing).
-   Post-generation transformations must be idempotent and well-tested.
-   Need to document which Nx versions are supported and how to handle breaking changes.
-   Backend wrappers must integrate with existing `libs/python/vibepro_logging.py` and hexagonal patterns from PHASE-002.
-   Slightly more complex setup than pure custom generators, but massively reduced long-term maintenance.

## DEV-ADR-029 — Strict Typing Policy Across Languages

Status: Active

Context: HexDDD ADR-010 mandates TypeScript `strict` mode and Python `mypy --strict`, along with modern type features. VibesPro’s specs cite type safety goals but do not enforce strict compiler/type-check settings.

Decision: Mandate strict TypeScript compiler options and Python mypy strict mode in all generated projects, encouraging the use of `satisfies`, branded types, `typing.Protocol`, and PEP 695 aliases.

Rationale:

-   Ensures type regressions fail fast and prevents implicit any usage.
-   Aligns with Supabase-driven schema workflows by catching drift at compile time.
-   Matches HexDDD’s standard for strongly typed multi-language stacks.

Consequences:

-   Templates must include strict compiler settings and lint rules rejecting `any`.
-   Contributors may need onboarding to advanced typing patterns.
-   CI pipelines must run TypeScript and Python type checks with zero-warning thresholds.
