# S.W.O.R.D Rubric Compliance Checklist

This markdown test acts as the lightweight compliance artifact referenced by DEV-ADR-018, DEV-PRD-018, and `docs/dev_tdd_ai_guidance.md`. It ensures every delivery phase explicitly demonstrates progress across the S.W.O.R.D skills: **Safety**, **Workflow Observability**, **Reliability**, and **Developer Experience**.

## How to use

1. Update the table below during each pull request that contributes to the AI guidance fabric.
2. Attach the filled table as part of the PR description or automation output.
3. The CI workflow `ai-guidance.yml` parses this file to confirm no unchecked item remains when `--ci` mode is enabled.

| Skill                  | Description                                                     | Evidence Link                     | Status    |
| ---------------------- | --------------------------------------------------------------- | --------------------------------- | --------- |
| Safety                 | Data retention, opt-out honouring, and PII scrubbing validated. | _Add link to tests or docs_       | ☐ Pending |
| Workflow Observability | OTLP spans/metrics/logs wired and discoverable in dashboards.   | _Add link to traces or tooling_   | ☐ Pending |
| Reliability            | Deterministic tests, chaos-mode validation, and flake guards.   | _Add link to junit/honeycomb run_ | ☐ Pending |
| Developer Experience   | Updated docs, CLI UX notes, and release communication.          | _Add link to doc/CLI screenshot_  | ☐ Pending |

> Mark items as ✅ Completed once evidence is captured. CI should fail the run if any row remains `☐ Pending` when `--ci` flag is active.

---

**Traceability:** DEV-ADR-018 · DEV-PRD-018 · docs/dev_tdd_ai_guidance.md
