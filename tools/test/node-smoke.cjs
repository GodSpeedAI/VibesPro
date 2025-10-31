#!/usr/bin/env node
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');

const { extractIdsFromText, validateIdFormat } = require('../spec/ids');
const { buildMatrix, renderMatrixTable } = require('../spec/matrix');
const { spawnSync } = require('node:child_process');

function testSpecIdsExtraction() {
  const sample = 'References PRD-123 and DEV-PRD-045 with ADR-002 sprinkled in.';
  const results = extractIdsFromText(sample, 'sample.md');
  assert.ok(results.find((r) => r.id === 'ADR-002'));
  assert.ok(results.find((r) => r.id === 'DEV-PRD-045'));
  assert.ok(results.find((r) => r.source === 'sample.md'));
}

function testSpecIdValidation() {
  assert.equal(validateIdFormat('PRD-1'), true);
  assert.equal(validateIdFormat('DEV-PRD-99'), true);
  assert.equal(validateIdFormat('SDS-10000'), false);
  assert.equal(validateIdFormat('BAD-1'), false);
}

function testMatrixGeneration() {
  const tmpRoot = path.join(process.cwd(), '.tmp', 'node-smoke');
  const docsDir = path.join(tmpRoot, 'docs');
  fs.rmSync(tmpRoot, { force: true, recursive: true });
  fs.mkdirSync(docsDir, { recursive: true });
  const docPath = path.join(docsDir, 'sample.md');
  fs.writeFileSync(
    docPath,
    '---\nmatrix_ids: [PRD-200]\n---\nBody mentions DEV-PRD-045 as well.',
    'utf8',
  );
  const rows = buildMatrix(tmpRoot);
  assert.ok(rows.find((row) => row.id === 'PRD-200'));
  const table = renderMatrixTable(rows);
  assert.ok(table.includes('PRD-200'));
}

function testPlanPreviewCliAccurateFlagOrder() {
  const tmpDir = path.join(process.cwd(), '.tmp', 'node-smoke');
  const promptPath = path.join(tmpDir, 'prompt.prompt.md');
  fs.mkdirSync(tmpDir, { recursive: true });
  fs.writeFileSync(promptPath, 'Test prompt content', 'utf8');
  const result = spawnSync(
    process.execPath,
    [path.join(process.cwd(), 'tools', 'prompt', 'plan_preview.js'), '--accurate', promptPath],
    {
      env: { ...process.env, PROMPT_TOKENIZER: 'accurate' },
      encoding: 'utf8',
    },
  );
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /tokenizer=accurate/);
}

function main() {
  testSpecIdsExtraction();
  testSpecIdValidation();
  testMatrixGeneration();
  testPlanPreviewCliAccurateFlagOrder();
  console.log('✅ node-smoke tests passed');
}

main();
