---
kind: prompt
domain: tool
task: sync
thread: tool-techstack-sync
matrix_ids: []
budget: M
mode: "agent"
model: GPT-5 mini
tools: ["codebase", "search"]
description: "Review techstack.yaml + specs; output idempotent plan to sync Copier defaults and generators."
---

# Sync Tech Stack with Specs → Template

## Inputs

- Tech stack: `./techstack.yaml`
- Specs: `./docs/dev_prd.md`, `./docs/dev_sds.md`, `./docs/dev_adr.md`, `./docs/dev_technical-specifications.md` (if present)

## Guardrails

- Apply `.github/instructions/security.instructions.md`, `performance.instructions.md`, and `general.instructions.md`.
- Do not modify `.vscode/` automatically. No auto-approve.
- Idempotent outputs only; deterministic content; avoid timestamps.

## Task

1. Validate `techstack.yaml` against `docs/techstack.schema.json` (permissive schema).
2. Reconcile conflicts with PRD/SDS/ADR/TS; list minimal deltas to either specs or techstack.
3. Produce a plan with:
   - Proposed edits to `templates/{{ project_slug }}/generators/**` defaults (non-destructive; generated regions only).
   - Any new files or configs required to reflect the stack (document only; do not auto-apply).
4. Provide the command sequence to run locally:
   - `just plan-techstack` (review diff)
   - `just sync-techstack` (apply resolved stack)

## Output

- A concise, copy-ready plan and diffs.
- Risks/Mitigations section (security/perf/UX) with spec ID references where applicable.
