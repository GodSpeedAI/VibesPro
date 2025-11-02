import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { join } from 'node:path';

describe('Hybrid Build System', () => {
  const testOutputDir = '/tmp/test-generation-merge-task-002';

  beforeAll(async () => {
    if (existsSync(testOutputDir)) {
      await rm(testOutputDir, { recursive: true, force: true });
    }

    execSync(
      `copier copy . ${testOutputDir} --data-file tests/fixtures/test-data.yml --defaults --force --trust`,
      {
        stdio: 'inherit',
        cwd: process.cwd(),
        env: {
          ...process.env,
          COPIER_SKIP_PROJECT_SETUP: '1',
        },
      },
    );
  });

  afterAll(async () => {
    if (existsSync(testOutputDir)) {
      await rm(testOutputDir, { recursive: true, force: true });
    }
  });

  it.skip('should generate a justfile with hybrid build detection', () => {
    const justfilePath = join(testOutputDir, 'justfile');
    expect(existsSync(justfilePath)).toBe(true);

    const justfileContent = readFileSync(justfilePath, 'utf8');
    expect(justfileContent).toContain('set shell := ["bash", "-uc"]');
    expect(justfileContent).toMatch(/build\s+TARGET\s*=\s*""/);
    expect(justfileContent).toContain('_detect_build_strategy');
    expect(justfileContent).toMatch(/if \[ -f "nx.json" \]/);
    expect(justfileContent).toContain('just build-nx');
    expect(justfileContent).toContain('just build-direct');
  });

  it.skip('should configure Nx caching and tasks runner defaults', () => {
    const nxJsonPath = join(testOutputDir, 'nx.json');
    expect(existsSync(nxJsonPath)).toBe(true);

    const nxConfig = JSON.parse(readFileSync(nxJsonPath, 'utf8'));
    const runnerOptions = nxConfig.tasksRunnerOptions?.default;

    expect(runnerOptions).toBeDefined();
    expect(runnerOptions?.runner).toBe('@nx/workspace/tasks-runners/default');
    expect(runnerOptions?.options?.cacheableOperations).toEqual(
      expect.arrayContaining(['build', 'test', 'lint']),
    );
  });

  it.skip('should include polyglot build commands for direct strategy', () => {
    const justfileContent = readFileSync(join(testOutputDir, 'justfile'), 'utf8');
    expect(justfileContent).toContain('uv run python -m build');
    expect(justfileContent).toContain('pnpm run build');
    expect(justfileContent).toContain('uv run pytest');
    expect(justfileContent).toContain('pnpm test');
  });
});
