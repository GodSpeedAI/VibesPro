---
description: 'Performance and efficiency guidelines'
applyTo: '**'
kind: instructions
domain: performance
precedence: 34
---

# Performance Guidelines

Use this when you see perf regressions, `// TODO: optimize`, slow tests/pipelines, or token budget pressure.

- **Algorithmic first:** Choose the right data structures; avoid needless N+1s and nested loops. Push I/O to boundaries and batch where possible.
- **Measure before/after:** Add a small benchmark or timing log around hot paths; strip noisy logs before merge.
- **Control allocations:** Reuse buffers/objects in tight loops; avoid gratuitous JSON parsing/stringify.
- **Token efficiency:** Keep prompts minimal; inject only relevant snippets (`${selection}`, `${fileBasename}`) and summarize long context.
- **Caching:** Memoize pure computations and cache integration responses safely (respect invalidation); document cache keys.
- **Routes:** Use `performance-analysis.prompt.md` for structured profiling; coordinate with `debugging.instructions.md` for repros and `testing.instructions.md` for guard tests.
