---
agent: 'agent'
description: 'Implement a single step from the plan and produce the corresponding code changes.'
tools: ['toolset:write']
metadata:
  id: ce.prompt.implement-step
  tags: [execution, testing, validation]
  inputs:
    files: [PLAN.md, ARCHITECTURE.md, CONTRIBUTING.md]
    concepts: [small-diffs]
    tools: [toolset:write]
  outputs:
    artifacts: [ce.skill.implementation-guidance, ce.task.validate]
    files: []
    actions: [apply-changes]
  dependsOn:
    artifacts: [ce.task.validate]
    files: [.vscode/tasks.json]
  related:
    artifacts: [ce.prompt.write-tests, ce.prompt.review-changes]
    files: []
---

# Implement Step Prompt

Use this prompt when you are ready to implement a single, well‑defined step
from the approved implementation plan. This prompt helps ensure that changes
are small, testable and aligned with the architecture and contribution
guidelines.

1. Ask the user to specify which plan file to use and the number or name of
   the step they want to implement. Load the plan and summarise the chosen
   task.

2. Review `ARCHITECTURE.md` and `CONTRIBUTING.md` to understand the
   architectural patterns, coding standards and processes relevant to this
   change. If any additional instructions files apply to the file types you
   will edit, load them as context.

3. Follow the `implementation-guidance` skill to break down the step into
   concrete coding actions. Apply test‑driven development (write or update
   tests first), then implement the minimal code to satisfy the tests.

4. Use the appropriate tool set (`toolset:write`) to edit files. Keep
   changes small and scoped to the task. Document your changes in clear
   commit messages and update any relevant documentation.

5. After implementing, run the `Context Kit: Validate` task to ensure
   everything is registered correctly and passes linting and tests. Do not
   consider the task complete until validation passes.

6. Summarise what was done, referencing the files changed and the tests
   updated or added. Handoff to the reviewer agent via the `/review-changes`
   prompt for a quality check.

This workflow enforces disciplined, incremental development and integrates
validation and review into the process.
