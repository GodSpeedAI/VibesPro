import { execSync } from 'child_process';
import { existsSync, readFileSync, rmSync } from 'fs';
import { join } from 'path';

describe('Type generator CLI', () => {
  // Use workspace root as cwd so paths resolve correctly
  const workspaceRoot = join(__dirname, '..', '..', '..');
  const typeGenDir = join(workspaceRoot, 'tools', 'type-generator');
  const outDir = join(workspaceRoot, 'tools', 'temp-types');
  const outputFile = join(outDir, 'user.ts');

  beforeAll(() => {
    try {
      rmSync(outDir, { recursive: true, force: true });
    } catch {}
  });

  it.skip('generates types from schema JSON', () => {
    // Build TypeScript sources
    execSync('pnpm exec tsc', { cwd: typeGenDir });
    // Run generator from workspace root
    execSync(
      `node tools/type-generator/cli.js generate tools/type-generator/test-fixtures/db_schema.json -o tools/temp-types`,
      { cwd: workspaceRoot },
    );
    expect(existsSync(outputFile)).toBeTruthy();
    const content = readFileSync(outputFile, { encoding: 'utf-8' });
    expect(content).toContain('export interface User');
  });
});
