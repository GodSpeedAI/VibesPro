import assert from 'node:assert';
import { getCategory, loadResolvedStack } from '../../generators/_utils/stack';

// This test now properly imports from the source file.
// It relies on the test runner (tsx) to handle the TypeScript transpilation.

// Test getCategory
const stack = { categories: { core_application_dependencies: { web_frameworks: ['fastapi'] } } };
assert.deepStrictEqual(getCategory(stack, 'core_application_dependencies')?.web_frameworks, ['fastapi']);
assert.strictEqual(getCategory(stack, 'missing'), null);
assert.strictEqual(getCategory(null, 'core_application_dependencies'), null);

// Test loadResolvedStack (will return null as the file doesnt exist in test context without more setup)
// A more advanced test could create a temporary file structure.
const resolved = loadResolvedStack('/tmp/non-existent-project');
assert.strictEqual(resolved, null);
