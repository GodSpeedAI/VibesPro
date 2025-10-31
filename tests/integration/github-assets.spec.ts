/**
 * GitHub Asset Integration Tests
 *
 * Phase: PHASE-001 / TASK-001
 * Traceability: AI_ADR-001, AI_PRD-001, AI_SDS-001, AI_TS-002
 */

import { promises as fs } from 'node:fs';
import { join } from 'node:path';

import { GeneratedWorkspace, generateWorkspace } from '../utils/copier-workspace';

describe('GitHub asset propagation', () => {
  let generatedWorkspace: GeneratedWorkspace | undefined;

  afterEach(async () => {
    if (!generatedWorkspace) {
      return;
    }

    await generatedWorkspace.cleanup();
    generatedWorkspace = undefined;
  });

  it('should include Copilot instructions and governance files', async () => {
    generatedWorkspace = await generateWorkspace();

    const expectedFiles = ['.github/copilot-instructions.md', '.github/models.yaml'];

    for (const relativePath of expectedFiles) {
      await expect(fs.access(join(generatedWorkspace.path, relativePath))).resolves.toBeUndefined();
    }
  });

  it('should include instruction, prompt, and chatmode directories', async () => {
    generatedWorkspace = await generateWorkspace();

    const expectedDirectories = ['.github/instructions', '.github/prompts', '.github/chatmodes'];

    for (const relativePath of expectedDirectories) {
      await expect(fs.access(join(generatedWorkspace.path, relativePath))).resolves.toBeUndefined();
    }
  });

  it('should provide spec-driven prompt assets', async () => {
    generatedWorkspace = await generateWorkspace();

    const expectedPrompts = [
      '.github/prompts/spec.feature.template.md',
      '.github/prompts/tdd.workflow.prompt.md',
    ];

    for (const promptPath of expectedPrompts) {
      await expect(fs.access(join(generatedWorkspace.path, promptPath))).resolves.toBeUndefined();
    }
  });
});
