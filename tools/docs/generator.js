/**
 * MERGE-TASK-011: Documentation Generator Implementation (ES Modules)
 * Traceability: PRD-MERGE-006, ADR-MERGE-008
 */

import { existsSync, mkdirSync } from 'fs';
import fs from 'fs/promises';
import path from 'path';

export class DocumentationGenerator {
  constructor(outputDir) {
    this.outputDir = outputDir;
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }
  }

  async generateDocumentation(context) {
    const readme = await this.generateReadme(context);
    const apiDocs = await this.generateApiDocs(context);
    const architectureGuide = await this.generateArchitectureGuide(context);
    const migrationGuide = await this.generateMigrationGuide(context);

    return { readme, apiDocs, architectureGuide, migrationGuide };
  }

  async generateAndSaveTemplates(context) {
    const templateDir = path.join(this.outputDir, 'templates', 'docs');

    if (!existsSync(templateDir)) {
      mkdirSync(templateDir, { recursive: true });
    }

    const readmeTemplate = this.generateReadmeTemplate(context);
    const archTemplate = this.generateArchitectureTemplate(context);
    const apiTemplate = this.generateApiTemplate(context);
    const migrationTemplate = this.generateMigrationTemplate(context);

    await fs.writeFile(path.join(templateDir, 'README.md.j2'), readmeTemplate);
    await fs.writeFile(path.join(templateDir, 'ARCHITECTURE.md.j2'), archTemplate);
    await fs.writeFile(path.join(templateDir, 'API-REFERENCE.md.j2'), apiTemplate);
    await fs.writeFile(path.join(templateDir, 'MIGRATION-GUIDE.md.j2'), migrationTemplate);
  }

  async validateDocumentation(docs) {
    const missingSection = [];
    const brokenLinks = [];
    const warnings = [];
    const readmeContent = docs.readme ?? '';
    const architectureContent = docs.architectureGuide ?? '';

    if (!readmeContent.includes('Getting Started')) {
      missingSection.push('Getting Started section in README');
    }
    if (!readmeContent.includes('## Architecture')) {
      missingSection.push('Architecture section in README');
    }
    if (!docs.apiDocs || docs.apiDocs.trim().length === 0) {
      missingSection.push('API Documentation');
    }
    if (!architectureContent.includes('Hexagonal Architecture')) {
      missingSection.push('Hexagonal Architecture explanation');
    }

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

  async generateReadme(context) {
    const { projectName, description, domains, frameworks, includeAI } = context;

    return `# ${projectName}

${description}

## Getting Started

This project follows **Hexagonal Architecture** principles with **Domain-Driven Design** patterns.

### Quick Start

\`\`\`bash
# Clone and setup
git clone <repository-url>
cd ${projectName}
just setup
just dev
\`\`\`

## Architecture

This project implements **Hexagonal Architecture** with **Domain-Driven Design**:

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

\`\`\`bash
just setup    # Setup project
just dev      # Run development server
just build    # Build for production
just test     # Run tests
\`\`\`

## License

${context.license || 'MIT License'}
`;
  }

  async generateApiDocs(context) {
    const { projectName, domains } = context;

    const domainDocs = domains.map(domain => `
## ${domain.charAt(0).toUpperCase() + domain.slice(1)} Domain API

### Endpoints

- **GET** /api/${domain} - List all ${domain} entities
- **POST** /api/${domain} - Create new ${domain} entity
- **GET** /api/${domain}/:id - Get specific ${domain} entity
- **PUT** /api/${domain}/:id - Update ${domain} entity
- **DELETE** /api/${domain}/:id - Delete ${domain} entity

### Data Models

See [Type Definitions](../libs/shared/database-types/) for complete data models.
`).join('\n');

    return `# ${projectName} API Reference

## Base URL

\`\`\`
https://api.${projectName.toLowerCase()}.com/v1
\`\`\`

## Authentication

All API endpoints require authentication:

\`\`\`
Authorization: Bearer <your-token>
\`\`\`

${domainDocs}

## Error Handling

\`\`\`json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message"
  }
}
\`\`\`
`;
  }

  async generateArchitectureGuide(context) {
    const { projectName, domains } = context;

    return `# Architecture Guide

This document describes the architectural patterns for ${projectName}.

## Hexagonal Architecture

This project follows **Hexagonal Architecture** (Ports and Adapters pattern):

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
\`\`\`

## Domain-Driven Design

### Bounded Contexts

${domains.map(domain => `
#### ${domain.charAt(0).toUpperCase() + domain.slice(1)} Domain

- **Entities**: Core business objects with identity
- **Value Objects**: Immutable data structures
- **Domain Services**: Complex business operations
- **Repository Interfaces**: Data access abstractions
`).join('\n')}

## Layer Structure

1. **Domain Layer** (\`libs/{domain}/domain/\`): Pure business logic
2. **Application Layer** (\`libs/{domain}/application/\`): Use cases and ports
3. **Infrastructure Layer** (\`libs/{domain}/infrastructure/\`): External adapters
4. **Interface Layer** (\`apps/{app-name}/\`): User/system interfaces

## Testing Strategy

- **Unit Tests**: Test domain logic in isolation
- **Integration Tests**: Test with real databases and external services
- **Architecture Tests**: Verify layer dependencies are correct
`;
  }

  async generateMigrationGuide(context) {
    return `# Migration Guide

This guide helps you migrate existing projects to ${context.projectName}.

## Migration Steps

### Step 1: Analyze Your Current Project

Before migrating, understand your current architecture:
- Identify domain boundaries
- Map existing entities and value objects
- Catalog external dependencies

### Step 2: Prepare Migration Environment

\`\`\`bash
# Install migration tools
pip install -r tools/migration/requirements.txt
\`\`\`

### Step 3: Run Migration Analysis

\`\`\`bash
# Analyze existing project
python tools/migration/hexddd-migrator.py analyze /path/to/current/project
\`\`\`

## From HexDDD Projects

### Automated Migration

\`\`\`bash
# Migrate project
python tools/migration/hexddd-migrator.py migrate /path/to/hexddd/project /path/to/new/project
\`\`\`

## From VibePDK Templates

### Template Conversion

\`\`\`bash
# Convert template
python tools/migration/vibepdk-migrator.py /path/to/cookiecutter/template

# Validate conversion
copier copy . /tmp/test-output
\`\`\`

## Migration Tools

- \`hexddd-migrator.py\`: Migrate from HexDDD projects
- \`vibepdk-migrator.py\`: Convert VibePDK templates
- \`legacy-analyzer.py\`: Analyze legacy codebases

## Validation

After migration, validate your project:

\`\`\`bash
# Run tests
just test

# Validate architecture
python tools/validation/architecture-checker.py
\`\`\`
## Validation

After migration, validate your project:

\`\`\`bash
# Run tests
just test

# Validate architecture
python tools/validation/architecture-checker.py
\`\`\`
`;
  }

  generateReadmeTemplate(context) {
    return `# {{project_name}}

{{project_description}}

## Getting Started

This project follows **Hexagonal Architecture** principles.

{% for domain in domains %}
- **{{domain}}**: Core business domain
{% endfor %}

{% if include_ai %}
### AI-Enhanced Features
This project includes AI-enhanced development workflows.
{% endif %}

## License
{{license|default('MIT License')}}
`;
  }

  generateArchitectureTemplate(context) {
    return `# Architecture Guide

This document describes the architectural patterns for {{project_name}}.

## Hexagonal Architecture

{% for domain in domains %}
#### {{domain|title}} Domain
- **Entities**: Core business objects
- **Value Objects**: Immutable data structures
{% endfor %}
`;
  }

  generateApiTemplate(context) {
    return `# {{project_name}} API Reference

{% for domain in domains %}
## {{domain|title}} Domain API

### Endpoints
- GET /api/{{domain}}
- POST /api/{{domain}}
{% endfor %}
`;
  }

  generateMigrationTemplate(context) {
    return `# Migration Guide for {{project_name}}

## Migration Tools
- \`hexddd-migrator.py\`
- \`vibepdk-migrator.py\`
`;
  }
}
