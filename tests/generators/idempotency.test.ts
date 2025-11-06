/**
 * Idempotency test skeleton for generators
 *
 * This test is intentionally skipped (test.skip) as a safe starter.
 * Implementers should replace the skipped test with an actual runner that:
 *  - Creates a temporary workspace (e.g., using a fs temp dir or @nrwl/devkit helpers)
 *  - Runs the generator (either via `nx g`/`pnpm nx g` or invoking the generator function)
 *  - Captures the workspace diff after first run
 *  - Runs the generator again
 *  - Asserts that the second run produced no further diffs (idempotent)
 *
 * See `IDEMPOTENCY_README.md` in the same folder for suggested implementation steps.
 */

import { describe, expect, test } from '@jest/globals';
import { spawnSync } from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';

function hashFile(filePath: string): string {
  const data = fs.readFileSync(filePath);
  return crypto.createHash('sha1').update(data).digest('hex');
}

function snapshotWorkspace(root: string): Record<string, string> {
  const result: Record<string, string> = {};
  function walk(dir: string) {
    for (const name of fs.readdirSync(dir)) {
      const p = path.join(dir, name);
      const stat = fs.statSync(p);
      if (stat.isDirectory()) {
        if (name === 'node_modules' || name === '.git') {
          continue;
        }
        walk(p);
        continue;
      }
      if (!stat.isFile()) {
        continue;
      }
      if (
        p.includes(`${path.sep}node_modules${path.sep}`) ||
        p.includes(`${path.sep}.git${path.sep}`)
      ) {
        continue;
      }
      const rel = path.relative(root, p);
      result[rel] = hashFile(p);
    }
  }
  walk(root);
  return result;
}

describe('Generator idempotency harness', () => {
  const generators = [
    {
      name: 'nx-nextjs',
      command: 'pnpm nx g @nx/next:app test-app --no-interactive',
    },
    {
      name: 'nx-remix',
      command: 'pnpm nx g @nx/remix:app test-app --no-interactive',
    },
    {
      name: 'nx-expo',
      command: 'pnpm nx g @nx/expo:app test-app --no-interactive',
    },
    {
      name: 'python-service',
      command: 'pnpm nx g @nxlv/python:app test-app --no-interactive',
    },
  ];

  for (const generator of generators) {
    test(`generator ${generator.name} is idempotent`, () => {
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'vibespro-gen-'));
      // Create minimal workspace files to make generator runs predictable if needed
      fs.writeFileSync(path.join(tmp, 'package.json'), JSON.stringify({ name: 'tmp-workspace' }));
      fs.writeFileSync(
        path.join(tmp, 'nx.json'),
        JSON.stringify({ npmScope: 'tmp', implicitDependencies: {} }),
      );

      // Helper to run shell command in tmp
      const run = (command: string) => {
        // run in shell to allow complex commands; return stdout+stderr and status
        return spawnSync(command, {
          shell: true,
          cwd: tmp,
          env: process.env,
          encoding: 'utf8',
          maxBuffer: 10 * 1024 * 1024,
        });
      };

      // First run
      const first = run(generator.command);
      if (first.error) {
        // Fail fast with diagnostics
        throw first.error;
      }
      if (first.status !== 0) {
        throw new Error(
          `First run failed (exit ${first.status})\nstdout:\n${first.stdout}\nstderr:\n${first.stderr}`,
        );
      }

      const snap1 = snapshotWorkspace(tmp);

      // Second run
      const second = run(generator.command);
      if (second.error) {
        throw second.error;
      }
      if (second.status !== 0) {
        throw new Error(
          `Second run failed (exit ${second.status})\nstdout:\n${second.stdout}\nstderr:\n${second.stderr}`,
        );
      }

      const snap2 = snapshotWorkspace(tmp);

      // Compare snapshots: files present in snap2 should have identical hashes to snap1
      const diffs: string[] = [];
      const keys = new Set<string>([...Object.keys(snap1), ...Object.keys(snap2)]);
      for (const k of keys) {
        const a = snap1[k];
        const b = snap2[k];
        if (a !== b) {
          diffs.push(k);
        }
      }

      // Clean up (best-effort)
      try {
        fs.rmSync(tmp, { recursive: true, force: true });
      } catch {
        // ignore cleanup errors
      }

      expect(diffs).toEqual([]);
    }, 120000);
  }
});
