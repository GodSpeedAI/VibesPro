---
description: 'Provide standards for creating and maintaining prompt files.'
applyTo: '**/*.prompt.md'
metadata:
  id: ce.instr.prompts
  tags: [validation, routing]
  inputs:
    files: [ce.manifest.jsonc]
    concepts: [frontmatter]
    tools: []
  outputs:
    artifacts: []
    files: []
    actions: [standardize-prompts]
  dependsOn:
    artifacts: []
    files: [ce.manifest.jsonc]
  related:
    artifacts: [ce.skill.artifact-registry]
    files: []
---

# Prompt Writing Instructions

Prompt files drive deterministic workflows and should be carefully crafted. When creating
a new prompt:

1. **Front matter is required.** Include a `description` that succinctly explains the
   purpose of the prompt, an `agent` field set to `'agent'`, and optional `tools`
   and `model` fields【40083552726396†L409-L447】. Use the `metadata` section to
   assign a unique `id`, tags and define inputs/outputs and dependencies.

2. **Target a single intent.** Prompts should correspond to one high‑level verb such as
   “create plan”, “write tests” or “prepare release”. Avoid combining disparate tasks in one
   prompt. Use separate prompts so that routing remains unambiguous.

3. **Reference other files explicitly.** When the prompt needs context from a document
   (e.g. PRODUCT.md or plan-template.md), link it in the body using Markdown. This
   ensures the orchestrator loads the file into context.

4. **Constrain tool usage.** Specify which tool sets the prompt may call. Only include
   tools that are required for the task at hand. If no external tools are needed, omit the
   `tools` field.

5. **Write clear instructions.** In the body, outline step‑by‑step guidance for the agent.
   Describe what information to gather, how to structure responses and when to ask the user
   clarifying questions. Use bullet lists or numbered lists for clarity.

6. **Include a handoff or next action.** If the prompt produces an artifact that needs to be
   reviewed or executed, instruct the agent to hand off the result to the appropriate agent
   or to run the validation task.

7. **Keep it concise.** Avoid verbose explanations; the goal is to guide the agent, not to
   educate the user. Additional guidelines and examples can live in skill references or docs.

By following these rules, prompts remain predictable and easy to maintain, improving the
quality of generated outputs and reducing hallucination risk.
