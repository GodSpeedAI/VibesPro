// Traceability: DEV-PRD-019, DEV-SDS-019
import { readFileSync } from 'fs';
import { join } from 'path';

describe('GENERATOR_SPEC.md template', () => {
  let specContent: string;

  beforeAll(() => {
    try {
      specContent = readFileSync(
        join(__dirname, '../../templates/{{project_slug}}/docs/specs/generators/GENERATOR_SPEC.md'),
        'utf-8',
      );
    } catch (error) {
      throw new Error(
        `Failed to read GENERATOR_SPEC.md file: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  });

  it('should not contain TODO strings in sections 1-4', () => {
    const sections = specContent.split('---');
    expect(sections.length).toBeGreaterThanOrEqual(5);
    const sections1to4 = sections.slice(1, 5).join('---');
    expect(sections1to4).not.toContain('TODO');
  });

  it('should have required headings', () => {
    expect(specContent).toContain('## 1) Purpose & Scope');
    expect(specContent).toContain('## 2) Invocation & Placement (once implemented)');
    expect(specContent).toContain('## 3) Inputs / Options (Schema)');
    expect(specContent).toContain('## 4) Outputs / Artifacts');
  });

  it('should contain a schema enum example', () => {
    expect(specContent).toContain('"enum":');
  });

  it('should contain a conditional logic example', () => {
    expect(specContent).toContain('**Validation Rules**');
  });

  it('should contain a prompt type example', () => {
    expect(specContent).toContain('The type of component to create.');
  });
});
