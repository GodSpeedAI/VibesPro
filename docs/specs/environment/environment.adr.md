# ENVIRONMENT ADRs

<!-- matrix_ids: [] -->

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

## DEV-ADR-026 — Supabase Developer Stack Orchestration

Status: Active

Context: HexDDD ADR-015 bundles a ready-to-run Supabase stack with Nx targets so developers can reproduce schema-driven workflows locally. VibesPro adopts Supabase as the source of truth (DEV-ADR-019/020) but lacks a standardized developer stack.

Decision: Provide Docker Compose assets and Nx run-command targets (`supabase-devstack:start|stop|reset|status`) that orchestrate a local Supabase environment with environment file scaffolding.

Rationale:

- Ensures local development, CI, and production share identical schema workflows.
- Simplifies onboarding by replacing manual Supabase CLI steps with templated commands.
- Supports end-to-end type generation pipelines already defined in DEV-ADR-019/020.

Consequences:

- Requires maintaining Docker Compose definitions and tooling scripts.
- Developers need Docker installed; documentation must describe resource requirements.
- CI jobs may optionally start the stack for integration tests.

## DEV-ADR-027 — Nx Upgrade Cadence and Plugin Matrix

Status: Active

Context: HexDDD ADR-014 defines an explicit upgrade cadence for Nx and its plugins. VibesPro currently performs upgrades ad hoc, leading to potential drift between template and generated projects.

Decision: Adopt a scheduled (e.g., quarterly) Nx upgrade window that runs `nx migrate`, updates first-party plugins and community tooling (Next, Remix, Expo, Python), and documents rollback procedures.

Rationale:

- Keeps template-generated workspaces aligned with the latest Nx capabilities and security fixes.
- Reduces incompatibilities between template generators and downstream projects.
- Provides a predictable maintenance rhythm for the team.

Consequences:

- Adds recurring maintenance tasks with validation gates (lint, test, type generation).
- Requires change management documentation (runbooks, migration notes).
- Potential short-term instability during upgrade windows that must be mitigated via smoke tests.
