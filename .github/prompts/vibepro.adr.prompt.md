---
kind: prompt
domain: spec
task: create-adr
thread: vibepro-adr
matrix_ids: []
budget: M
mode: agent
model: GPT-5 mini
tools: ['codebase', 'search', 'runCommands']
description: Create an Architecture Decision Record using VibesPro format
---

# /vibepro.adr — Create Architecture Decision Record

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding.

## Workflow

### 1. Context Detection

Analyze the user's description to determine:

- **Decision domain**: core, security, observability, infrastructure, or architecture (default)
- **Decision slug**: 2-4 word kebab-case name describing the decision

### 2. ID Assignment

1. Scan `docs/specs/shared/reference/009-traceability-matrix.md` for highest ADR-NNN
2. Assign next sequential: `ADR-{max + 1}`

### 3. Path Determination

Create file at: `docs/specs/<domain>/<decision-slug>/adr.md`

Or if related to existing bounded context: `docs/specs/<bounded-context>/<feature>/adr-<topic>.md`

### 4. Generate ADR

Use the template structure from `.github/prompts/spec.plan.adr.prompt.md`:

**Required sections:**

- ADR Header (with assigned ID, status: Proposed)
- Context and Problem Statement
- Considered Options (minimum 2 options)
- Decision Outcome
- Consequences (positive and negative)

**Guidelines:**

- Focus on the architectural question being decided
- Document ALL seriously considered options
- Be explicit about trade-offs
- Link to related PRD if applicable
- Status should be "Proposed" initially

### 5. Options Analysis

For each option, document:

- Description of the approach
- Pros (concrete benefits)
- Cons (real drawbacks)
- Implementation complexity: Low/Medium/High
- Maintenance overhead: Low/Medium/High
- Scalability: Low/Medium/High

### 6. Output

Write to: `docs/specs/<domain>/<decision>/adr.md`

Report:

- ADR ID assigned
- File path
- Status: Proposed
- Next steps (team review and decision)

---

## Template Reference

Use section structure from: [spec.plan.adr.prompt.md](file:///.github/prompts/spec.plan.adr.prompt.md)

## Constitution Reference

Follow principles in: [sdd_constitution.instructions.md](file:///.github/instructions/sdd_constitution.instructions.md)
