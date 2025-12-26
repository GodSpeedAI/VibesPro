---
kind: prompt
domain: general
task: review-changes
thread: review-changes
matrix_ids: []
budget: M
mode: agent
description: 'Review code changes or documents for quality and compliance.'
tools: ['toolset:read', 'toolset:exec']
metadata:
  id: ce.prompt.review-changes
  tags: [review, validation, security]
  inputs:
    files: [ARCHITECTURE.md, CONTRIBUTING.md]
    concepts: [risk]
    tools: [toolset:read, toolset:exec]
  outputs:
    artifacts: [ce.skill.review-and-quality]
    files: []
    actions: [request-changes, approve]
  dependsOn:
    artifacts: [ce.task.validate]
    files: [.vscode/tasks.json]
  related:
    artifacts: [ce.agent.reviewer]
    files: []
---

kind: prompt
domain: general
task: review-changes
thread: review-changes
matrix_ids: []
budget: M

# Review Changes Prompt

Invoke this prompt to perform a comprehensive review of code changes,
implementation plans or documentation updates. The goal is to ensure that
proposed changes meet the project’s standards, are secure and do not
introduce regressions.

1. Ask the user to provide the diff, pull request URL or plan file to review.
   Load the relevant files and context.

2. Consult `ARCHITECTURE.md` and `CONTRIBUTING.md` to recall the design
   principles, coding standards and contribution process. Load any
   instructions files applicable to the file types under review.

3. Run the `Context Kit: Validate` task. This ensures that the manifest and
   other metadata remain consistent and that automated tests and linters
   still pass. Do not proceed if validation fails.

4. Apply the `review-and-quality` skill to assess:
   - **Correctness**: Does the change satisfy the plan and requirements?
   - **Readability and maintainability**: Is the code clear and modular?
   - **Security**: Are there vulnerabilities, secret leaks or injection risks?
   - **Performance**: Could the change introduce performance regressions?
   - **Compliance**: Does it adhere to licensing, accessibility or other
     policies?

5. Provide specific, actionable feedback. Use bullet points for each issue or
   suggestion. If the change is acceptable, explicitly approve it; otherwise
   request changes and explain why.

6. Summarise your review and hand off to the appropriate agent or user for
   fixes or merge. Include links to any relevant documentation or tasks.

Consistent, objective reviews are vital to maintaining a high‑quality codebase
and reducing technical debt.
