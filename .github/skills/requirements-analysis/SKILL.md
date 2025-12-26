---
name: requirements-analysis
description: 'Extracts structured requirements, acceptance criteria and risks from user requests and existing product documentation.'
metadata:
  id: ce.skill.requirements-analysis
  tags: [planning, product, context-min]
  inputs:
    files: [PRODUCT.md]
    concepts: [requirements]
    tools: [toolset:read]
  outputs:
    artifacts: []
    files: []
    actions: [extract-requirements]
  dependsOn:
    artifacts: [ce.doc.product]
    files: [PRODUCT.md]
  related:
    artifacts: [ce.prompt.extract-requirements]
    files: []
---

# Requirements Analysis Skill

This skill captures and structures user needs. Use it at the start of a new feature or when
clarifying ambiguous requests.

## Steps

1. **Understand the request.** Ask the user to describe the desired feature or change in their
   own words. Probe for the problem being solved, who benefits and any constraints or
   assumptions.

2. **Review product context.** Load `PRODUCT.md` and identify relevant goals, personas and
   non‑goals. Use this context to anchor the requirements and avoid scope creep.

3. **Elicit missing details.** Pose concise questions to fill gaps in the problem description,
   such as expected input/output, performance targets, edge cases or regulatory constraints.

4. **Define acceptance criteria.** Translate the user’s needs into measurable acceptance
   criteria (e.g. “users can reset their password via email within 5 minutes”). Include edge
   cases and negative scenarios.

5. **Identify risks and dependencies.** Note any obvious risks (security, privacy, performance)
   and dependencies (other systems, APIs, skills). Capture these alongside the requirements.

6. **Summarise and confirm.** Present the structured requirements back to the user for
   confirmation. Adjust based on feedback until there is a shared understanding.

Capturing requirements thoroughly ensures subsequent planning, design and implementation phases
are aligned with the user’s intent and product strategy.
