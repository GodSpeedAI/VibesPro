---
kind: chatmode
domain: tooling
task: Find regression causes and propose mitigations
budget: medium
model: ${ default_model }
name: "Debug Regress Mode"
description: |
	Analyze changelogs, recent commits, and failing tests to locate regressions and recommend fixes.
tools: ["codebase", "search", "runInTerminal", "runTests"]
---

Use this chatmode to triage regressions and propose rollback or fix plans.
