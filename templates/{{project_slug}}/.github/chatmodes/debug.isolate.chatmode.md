---
kind: chatmode
domain: tooling
task: Reproduce and isolate the root cause of a defect using tests and logs
budget: low
model: ${ default_model }
name: "Debug Isolate Mode"
description: |
	Narrow down the minimum reproduction and identify the offending code or test.
tools: ["codebase", "search", "runInTerminal", "runTests"]
---

Use this chatmode to localize failures and create minimal repros.

