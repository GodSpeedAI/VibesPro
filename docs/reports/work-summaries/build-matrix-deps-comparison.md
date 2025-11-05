# Dependency Installation Comparison

## Before (Lines 179-183) ❌

```yaml
# ---- Install project deps ----
- name: Install dependencies
  run: |
      if [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile; fi
      if [ -f uv.lock ] || [ -f pyproject.toml ]; then uv sync --frozen || true; fi
      if [ -f Cargo.toml ]; then cargo fetch; fi
```

### Issues

-   ❌ Single combined step - unclear which manager failed
-   ❌ `|| true` masks Python dependency failures
-   ❌ Shell-based conditionals less idiomatic
-   ❌ No visibility into which deps are optional
-   ❌ Continues on error, wasting CI time

---

## After (Lines 178-191) ✅

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

### Improvements

-   ✅ Three explicit steps - clear failure identification
-   ✅ No `|| true` - failures stop the build (fail-fast)
-   ✅ GitHub Actions `if:` conditions - idiomatic and reliable
-   ✅ Clear visibility - "skipped" status when not applicable
-   ✅ Fails fast - saves CI time and resources

---

## GitHub Actions UI Comparison

### Before

```
✅ Install dependencies (3s)
   - Node: installed
   - Python: ERROR (but masked by || true)
   - Rust: fetched
```

→ Build appears successful even with broken Python deps

### After

```
✅ Install Node dependencies (pnpm) (2s)
❌ Install Python dependencies (uv) (1s)
   uv sync failed: dependency resolution error
⏭️ Fetch Rust dependencies (cargo) (skipped - stopped on failure)
```

→ Build fails immediately, clearly showing Python deps are broken

---

## Real-World Example

### Scenario: Python dependency conflict

**Before**:

```
Installing dependencies...
  ✅ pnpm install: success
  ❌ uv sync: dependency conflict (ignored due to || true)
  ✅ cargo fetch: success
✅ Install dependencies completed
✅ Build completed
✅ Tests completed
🚀 Deployed broken build to production
```

**After**:

```
  ✅ Install Node dependencies (pnpm): success
  ❌ Install Python dependencies (uv): dependency conflict
❌ Workflow failed - Python dependency issue
⏹️ Build not started
⏹️ Tests not run
⏹️ Deployment blocked
```

---

## Cost Savings

### CI Time Saved Per Failed Build

-   **Before**: Full workflow runs despite broken deps (~10-15 min)
-   **After**: Fails in dependency phase (~2-3 min)
-   **Savings**: 7-12 minutes per failed build

### Developer Time Saved

-   **Before**: Debug mysterious runtime failures in deployed code
-   **After**: Clear dependency error message, fix before merge
-   **Savings**: Hours of debugging time

---

## Summary

The new approach provides:

1. **Better observability**: Clear which package manager failed
2. **Fail-fast**: Don't waste time on broken builds
3. **Explicit intent**: Each dependency's requirements are clear
4. **Best practices**: Uses GitHub Actions native conditionals
5. **Cost savings**: Faster feedback, less wasted CI time
