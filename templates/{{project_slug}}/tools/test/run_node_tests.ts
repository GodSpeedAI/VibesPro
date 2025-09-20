#!/usr/bin/env -S node --no-warnings
/**
 * Minimal Node test runner for plain .test.ts files using built-ins only.
 * - Discovers tests under tests/unit and tests/integration by default.
 * - Executes each file with tsx, expecting them to throw on failure.
 */

import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';

const ROOT = process.cwd();
const TARGET_DIRS = [
    path.join(ROOT, 'tests', 'unit'),
    path.join(ROOT, 'tests', 'integration'),
];

function gatherTests(dir: string): string[] {
    const acc: string[] = [];
    if (!fs.existsSync(dir)) return acc;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) acc.push(...gatherTests(p));
        else if (e.isFile() && /\.test\.(ts|tsx)$/.test(e.name)) acc.push(p);
    }
    return acc;
}

async function runTestFile(file: string) {
    const start = performance.now();
    try {
        // Using dynamic import so tsx can compile on the fly
        await import(pathToFileURL(file).href);
        const ms = Number((performance.now() - start).toFixed(1));
        return { file, ok: true as const, ms };
    } catch (error) {
        const ms = Number((performance.now() - start).toFixed(1));
        return { file, ok: false as const, error, ms };
    }
}

import { pathToFileURL } from 'node:url';

async function main() {
    const files = TARGET_DIRS.flatMap(gatherTests);
    if (files.length === 0) {
        console.log('No tests found.');
        process.exit(0);
    }
    console.log(`Discovered ${files.length} test file(s).`);
    const results = [] as Awaited<ReturnType<typeof runTestFile>>[];
    for (const f of files) {
        const r = await runTestFile(f);
        results.push(r);
        const status = r.ok ? 'PASS' : 'FAIL';
        console.log(`${status} ${path.relative(ROOT, f)} (${r.ms} ms)`);
        if (!r.ok) {
            // eslint-disable-next-line no-console
            console.error((r as any).error?.stack || (r as any).error);
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
