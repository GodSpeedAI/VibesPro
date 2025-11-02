---
kind: prompt
domain: vibecoder
task: tdd
thread: vibecoder-tdd
matrix_ids: []
budget: M
mode: "agent"
model: GPT-5 mini
tools: ["codebase", "search", "runTests"]
description: "Vibecoder TDD workflow guidance and test-driven development patterns."
---

# Vibecoder TDD

## Overview

This prompt provides Test-Driven Development guidance specifically for Vibecoder workflows.

## Inputs

-   Feature description: {{ '{{FEATURE}}' }}
-   Test requirements: {{ '{{TESTS}}' }}
-   Code context: {{ '{{CONTEXT}}' }}

## TDD Workflow

1. **Red Phase**: Write failing tests that define the expected behavior
2. **Green Phase**: Write minimal code to make tests pass
3. **Refactor Phase**: Improve code quality while keeping tests green
4. **Repeat**: Continue the cycle for the next requirement
