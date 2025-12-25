# Reference: Prompts 🧾

Prompts carry YAML frontmatter with taxonomy fields: `kind: prompt`, `domain`, `task`, optional `phase`, and an optional `budget` (S|M|L).

## Groups (by domain)

- spec:
  - spec.implement.prompt.md (task: implement)
  - spec.change.prompt.md (task: change)
  - spec.traceability.update.prompt.md (task: traceability)
  - spec.items.load.prompt.md (task: items)
  - spec.housekeeping.prompt.md (task: housekeeping)
  - spec.transcript.to-spec.prompt.md (task: transcript)
  - spec.transcript.to-devspec.prompt.md (task: transcript)
- tdd/debug:
  - tdd.workflow.prompt.md (task: workflow)
  - debug.workflow.prompt.md (task: workflow)
- docs/ui:
  - docs.generate.prompt.md (domain: docs, task: generate)
  - ui.react.create-component.prompt.md (domain: ui, task: create-component)
- perf/sec/testing/tools/platform:
  - perf.analyze.prompt.md (domain: perf, task: analyze)
  - sec.review.prompt.md (domain: sec, task: review)
  - test-hardening.prompt.md (domain: testing, task: hardening)
  - tool.techstack.sync.prompt.md (domain: tool, task: sync)
  - platform.bootstrap.prompt.md (domain: platform, task: bootstrap)

See also: `reference/index.md` for a consolidated list.

## Usage

Chat modes reference prompts; you can also run prompts via tasks or tooling (see `scripts/run_prompt.sh`).
