---
kind: chatmode
domain: debug
task: repro
budget: low
model: ${ default_model }
name: "Debug Repro Mode"
description: |
	Walk through steps to reproduce issues and collect diagnostics (logs, stack traces).
tools: ["codebase", "search", "runInTerminal"]
---

Use this chatmode to create reliable reproduction steps.
