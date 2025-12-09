# @vibespro/generator - Meta-Generator

> The "generator that creates generators" - enabling JIT (Just-In-Time) creation of bespoke Nx generators for the VibesPro platform.

## Overview

This meta-generator scaffolds new Nx generators with proper structure, templates, and configuration. It enables AI agents and developers to create domain-specific generators on-the-fly.

## Installation

Already included in the VibesPro platform.

## Usage

### Basic Usage

```bash
# Create a basic custom generator
pnpm exec nx g @vibespro/generator:generator my-feature

# Or use the just recipe
just generator-new my-feature
```

### Generator Types

| Type        | Description              | Use Case                  |
| ----------- | ------------------------ | ------------------------- |
| `custom`    | Blank generator template | General purpose           |
| `domain`    | Domain entity libraries  | DDD aggregates, entities  |
| `service`   | Backend services         | APIs, microservices       |
| `component` | UI components            | React/Vue components      |
| `adapter`   | Infrastructure adapters  | Repositories, API clients |
| `utility`   | Utility libraries        | Shared helpers            |

### Advanced Options

```bash
# Create a domain generator with hexagonal patterns
pnpm exec nx g @vibespro/generator:generator order-aggregate \
  --type=domain \
  --withHexagonal=true

# Create a composed generator that wraps Nx generators
pnpm exec nx g @vibespro/generator:generator web-feature \
  --type=component \
  --withComposition=true \
  --compositionGenerators="@nx/react:lib,@nx/react:component"

# Just recipes
just generator-new-hex order-aggregate domain
just generator-new-composed web-feature "@nx/react:lib,@nx/react:component"
```

## Options

| Option                  | Type    | Default    | Description                     |
| ----------------------- | ------- | ---------- | ------------------------------- |
| `name`                  | string  | (required) | Generator name (kebab-case)     |
| `type`                  | enum    | `custom`   | Generator type                  |
| `description`           | string  | auto       | Human-readable description      |
| `directory`             | string  | -          | Subdirectory in generators/     |
| `targetScope`           | enum    | `libs`     | Default scope (apps/libs/tools) |
| `withComposition`       | boolean | `false`    | Enable generator composition    |
| `compositionGenerators` | string  | -          | Comma-separated Nx generators   |
| `withHexagonal`         | boolean | `false`    | Include hexagonal patterns      |
| `withTests`             | boolean | `true`     | Generate test file              |
| `withSpec`              | boolean | `true`     | Generate spec documentation     |
| `tags`                  | string  | -          | Comma-separated default tags    |

## Generated Files

```
generators/<name>/
├── generator.ts          # Main generator logic
├── generator.spec.ts     # Generator tests (if --withTests)
├── schema.json           # Generator options schema
├── schema.d.ts           # TypeScript types
├── generators.json       # Nx generator config
├── package.json          # NPM package definition
├── README.md             # Generator documentation
└── files/                # Template files
    ├── src/
    │   └── index.ts.template
    ├── project.json.template
    └── README.md.template
```

## Development Workflow

1. **Create generator**: `just generator-new my-gen domain`
2. **Customize templates**: Edit `generators/my-gen/files/*`
3. **Update schema**: Edit `generators/my-gen/schema.json`
4. **Add options**: Regenerate types with `just generator-types`
5. **Test**: `pnpm exec vitest run generators/my-gen/generator.spec.ts`
6. **Validate**: `just generator-validate my-gen`

## Architecture

### Composition Pattern

Generators can compose other Nx generators:

```typescript
import { externalSchematic } from "@nx/devkit";

// Call official Nx generator
await externalSchematic("@nx/react", "lib", { name: options.name });
```

### Hexagonal Architecture

Domain generators include support for hexagonal layers:

- Domain: entities, value-objects, events
- Application: ports, use-cases, commands, queries
- Infrastructure: adapters, repositories
- Interface: REST, GraphQL

## Related Commands

```bash
just generator-new [name] [type]     # Create new generator
just generator-validate [name]       # Validate generator
just generator-types                 # Regenerate TypeScript types
just generator-quality               # Run quality checks
just generator-list                  # List available generators
just generator-dry-run [name] [args] # Preview generator output
```

## Traceability

- **PRD**: DEV-PRD-019 (Meta-Generator System)
- **ADR**: DEV-ADR-019 (Generator-First Architecture)
