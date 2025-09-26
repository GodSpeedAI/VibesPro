# AI-Assisted Integration Architectural Decision Record

## AI_ADR-001 — Template-first propagation of AI workflows

- **Status:** Accepted
- **Decision:** Embed the VibePDK AI-assisted assets directly inside the Copier template so that every generated workspace inherits the guardrails without manual copying.
- **Rationale:** Ensures consistency across all future projects, eliminates post-generation drift, and aligns with the merger goal of a generator-first platform.
- **Alternatives Considered:**
  - Maintain AI assets only in the root repository and document manual copy steps (rejected due to human error risk and lack of determinism).
  - Deliver AI workflows as a standalone package to be imported post-generation (rejected because it complicates onboarding and breaks traceability).
- **Consequences:** Requires careful reconciliation between existing merger guidance and VibePDK instructions; increases template maintenance responsibility but yields predictable generated outputs.

## AI_ADR-002 — Consolidated `.github` governance for generated workspaces

- **Status:** Accepted
- **Decision:** Merge VibePDK’s instructions, prompts, chat modes, model defaults, and workflows into `templates/{{project_slug}}/.github/`, harmonizing them with HexDDD merger directives.
- **Rationale:** Provides generated projects with a single, comprehensive AI governance stack covering spec-driven development, security, and operational guardrails.
- **Alternatives Considered:**
  - Keep minimal merger instructions and ask teams to fetch VibePDK assets on demand (rejected because it weakens AI-assisted coverage).
  - Fork the instructions between template and generated outputs (rejected because it risks divergence).
- **Consequences:** Necessitates precedence management across instruction frontmatter and ongoing prompt linting, but guarantees AI context parity.

## AI_ADR-003 — Dual documentation streams (maintainer vs generated)

- **Status:** Accepted
- **Decision:** Maintain maintainer-focused guidance under `docs/aiassit/` while emitting user-facing AI workflow documentation through template docs so that generated projects have immediate onboarding content.
- **Rationale:** Separates template evolution guidance from the artifacts delivered to end users, preventing accidental leakage of maintainer-only instructions.
- **Alternatives Considered:**
  - Place all documentation in template outputs (rejected because template contributors would lose a central planning space).
  - Keep all documentation in maintainer space only (rejected because generated projects would lack onboarding material).
- **Consequences:** Requires disciplined duplication management and explicit template docs updates whenever maintainer guidance changes.

## AI_ADR-004 — Built-in automation for specs and AI workflows

- **Status:** Accepted
- **Decision:** Extend `templates/{{project_slug}}/justfile.j2`, package scripts, and supporting shell utilities so generated projects can execute spec-scaffolding, prompt linting, AI context bundling, and validation out of the box.
- **Rationale:** Embeds the spec-driven lifecycle and AI tooling directly into developer workflows, upholding TDD and traceability mandates.
- **Alternatives Considered:**
  - Provide optional scripts via documentation (rejected due to low adoption and fragmented tooling).
  - Rely solely on Nx targets without `just` wrappers (rejected because `just` offers cross-platform consistency already used in VibePDK).
- **Consequences:** Increases template complexity and testing needs but unlocks immediate productivity for generated projects.

## AI_ADR-005 — End-to-end validation via CI for template and generated outputs

- **Status:** Accepted
- **Decision:** Augment both template-level and generated-project CI workflows to run prompt lint, spec matrix checks, AI validation, and generation smoke tests that confirm AI assets are present and functional.
- **Rationale:** Prevents regressions in AI workflows, keeps traceability intact, and enforces parity between template intentions and generated artifacts.
- **Alternatives Considered:**
  - Limit checks to template repository only (rejected because generated outputs could diverge unnoticed).
  - Rely on manual QA after generation (rejected due to inconsistency and scalability issues).
- **Consequences:** Longer CI cycles and additional maintenance of workflow scripts, offset by higher confidence in generated project quality.
