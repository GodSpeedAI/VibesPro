/**
 * Integration tests for bundle-context.sh script.
 *
 * Phase: PHASE-003 / TASK-007
 * Traceability: AI_ADR-004, AI_PRD-003, AI_SDS-003, AI_TS-001
 *
 * Tests verify that the bundle-context.sh script:
 * - Exists and is executable
 * - Creates the output directory structure
 * - Collects specs, CALM architecture, and techstack.yaml
 * - Handles missing source files gracefully
 */

import { spawnSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('bundle-context.sh script', () => {
  let testWorkspace: string;
  let bundleOutputDir: string;

  beforeEach(async () => {
    testWorkspace = await fs.mkdtemp(join(tmpdir(), 'bundle-context-test-'));
    bundleOutputDir = join(testWorkspace, 'ai_context_bundle');

    // Create minimal test structure
    await fs.mkdir(join(testWorkspace, 'docs'), { recursive: true });
    await fs.mkdir(join(testWorkspace, 'docs', 'specs'), { recursive: true });
    await fs.mkdir(join(testWorkspace, 'architecture', 'calm'), {
      recursive: true,
    });
    await fs.mkdir(join(testWorkspace, 'scripts'), { recursive: true });

    // Create test files
    await fs.writeFile(
      join(testWorkspace, 'docs', 'specs', 'test-spec.md'),
      '# Test Spec\n\nTest specification content.',
    );
    await fs.writeFile(
      join(testWorkspace, 'architecture', 'calm', 'system.md'),
      '# System Architecture\n\nCALM model content.',
    );
    await fs.writeFile(join(testWorkspace, 'techstack.yaml'), 'name: test-stack\nversion: 1.0.0\n');
  });

  afterEach(async () => {
    await fs.rm(testWorkspace, { recursive: true, force: true });
  });

  it('should exist and be executable', async () => {
    const scriptPath = join(process.cwd(), 'scripts', 'dev', 'bundle-context.sh');

    try {
      const stats = await fs.stat(scriptPath);
      expect(stats.isFile()).toBe(true);

      // Check if file is executable (Unix permissions)
      const isExecutable = (stats.mode & 0o111) !== 0;
      expect(isExecutable).toBe(true);
    } catch {
      throw new Error(`Script not found or not executable: ${scriptPath}`);
    }
  });

  it('should create output directory when executed', async () => {
    const scriptPath = join(process.cwd(), 'scripts', 'dev', 'bundle-context.sh');

    // Copy script to test workspace
    const scriptContent = await fs.readFile(scriptPath, 'utf-8');
    const testScriptPath = join(testWorkspace, 'scripts', 'dev', 'bundle-context.sh');
    await fs.writeFile(testScriptPath, scriptContent);
    await fs.chmod(testScriptPath, 0o755);

    // Execute script from test workspace
    const result = spawnSync('bash', [testScriptPath, bundleOutputDir], {
      cwd: testWorkspace,
      encoding: 'utf-8',
    });

    expect(result.status).toBe(0);

    const outputExists = await fs
      .stat(bundleOutputDir)
      .then((stats) => stats.isDirectory())
      .catch(() => false);

    expect(outputExists).toBe(true);
  });

  it('should collect spec files with prefix', async () => {
    const scriptPath = join(process.cwd(), 'scripts', 'dev', 'bundle-context.sh');
    const scriptContent = await fs.readFile(scriptPath, 'utf-8');
    const testScriptPath = join(testWorkspace, 'scripts', 'dev', 'bundle-context.sh');
    await fs.writeFile(testScriptPath, scriptContent);
    await fs.chmod(testScriptPath, 0o755);

    const result = spawnSync('bash', [testScriptPath, bundleOutputDir], {
      cwd: testWorkspace,
      encoding: 'utf-8',
    });

    expect(result.status).toBe(0);

    // Check if spec file was copied with prefix
    const specFile = await fs
      .readdir(bundleOutputDir)
      .then((files) => files.find((f) => f.startsWith('specs-')))
      .catch(() => undefined);

    expect(specFile).toBeDefined();
    expect(specFile).toMatch(/^specs-test-spec\.md$/);
  });

  it('should copy CALM architecture directory', async () => {
    const scriptPath = join(process.cwd(), 'scripts', 'dev', 'bundle-context.sh');
    const scriptContent = await fs.readFile(scriptPath, 'utf-8');
    const testScriptPath = join(testWorkspace, 'scripts', 'dev', 'bundle-context.sh');
    await fs.writeFile(testScriptPath, scriptContent);
    await fs.chmod(testScriptPath, 0o755);

    const result = spawnSync('bash', [testScriptPath, bundleOutputDir], {
      cwd: testWorkspace,
      encoding: 'utf-8',
    });

    expect(result.status).toBe(0);

    const calmDir = join(bundleOutputDir, 'architecture', 'calm');
    const calmExists = await fs
      .stat(calmDir)
      .then((stats) => stats.isDirectory())
      .catch(() => false);

    expect(calmExists).toBe(true);
  });

  it('should copy techstack.yaml if present', async () => {
    const scriptPath = join(process.cwd(), 'scripts', 'dev', 'bundle-context.sh');
    const scriptContent = await fs.readFile(scriptPath, 'utf-8');
    const testScriptPath = join(testWorkspace, 'scripts', 'dev', 'bundle-context.sh');
    await fs.writeFile(testScriptPath, scriptContent);
    await fs.chmod(testScriptPath, 0o755);

    const result = spawnSync('bash', [testScriptPath, bundleOutputDir], {
      cwd: testWorkspace,
      encoding: 'utf-8',
    });

    expect(result.status).toBe(0);

    const techstackPath = join(bundleOutputDir, 'techstack.yaml');
    const techstackExists = await fs
      .stat(techstackPath)
      .then((stats) => stats.isFile())
      .catch(() => false);

    expect(techstackExists).toBe(true);
  });

  it('should handle missing directories gracefully', async () => {
    // Create minimal workspace without some directories
    const minimalWorkspace = await fs.mkdtemp(join(tmpdir(), 'minimal-test-'));
    await fs.mkdir(join(minimalWorkspace, 'scripts'), { recursive: true });

    const scriptPath = join(process.cwd(), 'scripts', 'dev', 'bundle-context.sh');
    const scriptContent = await fs.readFile(scriptPath, 'utf-8');
    const testScriptPath = join(minimalWorkspace, 'scripts', 'dev', 'bundle-context.sh');
    await fs.writeFile(testScriptPath, scriptContent);
    await fs.chmod(testScriptPath, 0o755);

    const minimalBundleDir = join(minimalWorkspace, 'ai_context_bundle');
    const result = spawnSync('bash', [testScriptPath, minimalBundleDir], {
      cwd: minimalWorkspace,
      encoding: 'utf-8',
    });

    // Script should succeed even with missing directories
    expect(result.status).toBe(0);

    // Output directory should still be created
    const outputExists = await fs
      .stat(minimalBundleDir)
      .then((stats) => stats.isDirectory())
      .catch(() => false);

    expect(outputExists).toBe(true);

    await fs.rm(minimalWorkspace, { recursive: true, force: true });
  });

  it('should respect set -euo pipefail for error handling', async () => {
    const scriptPath = join(process.cwd(), 'scripts', 'dev', 'bundle-context.sh');
    const scriptContent = await fs.readFile(scriptPath, 'utf-8');

    // Verify script has proper error handling directives
    expect(scriptContent).toContain('set -euo pipefail');
  });

  it('should output completion message', async () => {
    const scriptPath = join(process.cwd(), 'scripts', 'dev', 'bundle-context.sh');
    const scriptContent = await fs.readFile(scriptPath, 'utf-8');
    const testScriptPath = join(testWorkspace, 'scripts', 'dev', 'bundle-context.sh');
    await fs.writeFile(testScriptPath, scriptContent);
    await fs.chmod(testScriptPath, 0o755);

    const result = spawnSync('bash', [testScriptPath, bundleOutputDir], {
      cwd: testWorkspace,
      encoding: 'utf-8',
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Context bundle created');
  });
});
