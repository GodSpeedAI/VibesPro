/**
 * AI_PHASE-002_TASK-004: Maintainer documentation alignment tests
 *
 * RED Phase: This spec ensures maintainers can discover authoritative governance docs
 * Traceability: AI_PRD-002, AI_SDS-002, AI_TS-005
 */

import { access, readFile } from 'node:fs/promises';
import path from 'node:path';

describe('Maintainer documentation alignment', () => {
  const maintainerDocPath = path.resolve(
    __dirname,
    '..',
    '..',
    'docs',
    'aiassist',
    'maintainer-guide.md',
  );

  const readMaintainerDoc = async (): Promise<string> => {
    await access(maintainerDocPath);
    return readFile(maintainerDocPath, 'utf8');
  };

  it('mentions the core AI governance specs', async () => {
    const content = await readMaintainerDoc();
    expect(content).toContain('AI_ADR.md');
    expect(content).toContain('AI_PRD.md');
    expect(content).toContain('AI_SDS.md');
    expect(content).toContain('AI_TS.md');
  });

  it('links to the imported .github guidance set', async () => {
    const content = await readMaintainerDoc();
    expect(content).toMatch(/\.github\/instructions/);
    expect(content).toContain('copilot-instructions.md');
    expect(content).toMatch(/\.github\/prompts/);
    expect(content).toMatch(/\.github\/chatmodes/);
  });

  it('exposes the traceability frontmatter with required matrix IDs', async () => {
    const content = await readMaintainerDoc();
    const frontmatterMatch = content.match(/^---\n[\s\S]*?\n---/);
    expect(frontmatterMatch).not.toBeNull();

    const matrixLines = frontmatterMatch![0]
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('- '));

    expect(matrixLines).toEqual(
      expect.arrayContaining(['- AI_ADR-003', '- AI_PRD-002', '- AI_SDS-002', '- AI_TS-005']),
    );
  });

  it('maintains a predictable heading hierarchy for accessibility', async () => {
    const content = await readMaintainerDoc();
    const headingLevels = content
      .split('\n')
      .filter((line) => /^#+\s/.test(line))
      .map((line) => line.match(/^#+/)![0].length);

    expect(headingLevels[0]).toBe(1);
    headingLevels.slice(1).forEach((level) => {
      expect(level).toBeLessThanOrEqual(2);
      expect(level).toBeGreaterThanOrEqual(2);
    });
  });

  it('provides an actionable review checklist using checkbox semantics', async () => {
    const content = await readMaintainerDoc();
    const [, reviewSection] = content.split('## Review Checklist');
    expect(reviewSection).toBeDefined();

    const checklistLines = reviewSection
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('-'));

    expect(checklistLines.length).toBeGreaterThan(0);
    checklistLines.forEach((line) => {
      expect(line).toMatch(/^\- \[ \]/);
    });
  });
});
