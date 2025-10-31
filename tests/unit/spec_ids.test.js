// Unit tests for tools/spec/ids.js using node:assert
const assert = require('node:assert');
const { extractIdsFromText, validateIdFormat } = require('../../tools/spec/ids');

const sample = `This doc references PRD-001 and DEV-PRD-010, plus ADR-002 and DEV-SDS-003.`;
const res = extractIdsFromText(sample, 'sample.md');
assert.ok(res.find((x) => x.id === 'PRD-001'));
assert.ok(res.find((x) => x.id === 'DEV-PRD-010'));
assert.ok(res.find((x) => x.id === 'ADR-002'));
assert.ok(res.find((x) => x.id === 'DEV-SDS-003'));

assert.strictEqual(validateIdFormat('PRD-123'), true);
assert.strictEqual(validateIdFormat('DEV-TS-9'), true);
assert.strictEqual(validateIdFormat('TASK-401'), true);
assert.strictEqual(validateIdFormat('DEV-TASK-123'), true);
assert.strictEqual(validateIdFormat('BAD-9'), false);

console.log('✓ All spec_ids tests passed');
