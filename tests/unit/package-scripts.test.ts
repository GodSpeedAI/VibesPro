/**
 * Unit tests for package.json script wiring.
 *
 * Phase: PHASE-003 / TASK-008
 * Traceability: AI_ADR-004, AI_PRD-003, AI_SDS-003, AI_TS-001
 *
 * Tests verify that package.json in the current repository and generated
 * projects contain the required AI workflow scripts.
 */

import { promises as fs } from 'node:fs';
import { join } from 'node:path';

describe('Package Script Wiring', () => {
  let packageJson: any;

  beforeAll(async () => {
    const packageJsonPath = join(process.cwd(), 'package.json');
    const content = await fs.readFile(packageJsonPath, 'utf-8');
    packageJson = JSON.parse(content);
  });

  describe('Current Repository Scripts', () => {
    it('should have package.json with scripts section', () => {
      expect(packageJson).toBeDefined();
      expect(packageJson.scripts).toBeDefined();
      expect(typeof packageJson.scripts).toBe('object');
    });

    it('should have prompt:lint script', () => {
      expect(packageJson.scripts['prompt:lint']).toBeDefined();
      expect(packageJson.scripts['prompt:lint']).toContain('.github/prompts');
      expect(packageJson.scripts['prompt:lint']).toContain('tools/prompt/lint.js');
    });

    it('should have spec:matrix script', () => {
      expect(packageJson.scripts['spec:matrix']).toBeDefined();
      expect(packageJson.scripts['spec:matrix']).toContain('tools/spec/matrix.js');
    });

    it('should have test:node script for running Node tests', () => {
      expect(packageJson.scripts['test:node']).toBeDefined();
    });

    it('should have lint:md script for markdown linting', () => {
      expect(packageJson.scripts['lint:md']).toBeDefined();
      expect(packageJson.scripts['lint:md']).toContain('markdownlint');
    });

    it('should have lint:shell script for shell script linting', () => {
      expect(packageJson.scripts['lint:shell']).toBeDefined();
      expect(packageJson.scripts['lint:shell']).toContain('shellcheck');
    });

    it('should have docs:links script for link checking', () => {
      expect(packageJson.scripts['docs:links']).toBeDefined();
      expect(packageJson.scripts['docs:links']).toContain('tools/docs/link_check');
    });

    it('should have env:audit script for environment auditing', () => {
      expect(packageJson.scripts['env:audit']).toBeDefined();
      expect(packageJson.scripts['env:audit']).toContain('tools/audit/env_audit');
    });
  });

  describe('Template Package.json Structure', () => {
    let templatePackageJsonPath: string;

    beforeAll(() => {
      templatePackageJsonPath = join(
        process.cwd(),
        'templates',
        '{{project_slug}}',
        'package.json.j2',
      );
    });

    it('should have template package.json.j2 file', async () => {
      const exists = await fs
        .stat(templatePackageJsonPath)
        .then((stats) => stats.isFile())
        .catch(() => false);

      expect(exists).toBe(true);
    });

    it('should contain scripts section placeholder in template', async () => {
      const content = await fs.readFile(templatePackageJsonPath, 'utf-8');

      // Check if template has scripts section (may use Jinja2 syntax)
      expect(content).toMatch(/"scripts"\s*:/);
    });

    it('should include prompt:lint in template', async () => {
      const content = await fs.readFile(templatePackageJsonPath, 'utf-8');

      expect(content).toContain('prompt:lint');
    });

    it('should include spec:matrix in template', async () => {
      const content = await fs.readFile(templatePackageJsonPath, 'utf-8');

      expect(content).toContain('spec:matrix');
    });

    it('should include test:node in template', async () => {
      const content = await fs.readFile(templatePackageJsonPath, 'utf-8');

      expect(content).toContain('test:node');
    });

    it('should use Jinja2 variable syntax for project-specific values', async () => {
      const content = await fs.readFile(templatePackageJsonPath, 'utf-8');

      // Should use {{project_name}} or similar Jinja2 variables
      expect(content).toMatch(/\{\{[^}]+\}\}/);
    });
  });

  describe('Script Execution Validation', () => {
    it('should have executable node in PATH for running scripts', async () => {
      const { spawnSync } = await import('node:child_process');
      const result = spawnSync('node', ['--version'], { encoding: 'utf-8' });

      expect(result.status).toBe(0);
      expect(result.stdout).toMatch(/v\d+\.\d+\.\d+/);
    });

    it('should have pnpm available for script execution', async () => {
      const { spawnSync } = await import('node:child_process');
      const result = spawnSync('pnpm', ['--version'], { encoding: 'utf-8' });

      expect(result.status).toBe(0);
      expect(result.stdout).toMatch(/\d+\.\d+\.\d+/);
    });
  });
});
