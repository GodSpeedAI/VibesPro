# VibesPro Project State Report

## Repository Purpose & Architecture Overview

-   VibesPro is a Copier template that generates production-ready Nx monorepos; work happens in generated projects and changes must remain generator-first and spec-driven (`.github/copilot-instructions.md:3`, `.github/copilot-instructions.md:13`, `.github/copilot-instructions.md:25`).
-   Hexagonal layering (domain → application → infrastructure) is enforced in both guidance and template code, keeping business logic isolated (`.github/copilot-instructions.md:55`, `templates/{{project_slug}}/libs/core/domain/index.ts.j2:1`).
-   Product requirements prioritise modular instructions, persona chat modes, deterministic generators, and observability as core developer experience capabilities (`docs/dev_prd.md:9`, `docs/dev_prd.md:139`).
-   Design specs lock in the repository layout, generator-first workflows, reproducible environments, and the Rust→Vector→OpenObserve telemetry stack (`docs/dev_sds.md:8`, `docs/dev_sds.md:70`, `docs/dev_sds.md:187`).

## Tooling & Workflow Expectations

-   The layered environment (Devbox → mise → SOPS → Just → pnpm → uv) is required for local and CI parity (`docs/ENVIRONMENT.md:7`).
-   `just` orchestrates setup, builds, tests, and spec validation (`setup`, `spec-guard`, `test-nx`) to enforce the default quality gate (`justfile:8`, `justfile:96`, `justfile:156`).
-   Observability workflows rely on `just observe-*` commands and CI Vector validation to keep OTLP exports healthy (`docs/observability/README.md:63`, `docs/observability/README.md:125`, `justfile:709`).
-   Copier prompts control optional AI scaffolding and always run post-generation hooks to harmonize the generated project (`copier.yml:4`, `copier.yml:24`).

## Current Capabilities vs Intended Outcomes

| Area                     | Current Capability                                                                                                     | Target / Next Evolution                                                                                       | Evidence                                                                                                                |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Template scaffolding     | Templates ship domain/application/infrastructure libraries with sample entities and tests that enforce hex boundaries. | Continue extending features through generator-first workflows aligned with CALM/Nx specs.                     | `.github/copilot-instructions.md:55`, `templates/{{project_slug}}/libs/core/domain/index.ts.j2:1`, `docs/dev_prd.md:58` |
| Observability stack      | Rust `vibepro-observe` + Vector/OpenObserve pipeline shipped with multi-phase tests, commands, and docs.               | Sustain the pipeline by running observe commands and keeping Vector config validated in CI.                   | `CHANGELOG.md:15`, `docs/observability/README.md:13`, `justfile:709`                                                    |
| Logging / Logfire        | Logfire blueprint published with validation tasks and smoke tests, but instrumentation notes are deferred to Cycle 2A. | Complete Cycle 2A documentation and implementation for `bootstrap_logfire`, ensuring docs/tests stay in sync. | `templates/{{project_slug}}/docs/observability/logging.md.j2:5`, `docs/observability/README.md:850`, `justfile:739`     |
| Distributed AGENT system | Phase 1 AGENT routing across core directories is complete.                                                             | Phase 2 will add apps/libs/tests/generators coverage to the distributed guidance network.                     | `AGENT-SYSTEM.md:3`, `AGENT-SYSTEM.md:20`                                                                               |
| Generator guidance       | Generator spec template retains TODO placeholders instead of concrete guidance.                                        | Populate schema/options/tests sections so future generators start with consistent contracts.                  | `templates/{{project_slug}}/docs/specs/generators/GENERATOR_SPEC.md:16`                                                 |
| Python test coverage     | Pytest configuration excludes temporal and integration suites pending async fixture updates.                           | Restore excluded suites once fixtures are modernised to regain full regression coverage.                      | `pytest.ini:7`                                                                                                          |

## Outstanding Work, Defects, Ambiguities

### High Priority

-   Testing — Revisit the async fixture plan so `tests/temporal` and integration suites can be re-enabled rather than excluded via `pytest.ini` (`pytest.ini:7`).
-   Generators — Fill in the generator spec template so new Nx generators inherit clear schemas, rules, and acceptance checks (`templates/{{project_slug}}/docs/specs/generators/GENERATOR_SPEC.md:16`).

### Medium Priority

-   Observability — Deliver the Cycle 2A Logfire instrumentation updates and resolve the open documentation TODO to keep telemetry guidance consistent (`templates/{{project_slug}}/docs/observability/logging.md.j2:5`, `docs/observability/README.md:850`).
-   AI workflows — Replace the placeholder Copilot runner with a documented or automated integration path to avoid manual prompt execution gaps (`scripts/run_prompt.sh:27`).
-   Distributed guidance — Build the Phase 2 AGENT.md coverage for apps, libs, tests, and generators as planned (`AGENT-SYSTEM.md:20`).

### Low Priority

-   Tooling — Add the `just validate-agent-files` recipe so the distributed agent system has a verification hook (`AGENT-SYSTEM.md:127`).

## Recommended Next Actions

1. Update the async fixtures and remove the `norecursedirs` exclusions, then run `uv run pytest` (without the skips) to confirm temporal/integration suites pass (`pytest.ini:7`).
2. Populate the generator specification template with real schema/options/tests content and verify available generators via `pnpm exec nx list` before shipping new scaffolds (`templates/{{project_slug}}/docs/specs/generators/GENERATOR_SPEC.md:16`, `.github/copilot-instructions.md:25`).
3. Complete the Logfire instrumentation work: update docs, close the TODO, and run `just test-logs` plus `just docs-lint` to validate the pipeline (`templates/{{project_slug}}/docs/observability/logging.md.j2:5`, `docs/observability/README.md:850`, `justfile:739`).
4. Decide on a VS Code/Copilot integration plan (or explicit manual workflow) for `scripts/run_prompt.sh`, ensuring prompt execution remains under the existing spec-guard gate (`scripts/run_prompt.sh:27`, `justfile:96`).
