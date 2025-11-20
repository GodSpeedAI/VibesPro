/**
 * Test that scripts are properly generated in new projects.
 *
 * Phase: PHASE-003 / TASK-007
 * Traceability: AI_ADR-004, AI_PRD-003, AI_SDS-003, AI_TS-001
 */

import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { runCopierGeneration } from '../../utils/generation-smoke';

describe('Generated Project Scripts', () => {
  let generatedProjectPath: string;

  beforeAll(async () => {
    generatedProjectPath = await runCopierGeneration({
      dataFile: 'tests/fixtures/test-data.yml',
      useDefaults: true,
      force: true,
      skipPostGenSetup: true,
    });
  });

  afterAll(async () => {
    if (generatedProjectPath) {
      await fs.rm(generatedProjectPath, { recursive: true, force: true });
    }
  });

  it('should include scripts directory in generated project', async () => {
    const scriptsDir = join(generatedProjectPath, 'scripts');
    const stats = await fs.stat(scriptsDir);
    expect(stats.isDirectory()).toBe(true);
  });

  it('should include bundle-context.sh script', async () => {
    const scriptPath = join(generatedProjectPath, 'scripts', 'dev', 'bundle-context.sh');
    const stats = await fs.stat(scriptPath);
    expect(stats.isFile()).toBe(true);

    // Verify script is executable
    const isExecutable = (stats.mode & 0o111) !== 0;
    expect(isExecutable).toBe(true);
  });

  it('should have valid bash shebang in bundle-context.sh', async () => {
    const scriptPath = join(generatedProjectPath, 'scripts', 'dev', 'bundle-context.sh');
    const content = await fs.readFile(scriptPath, 'utf-8');

    expect(content).toMatch(/^#!\/usr\/bin\/env bash/);
  });

  it('should include error handling directives', async () => {
    const scriptPath = join(generatedProjectPath, 'scripts', 'dev', 'bundle-context.sh');
    const content = await fs.readFile(scriptPath, 'utf-8');

    expect(content).toContain('set -euo pipefail');
  });
});
