# Nx Generators Guide

This document lists all available Nx generators in this project and when to use them.

## Generator-First Philosophy

**Before writing any code**, check if an Nx generator exists to scaffold it:

```bash
# List all generators
pnpm exec nx list

# List generators for a specific plugin
pnpm exec nx list @nx/js
pnpm exec nx list @nx/react

# Use via just recipe (recommended)
just ai-scaffold name=<generator>

# Or directly
pnpm exec nx g <generator> <name> [options]
```

See `.github/instructions/generators-first.instructions.md` for complete workflow.

## Installed Generators

### @nx/js - TypeScript/JavaScript Libraries

**Use for**: Shared utilities, domain logic, business rules, data models

```bash
# Create a library
just ai-scaffold name=@nx/js:library
pnpm exec nx g @nx/js:library my-lib

# Specify directory (recommended for organization)
pnpm exec nx g @nx/js:library my-lib --directory=libs/shared
pnpm exec nx g @nx/js:library user-domain --directory=libs/domain/user

# Options:
# --bundler=none|tsc|swc|rollup|esbuild|vite
# --unitTestRunner=jest|vitest|none
# --linter=eslint|none
# --publishable (if you plan to publish to npm)
```

**Common use cases**:

- Domain entities and value objects
- Business logic services
- Shared utilities (date formatting, validation, etc.)
- API clients
- Type definitions

---

### @nx/react - React Components & Libraries

**Use for**: UI components, feature libraries, React hooks

```bash
# Create a component library
just ai-scaffold name=@nx/react:library
pnpm exec nx g @nx/react:library ui-components --directory=libs/ui

# Create a standalone component
pnpm exec nx g @nx/react:component Button --project=ui-components

# Create a custom hook
pnpm exec nx g @nx/react:hook useAuth --project=shared-hooks

# Create Redux slice
pnpm exec nx g @nx/react:redux auth --project=state-management

# Options:
# --style=css|scss|styled-components|emotion|styled-jsx|none
# --routing (add React Router)
# --unitTestRunner=jest|vitest|none
# --component (add example component)
```

**Common use cases**:

- Design system components (Button, Input, Card, etc.)
- Feature-specific UI (UserProfile, OrderList, etc.)
- Custom hooks (useAuth, useFetch, useLocalStorage, etc.)
- State management (Redux slices, context providers)

---

### @nx/node - Node.js Applications

**Use for**: Backend services, CLI tools, scripts

```bash
# Create a Node.js application
pnpm exec nx g @nx/node:application api --directory=apps

# Options:
# --framework=express|fastify|koa|nest|none
# --docker (generate Dockerfile)
# --e2eTestRunner=jest|none
```

**Common use cases**:

- REST APIs
- GraphQL servers
- CLI applications
- Background workers
- Microservices

---

### @nx/jest - Testing Setup

**Use for**: Test configuration (usually auto-configured by other generators)

```bash
# Add Jest to existing project
pnpm exec nx g @nx/jest:configuration my-lib
```

---

### @nx/workspace - Workspace Utilities

**Use for**: Workspace-level generators and utilities

```bash
# Convert to monorepo (if needed)
pnpm exec nx g @nx/workspace:convert-to-monorepo

# Move project to different directory
pnpm exec nx g @nx/workspace:move --projectName=my-lib --destination=libs/new-location
```

---

## Available (Not Installed) Generators

These plugins are available but not currently installed. Install them if needed:

### @nx/next - Next.js Applications

```bash
# Install
pnpm add -D @nx/next

# Create Next.js app
pnpm exec nx g @nx/next:application web --directory=apps
```

**Use for**: Full-stack React applications, SSR, static sites

---

### @nx/remix - Remix Applications

```bash
# Install
pnpm add -D @nx/remix

# Create Remix app
pnpm exec nx g @nx/remix:application my-remix-app
```

**Use for**: Modern web applications with Remix framework

---

### @nx/nest - NestJS Applications

```bash
# Install
pnpm add -D @nx/nest

# Create NestJS app
pnpm exec nx g @nx/nest:application api

# Create NestJS library
pnpm exec nx g @nx/nest:library shared
```

**Use for**: Enterprise-grade Node.js backends with dependency injection

---

### @nx/express - Express Applications

```bash
# Install
pnpm add -D @nx/express

# Create Express app
pnpm exec nx g @nx/express:application api
```

**Use for**: Simple REST APIs, lightweight backends

---

### @nx/expo - React Native (Expo) Applications

```bash
# Install
pnpm add -D @nx/expo

# Create Expo app
pnpm exec nx g @nx/expo:application mobile
```

**Use for**: Mobile applications (iOS/Android)

---

### @nxlv/python - Python Applications & Libraries

```bash
# Install
pnpm add -D @nxlv/python

# Create Python app (FastAPI, Flask, etc.)
pnpm exec nx g @nxlv/python:application api --type=fastapi

# Create Python library
pnpm exec nx g @nxlv/python:library my-lib
```

**Use for**: Python backends, ML models, data processing

---

## Custom Generators

This project may include custom generators in `generators/`:

```bash
# List local generators
ls -la generators/

# Use a custom generator
pnpm exec nx g ./generators/service:service my-service
```

Check `generators/*/schema.json` for available options.

---

## Generator Workflow Integration

### With TDD

**Red Phase**:

1. Check if new module/component needed → use generator first
2. Generator creates test scaffold → customize for spec requirements
3. Run test → should fail

**Green Phase**:

- Implement logic in generated structure

**Refactor Phase**:

- Improve within generated boundaries

### With Spec Implementation

1. **Read spec** (PRD/SDS/TS)
2. **Identify scope**: What needs creation? (lib, app, component?)
3. **Use generator**: `just ai-scaffold name=<generator>`
4. **Implement**: Add business logic per spec
5. **Test**: Follow TDD workflow
6. **Trace**: Update traceability matrix

---

## Quick Reference

| Need             | Generator                  | Command                                                      |
| ---------------- | -------------------------- | ------------------------------------------------------------ |
| Shared utilities | `@nx/js:library`           | `just ai-scaffold name=@nx/js:library`                       |
| React component  | `@nx/react:component`      | `pnpm exec nx g @nx/react:component MyComponent`             |
| React library    | `@nx/react:library`        | `just ai-scaffold name=@nx/react:library`                    |
| Custom hook      | `@nx/react:hook`           | `pnpm exec nx g @nx/react:hook useMyHook`                    |
| Node.js API      | `@nx/node:application`     | `pnpm exec nx g @nx/node:application api`                    |
| Next.js app      | `@nx/next:application`     | `pnpm exec nx g @nx/next:application web`                    |
| Mobile app       | `@nx/expo:application`     | `pnpm exec nx g @nx/expo:application mobile`                 |
| Python API       | `@nxlv/python:application` | `pnpm exec nx g @nxlv/python:application api --type=fastapi` |

---

## Best Practices

1. **Always use generators for new projects/libraries**
   - Ensures consistent structure
   - Configures build/test automatically
   - Sets up Nx project graph correctly

2. **Specify `--directory` for organization**

   ```bash
   # Good: organized by domain
   pnpm exec nx g @nx/js:library user-service --directory=libs/domain/user

   # Avoid: flat structure
   pnpm exec nx g @nx/js:library user-service
   ```

3. **Use `--dry-run` to preview**

   ```bash
   pnpm exec nx g @nx/react:component Button --dry-run
   ```

4. **Customize after generation**
   - Generators create scaffolds, not complete solutions
   - Add your business logic, tests, documentation after

5. **Don't fight the generator**
   - Follow the structure it creates
   - Use Nx's conventions (project.json, tsconfig.json, etc.)

---

## Troubleshooting

### "Cannot find generator"

- Ensure plugin is installed: `pnpm add -D @nx/<plugin>`
- Check spelling: `pnpm exec nx list`

### "Missing required parameter"

- Check schema: `pnpm exec nx g @nx/js:library --help`
- Or use interactive mode: `pnpm exec nx g @nx/js:library` (prompts for inputs)

### "Project already exists"

- Choose different name or remove existing project
- Use `--dry-run` to preview first

---

## Additional Resources

- [Nx Generators Documentation](https://nx.dev/concepts/more-concepts/generating-code)
- [Custom Local Generators](https://nx.dev/extending-nx/recipes/local-generators)
- `.github/instructions/generators-first.instructions.md` (workflow)
- `.github/instructions/nx.instructions.md` (Nx MCP server integration)
- `justfile` (see `ai-scaffold` recipe at line 376-398)
