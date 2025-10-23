# Template Cleanup - Quick Reference Card

## ✅ Completed Tasks

1. **Added work-summaries note** to `templates/{{project_slug}}/.github/copilot-instructions.md.j2`
2. **Created 4 minimal spec starters** (506 lines total):
   - dev_adr.md.j2.new (56 lines)
   - dev_prd.md.j2.new (98 lines)
   - dev_sds.md.j2.new (148 lines)
   - dev_technical-specifications.md.j2.new (204 lines)
3. **Created cleanup script** `scripts/template-cleanup.sh` (executable)
4. **Added just recipes**: `template-cleanup` and `template-cleanup-force`

---

## 🚀 How to Use

### Option 1: Interactive (Recommended)

```bash
just template-cleanup
# Asks for confirmation before executing
```

### Option 2: Force (CI/Automation)

```bash
just template-cleanup-force
# Runs without confirmation
```

---

## 📋 What the Script Does

### Removes (22+ items)

- 12 maintainer-specific docs
- 6 test artifact directories
- work-summaries/ folder

### Replaces (4 files)

- dev_adr.md.j2 → minimal starter with instructions
- dev_prd.md.j2 → minimal starter with instructions
- dev_sds.md.j2 → minimal starter with instructions
- dev_technical-specifications.md.j2 → minimal starter with instructions

---

## 📊 Before & After

### Before Cleanup

```
User generates project →
Gets pre-filled VibesPro specs →
Confusion about whose specs these are →
Has to delete and recreate
```

### After Cleanup

```
User generates project →
Gets minimal starters with clear instructions →
Runs chat modes to generate their own specs →
Clear, correct workflow
```

---

## 🎯 Next Steps

1. **Review** implementation in these docs:

   - `docs/workdocs/template-cleanup-implementation.md` (detailed)
   - `docs/work-summaries/2025-10-08-template-cleanup.md` (summary)

2. **Execute** the cleanup:

   ```bash
   just template-cleanup
   ```

3. **Test** generation:

   ```bash
   pnpm generate
   # Check that specs are minimal starters
   cat ../your-test-project/docs/dev_adr.md
   ```

4. **Commit** with proper message (see implementation doc)

---

## 📚 Documentation

- **Analysis**: `docs/workdocs/template-docs-cleanup-analysis.md`
- **Implementation**: `docs/workdocs/template-cleanup-implementation.md`
- **Summary**: `docs/work-summaries/2025-10-08-template-cleanup.md`
- **This Card**: Quick reference for execution

---

## ✨ Key Features

✅ **Safe**: Idempotent, can run multiple times
✅ **Clear**: Color-coded output, progress indicators
✅ **Complete**: Removes 22+ items, replaces 4 files
✅ **Guided**: Spec starters include chat mode instructions
✅ **Maintainable**: Centralized logic, easy to extend

---

## 🔍 Verify Changes

```bash
# Before cleanup
ls templates/{{project_slug}}/docs/dev_*.md

# After cleanup
ls templates/{{project_slug}}/docs/dev_*.md.j2
cat templates/{{project_slug}}/docs/dev_adr.md.j2
# Should see minimal starter with instructions
```

---

**Ready to Execute!** 🚀
