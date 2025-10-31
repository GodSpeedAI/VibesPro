# Contributing to VibesPro

Thank you for helping build the Vibes Pro project. This project follows a spec-driven, test-first workflow. Every change should reference the appropriate specification IDs (PRD, SDS, ADR, TS) and include tests where applicable.

## Development Workflow

1. **Set up the environment**

    ```bash
    uv sync --dev
    pnpm install
    just setup
    ```

## Devbox note

This repository supplies a Devbox configuration (`devbox.json`) that includes `just` in the runtime. If you enter the Devbox shell (recommended for reproducible work) you'll already have `just` available. Example:

```bash
devbox shell
just --version
```

If `just` is missing for any reason, you can install it into the Devbox user environment without sudo:

```bash
# inside devbox shell
curl --proto '=https' --tlsv1.2 -sSf https://just.systems/install.sh | bash -s -- --to ~/.local/bin
export PATH="$HOME/.local/bin:$PATH"
just --version
```

Adding `just` to Devbox ensures all contributors and CI that use the Devbox environment run the same `just` binary and recipes.

## Pre-commit, formatting and shfmt

We use pre-commit as the canonical gate for linting/formatting. This ensures everyone formats code the same
way before commits and CI runs the same checks.

Recommended setup:

1. Install pre-commit and project tools (uses the project's venv):

```bash
just setup-python
python3 -m pip install --upgrade pre-commit
```

2. Install pre-commit hooks (will not override custom `core.hooksPath`):

```bash
# If repository uses default hooks path
pre-commit install --hook-type pre-commit --hook-type commit-msg

# Or use the helper
just install-hooks
```

3. Install `shfmt` (shell formatter) so shell scripts are auto-formatted by the `shfmt` hook:

macOS (Homebrew):

```bash
brew install shfmt
```

Linux (via Go):

```bash
go install mvdan.cc/sh/v3/cmd/shfmt@latest
```

4. Format and validate your tree locally before pushing:

```bash
pre-commit run --all-files
```

Notes:

-   We run Prettier, Ruff, ESLint (local), and shfmt (system) via pre-commit.
-   If you prefer not to install `shfmt` system-wide, we can switch to a pre-commit mirror that bundles shfmt; ask the maintainers to enable that.

2. **Follow TDD**: RED → GREEN → REFACTOR → REGRESSION.
3. **Lint & format**: `just lint` and `just format` before opening a PR.
4. **Run tests**: `just test` validates Python, Node, and template generation.
5. **Update docs**: Reflect changes in relevant specs and run `docs-build` when documentation changes significantly.

## Commit Guidelines

-   Use Conventional Commits and reference specification IDs. Example:
    `feat(MERGE-TASK-003): add domain generator scaffolding`.
-   Keep commits focused; avoid mixed concerns.
-   Include context in commit body when touching specs or generators.

## Pull Request Checklist

-   [ ] Tests covering new behaviour have been added.
-   [ ] All existing tests pass locally.
-   [ ] Documentation/specs updated to maintain traceability.
-   [ ] Linked issues and specification IDs are referenced.

For detailed tasks, consult the implementation plan in `docs/mergekit/IMPLEMENTATION-PLAN.md`.
