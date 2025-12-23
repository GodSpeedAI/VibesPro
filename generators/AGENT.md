# generators/ Agent Instructions

## 📍 Context

> **Purpose**: Code generators for scaffolding libraries, applications, and components using Nx.
> **When to use**: When creating new projects, libraries, or components - ALWAYS check generators before writing code manually.

## 🔗 Parent Context

See [root copilot-instructions.md](/.github/copilot-instructions.md) for comprehensive project guidance and [AGENT-MAP.md](/AGENT-MAP.md) for navigation across contexts.

## 🚀 Quick Start for AI Agents

```bash
# Create a new generator (the generator that creates generators)
just generator-new my-generator domain

# List available generators
just generator-list

# Validate a generator
just generator-validate my-generator

# Run quality checks
just generator-quality
```

## 🎯 Local Scope

**This directory handles:**

- **Meta-Generator System** - Create new generators on-the-fly
- Custom Nx generators for hexagonal architecture
- Generator templates and schematics
- Code scaffolding following project conventions
- Generator-first workflow enforcement

**Related Policy**: See [.github/instructions/generators-first.instructions.md](/.github/instructions/generators-first.instructions.md) for the **generator-first development policy**.

## 📁 Current Directory Structure

```
generators/
├── generator/                  # META-GENERATOR (creates other generators)
│   ├── generator.ts            # Main meta-generator logic
│   ├── generator.spec.ts       # Unit tests (8 tests)
│   ├── schema.json             # Options schema
│   ├── schema.d.ts             # TypeScript types (auto-generated)
│   ├── generators.json         # Nx generator config
│   ├── package.json            # @vibespro/generator package
│   ├── README.md               # Documentation
│   └── files/                  # Templates for new generators
│       ├── core/               # Core generator files
│       ├── spec/               # Spec documentation template
│       └── tests/              # Test file template
├── service/                    # Service generator (hexagonal architecture)
│   ├── generator.ts            # Service scaffolding logic
│   ├── generator.spec.ts       # Unit tests
│   ├── schema.json             # Options (name, language, directory)
│   ├── schema.d.ts             # TypeScript types
│   ├── generators.json         # Nx generator config
│   ├── package.json            # @vibespro/service-generator package
│   ├── README.md               # Documentation
│   └── files/                  # Service templates
│       ├── python/             # FastAPI templates
│       └── typescript/         # TypeScript templates
├── _utils/                     # Shared generator utilities
│   ├── index.ts                # Re-exports all utilities
│   ├── shared.ts               # Common functions (validateKebabCase, etc.)
│   ├── stack.ts                # Tech stack resolution
│   ├── stack_defaults.ts       # Service defaults from stack
│   └── README.md               # Utility documentation
└── AGENT.md                    # This file
```

### Generator Collection Configuration

**generators.json:**

```json
{
  "$schema": "https://json-schema.org/schema",
  "name": "vibespro",
  "version": "1.0.0",
  "generators": {
    "service": {
      "factory": "./service/generator",
      "schema": "./service/schema.json",
      "description": "Generate a hexagonal service with domain, application, and infrastructure layers",
      "aliases": ["bounded-context", "bc"]
    },
    "component": {
      "factory": "./component/generator",
      "schema": "./component/schema.json",
      "description": "Generate a React component with tests and stories"
    },
    "api-endpoint": {
      "factory": "./api-endpoint/generator",
      "schema": "./api-endpoint/schema.json",
      "description": "Generate a REST API endpoint with controller and tests"
    }
  }
}
```

## 🧭 Routing Rules

### Use This Context When:

- [ ] Scaffolding new libraries, apps, or components
- [ ] Creating custom generators for project-specific patterns
- [ ] Implementing generator-first workflow
- [ ] Need to understand existing generator patterns
- [ ] Modifying or extending generator templates

### Refer to Other Contexts When:

| Context                                   | When to Use                                                |
| ----------------------------------------- | ---------------------------------------------------------- |
| [.github/AGENT.md](/.github/AGENT.md)     | Generator-first policy and workflow                        |
| [libs/AGENT.md](/libs/AGENT.md)           | Understanding hexagonal architecture for service generator |
| [apps/AGENT.md](/apps/AGENT.md)           | Understanding application structures                       |
| [templates/AGENT.md](/templates/AGENT.md) | Copier templates for full project generation               |
| [tests/AGENT.md](/tests/AGENT.md)         | Testing patterns for generated code                        |

## 🔧 Local Conventions

### Generator-First Workflow (CRITICAL)

**ALWAYS check for generators before writing code:**

```bash
# 1. List available generators
pnpm exec nx list

# 2. Check specific plugin generators
pnpm exec nx list @nx/js
pnpm exec nx list @nx/react
pnpm exec nx list @nxlv/python

# 3. Check custom generators
pnpm exec nx list vibespro

# 4. Use generator via just recipe (recommended)
just ai-scaffold name=vibespro:service

# 5. Or directly with Nx
pnpm exec nx g vibespro:service my-service
```

### Generator Implementation Pattern

**Standard generator structure (generator.ts):**

```typescript
import { Tree, formatFiles, generateFiles, names, offsetFromRoot } from '@nx/devkit';
import * as path from 'path';
import { ServiceGeneratorSchema } from './schema';

export async function serviceGenerator(tree: Tree, options: ServiceGeneratorSchema) {
  // 1. Normalize options
  const normalizedOptions = normalizeOptions(tree, options);

  // 2. Generate domain layer
  addDomainLayer(tree, normalizedOptions);

  // 3. Generate application layer
  addApplicationLayer(tree, normalizedOptions);

  // 4. Generate infrastructure layer
  addInfrastructureLayer(tree, normalizedOptions);

  // 5. Update workspace configuration
  updateWorkspaceConfig(tree, normalizedOptions);

  // 6. Format files
  await formatFiles(tree);

  return () => {
    console.log(`✅ Service "${options.name}" created successfully`);
  };
}

function normalizeOptions(tree: Tree, options: ServiceGeneratorSchema): NormalizedSchema {
  const name = names(options.name).fileName;
  const projectDirectory = options.directory ? `${names(options.directory).fileName}/${name}` : name;
  const projectRoot = `libs/${projectDirectory}`;

  return {
    ...options,
    projectName: name,
    projectRoot,
    parsedTags: options.tags ? options.tags.split(',').map((t) => t.trim()) : [],
  };
}

function addDomainLayer(tree: Tree, options: NormalizedSchema) {
  const templatePath = path.join(__dirname, 'files', 'domain');
  const targetPath = `${options.projectRoot}/domain`;

  generateFiles(tree, templatePath, targetPath, {
    ...options,
    ...names(options.projectName),
    offsetFromRoot: offsetFromRoot(options.projectRoot),
    template: '', // Remove __template__ from file names
  });
}

// Similar for application and infrastructure layers...

export default serviceGenerator;
```

### Schema Definition (schema.json)

```json
{
  "$schema": "https://json-schema.org/schema",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "description": "Service name",
      "$default": {
        "$source": "argv",
        "index": 0
      },
      "x-prompt": "What is the name of the service?"
    },
    "directory": {
      "type": "string",
      "description": "Directory where service will be created",
      "x-prompt": "Which directory should this be created in?"
    },
    "language": {
      "type": "string",
      "enum": ["typescript", "python"],
      "default": "typescript",
      "description": "Programming language",
      "x-prompt": {
        "message": "Which language?",
        "type": "list",
        "items": [
          { "value": "typescript", "label": "TypeScript" },
          { "value": "python", "label": "Python" }
        ]
      }
    },
    "tags": {
      "type": "string",
      "description": "Comma-separated tags for Nx boundary rules"
    }
  },
  "required": ["name"]
}
```

### Template Files

**Template file naming convention:**

- Use `__templateFileName__.ts.template` pattern
- Template variables: `<%= propertyName %>`
- Naming helpers: `<%= className %>`, `<%= fileName %>`, `<%= constantName %>`

**Example domain entity template:**

```typescript
// files/domain/src/entities/__name__.entity.ts.template
export class <%= className %> {
  private constructor(
    private readonly _id: <%= className %>Id,
    private readonly _createdAt: Date
  ) {}

  static create(id: <%= className %>Id): <%= className %> {
    return new <%= className %>(id, new Date());
  }

  get id(): <%= className %>Id {
    return this._id;
  }

  get createdAt(): Date {
    return this._createdAt;
  }
}
```

### Naming Utilities

```typescript
// generators/_utils/naming.ts
import { names as nxNames } from '@nx/devkit';

export interface Names {
  name: string; // Original name
  className: string; // PascalCase
  propertyName: string; // camelCase
  constantName: string; // UPPER_SNAKE_CASE
  fileName: string; // kebab-case
}

export function getNames(name: string): Names {
  const nx = nxNames(name);
  return {
    name: nx.name,
    className: nx.className,
    propertyName: nx.propertyName,
    constantName: nx.constantName.toUpperCase(),
    fileName: nx.fileName,
  };
}
```

## 📚 Related Instructions

**Modular instructions that apply here:**

- [.github/instructions/generators-first.instructions.md](/.github/instructions/generators-first.instructions.md) - **Generator-first policy (READ THIS FIRST)**
- [.github/instructions/nx.instructions.md](/.github/instructions/nx.instructions.md) - Nx integration and MCP tools
- [.github/instructions/testing.instructions.md](/.github/instructions/testing.instructions.md) - Testing generated code
- [.github/instructions/security.instructions.md](/.github/instructions/security.instructions.md) - Security in generators

**Relevant prompts:**

- [.github/prompts/spec.implement.prompt.md](/.github/prompts/spec.implement.prompt.md) - Use generators first, then implement

**Related chat modes:**

- `persona.system-architect` - Generator design guidance
- `tdd.red` - Generate test scaffolds

## 💡 Examples

### Example 1: Service Generator Usage

```bash
# Using just recipe (recommended)
just ai-scaffold name=vibespro:service

# Provide options interactively
# Name: orders
# Directory: libs
# Language: typescript
# Tags: type:service,scope:orders

# Result:
# libs/orders/
#   ├── domain/
#   ├── application/
#   └── infrastructure/
```

### Example 2: React Component Generator

```bash
# Generate component with tests and stories
pnpm exec nx g @nx/react:component OrderList \
  --project=web \
  --directory=features/orders \
  --export \
  --style=css

# Result:
# apps/web/src/features/orders/
#   ├── OrderList.tsx
#   ├── OrderList.spec.tsx
#   ├── OrderList.module.css
#   └── OrderList.stories.tsx
```

### Example 3: Custom API Endpoint Generator

```typescript
// generators/api-endpoint/generator.ts
export async function apiEndpointGenerator(tree: Tree, options: ApiEndpointGeneratorSchema) {
  const normalizedOptions = normalizeOptions(tree, options);

  // 1. Generate controller
  generateFiles(tree, path.join(__dirname, 'files', 'controller'), normalizedOptions.controllerPath, {
    ...normalizedOptions,
    ...names(normalizedOptions.name),
    template: '',
  });

  // 2. Generate DTO
  generateFiles(tree, path.join(__dirname, 'files', 'dto'), normalizedOptions.dtoPath, {
    ...normalizedOptions,
    ...names(normalizedOptions.name),
    template: '',
  });

  // 3. Generate tests
  generateFiles(tree, path.join(__dirname, 'files', 'tests'), normalizedOptions.testsPath, {
    ...normalizedOptions,
    ...names(normalizedOptions.name),
    template: '',
  });

  // 4. Update route configuration
  updateRouteConfig(tree, normalizedOptions);

  await formatFiles(tree);
}

// Usage:
// pnpm exec nx g vibespro:api-endpoint createOrder --project=api
```

### Example 4: Python Service Generator

```bash
# Generate Python FastAPI service
pnpm exec nx g @nxlv/python:app orders-api \
  --directory=apps/orders-api \
  --type=fastapi \
  --projectType=application

# Generate Python library
pnpm exec nx g @nxlv/python:lib orders-domain \
  --directory=libs/orders/domain \
  --buildable
```

## ✅ Checklist

### Before Creating a Generator:

- [ ] Identify repeated code pattern
- [ ] Check if existing Nx generator can be extended
- [ ] Design schema.json with validation
- [ ] Plan template structure
- [ ] Consider language-specific variations
- [ ] Document expected usage

### While Building a Generator:

- [ ] Implement normalizeOptions function
- [ ] Use generateFiles for templates
- [ ] Add validation for required options
- [ ] Format generated files
- [ ] Update Nx workspace configuration
- [ ] Add Nx tags for boundary rules
- [ ] Handle error cases gracefully

### After Creating a Generator:

- [ ] Test generator with various inputs
- [ ] Document in generators/README.md
- [ ] Add to generators.json collection
- [ ] Create example usage in generator README
- [ ] Add just recipe for convenience
- [ ] Test with `just ai-scaffold`

## 🔍 Quick Reference

### Common Commands

```bash
# List all generators
pnpm exec nx list

# List specific plugin generators
pnpm exec nx list @nx/react
pnpm exec nx list @nxlv/python

# Show generator options
pnpm exec nx g @nx/react:component --help

# Run generator (dry-run)
pnpm exec nx g vibespro:service my-service --dry-run

# Run generator (with prompt)
just ai-scaffold name=vibespro:service

# Generate with all options
pnpm exec nx g vibespro:service orders \
  --directory=libs \
  --language=typescript \
  --tags=type:service,scope:orders
```

### Built-in Nx Generators

| Generator   | Plugin         | Purpose                       |
| ----------- | -------------- | ----------------------------- |
| `lib`       | `@nx/js`       | TypeScript/JavaScript library |
| `app`       | `@nx/next`     | Next.js application           |
| `component` | `@nx/react`    | React component               |
| `hook`      | `@nx/react`    | React hook                    |
| `app`       | `@nxlv/python` | Python application            |
| `lib`       | `@nxlv/python` | Python library                |

### Naming Conventions in Templates

```typescript
// Input: "user-profile"
names('user-profile') => {
  name: 'user-profile',
  className: 'UserProfile',
  propertyName: 'userProfile',
  constantName: 'USER_PROFILE',
  fileName: 'user-profile'
}
```

### Template Variables

```typescript
// Available in templates:
<%= className %>       // PascalCase
<%= propertyName %>    // camelCase
<%= fileName %>        // kebab-case
<%= constantName %>    // UPPER_SNAKE_CASE
<%= offsetFromRoot %>  // Relative path to root
<%= projectName %>     // Project name
<%= projectRoot %>     // Project root path
```

## 🛡️ Security Considerations

**Security in generators:**

- ⚠️ **Input validation**: Sanitize all user inputs in schema
- ⚠️ **Path traversal**: Validate directory paths
- ⚠️ **Code injection**: Sanitize template variables
- ⚠️ **Default values**: Use secure defaults
- ⚠️ **File permissions**: Set appropriate permissions on generated files

**Example validation:**

```typescript
function normalizeOptions(tree: Tree, options: Schema): NormalizedSchema {
  // Validate name
  if (!/^[a-z][a-z0-9-]*$/.test(options.name)) {
    throw new Error('Name must be lowercase kebab-case');
  }

  // Prevent path traversal
  const directory = options.directory || '';
  if (directory.includes('..')) {
    throw new Error('Directory cannot contain ".."');
  }

  // Sanitize tags
  const tags = options.tags
    ? options.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  return {
    ...options,
    name: options.name.toLowerCase(),
    directory,
    tags,
  };
}
```

## 🎯 Integration with Nx MCP Server

**Available Nx MCP Tools:**

- `nx_workspace` - Get workspace structure and errors
- `nx_generators` - List available generators
- `nx_generator_schema` - Get generator options schema
- `nx_open_generate_ui` - Open generator UI
- `nx_read_generator_log` - Read generator execution log

**Workflow with MCP:**

```bash
# 1. AI uses nx_generators tool to discover available generators
# 2. AI uses nx_generator_schema to understand options
# 3. AI uses nx_open_generate_ui to run generator
# 4. AI uses nx_read_generator_log to verify success
```

## 🎯 Testing Strategy for Generators

### Generator Unit Tests

```typescript
// generators/service/generator.spec.ts
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree, readProjectConfiguration } from '@nx/devkit';
import serviceGenerator from './generator';

describe('service generator', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  it('should generate domain, application, and infrastructure layers', async () => {
    await serviceGenerator(tree, {
      name: 'orders',
      language: 'typescript',
    });

    expect(tree.exists('libs/orders/domain/src/index.ts')).toBeTruthy();
    expect(tree.exists('libs/orders/application/src/index.ts')).toBeTruthy();
    expect(tree.exists('libs/orders/infrastructure/src/index.ts')).toBeTruthy();
  });

  it('should configure Nx project correctly', async () => {
    await serviceGenerator(tree, {
      name: 'orders',
      tags: 'type:service,scope:orders',
    });

    const config = readProjectConfiguration(tree, 'orders-domain');
    expect(config.tags).toContain('type:service');
    expect(config.tags).toContain('scope:orders');
  });
});
```

### Integration Tests

```bash
# Test actual generator execution
pnpm exec nx g vibespro:service test-service --dry-run

# Test generated code compiles
pnpm exec nx build test-service-domain
```

## 🔄 Maintenance

### Regular Tasks

- **Weekly**: Review generator usage patterns
- **Monthly**: Update generator templates with new conventions
- **Quarterly**: Audit generated code quality
- **Per feature**: Consider new generator needs

### When to Update This AGENT.md

- New generators added to collection
- Generator patterns change
- Template conventions evolve
- Nx version updates with breaking changes

### When to Create a New Generator

**Consider creating a generator when:**

- You're repeating the same scaffolding 3+ times
- Pattern has clear structure and conventions
- Would benefit other team members
- Enforces architectural boundaries

**Don't create a generator when:**

- Pattern is still evolving rapidly
- One-off or experimental code
- Better handled by existing generators with options

---

_Last updated: 2025-10-13 | Maintained by: VibesPro Project Team_
_Parent context: [copilot-instructions.md](/.github/copilot-instructions.md) | Navigation: [AGENT-MAP.md](/AGENT-MAP.md)_
