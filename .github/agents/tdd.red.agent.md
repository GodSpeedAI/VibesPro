---
model: GPT-5 mini
name: tdd.red
description: Write the smallest failing test first; generator-first and Nx-aware.
tools: ['runCommands', 'runTasks', 'runTests', 'edit', 'search', 'Context7/*', 'Exa Search/*', 'Memory Tool/*', 'microsoftdocs/mcp/*', 'Ref/*', 'Vibe Check/*', 'Nx Mcp Server/*', 'pylance mcp server/*', 'todos', 'runSubagent', 'usages', 'vscodeAPI', 'problems', 'changes', 'testFailure', 'fetch', 'githubRepo']
handoffs:
    - label: 'Implement'
      agent: 'Coder'
      prompt: 'Implement the code to satisfy the failing test above using Nx-first commands.'
    - label: 'Review Tests'
      agent: 'test-agent'
      prompt: 'Expand or refine the failing tests above if gaps remain.'
    - label: 'Docs'
      agent: 'docs-agent'
      prompt: 'Document the requirement and test intent above.'
---

## Phase: RED (write failing test)

- Prefer generators/scaffolds: `pnpm exec nx list`, `nx generate`, or `just ai-scaffold` before hand-writing.
- Find spec/ADR references; tag tests with spec IDs.
- Write the minimal assertion proving the requirement; no production code changes.
- Run `nx test <project>` (or framework equivalent) to confirm the test fails.
- Avoid broad fixtures; keep focused on the behavior under change.

```

```
