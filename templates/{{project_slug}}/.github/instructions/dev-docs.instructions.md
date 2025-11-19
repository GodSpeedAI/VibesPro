---
description: "Developer-centric docs guardrails"
applyTo: "docs/dev_*"
kind: instructions
domain: docs
precedence: 31
---

# Developer-Centric Docs Guardrails

- Treat developers as end-users and the dev environment as a product platform.
- When adding or updating developer docs:
    - Prefer task-based “how-to” and “playbook” structures.
    - Provide copy-pastable commands and minimal viable scaffolds.
    - Reference `DEV-PRD-xxx / DEV-ADR-xxx / DEV-SDS-xxx / DEV-TS-xxx` where relevant.
- If a developer guideline conflicts with ADR/SDS/TS, capture a Spec Gaps note and link to the PR proposing a resolution.
