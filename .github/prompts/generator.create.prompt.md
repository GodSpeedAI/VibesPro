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

This prompt guides you through creating a bespoke Nx generator for the VibesPro platform.

## Prerequisites

Before creating a generator, ensure:

1. You understand what the generator should produce (files, structure, configuration)
2. You've identified the generator type (domain, service, component, adapter, utility, custom)
3. You know the target scope (apps, libs, tools)

## Step 1: Determine Generator Type

Choose the appropriate type based on what the generator creates:

| Type        | Use When                         | Example Output                          |
| ----------- | -------------------------------- | --------------------------------------- |
| `domain`    | Creating domain/entity libraries | `libs/<scope>/<name>/domain/entities`   |
| `service`   | Creating backend services        | `apps/<name>/` with hexagonal structure |
| `component` | Creating UI components           | `libs/<scope>/ui/<name>`                |
| `adapter`   | Creating infrastructure adapters | `libs/<scope>/infrastructure/<name>`    |
| `utility`   | Creating utility libraries       | `libs/shared/<name>`                    |
| `custom`    | Anything else                    | Fully customizable                      |

## Step 2: Create the Generator

Use the meta-generator to scaffold the new generator:

```bash
# Basic generator
just generator-new <name> type=<type>

# With hexagonal architecture patterns
just generator-new-hex <name> type=<type>

# Composed generator (wraps official Nx generators)
just generator-new-composed <name> generators="@nx/js:lib,@nx/react:component"
```

## Step 3: Customize Templates

After scaffolding, customize the templates in `generators/<name>/files/`:

1. **generator.ts** - Main generator logic
2. **schema.json** - Generator options (JSON Schema draft-07)
3. **schema.d.ts** - TypeScript types for options
4. **files/** - Template files that the generator produces

### Template Syntax

Use EJS syntax in template files:

- `<%= variableName %>` - Output variable value
- `<% if (condition) { %>...content...<% } %>` - Conditionals
- `<% items.forEach(item => { %>...<% }); %>` - Loops

Available variables from `names(options.name)`:

- `<%= className %>` - PascalCase (e.g., "MyFeature")
- `<%= propertyName %>` - camelCase (e.g., "myFeature")
- `<%= fileName %>` - kebab-case (e.g., "my-feature")
- `<%= constantName %>` - UPPER_SNAKE_CASE (e.g., "MY_FEATURE")

## Step 4: Update Schema

Edit `generators/<name>/schema.json` to add generator-specific options:

```json
{
    "properties": {
        "name": { "type": "string", "description": "Name of the item" },
        "yourOption": {
            "type": "string",
            "enum": ["option1", "option2"],
            "default": "option1",
            "x-prompt": "Choose an option"
        }
    },
    "required": ["name"]
}
```

## Step 5: Test the Generator

```bash
# Validate the generator
just generator-validate <name>

# Dry run to preview changes
just generator-dry-run <name> sample-project

# Actually run the generator
pnpm exec nx g @vibepro/<name>:<name> sample-project
```

## Step 6: Update Documentation

1. Review the generated spec at `docs/specs/generators/<name>.generator.spec.md`
2. Update the README at `generators/<name>/README.md`
3. Add usage example to documentation

## Reference

- [Generator Spec Template](/docs/specs/generators/GENERATOR_SPEC.md)
- [Nx Generator Guide](https://nx.dev/extending-nx/recipes/local-generators)
- [generators-first.instructions.md](/.github/instructions/generators-first.instructions.md)
