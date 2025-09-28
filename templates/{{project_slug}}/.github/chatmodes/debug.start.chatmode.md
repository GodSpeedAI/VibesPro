---
kind: chatmode
domain: tooling
task: Kick off debugging with a structured checklist and initial hypotheses
budget: low
model: ${ default_model }
name: "Debug Start Mode"
description: |
	Begin debugging by collecting environment, reproducer, and test status, and propose next steps.
tools: ["codebase", "search", "runInTerminal"]
---

Use this chatmode as the first step in any debugging session.
