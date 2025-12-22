---
kind: prompt
domain: testing
task: hardening
thread: test-hardening
matrix_ids: []
budget: M
mode: 'agent'
model: GPT-5 mini
tools: ['codebase', 'search']
description: 'Harden tests for recently touched SDS components and update traceability.'
---

# Test Hardening & Quality Gates

## Task

- For each `SDS` component touched in the last N commits:
    - Add edge-case and failure-path tests.
    - Ensure coverage thresholds.
- Generate a summary report and update the Traceability Matrix.

## Acceptance

- All new tests reference relevant `PRD-xxx` / `SDS-xxx`.
