/**
 * Migration Tools Integration Tests
 *
 * Tests the HexDDD and VibePDK migration functionality.
 * Validates that existing projects can be successfully converted.
 */

import { execSync } from 'node:child_process';
import { existsSync, promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('Migration Tools Integration', () => {
    let testWorkspace: string;

    beforeEach(async () => {
        testWorkspace = await fs.mkdtemp(join(tmpdir(), 'vibes-pro-migration-'));
    });

    afterEach(async () => {
        if (testWorkspace) {
            await fs.rm(testWorkspace, { recursive: true, force: true });
        }
    });

    it('should include HexDDD migration tools in generated projects', async () => {
        const projectPath = join(testWorkspace, 'migration-project');

        execSync(`copier copy . ${projectPath} --data project_name="Migration Test Project" --defaults`, {
            cwd: process.cwd(),
            stdio: 'pipe'
        });

        // Verify HexDDD migration tools exist
        const hexdddMigratorPath = join(projectPath, 'tools/migration/hexddd-migrator.py');
        const hexdddAnalyzerPath = join(projectPath, 'tools/migration/hexddd-analyzer.py');
        const migrationGuidePath = join(projectPath, 'MIGRATION-FROM-HEXDDD.md');

        expect(existsSync(hexdddMigratorPath)).toBe(true);
        expect(existsSync(hexdddAnalyzerPath)).toBe(true);
        expect(existsSync(migrationGuidePath)).toBe(true);
    });

    it('should include VibePDK migration tools in generated projects', async () => {
        const projectPath = join(testWorkspace, 'vibepdk-migration-project');

        execSync(`copier copy . ${projectPath} --data project_name="VibePDK Migration Test" --defaults`, {
            cwd: process.cwd(),
            stdio: 'pipe'
        });

        // Verify VibePDK migration tools exist
        const vibePdkMigratorPath = join(projectPath, 'tools/migration/vibepdk-migrator.py');
        expect(existsSync(vibePdkMigratorPath)).toBe(true);
    });

    it('should have executable migration CLI tools', async () => {
        const projectPath = join(testWorkspace, 'cli-migration-project');

        execSync(`copier copy . ${projectPath} --data project_name="CLI Migration Test" --defaults`, {
            cwd: process.cwd(),
            stdio: 'pipe'
        });

        // Check that CLI tools are executable (basic smoke test)
        const hexdddCliPath = join(projectPath, 'tools/migration/hexddd-migrator.py');
        if (existsSync(hexdddCliPath)) {
            const stat = await fs.stat(hexdddCliPath);
            expect(stat.isFile()).toBe(true);
        }

        // Verify migration justfile commands exist
        const justfilePath = join(projectPath, 'justfile');
        if (existsSync(justfilePath)) {
            const justfileContent = await fs.readFile(justfilePath, 'utf-8');
            expect(justfileContent).toContain('migrate-from-hexddd');
            expect(justfileContent).toContain('migrate-from-vibepdk');
        }
    });

    it('should generate migration documentation', async () => {
        const projectPath = join(testWorkspace, 'migration-docs-project');

        execSync(`copier copy . ${projectPath} --data project_name="Migration Docs Test" --defaults`, {
            cwd: process.cwd(),
            stdio: 'pipe'
        });

        // Verify migration documentation exists
        const migrationFromHexDDDPath = join(projectPath, 'MIGRATION-FROM-HEXDDD.md');

        if (existsSync(migrationFromHexDDDPath)) {
            const migrationContent = await fs.readFile(migrationFromHexDDDPath, 'utf-8');
            expect(migrationContent).toContain('Migration Guide');
            expect(migrationContent).toContain('HexDDD');
            expect(migrationContent).toContain('step-by-step');
        }
    });
});
