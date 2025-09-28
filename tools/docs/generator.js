/**
 * Documentation Generator (CommonJS)
 * Simplified, CommonJS-compatible implementation exported as module.exports
 */

const { existsSync, mkdirSync } = require('fs');
const fs = require('fs').promises;
const path = require('path');

const DEFAULT_LICENSE = 'MIT License';
const FALLBACK_DESCRIPTION = 'Project description pending.';

const normalizeArray = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string')
    return value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  return [];
};

class DocumentationGenerator {
  constructor(outputDir) {
    this.outputDir = outputDir;
    this.ensureDirectory(outputDir);
  }

  generateDocumentation(context) {
    const normalizedContext = this.normalizeContext(context);
    const readme = this.buildReadme(normalizedContext);
    const apiDocs = this.buildApiDocs(normalizedContext);
    const architectureGuide = this.buildArchitectureGuide(normalizedContext);

    return { readme, apiDocs, architectureGuide };
  }

  ensureDirectory(directoryPath) {
    if (!existsSync(directoryPath)) {
      mkdirSync(directoryPath, { recursive: true });
    }
  }

  normalizeContext(context = {}) {
    const { projectName, description, domains, frameworks, includeAI, license } = context || {};

    const normalizedProjectName = typeof projectName === 'string' && projectName.trim().length > 0 ? projectName : 'Project';
    const normalizedDescription = typeof description === 'string' && description.trim().length > 0 ? description : FALLBACK_DESCRIPTION;
    const normalizedLicense = typeof license === 'string' && license.trim().length > 0 ? license : DEFAULT_LICENSE;

    return {
      ...context,
      projectName: normalizedProjectName,
      description: normalizedDescription,
      domains: normalizeArray(domains),
      frameworks: normalizeArray(frameworks),
      includeAI: Boolean(includeAI),
      license: normalizedLicense,
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
    await fs.writeFile(path.join(templateDir, 'README.md.j2'), readmeTemplate);
    await fs.writeFile(path.join(templateDir, 'ARCHITECTURE.md.j2'), archTemplate);
    await fs.writeFile(path.join(templateDir, 'API-REFERENCE.md.j2'), apiTemplate);
  }

  validateDocumentation(docs) {
    const readmeContent = (docs && docs.readme) || '';
    const architectureContent = (docs && docs.architectureGuide) || '';
    const apiDocsContent = (docs && docs.apiDocs) || '';

    const sectionChecks = [
      { condition: readmeContent.includes('Getting Started'), message: 'Getting Started section in README' },
      { condition: readmeContent.includes('## Architecture'), message: 'Architecture section in README' },
      { condition: apiDocsContent.trim().length > 0, message: 'API Documentation' },
      { condition: architectureContent.includes('Hexagonal Architecture'), message: 'Hexagonal Architecture explanation' },
    ];

    const missingSection = sectionChecks.filter((entry) => !entry.condition).map((entry) => entry.message);
    const totalChecks = sectionChecks.length;
    const failedChecks = missingSection.length;
    const score = totalChecks === 0 ? 1 : Math.max(0, (totalChecks - failedChecks) / totalChecks);

    return { isValid: missingSection.length === 0, missingSection, brokenLinks: [], score, warnings: [] };
  }

  generateReadme(context) {
    return this.buildReadme(this.normalizeContext(context));
  }

  buildReadme(context) {
    const { projectName, description, domains, frameworks, includeAI, license } = context;

    const domainList = this.formatList(domains, (domain) => `- **${domain}**: Core business domain`);
    const frameworksList = this.formatList(frameworks, (framework) => `- ${framework}`);

    const domainsSection = domainList
      ? `### Domains\n\n${domainList}\n\n`
      : `### Domains\n\n- No domains defined yet\n\n`;

    const frameworksSection = frameworksList
      ? `### Frameworks\n${frameworksList}\n\n`
      : `### Frameworks\n- No frameworks specified\n\n`;

    const aiSection = includeAI
      ? `### AI-Enhanced Features\nThis project includes AI-enhanced development workflows for:\n- Automated code generation\n- Architecture pattern suggestions\n- Development assistance\n\n`
      : '';

    return `# ${projectName}\n\n${description}\n\n## Getting Started\n\nThis project follows **Hexagonal Architecture** principles with **Domain-Driven Design** patterns.\n\n### Quick Start\n\n\`\`\`bash\n# Clone and setup\ngit clone <repository-url>\ncd ${projectName}\njust setup\njust dev\n\`\`\`\n\n## Architecture\n\nThis project implements **Hexagonal Architecture** with **Domain-Driven Design**:\n\n- **Domain Layer**: Pure business logic and entities\n- **Application Layer**: Use cases and application services\n- **Infrastructure Layer**: External adapters and implementations\n- **Interface Layer**: Controllers, views, and user interfaces\n\n${domainsSection}## Technology Stack\n\n${frameworksSection}${aiSection}## Development\n\n\`\`\`bash\njust setup    # Setup project\njust dev      # Run development server\njust build    # Build for production\njust test     # Run tests\n\`\`\`\n\n## License\n\n${license}\n`;
  }

  generateApiDocs(context) {
    return this.buildApiDocs(this.normalizeContext(context));
  }

  buildApiDocs(context) {
    const { projectName, domains } = context;
    const normalizedProjectSlug = projectName.toLowerCase().replace(/\s+/g, '-');

    const domainDocs = domains.length > 0
      ? domains
          .map((domain) => {
            const domainName = domain.charAt(0).toUpperCase() + domain.slice(1);
            const domainSlug = domain.toLowerCase().replace(/\s+/g, '-');
            return `## ${domainName} Domain API\n\n### Endpoints\n\n- **GET** /api/${domainSlug} - List all ${domainName} entities\n- **POST** /api/${domainSlug} - Create new ${domainName} entity\n- **GET** /api/${domainSlug}/:id - Get specific ${domainName} entity\n- **PUT** /api/${domainSlug}/:id - Update ${domainName} entity\n- **DELETE** /api/${domainSlug}/:id - Delete ${domainName} entity\n\n### Data Models\n\nSee \`libs/shared/database-types/\` for complete data models.\n`;
          })
          .join('\n')
      : `## Domains\n\nNo domain endpoints defined yet.\n`;

    return `# ${projectName} API Reference\n\n## Base URL\n\n\`\`\`\nhttps://api.${normalizedProjectSlug}.com/v1\n\`\`\`\n\n## Authentication\n\nAll API endpoints require authentication:\n\n\`\`\`\nAuthorization: Bearer <your-token>\n\`\`\`\n\n${domainDocs}\n\n## Error Handling\n\n\`\`\`json\n{\n  "error": {\n    "code": "ERROR_CODE",\n    "message": "Human readable error message"\n  }\n}\n\`\`\`\n`;
  }

  generateArchitectureGuide(context) {
    return this.buildArchitectureGuide(this.normalizeContext(context));
  }

  buildArchitectureGuide(context) {
    const { projectName, domains } = context;

    const domainSections = domains.length > 0
      ? domains
          .map((domain) => {
            const domainName = domain.charAt(0).toUpperCase() + domain.slice(1);
            return `#### ${domainName} Domain\n\n- **Entities**: Core business objects with identity\n- **Value Objects**: Immutable data structures\n- **Domain Services**: Complex business operations\n- **Repository Interfaces**: Data access abstractions\n`;
          })
          .join('\n\n')
      : '';

    const boundedContextsSection = domainSections
      ? `### Bounded Contexts\n\n${domainSections}\n\n`
      : `### Bounded Contexts\n\nNo bounded contexts defined yet.\n\n`;

    return `# Architecture Guide\n\nThis document describes the architectural patterns for ${projectName}.\n\n## Hexagonal Architecture\n\nThis project follows **Hexagonal Architecture** (Ports and Adapters pattern):\n\n- **Separation of Concerns**: Clear boundaries between business logic and external concerns\n- **Testability**: Easy to unit test business logic in isolation\n- **Flexibility**: Easy to swap out external dependencies\n- **Maintainability**: Changes to external systems don't affect business rules\n\n### Architecture Diagram\n\n\`\`\`mermaid\ngraph TD\n    UI[User Interface] --> App[Application Layer]\n    API[REST API] --> App\n    App --> Domain[Domain Layer]\n    App --> Infra[Infrastructure Layer]\n    Infra --> DB[Database]\n    Infra --> External[External Services]\n\`\`\`\n\n## Domain-Driven Design\n\n${boundedContextsSection}## Layer Structure\n\n1. **Domain Layer** (\`libs/{domain}/domain/\`): Pure business logic\n2. **Application Layer** (\`libs/{domain}/application/\`): Use cases and ports\n3. **Infrastructure Layer** (\`libs/{domain}/infrastructure/\`): External adapters\n4. **Interface Layer** (\`apps/{app-name}/\`): User/system interfaces\n\n## Testing Strategy\n\n- **Unit Tests**: Test domain logic in isolation\n- **Integration Tests**: Test with real databases and external services\n- **Architecture Tests**: Verify layer dependencies are correct\n`;
  }

  generateReadmeTemplate(context) {
    return `# {{project_name}}\n\n{{project_description}}\n\n## Getting Started\n\nThis project follows **Hexagonal Architecture** principles.\n\n{% for domain in domains %}\n- **{{domain}}**: Core business domain\n{% endfor %}\n\n{% if include_ai %}\n### AI-Enhanced Features\nThis project includes AI-enhanced development workflows.\n{% endif %}\n\n## License\n{{license|default('MIT License')}}\n`;
  }

  generateArchitectureTemplate(context) {
    return `# Architecture Guide\n\nThis document describes the architectural patterns for {{project_name}}.\n\n## Hexagonal Architecture\n\n{% for domain in domains %}\n#### {{domain|title}} Domain\n- **Entities**: Core business objects\n- **Value Objects**: Immutable data structures\n{% endfor %}\n`;
  }

  generateApiTemplate(context) {
    return `# {{project_name}} API Reference\n\n{% for domain in domains %}\n## {{domain|title}} Domain API\n\n### Endpoints\n- GET /api/{{domain}}\n- POST /api/{{domain}}\n{% endfor %}\n`;
  }
}

module.exports = { DocumentationGenerator };
