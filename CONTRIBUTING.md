# Contributing to VibesPro

Thank you for helping build the Vibes Pro project. This project follows a spec-driven, test-first workflow. Every change should reference the appropriate specification IDs (PRD, SDS, ADR, TS) and include tests where applicable.

## Development Workflow

1. **Set up the environment**

   ```bash
   uv sync --dev
   pnpm install
   just setup
   ```

2. **Follow TDD**: RED → GREEN → REFACTOR → REGRESSION.
3. **Lint & format**: `just lint` and `just format` before opening a PR.
4. **Run tests**: `just test` validates Python, Node, and template generation.
5. **Update docs**: Reflect changes in relevant specs and run `docs-build` when documentation changes significantly.

## Commit Guidelines

- Use Conventional Commits and reference specification IDs. Example:
  `feat(MERGE-TASK-003): add domain generator scaffolding`.
- Keep commits focused; avoid mixed concerns.
- Include context in commit body when touching specs or generators.

## Pull Request Checklist

- [ ] Tests covering new behaviour have been added.
- [ ] All existing tests pass locally.
- [ ] Documentation/specs updated to maintain traceability.
- [ ] Linked issues and specification IDs are referenced.

For detailed tasks, consult the implementation plan in `docs/mergekit/IMPLEMENTATION-PLAN.md`.
