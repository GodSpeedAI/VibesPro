---
agent: 'agent'
description: 'Prepare a release including versioning, changelog and deployment instructions.'
tools: ['toolset:exec']
metadata:
  id: ce.prompt.prepare-release
  tags: [reliability, contributing, validation]
  inputs:
    files: [CONTRIBUTING.md, ARCHITECTURE.md]
    concepts: [versioning]
    tools: [toolset:exec]
  outputs:
    artifacts: [ce.skill.release-and-ops, ce.task.validate]
    files: []
    actions: [run-task]
  dependsOn:
    artifacts: [ce.task.validate]
    files: [.vscode/tasks.json]
  related:
    artifacts: []
    files: []
---

# Prepare Release Prompt

Use this prompt to coordinate the release process once implementation and
testing are complete. A good release not only bundles the finished features
but also documents changes, updates versioning and provides operations
guidance.

1. Summarise the changes slated for release by reviewing the implementation
   plan, merged pull requests and changelog. Confirm with the user that the
   release scope is final.

2. Review `CONTRIBUTING.md` and `ARCHITECTURE.md` for release and deployment
   guidelines. Note any environment‐specific considerations or compliance
   requirements.

3. Use the `release-and-ops` skill to perform the following tasks:
   - **Versioning**: Determine the next semantic version. Update the
     package/project version as appropriate.
   - **Changelog**: Generate or update the `CHANGELOG.md` to list new
     features, bug fixes and breaking changes.
   - **Testing**: Run the full test suite one last time by executing
     `Context Kit: Validate` to ensure nothing has regressed.
   - **Deployment instructions**: Draft clear instructions for deploying the
     new release, including any infrastructure changes, environment
     variables or migration steps.

4. Ask the user or release manager to review the release notes and deployment
   instructions. Iterate until approved.

5. Hand off to the operations or DevOps team (or relevant agent) to execute
   deployment. Include any runbooks or rollback strategies.

Following a consistent release process helps maintain reliability and keeps
operations smooth.
