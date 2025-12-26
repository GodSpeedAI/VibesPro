---
description: 'Enforce contribution guidelines and quality standards across the project.'
applyTo: '**/*'
metadata:
  id: ce.instr.contributing
  tags: [contributing, validation]
  inputs:
    files: [CONTRIBUTING.md]
    concepts: []
    tools: []
  outputs:
    artifacts: []
    files: []
    actions: [enforce-process]
  dependsOn:
    artifacts: [ce.doc.contributing]
    files: [CONTRIBUTING.md]
  related:
    artifacts: [ce.skill.review-and-quality]
    files: []
---

# Contribution Instructions

These instructions apply whenever you contribute code, documentation or other assets to this
project. They ensure that all contributions are consistent, high quality and aligned with the
project’s goals.

1. **Read `CONTRIBUTING.md` first.** Understand the process for creating branches, writing
   commits and opening pull requests. Follow the mandated code review process and respect
   any checklists or gating requirements.

2. **Maintain quality and safety.** Always run the `Context Kit: Validate` task before
   committing. This ensures your changes comply with the manifest schema, naming conventions
   and tag vocabulary. Fix any issues reported by the validation script.

3. **Respect the strict mode.** Do not create new files or modify routing behaviour outside of
   the declared manifest. Use the `add-artifact` prompt and `artifact-registry` skill to
   register new prompts, agents, instructions or skills. Unregistered files will be ignored.

4. **Follow coding standards.** For source code, adhere to the language-specific style
   guides (e.g. PEP 8 for Python, ESLint + Prettier for JavaScript/TypeScript). Include
   meaningful docstrings or comments and write tests for new functionality. See
   `coding-standards.instructions.md` for details.

5. **Document your rationale.** When adding new features, update PRODUCT.md and/or
   ARCHITECTURE.md to explain the user value and architectural impact. When making
   architectural decisions, record them using the ADR pattern via the `propose-adr` prompt.

6. **Avoid technical debt.** Do not leave TODOs or stubbed functions. Complete features
   end‑to‑end, including tests and documentation. If a large feature must be split, capture the
   remaining work in the project planning documents and ensure the plan is clear.

By following these guidelines you help maintain a coherent, high-quality codebase and
facilitate smooth collaboration.
