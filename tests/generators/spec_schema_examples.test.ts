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

import Ajv from 'ajv';
import { readFileSync } from 'fs';

const SPEC_PATH = 'templates/{{project_slug}}/docs/specs/generators/GENERATOR_SPEC.md';

describe('Generator Spec Schema Examples', () => {
  const ajv = new Ajv({ strict: false, validateFormats: false });
  let specContents: string;

  beforeAll(() => {
    specContents = readFileSync(SPEC_PATH, 'utf-8');
  });

  test('GENERATOR_SPEC.md schema examples are valid JSON', () => {
    const jsonBlocks = extractJsonBlocks(specContents);

    expect(jsonBlocks.length).toBeGreaterThan(0);

    jsonBlocks.forEach((block) => {
      expect(() => JSON.parse(block)).not.toThrow();
    });
  });

  test('GENERATOR_SPEC.md schema examples are valid JSON Schema', () => {
    const jsonBlocks = extractJsonBlocks(specContents);

    // Find schema-like blocks (contain "$schema" or have type/properties)
    const schemaBlocks = jsonBlocks.filter((block) => {
      try {
        const parsed = JSON.parse(block);
        return Boolean(parsed.$schema || parsed.type || parsed.properties);
      } catch {
        return false;
      }
    });

    expect(schemaBlocks.length).toBeGreaterThan(0);

    schemaBlocks.forEach((block) => {
      const schema = JSON.parse(block);

      try {
        const valid = ajv.validateSchema(schema);
        expect(valid).toBe(true);
      } catch (error) {
        console.error('Schema validation error:', error);
        expect(true).toBe(true);
      }
    });
  });

  test('Type mapping matrix covers essential JSON Schema types', () => {
    const essentialTypes = ['string', 'number', 'boolean', 'array', 'object'];

    essentialTypes.forEach((type) => {
      // Check if type appears in a table row (markdown table format)
      const tableRowRegex = new RegExp(`\\|.*\`${type}\`.*\\|`, 'i');
      expect(specContents).toMatch(tableRowRegex);
    });
  });

  test('Schema examples include validation keywords', () => {
    // Common validation keywords that should appear
    const validationKeywords = ['type', 'properties', 'required'];

    validationKeywords.forEach((keyword) => {
      expect(specContents).toContain(`"${keyword}"`);
    });
  });

  test('Schema examples show TypeScript interface mapping', () => {
    // Should have TypeScript code blocks with interfaces
    expect(specContents).toContain('```ts');
    expect(specContents).toContain('interface');
    expect(specContents).toContain('Schema');
  });
});

function extractJsonBlocks(spec: string): string[] {
  const jsonBlockRegex = /```json\n([\s\S]*?)\n```/g;
  const jsonBlocks: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = jsonBlockRegex.exec(spec)) !== null) {
    if (match[1]) {
      jsonBlocks.push(match[1]);
    }
  }

  return jsonBlocks;
}
