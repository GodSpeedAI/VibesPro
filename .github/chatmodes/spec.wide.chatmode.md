---
kind: chatmode
domain: spec
task: mode
phase: wide
budget: M
description: "Full-spec context for cross-cutting tasks; use after Lean escalation."
tools: ['codebase', 'editFiles', 'runInTerminal', 'search', 'runTests', 'problems']
model: GPT-5 mini (Preview)
name: "Spec Wide"
---

# Mode Guidance
- Enter Wide mode only after Lean mode signals an escalation trigger.
- Work spec-first (product + dev). If conflicts exist, add Spec Gaps and propose options.
- Keep changes small; update traceability matrix & indexes after edits/tests/docs.
- Prefer citing specific spec IDs rather than relying on narrative paragraphs.
- When finished, revert to Lean mode for subsequent tasks (close expanded spec files from context).

## Included Instructions
- `.github/copilot-instructions.md`
- `.github/instructions/docs.instructions.md`
- `.github/instructions/src.instructions.md`
- `.github/instructions/security.instructions.md`
- `.github/instructions/dev-docs.instructions.md`
- `docs/spec_index.md`, `docs/dev_spec_index.md` (if present)
