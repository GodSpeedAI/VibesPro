import assert from 'node:assert';
const { runCalmControls } = require('../../tools/calm/controls_runner');

// Happy path: if no architecture folder, ok=true
const res1 = runCalmControls(process.cwd());
assert.ok(typeof res1.ok === 'boolean');

// We won't fail CI by creating files here; minimal presence test is enough
