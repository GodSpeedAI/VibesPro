/**
 * AI Workflows Integration Tests
 *
 * Tests the AI-enhanced development workflow functionality.
 * Validates temporal database integration and context management.
 */

import { existsSync, promises as fs } from 'node:fs';
import { join } from 'node:path';

import { GeneratedWorkspace, generateWorkspace } from '../utils/copier-workspace';

describe('AI Workflows Integration', () => {
    let workspace: GeneratedWorkspace | undefined;

    afterEach(async () => {
        if (workspace) {
            await workspace.cleanup();
            workspace = undefined;
        }
    });

    it('should initialize temporal database correctly', async () => {
        workspace = await generateWorkspace({
            answers: {
                project_name: 'AI Test Project',
                include_ai_workflows: true
            }
        });

        const projectPath = workspace.path;

        // Verify temporal database directory exists
        const temporalDbPath = join(projectPath, 'temporal_db');
        expect(existsSync(temporalDbPath)).toBe(true);

        // Verify temporal database initialization files exist
        const initScriptPath = join(projectPath, 'tools/temporal-db/init.py');
        expect(existsSync(initScriptPath)).toBe(true);
    });

    it('should have AI context management tools', async () => {
        workspace = await generateWorkspace({
            answers: {
                project_name: 'AI Context Project',
                include_ai_workflows: true
            }
        });

        const projectPath = workspace.path;

        // Verify AI context management files
        const contextManagerPath = join(projectPath, 'tools/ai/context-manager.ts');
        expect(existsSync(contextManagerPath)).toBe(true);

        const aiConfigPath = join(projectPath, 'tools/ai/config.yml');
        expect(existsSync(aiConfigPath)).toBe(true);
    });

    it('should configure GitHub Actions for AI workflows', async () => {
        workspace = await generateWorkspace({
            answers: {
                project_name: 'AI Workflow Project',
                include_ai_workflows: true
            }
        });

        const projectPath = workspace.path;

        // Verify GitHub Actions workflow files
        const aiWorkflowPath = join(projectPath, '.github/workflows/ai-generate.yml');
        expect(existsSync(aiWorkflowPath)).toBe(true);

        // Verify workflow content
        if (existsSync(aiWorkflowPath)) {
            const workflowContent = await fs.readFile(aiWorkflowPath, 'utf-8');
            expect(workflowContent).toContain('AI-enhanced development workflow');
            expect(workflowContent).toContain('temporal-db');
        }
    });

    it('should skip AI components when disabled', async () => {
        workspace = await generateWorkspace({
            answers: {
                project_name: 'No AI Project',
                include_ai_workflows: false,
                enable_temporal_learning: false
            }
        });

        const projectPath = workspace.path;

        // Verify AI components are not generated
        const temporalDbPath = join(projectPath, 'temporal_db');
        const aiToolsPath = join(projectPath, 'tools/ai');
        const aiWorkflowPath = join(projectPath, '.github/workflows/ai-generate.yml');

        expect(existsSync(temporalDbPath)).toBe(false);
        expect(existsSync(aiToolsPath)).toBe(false);
        expect(existsSync(aiWorkflowPath)).toBe(false);
    });
});
