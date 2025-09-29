/**
 * Documentation template emission tests
 *
 * Phase: PHASE-002 / TASK-005
 * Traceability: AI_ADR-003, AI_PRD-002, AI_SDS-002, AI_TS-002
 */

import { execSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const runCopierGeneration = async (): Promise<string> => {
    const workspace = await fs.mkdtemp(join(tmpdir(), 'vibes-docs-'));
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

describe('Documentation template emission', () => {
    let generatedWorkspace: string;

    afterEach(async () => {
        if (!generatedWorkspace) {
            return;
        }

        await fs.rm(generatedWorkspace, { recursive: true, force: true });
    });

    it('should include baseline documentation files', async () => {
        generatedWorkspace = await runCopierGeneration();

        const expectedDocs = [
            'templates/test-project/docs/README.md',
            'templates/test-project/docs/spec_index.md',
            'templates/test-project/docs/dev_spec_index.md',
            'templates/test-project/docs/traceability_matrix.md',
            'templates/test-project/docs/commit_message_guidelines.md',
            'templates/test-project/docs/how-to/ai-onboarding.md'
        ];

        for (const docPath of expectedDocs) {
            await expect(fs.access(join(generatedWorkspace, docPath))).resolves.toBeUndefined();
        }
    });

    it('should provide AI onboarding guidance within generated documentation', async () => {
        generatedWorkspace = await runCopierGeneration();

        const onboardingPath = join(
            generatedWorkspace,
            'templates/test-project/docs/how-to/ai-onboarding.md'
        );
        const onboardingContent = await fs.readFile(onboardingPath, 'utf-8');
        expect(onboardingContent).toContain('# AI Onboarding Guide');
        expect(onboardingContent).toContain('link back to the traceability matrix');
        expect(onboardingContent).toContain('Commit Message Guidelines');

        const docsReadmePath = join(
            generatedWorkspace,
            'templates/test-project/docs/README.md'
        );
        const docsReadmeContent = await fs.readFile(docsReadmePath, 'utf-8');
        expect(docsReadmeContent).toContain('AI-enhanced development workflows');
        expect(docsReadmeContent).toContain('dev_spec_index.md');
        expect(docsReadmeContent).toContain('commit_message_guidelines.md');

        const devSpecIndexPath = join(
            generatedWorkspace,
            'templates/test-project/docs/dev_spec_index.md'
        );
        const devSpecIndexContent = await fs.readFile(devSpecIndexPath, 'utf-8');
        expect(devSpecIndexContent).toContain('Developer Specification Index');
        expect(devSpecIndexContent).toContain('DEV-PRD');

        const commitGuidePath = join(
            generatedWorkspace,
            'templates/test-project/docs/commit_message_guidelines.md'
        );
        const commitGuideContent = await fs.readFile(commitGuidePath, 'utf-8');
        expect(commitGuideContent).toContain('Commit Message Guidelines');
        expect(commitGuideContent).toContain('.github/instructions/commit-msg.instructions.md');
    });
});
