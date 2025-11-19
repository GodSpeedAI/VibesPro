---
description: "Docs guardrails for product/developer specifications"
applyTo: "docs/**"
kind: instructions
domain: docs
precedence: 30
---

# Documentation Guardrails (Docs-only)

- Preserve headings and anchors in developer docs in this repo: `docs/dev_prd.md`, `docs/dev_adr.md`, `docs/dev_sds.md`, `docs/dev_technical-specifications.md`.
- If working with product-facing PRD/ADR/SDS/TS that live in another repo (e.g., `devkit/docs`), link to the source and add a short Spec Gaps note locally with resolution options.
- When generating or updating docs:
    - Use numbered sections, concise bullet lists, and code fences for commands.
    - Cross-reference exact spec IDs, e.g., `PRD-012`, `ADR-004`, `SDS-031`, `DEV-PRD-007`.
    - Add a Traceability section mapping spec IDs → artifacts (files, tests, APIs).
