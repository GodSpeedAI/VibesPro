/**
 * Workflow Verification Tests
 *
 * Phase: PHASE-001 / TASK-002
 * Traceability: AI_ADR-002, AI_PRD-001, AI_PRD-005, AI_SDS-004, AI_TS-003
 */

import { execSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const generateWorkspace = async (): Promise<string> => {
    const workspaceRoot = await fs.mkdtemp(join(tmpdir(), 'vibes-workflows-'));
    execSync(
        [
            'copier',
            'copy',
            '.',
            workspaceRoot,
            '--data-file',
            'tests/fixtures/test-data.yml',
            '--defaults',
            '--force'
        ].join(' '),
        { cwd: process.cwd(), stdio: 'inherit' }
    );
    return workspaceRoot;
};

describe('GitHub workflow propagation', () => {
    let projectRoot: string;

    afterEach(async () => {
        if (!projectRoot) {
            return;
        }

        await fs.rm(projectRoot, { recursive: true, force: true });
    });

    it('should include markdown lint, node test, and spec guard workflows', async () => {
        projectRoot = await generateWorkspace();

        const workflowFiles = [
            '.github/workflows/markdownlint.yml',
            '.github/workflows/node-tests.yml',
            '.github/workflows/spec-guard.yml'
        ];

        for (const workflow of workflowFiles) {
            await expect(fs.access(join(projectRoot, workflow))).resolves.toBeUndefined();
        }
    });

    it('should define expected workflow job names', async () => {
        projectRoot = await generateWorkspace();

        const nodeTestWorkflow = await fs.readFile(join(projectRoot, '.github/workflows/node-tests.yml'), 'utf-8');
        expect(nodeTestWorkflow).toContain('Node Tests');
        expect(nodeTestWorkflow).toContain('runs-on: ubuntu-latest');

        const specGuardWorkflow = await fs.readFile(join(projectRoot, '.github/workflows/spec-guard.yml'), 'utf-8');
        expect(specGuardWorkflow).toContain('Spec Guard CI');
        expect(specGuardWorkflow).toContain('just spec-guard');
        expect(specGuardWorkflow).toContain("cache: 'pnpm'");
        expect(specGuardWorkflow).toContain('node-version: "22"');
    });
});
