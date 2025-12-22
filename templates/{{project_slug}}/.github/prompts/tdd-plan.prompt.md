---
kind: prompt
domain: tdd
task: plan
thread: tdd-plan
matrix_ids: []
budget: M
precedence: high
mode: 'agent'
model: GPT-5 mini
tools: ['codebase', 'search', 'runTests']
description: 'Produce a VibePro-aligned TDD implementation plan grounded in specs.'
---

# Prompt: tdd-plan

## Instructions

When this prompt is invoked under the `tdd-plan` chatmode:

1. **Read Inputs**
    - `docs/specs/adr.md`, `docs/specs/prd.md`, `docs/specs/sds.md`, `docs/specs/technical-specifications.md`, and `docs/specs/traceability-matrix.md`.
    - If any are missing, note them under _Phase 0 → Missing Inputs_.

2. **Generate Output**
    - Produce a full **VibePro-aligned TDD Implementation Plan**.
    - Follow the section order and formatting below.
    - Replace “generator creation” steps with **Generator Specification Plans** that conform to `GENERATOR_SPEC.md`.
    - Embed **MCP Assistance** notes within relevant tasks to indicate how `context7`, `ref`, and `exa` should be used.

3. **Execution Conventions**
    - All commands use VibePro’s workflow:
        - `just ai-context-bundle`
        - `pnpm nx <target> <project>`
        - `pnpm nx run-many -t test -p <projects>`
        - `just ai-validate`
    - Reference applicable `.github/instructions/*.instructions.md` for lint, test, and security policies.

---

## Output Template

### Phase 0 – Pre-Implementation Analysis

1. Dependency Graph (use mermaid)
2. Critical Path Identification
3. Parallelization Opportunities
4. MECE Validation Matrix
5. Environment Requirements (`Node`, `pnpm`, `Nx`, test frameworks)
6. Risk Assessment
7. Missing Inputs

### Phase Overview Matrix

| Phase | Duration | Parallel Agents | Nx Projects | Dependencies | Critical Path | MVP |
| ----- | -------- | --------------- | ----------- | ------------ | ------------- | --- |

### Detailed Task Breakdown

For each task include:

````markdown
#### ☐ TASK-XXX: <Title>

**Nx Ownership**: <apps/_ | libs/_ | tools/_ | generators/_>
**Traceability**: ADR-###, PRD-###, SDS-###
**Generator Specification**: yes/no (if yes, reference `GENERATOR_SPEC.md`)
**MCP Assistance**:

- context7 → contextual grounding
- ref → code structure & MECE validation
- exa → external standards/examples

**TDD Phases**

- 🔴 RED: tests that must fail first
- 🟢 GREEN: minimal implementation to pass
- 🔵 REFACTOR: cleanups while keeping green
- 🔄 REGRESSION: full Nx test suite + validation

**Commands**

```bash
just ai-context-bundle
pnpm nx test <project>
pnpm nx build <project>
just ai-validate
```
````

## Deliverables: code/tests, generator spec (if applicable), updated docs/ADRs.

### Phase Completion Protocol

1. Individual verification (tests, coverage, lint, typecheck)
2. Cross-review (15-30 min)
3. Merge to phase branch (longest-task first)
4. Integration tests (`pnpm nx run-many -t test -p <phase-projects>`)
5. `just ai-validate` → CI green

### Plan Footer

- Always prefer **generator specifications** over ad-hoc coding.
- Begin every phase with **context bundling**.
- Apply MCP tools (`context7`, `ref`, `exa`) at appropriate steps.
- End every phase with **`just ai-validate`** for CI parity.
