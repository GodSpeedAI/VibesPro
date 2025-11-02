---
description: "Generator-first development policy for AI workflows"
applyTo: "**"
kind: instructions
domain: architecture
precedence: 15
---

# Generator-First Development Policy

This project follows a **generator-first approach**: always scaffold with Nx generators before writing custom code.

## Core Principle

**Before writing any new code, check if an Nx generator exists to scaffold it.**

This ensures:

-   Consistent project structure across the monorepo
-   Proper Nx project configuration and dependencies
-   Adherence to hexagonal architecture patterns
-   Correct placement within the bounded context

## Workflow for AI-Assisted Development

### 1. Check for Available Generators

When the user asks to create something (component, library, service, app, etc.):

```bash
# List all available generators
pnpm exec nx list

# Check generators for a specific plugin
pnpm exec nx list @nx/js
pnpm exec nx list @nx/react
pnpm exec nx list @nxlv/python
```

### 2. Use the Generator First

**Always use `just ai-scaffold` or `pnpm exec nx g` BEFORE writing custom code:**

```bash
# Scaffold with just recipe (recommended - includes error handling)
just ai-scaffold name=@nx/js:lib

# Or directly with Nx
pnpm exec nx g @nx/js:lib my-library
pnpm exec nx g @nx/react:component MyComponent
pnpm exec nx g @nxlv/python:app my-api
```

### 3. Then Customize

**After** the generator creates the scaffold:

-   Add business logic specific to your domain
-   Implement interfaces per SDS/TS specs
-   Add tests following TDD workflow
-   Update documentation and traceability

## Common Generators

### Libraries

```bash
# TypeScript/JavaScript library
just ai-scaffold name=@nx/js:lib
# Specify directory: --directory=libs/shared

# React component library
just ai-scaffold name=@nx/react:lib

# Python library (FastAPI, domain logic)
just ai-scaffold name=@nxlv/python:lib
```

### Applications

```bash
# Next.js app
just ai-scaffold name=@nx/next:app

# Remix app
just ai-scaffold name=@nx/remix:app

# FastAPI Python app
just ai-scaffold name=@nxlv/python:app

# Expo mobile app
just ai-scaffold name=@nx/expo:app
```

### Components

```bash
# React component
just ai-scaffold name=@nx/react:component

# React hook
just ai-scaffold name=@nx/react:hook
```

### Custom Domain Generators

This project includes custom generators for hexagonal architecture:

```bash
# Service generator (uses domain.yaml)
just generate service name=user-service lang=python

# Domain entity library
pnpm exec nx g service --name=orders --template=domain

# API adapter library
pnpm exec nx g service --name=orders-api --template=api

# UI feature library
pnpm exec nx g service --name=orders-ui --template=feature
```

## Integration with AI Workflows

### TDD Workflow

**Red Phase** (write failing test):

1. If testing a new module/component → use generator first
2. Generator creates test scaffold → customize test for spec requirements
3. Run test → should fail (no implementation yet)

**Green Phase** (make it pass):

1. Implement logic in the generated scaffold
2. Follow the generated structure (don't fight the generator)

**Refactor Phase**:

1. Improve within the generated structure
2. Keep Nx project boundaries intact

### Spec Implementation Workflow

When implementing from PRD/SDS/TS:

1. **Identify scope**: What needs to be created? (lib, app, component, service?)
2. **Check generator**: Does an Nx generator exist for this?
3. **Scaffold first**: Run `just ai-scaffold name=<generator>`
4. **Implement spec**: Add business logic per SDS/TS requirements
5. **Add tests**: Follow TDD workflow
6. **Update traceability**: Link code to spec IDs

## When NOT to Use Generators

Only write code from scratch when:

-   Modifying existing generated code (add features, fix bugs)
-   The code is purely utility/helper functions within an existing module
-   No appropriate generator exists (rare - consider creating a custom generator)

## Error Handling

If `just ai-scaffold` fails:

-   Check that pnpm/Nx are installed: `just setup`
-   Verify the generator name is correct: `pnpm exec nx list`
-   Check if the plugin is installed in package.json
-   Install missing plugins: `pnpm add -D @nx/react` (for example)

## Custom Generator Development

If you frequently create similar code patterns:

1. Create a custom Nx generator in `generators/`
2. Follow the pattern in `generators/service/generator.ts`
3. Add just recipe for easy invocation
4. Update this document with the new generator

## References

-   Nx generators documentation: https://nx.dev/concepts/more-concepts/generating-code
-   Custom generators guide: https://nx.dev/extending-nx/recipes/local-generators
-   @nxlv/python plugin: https://github.com/lucasvieirasilva/nx-plugins
-   Just recipes: see `justfile` (lines 376-398 for `ai-scaffold`)
-   Nx integration: `.github/instructions/nx.instructions.md`
