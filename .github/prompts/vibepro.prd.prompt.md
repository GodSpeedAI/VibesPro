---
name: vibepro.prd
description: Create a Product Requirements Document using VibesPro format
mode: agent
model: GPT-5 mini
tools: ['codebase', 'search', 'runCommands']
---

# /vibepro.prd — Create Product Requirements Document

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding.

## Workflow

### 1. Context Detection

Analyze the user's description to determine:

- **Bounded context**: auth, orders, payments, observability, or features (default)
- **Feature slug**: 2-4 word kebab-case name

### 2. ID Assignment

1. Scan `docs/specs/shared/reference/009-traceability-matrix.md` for highest PRD-NNN
2. Assign next sequential: `PRD-{max + 1}`

### 3. Path Determination

Create directory: `docs/specs/<bounded-context>/<feature-slug>/`

### 4. Generate PRD

Use the template structure from `.github/prompts/spec.plan.prd.prompt.md`:

**Required sections:**

- PRD Header (with assigned ID)
- Executive Summary
- Problem Statement
- User Personas
- Functional Requirements (with acceptance criteria)
- Non-Functional Requirements
- User Stories
- Success Criteria & Metrics

**Guidelines:**

- Focus on WHAT and WHY, not HOW
- Write for business stakeholders
- Each requirement must be testable
- Use `[NEEDS CLARIFICATION: question]` for ambiguities (max 3)
- Do NOT include implementation details

### 5. Output

Write to: `docs/specs/<context>/<feature>/prd.md`

Report:

- PRD ID assigned
- File path
- Bounded context
- Next steps (recommend `/vibepro.sds` for technical design)

---

## Template Reference

Use section structure from: [spec.plan.prd.prompt.md](file:///.github/prompts/spec.plan.prd.prompt.md)

## Constitution Reference

Follow principles in: [sdd_constitution.instructions.md](file:///.github/instructions/sdd_constitution.instructions.md)
