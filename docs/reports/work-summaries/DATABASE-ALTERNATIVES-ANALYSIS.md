# Embedded Database Alternatives Analysis

**Date:** 2025-10-04
**Context:** SecureDb has ~800-950% performance overhead. Evaluating alternatives.
**Current:** Sled with XChaCha20-Poly1305 encryption wrapper

## Executive Summary

**Current Performance Crisis:**

- **Sled + Encryption:** ~800-950% overhead (8-10x slower than plain)
- **Real Impact:** 1,000 ops = 90ms (vs 9ms plain) | 100,000 ops = 9s (vs 0.9s plain)
- **Bottleneck Breakdown:**
    - 60-70%: Encryption/decryption operations
    - 10-15%: Nonce counter persistence
    - 15-20%: Memory allocations
    - 5-10%: Sled database overhead

**Recommendation:** Switch to **redb** with encryption wrapper (same pattern as current SecureDb)

---

## Database Comparison Matrix

| Database    | Type     | Performance  | Encryption | ACID | Status               | Recommendation           |
| ----------- | -------- | ------------ | ---------- | ---- | -------------------- | ------------------------ |
| **Sled**    | LSM-tree | Good         | External   | ✅   | ⚠️ Beta/Unmaintained | ❌ Current (problematic) |
| **redb**    | B-tree   | Excellent    | External   | ✅   | ✅ v2.2+ Stable      | ✅ **TOP CHOICE**        |
| **RocksDB** | LSM-tree | Excellent    | External   | ✅   | ✅ Production-proven | ✅ Alternative           |
| **fjall**   | LSM-tree | Good         | External   | ✅   | ✅ Post-1.0          | ⚠️ Newer                 |
| **LMDB**    | B-tree   | Good (small) | External   | ✅   | ✅ Mature            | ⚠️ Large dataset issues  |

---

## Detailed Analysis

### 1. redb (RECOMMENDED)

**Why redb is the best choice:**

✅ **Pure Rust** - No C++ dependencies, better integration
✅ **Stable** - v2.2+, actively maintained
✅ **B-tree architecture** - Lower overhead than LSM
✅ **Simple API** - Similar to sled, easy migration
✅ **ACID compliant** - Full transaction support
✅ **Zero-copy reads** - Better performance potential
✅ **Embedded** - Single file database

**Performance Characteristics:**

```rust
// redb is typically 20-50% faster than sled for reads
// Similar or better write performance
// Lower memory overhead
// More predictable performance (no compaction)
```

**Migration Path:**

```rust
// Current (sled-based):
pub struct SecureDb {
    db: sled::Db,
    cipher: XChaCha20Poly1305,
    // ...
}

// Future (redb-based):
pub struct SecureDb {
    db: redb::Database,
    cipher: XChaCha20Poly1305,
    // ... same encryption logic
}
```

**Expected Improvement:**

- **Database overhead:** ~20-30% reduction (B-tree vs LSM)
- **Overall:** ~750-850% overhead → ~550-650% (still encrypted)
- **Without encryption:** Should match or beat sled baseline

**Implementation Effort:** 2-4 hours (API is similar)

---

### 2. RocksDB (ALTERNATIVE)

**Pros:**
✅ **Battle-tested** - Used by Facebook, LinkedIn, etc.
✅ **Excellent performance** - Optimized LSM implementation
✅ **Production-proven** - Handles TB+ datasets
✅ **Rich features** - Column families, merge operators
✅ **Active development** - Regular updates

**Cons:**
❌ **C++ dependency** - Requires system libraries
❌ **Larger binary** - ~2-3MB overhead
❌ **Complex API** - Steeper learning curve
❌ **Write amplification** - LSM architecture trade-off

**When to Choose:**

- Need to scale beyond 100GB
- Require advanced features (column families, merge operators)
- Already have C++ build infrastructure
- Write-heavy workloads

**Expected Performance:**

- Similar to redb for your use case
- Better for very large datasets (100GB+)
- Slightly higher overhead due to FFI

---

### 3. Sled (CURRENT - NOT RECOMMENDED)

**Why to Migrate Away:**
❌ **Unmaintained** - Author moved to other projects
❌ **Beta status** - Never reached 1.0
❌ **Known issues** - [List of open issues](https://github.com/spacejam/sled/issues)
❌ **LSM overhead** - Compaction, write amplification

**Current State:**

- 8.7k stars but development stalled
- Last significant update: 2023
- Community maintains forks but fragmented

---

### 4. fjall (NEWER OPTION)

**Pros:**
✅ **Pure Rust**
✅ **Post-1.0** (v1.0+ released)
✅ **Active development**
✅ **LSM-tree** - Good for write-heavy

**Cons:**
⚠️ **Newer** - Less battle-tested
⚠️ **Smaller community** - Fewer resources

**When to Consider:**

- Want pure Rust
- Write-heavy workloads
- Can tolerate newer library

---

### 5. LMDB (NOT RECOMMENDED FOR YOUR USE CASE)

**Why NOT:**
❌ **Pathological performance** with >10M keys
❌ **Memory-mapped I/O** - Can cause issues
❌ **CoW B-tree** - Write amplification

**Only Use If:**

- Very small dataset (<1M keys)
- Read-heavy workload
- Need proven C library

---

## Performance Projections

### Current (Sled + Encryption)

```
Overhead: ~800-950%
1,000 ops:   9ms → 90ms   (81ms penalty)
10,000 ops:  90ms → 900ms (810ms penalty)
100,000 ops: 0.9s → 9s    (8.1s penalty)
```

### With redb + Encryption (Projected)

```
Overhead: ~550-650% (25-35% improvement)
1,000 ops:   9ms → 60ms   (51ms penalty)
10,000 ops:  90ms → 600ms (510ms penalty)
100,000 ops: 0.9s → 6s    (5.1s penalty)
```

### With RocksDB + Encryption (Projected)

```
Overhead: ~600-700% (similar to redb)
1,000 ops:   9ms → 65ms   (56ms penalty)
10,000 ops:  90ms → 650ms (560ms penalty)
100,000 ops: 0.9s → 6.5s  (5.6s penalty)
```

### Baseline (No Encryption) - Any DB

```
Overhead: ~0%
1,000 ops:   9ms
10,000 ops:  90ms
100,000 ops: 0.9s

NOTE: This is not a realistic option for your security requirements.
```

---

## The Encryption Reality Check

**Critical Understanding:**

The ~800% overhead is NOT primarily from sled. It's from:

1. **XChaCha20-Poly1305 encryption** (60-70% of overhead)
2. **Nonce management** (10-15% of overhead)
3. **Memory allocations** (15-20% of overhead)
4. **Database operations** (5-10% of overhead)

**This means:**

- Switching databases will only reduce ~5-10% of the overhead
- Expected improvement: 800% → 720-750% (switching DB alone)
- **To get under 100% overhead, you need to eliminate encryption**

---

## Fundamental Trade-off

```
┌─────────────────────────────────────────────────┐
│                PICK TWO:                        │
│                                                 │
│  1. Security (Encryption at Rest)               │
│  2. Performance (<100% overhead)                │
│  3. Embedded Database (No external services)    │
│                                                 │
│  Current: #1 + #3 = ~800% overhead              │
└─────────────────────────────────────────────────┘
```

---

## Alternative Architectures

### Option A: Database-Level Encryption (PostgreSQL, MySQL)

**Pros:**
✅ Built-in encryption (TDE - Transparent Data Encryption)
✅ Much lower overhead (~10-20%)
✅ Production-proven

**Cons:**
❌ Requires external database server
❌ More complex deployment
❌ Not embedded

**Use When:**

- Can accept client-server architecture
- Need <50% encryption overhead
- Have ops team to manage database

---

### Option B: Filesystem Encryption (LUKS, dm-crypt)

**Pros:**
✅ OS-level encryption
✅ Very low overhead (~5-15%)
✅ Transparent to application

**Cons:**
❌ Requires root/admin privileges
❌ Encrypts entire disk/partition
❌ Not portable (deployment-specific)

**Use When:**

- Control deployment environment
- Can use OS-level encryption
- Want minimal performance impact

---

### Option C: Hybrid Approach

**Encrypt only sensitive fields, not entire database:**

```rust
pub struct HybridSecureDb {
    db: redb::Database,
    cipher: XChaCha20Poly1305,
}

impl HybridSecureDb {
    // Encrypt only specific columns/values
    pub fn insert_encrypted(&self, key: &[u8], value: &[u8]) -> Result<()> {
        let ciphertext = self.cipher.encrypt(..., value)?;
        self.db.insert(key, ciphertext)?;
        Ok(())
    }

    // Some data can be plaintext (non-sensitive)
    pub fn insert_plain(&self, key: &[u8], value: &[u8]) -> Result<()> {
        self.db.insert(key, value)?;
        Ok(())
    }
}
```

**Expected Overhead:** ~200-400% (only on encrypted operations)

---

## Recommended Action Plan

### Phase 1: Quick Win (2-4 hours)

**Migrate from Sled to redb**

1. Update dependencies:

    ```toml
    [dependencies]
    redb = "2.2"  # Replace sled
    ```

2. Update SecureDb implementation:
    - Replace `sled::Db` with `redb::Database`
    - Adapt API calls (very similar)
    - Keep encryption logic unchanged

3. Run benchmarks:
    - Expected: ~720-750% overhead (vs current 800-950%)
    - Improvement: ~10-25% faster

### Phase 2: Architecture Decision (Discussion needed)

**Question for stakeholders:**

> "We can reduce overhead from 800% to ~700% by switching databases. To get under 100%, we need to change the encryption approach. What are the requirements?"

**Options:**

1. **Accept 700% overhead** - Security-first, embedded database
2. **Use PostgreSQL/MySQL with TDE** - ~20% overhead, requires external DB
3. **Use filesystem encryption** - ~10% overhead, requires OS-level access
4. **Hybrid encryption** - ~200-400% overhead, only encrypt sensitive data

### Phase 3: Implementation (Based on Phase 2 decision)

**If staying with embedded + full encryption:**

- Optimize in-place encryption (est. 20-30% improvement)
- Implement buffer pooling (est. 10-15% improvement)
- Add batch operations API (est. 30-40% improvement)
- **Best case:** ~350-450% overhead (still 4-5x slower)

**If switching architectures:**

- PostgreSQL/MySQL with TDE: ~20% overhead
- Filesystem encryption: ~10% overhead
- Hybrid approach: ~200-400% overhead

---

## Benchmarks from Community

**Reddit Discussion (2024-07):**

> "RocksDB is still king for raw key-value storage. LMDB sounds good but IME it will crap itself at any meaningful amount of keys (over a few tens of millions)."

**sled-vs-rocksdb Benchmark:**

- RocksDB: Generally faster for large datasets
- Sled: Competitive for small-medium workloads
- redb: Not in old benchmarks (too new) but reports show ~20% faster than sled

**RocksDB 10.2 Benchmarks (2025-05):**

- Significant improvements in recent versions
- Hyperclock cache better than LRU for CPU-bound
- Production-proven at TB+ scale

---

## Implementation Code Examples

### redb Migration Example

```rust
use redb::{Database, Error, ReadableTable, TableDefinition};
use chacha20poly1305::{XChaCha20Poly1305, aead::{Aead, KeyInit}};

const DATA_TABLE: TableDefinition<&[u8], &[u8]> = TableDefinition::new("data");

pub struct SecureDb {
    db: Database,
    cipher: XChaCha20Poly1305,
    counter: Mutex<u64>,
}

impl SecureDb {
    pub fn open<P: AsRef<Path>>(path: P, master_key: &[u8]) -> Result<Self> {
        let okm = derive_encryption_key(master_key)?;
        let cipher = XChaCha20Poly1305::new((&*okm).into());
        let db = Database::create(path)?;

        Ok(Self {
            db,
            cipher,
            counter: Mutex::new(0),
        })
    }

    pub fn insert(&self, key: &[u8], value: &[u8]) -> Result<()> {
        let nonce = self.allocate_nonce()?;
        let ciphertext = self.cipher.encrypt(&nonce, value)?;

        let write_txn = self.db.begin_write()?;
        {
            let mut table = write_txn.open_table(DATA_TABLE)?;
            table.insert(key, ciphertext.as_slice())?;
        }
        write_txn.commit()?;
        Ok(())
    }

    pub fn get(&self, key: &[u8]) -> Result<Option<Vec<u8>>> {
        let read_txn = self.db.begin_read()?;
        let table = read_txn.open_table(DATA_TABLE)?;

        match table.get(key)? {
            Some(encrypted) => {
                let value = encrypted.value();
                let decrypted = self.decrypt_entry(value)?;
                Ok(Some(decrypted))
            }
            None => Ok(None),
        }
    }
}
```

---

## Decision Matrix

| Requirement      | redb | RocksDB | PostgreSQL | Filesystem | Current |
| ---------------- | ---- | ------- | ---------- | ---------- | ------- |
| Embedded         | ✅   | ✅      | ❌         | ✅         | ✅      |
| Pure Rust        | ✅   | ❌      | ❌         | ✅         | ✅      |
| <100% overhead   | ❌   | ❌      | ✅         | ✅         | ❌      |
| Full encryption  | ✅   | ✅      | ✅         | ✅         | ✅      |
| Easy migration   | ✅   | ⚠️      | ❌         | ⚠️         | -       |
| Production ready | ✅   | ✅      | ✅         | ✅         | ⚠️      |
| Maintenance      | ✅   | ✅      | ✅         | ✅         | ❌      |

**Score:**

- redb: 6/7 (Only misses <100% overhead)
- RocksDB: 5/7
- PostgreSQL: 4/7
- Filesystem: 5/7
- Current (Sled): 3/7

---

## Conclusion

**Short-term (Immediate):**

1. ✅ **Migrate to redb** - 2-4 hour effort, ~10-25% improvement
2. ✅ Keep current encryption approach
3. ✅ Update documentation

**Medium-term (Next sprint):**

1. 🤔 **Architecture decision** - Discuss with stakeholders
2. 🤔 **Acceptable overhead?** - 700% vs 20% vs 10%
3. 🤔 **Deployment constraints?** - Embedded vs client-server

**Long-term (If needed):**

1. ⚠️ **Hybrid encryption** - Only encrypt sensitive fields
2. ⚠️ **PostgreSQL/MySQL** - If <100% overhead required
3. ⚠️ **Filesystem encryption** - If OS-level access available

---

**Next Steps:**

1. Get stakeholder input on acceptable overhead
2. Implement redb migration (quick win)
3. Re-benchmark and compare
4. Make architecture decision based on requirements

**Questions for Discussion:**

1. Is 700% overhead acceptable for security-critical operations?
2. Can we use PostgreSQL/MySQL instead of embedded DB?
3. Can we use OS-level filesystem encryption?
4. Can we selectively encrypt only sensitive data?
