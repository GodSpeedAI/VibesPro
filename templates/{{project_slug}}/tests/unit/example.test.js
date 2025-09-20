// Minimal example unit test using node:assert
const assert = require('node:assert');

// Example function under test (inline for demo)
function add(a, b) { return a + b; }

// Happy path
assert.strictEqual(add(2, 3), 5);

// Edge case
assert.strictEqual(add(-1, 1), 0);
