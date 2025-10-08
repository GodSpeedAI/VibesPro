---
kind: prompt
domain: spec
task: implement
thread: spec-implement
matrix_ids: []
budget: M
mode: "agent"
model: GPT-5 mini
tools: ["codebase", "search", "runTests"]
description: "Implement a feature per PRD/ADR/SDS/TS with tests and traceability."
---

# Implement Feature (Spec- & DX-Driven)

## Inputs

- Product Feature IDs: {{ '{{PRD_IDS}}' }}
- Related architectural decisions: {{ '{{ADR_IDS}}' }}
- SDS/TS components: {{ '{{SDS_IDS}}' }} {{ '{{TS_IDS}}' }}
- Developer platform constraints (optional): {{ '{{DEV_IDS}}' }}

## Task

### 0. Check for Nx Generators (REQUIRED FIRST STEP)

**Before writing any code**, check if an Nx generator exists to scaffold this feature:

```bash
# List available generators
pnpm exec nx list

# Use generator via just recipe (recommended)
just ai-scaffold name=<generator>
```

**See `.github/instructions/generators-first.instructions.md` for complete workflow.**

Only proceed to manual implementation if no appropriate generator exists.

### 1. Plan Implementation

1. Plan edits with file list and impact radius.
2. Implement per SDS/TS boundaries and ADR constraints.
3. Add/extend tests and update CI gates per DEV specs.
4. Update traceability (e.g., `docs/traceability_matrix.md`) with PRD/ADR/SDS/TS/DEV IDs.

## Output

- Direct file edits.
- Short PR description with spec references.
