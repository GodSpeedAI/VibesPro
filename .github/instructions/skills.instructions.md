---
description: 'Define guidelines for designing and implementing agent skills.'
applyTo: '**/skills/**/SKILL.md'
metadata:
  id: ce.instr.skills
  tags: [validation, routing, context-min]
  inputs:
    files: [ce.manifest.jsonc, .github/ce/vocab.md]
    concepts: [progressive-disclosure]
    tools: []
  outputs:
    artifacts: []
    files: []
    actions: [standardize-skills]
  dependsOn:
    artifacts: [ce.doc.vocab]
    files: [.github/ce/vocab.md]
  related:
    artifacts: [ce.skill.validation]
    files: []
---

# Skill Authoring Instructions

Agent skills encapsulate specialised capabilities that can be composed together. To develop a new
skill:

1. **Follow the Agent Skills specification.** Each skill must reside in its own directory
   containing a `SKILL.md` file, optional `scripts/`, `references/` and `assets/` folders. The
   `SKILL.md` must include YAML front matter with a `name` and `description` and may include
   optional fields such as `license`, `compatibility` or `allowed-tools`.

2. **Leverage progressive disclosure.** Keep the `SKILL.md` body concise (ideally under 500
   lines) and defer extensive documentation, examples or scripts to the `references/` folder.
   Only load these resources when explicitly required to save context tokens【213465190888775†L602-L625】.

3. **Define IO explicitly.** In the `metadata` section, list what files, concepts and tools the
   skill requires (`inputs`) and what actions it performs or artifacts it produces
   (`outputs`). Declare any hard dependencies in `dependsOn` and soft links in `related`.
   Accurate IO declarations enable deterministic routing.

4. **Write actionable instructions.** The body of `SKILL.md` should provide clear,
   step‑by‑step guidance to the agent on how to use the skill. Include criteria for success,
   potential edge cases and how to handle errors.

5. **Avoid hidden side effects.** Skills should not mutate state outside of their declared
   outputs. For example, if a skill writes files, ensure it lists a corresponding action in
   `outputs` and that a validation task will run afterwards.

6. **Document references and scripts.** Any supporting files (e.g. example templates,
   configuration snippets or Python scripts) belong in the `references/` or `scripts/`
   subdirectories. Refer to them in the `SKILL.md` body so the agent knows when to load them.

Following these principles will yield modular, reusable skills that enhance the overall
capabilities of your AI agent ecosystem without causing context bloat or technical debt.
