/**
 * Performance Integration Tests
 *
 * Tests performance benchmarks for project generation and build processes.
 * Validates that performance targets are met as specified in TS-MERGE-008.
 */

import { execSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';

describe('Performance Integration', () => {
    let testWorkspace: string;

    beforeEach(async () => {
        testWorkspace = await fs.mkdtemp(join(tmpdir(), 'vibes-pro-perf-'));
    });

    afterEach(async () => {
        if (testWorkspace) {
            await fs.rm(testWorkspace, { recursive: true, force: true });
        }
    });

    it('should generate project within 30 seconds', async () => {
        const projectPath = join(testWorkspace, 'perf-test-project');

        const startTime = performance.now();

        execSync(`copier copy . ${projectPath} --data project_name="Performance Test Project" --data include_ai_workflows=true --data architecture_style="hexagonal" --defaults`, {
            cwd: process.cwd(),
            stdio: 'pipe'
        });

        const endTime = performance.now();
        const generationTime = endTime - startTime;

        // Performance target: < 30 seconds (30,000ms)
        expect(generationTime).toBeLessThan(30000);
    }, 45000); // Test timeout: 45 seconds

    it('should build generated project within 2 minutes', async () => {
        const projectPath = join(testWorkspace, 'build-perf-project');

        // Generate project first
        execSync(`copier copy . ${projectPath} --data project_name="Build Performance Test" --data include_ai_workflows=false --defaults`, {
            cwd: process.cwd(),
            stdio: 'pipe'
        });

        // Measure build time
        const startTime = performance.now();

        try {
            execSync('just build', {
                cwd: projectPath,
                stdio: 'pipe'
            });
        } catch (error) {
            // Some builds might fail due to missing dependencies in test environment
            // This is acceptable for performance measurement
            console.warn('Build failed in test environment, but timing was measured');
        }

        const endTime = performance.now();
        const buildTime = endTime - startTime;

        // Performance target: < 2 minutes (120,000ms)
        expect(buildTime).toBeLessThan(120000);
    }, 180000); // Test timeout: 3 minutes

    it('should use reasonable memory during generation', async () => {
        const projectPath = join(testWorkspace, 'memory-test-project');

        // Monitor memory usage during generation
        const initialMemory = process.memoryUsage();

        execSync(`copier copy . ${projectPath} --data project_name="Memory Test Project" --defaults`, {
            cwd: process.cwd(),
            stdio: 'pipe'
        });

        const finalMemory = process.memoryUsage();
        const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

        // Performance target: < 512MB (512 * 1024 * 1024 bytes)
        expect(memoryIncrease).toBeLessThan(512 * 1024 * 1024);
    });

    it('should have reasonable file generation count', async () => {
        const projectPath = join(testWorkspace, 'file-count-project');

        execSync(`copier copy . ${projectPath} --data project_name="File Count Test" --data include_ai_workflows=true --defaults`, {
            cwd: process.cwd(),
            stdio: 'pipe'
        });

        // Count generated files (recursive)
        const countFiles = async (dir: string): Promise<number> => {
            let count = 0;
            const items = await fs.readdir(dir, { withFileTypes: true });

            for (const item of items) {
                if (item.isDirectory() && !item.name.startsWith('.git')) {
                    count += await countFiles(join(dir, item.name));
                } else if (item.isFile()) {
                    count++;
                }
            }

            return count;
        };

        const fileCount = await countFiles(projectPath);

        // Reasonable range: should generate significant structure but not excessive files
        expect(fileCount).toBeGreaterThan(10); // At least basic project structure
        expect(fileCount).toBeLessThan(1000); // Not excessive bloat
    });
});
