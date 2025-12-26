---
description: 'Establish conventions for authoring custom agents and managing handoffs.'
applyTo: '**/*.agent.md'
metadata:
  id: ce.instr.agents
  tags: [validation, routing, tools]
  inputs:
    files: [AGENTS.md, ce.manifest.jsonc]
    concepts: [handoff]
    tools: []
  outputs:
    artifacts: []
    files: []
    actions: [standardize-agents]
  dependsOn:
    artifacts: [ce.doc.agents]
    files: [AGENTS.md]
  related:
    artifacts: [ce.agent.orchestrator]
    files: []
---

# Agent Authoring Instructions

Custom agents orchestrate workflows by delegating tasks, loading context and managing tools.
To create a new agent:

1. **Define clear responsibilities.** Each agent should have a well‑defined domain (e.g.
   planning, review). Use `AGENTS.md` to document the agent’s purpose, capabilities and when
   it should be invoked. Avoid overlapping responsibilities; instead use handoffs.

2. **Front matter essentials.** Provide a `description` summarising the agent’s role,
   a `tools` list referencing the appropriate tool sets, a `model` (choose based on desired
   capability and cost), and `metadata` including a unique `id`, tags and IO fields. Include a
   `handoffs` array describing deterministic transitions to other agents.

3. **Load minimal context.** Agents must consult `ce.manifest.jsonc` and use the
   `context-routing` skill to load only the documents, prompts or skills necessary for the
   current task, following progressive disclosure【213465190888775†L602-L625】.

4. **Enforce strict mode.** Never load or act upon files that are not registered in the
   manifest. If new capabilities are needed, instruct the user to use the `add-artifact`
   prompt and `artifact-registry` skill.

5. **Delegate effectively.** When a task requires detailed planning, review or domain
   expertise outside the agent’s remit, perform a handoff to the appropriate agent with a
   summary of context and next steps. Do not attempt to complete tasks outside your
   authority.

6. **Summarise actions.** Clearly communicate what context was loaded, which skill or prompt
   was invoked and what outputs were generated. This enhances traceability and debugging.

Adhering to these conventions ensures agents remain modular, auditable and easy to evolve.
