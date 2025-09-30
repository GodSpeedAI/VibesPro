import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Maintainer docs present in generated template', () => {
  it('contains dev_adr.md and dev_prd.md in template docs', () => {
    const base = join(process.cwd(), 'templates', '{{project_slug}}', 'docs');
    const adr = readFileSync(join(base, 'dev_adr.md'), 'utf8');
    const prd = readFileSync(join(base, 'dev_prd.md'), 'utf8');
    expect(adr.length).toBeGreaterThan(0);
    expect(prd.length).toBeGreaterThan(0);
  });
});
