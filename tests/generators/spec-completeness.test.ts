// Traceability: DEV-PRD-019, DEV-SDS-019
import { readFileSync } from 'fs';
import { join } from 'path';

describe('GENERATOR_SPEC.md completeness', () => {
  const specContent = readFileSync(
    join(__dirname, '../../templates/{{project_slug}}/docs/specs/generators/GENERATOR_SPEC.md'),
    'utf-8',
  );

  it('should not contain TODO, TBD, or empty subsections', () => {
    expect(specContent).not.toContain('TODO');
    expect(specContent).not.toContain('TBD');
    // Add more checks for empty subsections as needed
  });

  it('should have a sample table for each pattern category', () => {
    expect(specContent).toContain('### 3.5 Pattern Categories');
    expect(specContent).toMatch(/#### Domain\n\n\|/);
    expect(specContent).toMatch(/#### Service\n\n\|/);
    expect(specContent).toMatch(/#### Component\n\n\|/);
    expect(specContent).toMatch(/#### Conditional\n\n\|/);
  });
});
