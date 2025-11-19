# ENVIRONMENT PRDs

<!-- matrix_ids: [] -->

## DEV-PRD-011 — Reproducible OS toolchain via Devbox (Layer II)

Description: As a developer, I want a reproducible OS-level toolchain so that builds and scripts behave identically across machines.

EARS: When I enter the project using a standard command, the system shall provide OS utilities (e.g., git, curl, jq, make, ffmpeg, postgresql-client) without host installation steps.

DX Metrics: “First successful build” on a fresh machine ≤ 10 minutes; zero host package installs documented.

Supported by: DEV-ADR-011, DEV-SDS-010

## DEV-PRD-012 — Single runtime manager across languages via mise (Layer III)

Description: As a developer, I want one tool to pin/install all language runtimes (Node, Python, Rust) so that PATH/version drift is eliminated.

EARS: Given .mise.toml, the system shall install and activate exact versions for Node, Python, and Rust in interactive shells and CI.

DX Metrics: Version mismatch incidents → 0; “runtime install” step ≤ 2 minutes on cached environments.

Supported by: DEV-ADR-012, DEV-ADR-014, DEV-SDS-011

## DEV-PRD-014 — Tasks standardized via Just (Layer V)

Description: As a developer, I want all common actions available via just so that the app can be driven identically in local and CI environments.

EARS: When I run just <task>, the system shall execute within the provisioned environment (Devbox OS tools + mise runtimes + secrets already available).

DX Metrics: Top 10 tasks executable with a single command; median task startup ≤ 2s.

Supported by: DEV-ADR-011, DEV-ADR-012, DEV-SDS-013

## DEV-PRD-015 — Minimal CI without direnv

Description: As a release engineer, I want CI to run with the same versions and tools as local, without relying on direnv.

EARS: In CI, the system shall (a) load OS tools, (b) activate mise runtimes, and (c) decrypt SOPS secrets via CI key/KMS, then run just tasks.

DX Metrics: CI setup time ≤ 60s on warm cache; secret materialization only in job scope; 100% auditability of versions.

Supported by: DEV-ADR-011, DEV-ADR-012, DEV-ADR-013, DEV-SDS-014

## DEV-PRD-016 — Volta coexistence & deprecation guard (Node)

Description: As a developer, I want explicit behavior when both Volta and mise are present so that Node tool resolution is deterministic.

EARS: When Volta config exists, the system shall (a) prefer mise as authoritative, (b) verify Volta pins match mise, and (c) warn/fail on divergence.

DX Metrics: Divergent Node versions detected early (preflight) 100% of time; Volta removal completed within two minor releases.

Supported by: DEV-ADR-014, DEV-SDS-015

## DEV-PRD-027 — Supabase Dev Stack Automation

- Description: As a developer, I want a one-command Supabase stack so that local environments mirror production quickly.
- EARS: When I run `nx run tools-supabase:supabase-devstack:start`, the stack shall start using generated environment files, and matching `stop|reset|status` targets shall behave consistently.
- DX Metrics: First-time setup < 5 minutes; integration smoke tests rely on the same targets.
- Supported by: DEV-ADR-026, DEV-SDS-026

---

## DEV-PRD-028 — Nx Upgrade Quality Gate

- Description: As a maintainer, I want a documented Nx upgrade pipeline so that template and generated projects stay current without regressions.
- EARS: During scheduled upgrade windows, the system shall run `nx migrate`, update plugins, regenerate types, and execute lint/test/typecheck/generator smoke suites before merge.
- DX Metrics: Upgrades ship within two weeks of an Nx release; rollback steps documented for every upgrade.
- Supported by: DEV-ADR-027, DEV-SDS-027

---
