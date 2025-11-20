---
name: spec.wide
description: Wide entrypoint that routes to spec.author when full-context review is needed.
model: GPT-5 mini
tools: ["runCommands", "runTasks", "search", "Memory Tool/*", "Vibe Check/*"]
handoffs:
    - label: "Spec Author"
      agent: "spec.author"
      prompt: "Escalate to wide mode: load full spec/ADR context and resolve ambiguities for the request above."
---

Use when lean context is insufficient or conflicts arise. Hand off to Spec Author for the full-context rewrite.
