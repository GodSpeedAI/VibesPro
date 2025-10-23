# Developer Architectural Decision Record (DX-focused)

Audience: Developers as primary users
Scope: Decisions shaping the development environment as a product platform
Source: transcript.md synthesis and repository conventions

---

## DEV-ADR-001 — Native Copilot/VS Code over custom DSL

- Decision: Use only GitHub Copilot + VS Code native mechanisms (copilot-instructions.md, instructions/_.md, prompts/_.prompt.md, chatmodes/\*.chatmode.md, settings.json, tasks) instead of inventing a YAML DSL.
- Context: Constraint of “NO custom YAML files or external DSL,” need for immediate usability and hot-reload.
- Rationale: Lower cognitive load; no extra tooling; leverages existing ecosystem; simpler onboarding; safe defaults.
- DX Impact: Faster setup (<10 min), less context switching, predictable discovery; fewer toolchains to learn.
- Trade-offs: Less declarative logic in-config; conditional flows handled via tasks/scripts.

## DEV-ADR-002 — MECE modular instruction files with “LoRA-style” stacking

- Decision: Break guidance into MECE instruction files (security, performance, style, general) and compose per task by ordered stacking.
- Rationale: Mirrors adapter/LoRA composability; enables reuse and fine-grained overrides.
- DX Impact: Clear layering, simpler diffs, targeted tweaks; avoids monolithic prompts.
- Conventions: Left-to-right order determines precedence; repo-wide > mode > prompt can be tuned explicitly.

## DEV-ADR-003 — Custom chat modes as first-class personas (8 roles)

- Decision: Define chat modes for product-manager, ux-ui-designer, system-architect, senior-frontend-engineer, senior-backend-engineer, qa-test-automation-engineer, devops-deployment-engineer, security-analyst.
- Rationale: Minimizes cognitive switching; aligns with delivery phases; improves handoffs.
- DX Impact: One-click persona; consistent outputs; faster planning/implementation flows.

## DEV-ADR-004 — Tasks as orchestration layer (dynamic injection, A/B, token metrics)

- Decision: Use VS Code tasks to run prompts, inject dynamic context, measure tokens, and support A/B flows via branches/workspaces.
- Rationale: Declarative files stay simple; tasks provide controlled imperative glue.
- DX Impact: Repeatable runs; single keybindings/commands; measurable feedback loops.

## DEV-ADR-005 — Security by default: workspace trust and tool safety

- Decision: Respect workspace trust boundaries; never enable chat.tools.autoApprove; centralize safety instructions.
- Rationale: Prevent prompt-injection and RCE; protect developer machines.
- DX Impact: Confidence in running examples; fewer security reviews blocked.

## DEV-ADR-006 — Context window optimization via strategic file ordering

- Decision: Use chat.promptFilesLocations and chat.modeFilesLocations with curated ordering; prune redundant context.
- Rationale: Predictable token budgets; reduce noise; improve answer quality.
- DX Impact: Fewer truncations; faster, more relevant results.

## DEV-ADR-007 — Prompt-as-code lifecycle (VC, lint, test, plan)

- Decision: Treat prompts/instructions as code: versioned, linted, evaluated (A/B), and “planned” prior to change.
- Rationale: Reproducibility and rollback; reduces regressions.
- DX Impact: Safer iteration; observable quality trends; consistent reviews.

## DEV-ADR-008 — CALM + Wasp + Nx synergy (semantics over single-spec generation)

- Decision: Use CALM (architecture semantics/policy) over a Wasp-style single spec; Nx generators scaffold reversible polyglot services; IaC artifacts are downstream.
- Rationale: Clear separation of intent vs constraints; design-time guarantees.
- DX Impact: Deterministic scaffolds; safer service boundaries; reversible changes.

## DEV-ADR-009 — Declarative-first with imperative escape hatches

- Decision: Keep guidance declarative; use tasks/scripts for branching/conditionals and retrieval.
- Rationale: Maintains simplicity; avoids DSL creep; enables power when needed.
- DX Impact: Lower learning curve; flexibility preserved.

## DEV-ADR-010 — Evaluation hooks and token budgets

- Decision: Provide token usage logging, quality checks, and optional toxicity/safety post-process steps.
- Rationale: Close the loop on output quality and cost.
- DX Impact: Faster feedback; predictable spend; structured improvements.

## DEV-ADR-011 — Adopt Devbox as OS dependency boundary

Decision: Use Devbox to provision all OS-level tools for local and CI environments.

Context: Current manuals require host installs; variability causes flakiness.

Rationale: Reproducibility, cross-platform parity, smaller onboarding surface.

DX Impact: Faster “first build,” fewer “works on my machine” incidents.

Trade-offs: Devbox binary required; CI runner images may need an extra layer.

## DEV-ADR-012 — Standardize on mise for multi-language runtime management

Decision: Use mise to pin/activate Node, Python, and Rust; remove .python-version and avoid per-language managers in CI.

Context: Prior pyenv and ad-hoc Node/Rust flows drifted.

Rationale: Single tool, consistent PATH, simpler docs/CI.

DX Impact: Zero drift; simpler contributor experience.

Trade-offs: Team must learn mise; initial cache warming in CI.

## DEV-ADR-013 — Secrets managed by SOPS; ephemeral decryption

Decision: Store .secrets.env.sops in Git (encrypted) and decrypt only into process env at runtime; no plaintext .env committed.

Context: Desire to avoid secret sprawl and align local/CI flows.

Rationale: Strong auditability; easy rotation; flexible recipients (AGE/KMS).

DX Impact: Safer by default; minimal friction after keys configured.

Trade-offs: Requires developer key management; CI key plumbing.

## DEV-ADR-014 — Volta compatibility, mise authority, and timed deprecation

Decision: Keep Volta temporarily as a compatibility signal but treat mise as authoritative for Node; fail builds on divergence.

Context: Some contributors use Volta; the repo may include volta pins.

Rationale: Smooth transition, deterministic behavior, one true source.

DX Impact: Clear, early feedback; removal plan avoids confusion.

Trade-offs: Short-term duplication until deprecation window ends.

## DEV-ADR-015 — Minimal CI (no direnv) with explicit SOPS decrypt

Decision: CI uses Devbox + mise and decrypts SOPS via CI secrets; direnv is not used in CI.

Context: direnv adds little value in non-interactive jobs.

Rationale: Simpler pipeline, fewer moving parts; same versions as local.

DX Impact: Faster, more reliable CI; clearer failure modes.

Trade-offs: Need small glue to source decrypted env file.

## DEV-ADR-016 — Adopt Rust‑Native Observability Pipeline (tracing → Vector → OpenObserve)

Status: Proposed → Active (feature‑flagged)

Context
VibePro’s execution model is moving toward deterministic, AI‑ready telemetry. Current logging is largely unstructured, preventing reliable correlation and automated analysis. A Rust‑native stack (tracing → Vector → OpenObserve) provides structured OTLP telemetry with low runtime overhead and avoids container‑side agents.

Decision
Implement an opt‑in observability subsystem composed of:

- tracing + tracing‑opentelemetry for in‑process spans, metrics, and structured logs
- Vector as the host‑level collector/transformer
- OpenObserve as the unified long‑term store

Enable via the environment flag: VIBEPRO_OBSERVE=1

Rationale

- Low overhead: Rust async tracing with minimal allocations
- Standardized telemetry (OTLP) compatible with AIOps tools
- Enables AI‑driven RCA and anomaly detection with context‑rich spans
- Removes dependency on container agents (Vector runs as a host binary)

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

- DEV-PRD-017 — Observability Integration Story (create before Phase 3 implementation)
- docs/dev_tdd_observability.md (v1)

- DEV-SDS-017 — Observability Design Spec (create before Phase 2 implementation)
- Traceability: Phase 1 prototypes may proceed without specs; Phases 2+ must reference DEV-SDS-017 and DEV-PRD-017 in commits

Notes

- Ensure PII/PII‑like fields are redacted or filtered before export.
- Add automated CI checks for vector config validation and a small benchmark to detect regressions.
- Document rollout plan for operators (Vector binary distribution, upgrades, and monitoring).

## DEV-ADR-017 — JSON-First Structured Logging with Trace Correlation

Status: Active

Context
VibePro's current logging approach is inconsistent across languages (Rust, Node, Python) with mixed formats (printf-style, JSON, unstructured). This prevents reliable log-trace correlation, PII governance, and cost-effective retention strategies. The existing observability pipeline (DEV-ADR-016) provides the transport layer but needs logging conventions.

Decision
Implement structured, JSON-first logging with mandatory trace correlation across all languages:

- **Format:** JSON only (machine-first) for all application logs
- **Correlation:** Every log line carries `trace_id`, `span_id`, `service`, `env`, `version`
- **PII Protection:** Never emit raw PII from app code; mandatory redaction in Vector
- **Levels:** `error`, `warn`, `info`, `debug` (no `trace` level—use tracing spans)
- **Categories:** `app` (default), `audit`, `security` via dedicated field
- **Transport:** stdout/stderr locally; OTLP to Vector when `VIBEPRO_OBSERVE=1`
- **Retention:** 14-30 days for logs (shorter than traces)

Language-specific implementations:

- **Rust:** Continue using `tracing` events (already in place via `vibepro-observe`)
- **Node:** `pino` with custom formatters for trace context injection
- **Python:** `structlog` with JSON renderer and context binding

Rationale

- **Consistency:** Same log schema regardless of language/runtime
- **Correlation:** Enables log ↔ trace navigation in OpenObserve
- **Cost Control:** Sampling/redaction at Vector edge; shorter retention than traces
- **PII Safety:** Centralized redaction rules prevent accidental exposure
- **Query Performance:** JSON structure enables fast field indexing

Consequences

| Area         | Positive                                       | Trade-off                                   |
| ------------ | ---------------------------------------------- | ------------------------------------------- |
| Developer DX | Unified logging API across languages           | Learning curve for structured logging       |
| Debugging    | Fast correlation between logs and traces       | Must adopt new logger libs (pino/structlog) |
| Security     | PII redaction enforced at infrastructure layer | Vector config complexity                    |
| Cost         | Lower retention costs; efficient queries       | Initial setup overhead                      |
| Operations   | Consistent log schema for alerting/dashboards  | Requires Vector transforms validation       |

Implementation Requirements

1. Add Vector OTLP logs source and PII redaction transforms to `ops/vector/vector.toml`
2. Create `libs/node-logging/logger.ts` with pino wrapper
3. Create `libs/python/vibepro_logging.py` with structlog configuration
4. Document logging policy in `docs/ENVIRONMENT.md` and `docs/observability/README.md`
5. Add TDD tests: Vector config validation, PII redaction, trace correlation

Related Specs

- DEV-ADR-016 — Rust-Native Observability Pipeline (foundation)
- DEV-PRD-018 — Structured Logging Product Requirements (to be created)
- DEV-SDS-018 — Structured Logging Design Specification (to be created)
- DEV-SPEC-009 — Logging Policy & Examples (documentation)

Migration Strategy

- Phase 1: Introduce logging libraries as opt-in; update examples
- Phase 2: Deprecate printf-style logging; lint rules to enforce JSON
- Phase 3: Mandatory for all new code; existing code migrated incrementally

Validation

- All logs must include: `trace_id`, `span_id`, `service`, `environment`, `application_version`
- PII fields (email, authorization, tokens) automatically redacted by Vector
- Tests validate: config correctness, redaction behavior, correlation fields

---

## DEV-ADR-018 — Temporal AI intelligence fabric for guidance & optimization

Status: Proposed

Context

- Enhanced AI pattern prediction, automated performance optimization, and deeper context awareness are top DX asks, but current capabilities operate independently (temporal DB, pattern recognizer, performance telemetry, and AIContextManager scoring).
- redb already stores architecture decisions, performance spans, and AI guidance outcomes with timestamps, yet no feedback loop closes the gap between historical success and future recommendations.
- Developers want proactive, confident suggestions without curating prompts by hand for every task.

Decision

- Treat the temporal database, ArchitecturalPatternRecognizer, PerformanceMonitor, and AIContextManager as a unified "AI guidance fabric" that mines historical outcomes to steer future assistance.
- Establish shared contracts so that:
  - Temporal snapshots feed clustering jobs that emit pattern recommendations with confidence scores and provenance metadata.
  - Performance telemetry produces heuristics (baseline deltas, hotspot detection) that surface prescriptive tuning advice alongside raw metrics.
  - AIContextManager scoring incorporates pattern confidence, performance advisories, and usage success rates when assembling bundles inside token budgets.
- Ship the fabric in incremental phases with strict TDD coverage tracked in `docs/dev_tdd_ai_guidance.md`.

Rationale

- **Higher-confidence guidance:** Learning from past successful artifacts reduces generic answers and aligns suggestions with proven solutions.
- **Operational awareness:** Performance heuristics turn telemetry into prescriptive advice, shrinking iteration loops when regressions appear.
- **Context quality:** Injecting temporal success data into context scoring increases bundle relevance without exceeding budgets.
- **Reuse existing assets:** Builds on the temporal DB, telemetry hooks, and context manager that already exist in the platform.

Consequences

| Area           | Positive                                                          | Trade-off                                                      |
| -------------- | ----------------------------------------------------------------- | -------------------------------------------------------------- |
| Developer DX   | Proactive, context-aware recommendations with confidence metadata | Requires new UI/CLI surfacing for confidence + advisories      |
| Data           | Unified governance for temporal insights and telemetry            | Must harden retention/PII policies before expanding data usage |
| Operations     | Scheduled clustering jobs create predictable cadence              | Background jobs add operational overhead and monitoring needs  |
| Performance    | Automated hotspots caught earlier                                 | Additional telemetry processing may add slight CPU/memory cost |
| Implementation | Clear traceability via ADR → PRD → TDD plan                       | Coordination needed across Rust, Node, and TypeScript modules  |

Implementation Requirements

1. Extend `ArchitecturalPatternRecognizer` (Python) to consume temporal DB snapshots, emit `pattern_recommendation` records, and persist confidence + provenance fields.
2. Expand `PerformanceMonitor` (TypeScript/Node) spans to calculate baseline deltas and publish `performance_advisory` artifacts into redb.
3. Update `AIContextManager` (TypeScript) scoring to weight context sources using temporal success metrics and pattern confidences.
4. Add governance guards: retention policies, opt-out flags, and anonymization for sensitive fields prior to storage.
5. Wire a consolidated CI workflow (`.github/workflows/ai-guidance.yml`) that runs `nx run-many --target=test --projects temporal,performance,context` and the new `just test-ai-guidance` wrapper before merge.
6. Establish the S.W.O.R.D skill rubric (Safety, Workflow Observability, Reliability, Developer experience) and require every code path surfaced by the fabric to document how it satisfies the rubric within implementation PRs.
7. Validate via the TDD plan in `docs/dev_tdd_ai_guidance.md`, covering unit, integration, and regression tests for each subsystem.

Related Specs

- DEV-PRD-018 — AI pattern intelligence & performance co-pilot
- DEV-SDS-021 — AI guidance fabric design (to be authored)
- DEV-SPEC-012 — Temporal database governance (existing)
- docs/dev_tdd_ai_guidance.md — Phase-driven TDD execution plan (now including CI workflow + S.W.O.R.D closure tracking)

Validation

- Clustering jobs produce recommendations with confidence ≥ defined threshold and link back to source ADR/commit IDs.
- Performance advisories highlight regressions > 20% over baseline and include remediation hints.
- Context bundles include at least one high-confidence artifact in ≥80% of assistant responses.
- Automated tests cover ingestion, scoring, and advisory generation per the TDD plan.

## Developer ergonomics considerations (summary)

- Progressive disclosure of options; sensible defaults; opinionated naming.
- Idempotent tasks; hot-reload for instructions and modes.
- Clear precedence rules; consistent folder conventions; ready-to-run samples.

---

## DEV-ADR-019 — Supabase as Single Source of Truth for Schema & Types

Status: Active

Context: The project requires a consistent and reliable type system that spans across the database, backend (Python/FastAPI), and frontend (TypeScript/Next.js). Maintaining separate type definitions manually is error-prone and leads to drift.

Decision: Use the Supabase PostgreSQL database schema as the single source of truth for all data models and types. Supabase's built-in type generation capabilities will be used to automatically create TypeScript types directly from the database schema. Python models (Pydantic) will be generated to mirror this schema for the backend.

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
- Initial setup requires integrating the Supabase CLI and Nx generators into a cohesive pipeline.

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
- The project becomes dependent on the continued maintenance of the external Nx generators.

---

## DEV-ADR-022 — Hexagonal Architecture (Ports & Adapters) for Decoupling

Status: Active

Context: To ensure the application's core business logic is maintainable, testable, and independent of external technologies, a clear separation of concerns is required. The current domain-driven structure needs a more formal pattern for managing dependencies between the core logic and external systems like the database, APIs, and UIs.

Decision: Formally adopt the Hexagonal (Ports & Adapters) architecture.

- **Core Logic:** The `domain` and `application` layers will contain the core business logic and will have no dependencies on external technologies.
- **Ports:** The application's boundaries will be defined by `ports`, which are technology-agnostic interfaces (or `protocol` types in Python using abstract base classes only where necessary) located within the `application` layer. These ports define the contracts for data persistence and other external interactions (e.g., `IUserRepository`).
- **Adapters:** Concrete implementations of the ports are called `adapters`.
  - **Driven Adapters:** These implement the ports for backend services. For example, a `SupabaseUserRepository` in the `infrastructure` layer will implement the `IUserRepository` port.
  - **Driving Adapters:** These drive the application's core logic. For example, FastAPI controllers in the `api` layer or UI components in the `ui` layer will use the application services via their ports.

Rationale:

- **Decoupling:** The core logic is completely decoupled from the implementation details of external services.
- **Testability:** The core logic can be tested in isolation by providing mock implementations of the ports.
- **Flexibility:** External technologies can be swapped out by simply writing a new adapter (e.g., replacing Supabase with another database) without changing the core logic.

Consequences:

- Introduces a higher level of abstraction, which may increase the initial learning curve.
- Results in a greater number of files and interfaces to manage.
- Requires the consistent use of dependency injection to provide concrete adapters to the application's core.
