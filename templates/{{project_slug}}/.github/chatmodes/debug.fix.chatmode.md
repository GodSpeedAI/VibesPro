---
kind: chatmode
domain: tooling
task: Help developer diagnose and fix a failing test or bug based on the repository codebase and logs
budget: low
model: ${ default_model }
name: "Debug Fix Mode"
description: |
	Provide steps to reproduce, isolate the cause, and suggest a minimal fix or test to validate the issue.
tools: ["codebase", "search", "runInTerminal", "runTests"]
---

Use this chatmode to iteratively diagnose and fix code-level defects.
