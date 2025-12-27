---
title: 'Production Readiness Plan (VibesPro Template + Generators)'
date: 2025-12-27
status: draft
matrix_ids: []
---

# Production Readiness Plan (VibesPro Template + Generators)

This plan is written to be executable by a maintainer with the current repo state. It focuses on making VibesPro a reliable **generator/template** that produces clean, reproducible, secure downstream projects and can be validated locally and in CI.

## Scope

### In scope

- Copier templates and hooks (`copier.yml`, `.copierignore`, `hooks/*`, `templates/**`)
- Nx generators (`generators/**`) and their quality gates
- CI/local validation reliability (`scripts/ci-local.sh`, `just ai-validate`, tests)
- Ops/security readiness of generated artifacts (no local state, no plaintext secrets in templates)

### Out of scope (for this plan)

- Building a full conversational UI product surface (CLI/TUI/VSCode integration) beyond ensuring the existing workflows are correct and shippable.
- Large new feature work unrelated to generation correctness.

## Goals

1. Generated projects contain **no template contamination** (no local caches/state, no plaintext `.env`, no build artifacts).
2. `just ai-validate` is reliable locally and in CI (no failures due to local machine state or test harness copying huge directories).
3. Template generation smoke testing is deterministic and does not poison the root repo test environment.
4. Generator-first workflows produce Nx-aware projects when they claim to (service generator completeness).

## Current Known Blockers (evidence-backed)

### Blocker 1: Template contamination

Observed in template sources:

- `templates/{{project_slug}}/.env`
- `templates/{{project_slug}}/ops/openobserve/.env.local`
- `templates/{{project_slug}}/ops/openobserve/.env.local.bak`
- `templates/{{project_slug}}/ops/openobserve/.token_seed.lock`
- `templates/{{project_slug}}/ops/openobserve/buildx/` (docker buildx state)

Impact:

- Downstream repos are dirty-by-default and may include unsafe defaults.
- Violates the repo’s own security guidance (“never commit plaintext env files”).

### Blocker 2: pytest-copier fixture copies too much (node_modules)

`tests/conftest.py` copies the entire repo to a temp dir when `copier_template_paths` is empty. This includes `node_modules/`, which breaks `copytree` on pnpm platform-specific entries, causing errors in Copier tests (e.g. logfire template tests).

Impact:

- Python test suite is not reliable and fails in common dev setups.

### Blocker 3: Jest collisions after generating `apps/copier-smoke-example`

After running the smoke generator, Jest sees duplicate package names between:

- `templates/{{project_slug}}/generators/*/package.json`
- `apps/copier-smoke-example/generators/*/package.json`

Impact:

- Jest test run fails with haste-map naming collisions.

### Blocker 4: Rust checks fail due to invalid metadata (local build state)

`cargo clippy` / `cargo test` fail with invalid metadata errors for proc-macro crates (e.g. `tokio_macros`, `serde_derive`). This strongly suggests stale `target/` state produced by a different rustc/toolchain.

Impact:

- `./scripts/ci-local.sh lint` and `./scripts/ci-local.sh test` are not robust to common local state.

### Blocker 5: Copier pre-gen hook does not reliably validate actual context

`hooks/pre_gen.py` currently looks for `copier_answers.json` and can skip validation entirely.

Impact:

- Input sanitization/validation may not execute at the point it’s supposed to.

## Milestones

### Milestone P0 — Stop shipping contaminated templates (must ship first)

**Deliverables**

- Templates no longer include local state or plaintext env files.
- Smoke generation produces a clean example without copying local machine artifacts.

**Implementation tasks**

1. Remove local-state files from template sources:
   - Delete `templates/{{project_slug}}/ops/openobserve/.env.local`
   - Delete `templates/{{project_slug}}/ops/openobserve/.env.local.bak`
   - Delete `templates/{{project_slug}}/ops/openobserve/.token_seed.lock`
   - Delete `templates/{{project_slug}}/ops/openobserve/buildx/` directory
2. Replace `templates/{{project_slug}}/.env` with a safe example file:
   - Prefer `.env.example` (not `.env`) and ensure docs instruct users to create `.env.local` locally (uncommitted).
3. Add/verify `.copierignore` patterns so these cannot re-enter templates (belt-and-suspenders).
4. Add a regression test (Node or Python) that fails if templates contain:
   - `.env` at template root
   - `ops/openobserve/.env.local*`
   - `ops/openobserve/buildx/**`
   - `.token_seed.lock`

**Verification**

- `just copier-smoke-test`
- `just test-generation`
- `rg -n \"^\\.env$\" templates/{{project_slug}}` returns no hits.

### Milestone P0 — Fix test harness reliability (pytest-copier scope)

**Deliverables**

- Copier tests do not copy the whole repo tree (no `node_modules`, no `target`, no `dist`, etc.).

**Implementation tasks**

1. Update `tests/conftest.py` to only copy the minimal template surface area needed for pytest-copier:
   - `copier.yml`
   - `.copierignore`
   - `hooks/`
   - `templates/`
   - any referenced files required by hooks/tests
2. If using `pytest-copier`’s `copier_template_paths`, set it explicitly in test configuration or in `conftest.py` so `_copy_template_tree` uses the selective path list.
3. Add guardrails:
   - Assert that the copied `src` does not contain `node_modules/`, `dist/`, `target/`.

**Verification**

- `uv run pytest -q tests/copier/test_logfire_template.py::test_logfire_env_vars_are_rendered -vv`
- `uv run pytest -q` (entire suite)

### Milestone P0 — Prevent Jest collisions from generated smoke example

**Deliverables**

- Jest test suite runs even after `apps/copier-smoke-example` is generated.

**Implementation options (choose one)**

1. Move smoke output outside the repo root test scope (preferred):
   - Generate to a temp location (e.g., `/tmp` or `./tmp/copier-smoke-example`) and avoid committing it.
2. Exclude the smoke example path from Jest discovery:
   - Add `apps/copier-smoke-example` to `jest.config.json` `testPathIgnorePatterns` and/or `modulePathIgnorePatterns`.
3. Ensure the smoke example does not include template generator packages that collide with template packages:
   - If `templates/{{project_slug}}/generators/**` are not required for generated projects, stop generating them.

**Verification**

- `just copier-regenerate-smoke`
- `pnpm test:jest` (or `./scripts/ci-local.sh test` after other fixes)

### Milestone P1 — Robust Rust validation in local workflows

**Deliverables**

- Local lint/test scripts are robust to stale `target/` state.

**Implementation tasks**

1. Update `scripts/ci-local.sh` Rust steps to:
   - run `cargo clean` when a metadata mismatch is detected; or
   - always use a dedicated target dir for CI-local runs (e.g., `CARGO_TARGET_DIR=target/ci-local`).
2. Ensure the Rust toolchain is consistently selected (mise + rust-toolchain.toml):
   - Document the authoritative toolchain source used by scripts.

**Verification**

- `./scripts/ci-local.sh lint`
- `./scripts/ci-local.sh test`

### Milestone P1 — Make generators match their claims (service generator Nx-awareness)

**Deliverables**

- The service generator produces an Nx-aware project with a `project.json` and targets (build/test/lint where applicable), or docs explicitly state it is “file-only”.

**Implementation tasks**

1. Decide intended output:
   - Python service as Nx project via `@nxlv/python` executor targets; or
   - TS service as Nx Node project via `@nx/node`; or both.
2. Update generator templates under `generators/service/files/**` to include Nx project config as needed.
3. Add generator smoke coverage / idempotency checks.

**Verification**

- `just test-generator-smoke`
- `just test-generators`

### Milestone P2 — Fix Copier hook wiring and enforce validation

**Deliverables**

- Pre-gen validation runs with real Copier context and fails fast on invalid inputs.

**Implementation tasks**

1. Update `hooks/pre_gen.py` to consume actual Copier-provided context rather than a placeholder file.
2. Ensure validations match `copier.yml` rules and security constraints.
3. Add targeted tests for invalid inputs and path traversal attempts.

**Verification**

- `just copier-quick-validate`
- `just copier-smoke-test`
- `uv run pytest -q tests/copier/ -vv`

## Work Breakdown (Actionable Steps)

### Step 1 — Make template sources clean (P0)

Files to edit/delete (template sources):

- Delete:
  - `templates/{{project_slug}}/.env`
  - `templates/{{project_slug}}/ops/openobserve/.env.local`
  - `templates/{{project_slug}}/ops/openobserve/.env.local.bak`
  - `templates/{{project_slug}}/ops/openobserve/.token_seed.lock`
  - `templates/{{project_slug}}/ops/openobserve/buildx/`
- Add:
  - `templates/{{project_slug}}/.env.example` (safe defaults only)

Update docs to match:

- `templates/{{project_slug}}/ops/openobserve/README.md`
- `docs/how-to/sops-secrets.md` (if needed)

### Step 2 — Fix pytest-copier copying (P0)

Files to edit:

- `tests/conftest.py`
- Possibly `pytest.ini` / `pyproject.toml` test config if you prefer a config-driven `copier_template_paths`.

### Step 3 — Remove Jest collision risk (P0)

Files to edit:

- `jest.config.json` (ignore patterns)
- `justfile` recipe(s) if smoke output location changes
- If necessary, template generation layout to avoid duplicate package names in the same workspace.

### Step 4 — Harden Rust local CI mirror (P1)

Files to edit:

- `scripts/ci-local.sh`

### Step 5 — Generator completeness (P1)

Files to edit:

- `generators/service/generator.ts`
- `generators/service/files/**`
- `tests/generators/**` and/or generator smoke tests

## Commands (verification checklist)

Run in this order while implementing:

1. `just copier-quick-validate`
2. `just copier-smoke-test`
3. `pnpm test:jest`
4. `uv run pytest -q`
5. `./scripts/ci-local.sh lint`
6. `./scripts/ci-local.sh test`
7. `just test-generation`

## Risks & Mitigations

- **Risk**: Template cleanup breaks assumptions in generated docs or ops workflows.
  - **Mitigation**: Add regression tests on template tree; run `just test-generation`.
- **Risk**: Changing smoke output location affects other tests/tools.
  - **Mitigation**: Update ignore patterns and keep one canonical fixture path.
- **Risk**: Generator changes introduce drift across templates vs generators.
  - **Mitigation**: Add generator smoke tests and keep generator docs updated.

## Acceptance Criteria

- `just copier-smoke-test` passes.
- `just test-generation` passes.
- `pnpm test:jest` passes in a repo that has run `just copier-regenerate-smoke`.
- `uv run pytest -q` passes without attempting to copy `node_modules/`.
- No template source contains plaintext `.env` files or docker build state.
