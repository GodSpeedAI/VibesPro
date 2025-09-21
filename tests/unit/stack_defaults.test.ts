import assert from 'node:assert';
import fs from 'node:fs';
import { compareSnapshot, writeSnapshot } from '../../tools/test/snapshot';
import { deriveServiceDefaults } from '../../generators/_utils/stack_defaults';

// Happy path: fastapi implies python + fastapi + pnpm
{
    const stack = { categories: { core_application_dependencies: { web_frameworks: ['fastapi'] } } };
    const d = deriveServiceDefaults(stack);
    assert.deepStrictEqual(d, { language: 'python', backendFramework: 'fastapi', packageManager: 'pnpm' });
    const name = 'stack_defaults.fastapi';
    const content = JSON.stringify(d);
    const snapPath = `${process.cwd()}/tests/snapshots/${name}.snap`;
    if (!fs.existsSync(snapPath)) {
        writeSnapshot(name, content);
    } else {
        assert.ok(compareSnapshot(name, content), 'Snapshot mismatch for fastapi defaults');
    }
}

// Express implies typescript + express
{
    const stack = { categories: { core_application_dependencies: { web_frameworks: ['express'] } } };
    const d = deriveServiceDefaults(stack);
    assert.strictEqual(d.language, 'typescript');
    assert.strictEqual(d.backendFramework, 'express');
    const name = 'stack_defaults.express';
    const content = JSON.stringify(d);
    const snapPath = `${process.cwd()}/tests/snapshots/${name}.snap`;
    if (!fs.existsSync(snapPath)) writeSnapshot(name, content);
    else assert.ok(compareSnapshot(name, content), 'Snapshot mismatch for express defaults');
}

// Empty stack falls back to stable defaults
{
    const d = deriveServiceDefaults({ categories: {} });
    assert.deepStrictEqual(d, { language: 'python', backendFramework: 'none', packageManager: 'pnpm' });
    const name = 'stack_defaults.empty';
    const content = JSON.stringify(d);
    const snapPath = `${process.cwd()}/tests/snapshots/${name}.snap`;
    if (!fs.existsSync(snapPath)) writeSnapshot(name, content);
    else assert.ok(compareSnapshot(name, content), 'Snapshot mismatch for empty defaults');
}
