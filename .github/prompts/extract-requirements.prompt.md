---
kind: prompt
domain: general
task: extract-requirements
thread: extract-requirements
matrix_ids: []
budget: M
mode: agent
description: 'Extract structured requirements from a user description.'
tools: ['toolset:read']
metadata:
  id: ce.prompt.extract-requirements
  tags: [planning, product, context-min]
  inputs:
    files: [PRODUCT.md]
    concepts: [requirements]
    tools: [toolset:read]
  outputs:
    artifacts: [ce.skill.requirements-analysis]
    files: []
    actions: [extract-requirements]
  dependsOn:
    artifacts: [ce.skill.requirements-analysis]
    files: []
  related:
    artifacts: [ce.prompt.create-plan]
    files: [plan-template.md]
---

kind: prompt
domain: general
task: extract-requirements
thread: extract-requirements
matrix_ids: []
budget: M

# Extract Requirements Prompt

Use this prompt to convert an informal feature request or bug report into a set
of structured requirements and acceptance criteria. The goal is to capture
precise, actionable information before planning begins.

1. Start by asking the user to describe the feature, enhancement or problem in
   their own words. Encourage them to include any business goals, user
   personas or constraints.

2. Review `PRODUCT.md` to ensure your understanding aligns with the product
   vision. If the request appears out of scope, politely point this out and
   suggest updating the product roadmap first.

3. Ask up to three clarifying questions to fill in missing details. Focus on
   what the feature should do, who will use it, and what success looks like.

4. Synthesise the information into a list of requirements. For each
   requirement, specify:
   - A concise description of the behaviour or outcome.
   - Why this is important (the value).
   - Acceptance criteria that define when the requirement is met.
   - Any assumptions or dependencies.

5. Present the requirements back to the user and ask for confirmation or
   corrections. Only proceed to planning when the user approves.

By capturing clear requirements up front, you reduce misunderstandings and
enable the planner to produce a plan that meets the user’s needs.
