// Ensures spec guard automation is bundled locally (Implements: PRD-007, DEV-PRD-007)
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const justfilePath = path.join(__dirname, '../../justfile');
const justfileContents = fs.readFileSync(justfilePath, 'utf8');

test('spec-guard recipe bundles Spec Guard CI steps in order', () => {
  const recipeMatch = justfileContents.match(/spec-guard:\n([\s\S]*?)(?=\n\S|$)/);
  assert.ok(recipeMatch, 'spec-guard recipe should be present in justfile');

  const commands = recipeMatch[1]
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const expected = [
    'pnpm spec:matrix',
    'pnpm prompt:lint',
    'pnpm prompt:plan',
    'pnpm prompt:plan:accurate',
    'pnpm run lint:md',
    'node scripts/check_all_agents.mjs',
    'node tools/docs/link_check.js || echo "⚠️ Link check found broken links - needs fixing but not blocking CI"',
    'pnpm exec tsx tools/validate-generator-schemas.ts || echo "⚠️ Generator schema validation issues found"',
    'pnpm run test:node',
    'pnpm run env:audit',
    'pnpm run pr:comment',
  ];

  assert.deepEqual(commands, expected, 'spec-guard recipe should run expected commands in order');
});
