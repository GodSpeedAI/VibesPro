---
name: spec.lean
description: Lean entrypoint that routes to spec.author with narrow context.
tools: ["runCommands", "runTasks", "search", "Memory Tool/*", "Vibe Check/*"]
handoffs:
    - label: "Spec Author"
      agent: "spec.author"
      prompt: "Work in lean mode: use spec index IDs only, load minimal context, and draft the spec section requested above."
      send: true
---

Use this when you want a minimal spec slice. Keep context tight; escalate via Spec Author if ambiguity appears.
