---
applyTo: '**/*.md,**/docs/specs/**/*'
precedence: 22
---

# SDD Constitution — Spec-Driven Development Principles

This instruction file establishes the constitutional principles for Spec-Driven Development (SDD) workflows in VibesPro. These principles govern how specifications are authored, planned, and implemented.

## Core Articles

### Article I: Specification Sovereignty

Specifications are the **primary artifact**. Code is its expression in a particular language and framework.

- All feature work begins with a specification in `docs/specs/<bounded-context>/<feature>/`
- Specifications define **WHAT** and **WHY**, never **HOW**
- Implementation plans derive from specifications, not the reverse
- Maintaining software means evolving specifications

### Article II: Intent-Driven Development

The lingua franca of development is natural language expressing intent.

- User prompts capture business value and user outcomes
- Technical decisions are recorded in implementation plans, not specs
- Acceptance criteria are measurable and technology-agnostic
- Success is defined by user-facing outcomes

### Article III: Template-Driven Quality

Templates constrain AI output toward higher-quality specifications.

- Use `libs/tools/spec-kit/templates/spec-template.md` for feature specs
- Use `libs/tools/spec-kit/templates/plan-template.md` for implementation plans
- Use `libs/tools/spec-kit/templates/tasks-template.md` for task breakdowns
- Mark ambiguities with `[NEEDS CLARIFICATION: specific question]` (max 3)

### Article IV: Generator-First Implementation

Check for existing Nx generators before manual implementation.

- Run `pnpm exec nx list` to discover available generators
- Use `just ai-scaffold` for standard scaffolding
- Domain entities use hexagonal architecture patterns
- All generated code follows VibesPro conventions

### Article V: Test-First Imperative

No implementation without tests. This is non-negotiable.

- Unit tests define behavior before implementation
- Acceptance scenarios become integration tests
- Use ShellSpec for CLI/script testing
- Contract tests validate API boundaries

### Article VI: Traceability

All artifacts trace back to specifications.

- Commits reference spec IDs: `feat(auth): add login [PRD-042]`
- Generated specs receive auto-assigned IDs (PRD-NNN, SDS-NNN)
- Update `docs/specs/shared/reference/009-traceability-matrix.md`
- ADRs document architectural decisions with rationale

### Article VII: Simplicity

Start simple. Add complexity only when proven necessary.

- Maximum 3 projects for initial implementation
- No speculative "might need" features
- Use framework features directly—avoid wrapping
- Single model representation when possible

### Article VIII: Progressive Disclosure

Reveal complexity incrementally.

- `/vibepro.specify` captures high-level requirements
- `/vibepro.clarify` resolves ambiguities (optional)
- `/vibepro.plan` adds technical decisions
- `/vibepro.tasks` creates actionable work items
- `/vibepro.implement` executes the plan

### Article IX: Bounded Context Organization

Specifications are organized by domain.

Path pattern: `docs/specs/<bounded-context>/<feature>/`

Examples:

- `docs/specs/auth/user-registration/spec.md`
- `docs/specs/orders/checkout-flow/spec.md`
- `docs/specs/observability/trace-export/spec.md`

## Workflow Summary

```
User Intent → /vibepro.specify → Specification
                     ↓
              /vibepro.clarify (optional)
                     ↓
              /vibepro.plan → Implementation Plan
                     ↓
              /vibepro.tasks → Task Breakdown
                     ↓
              /vibepro.implement → Working Code
```

## Anti-Patterns

- ❌ Writing code before specification
- ❌ Including implementation details in specs
- ❌ Skipping clarification when ambiguities exist
- ❌ More than 3 `[NEEDS CLARIFICATION]` markers
- ❌ Specs not traceable to PRD/SDS IDs
- ❌ Manual scaffolding when generators exist
