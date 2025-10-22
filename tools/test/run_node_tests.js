#!/usr/bin/env node
/**
 * Minimal Node test runner for plain .test.js files using built-ins only.
 * - Discovers tests under tests/unit and tests/integration by default.
 * - Executes each file with Node, expecting them to throw on failure.
 */

const fs = require('node:fs');
const path = require('node:path');
const { performance } = require('node:perf_hooks');

const ROOT = process.cwd();
const TARGET_DIRS = [
    path.join(ROOT, 'tests', 'unit'),
    path.join(ROOT, 'tests', 'integration'),
];

/** Load all files matching *.test.js recursively */
function gatherTests(dir) {
    const acc = [];
    if (!fs.existsSync(dir)) return acc;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) acc.push(...gatherTests(p));
        else if (e.isFile() && /\.test\.js$/.test(e.name)) acc.push(p);
    }
    return acc;
}

async function runTestFile(file) {
    const start = performance.now();
    try {
        // Each test file should execute and throw on failure using node:assert
        require(file);
        const ms = (performance.now() - start).toFixed(1);
        return { file, ok: true, ms: Number(ms) };
    } catch (err) {
        const ms = (performance.now() - start).toFixed(1);
        return { file, ok: false, error: err, ms: Number(ms) };
    }
}

async function main() {
    const files = TARGET_DIRS.flatMap(gatherTests);
    if (files.length === 0) {
        console.log('No tests found.');
        process.exit(0);
    }
    console.log(`Discovered ${files.length} test file(s).`);
    const results = [];
    for (const f of files) {

        const r = await runTestFile(f);
        results.push(r);
        const status = r.ok ? 'PASS' : 'FAIL';
        console.log(`${status} ${path.relative(ROOT, f)} (${r.ms} ms)`);
        if (!r.ok) {
            console.error(r.error?.stack || r.error);
        }
    }
    const failed = results.filter(r => !r.ok);
    console.log(`\nSummary: ${results.length - failed.length} passed, ${failed.length} failed`);
    process.exit(failed.length === 0 ? 0 : 1);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
