---
description: "Testing strategy and tooling (Node + ShellSpec + ShellCheck)"
applyTo: "**"
kind: instructions
domain: testing
precedence: 35
---

# Testing Instructions

These guidelines define how to write, organize, and run tests in this repo. They extend the repo-wide instructions and align with DEV-PRD, DEV-SDS, and DEV-SPEC docs.

## Goals

-   Fast feedback and high signal-to-noise.
-   No heavyweight dependencies by default; prefer Node builtin modules and portable shells.
-   Consistent naming and locations so tasks/CI can discover and run tests deterministically.

## Test Types and Scope

-   Unit tests
    -   Node: JavaScript using `node:assert` (no extra deps) for utilities under `tools/**`.
    -   Shell: ShellSpec specs for scripts under `scripts/**`.
-   Integration tests
    -   Exercise `scripts/run_prompt.sh`, `scripts/measure_tokens.sh`, and key flows end-to-end with fixtures.
-   Snapshot/golden tests (optional)
    -   For prompt rendering/stacking outputs. Keep fixtures small and stable.

## Directory & Naming Conventions

-   Tests live under `tests/`.
    -   Node unit tests: `tests/unit/**/*.test.js`.
    -   Integration tests: `tests/integration/**/*.test.js`.
    -   ShellSpec specs: `tests/shell/**/*_spec.sh`.
    -   Fixtures: `tests/fixtures/**`.
-   Co-locate additional small fixtures next to tests if it improves clarity.

## Node (JavaScript) Tests

-   Use only built-ins: `node:assert`, `node:fs`, `node:path`.
-   Structure
    -   Arrange → Act → Assert. Keep tests isolated and idempotent.
    -   Avoid network/file-system side-effects; when necessary, use a temp dir under `.tmp-tests/` and clean up.
-   Example skeleton
    -   `tests/unit/example.test.js`
        -   Describe behavior via plain comments; no custom frameworks.

## ShellSpec for Shell Scripts

-   Purpose: Behavior-driven tests for shell scripts in `scripts/**`.
-   Location: `tests/shell/**/*_spec.sh`.
-   Naming: Mirror the script path, e.g., script `scripts/run_prompt.sh` → `tests/shell/scripts/run_prompt_spec.sh`.
-   Conventions
    -   Each example should be side-effect safe; use temporary directories via `mktemp -d`.
    -   Prefer asserting on exit status and output (stdout/stderr) with minimal coupling.
    -   Disable paging in commands that may page (e.g., `git --no-pager`).
-   Running locally
    -   If ShellSpec is installed globally: `shellspec` from repo root.
    -   To run a subset: `shellspec tests/shell/scripts/run_prompt_spec.sh`.
-   Example template

```sh
Describe 'run_prompt.sh'
  Include scripts/run_prompt.sh

  It 'shows usage when no args'
    When run script scripts/run_prompt.sh
    The status should be failure
    The stderr should include 'usage'
  End

  It 'runs a prompt file and returns 0'
    prompt_file='.github/prompts/create-react-component.prompt.md'
    When run script scripts/run_prompt.sh "$prompt_file"
    The status should be success
    The output should include 'tokens'
  End
End
```

## ShellCheck for Static Analysis

-   Purpose: Catch common shell pitfalls and enforce style/safety.
-   Scope: All files under `scripts/**` and any shell utilities under `tools/**` where applicable.
-   Recommended invocation
    -   Basic: `shellcheck scripts/*.sh`.
    -   Strict style: `shellcheck -S style -o all scripts/*.sh`.
    -   CI-friendly recursive example: `find scripts -type f -name '*.sh' -print0 | xargs -0 shellcheck`.
-   Guidelines
    -   Fix all errors. Warnings may be suppressed with inline `# shellcheck disable=SCxxxx` and a justification when truly necessary.
    -   Prefer POSIX sh-compatible constructs unless bash/zsh-specific features are required; declare shebang accordingly.

## Test Data and Fixtures

-   Place reusable inputs under `tests/fixtures/` organized by feature.
-   Keep fixtures minimal; add comments that explain intent.
-   Treat fixtures as read-only during tests; copy to a temp dir if mutation is needed.

## Running Tests Locally

-   Node tests
    -   Use a simple runner script under `tools/test/run_node_tests.js` (future work) or execute directly with `node`.
-   ShellSpec
    -   Run `shellspec` from repo root; it auto-discovers `*_spec.sh` files.
-   ShellCheck
    -   Run the recursive command above or use a task (see below).

## VS Code Tasks (optional wiring)

-   Add tasks to run Node tests, ShellSpec, and ShellCheck via `.vscode/tasks.json` (do not enable auto-approve, follow security.instructions.md).
-   Example labels (suggested):
    -   "Test: Node Unit"
    -   "Test: ShellSpec"
    -   "Lint: ShellCheck"

## CI/Quality Gates Alignment

-   Align with docs:
    -   DEV-SPEC-003 Build/lint tasks (Markdown + prompt lint).
    -   DEV-SPEC-005 Evaluation and metrics.
    -   DEV-SPEC-006 CI posture; ensure `.vscode/settings.json` safety.
    -   DEV-SPEC-008 Testing strategy (unit tests for scripts; golden tests for prompts).
-   Minimum acceptance
    -   All ShellCheck errors fixed; warnings triaged.
    -   ShellSpec suite passes on Linux.
    -   Node unit/integration tests pass with Node LTS.

## Tips

-   Make tests deterministic: control time via small wrappers where needed.
-   Keep outputs small; when asserting on multi-line output, normalize whitespace.
-   Prefer dependency-free approaches first.
