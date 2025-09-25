/**
 * MERGE-TASK-011: Documentation Generator Implementation
 *
 * GREEN Phase: Minimal implementation to make tests pass
 * Traceability: PRD-MERGE-006, ADR-MERGE-008
 *
 * Based on VibePDK documentation patterns merged with HexDDD architecture docs
 */

import * as fs from 'fs';
import * as path from 'path';
import type { GeneratedDocs, ProjectContext, ValidationResult } from './types';

export class DocumentationGenerator {
    constructor(private outputDir: string) {
        // Ensure output directory exists
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
    }

    /**
     * Generate complete documentation suite for a project
     */
    async generateDocumentation(context: ProjectContext): Promise<GeneratedDocs> {
        const readme = await this.generateReadme(context);
        const apiDocs = await this.generateApiDocs(context);
        const architectureGuide = await this.generateArchitectureGuide(context);
        const migrationGuide = await this.generateMigrationGuide(context);

        return {
            readme,
            apiDocs,
            architectureGuide,
            migrationGuide
        };
    }

    /**
     * Generate and save documentation templates to templates directory
     */
    async generateAndSaveTemplates(context: ProjectContext): Promise<void> {
        const templateDir = path.join(this.outputDir, 'templates', 'docs');

        if (!fs.existsSync(templateDir)) {
            fs.mkdirSync(templateDir, { recursive: true });
        }

        // Generate template versions with Jinja2 syntax
        const readmeTemplate = this.generateReadmeTemplate(context);
        const archTemplate = this.generateArchitectureTemplate(context);
        const apiTemplate = this.generateApiTemplate(context);
        const migrationTemplate = this.generateMigrationTemplate(context);

        fs.writeFileSync(path.join(templateDir, 'README.md.j2'), readmeTemplate);
        fs.writeFileSync(path.join(templateDir, 'ARCHITECTURE.md.j2'), archTemplate);
        fs.writeFileSync(path.join(templateDir, 'API-REFERENCE.md.j2'), apiTemplate);
        fs.writeFileSync(path.join(templateDir, 'MIGRATION-GUIDE.md.j2'), migrationTemplate);
    }

    /**
     * Validate generated documentation completeness and quality
     */
    async validateDocumentation(docs: GeneratedDocs): Promise<ValidationResult> {
        const missingSection: string[] = [];
        const brokenLinks: string[] = [];
        const warnings: string[] = [];

        // Check for required sections in README
        if (!docs.readme.includes('Getting Started')) {
            missingSection.push('Getting Started section in README');
        }
        if (!docs.readme.includes('## Architecture')) {
            missingSection.push('Architecture section in README');
        }

        // Check API documentation
        if (!docs.apiDocs || docs.apiDocs.trim().length === 0) {
            missingSection.push('API Documentation');
        }

        // Check architecture guide
        if (!docs.architectureGuide.includes('Hexagonal Architecture')) {
            missingSection.push('Hexagonal Architecture explanation');
        }

        // Calculate score
        const totalChecks = 10;
        const failedChecks = missingSection.length;
        const score = Math.max(0, (totalChecks - failedChecks) / totalChecks);

        return {
            isValid: missingSection.length === 0,
            missingSection,
            brokenLinks,
            score,
            warnings
        };
    }

    /**
     * Generate README.md content
     */
    private async generateReadme(context: ProjectContext): Promise<string> {
        const { projectName, description, domains, frameworks, includeAI } = context;

        return `# ${projectName}

${description}

## Getting Started

This project follows **Hexagonal Architecture** principles with **Domain-Driven Design** patterns for maintainable, testable, and scalable applications.

### Quick Start

\`\`\`bash
# Clone the repository
git clone <repository-url>
cd ${projectName}

# Install dependencies
just setup

# Start development server
just dev
\`\`\`

## Architecture

This project implements **Hexagonal Architecture** (also known as Ports and Adapters) with **Domain-Driven Design**:

- **Domain Layer**: Pure business logic and entities
- **Application Layer**: Use cases and application services
- **Infrastructure Layer**: External adapters and implementations
- **Interface Layer**: Controllers, views, and user interfaces

### Domains

${domains.map(domain => `- **${domain}**: Core business domain`).join('\n')}

## Technology Stack

### Frameworks
${frameworks.map(framework => `- ${framework}`).join('\n')}

${includeAI ? `
### AI-Enhanced Features
This project includes AI-enhanced development workflows for:
- Automated code generation
- Architecture pattern suggestions
- Development assistance
` : ''}

## Development

### Available Commands

\`\`\`bash
# Setup project
just setup

# Run development server
just dev

# Build for production
just build

# Run tests
just test

# Generate types
just types-generate
\`\`\`

### Project Structure

\`\`\`
${projectName}/
├── apps/                 # Application interfaces
${domains.map(domain => `├── libs/${domain}/          # ${domain} domain`).join('\n')}
├── libs/shared/          # Shared utilities
├── tools/                # Development tools
└── docs/                 # Documentation
\`\`\`

## Deployment

See [Deployment Guide](docs/DEPLOYMENT.md) for detailed deployment instructions.

## Contributing

See [Contributing Guide](CONTRIBUTING.md) for development guidelines and coding standards.

## License

${context.license || 'MIT License'}
`;
    }

    /**
     * Generate API documentation
     */
    private async generateApiDocs(context: ProjectContext): Promise<string> {
        const { projectName, domains } = context;

        const domainDocs = domains.map(domain => {
            return `
## ${domain.charAt(0).toUpperCase() + domain.slice(1)} Domain API

### Endpoints

#### GET /api/${domain}
List all ${domain} entities

#### POST /api/${domain}
Create new ${domain} entity

#### GET /api/${domain}/:id
Get specific ${domain} entity

#### PUT /api/${domain}/:id
Update ${domain} entity

#### DELETE /api/${domain}/:id
Delete ${domain} entity

### Data Models

See [Type Definitions](../libs/shared/database-types/) for complete data models.
`;
        }).join('\n');

        return `# ${projectName} API Reference

This document provides comprehensive API documentation for all domains in the system.

## Base URL

\`\`\`
https://api.${projectName.toLowerCase()}.com/v1
\`\`\`

## Authentication

All API endpoints require authentication. Include the authorization header:

\`\`\`
Authorization: Bearer <your-token>
\`\`\`

${domainDocs}

## Error Handling

All API endpoints return consistent error responses:

\`\`\`json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {}
  }
}
\`\`\`

## Rate Limiting

API requests are rate limited to 1000 requests per hour per API key.
`;
    }

    /**
     * Generate architecture guide
     */
    private async generateArchitectureGuide(context: ProjectContext): Promise<string> {
        const { projectName, domains } = context;

        return `# Architecture Guide

This document describes the architectural patterns and design decisions for ${projectName}.

## Hexagonal Architecture

This project follows **Hexagonal Architecture** (also known as Ports and Adapters pattern) to achieve:

- **Separation of Concerns**: Clear boundaries between business logic and external concerns
- **Testability**: Easy to unit test business logic in isolation
- **Flexibility**: Easy to swap out external dependencies
- **Maintainability**: Changes to external systems don't affect business rules

### Architecture Diagram

\`\`\`mermaid
graph TD
    UI[User Interface] --> App[Application Layer]
    API[REST API] --> App
    App --> Domain[Domain Layer]
    App --> Infra[Infrastructure Layer]
    Infra --> DB[Database]
    Infra --> External[External Services]

    subgraph "Domain Layer"
        Domain --> Entities[Entities]
        Domain --> ValueObjects[Value Objects]
        Domain --> DomainServices[Domain Services]
        Domain --> Events[Domain Events]
    end

    subgraph "Application Layer"
        App --> UseCases[Use Cases]
        App --> Ports[Ports/Interfaces]
        App --> AppServices[Application Services]
    end
\`\`\`

## Domain-Driven Design

### Bounded Contexts

Each domain represents a bounded context with its own:

${domains.map(domain => `
#### ${domain.charAt(0).toUpperCase() + domain.slice(1)} Domain

- **Entities**: Core business objects with identity
- **Value Objects**: Immutable data structures
- **Domain Services**: Complex business operations
- **Repository Interfaces**: Data access abstractions
`).join('\n')}

### Ubiquitous Language

Each domain maintains its own ubiquitous language, ensuring that code reflects the business domain terminology.

## Layer Structure

### 1. Domain Layer (Pure Business Logic)

- **Location**: \`libs/{domain}/domain/\`
- **Dependencies**: None (pure business logic)
- **Contains**: Entities, Value Objects, Domain Events, Domain Services

### 2. Application Layer (Use Cases)

- **Location**: \`libs/{domain}/application/\`
- **Dependencies**: Domain layer only
- **Contains**: Use Cases, Application Services, Ports (interfaces)

### 3. Infrastructure Layer (External Adapters)

- **Location**: \`libs/{domain}/infrastructure/\`
- **Dependencies**: Application and Domain layers
- **Contains**: Repository implementations, External service adapters, Database configurations

### 4. Interface Layer (User/System Interfaces)

- **Location**: \`apps/{app-name}/\`
- **Dependencies**: Application layer
- **Contains**: Controllers, Views, CLI commands, Event handlers

## Design Patterns

### Repository Pattern
Abstracts data access logic with interfaces in the application layer and implementations in infrastructure.

### Command Query Responsibility Segregation (CQRS)
Separates read and write operations for optimal performance and clarity.

### Event-Driven Architecture
Uses domain events to maintain loose coupling between bounded contexts.

## Testing Strategy

### Unit Tests
- Test domain entities and value objects in isolation
- Test use cases with mocked dependencies
- Focus on business logic correctness

### Integration Tests
- Test repository implementations with real databases
- Test API endpoints end-to-end
- Verify cross-domain event handling

### Architecture Tests
- Verify layer dependencies are correct
- Ensure domain layer has no external dependencies
- Validate naming conventions and project structure

## Migration from Legacy Systems

See [Migration Guide](MIGRATION-GUIDE.md) for detailed migration strategies from existing systems.
`;
    }

    /**
     * Generate migration guide
     */
    private async generateMigrationGuide(context: ProjectContext): Promise<string> {
        return `# Migration Guide

This guide helps you migrate existing projects to the ${context.projectName} architecture.

## From HexDDD Projects

### Automated Migration

Use the automated migration tool:

\`\`\`bash
# Install migration tools
pip install -r tools/migration/requirements.txt

# Analyze existing project
python tools/migration/hexddd-migrator.py analyze /path/to/hexddd/project

# Migrate project
python tools/migration/hexddd-migrator.py migrate /path/to/hexddd/project /path/to/new/project
\`\`\`

### Manual Steps

1. **Project Structure**: HexDDD projects should migrate cleanly with minimal changes
2. **Generators**: Nx generators will be converted to Copier templates
3. **Build System**: Nx configuration will be preserved and enhanced
4. **Domain Logic**: Business logic should transfer without changes

## From VibePDK Templates

### Template Conversion

Convert Cookiecutter templates to Copier format:

\`\`\`bash
# Convert template
python tools/migration/vibepdk-migrator.py /path/to/cookiecutter/template

# Validate conversion
copier copy . /tmp/test-output
\`\`\`

### Key Changes

1. **Template Syntax**: \`{{ var }}\` becomes \`{{var}}\`
2. **Configuration**: \`cookiecutter.json\` becomes \`copier.yml\`
3. **Hooks**: Updated to Copier hook format
4. **AI Workflows**: Enhanced with temporal learning system

## From Legacy Monoliths

### Strategy

1. **Domain Identification**: Identify bounded contexts in existing code
2. **Incremental Migration**: Migrate domain by domain
3. **Anti-Corruption Layer**: Create adapters for legacy systems
4. **Data Migration**: Plan database schema evolution

### Steps

1. **Analysis Phase**
   - Map existing functionality to domains
   - Identify data dependencies
   - Plan migration phases

2. **Domain Extraction**
   - Extract one domain at a time
   - Implement hexagonal architecture
   - Create anti-corruption layers

3. **Integration**
   - Connect new domains to existing system
   - Implement event-driven communication
   - Gradually replace legacy components

## Migration Tools

### Available Tools

- \`hexddd-migrator.py\`: Migrate from HexDDD projects
- \`vibepdk-migrator.py\`: Convert VibePDK templates
- \`legacy-analyzer.py\`: Analyze legacy codebases
- \`domain-extractor.py\`: Extract domains from monoliths

### Validation

After migration, validate the results:

\`\`\`bash
# Run all tests
just test

# Validate architecture compliance
just validate-architecture

# Check performance
just benchmark
\`\`\`

## Troubleshooting

### Common Issues

1. **Dependency Conflicts**: Update package.json dependencies
2. **Import Paths**: Update import statements for new structure
3. **Configuration**: Update environment variables and configs
4. **Tests**: Adapt tests for new architecture patterns

### Support

- **Documentation**: Check [Architecture Guide](ARCHITECTURE.md)
- **Examples**: See [examples/](../examples/) directory
- **Issues**: Report problems in project repository
`;
    }

    /**
     * Generate Jinja2 template versions
     */
    private generateReadmeTemplate(context: ProjectContext): string {
        return `# {{project_name}}

{{project_description}}

## Getting Started

This project follows **Hexagonal Architecture** principles with **Domain-Driven Design** patterns for maintainable, testable, and scalable applications.

### Quick Start

\`\`\`bash
# Clone the repository
git clone <repository-url>
cd {{project_name}}

# Install dependencies
just setup

# Start development server
just dev
\`\`\`

## Architecture

This project implements **Hexagonal Architecture** (also known as Ports and Adapters) with **Domain-Driven Design**:

- **Domain Layer**: Pure business logic and entities
- **Application Layer**: Use cases and application services
- **Infrastructure Layer**: External adapters and implementations
- **Interface Layer**: Controllers, views, and user interfaces

### Domains

{% for domain in domains %}
- **{{domain}}**: Core business domain
{% endfor %}

## Technology Stack

### Frameworks
{% for framework in frameworks %}
- {{framework}}
{% endfor %}

{% if include_ai %}
### AI-Enhanced Features
This project includes AI-enhanced development workflows for:
- Automated code generation
- Architecture pattern suggestions
- Development assistance
{% endif %}

## Development

### Available Commands

\`\`\`bash
# Setup project
just setup

# Run development server
just dev

# Build for production
just build

# Run tests
just test

# Generate types
just types-generate
\`\`\`

### Project Structure

\`\`\`
{{project_name}}/
├── apps/                 # Application interfaces
{% for domain in domains %}
├── libs/{{domain}}/      # {{domain}} domain
{% endfor %}
├── libs/shared/          # Shared utilities
├── tools/                # Development tools
└── docs/                 # Documentation
\`\`\`

## Deployment

See [Deployment Guide](docs/DEPLOYMENT.md) for detailed deployment instructions.

## Contributing

See [Contributing Guide](CONTRIBUTING.md) for development guidelines and coding standards.

## License

{{license|default('MIT License')}}
`;
    }

    private generateArchitectureTemplate(context: ProjectContext): string {
        return `# Architecture Guide

This document describes the architectural patterns and design decisions for {{project_name}}.

## Hexagonal Architecture

This project follows **Hexagonal Architecture** (also known as Ports and Adapters pattern) to achieve:

- **Separation of Concerns**: Clear boundaries between business logic and external concerns
- **Testability**: Easy to unit test business logic in isolation
- **Flexibility**: Easy to swap out external dependencies
- **Maintainability**: Changes to external systems don't affect business rules

### Architecture Diagram

\`\`\`mermaid
graph TD
    UI[User Interface] --> App[Application Layer]
    API[REST API] --> App
    App --> Domain[Domain Layer]
    App --> Infra[Infrastructure Layer]
    Infra --> DB[Database]
    Infra --> External[External Services]

    subgraph "Domain Layer"
        Domain --> Entities[Entities]
        Domain --> ValueObjects[Value Objects]
        Domain --> DomainServices[Domain Services]
        Domain --> Events[Domain Events]
    end

    subgraph "Application Layer"
        App --> UseCases[Use Cases]
        App --> Ports[Ports/Interfaces]
        App --> AppServices[Application Services]
    end
\`\`\`

## Domain-Driven Design

### Bounded Contexts

Each domain represents a bounded context with its own:

{% for domain in domains %}
#### {{domain|title}} Domain

- **Entities**: Core business objects with identity
- **Value Objects**: Immutable data structures
- **Domain Services**: Complex business operations
- **Repository Interfaces**: Data access abstractions

{% endfor %}

## Layer Structure

### 1. Domain Layer (Pure Business Logic)

- **Location**: \`libs/{domain}/domain/\`
- **Dependencies**: None (pure business logic)
- **Contains**: Entities, Value Objects, Domain Events, Domain Services

### 2. Application Layer (Use Cases)

- **Location**: \`libs/{domain}/application/\`
- **Dependencies**: Domain layer only
- **Contains**: Use Cases, Application Services, Ports (interfaces)

### 3. Infrastructure Layer (External Adapters)

- **Location**: \`libs/{domain}/infrastructure/\`
- **Dependencies**: Application and Domain layers
- **Contains**: Repository implementations, External service adapters, Database configurations

### 4. Interface Layer (User/System Interfaces)

- **Location**: \`apps/{app-name}/\`
- **Dependencies**: Application layer
- **Contains**: Controllers, Views, CLI commands, Event handlers

## Testing Strategy

### Unit Tests
- Test domain entities and value objects in isolation
- Test use cases with mocked dependencies
- Focus on business logic correctness

### Integration Tests
- Test repository implementations with real databases
- Test API endpoints end-to-end
- Verify cross-domain event handling

### Architecture Tests
- Verify layer dependencies are correct
- Ensure domain layer has no external dependencies
- Validate naming conventions and project structure
`;
    }

    private generateApiTemplate(context: ProjectContext): string {
        return `# {{project_name}} API Reference

This document provides comprehensive API documentation for all domains in the system.

## Base URL

\`\`\`
https://api.{{project_name|lower}}.com/v1
\`\`\`

## Authentication

All API endpoints require authentication. Include the authorization header:

\`\`\`
Authorization: Bearer <your-token>
\`\`\`

{% for domain in domains %}
## {{domain|title}} Domain API

### Endpoints

#### GET /api/{{domain}}
List all {{domain}} entities

#### POST /api/{{domain}}
Create new {{domain}} entity

#### GET /api/{{domain}}/:id
Get specific {{domain}} entity

#### PUT /api/{{domain}}/:id
Update {{domain}} entity

#### DELETE /api/{{domain}}/:id
Delete {{domain}} entity

### Data Models

See [Type Definitions](../libs/shared/database-types/) for complete data models.

{% endfor %}

## Error Handling

All API endpoints return consistent error responses:

\`\`\`json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {}
  }
}
\`\`\`

## Rate Limiting

API requests are rate limited to 1000 requests per hour per API key.
`;
    }

    private generateMigrationTemplate(context: ProjectContext): string {
        return `# Migration Guide

This guide helps you migrate existing projects to the {{project_name}} architecture.

## From HexDDD Projects

### Automated Migration

Use the automated migration tool:

\`\`\`bash
# Install migration tools
pip install -r tools/migration/requirements.txt

# Analyze existing project
python tools/migration/hexddd-migrator.py analyze /path/to/hexddd/project

# Migrate project
python tools/migration/hexddd-migrator.py migrate /path/to/hexddd/project /path/to/new/project
\`\`\`

## From VibePDK Templates

### Template Conversion

Convert Cookiecutter templates to Copier format:

\`\`\`bash
# Convert template
python tools/migration/vibepdk-migrator.py /path/to/cookiecutter/template

# Validate conversion
copier copy . /tmp/test-output
\`\`\`

## Migration Tools

### Available Tools

- \`hexddd-migrator.py\`: Migrate from HexDDD projects
- \`vibepdk-migrator.py\`: Convert VibePDK templates
- \`legacy-analyzer.py\`: Analyze legacy codebases
- \`domain-extractor.py\`: Extract domains from monoliths

### Validation

After migration, validate the results:

\`\`\`bash
# Run all tests
just test

# Validate architecture compliance
just validate-architecture

# Check performance
just benchmark
\`\`\`
`;
    }
}
