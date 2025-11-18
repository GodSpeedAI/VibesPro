# Spec Reorganization Summary

**Date:** 2025-11-18
**Status:** ✅ Complete

## What Was Done

### 1. Created Domain-Organized Structure

Reorganized specifications from monolithic files into domain-based folders:

```
docs/specs/
├── ai_workflow/       # 3 files (PRD, ADR, SDS)
├── observability/     # 3 files (PRD, ADR, SDS)
├── generators/        # 3 files (PRD, ADR, SDS)
├── environment/       # 3 files (PRD, ADR, SDS)
├── security/          # 3 files (PRD, ADR, SDS)
└── core/              # 4 files (PRD, ADR, SDS, SPEC)
```

**Total:** 25 specification files organized by domain

### 2. Fixed Duplicate Spec ID

-   **Issue:** `DEV-PRD-019` was duplicated in source files
-   **Resolution:** Renumbered "AI pattern intelligence" from `DEV-PRD-019` to `DEV-PRD-032`
-   **Kept:** `DEV-PRD-019` for "Complete Generator Specification Template"

### 3. Updated Tooling

-   **Modified:** `tools/spec/matrix.js`
    -   Changed scan directory from `docs/` to `docs/specs/`
    -   Added uniqueness enforcement (fails on duplicate IDs)
-   **Modified:** `tools/spec/ids.js`
    -   Updated to only extract IDs from headers (## lines)
    -   Prevents false positives from "Supported by" references

### 4. Updated References

Updated references in:

-   `README.md`
-   `ops/vector/README.md`
-   `libs/node-logging/README.md`
-   `docs/dev_spec_index.md`

**Note:** Historical documents in `docs/reports/` and `docs/work-summaries/` still reference old paths. These are intentionally left as-is for historical accuracy.

### 5. Created Documentation

-   `docs/specs/README.md` - Explains new structure and conventions
-   `docs/plans/spec_refactor_plan.md` - Implementation plan
-   `scripts/migrate_specs_ddd.cjs` - Migration script (can be deleted after verification)
-   `scripts/update_spec_references.sh` - Reference update script

## Verification

### Spec Matrix

```bash
just spec-matrix
# Output: [matrix] Up-to-date with 91 row(s)
```

### Uniqueness Check

The spec-matrix tool now enforces that each Spec ID appears in only ONE file. Running `just spec-matrix` will fail if duplicates are detected.

### File Count

-   **Before:** 4 monolithic files (`dev_prd.md`, `dev_adr.md`, `dev_sds.md`, `dev_technical-specifications.md`)
-   **After:** 25 domain-organized files + 1 README

## Migration Details

### Domain Mapping

Specs were grouped by domain context:

-   **ai_workflow:** PRD-001-010, PRD-032, ADR-001-010, ADR-018
-   **observability:** PRD-017-018, ADR-016-017, SDS-017-018
-   **generators:** PRD-008, 019, 021, 024, 029, ADR-008, 019, 021, 023, 028, SDS-019, 021, 023, 028
-   **environment:** PRD-011-016, 027-028, ADR-011-015, 026-027, SDS-010-015, 026-027
-   **security:** PRD-005, 013, ADR-005, 013, SDS-012
-   **core:** PRD-020, 022-023, 025-026, 030-031, ADR-020, 022, 024-025, 029, SDS-001-009, 016, 019-020, 022, 024-025, 029-030, SPEC-001-011

### Scripts Created

1. `scripts/migrate_specs_ddd.cjs` - Parses monolithic files and writes to domain folders
2. `scripts/update_spec_references.sh` - Updates references across the codebase

## Next Steps

### ✅ Completed

1. ✅ Verify all specs are accessible via new paths
2. ✅ Run `just spec-matrix` to confirm traceability
3. ✅ Update template files in `templates/{{project_slug}}/`
4. ✅ Clean up migration scripts

### Optional (User Decision)

-   **Archive old files:** Consider moving `docs/dev_*.md` to `docs/archive/`
-   **Update prompts/instructions:** Update `.github/prompts/` and `.github/instructions/` if they reference old spec paths

## Rollback Plan

If needed, the old files still exist at:

-   `docs/dev_prd.md`
-   `docs/dev_adr.md`
-   `docs/dev_sds.md`
-   `docs/dev_technical-specifications.md`

To rollback:

1. Revert changes to `tools/spec/matrix.js` and `tools/spec/ids.js`
2. Delete `docs/specs/` directory
3. Restore references in README and other files

## Success Criteria

-   [x] All specs migrated to domain folders
-   [x] Spec matrix generates without errors
-   [x] Uniqueness enforcement working
-   [x] No duplicate spec IDs
-   [x] Key references updated
-   [x] Documentation created
