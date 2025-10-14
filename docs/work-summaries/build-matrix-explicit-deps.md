# GitHub Actions Build Matrix - Explicit Dependency Installation

**Date**: October 13, 2025
**File**: `.github/workflows/build-matrix.yml`
**Lines**: 179-191 (previously 179-183)
**Spec IDs**: DEV-SPEC-006 (CI/security posture), DEV-SPEC-003 (Build tasks)

## Summary

Replaced the fragile combined dependency installation step that masked failures with `|| true` into separate, explicit conditional steps for each package manager. This ensures fail-fast behavior for required dependencies while making optional installs explicit through GitHub Actions conditionals.

## Changes Made

### Previous Implementation Issues

The original implementation had critical weaknesses:

```yaml
- name: Install dependencies
  run: |
    if [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile; fi
    if [ -f uv.lock ] || [ -f pyproject.toml ]; then uv sync --frozen || true; fi
    if [ -f Cargo.toml ]; then cargo fetch; fi
```

**Problems**:
1. ❌ **Masked failures**: `|| true` on Python dependencies silently hid errors
2. ❌ **Combined step**: Single failure message unclear which manager failed
3. ❌ **Shell-based conditionals**: Less idiomatic than GitHub Actions `if:` conditions
4. ❌ **No visibility**: Unclear which dependencies are optional vs required
5. ❌ **No early exit**: Failures in one manager don't prevent wasting time on others

### New Implementation

Split into three explicit conditional steps using GitHub Actions `if:` with `hashFiles()`:

```yaml
# ---- Install project dependencies (explicit conditional steps) ----
# Each step only runs when its lock/config file exists, and failures are not masked

- name: Install Node dependencies (pnpm)
  if: hashFiles('pnpm-lock.yaml') != ''
  run: pnpm install --frozen-lockfile

- name: Install Python dependencies (uv)
  if: hashFiles('uv.lock') != '' || hashFiles('pyproject.toml') != ''
  run: uv sync --frozen

- name: Fetch Rust dependencies (cargo)
  if: hashFiles('Cargo.toml') != ''
  run: cargo fetch
```

## Benefits

### 1. Fail-Fast Behavior
- ✅ No `|| true` - errors stop the build immediately
- ✅ Clear indication which package manager failed
- ✅ Prevents wasting CI time on subsequent steps when deps fail
- ✅ Forces fixing broken dependencies rather than masking them

### 2. Explicit Conditionals
- ✅ Uses GitHub Actions native `if:` conditions
- ✅ `hashFiles()` is more reliable than shell `[ -f ]` tests
- ✅ Each step shows as "skipped" in UI when condition not met
- ✅ Clear visibility in Actions UI which steps run vs skip

### 3. Better Observability
- ✅ Separate step names clearly identify the failing component
- ✅ Step timing shows which package manager is slow
- ✅ Logs are scoped to specific package manager
- ✅ Easy to identify if Node, Python, or Rust deps are the issue

### 4. Maintainability
- ✅ Easy to add new package managers (just add a step)
- ✅ Easy to modify behavior per package manager
- ✅ Can add step-level `continue-on-error: true` if truly optional
- ✅ Can add step-level timeouts, retries, caching per manager

## Technical Details

### hashFiles() Function

GitHub Actions `hashFiles()` returns:
- **Empty string** if no files match the pattern
- **Hash string** if files exist

Therefore `hashFiles('file.lock') != ''` checks if the file exists.

### Conditional Logic

**Node (pnpm)**:
- Condition: `hashFiles('pnpm-lock.yaml') != ''`
- Required when lock file exists
- Uses `--frozen-lockfile` for deterministic installs

**Python (uv)**:
- Condition: `hashFiles('uv.lock') != '' || hashFiles('pyproject.toml') != ''`
- Required when either uv.lock OR pyproject.toml exists
- Uses `--frozen` for deterministic installs (no `|| true` anymore!)

**Rust (cargo)**:
- Condition: `hashFiles('Cargo.toml') != ''`
- Required when Cargo.toml exists
- Uses `cargo fetch` for dependency download

### Error Handling

**Before**: Python dependency failures were silently ignored
**After**: All dependency failures cause the build to fail

If a dependency truly needs to be optional, use step-level override:
```yaml
- name: Install optional dependencies
  if: hashFiles('optional.lock') != ''
  continue-on-error: true
  run: optional-install
```

## Security Impact

**Risk Level**: 🟢 Low (Quality/reliability improvement)
**Change Type**: Enhancement

**Benefits**:
- ✅ Prevents silently broken builds from being deployed
- ✅ Forces resolution of dependency issues
- ✅ Clearer audit trail of what was installed
- ✅ Easier to identify supply chain issues

**Trade-offs**:
- ⚠️ Builds that previously "succeeded" despite Python errors will now fail
- ✅ This is the correct behavior - force fixing the root cause

## Testing Recommendations

### Test Scenarios

1. **All dependencies present**: All three steps should run and succeed
2. **Node-only project**: Only pnpm step runs, others skip
3. **Python-only project**: Only uv step runs, others skip
4. **Rust-only project**: Only cargo step runs, others skip
5. **Missing uv.lock but has pyproject.toml**: Python step still runs
6. **Broken Python dependencies**: Build fails (no longer masked by `|| true`)

### Manual Testing

```bash
# Simulate the workflow locally
cd /home/sprime01/projects/VibesPro

# Test Node install
if [ "$(ls pnpm-lock.yaml 2>/dev/null)" ]; then
  pnpm install --frozen-lockfile
fi

# Test Python install (should fail if deps broken - no || true)
if [ "$(ls uv.lock 2>/dev/null)" ] || [ "$(ls pyproject.toml 2>/dev/null)" ]; then
  uv sync --frozen
fi

# Test Rust fetch
if [ "$(ls Cargo.toml 2>/dev/null)" ]; then
  cargo fetch
fi
```

## Migration Notes

### Breaking Change
This is technically a **breaking change** if Python dependencies were previously broken but builds were passing due to `|| true`. This is **intentional** - those builds should have been failing.

### Rollback Plan
If emergency rollback needed, revert to single combined step with `|| true` on Python line:
```yaml
- name: Install dependencies
  run: |
    if [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile; fi
    if [ -f uv.lock ] || [ -f pyproject.toml ]; then uv sync --frozen || true; fi
    if [ -f Cargo.toml ]; then cargo fetch; fi
```

### Recommended Follow-up
Fix any Python dependency issues that surface after this change rather than restoring `|| true`.

## Related Workflow Steps

Note: The **Lint** step (lines 194-198) still uses `|| true` for linting:
```yaml
- name: Lint
  run: |
    if [ -f package.json ]; then pnpm run lint || pnpm run lint:ci || true; fi
    if [ -f pyproject.toml ]; then just lint-python || true; fi
    if [ -f Cargo.toml ]; then cargo clippy --all-targets -- -D warnings || true; fi
```

This is a **separate concern** - linting may be intentionally non-blocking during development. Consider a separate task to split lint steps similarly if you want lint failures to be blocking.

## References

- **GitHub Actions hashFiles()**: https://docs.github.com/en/actions/learn-github-actions/expressions#hashfiles
- **Conditional execution**: https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idstepsif
- **Security guidelines**: `.github/instructions/security.instructions.md`
- **CI posture**: DEV-SPEC-006 in `docs/dev_spec_index.md`
- **Build tasks**: DEV-SPEC-003 in `docs/dev_spec_index.md`

## Future Enhancements

Consider:
1. **Split lint steps similarly**: Remove `|| true` from linting if you want blocking lints
2. **Add dependency caching**: Per-manager caching strategies (already exists for pnpm)
3. **Add timeout per step**: Prevent hanging on network issues
4. **Add retry logic**: Use `uses: nick-fields/retry@v2` for flaky network installs
5. **Add dependency validation**: Check for known vulnerabilities after install
6. **Matrix per package manager**: Run Node/Python/Rust jobs in parallel
