---
name: testing-strategy
description: 'Designs unit, integration and end-to-end testing strategies and implements tests for code changes.'
metadata:
  id: ce.skill.testing-strategy
  tags: [testing, validation, performance]
  inputs:
    files: [ARCHITECTURE.md, CONTRIBUTING.md]
    concepts: [test-pyramid]
    tools: [toolset:write]
  outputs:
    artifacts: [ce.task.validate]
    files: []
    actions: [apply-changes]
  dependsOn:
    artifacts: [ce.task.validate]
    files: [.vscode/tasks.json]
  related:
    artifacts: [ce.prompt.write-tests]
    files: []
---

# Testing Strategy Skill

This skill ensures that new features are accompanied by robust tests across the testing pyramid.

## Steps

1. **Review context.** Load `ARCHITECTURE.md` and `CONTRIBUTING.md` to understand the system
   architecture, critical paths and existing testing conventions.

2. **Plan test coverage.** Determine which layers of the testing pyramid apply:
   - **Unit tests** for individual functions or classes.
   - **Integration tests** for interactions between modules or services.
   - **End‑to‑end tests** for verifying user-facing workflows.

3. **Identify key scenarios.** For each requirement or plan step, outline the positive,
   negative and edge case scenarios that must be tested. Consider performance and security
   aspects where applicable.

4. **Select frameworks and tools.** Choose appropriate testing frameworks (e.g. pytest for
   Python, Jest for JS/TS) and any mocking or fixture libraries. Ensure tests can run in
   isolation and in CI.

5. **Write and organise tests.** Implement the tests following language-specific best
   practices. Place them in clearly named files and directories. Use descriptive test
   names and assertions.

6. **Run and iterate.** Execute the tests locally. Fix any failing tests or code issues.
   Ensure the entire suite passes quickly. Address flakiness or excessive coupling.

7. **Validate and summarise.** Run the validation task to ensure no structural issues were
   introduced. Summarise the new tests and their coverage. Highlight any remaining gaps for
   future work.

Embedding testing as a first-class activity guarantees reliability and facilitates confident
refactoring.
