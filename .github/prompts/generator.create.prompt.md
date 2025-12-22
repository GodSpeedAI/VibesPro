---
kind: prompt
domain: generators
task: create
thread: generator-create
matrix_ids: [DEV-PRD-019, DEV-ADR-019]
budget: M
mode: agent
description: Create a new Nx generator using the meta-generator
tools: [run_command, view_file, edit_file]
---

# Generator Creation Workflow

This prompt guides AI agents through creating bespoke Nx generators for the VibesPro platform.

## Quick Start (TL;DR)

```bash
# Create a new generator in one command
just generator-new <name> <type>

# Example: Create a domain generator for entities
just generator-new entity-lib domain

# Then customize templates at: generators/<name>/files/
```

## Prerequisites

Before creating a generator, ensure:

1. You understand what the generator should produce (files, structure, configuration)
2. You've identified the generator type (domain, service, component, adapter, utility, custom)
3. You know the target scope (apps, libs, tools)

## Generator Types Reference

| Type        | Description             | Default Output                          | Use Case                  |
| ----------- | ----------------------- | --------------------------------------- | ------------------------- |
| `domain`    | Domain entity libraries | `libs/<scope>/<name>/domain/entities`   | DDD aggregates, entities  |
| `service`   | Backend services        | `apps/<name>/` with hexagonal structure | APIs, microservices       |
| `component` | UI components           | `libs/<scope>/ui/<name>`                | React/Vue components      |
| `adapter`   | Infrastructure adapters | `libs/<scope>/infrastructure/<name>`    | Repositories, API clients |
| `utility`   | Utility libraries       | `libs/shared/<name>`                    | Shared helpers            |
| `custom`    | Fully customizable      | Configurable                            | Anything else             |

## Step-by-Step Workflow

### Step 1: Choose Generator Type

Ask yourself:

- **What artifacts will this generator create?** (files, directories, configs)
- **Where should they be placed?** (apps, libs, specific directories)
- **What customization is needed?** (options, variants, conditions)

### Step 2: Create the Generator

```bash
# Basic custom generator
just generator-new my-feature custom

# Domain generator with hexagonal patterns
just generator-new-hex order-aggregate domain

# Component generator
just generator-new button-lib component

# Composed generator (wraps official Nx generators)
just generator-new-composed web-feature "@nx/react:lib,@nx/react:component"
```

### Step 3: Customize the Generator

After scaffolding, customize files in `generators/<name>/`:

#### A. Main Generator Logic (`generator.ts`)

```typescript
import { Tree, formatFiles, generateFiles, names } from '@nx/devkit';
import * as path from 'path';
import { MyGeneratorSchema } from './schema.d';

export async function myGenerator(tree: Tree, schema: MyGeneratorSchema) {
    const options = normalizeOptions(schema);

    // Generate files from templates
    generateFiles(tree, path.join(__dirname, 'files'), options.projectRoot, {
        ...options,
        ...names(options.name),
        template: '', // Removes __template__ from file names
    });

    await formatFiles(tree);

    return () => {
        console.log(`✅ Created ${options.name}`);
    };
}

export default myGenerator;
```

#### B. Schema Options (`schema.json`)

```json
{
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "My Generator Options",
    "description": "Options for my generator",
    "type": "object",
    "properties": {
        "name": {
            "type": "string",
            "description": "Name of the item to create",
            "pattern": "^[a-z][a-z0-9]*(-[a-z0-9]+)*$",
            "$default": { "$source": "argv", "index": 0 },
            "x-prompt": "What is the name?"
        },
        "scope": {
            "type": "string",
            "description": "Scope/domain for the item",
            "x-prompt": "What scope should this belong to?"
        },
        "withTests": {
            "type": "boolean",
            "default": true,
            "description": "Generate test files",
            "x-prompt": "Include tests?"
        }
    },
    "required": ["name"]
}
```

#### C. Template Files (`files/`)

Use EJS syntax in template files:

```typescript
// files/src/index.ts.template
export * from './<%= fileName %>';
```

```typescript
// files/src/__fileName__.ts.template
export class <%= className %> {
  constructor(private readonly id: string) {}

  getId(): string {
    return this.id;
  }
}
```

Available template variables:

- `<%= name %>` - Original name
- `<%= className %>` - PascalCase (e.g., "MyFeature")
- `<%= propertyName %>` - camelCase (e.g., "myFeature")
- `<%= fileName %>` - kebab-case (e.g., "my-feature")
- `<%= constantName %>` - UPPER_SNAKE_CASE (e.g., "MY_FEATURE")

### Step 4: Regenerate Types

After modifying `schema.json`:

```bash
just generator-types
```

This generates `schema.d.ts` from your JSON Schema.

### Step 5: Validate and Test

```bash
# Validate schema and structure
just generator-validate <name>

# Run quality checks
just generator-quality

# Dry run to preview changes
just generator-dry-run <name> sample-project

# Actually run the generator
pnpm exec nx g @vibespro/<name>:<name> sample-project
```

### Step 6: Document

1. Update `generators/<name>/README.md` with usage examples
2. Review spec at `docs/specs/generators/<name>.generator.spec.md`
3. Add to this prompt's examples if reusable pattern

## AI Agent Quick Actions

### Discover Available Generators

```bash
# List all available generators
just generator-list

# See detailed usage for a generator
pnpm exec nx g @vibespro/<name>:<name> --help
```

### Common Generator Patterns

#### Pattern: Domain Entity Generator

```bash
just generator-new entity domain
# Then customize to create:
# - Entity class with identity
# - Value objects
# - Domain events
# - Repository port interface
```

#### Pattern: Feature Module Generator

```bash
just generator-new-composed feature-module "@nx/react:lib"
# Then add:
# - Feature slice structure
# - Component templates
# - State management setup
```

#### Pattern: API Endpoint Generator

```bash
just generator-new endpoint adapter
# Then customize for:
# - Controller/handler
# - DTOs
# - Validation
# - OpenAPI annotations
```

## Troubleshooting

### Generator Not Found

```bash
# Ensure pnpm workspace includes generators
cat pnpm-workspace.yaml
# Should contain: - 'generators/*'

# Reinstall to link local generators
pnpm install
```

### Template Errors

- **"<variable> is not defined"**: Check that template variables are passed in `generateFiles()`
- **Nested EJS not working**: Use escaped syntax `<%%= %>` for templates within templates
- **Type errors**: Run `just generator-types` after modifying schema.json

### Validation Failures

```bash
# Check schema compliance
just generator-schemas-validate

# Run full quality check
just generator-quality
```

## Reference

- [Meta-Generator README](/generators/generator/README.md)
- [Generator Utilities](/generators/_utils/README.md)
- [Nx Generator Guide](https://nx.dev/extending-nx/recipes/local-generators)
- [generators-first.instructions.md](/.github/instructions/generators-first.instructions.md)

## Examples of Successful Generators

1. **@vibespro/generator** - Creates new generators (meta-generator)
2. **@vibespro/service-generator** - Creates hexagonal backend services

Use these as reference when creating new generators.
