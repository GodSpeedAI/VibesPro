# Agents Overview

This repository defines a small set of custom AI agents designed to orchestrate, plan and review software engineering tasks with minimal context. Each agent is defined in its own `.agent.md` file with YAML frontmatter that describes its purpose, tool permissions and metadata. Together with the manifest file these agents form the backbone of the Context Engineering SDK.

## Orchestrator Agent

The orchestrator interprets user intent, consults the manifest to select only the files and tools necessary for the task, and then delegates work to other agents or skills. It ensures that:

- The minimal context is loaded according to the routing rules defined in `.github/ce/routing-rules.md`.
- Handoffs to other agents happen deterministically when planning or review is required.
- External tool invocations and VS Code tasks are executed safely and validated.

## Planner Agent

The planner agent converts user goals and requirements into a structured plan using the `plan-template.md`. It extracts requirements, slices work into milestones and tasks, and produces a reproducible plan document. The planner draws context from `PRODUCT.md` and `ARCHITECTURE.md` to ensure alignment with overall goals and constraints.

## Reviewer Agent

The reviewer agent evaluates code changes, plans or documents against product goals, architectural constraints and contribution guidelines. It leverages the `review-and-quality` skill to check for quality, security, performance and compliance issues, and runs validation tasks to maintain strict mode. The reviewer provides clear approval or requested changes based on objective criteria.

## Adding New Agents

To introduce a new agent, scaffold a new `.agent.md` file using the `artifact-registry` skill and register it in `ce.manifest.jsonc`. Every agent must include a `description` and `metadata` section in its frontmatter and should clearly state its responsibilities and handoff rules in its body.
