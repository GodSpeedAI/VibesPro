// Unit tests for prompt linter with model and instruction validation
const assert = require('node:assert');
const { lintPromptFile } = require('../../tools/prompt/lint');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

// Use a temp directory for fixtures to avoid dirtying the repo
const tmpPrefix = path.join(os.tmpdir(), 'vibes-pro-fixtures-');
const tmp = fs.mkdtempSync(tmpPrefix);

// Test that linter should error when model key does not exist in .github/models.yaml
const invalidModelPrompt = path.join(tmp, 'invalid_model.prompt.md');
fs.writeFileSync(
  invalidModelPrompt,
  `---\nname: test\nmodel: Invalid-Model\nkind: prompt\ndomain: test\ntask: test\nbudget: S\n---\n# Title\nBody`,
  'utf8',
);

const lintResult = lintPromptFile(invalidModelPrompt);
assert.strictEqual(lintResult.ok, false, 'Linter should fail for invalid model reference');
assert.ok(
  lintResult.findings.some((finding) => finding.includes('Model "Invalid-Model" not found')),
  'Should have finding for invalid model reference',
);

// Test that linter should error when instruction field references a non-existent instruction file
const invalidInstructionPrompt = path.join(tmp, 'invalid_instruction.prompt.md');
fs.writeFileSync(
  invalidInstructionPrompt,
  `---\nname: test\nmodel: GPT-5 mini\nkind: prompt\ndomain: test\ntask: test\nbudget: S\ninstruction: nonexistent.instructions.md\n---\n# Title\nBody`,
  'utf8',
);

test('lint prompt file validations (self-contained)', () => {
  const lintResult2 = lintPromptFile(invalidInstructionPrompt);
  expect(lintResult2.ok).toBe(false);
  expect(
    lintResult2.findings.some((finding) =>
      finding.includes('Instruction file "nonexistent.instructions.md" not found'),
    ),
  ).toBe(true);

  // Create spec-like prompt missing 'thread' and 'matrix_ids'
  const specMissingThread = path.join(tmp, 'spec_missing_thread.prompt.md');
  fs.writeFileSync(
    specMissingThread,
    `---\nname: spec\nkind: prompt\ndomain: test\ntask: test\nmatrix_ids: SAMPLE-1\n---\n# Title\nBody`,
    'utf8',
  );

  const resMissingThread = lintPromptFile(specMissingThread);
  expect(resMissingThread.ok).toBe(false);
  expect(
    resMissingThread.findings.some((f) => f.includes('Missing frontmatter field: thread')),
  ).toBe(true);

  const specMissingMatrix = path.join(tmp, 'spec_missing_matrix.prompt.md');
  fs.writeFileSync(
    specMissingMatrix,
    `---\nname: spec\nkind: prompt\ndomain: test\ntask: test\nthread: example-thread\n---\n# Title\nBody`,
    'utf8',
  );

  const resMissingMatrix = lintPromptFile(specMissingMatrix);
  expect(resMissingMatrix.ok).toBe(false);
  expect(
    resMissingMatrix.findings.some((f) => f.includes('Missing frontmatter field: matrix_ids')),
  ).toBe(true);

  // Cleanup temp files
  try {
    fs.unlinkSync(invalidModelPrompt);
    fs.unlinkSync(invalidInstructionPrompt);
    fs.unlinkSync(specMissingThread);
    fs.unlinkSync(specMissingMatrix);
    fs.rmdirSync(tmp);
  } catch (e) {
    // best effort cleanup
  }
});
