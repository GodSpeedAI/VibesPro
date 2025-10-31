---
description: "Performance and efficiency guidelines"
applyTo: "**"
kind: instructions
domain: performance
precedence: 34
---

# Performance Guidelines

-   Favor algorithmic efficiency and reduce unnecessary computations. When generating code, choose appropriate data structures and avoid nested loops where possible.
-   Minimize large language model token usage by asking concise questions and summarizing outputs. Split complex tasks into smaller steps to stay within context window limits.
-   Use caching and memoization patterns where appropriate. Avoid recomputing values that can be stored.
-   When designing prompts, reference only necessary context rather than entire files to reduce tokens. Use variables like `${fileBasename}` and `${selection}` in prompt files to scope the context.
-   For performance testing, use the `performance-analysis.prompt.md` and associated tasks defined in `.vscode/tasks.json` to measure run times and token usage.
