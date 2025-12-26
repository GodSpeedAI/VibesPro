---
description: 'Baseline writing and reasoning rules applied broadly across files.'
applyTo: '**/*'
metadata:
  id: ce.instr.general
  tags: [validation, context-min]
  inputs:
    files: [copilot_instructions.md]
    concepts: []
    tools: []
  outputs:
    artifacts: []
    files: []
    actions: [constrain-writing]
  dependsOn:
    artifacts: []
    files: [copilot_instructions.md]
  related:
    artifacts: []
    files: []
---

# General Instructions

These instructions apply to all operations in this workspace and provide
baseline guidelines to ensure clarity, quality and consistency. Follow these
rules unless more specific instructions override them.

- **Clarity and completeness**: Write responses and code that are clear and
  concise. Break complex tasks into numbered steps and explain the rationale
  behind decisions when it aids understanding.

- **Ask clarifying questions**: When user instructions are ambiguous or
  incomplete, ask succinct, targeted questions to remove uncertainty before
  proceeding. Making safe assumptions without asking should be the exception
  rather than the rule.

- **Respect context limitations**: Load only the files and information that
  the routing rules specify. Do not scan the entire repository; rely on the
  manifest and skills to provide necessary context.

- **Follow documented standards**: Adhere to the guidelines set out in
  `PRODUCT.md`, `ARCHITECTURE.md`, `CONTRIBUTING.md` and any applicable
  instructions files. If conflicts arise, flag them and suggest updates.

- **Enforce strict mode**: Do not create or modify files that are not
  registered in `ce.manifest.jsonc`. After any change, run the
  `Context Kit: Validate` task to ensure the manifest and project remain
  consistent.

- **Progressive disclosure**: When providing context to the AI, start with
  high‑level summaries and only load detailed sections or additional files
  when necessary【213465190888775†L602-L625】.

- **Security and privacy**: Never expose secrets, credentials or sensitive
  information. When handling data, follow the principle of least privilege
  and sanitise inputs and outputs.

These general rules help maintain a high standard of work and prevent
unintended side effects in the project.
