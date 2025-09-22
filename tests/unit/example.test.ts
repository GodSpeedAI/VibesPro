// Minimal example unit test using Node built-ins
import assert from 'node:assert';

function add(a: number, b: number) { return a + b; }

assert.strictEqual(add(2, 3), 5);
assert.strictEqual(add(-1, 1), 0);
