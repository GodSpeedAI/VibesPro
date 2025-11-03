// Traceability: DEV-PRD-019, DEV-SDS-019
import { readFileSync } from 'fs';
import { join } from 'path';

describe('GENERATOR_SPEC.md template', () => {
  const specContent = readFileSync(
    join(__dirname, '../../templates/{{project_slug}}/docs/specs/generators/GENERATOR_SPEC.md'),
    'utf-8',
  );

  it('should not contain TODO strings in sections 1-4', () => {
    const sections = specContent.split('---');
    const sections1to4 = sections.slice(1, 5).join('---');
    expect(sections1to4).not.toContain('TODO');
  });

  it('should have required headings', () => {
    expect(specContent).toContain('## 1) Purpose & Scope');
    expect(specContent).toContain('## 2) Invocation & Placement (once implemented)');
    expect(specContent).toContain('## 3) Inputs / Options (Schema)');
    expect(specContent).toContain('## 4) Outputs / Artifacts');
  });
});
