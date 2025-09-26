/**
 * AI Workflows Integration Tests
 *
 * Tests the AI-enhanced development workflow functionality.
 * Validates temporal database integration and context management.
 */

import { execSync } from 'node:child_process';
import { existsSync, promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('AI Workflows Integration', () => {
    let testWorkspace: string;

    beforeEach(async () => {
        testWorkspace = await fs.mkdtemp(join(tmpdir(), 'vibes-pro-ai-'));
    });

    afterEach(async () => {
        if (testWorkspace) {
            await fs.rm(testWorkspace, { recursive: true, force: true });
        }
    });

    it('should initialize temporal database correctly', async () => {
        const projectPath = join(testWorkspace, 'ai-project');

        // Generate project with AI workflows enabled
        execSync(`copier copy . ${projectPath} --data-file tests/fixtures/test-data.yml --data project_name="AI Test Project" --data include_ai_workflows=true --defaults --force`, {
            cwd: process.cwd(),
            stdio: 'inherit'
        });

        // Verify temporal database directory exists
        const temporalDbPath = join(projectPath, 'temporal_db');
        expect(existsSync(temporalDbPath)).toBe(true);

        // Verify temporal database initialization files exist
        const initScriptPath = join(projectPath, 'tools/temporal-db/init.py');
        expect(existsSync(initScriptPath)).toBe(true);
    });

    it('should have AI context management tools', async () => {
        const projectPath = join(testWorkspace, 'ai-context-project');

        execSync(`copier copy . ${projectPath} --data-file tests/fixtures/test-data.yml --data project_name="AI Context Project" --data include_ai_workflows=true --defaults --force`, {
            cwd: process.cwd(),
            stdio: 'inherit'
        });

        // Verify AI context management files
        const contextManagerPath = join(projectPath, 'tools/ai/context-manager.ts');
        expect(existsSync(contextManagerPath)).toBe(true);

        const aiConfigPath = join(projectPath, 'tools/ai/config.yml');
        expect(existsSync(aiConfigPath)).toBe(true);
    });

    it('should configure GitHub Actions for AI workflows', async () => {
        const projectPath = join(testWorkspace, 'ai-workflow-project');

        execSync(`copier copy . ${projectPath} --data-file tests/fixtures/test-data.yml --data project_name="AI Workflow Project" --data include_ai_workflows=true --defaults --force`, {
            cwd: process.cwd(),
            stdio: 'inherit'
        });

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
        const projectPath = join(testWorkspace, 'no-ai-project');

        execSync(`copier copy . ${projectPath} --data-file tests/fixtures/test-data.yml --data project_name="No AI Project" --data include_ai_workflows=false --defaults --force`, {
            cwd: process.cwd(),
            stdio: 'inherit'
        });

        // Verify AI components are not generated
        const temporalDbPath = join(projectPath, 'temporal_db');
        const aiToolsPath = join(projectPath, 'tools/ai');
        const aiWorkflowPath = join(projectPath, '.github/workflows/ai-generate.yml');

        expect(existsSync(temporalDbPath)).toBe(false);
        expect(existsSync(aiToolsPath)).toBe(false);
        expect(existsSync(aiWorkflowPath)).toBe(false);
    });
});
