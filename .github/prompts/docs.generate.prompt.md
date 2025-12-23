---
kind: prompt
domain: docs
task: generate
thread: docs-generate
matrix_ids: [DEV-PRD-007]
budget: M
mode: 'agent'
model: GPT-5 mini
tools: ['codebase', 'search']
description: 'Generate AI guidance docs from product and developer specs.'
---

# Generate AI Guidance Docs from Product & Developer Specs

## Read First

- Product specs (if present):
  - `docs/PRD.md`, `docs/ADR.md`, `docs/SDS.md`,
  - `docs/technical_specifications.md` (or `docs/technical_specifictions.md` if present)
- Developer specs:
  - `docs/dev_prd.md`, `docs/dev_adr.md`, `docs/dev_sds.md`, `docs/dev_technical-specifications.md`

## Task

Create/update four spec-aligned docs in `docs/`:

1. `ai_custom_instructions.md`
   - Project-specific rules (style, architecture, naming, data models).
   - Security/compliance from TS/SDS/DEV-TS.
   - Include both product (PRD/ADR/SDS/TS) and developer (DEV-PRD/DEV-ADR/DEV-SDS/DEV-TS) citations for each bullet.

2. `ai_prompt_library.md`
   - Reusable prompts for scaffolding, core features, data/API, integration & testing.
   - Each prompt lists relevant spec IDs (product + dev).

3. `ai_implementation_roadmap.md`
   - Phased plan + dependencies (SDS/TS), MVP path (PRD).
   - Include DX enablement phases derived from DEV specs.
   - Validation checkpoints tie to PRD acceptance and DEV readiness criteria.

4. `ai_coding_standards.md`
   - Organization patterns (SDS/TS), API standards, error handling.
   - Testing and documentation standards with traceability.
   - Include DX standards (branching, commit semantics, test gates, lint, type-check).

## Output Rules

- Write files directly to `docs/`.
- Use clear headers, numbered lists, and small code examples.
- Maintain the Traceability Matrix in `ai_implementation_roadmap.md`.
- If specs are ambiguous or conflict, add a Spec Gaps section with options.

## Acceptance Criteria

- Every section cites at least one product and/or dev spec ID.
- Roadmap marks MVP and DX enablement clearly.
- Prompt library is copy/paste ready.
