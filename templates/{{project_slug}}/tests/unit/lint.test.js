// Unit tests for prompt linter with model and instruction validation
const assert = require('node:assert');
const { lintPromptFile } = require('../../tools/prompt/lint');
const fs = require('node:fs');
const path = require('node:path');

// Test that linter should error when model key does not exist in .github/models.yaml
// This test will FAIL initially because model validation logic doesn't exist yet
const tmp = path.join(__dirname, '..', 'fixtures');
fs.mkdirSync(tmp, { recursive: true });

const invalidModelPrompt = path.join(tmp, 'invalid_model.prompt.md');
fs.writeFileSync(invalidModelPrompt, `---
name: test
model: Invalid-Model
kind: prompt
domain: test
task: test
budget: S
---
# Title
Body`, 'utf8');

const lintResult = lintPromptFile(invalidModelPrompt);
// Currently the linter passes because model validation isn't implemented
// When model validation is added, this should fail and produce a specific error
// For now, this assertion will fail because the linter doesn't validate models
assert.strictEqual(lintResult.ok, false, 'Linter should fail for invalid model reference');
assert.ok(lintResult.findings.some(finding => finding.includes('Model "Invalid-Model" not found')), 'Should have finding for invalid model reference');

// Test that linter should error when instruction field references a non-existent instruction file
// This test will FAIL initially because instruction validation logic doesn't exist yet
const invalidInstructionPrompt = path.join(tmp, 'invalid_instruction.prompt.md');
fs.writeFileSync(invalidInstructionPrompt, `---
name: test
model: GPT-5 mini
kind: prompt
domain: test
task: test
budget: S
instruction: nonexistent.instructions.md
---
# Title
Body`, 'utf8');

const lintResult2 = lintPromptFile(invalidInstructionPrompt);
// Currently the linter passes because instruction validation isn't implemented
// When instruction validation is added, this should fail and produce a specific error
// For now, this assertion will fail because the linter doesn't validate instruction references
assert.strictEqual(lintResult2.ok, false, 'Linter should fail for invalid instruction reference');
assert.ok(lintResult2.findings.some(finding => finding.includes('Instruction file "nonexistent.instructions.md" not found')), 'Should have finding for invalid instruction reference');

// Test that linter should warn when spec prompts are missing thread frontmatter
// In GREEN phase, these should be warnings only, not errors
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
  // Phase 3: missing thread is a blocking error
  assert.strictEqual(lintResult.ok, false, `Linter should fail for missing thread field in ${templateFile}`);
  assert.ok(lintResult.findings.some(finding => finding.includes('Missing frontmatter field: thread')), `Should report missing thread field in ${templateFile}`);
}

// Test missing matrix_ids field (now treated as error)
for (const templateFile of specTemplateFiles) {
  const templatePath = path.join(specTemplatesDir, templateFile);
  const lintResult = lintPromptFile(templatePath);
  // Phase 3: missing matrix_ids is a blocking error
  assert.strictEqual(lintResult.ok, false, `Linter should fail for missing matrix_ids field in ${templateFile}`);
  assert.ok(lintResult.findings.some(finding => finding.includes('Missing frontmatter field: matrix_ids')), `Should report missing matrix_ids field in ${templateFile}`);
}

// Clean up
fs.unlinkSync(invalidModelPrompt);
fs.unlinkSync(invalidInstructionPrompt);
