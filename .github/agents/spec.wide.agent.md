---
kind: chatmode
domain: spec
task: mode
phase: wide
budget: M
description: "Full-spec context for cross-cutting tasks; use after Lean escalation."
tools: ["search", "edit", "runCommands", "search", "runTests", "problems"]
model: GPT-5 mini
name: "Spec Wide"
---

# Mode Guidance

- Enter Wide mode only after Lean mode signals an escalation trigger.
- Work spec-first (product + dev). If conflicts exist, add Spec Gaps and propose options.
- Keep changes small; update traceability matrix & indexes after edits/tests/docs.

description: "Full-spec context for cross-cutting tasks; use after Lean escalation."
model: "GPT-5 mini"
tools: ["codebase", "editFiles", "runInTerminal", "search", "runTests", "problems"]

- `.github/copilot-instructions.md`
- `.github/instructions/docs.instructions.md`
- `.github/instructions/src.instructions.md`
- `.github/instructions/security.instructions.md`
- `.github/instructions/dev-docs.instructions.md`
- `docs/spec_index.md`, `docs/dev_spec_index.md` (if present)
