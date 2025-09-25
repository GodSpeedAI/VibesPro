/**
 * MERGE-TASK-011: Documentation Generator Implementation (ES Modules)
 * Traceability: PRD-MERGE-006, ADR-MERGE-008
 */

import { existsSync, mkdirSync } from 'fs';
import fs from 'fs/promises';
import path from 'path';

const DEFAULT_LICENSE = 'MIT License';
const FALLBACK_DESCRIPTION = 'Project description pending.';

const normalizeArray = value => (Array.isArray(value) ? [...value] : []);

export class DocumentationGenerator {
  constructor(outputDir) {
    this.outputDir = outputDir;
    this.ensureDirectory(outputDir);
  }

  generateDocumentation(context) {
    const normalizedContext = this.normalizeContext(context);
    const readme = this.buildReadme(normalizedContext);
    const apiDocs = this.buildApiDocs(normalizedContext);
    const architectureGuide = this.buildArchitectureGuide(normalizedContext);
    const migrationGuide = this.buildMigrationGuide(normalizedContext);

    return { readme, apiDocs, architectureGuide, migrationGuide };
  }

  ensureDirectory(directoryPath) {
    if (!existsSync(directoryPath)) {
      mkdirSync(directoryPath, { recursive: true });
    }
  }

  normalizeContext(context = {}) {
    const {
      projectName,
      description,
      domains,
      frameworks,
      includeAI,
      license
    } = context ?? {};

    const normalizedProjectName = typeof projectName === 'string' && projectName.trim().length > 0
      ? projectName
      : 'Project';
    const normalizedDescription = typeof description === 'string' && description.trim().length > 0
      ? description
      : FALLBACK_DESCRIPTION;
    const normalizedLicense = typeof license === 'string' && license.trim().length > 0
      ? license
      : DEFAULT_LICENSE;

    return {
      ...context,
      projectName: normalizedProjectName,
      description: normalizedDescription,
      domains: normalizeArray(domains),
      frameworks: normalizeArray(frameworks),
      includeAI: Boolean(includeAI),
      license: normalizedLicense
    };
  }

  formatList(items, formatItem) {
    const normalized = normalizeArray(items);
    return normalized.length > 0 ? normalized.map(formatItem).join('\n') : '';
  }

  async generateAndSaveTemplates(context) {
    const templateDir = path.join(this.outputDir, 'templates', 'docs');

    this.ensureDirectory(templateDir);

    const readmeTemplate = this.generateReadmeTemplate(context);
    const archTemplate = this.generateArchitectureTemplate(context);
    const apiTemplate = this.generateApiTemplate(context);
    const migrationTemplate = this.generateMigrationTemplate(context);

    await fs.writeFile(path.join(templateDir, 'README.md.j2'), readmeTemplate);
    await fs.writeFile(path.join(templateDir, 'ARCHITECTURE.md.j2'), archTemplate);
    await fs.writeFile(path.join(templateDir, 'API-REFERENCE.md.j2'), apiTemplate);
    await fs.writeFile(path.join(templateDir, 'MIGRATION-GUIDE.md.j2'), migrationTemplate);
  }

  validateDocumentation(docs) {
    const readmeContent = docs?.readme ?? '';
    const architectureContent = docs?.architectureGuide ?? '';
    const apiDocsContent = docs?.apiDocs ?? '';

    const sectionChecks = [
      {
        condition: readmeContent.includes('Getting Started'),
        message: 'Getting Started section in README'
      },
      {
        condition: readmeContent.includes('## Architecture'),
        message: 'Architecture section in README'
      },
      {
        condition: apiDocsContent.trim().length > 0,
        message: 'API Documentation'
      },
      {
        condition: architectureContent.includes('Hexagonal Architecture'),
        message: 'Hexagonal Architecture explanation'
      }
    ];

    const missingSection = sectionChecks
      .filter(entry => !entry.condition)
      .map(entry => entry.message);

    const totalChecks = sectionChecks.length;
    const failedChecks = missingSection.length;
    const score = totalChecks === 0 ? 1 : Math.max(0, (totalChecks - failedChecks) / totalChecks);

    return {
      isValid: missingSection.length === 0,
      missingSection,
      brokenLinks: [],
      score,
      warnings: []
    };
  }

  generateReadme(context) {
    return this.buildReadme(this.normalizeContext(context));
  }

  buildReadme(context) {
    const {
      projectName,
      description,
      domains,
      frameworks,
      includeAI,
      license
    } = context;

    const domainList = this.formatList(domains, domain => `- **${domain}**: Core business domain`);
    const frameworksList = this.formatList(frameworks, framework => `- ${framework}`);

    const domainsSection = domainList
      ? `### Domains

${domainList}

`
      : `### Domains

- No domains defined yet

`;

    const frameworksSection = frameworksList
      ? `### Frameworks
${frameworksList}

`
      : `### Frameworks
- No frameworks specified

`;

    const aiSection = includeAI
      ? `### AI-Enhanced Features
This project includes AI-enhanced development workflows for:
- Automated code generation
- Architecture pattern suggestions
- Development assistance

`
      : '';

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

${domainsSection}## Technology Stack

${frameworksSection}${aiSection}## Development

\`\`\`bash
just setup    # Setup project
just dev      # Run development server
just build    # Build for production
just test     # Run tests
\`\`\`

## License

${license}
`;
  }

  generateApiDocs(context) {
    return this.buildApiDocs(this.normalizeContext(context));
  }

  buildApiDocs(context) {
    const { projectName, domains } = context;
    const normalizedProjectSlug = projectName.toLowerCase().replace(/\s+/g, '-');

    const domainDocs = domains.length > 0
      ? domains.map(domain => {
          const domainName = domain.charAt(0).toUpperCase() + domain.slice(1);
          const domainSlug = domain.toLowerCase().replace(/\s+/g, '-');
          return `## ${domainName} Domain API

### Endpoints

- **GET** /api/${domainSlug} - List all ${domainName} entities
- **POST** /api/${domainSlug} - Create new ${domainName} entity
- **GET** /api/${domainSlug}/:id - Get specific ${domainName} entity
- **PUT** /api/${domainSlug}/:id - Update ${domainName} entity
- **DELETE** /api/${domainSlug}/:id - Delete ${domainName} entity

### Data Models

See [Type Definitions](../libs/shared/database-types/) for complete data models.
`;
        }).join('\n')
      : `## Domains

No domain endpoints defined yet.
`;

    return `# ${projectName} API Reference

## Base URL

\`\`\`
https://api.${normalizedProjectSlug}.com/v1
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

  generateArchitectureGuide(context) {
    return this.buildArchitectureGuide(this.normalizeContext(context));
  }

  buildArchitectureGuide(context) {
    const { projectName, domains } = context;

    const domainSections = domains.length > 0
      ? domains.map(domain => {
          const domainName = domain.charAt(0).toUpperCase() + domain.slice(1);
          return `#### ${domainName} Domain

- **Entities**: Core business objects with identity
- **Value Objects**: Immutable data structures
- **Domain Services**: Complex business operations
- **Repository Interfaces**: Data access abstractions
`;
        }).join('\n\n')
      : '';

    const boundedContextsSection = domainSections
      ? `### Bounded Contexts

${domainSections}

`
      : `### Bounded Contexts

No bounded contexts defined yet.

`;

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

${boundedContextsSection}## Layer Structure

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

  generateMigrationGuide(context) {
    return this.buildMigrationGuide(this.normalizeContext(context));
  }

  buildMigrationGuide(context) {
    const { projectName } = context;

    return `# Migration Guide

This guide helps you migrate existing projects to ${projectName}.

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
