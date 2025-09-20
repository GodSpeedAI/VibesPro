# Copilot Instructions for HexDDD-VibePDK Merger Project

## Project Overview

You are working on a strategic merger of two sophisticated development platforms:

- **HexDDD**: Nx-based monorepo with hexagonal architecture + DDD patterns
- **VibePDK**: AI-enhanced Cookiecutter template generator with spec-driven workflows

**Target Architecture**: Generator-first integration platform using Copier templates with tsink temporal database for AI-enhanced development.

## Core Principles

### 1. Architecture-First Development

- **Hexagonal Architecture**: Strict port/adapter patterns with domain isolation
- **Domain-Driven Design**: Rich domain models, bounded contexts, ubiquitous language
- **Generator-First**: All code generation through Copier templates, not runtime abstractions
- **Type Safety**: Unified type generation from database schema to TypeScript/Python

### 2. Technology Stack Constraints

- **Node.js**: pnpm for package management, Nx for monorepo orchestration
- **Python**: uv for dependency management, mypy strict mode required
- **Build System**: justfile for task automation, hybrid Nx/direct detection
- **Templates**: Copier (not Cookiecutter), Jinja2 templating with YAML configuration
- **Database**: tsink time-series database for temporal specification management

### 3. Development Workflow

- **Spec-Driven**: All features begin with specification documents (ADR/PRD/SDS/TS)
- **TDD Mandatory**: RED → GREEN → REFACTOR → REGRESSION for all functional changes
- **Traceability**: Every commit references specification IDs (MERGE-TASK-###)
- **AI-Enhanced**: Use temporal learning system for pattern recognition and suggestions

## File Structure Understanding

```
merged-project/
├── copier.yml                 # Template configuration (not cookiecutter.json)
├── templates/                 # Jinja2 templates for code generation
│   ├── libs/{{domain_name}}/  # Domain layer templates
│   ├── apps/{{app_name}}/     # Application layer templates
│   └── tools/                 # Tooling and infrastructure templates
├── hooks/                     # Copier pre/post generation hooks
│   ├── pre_gen.py            # Validation and setup
│   └── post_gen.py           # Type generation and finalization
├── temporal_db/              # tsink time-series database
│   ├── specifications.tsinkdb # Temporal spec storage
│   └── patterns.tsinkdb      # AI learning patterns
└── tools/
    ├── migration/            # HexDDD/VibePDK migration tools
    ├── type-generator/       # Cross-language type generation
    └── ai/                   # Context management and pattern recognition
```

## Coding Standards

### TypeScript/JavaScript

```typescript
// Use strict mode always
export interface ContextSource {
  readonly id: string;
  readonly priority: number;
  readonly tokenCost: number;
  getContent(): Promise<string>;
}

// Prefer composition over inheritance
export class AIContextManager {
  constructor(private readonly budgetConfig: TokenBudget, private readonly sources: readonly ContextSource[]) {}
}

// Use discriminated unions for type safety
type GeneratorType = { type: 'domain'; config: DomainConfig } | { type: 'application'; config: AppConfig };
```

### Python

```python
# Use strict typing with mypy
from typing import Protocol, Optional, List
from datetime import datetime
import asyncio

class SpecificationRepository(Protocol):
    async def store(self, spec: SpecificationRecord) -> None: ...
    async def get_latest(self, spec_type: str, identifier: str) -> Optional[SpecificationRecord]: ...

# Use dataclasses for data structures
from dataclasses import dataclass
from enum import StrEnum

class SpecificationType(StrEnum):
    ADR = "ADR"
    PRD = "PRD"
    SDS = "SDS"
    TS = "TS"

@dataclass(frozen=True, kw_only=True)
class SpecificationRecord:
    id: str
    spec_type: SpecificationType
    content: str
    timestamp: datetime
```

### Jinja2 Templates

```jinja2
{# Use descriptive variable names #}
{# templates/libs/{{domain_name}}/domain/entities/{{entity_name}}.ts.j2 #}
export class {{entity_name | capitalize}} {
  constructor(
    {% for field in entity_fields -%}
    private readonly {{field.name}}: {{field.type}},
    {% endfor -%}
  ) {}

  {% if include_validation -%}
  validate(): ValidationResult {
    // Generated validation logic
  }
  {% endif -%}
}

{# Use conditional blocks for framework variations #}
{% if framework == 'next' -%}
// Next.js specific implementation
{% elif framework == 'remix' -%}
// Remix specific implementation
{% endif -%}
```

## Common Patterns and Anti-Patterns

### ✅ DO: Use Existing Code from Source Projects

```typescript
// Copy from HexDDD: libs/ddd/src/generators/domain/files/domain/entities/__name__.ts.template
// Adapt to Copier: templates/libs/{{domain_name}}/domain/entities/{{entity_name}}.ts.j2
export class {{entity_name | capitalize}} {
  // Preserve HexDDD patterns but update template syntax
}
```

### ✅ DO: Maintain Port/Adapter Boundaries

```typescript
// Domain layer - no external dependencies
export interface UserRepository {
  save(user: User): Promise<void>;
  findById(id: UserId): Promise<User | null>;
}

// Infrastructure layer - implements ports
export class SupabaseUserRepository implements UserRepository {
  // External framework code here
}
```

### ❌ DON'T: Create New Abstractions

```typescript
// BAD: Don't create new framework abstractions
class UniversalDatabaseAdapter {
  // This violates the generator-first principle
}

// GOOD: Use templates to generate specific implementations
// templates/infrastructure/repositories/{{entity_name}}Repository.ts.j2
```

### ❌ DON'T: Mix Cookiecutter and Copier Syntax

```yaml
# BAD: Using old Cookiecutter format
{{ project_name }}

# GOOD: Using Copier format
{{project_name}}
```

## Integration Guidelines

### 1. Migration from Existing Projects

When migrating code from HexDDD or VibePDK:

1. **Analyze Source Structure**: Use migration tools to understand existing patterns
2. **Preserve Business Logic**: Copy domain logic exactly, adapt infrastructure
3. **Update Template Syntax**: Convert from Nx generators or Cookiecutter to Copier
4. **Maintain Type Safety**: Ensure generated code maintains strict typing

### 2. AI Context Integration

```python
# Use temporal database for learning
async def record_architectural_decision(decision: Decision) -> None:
    point = tsink.Point(timestamp=datetime.utcnow(), value=decision)
    await decisions_series.write(point)

# Query for similar patterns
async def get_similar_decisions(context: str) -> List[Decision]:
    query = tsink.Query.builder()\
        .time_range(tsink.TimeRange.recent(days=90))\
        .filter("context_similarity", f">={SIMILARITY_THRESHOLD}")\
        .build()
    return await decisions_series.query(query)
```

### 3. Type Generation Workflow

```bash
# Always regenerate types after schema changes
just types-generate

# Types are generated in multiple formats:
# - TypeScript: libs/shared/database-types/
# - Python: libs/backend/type_utils/
# - Validation: zod schemas, pydantic models
```

## Testing Requirements

### Unit Tests (Required for all business logic)

```typescript
// Domain entities must have comprehensive unit tests
describe('User Entity', () => {
  it('should create valid user with email', () => {
    const user = User.create({
      email: Email.create('test@example.com'),
      profile: UserProfile.create({ name: 'Test User' }),
    });

    expect(user.isValid()).toBe(true);
  });
});
```

### Integration Tests (Required for generators)

```typescript
// Test template generation end-to-end
describe('Domain Generator', () => {
  it('should generate complete domain structure', async () => {
    const result = await generateFromTemplate('domain', {
      domain_name: 'user-management',
      entities: ['User', 'Profile'],
    });

    expect(result.files).toContain('libs/user-management/domain/entities/User.ts');
    expect(result.generatedCode).toCompile();
  });
});
```

### TDD Cycle Enforcement

Every functional change must follow:

1. **RED**: Write failing test first
2. **GREEN**: Minimal implementation to pass
3. **REFACTOR**: Optimize and clean code
4. **REGRESSION**: Ensure all existing tests still pass

## Performance Considerations

### Template Generation Optimization

- **Incremental Generation**: Only regenerate changed templates
- **Parallel Processing**: Use multiple workers for large template sets
- **Caching**: Cache compiled templates and generated outputs
- **Memory Management**: Stream large file generations

### Database Performance

```python
# Use tsink's Gorilla compression for temporal data
await db.series("specifications", compression=tsink.Compression.Gorilla)

# Batch writes for better performance
points = [tsink.Point(timestamp=ts, value=spec) for ts, spec in specs]
await series.write_batch(points)

# Use time range queries efficiently
query = tsink.Query.builder()\
    .time_range(tsink.TimeRange.recent(hours=24))\
    .limit(100)\
    .build()
```

## Common Troubleshooting

### Template Syntax Issues

```bash
# Validate Copier template syntax
copier --dry-run copy . /tmp/test-output

# Check Jinja2 template compilation
python -c "from jinja2 import Template; Template(open('template.j2').read())"
```

### Type Generation Failures

```bash
# Regenerate types from clean state
rm -rf libs/shared/database-types/
just types-generate

# Validate type consistency
just types-validate
```

### Migration Tool Issues

```bash
# Test migration with sample data
python tools/migration/hexddd-migrator.py --dry-run /path/to/test/project

# Validate migration results
python tools/migration/validate-migration.py /path/to/migrated/project
```

## AI Enhancement Integration

### Context-Aware Development

When working on this project, leverage the temporal learning system:

1. **Query Historical Decisions**: Check tsink database for similar architectural choices
2. **Pattern Recognition**: Use AI context manager to suggest relevant code patterns
3. **Incremental Learning**: Record your architectural decisions for future reference

### Spec-Driven Development

Before implementing any feature:

1. Check existing specification documents in `/tmp/libs/merger/`
2. Reference appropriate spec IDs in commit messages
3. Update specifications if requirements change

## Contributing Guidelines

### Commit Message Format

```
feat(MERGE-TASK-003): implement domain entity generator

- Copy base entity template from HexDDD generators
- Adapt Jinja2 syntax for Copier compatibility
- Add validation for DDD patterns
- Include comprehensive unit tests

Implements: MERGE-TASK-003, ADR-MERGE-002
Refs: PRD-MERGE-002, TS-MERGE-001
```

### Code Review Checklist

- [ ] Follows hexagonal architecture principles
- [ ] Maintains strict type safety
- [ ] Includes comprehensive tests (TDD cycle completed)
- [ ] References specification IDs
- [ ] Reuses existing code from source projects where possible
- [ ] Templates generate valid, compilable code
- [ ] Performance considerations addressed
- [ ] Migration compatibility maintained

Remember: This merger combines the architectural rigor of HexDDD with the AI-enhanced development experience of VibePDK. Every contribution should strengthen both aspects while maintaining the generator-first philosophy that makes the platform truly composable and maintainable.
