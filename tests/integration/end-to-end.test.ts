/**
 * End-to-End Integration Tests for HexDDD-VibePDK Merger
 *
 * MERGE-TASK-010: Integration Testing Suite
 * Traceability: PRD-MERGE-010, SDS-MERGE-006
 *
 * These tests verify the complete integration of all merger components:
 * - Project generation using Copier
 * - Build all targets
 * - Run all tests
 * - Verify AI workflows
 */

import { execSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('End-to-End Integration', () => {
  let testWorkspace: string;

  beforeEach(async () => {
    // Create unique test workspace
    testWorkspace = await fs.mkdtemp(join(tmpdir(), 'vibes-pro-e2e-'));
  });

  afterEach(async () => {
    // Cleanup test workspace
    if (testWorkspace) {
      await fs.rm(testWorkspace, { recursive: true, force: true });
    }
  });

  it.skip('should generate, build, and test complete project', async () => {
    // This is the main integration test that should pass once implementation is complete

    // 1. Generate project using Copier
    const projectPath = join(testWorkspace, 'test-project');

    // Generate project with test configuration
    execSync(
      `copier copy . ${projectPath} --data project_name="Test Project" --data author_name="Test Author" --data include_ai_workflows=true --data architecture_style="hexagonal" --defaults --trust`,
      {
        cwd: process.cwd(),
        stdio: 'inherit',
        env: {
          ...process.env,
          COPIER_SKIP_PROJECT_SETUP: '1',
        },
      },
    );

    // Verify project structure exists
    expect(
      await fs
        .access(join(projectPath, 'package.json'))
        .then(() => true)
        .catch(() => false),
    ).toBe(true);
    expect(
      await fs
        .access(join(projectPath, 'nx.json'))
        .then(() => true)
        .catch(() => false),
    ).toBe(true);
    expect(
      await fs
        .access(join(projectPath, 'justfile'))
        .then(() => true)
        .catch(() => false),
    ).toBe(true);

    // 2. Build all targets
    execSync('just build', {
      cwd: projectPath,
      stdio: 'inherit',
    });

    // 3. Run all tests
    execSync('just test', {
      cwd: projectPath,
      stdio: 'inherit',
    });

    // 4. Verify AI workflows are configured
    const aiWorkflowPath = join(projectPath, '.github/workflows/ai-generate.yml');
    expect(
      await fs
        .access(aiWorkflowPath)
        .then(() => true)
        .catch(() => false),
    ).toBe(true);
  }, 300000); // 5 minute timeout for complete integration test
});
