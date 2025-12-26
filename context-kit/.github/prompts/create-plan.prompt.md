---
agent: 'agent'
description: 'Create a detailed implementation plan from a set of requirements.'
tools: ['toolset:read']
metadata:
  id: ce.prompt.create-plan
  tags: [planning, product, architecture]
  inputs:
    files: [PRODUCT.md, ARCHITECTURE.md, plan-template.md]
    concepts: [milestones]
    tools: [toolset:read]
  outputs:
    artifacts: [ce.skill.planning-and-slicing]
    files: [PLAN.md]
    actions: [produce-plan]
  dependsOn:
    artifacts: [ce.skill.planning-and-slicing]
    files: [plan-template.md]
  related:
    artifacts: [ce.agent.planner]
    files: []
---

# Create Plan Prompt

This prompt generates a structured implementation plan based on confirmed
requirements. Use it after you have gathered and agreed upon the feature
requirements.

1. Ensure that `PRODUCT.md` and `ARCHITECTURE.md` are loaded. Summarise the
   key objectives, constraints and design principles to provide context.

2. Ask the user to supply the confirmed requirements or reference a
   requirements document. Verify that the requirements have been approved.

3. Use the `plan-template.md` file as the skeleton for your plan. Fill in
   each section:
   - **Goals and requirements**: Summarise the features and acceptance criteria.
   - **Milestones and tasks**: Break down the work into discrete, ordered
     tasks with clear deliverables. Assign each task a priority or milestone.
   - **Architecture and design considerations**: Note any key design
     decisions, patterns or constraints relevant to the feature.
   - **Risks and open questions**: Identify uncertainties, dependencies or
     potential blockers.
   - **Acceptance criteria**: Restate the conditions under which the feature
     will be considered complete.

4. When breaking down tasks, ensure each task is small, testable and
   independent where possible. Use bullet lists or checklists for clarity.

5. Present the plan to the user for feedback. Ask whether any additional
   constraints, resources or timelines need to be incorporated. Iterate until
   the plan is approved.

6. When the plan is ready, save it to a new file (for example
   `<feature>-plan.md`) and reference it in the output. Hand off to the
   implementation workflow or planner agent as appropriate.

This prompt ensures that planning is structured, repeatable and aligned with
the project’s documentation, reducing rework during implementation.
