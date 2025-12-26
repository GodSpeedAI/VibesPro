# Routing Rules

This document describes how natural language signals are mapped to artifacts, skills, tools and tasks. The orchestrator agent interprets the user's request and applies these rules to select the minimal context required.

## Signals

Signals are extracted from user requests to capture the intent, scope, risk and actionability. Common signals include:

- **Intent**: `plan`, `implement`, `debug`, `review`, `explain`, `decide`
- **Scope**: `product`, `architecture`, `code`, `docs`, `tooling`, `process`
- **Risk**: `security`, `breaking-change`, `performance`, `data-loss`
- **Actionability**: `read-only`, `propose`, `apply-changes`, `run-tools`, `run-tasks`

## Rules

### Make a Plan

**Signals**: `intent=plan`

**Load**: `PRODUCT.md`, `ARCHITECTURE.md`, `plan-template.md`

**Route to**: `create-plan.prompt.md` or the planner agent

**Then**: produce a `PLAN.md` document and request approval before implementation.

### Extract Requirements

**Signals**: `intent=plan` and mention of requirements

**Load**: `PRODUCT.md`

**Route to**: `extract-requirements.prompt.md`

### Review Changes

**Signals**: `intent=review`

**Load**: `ARCHITECTURE.md`, `CONTRIBUTING.md`, relevant instruction files

**Route to**: `review-changes.prompt.md` or the reviewer agent

### Propose an ADR

**Signals**: `intent=decide` and `scope=architecture`

**Load**: `ARCHITECTURE.md`

**Route to**: `propose-adr.prompt.md`

### Debug Routing

**Signals**: `intent=explain` and mention of context or routing

**Load**: `ce.manifest.jsonc`, `.github/ce/routing-rules.md`

**Route to**: `debug-routing.prompt.md`

### Implement Step

**Signals**: `intent=implement`

**Load**: `PLAN.md`, `ARCHITECTURE.md`, `CONTRIBUTING.md`

**Route to**: `implement-step.prompt.md`

**Then**: apply changes, run tests and execute the validation task.

### Write Tests

**Signals**: `intent=implement` and mention of tests

**Load**: `ARCHITECTURE.md`, `CONTRIBUTING.md`

**Route to**: `write-tests.prompt.md`

### Prepare Release

**Signals**: `intent=implement` and mention of release or deploy

**Load**: `CONTRIBUTING.md`, `ARCHITECTURE.md`

**Route to**: `prepare-release.prompt.md`

### Add Artifact

**Signals**: `intent=routing` or mention of adding a new file

**Load**: `ce.manifest.jsonc`, `.github/ce/vocab.md`

**Route to**: `add-artifact.prompt.md`

### Fallback

If no rule matches, load only the product and architecture documents and ask clarifying questions. Avoid loading the entire repository; the user should supply more details.

## Dependency Closure

When an artifact is selected, its `dependsOn.files` and `dependsOn.artifacts` must also be loaded. This ensures that required tasks, toolsets and skills are available. Validation tasks must accompany any action that modifies files or runs code.

Following these rules ensures predictable routing and prevents hallucinations by making context selection explicit.
