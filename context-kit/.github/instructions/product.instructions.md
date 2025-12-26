---
description: 'Ensure features and plans align with the product vision and goals.'
applyTo: '**/PLAN*.md'
metadata:
  id: ce.instr.product
  tags: [product, planning]
  inputs:
    files: [PRODUCT.md]
    concepts: []
    tools: []
  outputs:
    artifacts: []
    files: []
    actions: [align-to-product]
  dependsOn:
    artifacts: [ce.doc.product]
    files: [PRODUCT.md]
  related:
    artifacts: [ce.prompt.extract-requirements, ce.prompt.create-plan]
    files: []
---

# Product Instructions

These instructions apply when creating or modifying implementation plans and
features. Their purpose is to ensure that every change aligns with the
product’s goals, value proposition and user expectations.

- **Know the vision**: Before outlining a plan or implementing a feature,
  review `PRODUCT.md` for the product vision, goals and non‑goals. Ensure
  the proposed work directly supports these goals.

- **Avoid scope creep**: Reject or defer requests that fall outside the
  documented product scope. Suggest that the user update the product
  roadmap before proceeding.

- **Define user value**: For each planned task or feature, articulate the
  benefit to the end user. If the value is unclear, ask the user to
  clarify the outcome they expect.

- **Assess impact**: Consider how the proposed change interacts with
  existing features and whether it could introduce regressions or
  unintended behaviour. Plan accordingly.

- **Document decisions**: When a feature deviates from the original
  product goals, add an explanation to the plan and propose updates to
  `PRODUCT.md` to maintain alignment.

These instructions keep the project focused on delivering meaningful
functionality that matches the product vision.
