/**
 * Generated Project CI Validation Integration Tests
 *
 * Phase: PHASE-005 / TASK-012
 * Traceability: AI_ADR-005, AI_PRD-005, AI_SDS-004, AI_TS-004
 *
 * This test suite validates that generated projects have properly configured
 * CI workflows that can execute in dry-run mode, ensuring alignment with
 * template changes and proper pnpm/corepack integration.
 */

import { execSync, spawnSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const generateProject = async (): Promise<string> => {
    const projectRoot = await fs.mkdtemp(join(tmpdir(), 'vibes-ci-test-'));

    execSync(
        [
            'copier',
            'copy',
            '.',
            projectRoot,
            '--data-file',
            'tests/fixtures/test-data.yml',
            '--defaults',
            '--force'
        ].join(' '),
        { cwd: process.cwd(), stdio: 'inherit' }
    );

    return projectRoot;
};

const runCIScriptDryRun = (projectRoot: string, scriptName: string): { status: number; stdout: string; stderr: string } => {
    const result = spawnSync('pnpm', ['run', scriptName, '--dry-run'], {
        cwd: projectRoot,
        encoding: 'utf-8',
        env: { ...process.env, CI: 'true' }
    });

    return {
        status: result.status ?? 1,
        stdout: result.stdout ?? '',
        stderr: result.stderr ?? ''
    };
};

const checkCorepackEnabled = (projectRoot: string): boolean => {
    try {
        const result = execSync('corepack --version', {
            cwd: projectRoot,
            encoding: 'utf-8',
            stdio: 'pipe'
        });
        return result.trim().length > 0;
    } catch {
        return false;
    }
};

const checkPnpmDetection = async (projectRoot: string): Promise<boolean> => {
    const packageJsonPath = join(projectRoot, 'package.json');
    const content = await fs.readFile(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(content);

    // Debug: log what we found
    console.log('Package.json packageManager field:', packageJson.packageManager);

    // Check if packageManager field exists (corepack requirement)
    return Boolean(packageJson.packageManager?.includes('pnpm'));
};

describe('Generated Project CI Validation', () => {
    let projectRoot: string;

    beforeEach(async () => {
        projectRoot = await generateProject();
    });

    afterEach(async () => {
        if (projectRoot) {
            await fs.rm(projectRoot, { recursive: true, force: true });
        }
    });

    describe('CI Workflow Alignment', () => {
        it('should successfully execute spec-guard workflow steps', async () => {
            // Install dependencies first (allow lockfile update for generated projects)
            execSync('pnpm install', {
                cwd: projectRoot,
                stdio: 'inherit'
            });

            // Check if just is available
            const justCheck = spawnSync('just', ['--version'], {
                cwd: projectRoot,
                encoding: 'utf-8'
            });

            if (justCheck.status !== 0) {
                // Install just for testing
                execSync(
                    'curl --proto \'=https\' --tlsv1.2 -sSf https://just.systems/install.sh | bash -s -- --to ~/.local/bin',
                    { cwd: projectRoot, stdio: 'inherit' }
                );
            }

            // Execute CI commands in sequence (dry-run where applicable)
            const commands = [
                { cmd: 'just spec-matrix', description: 'Generate traceability matrix' },
                { cmd: 'just prompt-lint', description: 'Lint prompts' },
                { cmd: 'pnpm run lint:md', description: 'Lint markdown' }
            ];

            for (const { cmd, description } of commands) {
                const result = spawnSync(cmd.split(' ')[0], cmd.split(' ').slice(1), {
                    cwd: projectRoot,
                    encoding: 'utf-8',
                    env: { ...process.env, CI: 'true' }
                });

                expect(result.status).toBe(0);
            }
        }, 180_000); // 3 minute timeout for CI execution

        it('should have corepack and pnpm detection logic in workflows', async () => {
            const workflowPath = join(projectRoot, '.github/workflows/spec-guard.yml');
            const workflowContent = await fs.readFile(workflowPath, 'utf-8');

            // Verify corepack setup is mentioned or pnpm action is used
            const hasPnpmSetup = workflowContent.includes('pnpm/action-setup') ||
                workflowContent.includes('corepack enable');

            expect(hasPnpmSetup).toBe(true);

            // Verify pnpm cache configuration
            expect(workflowContent).toMatch(/cache:\s*['"]pnpm['"]/);

            // Verify pnpm version is specified
            const hasPnpmVersion = /version:\s*['"]?[89]['"]?/.test(workflowContent);

            expect(hasPnpmVersion).toBe(true);
        });
    });

    describe('Package Manager Configuration', () => {
        it('should detect pnpm via packageManager field', async () => {
            const hasPnpmConfig = await checkPnpmDetection(projectRoot);
            expect(hasPnpmConfig).toBe(true);
        });

        it('should have lockfile for dependency freezing', async () => {
            const lockfilePath = join(projectRoot, 'pnpm-lock.yaml');
            await expect(fs.access(lockfilePath)).resolves.toBeUndefined();
        });
    });

    describe('Workflow Step Optimization', () => {
        it('should have optimized step ordering in spec-guard workflow', async () => {
            const workflowPath = join(projectRoot, '.github/workflows/spec-guard.yml');
            const workflowContent = await fs.readFile(workflowPath, 'utf-8');

            // Parse steps order (simplified check)
            const steps = workflowContent.split('\n').filter(line => line.trim().startsWith('- name:') || (line.trim().startsWith('- uses:') && line.includes('checkout')));

            // Verify checkout comes first
            const checkoutStep = steps[0].toLowerCase();
            expect(checkoutStep).toMatch(/checkout|name.*checkout/i);

            // Verify setup steps come before execution steps
            const setupIndex = steps.findIndex(s => s.includes('Setup') || s.includes('Install'));
            const executionIndex = steps.findIndex(s => s.includes('Generate') || s.includes('Lint') || s.includes('Run'));

            expect(setupIndex).toBeGreaterThan(-1);
            expect(executionIndex).toBeGreaterThan(setupIndex);
        });

        it('should include annotations for guardrail failures', async () => {
            const workflowPath = join(projectRoot, '.github/workflows/spec-guard.yml');
            const workflowContent = await fs.readFile(workflowPath, 'utf-8');

            // Check for GitHub Actions annotation commands in the workflow
            const annotationRegex = /::(error|warning|notice)/i;
            const hasAnnotationCommand = annotationRegex.test(workflowContent);

            // Optionally, check for usage of actions that emit annotations, e.g. actions/github-script or run steps with echo "::error"
            const hasGithubScriptAction = workflowContent.includes('actions/github-script') ||
                workflowContent.includes('echo "::error') ||
                workflowContent.includes('echo "::warning') ||
                workflowContent.includes('echo "::notice');

            expect(hasAnnotationCommand || hasGithubScriptAction).toBe(true);
        });
    });

    describe('Traceability Matrix Regeneration', () => {
        it('should regenerate AI_traceability.md without deltas when no changes', async () => {
            // Install dependencies
            execSync('pnpm install', {
                cwd: projectRoot,
                stdio: 'inherit'
            });

            // Generate traceability matrix
            execSync('just spec-matrix', {
                cwd: projectRoot,
                stdio: 'inherit'
            });

            const traceabilityPath = join(projectRoot, 'docs/traceability_matrix.md');
            const originalContent = await fs.readFile(traceabilityPath, 'utf-8');

            // Regenerate
            execSync('just spec-matrix', {
                cwd: projectRoot,
                stdio: 'inherit'
            });

            const regeneratedContent = await fs.readFile(traceabilityPath, 'utf-8');

            // Content should be identical (idempotent generation)
            expect(regeneratedContent).toBe(originalContent);
        }, 180_000);
    });
});
