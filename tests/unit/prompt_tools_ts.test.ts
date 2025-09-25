import fs from 'node:fs';
import path from 'node:path';
const budgets = require('../../tools/prompt/budgets');
const lint = require('../../tools/prompt/lint');

describe('Prompt Tools Tests', () => {
    beforeAll(() => {
        const tmp = path.join(__dirname, '..', 'fixtures');
        fs.mkdirSync(tmp, { recursive: true });
    });

    describe('Budget checks', () => {
        it('should estimate tokens correctly', () => {
            const tokens = budgets.estimateTokensByHeuristic('word '.repeat(4000));
            expect(tokens).toBeGreaterThan(0);
        });

        it('should evaluate against budget', () => {
            const tokens = budgets.estimateTokensByHeuristic('word '.repeat(4000));
            const res = budgets.evaluateAgainstBudget(tokens, 'default');
            expect(['warn', 'hard', 'ok']).toContain(res.level);
        });
    });

    describe('Lint checks', () => {
        it('should validate correct prompt file', () => {
            const tmp = path.join(__dirname, '..', 'fixtures');
            const okPrompt = path.join(tmp, 'ok.prompt.md');
            fs.writeFileSync(okPrompt, `---\nname: test\nkind: prompt\ndomain: spec\ntask: implement\nthread: example-thread\nmatrix_ids: SAMPLE-1\n---\n# Title\nBody`, 'utf8');

            const lint1 = lint.lintPromptFile(okPrompt);
            expect(lint1.ok).toBe(true);
        });

        it('should catch bad prompt file', () => {
            const tmp = path.join(__dirname, '..', 'fixtures');
            const badPrompt = path.join(tmp, 'bad.prompt.md');
            fs.writeFileSync(badPrompt, `No frontmatter\nNo title`, 'utf8');

            const lint2 = lint.lintPromptFile(badPrompt);
            expect(lint2.ok).toBe(false);
            expect(lint2.findings.length).toBeGreaterThanOrEqual(1);
        });
    });
});
