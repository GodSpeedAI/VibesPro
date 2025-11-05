# TDD Plan: Complete Generator Specification Template

## Quick Start Header

**Purpose**: Enable AI agents to create bespoke Nx generators just-in-time by completing the `GENERATOR_SPEC.md` template, following generator-first principles to minimize code hallucinations.

**Target Audience**: Junior AI agents working in parallel on generator specification development, with basic understanding of TDD methodology and Nx ecosystem.

**Execution Intent**: Sequential TDD approach (RED → GREEN → REFACTOR → REGRESSION) targeting zero TODO placeholders and comprehensive test coverage for AI-guided generator creation.

**Timeline**: 10-15 hours total across 4 phases, with measurable success criteria at each stage.

**Spec IDs**: DEV-PRD-TBD, DEV-SDS-TBD (to be assigned)
**Related Files**:

-   Template: `templates/{{project_slug}}/docs/specs/generators/GENERATOR_SPEC.md`
-   Policy: `.github/instructions/generators-first.instructions.md`
-   Tests: `tests/generators/*.test.ts`
-   Examples: `generators/service/`, `tools/reference/hexddd-generators/`

---

## Phase 1: RED - Write Failing Tests

**Goal**: Define acceptance criteria through failing tests that validate the completed spec template enables successful generator creation.

### Test Suite 1: Spec Template Validation (`tests/generators/spec-template.test.ts`)

```typescript
describe("Generator Spec Template Validation", () => {
    it("should have complete schema.json documentation section", () => {
        const specContent = readSpecTemplate();
        expect(specContent).toContain("JSON Schema draft-07");
        expect(specContent).toContain("properties");
        expect(specContent).toContain("required");
        expect(specContent).toContain("$schema");
        expect(specContent).not.toContain("TODO: option");
    });

    it("should include validation rules examples", () => {
        const specContent = readSpecTemplate();
        expect(specContent).toContain("minLength");
        expect(specContent).toContain("pattern");
        expect(specContent).toContain("enum");
        expect(specContent).toContain("type validation");
    });

    it("should document schema.d.ts type definition patterns", () => {
        const specContent = readSpecTemplate();
        expect(specContent).toContain("export interface");
        expect(specContent).toContain("Schema alignment");
        expect(specContent).not.toContain("TODO: rule");
    });

    it("should reference existing Nx generator schemas", () => {
        const specContent = readSpecTemplate();
        expect(specContent).toContain("@nx/js:library");
        expect(specContent).toContain("@nx/react:component");
        expect(specContent).toContain("@nxlv/python:lib");
    });

    it("should include common generator patterns", () => {
        const specContent = readSpecTemplate();
        expect(specContent).toContain("domain entity pattern");
        expect(specContent).toContain("service adapter pattern");
        expect(specContent).toContain("hexagonal architecture");
    });
});
```

### Test Suite 2: AI Agent Generator Creation (`tests/generators/ai-generator-creation.test.ts`)

```typescript
describe("AI Agent Generator Creation Using Spec", () => {
    it("should generate valid schema.json from spec guidance", async () => {
        // Simulate AI agent reading spec and creating generator
        const generatorSpec = parseGeneratorSpec("domain-entity");
        const schema = await aiGenerateSchema(generatorSpec);

        expect(schema).toHaveProperty("$schema");
        expect(schema).toHaveProperty("properties");
        expect(schema).toHaveProperty("required");
        expect(schema.type).toBe("object");
    });

    it("should create generator.ts with proper Nx devkit usage", async () => {
        const generatorSpec = parseGeneratorSpec("domain-entity");
        const generatorCode = await aiGenerateGenerator(generatorSpec);

        expect(generatorCode).toContain("import { Tree");
        expect(generatorCode).toContain("generateFiles");
        expect(generatorCode).toContain("formatFiles");
        expect(generatorCode).toContain("export default async function");
    });

    it("should produce acceptance tests matching spec criteria", async () => {
        const generatorSpec = parseGeneratorSpec("domain-entity");
        const testCode = await aiGenerateTests(generatorSpec);

        expect(testCode).toContain("describe(");
        expect(testCode).toContain("it('should generate");
        expect(testCode).toContain("expect(result.success).toBe(true)");
        expect(testCode).toContain("expect(result.files).toContain");
    });
});
```

### Test Suite 3: Spec Completeness (`tests/generators/spec-completeness.test.ts`)

```typescript
describe("Generator Spec Template Completeness", () => {
    it("should have no remaining TODO placeholders", () => {
        const specContent = readSpecTemplate();
        const todos = specContent.match(/TODO:/g);
        expect(todos).toBeNull();
    });

    it("should include all required sections", () => {
        const specContent = readSpecTemplate();
        const requiredSections = ["## 3) Inputs / Options (Schema)", "## 8) Acceptance Tests", "Example `schema.json`", "Example `schema.d.ts`", "Validation Rules", "Common Patterns"];
        requiredSections.forEach((section) => {
            expect(specContent).toContain(section);
        });
    });

    it("should provide concrete examples not abstractions", () => {
        const specContent = readSpecTemplate();
        expect(specContent).toMatch(/properties.*name.*type.*string/s);
        expect(specContent).toMatch(/required.*\[.*"name".*\]/s);
    });
});
```

**Acceptance Criteria for RED Phase**:

-   [ ] All test suites written
-   [ ] Tests fail with meaningful error messages
-   [ ] Tests validate spec template completeness
-   [ ] Tests simulate AI agent workflow
-   [ ] Run: `pnpm test tests/generators/spec-*.test.ts` → ALL FAIL

---

## Phase 2: GREEN - Complete Spec Template

**Goal**: Fill in all TODO sections with comprehensive, AI-friendly documentation that makes tests pass.

### Task 2.1: Complete Schema Documentation Section

**File**: `templates/{{project_slug}}/docs/specs/generators/GENERATOR_SPEC.md`
**Lines**: 48-80 (Section 3: Inputs / Options)

**Implementation**:

````markdown
## 3) Inputs / Options (Schema)

> Keep names/types in sync between `schema.json` and `schema.d.ts`.

### Required Options

**name** (string)

-   Description: Primary identifier for the generated artifact
-   Validation: Must match pattern `^[a-z][a-z0-9-]*$` (kebab-case)
-   Example: `user-management`, `order-service`

**type** (string, enum)

-   Description: Type of generator output (domain | service | component | adapter)
-   Validation: Must be one of allowed enum values
-   Example: `domain`, `service`

### Recommended Options

**directory** (string, optional)

-   Description: Target directory relative to workspace root
-   Default: Derived from name and type
-   Example: `libs/user-management/domain`

**boundedContext** (string, optional)

-   Description: DDD bounded context for hexagonal architecture
-   Validation: Must match pattern `^[a-z][a-z0-9-]*$`
-   Example: `identity`, `commerce`

**skipTests** (boolean, optional)

-   Description: Skip generating test files
-   Default: false
-   Use case: Rapid prototyping only

### Validation Rules

**Pattern Validation**

```json
{
    "name": {
        "type": "string",
        "pattern": "^[a-z][a-z0-9-]*$",
        "minLength": 3,
        "maxLength": 50
    }
}
```
````

**Enum Validation**

```json
{
    "type": {
        "type": "string",
        "enum": ["domain", "application", "infrastructure", "interface"]
    }
}
```

**Conditional Validation**

```json
{
    "if": {
        "properties": { "type": { "const": "domain" } }
    },
    "then": {
        "required": ["boundedContext"]
    }
}
```

### Complete Schema Example

**schema.json**

```json
{
    "$schema": "http://json-schema.org/draft-07/schema#",
    "$id": "DomainEntity",
    "title": "Domain Entity Generator",
    "type": "object",
    "properties": {
        "name": {
            "type": "string",
            "description": "Entity name in kebab-case",
            "pattern": "^[a-z][a-z0-9-]*$",
            "minLength": 3,
            "maxLength": 50,
            "$default": {
                "$source": "argv",
                "index": 0
            },
            "x-prompt": "What is the entity name?"
        },
        "boundedContext": {
            "type": "string",
            "description": "DDD bounded context",
            "pattern": "^[a-z][a-z0-9-]*$",
            "x-prompt": "What is the bounded context?"
        },
        "directory": {
            "type": "string",
            "description": "Target directory",
            "default": "libs"
        },
        "skipTests": {
            "type": "boolean",
            "description": "Skip test generation",
            "default": false
        }
    },
    "required": ["name", "boundedContext"],
    "additionalProperties": false
}
```

**schema.d.ts**

```typescript
export interface DomainEntitySchema {
    name: string;
    boundedContext: string;
    directory?: string;
    skipTests?: boolean;
}
```

### Reference Nx Generator Schemas

**@nx/js:library**

-   Properties: name, directory, tags, buildable, publishable
-   Validation: name pattern, directory existence
-   See: `node_modules/@nx/js/src/generators/library/schema.json`

**@nx/react:component**

-   Properties: name, project, style, export
-   Validation: project existence, style enum
-   See: `node_modules/@nx/react/src/generators/component/schema.json`

**@nxlv/python:lib**

-   Properties: name, directory, moduleName, buildable
-   Validation: Python naming conventions
-   See: `node_modules/@nxlv/python/src/generators/lib/schema.json`

### Common Patterns

**Domain Entity Pattern**

```json
{
    "properties": {
        "entityName": { "type": "string", "pattern": "^[A-Z][a-zA-Z0-9]*$" },
        "aggregateRoot": { "type": "boolean", "default": false },
        "valueObjects": { "type": "array", "items": { "type": "string" } }
    }
}
```

**Service Adapter Pattern**

```json
{
    "properties": {
        "serviceName": { "type": "string" },
        "language": { "type": "string", "enum": ["typescript", "python"] },
        "portInterface": { "type": "string" }
    }
}
```

**Hexagonal Architecture Constraints**

-   Domain layer: No external dependencies
-   Application layer: Depends only on domain
-   Infrastructure layer: Implements application ports

````

### Task 2.2: Complete Acceptance Tests Section

**File**: Same
**Lines**: 125-140 (Section 8: Acceptance Tests)

**Implementation**:

```markdown
## 8) Acceptance Tests (for generator once built)

### Test Categories

**1. Generation Success Tests**
```typescript
it('should generate all expected files', async () => {
  const result = await runGenerator('domain-entity', {
    name: 'user',
    boundedContext: 'identity'
  });

  expect(result.success).toBe(true);
  expect(result.files).toContain('libs/user/domain/entities/User.ts');
  expect(result.files).toContain('libs/user/domain/value-objects/UserId.ts');
  expect(result.files).toContain('libs/user/project.json');
});
````

**2. Content Validation Tests**

```typescript
it("should generate correct TypeScript exports", async () => {
    const result = await runGenerator("domain-entity", {
        name: "order",
        boundedContext: "commerce",
    });

    const entityPath = path.join(result.outputPath, "libs/order/domain/entities/Order.ts");
    const content = await fs.promises.readFile(entityPath, "utf-8");

    expect(content).toContain("export class Order");
    expect(content).toContain("constructor(");
    expect(content).toMatch(/private.*id.*OrderId/);
});
```

**3. Schema Validation Tests**

```typescript
it("should reject invalid inputs", async () => {
    const result = await runGenerator("domain-entity", {
        name: "Invalid Name With Spaces",
        boundedContext: "test",
    });

    expect(result.success).toBe(false);
    expect(result.errorMessage).toContain("pattern");
});
```

**4. Idempotency Tests**

```typescript
it("should produce no diff when re-run", async () => {
    const firstRun = await runGenerator("domain-entity", options);
    const secondRun = await runGenerator("domain-entity", options);

    expect(secondRun.filesChanged).toEqual([]);
});
```

**5. Project Graph Tests**

```typescript
it("should maintain valid project graph", async () => {
    await runGenerator("domain-entity", options);

    const { stdout } = await execAsync("pnpm nx graph --focus=user");
    expect(stdout).not.toContain("error");
});
```

**6. Target Execution Tests**

```typescript
it("should successfully run generated targets", async () => {
    await runGenerator("domain-entity", options);

    const { stdout, stderr } = await execAsync("pnpm nx test user-domain");
    expect(stderr).toBe("");
    expect(stdout).toContain("PASS");
});
```

### Dry Run Verification

```bash
pnpm nx g @myorg/vibepro:domain-entity user \
  --boundedContext=identity \
  --dry-run
```

**Expected Output**:

```
CREATE libs/user/domain/entities/User.ts
CREATE libs/user/domain/value-objects/UserId.ts
CREATE libs/user/domain/events/UserCreated.ts
CREATE libs/user/project.json
UPDATE nx.json (add user-domain project)
```

### Module Boundary Validation

```bash
pnpm nx run-many --target=lint --all
```

**Expected**: No module boundary violations per `.eslintrc.json` rules

### Regression Checklist

-   [ ] All existing generators still pass tests
-   [ ] No breaking changes to generator API
-   [ ] Nx graph remains acyclic
-   [ ] Build targets cacheable
-   [ ] Generated code passes linting
-   [ ] Documentation updated

````

### Task 2.3: Add Implementation Hints

**File**: Same
**Lines**: 115-123 (Section 7: Implementation Hints)

**Implementation**:

```markdown
## 7) Implementation Hints (for AI generator author)

### Nx Devkit Patterns

**File Generation**
```typescript
import { generateFiles, Tree, formatFiles, names } from '@nx/devkit';
import * as path from 'path';

export default async function (tree: Tree, schema: MySchema) {
  const normalizedOptions = {
    ...schema,
    ...names(schema.name), // Provides: name, fileName, className, propertyName, constantName
  };

  generateFiles(
    tree,
    path.join(__dirname, 'files'), // Template directory
    `libs/${normalizedOptions.fileName}`, // Target directory
    normalizedOptions // Template variables
  );

  await formatFiles(tree);
}
````

**Project Configuration**

```typescript
import { addProjectConfiguration, readProjectConfiguration, updateProjectConfiguration } from "@nx/devkit";

// Add new project
addProjectConfiguration(tree, projectName, {
    root: `libs/${projectName}`,
    projectType: "library",
    sourceRoot: `libs/${projectName}/src`,
    targets: {
        build: {
            executor: "@nx/js:tsc",
            options: {
                /* ... */
            },
        },
    },
    tags: ["scope:domain", "type:feature"],
});

// Update existing project
const config = readProjectConfiguration(tree, projectName);
config.tags = [...config.tags, "type:util"];
updateProjectConfiguration(tree, projectName, config);
```

**Validation Patterns**

```typescript
function validateSchema(schema: MySchema): void {
    if (!/^[a-z][a-z0-9-]*$/.test(schema.name)) {
        throw new Error(`Invalid name: ${schema.name}. Must be kebab-case.`);
    }

    // Check for existing project
    const projectGraph = readProjectGraph();
    if (projectGraph.nodes[schema.name]) {
        throw new Error(`Project ${schema.name} already exists`);
    }
}
```

**Template File Patterns**

Use `__fileName__` and `__className__` in template filenames:

```
files/
  src/
    __fileName__.ts.template
    __fileName__.spec.ts.template
```

Template content with EJS:

```typescript
// files/src/__fileName__.ts.template
export class <%= className %> {
  constructor(private id: <%= className %>Id) {}

  <% if (includeTimestamps) { %>
  readonly createdAt = new Date();
  <% } %>
}
```

**Dependency Management**

```typescript
import { addDependenciesToPackageJson, installPackagesTask } from "@nx/devkit";

export default async function (tree: Tree, schema: MySchema) {
    // ... generation logic

    addDependenciesToPackageJson(
        tree,
        { "my-runtime-dep": "^1.0.0" }, // dependencies
        { "my-dev-dep": "^1.0.0" }, // devDependencies
    );

    return () => {
        installPackagesTask(tree);
    };
}
```

### Hexagonal Architecture Enforcement

**Domain Layer Constraints**

```typescript
// Ensure domain has NO external dependencies
addProjectConfiguration(tree, `${domain}-domain`, {
    // ...
    tags: ["scope:domain", "type:domain-logic"],
    implicitDependencies: [], // No deps allowed
});
```

**Application Layer Ports**

```typescript
// Application depends ONLY on domain
addProjectConfiguration(tree, `${domain}-application`, {
    // ...
    tags: ["scope:application", "type:use-case"],
    implicitDependencies: [`${domain}-domain`],
});
```

**Infrastructure Adapters**

```typescript
// Infrastructure implements application ports
addProjectConfiguration(tree, `${domain}-infrastructure`, {
    // ...
    tags: ["scope:infrastructure", "type:adapter"],
    implicitDependencies: [`${domain}-application`],
});
```

### Error Handling

```typescript
try {
    validateSchema(schema);
    // ... generation logic
} catch (error) {
    console.error(`Generator failed: ${error.message}`);
    throw error;
}
```

### Testing Your Generator

```typescript
// tests/generators/my-generator.test.ts
import { createTreeWithEmptyWorkspace } from "@nx/devkit/testing";
import myGenerator from "./generator";

describe("my-generator", () => {
    let tree: Tree;

    beforeEach(() => {
        tree = createTreeWithEmptyWorkspace();
    });

    it("should generate files", async () => {
        await myGenerator(tree, { name: "test" });

        expect(tree.exists("libs/test/src/index.ts")).toBeTruthy();
    });
});
```

````

### Task 2.4: Add Common Patterns Section

**File**: Same
**Insert after Section 3**

**Implementation**:

```markdown
## 3.5) Common Generator Patterns

### Pattern 1: Domain Entity Generator
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "entityName": {
      "type": "string",
      "pattern": "^[A-Z][a-zA-Z0-9]*$",
      "description": "Entity class name (PascalCase)"
    },
    "boundedContext": {
      "type": "string",
      "enum": ["identity", "commerce", "billing", "analytics"]
    },
    "aggregateRoot": {
      "type": "boolean",
      "default": false,
      "description": "Is this an aggregate root?"
    },
    "valueObjects": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Associated value objects"
    }
  },
  "required": ["entityName", "boundedContext"]
}
````

### Pattern 2: Service/Adapter Generator

```json
{
    "$schema": "http://json-schema.org/draft-07/schema#",
    "type": "object",
    "properties": {
        "serviceName": {
            "type": "string",
            "pattern": "^[a-z][a-z0-9-]*$"
        },
        "language": {
            "type": "string",
            "enum": ["typescript", "python"],
            "default": "typescript"
        },
        "framework": {
            "type": "string",
            "enum": ["express", "fastapi", "nestjs"],
            "description": "Web framework (language-specific)"
        },
        "implementsPorts": {
            "type": "array",
            "items": { "type": "string" },
            "description": "Application ports this adapter implements"
        }
    },
    "required": ["serviceName", "language"]
}
```

### Pattern 3: Component Generator

```json
{
    "$schema": "http://json-schema.org/draft-07/schema#",
    "type": "object",
    "properties": {
        "name": {
            "type": "string",
            "pattern": "^[A-Z][a-zA-Z0-9]*$"
        },
        "project": {
            "type": "string",
            "description": "Nx project name",
            "x-prompt": "Which project should this component belong to?"
        },
        "style": {
            "type": "string",
            "enum": ["css", "scss", "styled-components", "none"],
            "default": "css"
        },
        "export": {
            "type": "boolean",
            "default": true,
            "description": "Export from index.ts"
        }
    },
    "required": ["name", "project"]
}
```

### Pattern 4: Conditional Schema

```json
{
    "properties": {
        "generatorType": {
            "type": "string",
            "enum": ["library", "application"]
        }
    },
    "if": {
        "properties": { "generatorType": { "const": "library" } }
    },
    "then": {
        "properties": {
            "buildable": { "type": "boolean", "default": true },
            "publishable": { "type": "boolean", "default": false }
        }
    },
    "else": {
        "properties": {
            "port": { "type": "number", "default": 3000 },
            "serverType": { "type": "string", "enum": ["web", "api"] }
        }
    }
}
```

### Pattern 5: Interactive Prompts

```json
{
    "properties": {
        "name": {
            "type": "string",
            "x-prompt": "What is the name of your library?"
        },
        "style": {
            "type": "string",
            "enum": ["css", "scss", "less"],
            "x-prompt": {
                "message": "Which stylesheet format would you like to use?",
                "type": "list",
                "items": [
                    { "value": "css", "label": "CSS" },
                    { "value": "scss", "label": "SASS(.scss)" },
                    { "value": "less", "label": "LESS" }
                ]
            }
        }
    }
}
```

````

**Acceptance Criteria for GREEN Phase**:
- [ ] All TODOs replaced with concrete documentation
- [ ] Schema examples use JSON Schema draft-07
- [ ] Validation rules include pattern, enum, conditional
- [ ] References to @nx/js, @nx/react, @nxlv/python schemas
- [ ] Common patterns: domain, service, component, adapter
- [ ] Acceptance test templates match existing test patterns
- [ ] Implementation hints use @nx/devkit properly
- [ ] Run: `pnpm test tests/generators/spec-*.test.ts` → ALL PASS

---

## Phase 3: REFACTOR - Optimize Spec Clarity

**Goal**: Improve spec template for maximum AI comprehension and minimal ambiguity.

### Task 3.1: Consolidate Redundancy

**Actions**:
1. Merge overlapping examples (e.g., multiple schema.json examples)
2. Create cross-references instead of duplication
3. Standardize terminology (use "generator" not "schematic")
4. Ensure consistency with `.github/instructions/generators-first.instructions.md`

### Task 3.2: Add Decision Trees

**Add to Section 1 (Purpose & Scope)**:

```markdown
### Decision Tree: When to Use This Generator

```mermaid
graph TD
    A[Need to create code?] -->|Yes| B{Exists already?}
    B -->|No| C{Standard pattern?}
    B -->|Yes| D[Use existing generator]
    C -->|Yes| E[Use Nx built-in generator]
    C -->|No| F{Complex domain logic?}
    F -->|Yes| G[Create custom generator from this spec]
    F -->|No| H[Write minimal code manually]
````

**Use this generator pattern when:**

-   Creating domain entities with DDD patterns
-   Scaffolding hexagonal architecture layers
-   Generating services with standardized structure
-   Creating components with organizational conventions

**Do NOT use when:**

-   Adding simple utility function to existing module
-   Making one-off prototype
-   Modifying existing generated code

````

### Task 3.3: Enhance AI Guidance

**Add Section 13: AI Agent Instructions**:

```markdown
## 13) AI Agent Instructions

### Generator Creation Workflow

**Step 1: Parse Spec Requirements**
```typescript
interface GeneratorRequirements {
  name: string;
  purpose: string;
  schemaProperties: Record<string, JSONSchemaProperty>;
  outputArtifacts: string[];
  acceptanceCriteria: TestCase[];
}
````

**Step 2: Generate schema.json**

-   Use JSON Schema draft-07 format
-   Include $schema, $id, type, properties, required
-   Add x-prompt for interactive properties
-   Validate with: `npx ajv validate -s schema.json -d test-data.json`

**Step 3: Generate schema.d.ts**

-   Must align EXACTLY with schema.json properties
-   Use TypeScript interfaces, not types
-   Export as named export matching generator name

**Step 4: Generate generator.ts**

-   Import from '@nx/devkit': Tree, generateFiles, formatFiles, names
-   Validate inputs first
-   Use generateFiles for templates
-   Call formatFiles before returning
-   Return installPackagesTask if dependencies added

**Step 5: Generate Test Suite**

-   Use patterns from `tests/generators/*.test.ts`
-   Test: success, validation, content, idempotency, graph integrity
-   Use `createTreeWithEmptyWorkspace()` from '@nx/devkit/testing'

**Step 6: Validate Generator**

```bash
pnpm nx g .:<generator-name> test-name --dry-run
pnpm test tests/generators/<generator-name>.test.ts
pnpm nx graph --focus=test-name
```

### Common Pitfalls to Avoid

❌ **DON'T**: Use 'any' type in schema.d.ts
✅ **DO**: Use proper TypeScript types with validation

❌ **DON'T**: Mutate tree without validation
✅ **DO**: Validate schema inputs before file generation

❌ **DON'T**: Hardcode paths
✅ **DO**: Use path.join and names() helper

❌ **DON'T**: Skip formatFiles()
✅ **DO**: Always format at the end

❌ **DON'T**: Create circular dependencies
✅ **DO**: Respect hexagonal architecture layers

````

### Task 3.4: Add Troubleshooting Section

**Add Section 14: Troubleshooting**:

```markdown
## 14) Troubleshooting

### Schema Validation Errors

**Error**: `"Property 'x' is required"`
```json
// Fix: Add to required array
{ "required": ["name", "x"] }
````

**Error**: `"Value does not match pattern"`

```json
// Fix: Adjust pattern or input
{ "pattern": "^[a-z][a-z0-9-]*$" }
```

### Generator Runtime Errors

**Error**: `Cannot find module '@nx/devkit'`

```bash
# Fix: Install dependencies
pnpm add -D @nx/devkit
```

**Error**: `Tree.exists is not a function`

```typescript
// Fix: Ensure tree is passed correctly
export default async function (tree: Tree, schema: MySchema) {
    // Use tree, not host
}
```

### Test Failures

**Error**: `result.files does not contain expected file`

```typescript
// Debug: Check template path and output path
console.log("Template dir:", path.join(__dirname, "files"));
console.log("Output dir:", outputPath);
```

**Error**: `Generated content doesn't match`

```typescript
// Debug: Log actual content
const content = tree.read(filePath, "utf-8");
console.log("Actual content:", content);
```

````

**Acceptance Criteria for REFACTOR Phase**:
- [ ] No redundant examples
- [ ] Clear decision trees for when to use
- [ ] AI-specific instructions added
- [ ] Troubleshooting guide complete
- [ ] Consistent with generator-first policy
- [ ] Run: `pnpm lint` → PASS
- [ ] Run: `pnpm test tests/generators/spec-*.test.ts` → ALL PASS

---

## Phase 4: REGRESSION - Ensure No Breaks

**Goal**: Verify spec changes don't break existing generator creation patterns.

### Task 4.1: Test Existing Generators

**Validation**:
```bash
# Service generator still works
pnpm nx g service:service test-service --language=python --dry-run

# Domain generator (if exists) still works
pnpm nx g domain test-domain --boundedContext=test --dry-run

# All generator tests pass
pnpm test tests/generators/**/*.test.ts
````

**Expected**: All commands succeed, all tests pass

### Task 4.2: Validate Template Generation

**Test that the spec template itself generates correctly**:

```bash
# From template repo root
just test-generation

# Verify spec exists in generated output
cd ../test-output
ls docs/specs/generators/GENERATOR_SPEC.md

# Verify no TODOs remain
grep -i "TODO" docs/specs/generators/GENERATOR_SPEC.md
# Expected: no matches
```

### Task 4.3: Cross-Reference Documentation

**Ensure consistency across**:

-   `.github/instructions/generators-first.instructions.md`
-   `.github/instructions/testing.instructions.md`
-   `docs/nx-generators-guide.md`
-   `AGENTS.md` (Nx configuration section)
-   `templates/{{project_slug}}/docs/specs/generators/GENERATOR_SPEC.md`

**Validation**:

```bash
# Check for conflicting guidance
grep -r "generator" .github/instructions/ | grep -v ".git"
grep -r "schema.json" docs/ | grep -v ".git"
```

### Task 4.4: AI Agent Dry Run

**Simulate AI agent using completed spec**:

1. Read completed spec template
2. Generate test generator following spec instructions
3. Verify generator produces expected output
4. Confirm tests pass

**Script**: `tests/generators/ai-agent-simulation.test.ts`

```typescript
describe("AI Agent Generator Simulation", () => {
    it("should successfully create generator from spec", async () => {
        // 1. Read spec
        const spec = await readGeneratorSpec();

        // 2. Simulate AI parsing spec
        const generatorPlan = parseSpecToGeneratorPlan(spec);

        // 3. Generate files
        const generatorFiles = await aiCreateGenerator(generatorPlan);

        // 4. Validate output
        expect(generatorFiles).toHaveProperty("schema.json");
        expect(generatorFiles).toHaveProperty("schema.d.ts");
        expect(generatorFiles).toHaveProperty("generator.ts");
        expect(generatorFiles).toHaveProperty("generator.spec.ts");

        // 5. Test generator
        const testResult = await runGeneratedGenerator(generatorFiles, {
            name: "test-entity",
            boundedContext: "test",
        });

        expect(testResult.success).toBe(true);
    });
});
```

### Task 4.5: Integration Test

**Full workflow test**:

```bash
#!/bin/bash
# tests/shell/generator-spec-workflow_spec.sh

Describe 'Generator Spec Workflow'
  It 'completes full generator creation cycle'
    # 1. Generate from template
    just test-generation

    # 2. Navigate to generated project
    cd ../test-output

    # 3. Read spec
    spec_exists=$(test -f docs/specs/generators/GENERATOR_SPEC.md && echo "yes" || echo "no")
    The variable spec_exists should equal "yes"

    # 4. Spec has no TODOs
    todo_count=$(grep -c "TODO:" docs/specs/generators/GENERATOR_SPEC.md || echo "0")
    The variable todo_count should equal "0"

    # 5. Create test generator following spec
    mkdir -p tools/vibepro/src/generators/test-gen
    # ... (create generator files per spec)

    # 6. Run test generator
    pnpm nx g @myorg/vibepro:test-gen my-test --dry-run
    The status should be success

    # 7. Verify output
    The output should include "CREATE"
  End
End
```

**Acceptance Criteria for REGRESSION Phase**:

-   [ ] All existing generator tests pass
-   [ ] Template generation produces spec without TODOs
-   [ ] No conflicting documentation
-   [ ] AI agent simulation succeeds
-   [ ] Integration test passes
-   [ ] Run: `just spec-guard` → PASS
-   [ ] Run: `pnpm test` → ALL PASS

---

## Success Metrics

### Quantitative

-   [ ] 0 TODO placeholders in final spec
-   [ ] 100% test coverage for spec validation
-   [ ] All 15+ test cases pass
-   [ ] Generator creation time < 5 minutes (AI agent)
-   [ ] 0 regressions in existing generators

### Qualitative

-   [ ] AI agent can create valid generator from spec alone
-   [ ] Spec is clear without external documentation
-   [ ] Examples are copy-paste ready
-   [ ] Spec follows generator-first principle
-   [ ] Consistent with project conventions

---

## Implementation Order

1. **RED Phase** (Est: 2-3 hours)

    - Write spec-template.test.ts
    - Write ai-generator-creation.test.ts
    - Write spec-completeness.test.ts
    - Verify all fail

2. **GREEN Phase** (Est: 4-6 hours)

    - Complete Section 3 (Schema)
    - Complete Section 8 (Acceptance Tests)
    - Complete Section 7 (Implementation Hints)
    - Add Common Patterns section
    - Verify all tests pass

3. **REFACTOR Phase** (Est: 2-3 hours)

    - Consolidate redundancy
    - Add decision trees
    - Add AI agent instructions
    - Add troubleshooting guide
    - Verify tests still pass

4. **REGRESSION Phase** (Est: 2-3 hours)
    - Test existing generators
    - Validate template generation
    - Cross-reference docs
    - AI agent dry run
    - Full integration test
    - Verify all quality gates

**Total Estimated Time**: 10-15 hours

---

## References

**Existing Generators**:

-   `generators/service/schema.json` - Service generator schema
-   `generators/service/generator.ts` - Service generator implementation
-   `tools/reference/hexddd-generators/` - Reference hexagonal DDD generators

**Tests**:

-   `tests/generators/service.logfire.test.ts` - Service generator tests
-   `tests/generators/domain.test.ts` - Domain generator tests
-   `tests/generators/utils.ts` - Test utilities

**Documentation**:

-   `.github/instructions/generators-first.instructions.md` - Generator-first policy
-   `.github/instructions/testing.instructions.md` - Testing guidelines
-   `docs/nx-generators-guide.md` - Nx generators guide
-   `.tessl/usage-specs/tessl/npm-nx/docs/generators-executors.md` - Nx devkit docs

**External**:

-   Nx Devkit API: https://nx.dev/extending-nx/recipes/local-generators
-   JSON Schema Draft-07: http://json-schema.org/draft-07/schema
-   Context7 Nx docs: Cached from earlier query

---

## Commit Message Template

```
feat(generators): complete GENERATOR_SPEC template [DEV-PRD-TBD]

Complete the generator specification template to enable AI agents to
create bespoke Nx generators following generator-first principles.

Changes:
- Add comprehensive schema.json documentation with JSON Schema draft-07 examples
- Include common patterns: domain entities, services, components, adapters
- Document validation rules: pattern, enum, conditional schemas
- Add acceptance test templates matching existing test patterns
- Include Nx devkit implementation hints and best practices
- Reference existing Nx generator schemas from @nx/js, @nx/react, @nxlv/python
- Add AI agent instructions for generator creation workflow
- Add troubleshooting guide for common issues

Testing:
- Added spec-template.test.ts for template validation
- Added ai-generator-creation.test.ts for AI workflow simulation
- Added spec-completeness.test.ts for TODO verification
- All existing generator tests pass (regression)

Refs: DEV-SDS-TBD, ADR-TBD
Risk: None - additive change, no breaking changes
```

---

**END OF TDD PLAN**
