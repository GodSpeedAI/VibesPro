---
description: "Source code guardrails"
applyTo: "src/**"
kind: instructions
domain: src
precedence: 32
---

# Code Guardrails (Source-only)

- Align implementations with `docs/dev_sds.md` and `docs/dev_technical-specifications.md` (layering, boundaries, error handling).
- For each new module/class/function:
  - Include a brief header comment with `Implements: PRD-xxx / ADR-xxx / SDS-xxx / DEV-TS-xxx` when applicable.
  - Add or extend tests in `tests/` following repo testing instructions.
- On changes, update traceability via existing matrix tooling (see `docs/traceability_matrix.md`).
