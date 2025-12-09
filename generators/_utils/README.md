# Generator Utilities

This directory contains shared utilities for all VibesPro Nx generators.

## Modules

### `shared.ts`

Common functions and types shared across all generators:

- `validateKebabCase()` - Validates naming conventions
- `normalizeBaseOptions()` - Normalizes raw generator options
- `createDirectoryStructure()` - Creates directories with .gitkeep
- `createHexagonalStructure()` - Creates hexagonal architecture directories
- `logGeneratorStart()` / `logGeneratorComplete()` - Consistent logging
- `warnIfIdempotent()` - Handles re-run scenarios

### `stack.ts`

Tech stack resolution utilities:

- `loadResolvedStack()` - Loads the project's resolved tech stack
- `getCategory()` - Retrieves a category from the tech stack

### `stack_defaults.ts`

Service defaults derivation:

- `deriveServiceDefaults()` - Derives language/framework defaults from tech stack

## Usage

```typescript
import { normalizeBaseOptions, validateKebabCase, createHexagonalStructure, logGeneratorStart, logGeneratorComplete } from "../_utils/shared";
import { deriveServiceDefaults } from "../_utils/stack_defaults";

// In your generator:
export default async function myGenerator(tree: Tree, schema: MySchema) {
    validateKebabCase(schema.name);
    const options = normalizeBaseOptions(schema, "libs");

    logGeneratorStart(options.name, "my-feature", options.projectRoot);

    // Generate files...

    logGeneratorComplete(options.projectRoot, ["Add your domain logic", "Run tests: pnpm test"]);
}
```

## Types

### `BaseGeneratorOptions`

Common options for all generators:

- `name: string` - Kebab-case name
- `directory?: string` - Target directory
- `tags?: string` - Comma-separated tags

### `NormalizedBaseOptions`

Extended options with computed properties:

- `className` - PascalCase version
- `propertyName` - camelCase version
- `fileName` - kebab-case version
- `constantName` - UPPER_SNAKE version
- `parsedTags` - Tags as array
- `projectRoot` - Computed root path

## Hexagonal Architecture

The `HEXAGONAL_DIRS` constant defines the standard hexagonal layers:

- domain/entities
- domain/value-objects
- domain/events
- application/ports
- application/use-cases
- application/commands
- application/queries
- infrastructure/adapters
- infrastructure/repositories
- interface/rest
- interface/graphql
