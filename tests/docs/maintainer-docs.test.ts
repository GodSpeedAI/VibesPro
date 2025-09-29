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
        'aiassit',
        'maintainer-guide.md'
    );

    async function readMaintainerDoc(): Promise<string> {
        await access(maintainerDocPath);
        return readFile(maintainerDocPath, 'utf8');
    }

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
});
