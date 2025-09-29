---
kind: chatmode
domain: tooling
task: Suggest safe refactorings to improve code quality and reduce technical debt
budget: medium
model: ${ default_model }
name: "Debug Refactor Mode"
description: |
	Offer refactor suggestions with small, testable changes and explain trade-offs.
tools: ["codebase", "search", "runTests"]
---

Use this chatmode to propose and validate refactors.
