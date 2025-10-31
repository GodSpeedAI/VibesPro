# Template Cleanup - Bug Fix Summary

**Date**: October 8, 2025
**Issue**: Cleanup script was exiting with code 1
**Root Cause**: `((REMOVED_COUNT++))` arithmetic expansion with `set -e`
**Status**: ✅ Fixed

---

## The Problem

When running `just template-cleanup`, the script would:

1. Ask for confirmation
2. On answering "y", show "❌ Cleanup cancelled"
3. OR run but exit with code 1 midway through execution

## Root Cause Analysis

The issue was in the arithmetic expansion:

```bash
set -euo pipefail  # Exit on error

REMOVED_COUNT=0
((REMOVED_COUNT++))  # This returns 0 (the value BEFORE increment)
                      # With set -e, a return value of 0 is treated as FALSE/FAILURE
                      # Causes script to exit immediately
```

When `REMOVED_COUNT` is 0:

-   `((REMOVED_COUNT++))` increments the variable to 1
-   But RETURNS the old value (0)
-   With `set -e`, a return value of 0 causes immediate exit
-   Script terminates with exit code 1

## The Fix

Changed all occurrences from:

```bash
((REMOVED_COUNT++))
```

To:

```bash
REMOVED_COUNT=$((REMOVED_COUNT + 1))
```

This form:

-   Increments the counter
-   Returns the NEW value (1, 2, 3, etc.)
-   Never returns 0, so `set -e` doesn't trigger
-   Script completes successfully

## Files Modified

-   `scripts/template-cleanup.sh` - Fixed 3 occurrences of `((REMOVED_COUNT++))`

## Testing

### Before Fix

```bash
$ bash scripts/template-cleanup.sh
[INFO] Removing: specs/test-feature-direct/
# Script exits with code 1
```

### After Fix

```bash
$ bash scripts/template-cleanup.sh
[INFO] Removing: specs/test-feature-direct/
[INFO]
[INFO] ===== Template cleanup complete!
[INFO] Total items processed: 1
# Script exits with code 0
```

### Just Recipe Test

```bash
$ printf "y\n" | just template-cleanup
🧹 Cleaning up template files...
⚠️  This will remove maintainer-specific files...
[INFO] Template cleanup complete!
# Works perfectly!
```

---

## Additional Issue Found

The `.new` spec starter files show warnings because they need to be created in the template directory. The user made manual edits to them, so they exist, but the script expects them in a specific location to replace the old files.

**Next Step**: Ensure the `.new` files are in the correct location before running cleanup, or the script will skip replacing the spec files (which is safe - it just warns).

---

## Status

✅ **Script fixed and working**
✅ **Just recipes functional**
✅ **Exit code 0 on success**
✅ **Idempotent - safe to run multiple times**

**Ready to use**: `just template-cleanup`
