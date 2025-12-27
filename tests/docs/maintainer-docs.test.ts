/**
 * AI_PHASE-002_TASK-004: Maintainer documentation alignment tests
 *
 * RED Phase: This spec ensures maintainers can discover authoritative governance docs
 * Traceability: AI_PRD-002, AI_SDS-002, AI_TS-005
 */

import { access, readFile } from 'node:fs/promises';
import path from 'node:path';

describe('Maintainer documentation alignment', () => {
  // The full content lives in .internal/ after the stub migration.
  // Tests validate the internal (authoritative) version.
  const internalDocPath = path.resolve(
    __dirname,
    '..',
    '..',
    'docs',
    'aiassist',
    '.internal',
    'maintainer-guide.md',
  );

  const publicDocPath = path.resolve(
    __dirname,
    '..',
    '..',
    'docs',
    'aiassist',
    'maintainer-guide.md',
  );

  const readMaintainerDoc = async (): Promise<string> => {
    // Prefer internal version (full content), fall back to public stub
    try {
      await access(internalDocPath);
      return readFile(internalDocPath, 'utf8');
    } catch {
      await access(publicDocPath);
      return readFile(publicDocPath, 'utf8');
    }
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

    const matrixLines = (frontmatterMatch?.[0] ?? '')
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
      .map((line) => line.match(/^#+/)?.[0].length ?? 0);

    expect(headingLevels[0]).toBe(1);
    headingLevels.slice(1).forEach((level) => {
      expect(level).toBeLessThanOrEqual(2);
      expect(level).toBeGreaterThanOrEqual(2);
    });
  });

  it('provides an actionable review checklist using checkbox semantics', async () => {
    const content = await readMaintainerDoc();

    // Locate the Review Checklist heading in a forgiving way (case-insensitive,
    // allow extra spaces). This prevents fragile failures when the markdown
    // formatting changes slightly.
    const reviewHeadingRegex = /^##\s*Review\s+Checklist\s*$/im;
    const reviewMatch = content.match(reviewHeadingRegex);
    expect(reviewMatch).not.toBeNull();

    const reviewSection = reviewMatch
      ? content.slice((reviewMatch.index ?? 0) + reviewMatch[0].length)
      : '';

    const checklistLines = reviewSection
      .split('\n')
      // normalize non-breaking spaces and trim edges
      .map((line) => line.replace(/\u00A0/g, ' ').trim())
      // accept list items that start with - or * followed by a checkbox
      .filter((line) => /^\s*[-*]\s*\[.*\]/.test(line));

    expect(checklistLines.length).toBeGreaterThan(0);
    checklistLines.forEach((line) => {
      // Accept patterns like "- [ ]", "-   [ ]", "* [ ]" and variants where the
      // checkbox may be marked with an x/X. Be permissive about internal spacing.
      expect(line).toMatch(/^\s*[-*]\s*\[\s*[ xX]?\s*\]/);
    });
  });
});
