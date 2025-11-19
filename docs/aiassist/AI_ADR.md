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
- **Decision:** Maintain maintainer-focused guidance under `docs/aiassist/` while emitting user-facing AI workflow documentation through template docs so that generated projects have immediate onboarding content.
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

## AI_ADR-006 — Optional security hardening with TPM-backed encryption at rest

- **Status:** Accepted
- **Decision:** Provide optional security hardening features via Copier template flags (`enable_security_hardening`), including TPM-backed key sealing, XChaCha20-Poly1305 encryption for the temporal learning database (sled), and defense-in-depth deployment patterns (distroless containers, static binaries, least-privilege execution).
- **Rationale:** Addresses edge deployment security requirements without imposing mandatory complexity on all projects. Generator-first approach ensures security patterns are consistently applied when needed while maintaining zero overhead for non-hardened projects.
- **Alternatives Considered:**
    - **Mandatory security for all projects** (rejected due to unnecessary complexity and performance overhead for development/testing environments).
    - **External security library** (rejected because it breaks the self-contained generator philosophy and adds runtime dependencies).
    - **AES-256-GCM instead of XChaCha20-Poly1305** (rejected because XChaCha20's 192-bit nonce reduces misuse risk and performs better on ARM/edge devices without AES-NI).
    - **OpenSSL/libsodium** (rejected due to large binary size increase and complex dependency management).
- **Consequences:**
    - **Positive:** Projects requiring edge security get production-ready encryption with minimal configuration; hardware-bound security via TPM prevents key exfiltration; performance overhead < 10% meets edge constraints.
    - **Negative:** Adds 3 new template variants to maintain; requires security-specific testing infrastructure; TPM integration complexity for contributors unfamiliar with hardware security.
    - **Mitigation:** Feature flag ensures opt-in behavior; comprehensive documentation and example configurations provided; fallback to file-based key sealing when TPM unavailable.
- **Key Design Decisions:**
    - **Nonce scheme:** 64-bit monotonic counter + 128-bit DB UUID → 192-bit nonce (eliminates random nonce generation dependencies, prevents birthday-bound attacks)
    - **Key derivation:** HKDF-SHA256 with domain separation (`db-key`, `audit-key`, `transport-key`) enables key rotation and multi-purpose use
    - **Storage format:** `[nonce || ciphertext]` per record ensures decryption independence from runtime counter state
    - **Failure mode:** Nonce reuse risk triggers write refusal with critical alert (fail-safe, not fail-open)
- **Success Metrics:**
    - Zero plaintext discoverable in filesystem dumps
    - Encryption overhead < 5% on standard workloads
    - Binary size increase < 2MB
    - All crypto dependencies pass `cargo audit` with no HIGH/CRITICAL issues

```

```
