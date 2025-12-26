---
name: validation
description: 'Runs validation checks and gating tasks to ensure artifacts meet strict-mode requirements and quality standards.'
metadata:
  id: ce.skill.validation
  tags: [validation, tasks]
  inputs:
    files: [ce.manifest.jsonc]
    concepts: [strict-mode]
    tools: [toolset:exec]
  outputs:
    artifacts: [ce.task.validate]
    files: []
    actions: [run-task]
  dependsOn:
    artifacts: [ce.task.validate]
    files: [.vscode/tasks.json]
  related:
    artifacts: [ce.doc.manifest-schema]
    files: []
---

# Validation Skill

Use this skill to run quality gates and structural checks across the kit. It ensures that all
artifacts comply with the manifest schema, naming conventions and dependency rules.

## Steps

1. **Load the manifest.** Read `ce.manifest.jsonc` and strip JSONC comments. Confirm it
   contains required top‑level fields (`version`, `mode`, `artifacts`).

2. **Run the validation script.** Invoke the `Context Kit: Validate` task defined in
   `.vscode/tasks.json`, which runs the Python script
   `.github/skills/validation/scripts/validate_manifest.py`. This script checks id uniqueness,
   tag validity, file existence and dependency closure. Review its output for errors.

3. **Report results.** Summarise whether the manifest passed validation. If errors are
   detected, provide the file and line numbers if possible and suggest how to fix the issues
   (e.g. add missing files, correct tag typos, register new artifacts).

4. **Repeat after changes.** When adding or modifying artifacts, always run this skill before
   merging changes to ensure the repository remains consistent and free from technical debt.

By automating validation, this skill enforces strict mode and reduces the risk of subtle
misconfigurations.
