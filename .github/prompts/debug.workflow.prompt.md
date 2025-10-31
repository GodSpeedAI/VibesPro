---
kind: prompt
domain: debug
task: workflow
thread: debug-workflow
matrix_ids: [DEV-PRD-004]
budget: M
mode: "agent"
model: GPT-5 mini
tools: ["codebase", "search", "runTests"]
description: "Structured debugging phases from report to regression."
---

# Debugging Workflow

## Inputs

-   Bug summary and steps: {{ '{{BUG}}' }}
-   Affected module(s): {{ '{{TARGET}}' }}
-   Env/versions (optional): {{ '{{ENV}}' }}

## Start

-   Normalize report; identify missing info and plan reproduction.

## Repro

-   Add a failing test that captures the defect.

## Isolate

-   Bisect or instrument to find root cause; keep diffs small.

## Fix

-   Apply the minimal fix; ensure tests pass.

## Refactor

-   Clean up, remove instrumentation, improve clarity.

## Regress

-   Add regression cases; run broader suites.

## Output

-   Direct edits, failing→passing tests, and a concise note linking spec/ADR implications if any.
