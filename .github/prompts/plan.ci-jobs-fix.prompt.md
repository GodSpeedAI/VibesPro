---
kind: prompt
domain: debug
task: plan
thread: ci-fix
matrix_ids: [DEV-PRD-042]
budget: M
mode: "agent"
model: GPT-5 mini
tools: ["search", "runTests", "Context7/*", "Exa Search/*", "github/*", "Ref/*", "Vibe Check/*"]
description: "Analyze failed CI jobs and create fix plan"
---

# CI Failure Root Cause Analysis

## Objective

Investigate all failed CI jobs, identify root causes, and create actionable fix plan.

## Analysis Steps

1. **Extract Failure Data**
    - Use `gh run list --limit 20 --json conclusion,name,databaseId --jq '.[] | select(.conclusion=="failure")' > /tmp/failed_runs.json`
    - For each failed run: `gh run view <run-id> --log > /tmp/run_<id>_log.txt`

    **Make sure you direct the outputs of `gh` commands to files in the `/tmp/` directory or you won't be able to see them.**

2. **Categorize Failures**
    - **Test failures**: Parse error messages, stack traces
    - **Dependency issues**: Version conflicts, missing packages
    - **Environment mismatches**: Local vs CI differences
    - **Flaky tests**: Intermittent failures, race conditions
    - **Configuration errors**: Missing secrets, wrong env vars

3. **Identify Root Causes**
    - What broke? (immediate error)
    - Why did it break? (underlying cause)
    - What dependencies are involved?
    - What changed recently? (commits, config, dependencies)

4. **Technical Debt Factors**
    - Brittle tests lacking isolation
    - Hardcoded values in CI config
    - Missing documentation
    - Outdated dependencies

## Solution Requirements

- Fix root causes, not symptoms
- No new technical debt
- Reproducible locally before pushing
- Follow best practices for:
    - Test isolation (proper setup/teardown)
    - Environment parity (use containers if needed)
    - Dependency management (lock files)
    - CI configuration (parameterized, modular)

## Deliverables

Create **actionable plan** with:

1. **Priority List**
    - Blocking issues first
    - Group by: immediate fixes, structural improvements, prevention

2. **Fix Instructions**
    - Specific files to modify
    - Commands to run
    - Validation steps

3. **Validation Checklist**
    - [ ] Tests pass locally
    - [ ] CI jobs pass (3+ consecutive runs)
    - [ ] Branch merges to main

## Expected Outcome

✅ All tests pass locally
✅ All CI jobs pass remotely
✅ Branch successfully merges to main
✅ No recurring failure patterns

## Context Variables

- Workspace: ${workspaceFolder}
- Current file: ${file}
- Selection: ${selection}

If specific logs or files needed, ask before proceeding.
**Save all plans to `docs/plans/ci-fix-plan.md`.**
