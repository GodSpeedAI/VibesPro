// Traceability: DEV-PRD-019-F, DEV-SDS-019
import { readFileSync } from 'fs';
import { join } from 'path';
import { Project } from 'ts-morph';

describe('Schema to Types Parity', () => {
  it('should have parity between schema.json and schema.d.ts', () => {
    const project = new Project({
      tsConfigFilePath: join(__dirname, '../../tsconfig.spec.json'),
    });

    const specFileContent = readFileSync(
      join(__dirname, '../../templates/{{project_slug}}/docs/specs/generators/GENERATOR_SPEC.md'),
      'utf-8',
    );

    const schemaJsonMatch = specFileContent.match(/```json\n([\s\S]*?)```/);
    if (!schemaJsonMatch?.[1]) {
      throw new Error('Could not find schema.json in GENERATOR_SPEC.md');
    }
    const schemaJson = JSON.parse(schemaJsonMatch[1]);

    const typeFileMatch = specFileContent.match(/```ts\n([\s\S]*?)```/);
    if (!typeFileMatch?.[1]) {
      throw new Error('Could not find schema.d.ts in GENERATOR_SPEC.md');
    }
    const typeFileContent = typeFileMatch[1].replaceAll('<Type>', 'MyType');

    const sourceFile = project.createSourceFile('temp.ts', typeFileContent);
    const interfaces = sourceFile.getInterfaces();
    const anInterface = interfaces[0];
    if (!anInterface) {
      throw new Error('No interface found in generated TypeScript content');
    }
    const properties = anInterface.getProperties();

    const schemaProperties = Object.keys(schemaJson.properties);
    const interfaceProperties = properties.map((p) => p.getName());

    expect(schemaProperties.sort()).toEqual(interfaceProperties.sort());

    // Helper function to normalize type strings for semantic comparison
    const normalizeTypeString = (typeString: string): string => {
      return typeString
        .replace(/\s+/g, ' ') // Remove all whitespace
        .split('|') // Split by union separator
        .map((type) => type.trim()) // Trim each type
        .sort() // Sort union members
        .join('|'); // Rejoin with separator
    };

    // Helper function to map JSON Schema types to TypeScript types
    const mapJsonSchemaToTypeScript = (schema: {
      type?: string | string[];
      enum?: Array<string | number | boolean | null>;
    }): string => {
      if (Array.isArray(schema.enum) && schema.enum.length > 0) {
        return schema.enum
          .map((value) => {
            if (typeof value === 'string') {
              return `'${value}'`;
            }
            return JSON.stringify(value);
          })
          .join(' | ');
      }

      const types = schema.type;
      if (types === undefined || (Array.isArray(types) && types.length === 0)) {
        return 'unknown';
      }
      const typeArray = Array.isArray(types) ? types : [types];
      const mappedTypes: string[] = [];

      for (const type of typeArray) {
        switch (type) {
          case 'integer':
            mappedTypes.push('number');
            break;
          case 'null':
            mappedTypes.push('null');
            break;
          case 'array':
            mappedTypes.push('unknown[]');
            break;
          case 'object':
            mappedTypes.push('Record<string, unknown>');
            break;
          case 'string':
          case 'number':
          case 'boolean':
            mappedTypes.push(type);
            break;
          default:
            mappedTypes.push(type);
        }
      }

      return mappedTypes.join(' | ');
    };

    // Validate property types and optionality
    const expectedProps = new Map<string, { type: string; required: boolean }>();
    for (const [name, schema] of Object.entries(schemaJson.properties)) {
      const schemaDef = schema as {
        type?: string | string[];
        enum?: Array<string | number | boolean | null>;
        required?: string[];
      };
      const mappedTypes = mapJsonSchemaToTypeScript(schemaDef);
      const typeString = mappedTypes;
      const required = Array.isArray(schemaJson.required)
        ? schemaJson.required.includes(name)
        : false;
      expectedProps.set(name, { type: typeString, required });
    }

    const actualProps = properties.map((prop) => {
      const name = prop.getName();
      const typeNode = prop.getTypeNode();
      const typeString = typeNode ? typeNode.getText() : 'unknown';
      const isOptional = prop.hasQuestionToken();
      return { name, type: typeString, required: !isOptional };
    });

    expect(actualProps).toHaveLength(expectedProps.size);
    actualProps.forEach((actual) => {
      const expected = expectedProps.get(actual.name);
      expect(expected).toBeDefined();

      // Use semantic comparison instead of exact string equality
      const normalizedExpected = normalizeTypeString(expected?.type || '');
      const normalizedActual = normalizeTypeString(actual.type);

      expect(normalizedActual).toBe(normalizedExpected);
      expect(expected?.required).toBe(actual.required);
    });
  });
});
