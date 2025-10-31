// Unit tests for prompt budgets and lint
const assert = require('node:assert');
const { estimateTokensByHeuristic, evaluateAgainstBudget } = require('../../tools/prompt/budgets');
const { lintPromptFile } = require('../../tools/prompt/lint');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

test('prompt budgets and lint checks (node-style assertions)', () => {
  // Budget checks
  const tokens = estimateTokensByHeuristic('word '.repeat(4000));
  expect(tokens).toBeGreaterThan(0);
  const res = evaluateAgainstBudget(tokens, 'default');
  expect(['warn', 'hard', 'ok']).toContain(res.level);

  // Lint checks (create a temp prompt)
  const tmpPrefix = path.join(os.tmpdir(), 'vibes-pro-fixtures-');
  const tmp = fs.mkdtempSync(tmpPrefix);
  const okPrompt = path.join(tmp, 'ok.prompt.md');
  fs.writeFileSync(
    okPrompt,
    `---\nname: test\nkind: prompt\ndomain: spec\ntask: implement\nthread: example-thread\nmatrix_ids: SAMPLE-1\n---\n# Title\nBody`,
    'utf8',
  );
  const lint1 = lintPromptFile(okPrompt);
  expect(lint1.ok).toBe(true);

  const badPrompt = path.join(tmp, 'bad.prompt.md');
  fs.writeFileSync(badPrompt, `No frontmatter\nNo title`, 'utf8');
  const lint2 = lintPromptFile(badPrompt);
  expect(lint2.ok).toBe(false);
  expect(lint2.findings.length).toBeGreaterThanOrEqual(1);

  // Cleanup
  try {
    fs.unlinkSync(okPrompt);
    fs.unlinkSync(badPrompt);
    fs.rmdirSync(tmp);
  } catch (e) {
    // best effort cleanup
  }
});
