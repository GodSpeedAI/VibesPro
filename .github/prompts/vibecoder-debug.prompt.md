---
kind: prompt
domain: vibecoder
task: debug
thread: vibecoder-debug
matrix_ids: []
budget: M
mode: "agent"
model: GPT-5 mini
tools: ["codebase", "search", "runTests"]
description: "Vibecoder debugging workflow and troubleshooting guidance."
---

# Vibecoder Debug

## Overview

This prompt provides debugging guidance for Vibecoder-related issues.

## Inputs

-   Issue description: {{ '{{ISSUE}}' }}
-   Error messages: {{ '{{ERROR}}' }}
-   Environment details: {{ '{{ENV}}' }}

## Workflow

1. Analyze the issue description and error messages
2. Identify potential root causes
3. Provide step-by-step debugging instructions
4. Suggest fixes or workarounds
