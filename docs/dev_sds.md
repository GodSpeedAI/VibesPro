# Developer Software Design Specification (DX-first)

Audience: Developers as end-users
Scope: Design for discoverability, usability, and maintainability

---

## DEV-SDS-001 — Repository layout for discoverability (addresses DEV-PRD-001, DEV-PRD-007)
- Principle: Put the obvious things in obvious places.
- Design:
  - `.github/copilot-instructions.md` — repo-wide guidance.
  - `.github/instructions/*.instructions.md` — MECE components: security, performance, style, general, context.
  - `.github/prompts/*.prompt.md` — reusable prompt templates; frontmatter metadata.
  - `.github/chatmodes/*.chatmode.md` — 8 personas; synergy notes.
  - `.vscode/settings.json` — prompt/mode discovery locations; safe defaults.
  - `scripts/` — orchestration helpers; token metrics; A/B wrappers.
- DX Effect: Zero-hunt for files; predictable imports; fast onboarding.

## DEV-SDS-002 — Instruction stacking algorithm (addresses DEV-PRD-002, DEV-PRD-006)
- Contract: Ordered list of instruction files → concatenated with precedence.
- Rules:
  - Order: repo-wide → mode → prompt; later items may override earlier ones only where documented.
  - Pruning: remove duplicate headings/sections; cap tokens per stack via metrics.
- Error modes: Missing file, circular include, token overflow; provide clear messages.

## DEV-SDS-003 — Persona chat modes (addresses DEV-PRD-003)
- Structure: Frontmatter (name, description, tools, model) + body instructions + synergy section (links to security/perf/style instructions).
- UX: One-click selection; consistent output format; guidance for handoffs between roles.

## DEV-SDS-004 — Tasks orchestrator pattern (addresses DEV-PRD-004, DEV-PRD-010)
- Inputs: prompt file, variant flag, target selection (file/folder), metrics toggle.
- Outputs: logged token/latency; variant label.
- Behavior: Run prompt, collect metrics, optionally split traffic 50/50 for A/B.

## DEV-SDS-005 — Security defaults and trust (addresses DEV-PRD-005)
- Defaults: Disable chat.tools.autoApprove; honor workspace trust; prepend safety instructions.
- Validation: CI job verifies settings.json posture and presence of safety instructions in stacks.

## DEV-SDS-006 — Prompt-as-code lifecycle (addresses DEV-PRD-007)
- Stages: Edit → Lint → Plan (preview effective prompt) → Run (A/B) → Evaluate → Merge.
- Artifacts: Lint report, plan diff, metrics dashboard.

## DEV-SDS-007 — CALM/Wasp/Nx bridging (addresses DEV-PRD-008)
- Contract: Wasp-style spec drives features; CALM defines interfaces/controls; Nx generators output reversible services.
- Validation: CALM controls run pre-generation; fail fast on violations.

## DEV-SDS-008 — Declarative-first with hooks (addresses DEV-PRD-009)
- Design: Keep configuration declarative; expose hooks in tasks for retrieval, branching, and post-processing.
- Guardrails: Limit hook scope and sanitize inputs.

## DEV-SDS-009 — Evaluation hooks and token budgets (addresses DEV-PRD-010)
- Design: Token/latency logging always on when tasks run; optional quality/safety post-processing.
- Budgets: Per-mode budgets with warnings and hard caps; configurable thresholds.

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

Artifacts: .mise.toml, Justfile targets verify:*, docs updates.

## DEV-SDS-012 — Secrets with SOPS (local & CI) (addresses DEV-PRD-013, DEV-PRD-015)

Principle: Secrets at rest are always encrypted; decryption is ephemeral.

Design:

Local: .secrets.env.sops checked into Git (encrypted); developers run inside a shell that executes sops exec-env .secrets.env.sops <cmd> (via .envrc locally or manual wrapper).

CI (no direnv): Decrypt with CI-provided AGE key or KMS:

sops -d .secrets.env.sops > /tmp/ci.env && set -a && source /tmp/ci.env && set +a

Ensure /tmp/ci.env is removed post-job.

Error modes: Missing key, stale recipients, plaintext leakage. Pipeline fails closed with clear logs; pre-commit rule forbids .env commits.

Artifacts: .sops.yaml, .secrets.env.sops (encrypted), CI snippets.

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

Artifacts: .github/workflows/* snippets, CI docs.

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

## DEV-SDS-016 — Chezmoi optional bootstrap (addresses DEV-PRD-011/012)

Principle: Zero-friction first-run on fresh machines.

Design: Provide optional Chezmoi templates for shell hook order and a run_after that executes direnv allow for new .envrc files (local only).

Error modes: None in CI (not used). Local failures fall back to manual direnv allow.

Artifacts: Chezmoi templates (outside repo), docs pointer only.

---

## Documentation-as-code specs
- Markdown style: headers, lists, mermaid diagrams; frontmatter optional for metadata.
- Cross-references: Use relative links and DEV-PRD/ADR/SDS IDs.
- Linters: Markdown lint; link check; schema checks for frontmatter.

## API design for developer usability
- Human-first: function/task names describe intent; minimal required args; sensible defaults.
- Error handling: actionable messages; suggestions for remediation; link to docs.

## Code organization
- Feature-oriented structure for generators and scripts; shared utils for token metrics and plan diffs.
- Naming: kebab-case files, clear suffixes (.prompt.md, .instructions.md, .chatmode.md).
