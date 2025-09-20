// Test file: tests/generators/app.test.ts
// RED phase: Failing test for MERGE-TASK-004: Application Generator Template

import { describe, it, expect, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { runGenerator, cleanupGeneratorOutputs } from './utils';

describe('Application Generator', () => {
  afterEach(async () => {
    await cleanupGeneratorOutputs();
  });

  it('should generate React applications with proper architecture', async () => {
    const result = await runGenerator('app', {
      name: 'admin-portal',
      framework: 'next',
      domains: ['user-management', 'billing'],
    });

    expect(result.success).toBe(true);
    expect(result.files).toContain('apps/admin-portal/pages/index.tsx');
    expect(result.files).toContain('apps/admin-portal/lib/api-client.ts');

    const apiClientPath = path.join(result.outputPath, 'apps/admin-portal/lib/api-client.ts');
    if (fs.existsSync(apiClientPath)) {
      const contents = await fs.promises.readFile(apiClientPath, 'utf-8');
      expect(contents).toContain('user-management');
      expect(contents).toContain('billing');
    }
  }, 30000);
});
