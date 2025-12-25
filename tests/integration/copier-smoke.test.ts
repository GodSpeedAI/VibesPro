/**
 * Copier smoke test integration suite.
 *
 * Validates that the generated smoke example integrates properly
 * with the Nx workspace when running in-repo.
 *
 * Note: This test assumes apps/copier-smoke-example exists and has been
 * generated via `just copier-regenerate-smoke`.
 *
 * Traceability: AI_ADR-001, AI_SDS-001
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const REPO_ROOT = join(__dirname, '..', '..');
const SMOKE_EXAMPLE = join(REPO_ROOT, 'apps', 'copier-smoke-example');

describe('Copier Smoke Test Infrastructure', () => {
  describe('Test Fixtures', () => {
    it('should have smoke-data.yml fixture', () => {
      const fixturePath = join(REPO_ROOT, 'tests', 'fixtures', 'smoke-data.yml');
      expect(existsSync(fixturePath)).toBe(true);
    });

    it('should have smoke-project.json template', () => {
      const templatePath = join(REPO_ROOT, 'tools', 'copier', 'smoke-project.json');
      expect(existsSync(templatePath)).toBe(true);
    });

    it('smoke-project.json should be valid JSON', () => {
      const templatePath = join(REPO_ROOT, 'tools', 'copier', 'smoke-project.json');
      const content = readFileSync(templatePath, 'utf-8');
      expect(() => JSON.parse(content)).not.toThrow();
    });

    it('smoke-project.json should have correct structure', () => {
      const templatePath = join(REPO_ROOT, 'tools', 'copier', 'smoke-project.json');
      const project = JSON.parse(readFileSync(templatePath, 'utf-8'));

      expect(project.name).toBe('copier-smoke-example');
      expect(project.projectType).toBe('application');
      expect(project.tags).toContain('scope:smoke-test');
      expect(project.targets).toHaveProperty('regenerate');
      expect(project.targets).toHaveProperty('validate');
    });
  });

  describe('Hooks Library', () => {
    it('should have hooks/lib directory', () => {
      const libPath = join(REPO_ROOT, 'hooks', 'lib');
      expect(existsSync(libPath)).toBe(true);
    });

    it('should have hooks/lib/__init__.py', () => {
      const initPath = join(REPO_ROOT, 'hooks', 'lib', '__init__.py');
      expect(existsSync(initPath)).toBe(true);
    });

    it('should have hooks/lib/context.py', () => {
      const contextPath = join(REPO_ROOT, 'hooks', 'lib', 'context.py');
      expect(existsSync(contextPath)).toBe(true);
    });

    it('should have hooks/lib/validators.py', () => {
      const validatorsPath = join(REPO_ROOT, 'hooks', 'lib', 'validators.py');
      expect(existsSync(validatorsPath)).toBe(true);
    });

    it('should have hooks/lib/utils.py', () => {
      const utilsPath = join(REPO_ROOT, 'hooks', 'lib', 'utils.py');
      expect(existsSync(utilsPath)).toBe(true);
    });
  });

  describe('Copier Configuration', () => {
    it('should have copier.yml in repo root', () => {
      const copierYml = join(REPO_ROOT, 'copier.yml');
      expect(existsSync(copierYml)).toBe(true);
    });

    it('should have .copierignore in repo root', () => {
      const copierIgnore = join(REPO_ROOT, '.copierignore');
      expect(existsSync(copierIgnore)).toBe(true);
    });

    it('.copierignore should exclude non-template directories', () => {
      const copierIgnore = join(REPO_ROOT, '.copierignore');
      const content = readFileSync(copierIgnore, 'utf-8');

      expect(content).toContain('node_modules');
      expect(content).toContain('.git');
      expect(content).toContain('apps/');
      expect(content).toContain('libs/');
    });
  });

  describe('Validation Scripts', () => {
    it('should have validate_templates.py', () => {
      const scriptPath = join(REPO_ROOT, 'tools', 'copier', 'validate_templates.py');
      expect(existsSync(scriptPath)).toBe(true);
    });

    it('should have validate-no-cycles.js', () => {
      const scriptPath = join(REPO_ROOT, 'scripts', 'validate-no-cycles.js');
      expect(existsSync(scriptPath)).toBe(true);
    });
  });
});

describe('Copier Smoke Example (if generated)', () => {
  const smokeExampleExists = existsSync(SMOKE_EXAMPLE);

  describe.skipIf(!smokeExampleExists)('Nx Integration', () => {
    it('should have project.json', () => {
      const projectPath = join(SMOKE_EXAMPLE, 'project.json');
      expect(existsSync(projectPath)).toBe(true);
    });

    it('should have valid project.json', () => {
      const projectPath = join(SMOKE_EXAMPLE, 'project.json');
      const content = readFileSync(projectPath, 'utf-8');
      expect(() => JSON.parse(content)).not.toThrow();
    });

    it('should have correct project name', () => {
      const projectPath = join(SMOKE_EXAMPLE, 'project.json');
      const project = JSON.parse(readFileSync(projectPath, 'utf-8'));
      expect(project.name).toBe('copier-smoke-example');
    });

    it('should have regenerate target', () => {
      const projectPath = join(SMOKE_EXAMPLE, 'project.json');
      const project = JSON.parse(readFileSync(projectPath, 'utf-8'));
      expect(project.targets).toHaveProperty('regenerate');
    });

    it('should have validate target', () => {
      const projectPath = join(SMOKE_EXAMPLE, 'project.json');
      const project = JSON.parse(readFileSync(projectPath, 'utf-8'));
      expect(project.targets).toHaveProperty('validate');
    });

    it('should have smoke-test tag', () => {
      const projectPath = join(SMOKE_EXAMPLE, 'project.json');
      const project = JSON.parse(readFileSync(projectPath, 'utf-8'));
      expect(project.tags).toContain('scope:smoke-test');
    });
  });
});
