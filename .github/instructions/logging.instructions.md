---
description: "Guardrails for Logfire + Vector logging pipeline"
applyTo: "**"
kind: instructions
domain: logging
precedence: 40
---

# Logfire Integration Guardrails

-   Keep `tools/vector/macros.vrl` and `tools/vector/traces_sanitize.vrl` in sync whenever you touch
    log sanitisation logic (DEV-SDS-005).
-   Route all Logfire OTLP attributes through `transforms.logs_logfire_normalize` so downstream sinks
    see canonical `trace_id`, `span_id`, `observation_id` fields (DEV-PRD-018).
-   Update documentation and template snippets together (`docs/observability/README.md`,
    `docs/ENVIRONMENT.md`, and `templates/{{project_slug}}/docs/observability/logging.md.j2`). Run
    `just docs-lint` to catch drift (DEV-PRD-021).
-   Regression commands for Logfire work: `bash tests/ops/test_vector_logfire.sh`, `just test-logs`,
    and `just docs-lint`. These must pass locally before finishing a change set.
