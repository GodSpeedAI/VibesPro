---
kind: prompt
domain: generators
task: discover
thread: generator-discover
matrix_ids: [DEV-PRD-019]
budget: S
mode: agent
description: Discover and select the right generator for a task
tools: [run_command, view_file]
---

# Generator Discovery Workflow

Use this prompt to find the right generator for your task.

## Quick Discovery

```bash
# List all VibesPro custom generators
just generator-list

# List official Nx generators
pnpm exec nx list
```

## Generator Decision Tree

### What are you creating?

1. **A new backend service or API?**
   → Use `@vibespro/service-generator:service`

    ```bash
    pnpm exec nx g @vibespro/service-generator:service my-api
    ```

2. **A new library or package?**
   → Check type:
    - TypeScript lib: `@nx/js:lib`
    - React lib: `@nx/react:lib`
    - Python lib: `@nxlv/python:lib`

3. **A new frontend application?**
   → Check framework:
    - Next.js: `@nx/next:app`
    - React: `@nx/react:app`
    - Remix: `@nx/remix:app`

4. **A UI component?**
   → Use `@nx/react:component` or custom component generator

5. **A new Nx generator?**
   → Use `@vibespro/generator:generator`

    ```bash
    just generator-new my-gen custom
    ```

6. **Something domain-specific not covered?**
   → Create a new generator first!
    ```bash
    just generator-new my-pattern domain
    ```

## Available Generators by Category

### VibesPro Custom Generators

| Generator      | Command                               | Description                                  |
| -------------- | ------------------------------------- | -------------------------------------------- |
| Meta-Generator | `@vibespro/generator:generator`       | Creates new generators                       |
| Service        | `@vibespro/service-generator:service` | Backend services with hexagonal architecture |

### Official Nx Generators

| Category   | Generator   | Command               |
| ---------- | ----------- | --------------------- |
| JavaScript | Library     | `@nx/js:lib`          |
| React      | Application | `@nx/react:app`       |
| React      | Library     | `@nx/react:lib`       |
| React      | Component   | `@nx/react:component` |
| Next.js    | Application | `@nx/next:app`        |
| Next.js    | Page        | `@nx/next:page`       |
| Python     | Application | `@nxlv/python:app`    |
| Python     | Library     | `@nxlv/python:lib`    |

## Check Generator Options

```bash
# See all options for a generator
pnpm exec nx g <generator> --help

# Example
pnpm exec nx g @vibespro/generator:generator --help
```

## When No Generator Exists

**Don't write code manually!** Create a generator instead:

1. Identify the pattern you're implementing
2. Create a generator: `just generator-new <pattern-name> <type>`
3. Customize templates for your use case
4. Use the generator for this and future instances

This follows the **Generator-First Policy**: code patterns should be captured in generators for reproducibility and AI-friendliness.

## See Also

- [Creating Generators](/.github/prompts/generator.create.prompt.md)
- [Generator AGENT.md](/generators/AGENT.md)
- [generators-first.instructions.md](/.github/instructions/generators-first.instructions.md)
