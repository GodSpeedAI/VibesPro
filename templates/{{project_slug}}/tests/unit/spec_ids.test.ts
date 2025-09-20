import assert from 'node:assert';
const ids = require('../../tools/spec/ids');

const sample = `PRD-001 DEV-PRD-010 ADR-002 DEV-SDS-003`;
const res = ids.extractIdsFromText(sample, 's.md');
assert.ok(res.find((x: any) => x.id === 'PRD-001'));
assert.ok(res.find((x: any) => x.id === 'DEV-PRD-010'));
assert.ok(res.find((x: any) => x.id === 'ADR-002'));
assert.ok(res.find((x: any) => x.id === 'DEV-SDS-003'));
assert.strictEqual(ids.validateIdFormat('PRD-123'), true);
assert.strictEqual(ids.validateIdFormat('DEV-TS-9'), true);
assert.strictEqual(ids.validateIdFormat('BAD-9'), false);
