// Traceability: DEV-PRD-019-F, DEV-SDS-019
import { readFileSync } from 'fs';
import { join } from 'path';
import { Project } from 'ts-morph';

describe('Schema to Types Parity', () => {
  it('should have parity between schema.json and schema.d.ts', () => {
    const project = new Project({
      tsConfigFilePath: join(__dirname, '../../tsconfig.spec.json'),
    });

    const schemaJsonRaw = readFileSync(
      join(__dirname, '../../templates/{{project_slug}}/docs/specs/generators/GENERATOR_SPEC.md'),
      'utf-8',
    );
    const schemaJsonMatch = schemaJsonRaw.match(/```json\n([\s\S]*?)```/);
    if (!schemaJsonMatch) {
      throw new Error('Could not find schema.json in GENERATOR_SPEC.md');
    }
    const schemaJson = JSON.parse(schemaJsonMatch[1]);

    const typeFileRaw = readFileSync(
      join(__dirname, '../../templates/{{project_slug}}/docs/specs/generators/GENERATOR_SPEC.md'),
      'utf-8',
    );
    const typeFileMatch = typeFileRaw.match(/```ts\n([\s\S]*?)```/);
    if (!typeFileMatch) {
      throw new Error('Could not find schema.d.ts in GENERATOR_SPEC.md');
    }
    const typeFileContent = typeFileMatch[1].replace('<Type>', 'MyType');

    const sourceFile = project.createSourceFile('temp.ts', typeFileContent);
    const anInterface = sourceFile.getInterfaces()[0];
    const properties = anInterface.getProperties();

    const schemaProperties = Object.keys(schemaJson.properties);
    const interfaceProperties = properties.map((p) => p.getName());

    expect(schemaProperties.sort()).toEqual(interfaceProperties.sort());
  });
});
