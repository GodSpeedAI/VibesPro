---
agent: 'agent'
description: 'Add a new artifact to the context kit and register it in the manifest.'
tools: ['toolset:write']
metadata:
  id: ce.prompt.add-artifact
  tags: [routing, validation, context-min]
  inputs:
    files: [ce.manifest.jsonc, .github/ce/vocab.md]
    concepts: [id-conventions]
    tools: [toolset:write]
  outputs:
    artifacts: [ce.skill.artifact-registry]
    files: []
    actions: [create-artifact]
  dependsOn:
    artifacts: [ce.skill.artifact-registry, ce.task.validate]
    files: [.vscode/tasks.json]
  related:
    artifacts: [ce.prompt.debug-routing]
    files: []
---

# Add Artifact Prompt

This prompt guides you through creating a new context‑engineering artifact (such
as a prompt, instruction file, agent, skill, toolset or task) and registering
it in the manifest. Use this when you want to extend the kit in strict mode.

1. Ask the user for the type of artifact they want to create (doc, agent,
   prompt, instruction, skill, toolset or task) and a concise, hyphen‑separated
   identifier. Explain that IDs must be unique and stable.

2. Request a short description of the artifact’s purpose and when it should be
   used. Encourage the user to think in terms of MECE categories and to assign
   between two and five tags from the controlled vocabulary defined in
   `.github/ce/vocab.md`.

3. Gather the list of input files, concepts and tools the artifact will depend on,
   plus the list of outputs (what files or actions it produces or influences).

4. Once the information is collected, call the `artifact-registry` skill.
   The skill will scaffold the file with appropriate frontmatter, update
   `ce.manifest.jsonc`, and run the `Context Kit: Validate` task. Provide
   immediate feedback about success or any validation errors.

5. If validation fails, explain the failure and prompt the user to revise
   the inputs or description. Otherwise, summarise the created artifact’s
   location and ID for future reference.

Use this prompt instead of manually editing files to avoid technical debt and
ensure strict‑mode compliance.
