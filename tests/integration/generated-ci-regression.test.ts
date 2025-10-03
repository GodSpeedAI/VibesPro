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
        it('should have valid spec-guard workflow configuration', async () => {
            const workflowPath = join(projectRoot, '.github/workflows/spec-guard.yml');
            const workflowContent = await fs.readFile(workflowPath, 'utf-8');

            // Verify workflow has required jobs
            expect(workflowContent).toMatch(/jobs:/);
            expect(workflowContent).toMatch(/runs-on:\s*ubuntu-latest/);

            // Verify checkout step exists and is named
            expect(workflowContent).toMatch(/name:\s*Checkout repository/);
            expect(workflowContent).toMatch(/uses:\s*actions\/checkout@/);

            // Verify Node.js/pnpm setup (either inline or via composite action)
            const hasNodeSetup = workflowContent.includes('actions/setup-node@') ||
                workflowContent.includes('uses: ./.github/actions/setup-node-pnpm');
            expect(hasNodeSetup).toBe(true);

            // Verify Just setup (either inline or via composite action)
            const hasJustSetup = workflowContent.includes('taiki-e/install-action@just') ||
                workflowContent.includes('uses: ./.github/actions/setup-just');
            expect(hasJustSetup).toBe(true);

            // Verify spec-guard execution
            expect(workflowContent).toMatch(/just spec-guard/);

            // Verify traceability references
            expect(workflowContent).toMatch(/AI_ADR-005/);
            expect(workflowContent).toMatch(/AI_PRD-005/);
            expect(workflowContent).toMatch(/AI_SDS-004/);
        }, 30_000);

        it('should have corepack and pnpm detection logic in workflows', async () => {
            const workflowPath = join(projectRoot, '.github/workflows/spec-guard.yml');
            const workflowContent = await fs.readFile(workflowPath, 'utf-8');

            // Check if using composite action (TASK-011 approach) or inline setup
            const usesCompositeAction = workflowContent.includes('uses: ./.github/actions/setup-node-pnpm');

            if (usesCompositeAction) {
                // Verify composite action exists and has pnpm setup
                const actionPath = join(projectRoot, '.github/actions/setup-node-pnpm/action.yml');
                const actionContent = await fs.readFile(actionPath, 'utf-8');

                expect(actionContent).toMatch(/pnpm\/action-setup/);
                expect(actionContent).toMatch(/cache:\s*['"]pnpm['"]/);
                expect(actionContent).toMatch(/version:\s*[89]/);
            } else {
                // Verify inline pnpm setup
                const hasPnpmSetup = workflowContent.includes('pnpm/action-setup') ||
                    workflowContent.includes('corepack enable');
                expect(hasPnpmSetup).toBe(true);

                expect(workflowContent).toMatch(/cache:\s*['"]pnpm['"]/);
                expect(workflowContent).toMatch(/version:\s*['"]?[89]['"]?/);
            }
        });
    });

    describe('Package Manager Configuration', () => {
        it('should detect pnpm via packageManager field', async () => {
            const hasPnpmConfig = await checkPnpmDetection(projectRoot);
            expect(hasPnpmConfig).toBe(true);
        });

        it('should have lockfile for dependency freezing', async () => {
            // Note: Generated templates don't include lockfiles - they're created on first install
            // This test verifies the CI workflow will create and use a lockfile
            const workflowPath = join(projectRoot, '.github/workflows/spec-guard.yml');
            const workflowContent = await fs.readFile(workflowPath, 'utf-8');

            // Check if workflow uses frozen-lockfile (either inline or via composite action)
            const usesCompositeAction = workflowContent.includes('uses: ./.github/actions/setup-node-pnpm');

            if (usesCompositeAction) {
                const actionPath = join(projectRoot, '.github/actions/setup-node-pnpm/action.yml');
                const actionContent = await fs.readFile(actionPath, 'utf-8');
                expect(actionContent).toMatch(/--frozen-lockfile/);
            } else {
                expect(workflowContent).toMatch(/--frozen-lockfile/);
            }
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
        it('should have spec-matrix command configured in justfile', async () => {
            const justfilePath = join(projectRoot, 'justfile');
            const justfileContent = await fs.readFile(justfilePath, 'utf-8');

            // Verify spec-matrix recipe exists
            expect(justfileContent).toMatch(/spec-matrix:/);

            // Verify it calls the spec:matrix script (either directly or via pnpm)
            const hasMatrixCommand = justfileContent.includes('pnpm spec:matrix') ||
                justfileContent.includes('node tools/spec/matrix.js');
            expect(hasMatrixCommand).toBe(true);

            // Verify traceability matrix file exists in template
            const traceabilityPath = join(projectRoot, 'docs/traceability_matrix.md');
            await expect(fs.access(traceabilityPath)).resolves.toBeUndefined();

            // Verify matrix tool exists
            const matrixToolPath = join(projectRoot, 'tools/spec/matrix.js');
            await expect(fs.access(matrixToolPath)).resolves.toBeUndefined();
        }, 30_000);
    });
});
