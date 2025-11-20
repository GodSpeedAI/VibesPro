import { execSync } from 'child_process';
import { join } from 'path';

describe('Type generator verify CLI', () => {
  const cwd = join(__dirname, '..');

  it('verifies TypeScript and Python types are compatible for fixtures', () => {
    execSync('pnpm exec tsc', { cwd });
    // run verify against test-fixtures
    execSync(
      'node cli.js verify tools/type-generator/test-fixtures/ts tools/type-generator/test-fixtures/py',
      { cwd },
    );
  });
});
