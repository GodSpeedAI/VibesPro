---
kind: prompt
domain: spec
task: transcript
thread: spec-transcript-to-devspec
matrix_ids: []
budget: M
mode: "agent"
model: GPT-5 mini
tools: ["codebase", "search"]
description: "Convert a conversation transcript into developer spec drafts with DEV-* IDs."
---

# Convert Transcript to Developer Spec Draft

## Inputs

- Conversation transcript or summary
- Target DEV spec IDs (proposed): {{ '{{DEV_IDS}}' }}

## Task

- Extract developer platform impacts, tooling, CI/test/lint requirements.
- Propose DEV-\* IDs and exact headings; flag ambiguities as Spec Gaps with options.
- Output a minimal draft suitable for `docs/dev_prd.md`/`docs/dev_adr.md`/`docs/dev_sds.md`/`docs/dev_technical-specifications.md`.

## Output

- Markdown sections ready to insert into the appropriate developer spec file(s).
