/**
 * GitHub Asset Integration Tests
 *
 * Phase: PHASE-001 / TASK-001
 * Traceability: AI_ADR-001, AI_PRD-001, AI_SDS-001, AI_TS-002
 */

import { execSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const runCopierGeneration = async (): Promise<string> => {
    const workspace = await fs.mkdtemp(join(tmpdir(), 'vibes-github-assets-'));
    const command = [
        'copier',
        'copy',
        '.',
        workspace,
        '--data-file',
        'tests/fixtures/test-data.yml',
        '--defaults',
        '--force'
    ].join(' ');

    execSync(command, { cwd: process.cwd(), stdio: 'inherit' });
    return workspace;
};

describe('GitHub asset propagation', () => {
    let generatedWorkspace: string;

    afterEach(async () => {
        if (!generatedWorkspace) {
            return;
        }

        await fs.rm(generatedWorkspace, { recursive: true, force: true });
    });

    it('should include Copilot instructions and governance files', async () => {
        generatedWorkspace = await runCopierGeneration();

        const expectedFiles = [
            '.github/copilot-instructions.md',
            '.github/models.yaml'
        ];

        for (const relativePath of expectedFiles) {
            await expect(fs.access(join(generatedWorkspace, relativePath))).resolves.toBeUndefined();
        }
    });

    it('should include instruction, prompt, and chatmode directories', async () => {
        generatedWorkspace = await runCopierGeneration();

        const expectedDirectories = [
            '.github/instructions',
            '.github/prompts',
            '.github/chatmodes'
        ];

        for (const relativePath of expectedDirectories) {
            await expect(fs.access(join(generatedWorkspace, relativePath))).resolves.toBeUndefined();
        }
    });

    it('should provide spec-driven prompt assets', async () => {
        generatedWorkspace = await runCopierGeneration();

        const expectedPrompts = [
            '.github/prompts/spec.feature.template.md',
            '.github/prompts/tdd.workflow.prompt.md'
        ];

        for (const promptPath of expectedPrompts) {
            await expect(fs.access(join(generatedWorkspace, promptPath))).resolves.toBeUndefined();
        }
    });
});
