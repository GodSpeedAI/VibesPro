---
agent: 'agent'
description: 'Propose an architecture decision record (ADR) for a design question.'
tools: ['toolset:read']
metadata:
  id: ce.prompt.propose-adr
  tags: [architecture, planning, context-min]
  inputs:
    files: [ARCHITECTURE.md]
    concepts: [tradeoffs]
    tools: [toolset:read]
  outputs:
    artifacts: [ce.skill.architecture-decisioning]
    files: []
    actions: [propose-decision]
  dependsOn:
    artifacts: [ce.skill.architecture-decisioning]
    files: []
  related:
    artifacts: [ce.prompt.review-changes]
    files: []
---

# Propose ADR Prompt

When a design decision arises, use this prompt to create an Architecture
Decision Record (ADR) that documents the context, options, decision and
consequences. An ADR makes architectural reasoning explicit and helps future
developers understand why a particular approach was chosen.

1. Ask the user to describe the decision that needs to be made, including
   context such as goals, constraints, and any relevant history. Capture the
   problem statement clearly.

2. Identify at least two viable options. For each option, articulate the
   approach, the benefits and drawbacks, and the implications for the
   architecture. Consider factors such as performance, scalability,
   maintainability, security and developer experience.

3. Recommend one option. Explain why it best meets the project’s goals and
   constraints. Highlight any trade‑offs or mitigations for the downsides of
   your chosen option.

4. Document the decision in the ADR format:
   - **Title and status** (e.g. Accepted, Proposed).
   - **Context**: Describe the problem and relevant background.
   - **Decision**: Record which option was chosen and why.
   - **Consequences**: Explain the impact, including any follow‑up actions.

5. Ask the user or team to review the ADR. Revise based on feedback and then
   merge it into the `ARCHITECTURE.md` or keep it as a separate file (for
   example `adr-001.md`) with a link from the architecture document.

Creating ADRs ensures that architectural reasoning is transparent and
maintained alongside the codebase.
