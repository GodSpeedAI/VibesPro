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
fs.writeFileSync(invalidModelPrompt, `---\nname: test\nmodel: Invalid-Model\nkind: prompt\ndomain: test\ntask: test\nbudget: S\n---\n# Title\nBody`, 'utf8');

const lintResult = lintPromptFile(invalidModelPrompt);
assert.strictEqual(lintResult.ok, false, 'Linter should fail for invalid model reference');
assert.ok(lintResult.findings.some(finding => finding.includes('Model "Invalid-Model" not found')), 'Should have finding for invalid model reference');

// Test that linter should error when instruction field references a non-existent instruction file
const invalidInstructionPrompt = path.join(tmp, 'invalid_instruction.prompt.md');
fs.writeFileSync(invalidInstructionPrompt, `---\nname: test\nmodel: GPT-5 mini\nkind: prompt\ndomain: test\ntask: test\nbudget: S\ninstruction: nonexistent.instructions.md\n---\n# Title\nBody`, 'utf8');

const lintResult2 = lintPromptFile(invalidInstructionPrompt);
assert.strictEqual(lintResult2.ok, false, 'Linter should fail for invalid instruction reference');
assert.ok(lintResult2.findings.some(finding => finding.includes('Instruction file "nonexistent.instructions.md" not found')), 'Should have finding for invalid instruction reference');

// Test that linter should warn when spec prompts are missing thread frontmatter
const specTemplatesDir = path.join(path.dirname(path.dirname(__dirname)), '.github', 'prompts');
const specTemplateFiles = [
  'spec.plan.adr.prompt.md',
  'spec.plan.prd.prompt.md',
  'spec.plan.sds.prompt.md',
  'spec.plan.ts.prompt.md',
  'spec.plan.task.prompt.md'
];

// Test missing thread field (now treated as error)
for (const templateFile of specTemplateFiles) {
  const templatePath = path.join(specTemplatesDir, templateFile);
  const lintResult = lintPromptFile(templatePath);
  assert.strictEqual(lintResult.ok, false, `Linter should fail for missing thread field in ${templateFile}`);
  assert.ok(lintResult.findings.some(finding => finding.includes('Missing frontmatter field: thread')), `Should report missing thread field in ${templateFile}`);
}

// Test missing matrix_ids field (now treated as error)
for (const templateFile of specTemplateFiles) {
  const templatePath = path.join(specTemplatesDir, templateFile);
  const lintResult = lintPromptFile(templatePath);
  assert.strictEqual(lintResult.ok, false, `Linter should fail for missing matrix_ids field in ${templateFile}`);
  assert.ok(lintResult.findings.some(finding => finding.includes('Missing frontmatter field: matrix_ids')), `Should report missing matrix_ids field in ${templateFile}`);
}

// Cleanup temp files
try {
  fs.unlinkSync(invalidModelPrompt);
  fs.unlinkSync(invalidInstructionPrompt);
  fs.rmdirSync(tmp);
} catch (e) {
  // best effort cleanup
}
