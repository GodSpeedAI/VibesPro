/**
 * MERGE-TASK-011: Documentation Generator Implementation
 * Traceability: PRD-MERGE-006, ADR-MERGE-008
 */

import { existsSync, mkdirSync } from 'node:fs';
import type { GeneratedDocs, ProjectContext, ValidationResult } from './types.js';

export class DocumentationGenerator {
  constructor(outputDir: string) {
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }
  }

  async generateDocumentation(context: ProjectContext): Promise<GeneratedDocs> {
    const readme = this.renderReadme(context);
    const apiDocs = this.renderApiDocs(context);
    const architectureGuide = this.renderArchitectureGuide(context);

    return { readme, apiDocs, architectureGuide };
  }

  async validateDocumentation(docs: GeneratedDocs): Promise<ValidationResult> {
    const missingSection: string[] = [];
    const warnings: string[] = [];
    const brokenLinks: string[] = [];

    if (!docs.readme.includes('Getting Started')) {
      missingSection.push('README → Getting Started');
    }
    if (!docs.readme.includes('## Architecture')) {
      missingSection.push('README → Architecture overview');
    }
    if (!docs.apiDocs.trim()) {
      missingSection.push('API reference content');
    }
    if (!docs.architectureGuide.includes('Hexagonal Architecture')) {
      missingSection.push('Architecture guide → Hexagonal Architecture section');
    }

    const totalChecks = 8;
    const score = Math.max(0, (totalChecks - missingSection.length) / totalChecks);

    return {
      isValid: missingSection.length === 0,
      missingSection,
      brokenLinks,
      score,
      warnings,
    };
  }

  private renderReadme(context: ProjectContext): string {
    const domainList = context.domains.length
      ? context.domains.map((domain) => `- **${formatTitle(domain)}** domain`).join('\n')
      : '- Define your first bounded context to start building business logic';

    const frameworkList = context.frameworks.length
      ? context.frameworks.map((item) => `- ${formatTitle(item)}`).join('\n')
      : '- Add preferred frameworks in copier answers to customise this section';

    const repoBadge = context.repository
      ? `[![Repository](https://img.shields.io/badge/repository-${encodeURIComponent(
          context.projectName,
        )}-blue.svg)](${context.repository})`
      : '';

    const versionBadge = context.version
      ? `![Version](https://img.shields.io/badge/version-${encodeURIComponent(
          context.version,
        )}-brightgreen.svg)`
      : '';

    const authorLine = context.author ? `Maintained by **${context.author}**.` : '';

    return `# ${context.projectName}

${repoBadge} ${versionBadge}

${context.description}

${authorLine}

## Getting Started

This project is generated using the Vibes Pro platform which combines **Hexagonal Architecture** with **Domain-Driven Design** and generator-first workflows.

### Quick Start

\`\`\`bash
# Clone the repository
git clone <repository-url>
cd ${context.projectName}

# Install dependencies
just setup

# Start development server
just dev
\`\`\`

## Architecture

- **Architecture style**: ${formatTitle(context.architecture)}
- **Domain strategy**: Bounded contexts with explicit ports and adapters
- **Type system**: Unified types for TypeScript and Python services

### Domains

${domainList}

## Technology Stack

${frameworkList}

${
  context.includeAI
    ? `### AI-Enhanced Workflow
- Pattern-aware code suggestions via temporal database
- Automated context capture for architectural decisions
- Reusable prompts and generators for bounded contexts
`
    : ''
}

## Development Commands

\`\`\`bash
just setup          # Install dependencies
just dev            # Start development mode
just test           # Run unit and integration tests
just build          # Build production assets
just types-generate # Sync database and API types
\`\`\`

## Project Structure

\`\`\`
${context.projectName}/
├── apps/                     # Interface adapters and user-facing apps
├── libs/                     # Domain, application, and infrastructure layers
├── tools/                    # Generators, AI utilities, and documentation helpers
├── docs/                     # Project documentation suite
└── temporal_db/              # Time-series context for AI-assisted workflows
\`\`\`

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines, coding standards, and review checklists.

## License

${context.license ?? 'MIT License'}
`;
  }

  private renderApiDocs(context: ProjectContext): string {
    const domainSections = context.domains.length
      ? context.domains
          .map((domain) => {
            const resource = domain.toLowerCase();
            const title = formatTitle(domain);

            return `## ${title} API

### Endpoints

- \`GET /api/${resource}\` — List ${title} resources
- \`POST /api/${resource}\` — Create a ${title} resource
- \`GET /api/${resource}/:id\` — Retrieve a specific ${title}
- \`PUT /api/${resource}/:id\` — Update a ${title}
- \`DELETE /api/${resource}/:id\` — Archive a ${title}

### Payloads

Use the shared type definitions generated in \`libs/shared/database-types\` for request and response contracts.
`;
          })
          .join('\n')
      : '## Domains\n\nDefine at least one bounded context to unlock detailed API documentation.';

    return `# ${context.projectName} API Reference

This document describes the public API surface for the generated project. All endpoints follow the ports-and-adapters paradigm and map directly to application services.

## Base URL

\`\`\`
https://api.${context.projectName.toLowerCase()}.example.com/v1
\`\`\`

## Authentication

- Bearer token authentication is required for all endpoints.
- Include \`Authorization: Bearer <token>\` header in requests.

## Conventions

- Request and response bodies use camelCase properties.
- Date/time values are ISO-8601 strings with timezone information.
- Domain events are emitted asynchronously via the temporal bus.

${domainSections}

## Error Handling

All endpoints return a consistent error envelope:

\`\`\`json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Human readable explanation",
    "correlationId": "uuid",
    "details": {}
  }
}
\`\`\`

## Rate Limits

- 1000 requests per hour per client ID by default
- Configure per-environment limits in \`apps/api-gateway\`
`;
  }

  private renderArchitectureGuide(context: ProjectContext): string {
    const domainMatrix = context.domains.length
      ? context.domains
          .map(
            (domain) =>
              `| ${formatTitle(
                domain,
              )} | libs/${domain}/domain | libs/${domain}/application | libs/${domain}/infrastructure |`,
          )
          .join('\n')
      : '| Pending | libs/example/domain | libs/example/application | libs/example/infrastructure |';

    return `# Architecture Guide

${context.projectName} adopts a strict **Hexagonal Architecture** to separate core business logic from external concerns. This guide explains the structural decisions and how to extend the system safely.

## Architectural Principles

1. **Domain-Led Design** — Business capabilities drive module boundaries.
2. **Ports and Adapters** — Application layer defines interfaces; infrastructure layer implements them.
3. **Generator-First** — All scaffolding is produced via Copier templates for repeatability.
4. **Temporal Intelligence** — Architectural decisions are recorded in the tsink database for future guidance.

## Layer Responsibilities

| Layer | Purpose | Allowed Dependencies |
| ----- | ------- | -------------------- |
| Domain | Entities, Value Objects, Domain Services | None |
| Application | Use cases, orchestrations, ports | Domain |
| Infrastructure | External adapters, persistence, messaging | Application, Domain |
| Interface | APIs, UI, CLI, Events | Application |

## Bounded Contexts

| Domain | Domain Layer | Application Layer | Infrastructure Layer |
| ------ | ------------ | ----------------- | -------------------- |
${domainMatrix}

## Communication Patterns

- Domain events propagate within the bounded context.
- Integration events cross context boundaries via the event bus.
- Queries remain read-optimised; commands encapsulate intent with validation.

## Testing Strategy

- Unit tests cover entities, value objects, and domain services.
- Application tests validate use-case orchestration and port contracts.
- Integration tests cover adapter wiring and infrastructure concerns.
- Architecture tests enforce dependency rules using static analysis.

## Extending the System

1. Create a new domain using the Copier generator.
2. Define ubiquitous language terms in \`domain/model\`.
3. Implement application ports before adding infrastructure adapters.
4. Record new architectural decisions in the temporal database for traceability.
`;
  }
}

function formatTitle(input: string): string {
  if (!input) {
    return '';
  }
  return input
    .split(/[-_/\s]+/u)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
