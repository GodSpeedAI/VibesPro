import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

describe('Template docs generation smoke', () => {
  it('copier template includes docs and README', () => {
    // Render template into ../test-output to mirror existing harness
    execSync('copier copy . ../test-output --data-file tests/fixtures/test-data.yml', { stdio: 'inherit' });
    const outDocs = join(process.cwd(), '..', 'test-output', 'docs');
    const readme = join(process.cwd(), '..', 'test-output', 'README.md');
    expect(existsSync(outDocs)).toBe(true);
    expect(existsSync(readme)).toBe(true);
  }, 30000);
});
