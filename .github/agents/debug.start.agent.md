```chatmode
---
kind: chatmode
domain: debug
task: start
budget: S
model: ${ default_model }
name: "Debug Start Mode"
description: Minimal debug.start chatmode placeholder
tools: ["codebase", "search"]
handoffs:
 - label: delegate
  agent: implementer.core
  prompt: "Delegate debug investigation to implementer.core with context bundle"
---

# Debug Start Mode

Placeholder for debug start chatmode.
```
