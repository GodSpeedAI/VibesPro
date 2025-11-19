import { execSync } from 'child_process';
import { existsSync, readFileSync, rmSync } from 'fs';
import { join } from 'path';

describe('Type generator CLI', () => {
  const cwd = join(__dirname, '..');
  const outDir = join(cwd, '..', 'temp-types');
  const outputFile = join(outDir, 'user.ts');

  beforeAll(() => {
    try {
      rmSync(outDir, { recursive: true, force: true });
    } catch {}
  });

  it('generates types from schema JSON', () => {
    // Build TypeScript sources
    execSync('pnpm exec tsc', { cwd });
    // Run generator
    execSync(`node ./cli.js generate test-fixtures/db_schema.json -o ${outDir}`, { cwd });
    expect(existsSync(outputFile)).toBeTruthy();
    const content = readFileSync(outputFile, { encoding: 'utf-8' });
    expect(content).toContain('export interface User');
  });
});
