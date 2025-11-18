# ENVIRONMENT SDSs

<!-- matrix_ids: [] -->

## DEV-SDS-010 — Devbox as parent shell (addresses DEV-PRD-011, DEV-PRD-015)

Principle: OS dependencies are reproducible and never depend on host state.

Design:

devbox.json defines OS utilities (git, curl, jq, make, ffmpeg, postgresql-client, optional uv).

Developer flow: devbox shell → all subsequent commands execute inside this parent shell.

Scripts in CI may call devbox run -- <cmd> or run inside a Devbox-equivalent container layer.

Error modes: Missing Devbox binary; package not found on platform; non-zero exit from init_hook. Provide actionable messages with remediation.

Artifacts: devbox.json, docs/ENVIRONMENT.md section “Using Devbox”.

## DEV-SDS-011 — mise runtime activation and PATH policy (addresses DEV-PRD-012, DEV-PRD-015, DEV-PRD-016)

Principle: One source of truth for language versions.

Design:

.mise.toml pins node, python, rust.

Local: activate via mise install then mise exec -- <cmd> or shell hook (use_mise if using direnv locally).

CI: mise install then run tasks; no direnv required.

Preflight: a just verify:node task checks node --version vs .mise.toml and (if present) Volta pins.

Error modes: Partial installs, PATH shadowing (Volta vs mise), missing shims. just doctor prints active versions.

Artifacts: .mise.toml, Justfile targets verify:\*, docs updates.

## DEV-SDS-013 — Just tasks: environment-aware execution (addresses DEV-PRD-014, DEV-PRD-015)

Principle: One-liners for the most common workflows.

Design:

Tasks assume Devbox + mise are active and secrets are loaded (local via direnv, CI via SOPS export).

Example targets: setup, build, test, lint, doctor, verify:node, verify:python, verify:rust.

Remove redundant bootstrapping if covered by mise (e.g., corepack enable optional).

Error modes: Missing env → task prints guidance to activate Devbox/mise; missing secrets → hints to run the decrypt step.

Artifacts: Justfile diffs (minimal, surgical), docs/ENVIRONMENT.md.

## DEV-SDS-014 — Minimal CI pipeline (addresses DEV-PRD-015)

Principle: Parity with local, minus direnv.

Design (pseudostep order):

Checkout repo.

Install Devbox (or use a base image that includes it).

Devbox step: ensure OS tools available for subsequent steps.

Install mise; mise install.

SOPS decrypt to ephemeral env file using CI key/KMS; source it.

Run tasks via just (e.g., just build, just test).

Cleanup ephemeral files (/tmp/ci.env).

Error modes: Secret failure, cache miss for runtimes, PATH conflicts (Volta). Fail fast with explicit diagnostics.

Artifacts: .github/workflows/\* snippets, CI docs.

## DEV-SDS-015 — Volta coexistence & enforcement (addresses DEV-PRD-016)

Principle: Deterministic resolution for Node toolchain, with a clear deprecation path.

Design:

Authoritative source: mise. If a package.json contains a volta stanza, a preflight just verify:node:

Ensures Volta’s node/npm/pnpm match .mise.toml.

Emits a warning when matching; emits a hard error on divergence.

Deprecation: Document a two-release window to remove the volta section from package.json (or mark as informational only).

CI: Volta is not installed; verification runs using jq to read package.json pins (if present) and compare to mise.

Error modes: Different pins, shadowed shims. Resolution guidance printed with exact commands to align versions.

Artifacts: Justfile (verify:node), docs note “Volta Compatibility Mode”.

## DEV-SDS-026 — Supabase Dev Stack Targets & Tooling (addresses DEV-PRD-027)

-   Nx Targets: `tools/supabase/project.json` exports `supabase-devstack:start|stop|reset|status` run-commands invoking Docker Compose.
-   Compose Files: Maintain `docker/docker-compose.supabase.yml` mirroring HexDDD services (db, auth, storage, studio, etc.).
-   Environment: Provide `example.env` and generator-produced `.env.supabase.local` instructions; secrets stored in SOPS files.
-   Tests: ShellSpec scripts cover start/stop/reset flows; optional CI job ensures stack bootstraps within budgeted time.
-   Docs: Update `docs/ENVIRONMENT.md` and `docs/project_state.md` with quick-start and teardown guidance.

## DEV-SDS-027 — Nx Upgrade Runbook (addresses DEV-PRD-028)

-   Workflow: Create `docs/runbooks/nx_upgrade.md` detailing branch creation, `pnpm dlx nx migrate latest`, reviewing `migrations.json`, and applying codemods.
-   Validation Suite: Run `pnpm install`, `pnpm lint`, `pnpm tsc --noEmit`, `nx run-many --target=test`, `just test-generation`, and `just spec-guard`.
-   Rollback: Document restoring prior lockfiles and re-running previous Nx version if regressions appear.
-   Communication: Capture release notes and migration highlights for generated project consumers.
-   Scheduling: Track upgrade cadence on the platform roadmap and coordinate with downstream template consumers.
