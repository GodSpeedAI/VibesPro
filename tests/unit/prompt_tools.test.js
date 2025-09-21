// Unit tests for prompt budgets and lint
const assert = require('node:assert');
const { estimateTokensByHeuristic, evaluateAgainstBudget } = require('../../tools/prompt/budgets');
const { lintPromptFile } = require('../../tools/prompt/lint');
const fs = require('node:fs');
const path = require('node:path');

// Budget checks
const tokens = estimateTokensByHeuristic('word '.repeat(4000));
assert.ok(tokens > 0);
const res = evaluateAgainstBudget(tokens, 'default');
assert.ok(['warn', 'hard', 'ok'].includes(res.level));

// Lint checks (create a temp prompt)
const tmp = path.join(__dirname, '..', 'fixtures');
fs.mkdirSync(tmp, { recursive: true });
const okPrompt = path.join(tmp, 'ok.prompt.md');
fs.writeFileSync(okPrompt, `---\nname: test\nkind: prompt\ndomain: spec\ntask: implement\nthread: example-thread\nmatrix_ids: SAMPLE-1\n---\n# Title\nBody`, 'utf8');
const lint1 = lintPromptFile(okPrompt);
assert.strictEqual(lint1.ok, true);

const badPrompt = path.join(tmp, 'bad.prompt.md');
fs.writeFileSync(badPrompt, `No frontmatter\nNo title`, 'utf8');
const lint2 = lintPromptFile(badPrompt);
assert.strictEqual(lint2.ok, false);
assert.ok(lint2.findings.length >= 1);
