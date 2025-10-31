---
description: "Python coding style guidelines"
applyTo: "**/*.py"
kind: instructions
domain: style
precedence: 33
---

# Python Style Guidelines

-   Language/runtime: Python 3.12. Use uv for env and dependency management in this repo/template.
-   Code style: Follow PEP 8 and PEP 257 (docstrings). Use black/ruff if configured; otherwise, keep formatting consistent.
-   Typing: Use strict, explicit type hints everywhere. Prefer precise types over Any. Consider Protocols and TypedDicts when useful.
-   Structure: Keep functions small and focused; favor pure functions. Prefer dataclasses and enums for structured data.
-   Imports: Absolute imports; group stdlib, third-party, local, separated by blank lines. Use explicit exports via `__all__` when building libraries.
-   Imports: Absolute imports; group stdlib, third-party, local, separated by blank lines. Use explicit exports via `__all__` when building libraries.
-   Errors: Raise specific exceptions. Avoid bare except. Include actionable error messages.
-   Logging: Use the standard logging module; avoid print in library code. Configure handlers in entrypoints only.
-   Testing: Write pytest tests for new behavior. Aim for unit tests around hook logic and template rendering. Keep tests deterministic.
-   Documentation: Use PEP 257 docstrings with clear sections (Args, Returns, Raises, Examples) when functions are non-trivial. Keep summaries on the first line; explain the "why" and constraints.
-   Files and naming: snake_case for modules, packages, functions, and variables. PascalCase for classes. Constants in UPPER_SNAKE_CASE.
-   I/O and paths: Prefer pathlib.Path over os.path for paths and file ops.
-   Performance/clarity: Choose clarity first; optimize when needed and measure.
-   Tooling: Do not use pip directly here; rely on uv commands. Integrate mypy/pyright if configured.

For additional repo-specific standards, see `.github/copilot-instructions.md` at the root of the template for Python guidance used by tests and hooks.
