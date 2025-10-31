/**
 * MERGE-TASK-011: Documentation Generation Tests
 *
 * GREEN Phase: Passing tests with working documentation generator implementation
 * Traceability: PRD-MERGE-006, ADR-MERGE-008
 */

// Import the ES module generator
import { DocumentationGenerator } from '../../tools/docs/generator.js';

describe('Documentation Generation', () => {
  it('should have documentation generation tools', () => {
    expect(DocumentationGenerator).toBeDefined();
  });

  it('should generate complete project documentation', async () => {
    // Test the implemented documentation generator
    const mockContext = {
      projectName: 'test-project',
      description: 'Test project for documentation generation',
      domains: ['user-management', 'billing'],
      architecture: 'hexagonal',
      frameworks: ['next', 'fastapi'],
      includeAI: true,
    };

    const generator = new DocumentationGenerator('/tmp/test');
    const docs = await generator.generateDocumentation(mockContext);

    expect(docs.readme).toContain('Getting Started');
    expect(docs.apiDocs).toBeDefined();
    expect(docs.architectureGuide).toContain('Hexagonal Architecture');
  });
});
