---
kind: prompt
domain: general
task: write-tests
thread: write-tests
matrix_ids: []
budget: M
mode: agent
description: 'Generate or update tests for a given feature or module.'
tools: ['toolset:write']
metadata:
  id: ce.prompt.write-tests
  tags: [testing, validation, performance]
  inputs:
    files: [ARCHITECTURE.md, CONTRIBUTING.md]
    concepts: [test-pyramid]
    tools: [toolset:write]
  outputs:
    artifacts: [ce.skill.testing-strategy, ce.task.validate]
    files: []
    actions: [apply-changes]
  dependsOn:
    artifacts: [ce.task.validate]
    files: [.vscode/tasks.json]
  related:
    artifacts: [ce.prompt.review-changes]
    files: []
---

kind: prompt
domain: general
task: write-tests
thread: write-tests
matrix_ids: []
budget: M

# Write Tests Prompt

Use this prompt to design and implement tests for a feature or module. Good
testing ensures reliability, prevents regressions and documents expected
behaviour.

1. Ask the user to specify which feature, function or module requires tests.
   Load relevant code and the approved plan or design to understand the
   expected behaviour.

2. Review `ARCHITECTURE.md` and `CONTRIBUTING.md` for testing guidelines. If
   your project uses a specific testing framework (e.g. pytest, Jest), note
   any conventions or file naming patterns.

3. Use the `testing-strategy` skill to determine the appropriate level of
   testing: unit, integration and/or end‑to‑end. Aim for a balanced
   test‑pyramid structure. Consider edge cases, error handling and security
   boundaries.

4. Write or update test files using the `toolset:write` tools. For each test,
   clearly state the scenario, the expected behaviour and how to run the
   test. Use fixtures or factories where appropriate to avoid duplicated
   setup code.

5. After writing tests, run the `Context Kit: Validate` task to execute
   linters and test suites. Fix any failing tests or style violations before
   requesting a review.

6. Summarise the tests you added or modified and hand off to the reviewer
   using the `/review-changes` prompt.

Writing robust tests up front improves confidence in your code and
accelerates future development.
