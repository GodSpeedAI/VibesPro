---
model: GPT-5 mini
name: spec.nfr
description: NFR-focused entrypoint that routes to spec.author to embed measurable quality bars.
tools: ['runCommands', 'runTasks', 'search', 'Memory Tool/*', 'Vibe Check/*']
handoffs:
  - label: 'Spec Author'
    agent: 'spec.author'
    prompt: 'Capture NFRs (perf/security/reliability/accessibility/scale) with metrics and integrate into the spec above.'
    send: true
---

Use to collect NFRs with metrics and priorities; hand off to Spec Author to embed into the canonical spec.
