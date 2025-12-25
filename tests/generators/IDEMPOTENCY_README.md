# Idempotency Test — Implementation Notes

## Purpose

This document explains how to implement an automated idempotency test for Nx generators. The goal is to detect generators that produce different outputs when run multiple times (non-idempotent behavior).

## Suggested approach

1. Create a temporary workspace
   - Option A (fast): create a filesystem temp directory and copy a minimal project scaffold (package.json, nx.json, tsconfigs) into it.
   - Option B (deep): use `@nrwl/devkit` helper `createTreeWithEmptyWorkspace()` in unit tests (requires the `@nrwl/devkit` test harness).

2. Run the generator
   - Invoke the generator via the CLI: `pnpm nx g <collection:generator> <name> --dry-run=false` in the temp workspace.
   - Or import and call the generator function directly in unit tests (preferred for speed and isolation).

3. Capture the workspace state
   - Option A: `git init` in temp dir, `git add -A && git commit -m 'first'`, then record `git diff --name-only HEAD` as baseline.
   - Option B: Walk the filesystem tree and record filenames + file hashes (sha1) to detect changes.

4. Run the generator a second time
   - Repeat the generator invocation with the same inputs.

5. Assert no changes
   - If using Git: `git status --porcelain` should be empty after the second run.
   - If using file hashes: no new/changed files should be present.

6. CI integration
   - Add the test to `just test` or the Jest suite so that schema/generator regressions fail PR checks.

## Implementation tips

- Use `fs.mkdtempSync(path.join(os.tmpdir(), 'vibespro-gen-test-'))` to create temp dirs.
- Ensure the test cleans up temp dirs on completion (or use `tmp`/`tmp-promise` packages).
- Start with a single, deterministic generator example (one of the templates in `templates/{{project_slug}}/`) and expand.
- Consider running the generator in `--dry-run` and comparing the virtual output if supported.

## Running locally

From the repo root (example):

```bash
# run just once to make sure jest is installed
pnpm install

# run the idempotency test only
pnpm exec jest tests/generators/idempotency.test.ts
```

## Acceptance criteria

- The test runs in CI and passes for known-good generators.
- The test fails when a generator modifies the same file twice or produces different outputs on the second run.

## Next steps

- Implement the test harness (replace the skipped test) and run locally.
- If successful, wire into `just ai-validate` and the `ai-guidance.yml` workflow.
