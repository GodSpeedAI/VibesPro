---
name: architecture-decisioning
description: Guides the creation and review of Architectural Decision Records (ADRs). Use this skill when a significant architectural change is proposed, a new technology is introduced, or a trade-off needs to be documented.
license: Complete terms in LICENSE.txt
---

# Architecture Decisioning

This skill guides the process of proposing, reviewing, and documenting architectural decisions via ADRs.

## Workflow

1.  **Identify Trigger**: Recognize when a decision warrants an ADR (e.g., new database, major refactor, new library).
2.  **Consult History**: Check `docs/specs/shared/adr/` and `just temporal-ai-query` for past decisions to ensure consistency.
3.  **Draft ADR**: Create a new ADR using the standard template:
    - **Title**: Clear and concise.
    - **Status**: Proposed.
    - **Context**: Why are we making this decision? What are the constraints?
    - **Decision**: What is being decided?
    - **Consequences**: Positive and negative impacts.
4.  **Review**: Validate the ADR against strategic principles (Invariants, Idempotency, Isomorphism).

## ADR Template Structure

```markdown
# [ADR-XXX] Title

**Status**: Proposed | Accepted | Rejected | Deprecated
**Date**: YYYY-MM-DD
**Authors**: [Names]

## Context

The issue motivating this decision...

## Decision

We will...

## Consequences

**Positive**:

- ...
  **Negative**:
- ...
```

## Strategic Alignment

Ensure the decision aligns with:

- **Hexagonal Architecture**: Does it respect layer boundaries?
- **Isomorphism**: Does it maintain structural alignment?
- **Safety**: Does it introduce security or type safety risks?
