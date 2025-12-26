---
kind: prompt
domain: spec
task: create-sds
thread: vibepro-sds
matrix_ids: []
budget: M
mode: agent
model: GPT-5 mini
tools: ['codebase', 'search', 'runCommands']
description: Create a Software Design Specification using VibesPro format
---

# /vibepro.sds — Create Software Design Specification

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding.

## Workflow

### 1. Context Detection

Check for existing PRD:

- If user references a PRD ID (e.g., "for PRD-042"), load that PRD first
- If no PRD reference, detect bounded context from description

Determine:

- **Bounded context**: auth, orders, payments, observability, or features
- **Feature slug**: 2-4 word kebab-case name

### 2. ID Assignment

1. Scan `docs/specs/shared/reference/009-traceability-matrix.md` for highest SDS-NNN
2. Assign next sequential: `SDS-{max + 1}`
3. Link to parent PRD if applicable

### 3. Path Determination

Create file at: `docs/specs/<bounded-context>/<feature>/sds.md`

### 4. Generate SDS

Use the template structure from `.github/prompts/spec.plan.sds.prompt.md`:

**Required sections:**

- SDS Header (with assigned ID, linked PRD/ADR)
- System Overview
- Component Design
- Data Architecture
- API Design
- Security Design
- Implementation Roadmap

**Guidelines:**

- Focus on HOW the system works
- Write for developers and architects
- Include concrete technical decisions
- Reference hexagonal architecture patterns
- Align with VibesPro's tech stack conventions

### 5. Technical Depth

For each component, document:

- Purpose and responsibilities
- Interfaces and contracts
- Dependencies (internal and external)
- Configuration requirements
- Error handling approach

### 6. Output

Write to: `docs/specs/<context>/<feature>/sds.md`

Report:

- SDS ID assigned
- Parent PRD (if applicable)
- File path
- Bounded context
- Next steps (recommend `/vibepro.tasks` for implementation)

---

## Template Reference

Use section structure from: [spec.plan.sds.prompt.md](file:///.github/prompts/spec.plan.sds.prompt.md)

## Constitution Reference

Follow principles in: [sdd_constitution.instructions.md](file:///.github/instructions/sdd_constitution.instructions.md)

## Architecture Reference

Follow patterns in: [ARCHITECTURE.md](file:///ARCHITECTURE.md) and [hexagonal-architecture.instructions.md](file:///.github/instructions/hexagonal-architecture.instructions.md)
