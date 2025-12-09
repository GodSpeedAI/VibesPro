---
description: Create a new Nx generator using the meta-generator workflow
---

# Generator Creation Workflow

This workflow guides you through creating a new bespoke Nx generator.

## Steps

// turbo

1. Determine the generator type based on what it creates:
    - `domain` - Domain/entity libraries (DDD)
    - `service` - Backend services with hexagonal architecture
    - `component` - UI components
    - `adapter` - Infrastructure adapters (repositories, API clients)
    - `utility` - Utility/helper libraries
    - `custom` - Anything else

// turbo 2. Create the generator scaffold:

```bash
just generator-new <name> <type>
# Example: just generator-new entity-lib domain
```

3. Customize the generator templates in `generators/<name>/files/`:
    - Add `.template` suffix to files that need variable substitution
    - Use EJS syntax: `<%= className %>`, `<%= fileName %>`, etc.

4. Update schema options in `generators/<name>/schema.json`:
    - Add properties for generator options
    - Include `x-prompt` for interactive CLI experience
    - Set defaults where appropriate

// turbo 5. Regenerate TypeScript types:

```bash
just generator-types
```

// turbo 6. Validate the generator:

```bash
just generator-validate <name>
```

// turbo 7. Test with a dry run:

```bash
just generator-dry-run <name> test-project
```

8. Update documentation:
    - Edit `generators/<name>/README.md`
    - Review generated spec at `docs/specs/generators/<name>.generator.spec.md`

## Available Template Variables

- `<%= name %>` - Original input name
- `<%= className %>` - PascalCase (MyFeature)
- `<%= propertyName %>` - camelCase (myFeature)
- `<%= fileName %>` - kebab-case (my-feature)
- `<%= constantName %>` - UPPER_SNAKE_CASE (MY_FEATURE)
- `<%= projectRoot %>` - Full project path

## Quick Reference

```bash
# List available generators
just generator-list

# Run quality checks on all generators
just generator-quality

# Validate a specific generator
just generator-validate <name>

# See generator options
pnpm exec nx g @vibespro/<name>:<name> --help
```
