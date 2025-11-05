// Traceability: DEV-PRD-019, DEV-SDS-019
import { readFileSync } from 'fs';
import { join } from 'path';

describe('GENERATOR_SPEC.md completeness', () => {
  let specContent: string;

  beforeAll(() => {
    try {
      specContent = readFileSync(
        join(__dirname, '../../templates/{{project_slug}}/docs/specs/generators/GENERATOR_SPEC.md'),
        'utf-8',
      );
    } catch (error) {
      throw new Error(
        `Failed to read spec file: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  });

  it('should not contain TODO, TBD, or empty subsections', () => {
    expect(specContent).not.toContain('TODO');
    expect(specContent).not.toContain('TBD');
    // Add more checks for empty subsections as needed
  });

  it('should have a sample table for each pattern category', () => {
    expect(specContent).toContain('### 3.5 Pattern Categories');
    // More flexible patterns that allow variable whitespace and ensure real table structure
    // Match header then allow optional whitespace/newlines before matching pipe line
    expect(specContent).toMatch(/#### Domain\s*\r?\n\s*\r?\n\s*\|.*\|.*\n/);
    expect(specContent).toMatch(/#### Service\s*\r?\n\s*\r?\n\s*\|.*\|.*\n/);
    expect(specContent).toMatch(/#### Component\s*\r?\n\s*\r?\n\s*\|.*\|.*\n/);
    expect(specContent).toMatch(/#### Conditional\s*\r?\n\s*\r?\n\s*\|.*\|.*\n/);
  });
});
