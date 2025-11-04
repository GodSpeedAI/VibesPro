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
    if (!schemaJsonMatch) {
      throw new Error('Could not find schema.json in GENERATOR_SPEC.md');
    }
    const schemaJson = JSON.parse(schemaJsonMatch[1]);

    const typeFileMatch = specFileContent.match(/```ts\n([\s\S]*?)```/);
    if (!typeFileMatch) {
      throw new Error('Could not find schema.d.ts in GENERATOR_SPEC.md');
    }
    const typeFileContent = typeFileMatch[1].replaceAll('<Type>', 'MyType');

    const sourceFile = project.createSourceFile('temp.ts', typeFileContent);
    const interfaces = sourceFile.getInterfaces();
    if (interfaces.length === 0) {
      throw new Error('No interface found in generated TypeScript content');
    }
    const anInterface = interfaces[0];
    const properties = anInterface.getProperties();

    const schemaProperties = Object.keys(schemaJson.properties);
    const interfaceProperties = properties.map((p) => p.getName());

    expect(schemaProperties.sort()).toEqual(interfaceProperties.sort());

    // Validate property types and optionality
    const expectedProps = new Map<string, { type: string; required: boolean }>();
    for (const [name, schema] of Object.entries(schemaJson.properties)) {
      const schemaDef = schema as { type: string | string[]; required?: string[] };
      const types = Array.isArray(schemaDef.type) ? schemaDef.type : [schemaDef.type];
      const typeString = types.join(' | ');
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
      expect(expected?.type).toBe(actual.type);
      expect(expected?.required).toBe(actual.required);
    });
  });
});
