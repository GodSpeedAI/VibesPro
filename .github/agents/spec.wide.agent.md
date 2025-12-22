---
model: GPT-5 mini
name: spec.wide
description: Wide entrypoint that routes to spec.author when full-context review is needed.
tools: ['runCommands', 'runTasks', 'search', 'Memory Tool/*', 'Vibe Check/*']
handoffs:
    - label: 'Spec Author'
      agent: 'spec.author'
      prompt: 'Escalate to wide mode: load full spec/ADR context and resolve ambiguities for the request above.'
      send: true
---

Use when lean context is insufficient or conflicts arise. Hand off to Spec Author for the full-context rewrite.
