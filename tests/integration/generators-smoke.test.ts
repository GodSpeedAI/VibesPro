import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('Generators Smoke Test', () => {
  let workspaceRoot: string;

  afterEach(() => {
    if (workspaceRoot && existsSync(workspaceRoot)) {
      rmSync(workspaceRoot, { recursive: true, force: true });
    }
  });

  it('should generate api-service and web-app successfully', async () => {
    // Create temp directory
    workspaceRoot = mkdtempSync(join(tmpdir(), 'vibes-gen-'));
    console.log('Workspace will be generated at:', workspaceRoot);

    // Create clean environment without Volta
    const cleanEnv = { ...process.env };
    delete cleanEnv.VOLTA_HOME;
    delete cleanEnv.VOLTA_FEATURE_PNPM;

    // Run copier directly to see output
    const copierResult = spawnSync(
      'copier',
      [
        'copy',
        '.',
        workspaceRoot,
        '--trust',
        '--vcs-ref=HEAD',
        '--data-file=tests/fixtures/test-data.yml',
        '--defaults',
        '--force',
      ],
      {
        cwd: process.cwd(),
        encoding: 'utf-8',
        stdio: 'inherit',
        env: { ...cleanEnv, COPIER_SKIP_PROJECT_SETUP: '1' },
      },
    );

    if (copierResult.status !== 0) {
      throw new Error(`Copier failed with status ${copierResult.status}`);
    }

    console.log('\nGenerated files:', readdirSync(workspaceRoot));

    // List all files recursively to debug
    const { execSync } = require('child_process');
    try {
      const allFiles = execSync(`find ${workspaceRoot} -type f | head -50`, { encoding: 'utf-8' });
      console.log('\nFirst 50 files generated:\n', allFiles);
    } catch (e) {
      console.error('Could not list files:', e);
    }

    // Verify Nx workspace is properly initialized
    const nxJsonPath = join(workspaceRoot, 'nx.json');
    if (!existsSync(nxJsonPath)) {
      console.error('Files in workspace root:', readdirSync(workspaceRoot));
      console.error('nx.json path:', nxJsonPath);
      console.error('Workspace root exists:', existsSync(workspaceRoot));
      throw new Error(`nx.json not found at ${nxJsonPath}. Workspace not properly initialized.`);
    }

    // Verify package.json has generators in workspaces
    const packageJsonPath = join(workspaceRoot, 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    console.log('Workspaces:', packageJson.workspaces);

    // Verify generators directory exists
    const generatorsDir = join(workspaceRoot, 'generators');
    if (!existsSync(generatorsDir)) {
      throw new Error(`Generators directory not found at ${generatorsDir}`);
    }

    console.log('Generators:', readdirSync(generatorsDir));

    // Install dependencies
    console.log('\nInstalling dependencies...');
    const installResult = spawnSync('pnpm', ['install'], {
      cwd: workspaceRoot,
      encoding: 'utf-8',
      stdio: 'inherit',
      env: cleanEnv,
    });

    if (installResult.status !== 0) {
      throw new Error(`pnpm install failed with status ${installResult.status}`);
    }

    // Run api-service generator
    console.log('\nRunning api-service generator...');
    const apiResult = spawnSync(
      'pnpm',
      ['nx', 'g', 'api-service', 'my-api', '--directory=apps', '--no-interactive'],
      {
        cwd: workspaceRoot,
        encoding: 'utf-8',
        stdio: 'inherit',
        env: { ...cleanEnv, NX_DAEMON: 'false' },
      },
    );

    if (apiResult.status !== 0) {
      throw new Error(`api-service generator failed with status ${apiResult.status}`);
    }

    // Verify api-service output
    const apiPyProject = join(workspaceRoot, 'apps/my-api/pyproject.toml');
    expect(existsSync(apiPyProject)).toBe(true);
    const apiContent = readFileSync(apiPyProject, 'utf-8');
    expect(apiContent).toContain('fastapi');

    // Check if main.py exists (package structure: apps/my-api/my_api/main.py)
    const packageMain = join(workspaceRoot, 'apps/my-api/my_api/main.py');
    const rootMain = join(workspaceRoot, 'apps/my-api/main.py');

    const mainExists = existsSync(packageMain) || existsSync(rootMain);
    expect(mainExists).toBe(true);

    // Run web-app generator
    console.log('\nRunning web-app generator...');
    const webResult = spawnSync(
      'pnpm',
      ['nx', 'g', 'web-app', 'my-web', '--framework=next', '--directory=apps', '--no-interactive'],
      {
        cwd: workspaceRoot,
        encoding: 'utf-8',
        stdio: 'inherit',
        env: { ...cleanEnv, NX_DAEMON: 'false' },
      },
    );

    if (webResult.status !== 0) {
      throw new Error(`web-app generator failed with status ${webResult.status}`);
    }

    // Verify web-app output
    const webPage = join(workspaceRoot, 'apps/my-web/app/page.tsx');
    expect(existsSync(webPage)).toBe(true);

    console.log('\n✅ All generators completed successfully!');
  }, 600_000); // 10 minutes timeout
});
