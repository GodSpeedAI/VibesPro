---
kind: prompt
domain: tdd
task: workflow
thread: tdd-workflow
matrix_ids: []
budget: M
mode: "agent"
model: GPT-5 mini
tools: ["codebase", "search", "runTests"]
description: "TDD phases (Red/Green/Refactor) aligned to specs and CALM."
---

# TDD Workflow (Spec- & Architecture-aware)

## Inputs

-   Relevant spec IDs (PRD/ADR/SDS/TS): {{ '{{SPEC_IDS}}' }}
-   Test target module/path (optional): {{ '{{TARGET}}' }}
-   Notes/edge cases from bug/feature: {{ '{{NOTES}}' }}

## Red (Write Failing Test)

**If creating a new module/component**: Check for Nx generators FIRST via `just ai-scaffold name=<generator>` (see `.github/instructions/generators-first.instructions.md`).

-   Locate the spec items; write the smallest failing test proving the requirement.
-   If generator created test scaffold, customize it for spec requirements.
-   No production code changes.

## Green (Make It Pass)

-   Implement the minimal logic inside correct CALM/TS boundaries.
-   Keep risk low; avoid refactor.

## Refactor (Improve Design)

-   With tests passing, improve readability/cohesion and remove duplication.
-   Maintain behavior; re-run tests frequently.

## Output

-   Direct edits to tests/src.
-   Short summary of changes with spec IDs and impacted files.
