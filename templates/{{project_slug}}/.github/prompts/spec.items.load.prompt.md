---
kind: prompt
domain: spec
task: items
thread: spec-items-load
matrix_ids: []
budget: S
mode: 'agent'
model: GPT-5 mini
tools: ['codebase', 'search']
description: 'Load specific spec items using indexes and summarize constraints.'
---

# Load Spec Items (Selective)

## Inputs

- Product IDs: {{ '{{PRD_IDS}}' }} {{ '{{ADR_IDS}}' }} {{ '{{SDS_IDS}}' }} {{ '{{TS_IDS}}' }}
- Developer IDs (optional): {{ '{{DEV_IDS}}' }}

## Task

1. From `docs/spec_index.md` and `docs/dev_spec_index.md`, locate paths/anchors.
2. Open only those sections in their source files.
3. Summarize constraints & acceptance for each ID in ≤5 bullets.

## Output

- A consolidated brief per ID.
- List any missing/ambiguous details and propose where to look next.
