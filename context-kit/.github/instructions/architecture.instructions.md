---
description: 'Maintain architectural integrity and encourage decisions to be documented.'
applyTo: '**/ARCHITECTURE.md'
metadata:
  id: ce.instr.architecture
  tags: [architecture, validation]
  inputs:
    files: [ARCHITECTURE.md]
    concepts: []
    tools: []
  outputs:
    artifacts: []
    files: []
    actions: [prevent-arch-drift]
  dependsOn:
    artifacts: [ce.doc.architecture]
    files: [ARCHITECTURE.md]
  related:
    artifacts: [ce.prompt.propose-adr, ce.prompt.review-changes]
    files: []
---

# Architecture Instructions

These instructions apply to the architecture document and any tasks that
modify system design. Their purpose is to preserve architectural
consistency and to capture decisions for posterity.

- **Respect the design**: Before making structural changes or adding new
  components, review the current architecture in `ARCHITECTURE.md`. Assess
  whether the change is compatible with existing patterns and constraints.

- **Document decisions**: When making significant design choices, create an
  ADR via the `/propose-adr` prompt. Record context, options, the chosen
  solution and consequences. Link ADRs back to `ARCHITECTURE.md`.

- **Consider non‑functional requirements**: Evaluate the impact on
  performance, security, scalability, maintainability and operability.
  Mitigate risks or propose experiments before committing to untested
  designs.

- **Avoid architecture drift**: Do not merge changes that deviate from the
  documented architecture without an approved ADR. If current design
  constraints no longer fit, update `ARCHITECTURE.md` and seek consensus
  before implementation.

- **Use appropriate abstraction**: Encourage modular design, clear separation
  of concerns and adherence to established patterns (e.g. MVC, hexagonal,
  microservices) as described in the architecture document.

These rules ensure that the system remains coherent, scalable and easy to
understand as it evolves.
