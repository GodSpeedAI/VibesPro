# Tutorial: Getting Started with TDD + Copilot 🧪

Audience: developers new to the AI-enhanced TDD flow in this template.

---

## Goals

- Write a failing test (Red), make it pass (Green), and refactor (Refactor).
- Use Copilot chat modes and prompts aligned to specs and CALM.

## Prereqs

- Context bundle generated: `just ai-context-bundle`
- Tests runnable (if any projects exist). If not, focus on Red phase design.

## Steps

1. Red — write a failing test

- Open chat mode: `tdd.red`
- Provide spec IDs and target: e.g., `PRD-123, ADR-04, SDS-Auth-7`, target `packages/auth`.
- Let Copilot propose test files and minimal failing tests.

2. Green — make it pass

- Switch to `tdd.green`
- Implement the minimal change to pass; avoid refactoring.

3. Refactor — improve design

- Switch to `tdd.refactor`
- Remove duplication, improve naming; keep tests green.

## Tips

- Keep diffs small; push often.
- Cross-check `docs/ai_context_bundle/architecture/calm` and `techstack.yaml`.
- Record spec IDs in commits.

## Next

- Try a Debug run: start → repro → isolate → fix → refactor → regress.
