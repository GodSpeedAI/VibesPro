# Temporal Database Migration: sled → redb

**Branch:** `feat/temporal-db-redb-migration`
**Date:** 2025-10-04
**Related:** PHASE-006, SecureDb migration completed
**Status:** 🚧 In Progress

---

## Executive Summary

Migrate the temporal database (`temporal_db/`) from sled to redb to maintain consistency with the SecureDb migration, improve maintainability, and ensure long-term stability.

### Motivation

1. **Consistency**: SecureDb already migrated to redb (v0.2.0)
2. **Maintenance**: sled is unmaintained (perpetual beta since 2020)
3. **Stability**: redb is actively maintained, stable 2.x release
4. **Security**: Avoid using unmaintained dependencies for critical infrastructure

---

## Scope

### In Scope

- `temporal_db/repository.rs` - Core temporal repository using sled
- `temporal_db/Cargo.toml` - Dependency management
- Python adapters in `libs/prompt-optimizer/infrastructure/temporal_db.py`
- Template references in `templates/tools/prompt-optimizer/`
- Documentation updates

### Out of Scope

- SecureDb library (already migrated ✅)
- Generated project templates (will be handled separately)
- Python sled bindings (fallback to JSON/SQLite remains)

---

## Migration Plan

### Phase 1: Documentation & Specification Updates (30 min)

**Tasks:**
1. Update PHASE-006-CHECKLIST.md with TASK-017
2. Create migration specification document
3. Update architecture diagrams if needed

**Deliverables:**
- [x] TEMPORAL-DB-MIGRATION-PLAN.md (this document)
- [x] Updated PHASE-006-CHECKLIST.md
- [x] Migration decision record

**Architecture Analysis:**
- temporal_db is a module in root Cargo.toml (not a separate workspace crate)
- Current structure:
  - `temporal_db/lib.rs` - Module exports and high-level API
  - `temporal_db/repository.rs` - Core TemporalRepository using sled
  - `temporal_db/schema.rs` - Data structures
  - `temporal_db/python/` - Python bindings (uses SledTemporalDatabaseAdapter)
  
- Key sled usage patterns identified:
  - Implicit transactions: `db.insert()`, `db.scan_prefix()`
  - Key prefixes for namespace separation: `spec:`, `pattern:`, `change:`
  - Time-series keys: `{prefix}:{id}:{timestamp_nanos}`
  - JSON serialization for all values

- Dependencies (root Cargo.toml):
  - sled = "0.34" → will replace with redb = "2.2"
  - serde, serde_json, uuid, chrono (keep as-is)

### Phase 2: Cargo.toml Updates (10 min)

**Tasks:**
1. Update `temporal_db/Cargo.toml`: sled → redb
2. Verify dependency resolution

**Files:**
- [ ] `temporal_db/Cargo.toml`

### Phase 3: Repository Implementation (2-3 hours)

**Tasks:**
1. Update `temporal_db/repository.rs` to use redb API
2. Convert from implicit transactions (sled) to explicit transactions (redb)
3. Define table schemas using redb's TableDefinition
4. Update error handling

**Key Changes:**
```rust
// Before (sled)
use sled::{Db, IVec};
let db = sled::open(&self.db_path)?;
db.insert(key, value)?;

// After (redb)
use redb::{Database, TableDefinition, ReadableTable};
const SPECS_TABLE: TableDefinition<&str, &[u8]> = TableDefinition::new("specifications");
let db = Database::create(&self.db_path)?;
let write_txn = db.begin_write()?;
{
    let mut table = write_txn.open_table(SPECS_TABLE)?;
    table.insert(key, value)?;
}
write_txn.commit()?;
```

**Files:**
- [ ] `temporal_db/repository.rs`
- [ ] `temporal_db/lib.rs` (if needed)

### Phase 4: Python Adapter Updates (1 hour)

**Tasks:**
1. Update `SledTemporalDatabaseAdapter` → `RedbTemporalDatabaseAdapter`
2. Update import statements and class names
3. Maintain fallback to JSON/SQLite for compatibility

**Files:**
- [ ] `libs/prompt-optimizer/infrastructure/temporal_db.py`
- [ ] `temporal_db/python/repository.py`

### Phase 5: Template Updates (1 hour)

**Tasks:**
1. Update template references from sled to redb
2. Update requirements.txt templates
3. Update copier.yml database_type options

**Files:**
- [ ] `templates/tools/prompt-optimizer/README.md.j2`
- [ ] `templates/tools/prompt-optimizer/requirements.txt.j2`
- [ ] `templates/tools/prompt-optimizer/copier.yml`
- [ ] `templates/tools/prompt-optimizer/libs/prompt_optimizer/__init__.py.j2`

### Phase 6: Testing (1-2 hours)

**Tasks:**
1. Write unit tests for temporal repository with redb
2. Test Python adapter compatibility
3. Integration tests for temporal database operations
4. Performance benchmarks

**Test Coverage:**
- [ ] Temporal repository CRUD operations
- [ ] Time-series queries
- [ ] Pattern matching
- [ ] Python adapter interop
- [ ] Template generation with temporal DB

### Phase 7: Documentation (1 hour)

**Tasks:**
1. Update README.md temporal database section
2. Update AGENTS.md references
3. Create migration guide for existing users
4. Update API documentation

**Files:**
- [ ] `README.md`
- [ ] `AGENTS.md`
- [ ] `temporal_db/README.md`
- [ ] `docs/DATABASE-MIGRATION-SUMMARY.md` (update)

---

## Technical Implementation Details

### Table Definitions

```rust
// Define tables for temporal database
const SPECIFICATIONS_TABLE: TableDefinition<&str, &[u8]> = 
    TableDefinition::new("specifications");

const PATTERNS_TABLE: TableDefinition<&str, &[u8]> = 
    TableDefinition::new("patterns");

const CHANGES_TABLE: TableDefinition<&str, &[u8]> = 
    TableDefinition::new("changes");

const DECISIONS_TABLE: TableDefinition<&str, &[u8]> = 
    TableDefinition::new("decisions");
```

### Key Spaces (sled → redb mapping)

| sled key prefix | redb table | Notes |
|----------------|------------|-------|
| `spec:*` | SPECIFICATIONS_TABLE | Specification records |
| `pattern:*` | PATTERNS_TABLE | Architectural patterns |
| `change:*` | CHANGES_TABLE | Time-series changes |
| `decision:*` | DECISIONS_TABLE | Decision points |

### Migration Strategy

**Option 1: Clean Migration (Recommended)**
- New installations use redb from the start
- Existing users migrate data manually (provide script)
- Simplest implementation

**Option 2: Automatic Migration**
- Detect sled database on startup
- Migrate data to redb automatically
- More complex, better UX

**Decision: Option 1** - Clean migration with data export/import scripts

---

## Risk Assessment

### Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking existing temporal data | Medium | High | Provide data migration script |
| Python adapter compatibility | Low | Medium | Maintain JSON/SQLite fallback |
| Performance regression | Low | Low | Benchmark before/after |
| Template generation failures | Low | Medium | Comprehensive testing |

### Rollback Plan

```bash
# Revert to sled
git revert HEAD~5..HEAD
cd temporal_db
git checkout HEAD~5 Cargo.toml repository.rs
cargo build
```

---

## Success Criteria

- [ ] All temporal database operations work with redb
- [ ] Python adapter maintains backward compatibility
- [ ] Templates generate correctly with redb references
- [ ] Performance comparable or better than sled
- [ ] All tests passing
- [ ] Documentation complete and accurate
- [ ] Data migration script provided for existing users

---

## Timeline

| Phase | Estimated Time | Status |
|-------|----------------|--------|
| Phase 1: Documentation | 30 min | ⏳ In Progress |
| Phase 2: Cargo.toml | 10 min | ⏳ Not Started |
| Phase 3: Repository | 2-3 hours | ⏳ Not Started |
| Phase 4: Python Adapters | 1 hour | ⏳ Not Started |
| Phase 5: Templates | 1 hour | ⏳ Not Started |
| Phase 6: Testing | 1-2 hours | ⏳ Not Started |
| Phase 7: Documentation | 1 hour | ⏳ Not Started |
| **Total** | **6-9 hours** | |

---

## Validation Checklist

### Pre-Migration
- [x] Create migration branch
- [ ] Review temporal database usage patterns
- [ ] Identify all sled dependencies
- [ ] Create comprehensive test suite

### During Migration
- [ ] Update dependencies
- [ ] Migrate repository implementation
- [ ] Update Python adapters
- [ ] Update templates
- [ ] Run all tests

### Post-Migration
- [ ] Performance benchmarks
- [ ] Integration testing
- [ ] Documentation review
- [ ] Create PR with detailed description
- [ ] Code review
- [ ] Merge to dev
- [ ] Merge to main after validation

---

## References

- **SecureDb Migration**: `/docs/DATABASE-MIGRATION-SUMMARY.md`
- **redb Documentation**: https://docs.rs/redb/
- **sled Documentation**: https://docs.rs/sled/ (for comparison)
- **PHASE-006**: `/docs/aiassist/PHASE-006-CHECKLIST.md`

---

**Status**: 🚧 Phase 1 in progress
**Next Step**: Update PHASE-006-CHECKLIST.md with TASK-017
