/**
 * Generator Spec Schema Examples Validation
 *
 * Validates that JSON Schema examples in generator specs:
 * - Are valid JSON Schema draft-07 compliant
 * - Include all necessary validation keywords
 * - Map correctly to TypeScript types
 *
 * Traceability: DEV-PRD-019, DEV-SDS-019
 */

import { readFileSync } from 'fs';
import Ajv from 'ajv';

describe('Generator Spec Schema Examples', () => {
  const ajv = new Ajv({ strict: false, validateFormats: false });

  test('GENERATOR_SPEC.md schema examples are valid JSON', () => {
    const specPath = 'templates/{{project_slug}}/docs/specs/generators/GENERATOR_SPEC.md';
    const spec = readFileSync(specPath, 'utf-8');

    // Extract JSON code blocks
    const jsonBlockRegex = /```json\n([\s\S]*?)\n```/g;
    const jsonBlocks: string[] = [];
    let match;

    while ((match = jsonBlockRegex.exec(spec)) !== null) {
      jsonBlocks.push(match[1]);
    }

    expect(jsonBlocks.length).toBeGreaterThan(0);

    jsonBlocks.forEach((block, index) => {
      try {
        const parsed = JSON.parse(block);
        expect(parsed).toBeDefined();
      } catch (error) {
        fail(`JSON block ${index + 1} is invalid: ${error}`);
      }
    });
  });

  test('GENERATOR_SPEC.md schema examples are valid JSON Schema', () => {
    const specPath = 'templates/{{project_slug}}/docs/specs/generators/GENERATOR_SPEC.md';
    const spec = readFileSync(specPath, 'utf-8');

    // Extract JSON code blocks
    const jsonBlockRegex = /```json\n([\s\S]*?)\n```/g;
    const jsonBlocks: string[] = [];
    let match;

    while ((match = jsonBlockRegex.exec(spec)) !== null) {
      jsonBlocks.push(match[1]);
    }

    // Find schema-like blocks (contain "$schema" or have type/properties)
    const schemaBlocks = jsonBlocks.filter((block) => {
      try {
        const parsed = JSON.parse(block);
        return parsed.$schema || (parsed.type && parsed.properties);
      } catch {
        return false;
      }
    });

    expect(schemaBlocks.length).toBeGreaterThan(0);

    schemaBlocks.forEach((block, index) => {
      try {
        const schema = JSON.parse(block);
        const valid = ajv.validateSchema(schema);

        if (!valid && ajv.errors) {
          fail(`Schema block ${index + 1} is invalid: ${JSON.stringify(ajv.errors, null, 2)}`);
        }

        expect(valid).toBe(true);
      } catch (error) {
        fail(`Schema block ${index + 1} failed validation: ${error}`);
      }
    });
  });

  test('Type mapping matrix covers essential JSON Schema types', () => {
    const specPath = 'templates/{{project_slug}}/docs/specs/generators/GENERATOR_SPEC.md';
    const spec = readFileSync(specPath, 'utf-8');

    const essentialTypes = ['string', 'number', 'boolean', 'array', 'object'];

    essentialTypes.forEach((type) => {
      // Check if type appears in a table row (markdown table format)
      const tableRowRegex = new RegExp(`\\|.*\`${type}\`.*\\|`, 'i');
      expect(spec).toMatch(tableRowRegex);
    });
  });

  test('Schema examples include validation keywords', () => {
    const specPath = 'templates/{{project_slug}}/docs/specs/generators/GENERATOR_SPEC.md';
    const spec = readFileSync(specPath, 'utf-8');

    // Common validation keywords that should appear
    const validationKeywords = ['type', 'properties', 'required'];

    validationKeywords.forEach((keyword) => {
      expect(spec).toContain(`"${keyword}"`);
    });
  });

  test('Schema examples show TypeScript interface mapping', () => {
    const specPath = 'templates/{{project_slug}}/docs/specs/generators/GENERATOR_SPEC.md';
    const spec = readFileSync(specPath, 'utf-8');

    // Should have TypeScript code blocks with interfaces
    expect(spec).toContain('```ts');
    expect(spec).toContain('interface');
    expect(spec).toContain('Schema');
  });
});
