import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Merged Project Structure', () => {
    const testOutputDir = '/tmp/test-generation-merge-task-001';

    beforeAll(async () => {
        // Clean up any previous test runs
        if (existsSync(testOutputDir)) {
            await rm(testOutputDir, { recursive: true, force: true });
        }
    });

    afterAll(async () => {
        // Clean up test output
        if (existsSync(testOutputDir)) {
            await rm(testOutputDir, { recursive: true, force: true });
        }
    });

    it('should have proper Copier template structure', () => {
        // Test that the current project has the required Copier structure
        expect(existsSync('copier.yml')).toBe(true);
        expect(existsSync('templates/')).toBe(true);
        expect(existsSync('hooks/pre_gen.py')).toBe(true);
        expect(existsSync('hooks/post_gen.py')).toBe(true);
    });

    it('should have templates directory with project_slug structure', () => {
        const templatesDir = 'templates/{{project_slug}}';
        expect(existsSync(templatesDir)).toBe(true);

        // Check for key template directories that remain in templates
        expect(existsSync(join(templatesDir, 'docs'))).toBe(true);
        expect(existsSync(join(templatesDir, 'tests'))).toBe(true);
        expect(existsSync(join(templatesDir, 'tools'))).toBe(true);
        expect(existsSync(join(templatesDir, 'generators'))).toBe(true);
    }); it('should have essential configuration templates', () => {
        const templateRoot = 'templates/{{project_slug}}';

        // Essential build system files in template directory
        expect(existsSync(join(templateRoot, 'package.json'))).toBe(true);
        expect(existsSync(join(templateRoot, 'justfile.j2'))).toBe(true);
        expect(existsSync(join(templateRoot, 'nx.json.j2'))).toBe(true);
        expect(existsSync(join(templateRoot, 'pnpm-workspace.yaml'))).toBe(true);

        // Essential config files moved to root level for generation
        expect(existsSync('pyproject.toml')).toBe(true);

        // TypeScript configuration in template
        expect(existsSync(join(templateRoot, 'tsconfig.json'))).toBe(true);
    });

    it('should have temporal database directory structure', () => {
        // temporal_db is now at the root level for generation
        expect(existsSync('temporal_db')).toBe(true);
    });

    it('should have AI tools directory structure', () => {
        const templateRoot = 'templates/{{project_slug}}';
        expect(existsSync(join(templateRoot, 'tools', 'ai'))).toBe(true);
    });

    it('should have migration tools directory structure', () => {
        const templateRoot = 'templates/{{project_slug}}';
        expect(existsSync(join(templateRoot, 'tools', 'migration'))).toBe(true);
    });

    it('should generate valid project when run with copier', async () => {
        // This test will fail initially until we implement the full structure
        try {
            // Use a test data file for consistent generation
            const testDataPath = 'tests/fixtures/test-data.yml';

            execSync(`copier copy . ${testOutputDir} --data-file ${testDataPath} --defaults --force`, {
                stdio: 'inherit',
                cwd: process.cwd(),
            });

            // Verify the generated project has the expected structure
            expect(existsSync(join(testOutputDir, 'package.json'))).toBe(true);
            expect(existsSync(join(testOutputDir, 'justfile'))).toBe(true);
            expect(existsSync(join(testOutputDir, 'nx.json'))).toBe(true);
            expect(existsSync(join(testOutputDir, 'apps'))).toBe(true);
            expect(existsSync(join(testOutputDir, 'libs'))).toBe(true);
            expect(existsSync(join(testOutputDir, 'tools'))).toBe(true);
            expect(existsSync(join(testOutputDir, 'temporal_db'))).toBe(true);

        } catch (error: any) {
            // Expected to fail initially - this is the RED phase
            console.log('Expected failure during RED phase:', error.message);
            throw error;
        }
    });

    it('should have valid copier.yml configuration', async () => {
        expect(existsSync('copier.yml')).toBe(true);

        // Read and validate the copier.yml content
        const fs = await import('node:fs');
        const yaml = await import('js-yaml');

        const copierConfig = yaml.load(fs.readFileSync('copier.yml', 'utf8'));

        // Check for required fields from MERGE-TASK-001 specification
        expect(copierConfig.project_name).toBeDefined();
        expect(copierConfig.author_name).toBeDefined();
        expect(copierConfig.include_ai_workflows).toBeDefined();
        expect(copierConfig.architecture_style).toBeDefined();

        // Validate architecture choices
        expect(copierConfig.architecture_style.choices).toContain('hexagonal');
        expect(copierConfig.architecture_style.choices).toContain('layered');
        expect(copierConfig.architecture_style.choices).toContain('microservices');
        expect(copierConfig.architecture_style.default).toBe('hexagonal');
    });

    it('should have executable hooks', async () => {
        const fs = await import('node:fs');

        // Check hooks exist and are executable
        expect(existsSync('hooks/pre_gen.py')).toBe(true);
        expect(existsSync('hooks/post_gen.py')).toBe(true);

        // Verify hooks have proper shebang
        const preGenContent = fs.readFileSync('hooks/pre_gen.py', 'utf8');
        const postGenContent = fs.readFileSync('hooks/post_gen.py', 'utf8');

        expect(preGenContent.startsWith('#!/usr/bin/env python3')).toBe(true);
        expect(postGenContent.startsWith('#!/usr/bin/env python3')).toBe(true);
    });
});
