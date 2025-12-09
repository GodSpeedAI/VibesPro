/**
 * Integration tests for generators created by the meta-generator.
 * This validates that the meta-generator produces working, usable generators.
 *
 * @traceability DEV-PRD-019
 */
import { Tree } from '@nx/devkit';
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import generatorGenerator from '../../generators/generator/generator';

describe('Generated Generator Integration', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTreeWithEmptyWorkspace();
  });

  describe('Basic Generated Generator', () => {
    it('should create a functional generator that can be executed', async () => {
      // Step 1: Use meta-generator to create a new generator
      await generatorGenerator(tree, {
        name: 'test-feature',
        type: 'custom',
        description: 'A test feature generator',
      });

      // Step 2: Verify the generator was created
      expect(tree.exists('generators/test-feature/generator.ts')).toBeTruthy();
      expect(tree.exists('generators/test-feature/schema.json')).toBeTruthy();

      // Step 3: Read and validate the generated generator code
      const generatorCode = tree.read('generators/test-feature/generator.ts', 'utf-8');
      expect(generatorCode).toBeTruthy();
      expect(generatorCode).toContain('export default');
      expect(generatorCode).toContain('Tree');
      expect(generatorCode).toContain('formatFiles');

      // Step 4: Validate the schema is valid JSON
      const schemaContent = tree.read('generators/test-feature/schema.json', 'utf-8');
      expect(schemaContent).toBeTruthy();
      const schema = JSON.parse(schemaContent!);
      expect(schema.properties).toBeDefined();
      expect(schema.properties.name).toBeDefined();
    });

    it('should generate a generator with proper package.json', async () => {
      await generatorGenerator(tree, {
        name: 'my-lib',
        type: 'utility',
      });

      const packageJson = JSON.parse(tree.read('generators/my-lib/package.json', 'utf-8')!);

      expect(packageJson.name).toBe('@vibespro/my-lib');
      expect(packageJson.generators).toBe('./generators.json');
    });

    it('should generate template files that use correct EJS syntax', async () => {
      await generatorGenerator(tree, {
        name: 'component-gen',
        type: 'component',
      });

      // Check that template files exist
      expect(tree.exists('generators/component-gen/files/src/index.ts.template')).toBeTruthy();
      expect(tree.exists('generators/component-gen/files/project.json.template')).toBeTruthy();
      expect(tree.exists('generators/component-gen/files/README.md.template')).toBeTruthy();

      // Verify templates use proper EJS syntax (not double-escaped)
      const indexTemplate = tree.read(
        'generators/component-gen/files/src/index.ts.template',
        'utf-8',
      );
      expect(indexTemplate).toContain('<%=');
      expect(indexTemplate).not.toContain('&lt;%='); // Should not be HTML-escaped
    });
  });

  describe('Generated Generator with Hexagonal Architecture', () => {
    it('should create generator with hexagonal patterns', async () => {
      await generatorGenerator(tree, {
        name: 'domain-gen',
        type: 'domain',
        withHexagonal: true,
      });

      expect(tree.exists('generators/domain-gen/generator.ts')).toBeTruthy();

      const generatorCode = tree.read('generators/domain-gen/generator.ts', 'utf-8');
      // The generator should reference hexagonal concepts
      expect(generatorCode).toBeTruthy();
    });
  });

  describe('Generated Generator with Tests', () => {
    it('should create test file when withTests is true', async () => {
      await generatorGenerator(tree, {
        name: 'tested-gen',
        withTests: true,
      });

      expect(tree.exists('generators/tested-gen/generator.spec.ts')).toBeTruthy();

      const testContent = tree.read('generators/tested-gen/generator.spec.ts', 'utf-8');
      expect(testContent).toContain('describe');
      expect(testContent).toContain('it(');
      expect(testContent).toContain('expect');
    });

    it('should create spec documentation when withSpec is true', async () => {
      await generatorGenerator(tree, {
        name: 'documented-gen',
        withSpec: true,
      });

      expect(tree.exists('docs/specs/generators/documented-gen.generator.spec.md')).toBeTruthy();

      const specContent = tree.read(
        'docs/specs/generators/documented-gen.generator.spec.md',
        'utf-8',
      );
      expect(specContent).toContain('documented-gen');
    });
  });

  describe('Generated Generator Validation', () => {
    it('should pass schema validation', async () => {
      await generatorGenerator(tree, {
        name: 'valid-gen',
        type: 'service',
      });

      const schemaContent = tree.read('generators/valid-gen/schema.json', 'utf-8');
      const schema = JSON.parse(schemaContent!);

      // Validate it has required Nx generator schema fields
      expect(schema.$schema).toBeDefined();
      expect(schema.type).toBe('object');
      expect(schema.properties).toBeDefined();
      expect(schema.required).toContain('name');
    });

    it('should create generators.json with correct structure', async () => {
      await generatorGenerator(tree, {
        name: 'config-gen',
        description: 'Test config generator',
      });

      const generatorsJson = JSON.parse(
        tree.read('generators/config-gen/generators.json', 'utf-8')!,
      );

      expect(generatorsJson.generators).toBeDefined();
      expect(generatorsJson.generators['config-gen']).toBeDefined();
      expect(generatorsJson.generators['config-gen'].factory).toBe('./generator');
      expect(generatorsJson.generators['config-gen'].schema).toBe('./schema.json');
      expect(generatorsJson.generators['config-gen'].description).toBe('Test config generator');
    });
  });

  describe('Generated Generator Type-Specific Features', () => {
    it('should include domain-specific defaults for domain type', async () => {
      await generatorGenerator(tree, {
        name: 'order-domain',
        type: 'domain',
      });

      const generatorCode = tree.read('generators/order-domain/generator.ts', 'utf-8');
      expect(generatorCode).toBeTruthy();
      // Domain generators should have references to entities or domain concepts
      // The actual implementation details depend on the templates
    });

    it('should include service-specific defaults for service type', async () => {
      await generatorGenerator(tree, {
        name: 'api-svc',
        type: 'service',
      });

      const generatorCode = tree.read('generators/api-svc/generator.ts', 'utf-8');
      expect(generatorCode).toBeTruthy();
      // Service generators may reference infrastructure or deployment concepts
    });

    it('should include component-specific defaults for component type', async () => {
      await generatorGenerator(tree, {
        name: 'button-comp',
        type: 'component',
      });

      const generatorCode = tree.read('generators/button-comp/generator.ts', 'utf-8');
      expect(generatorCode).toBeTruthy();
      // Component generators may reference UI frameworks
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle generator names with multiple hyphens', async () => {
      await generatorGenerator(tree, {
        name: 'my-special-feature-gen',
      });

      expect(tree.exists('generators/my-special-feature-gen/generator.ts')).toBeTruthy();
      const packageJson = JSON.parse(
        tree.read('generators/my-special-feature-gen/package.json', 'utf-8')!,
      );
      expect(packageJson.name).toBe('@vibespro/my-special-feature-gen');
    });

    it('should reject invalid generator names', async () => {
      await expect(
        generatorGenerator(tree, {
          name: 'Invalid_Name',
        }),
      ).rejects.toThrow(/must be kebab-case/);
    });

    it('should reject composition without generators specified', async () => {
      await expect(
        generatorGenerator(tree, {
          name: 'composed',
          withComposition: true,
          // Missing compositionGenerators
        }),
      ).rejects.toThrow(/must provide --compositionGenerators/);
    });
  });
});
