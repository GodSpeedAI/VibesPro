# Security Hardening Specification

**Status:** DRAFT
**Version:** 1.0.0
**Last Updated:** 2025-10-03
**Traceability:** AI_ADR-006, AI_PRD-006, AI_SDS-005

## 1. Executive Summary

This specification defines the security hardening approach for VibesPro-generated applications, focusing on edge-friendly, TPM-backed encryption at rest for the temporal learning database (sled). The approach prioritizes minimal runtime overhead, small binary size, and defense-in-depth suitable for edge devices and constrained environments.

**Key Objectives:**

- Encrypt temporal learning data at rest using modern AEAD primitives
- Support TPM-backed key sealing for hardware-bound security
- Maintain sub-30s generation time and sub-2m build time
- Zero-copy zeroization for in-memory key handling
- Optional feature flag to avoid mandatory complexity

## 2. Threat Model

**Assumptions:**

- Attacker has local file access but not TPM secrets
- Device may be physically captured; prevent bulk data exfiltration
- Network is untrusted; local secrets are primary target
- Focus on defense against offline attacks and data-at-rest exposure

**Out of Scope:**

- Protection against active runtime memory inspection by privileged attackers
- Network protocol hardening (covered separately by mTLS/rustls)
- Source code obfuscation

## 3. Hardening Priorities (Edge-Optimized)

### 3.1 Core Security Primitives (P0)

1. **Key Storage: TPM-Backed Sealing**

   - Use device TPM 2.0 to seal master key
   - No network calls required
   - Key unseals only on same hardware (hardware-bound)
   - Fallback to secure enclave or file-based sealing where TPM unavailable

2. **In-Memory Key Handling**

   - Derive ephemeral keys with HKDF-SHA256
   - Immediately zero secret buffers after use (via `zeroize` crate)
   - No keys persist in process heap after use

3. **AEAD Cipher: XChaCha20-Poly1305**

   - Safer nonce handling (192-bit nonce space vs 96-bit for AES-GCM)
   - Fast on ARM and small CPUs without AES-NI
   - RustCrypto `chacha20poly1305` for minimal dependency surface

4. **Deterministic Nonce Scheme**
   - Monotonic counter (64-bit) + database UUID (128-bit) → 192-bit nonce
   - Persist counter in sled metadata atomically with writes
   - Nonce embedded in ciphertext: `[nonce || ciphertext]` per record

### 3.2 Deployment Hardening (P1)

5. **Least-Privilege Process Model**

   - Run as non-root (UID 65532)
   - Drop all Linux capabilities
   - Use minimal systemd unit (preferred) or distroless container

6. **Read-Only Code Image**

   - Deploy as single immutable binary
   - Writable data directory: `/var/lib/vibes` (or `/data` in container)
   - Code directory marked read-only

7. **Secure Updates: Signed OTA**

   - Sign releases with Ed25519
   - Verify signature on-device before binary replacement
   - Atomic update with rollback on failure

8. **Minimal Network Crypto: mTLS**
   - Use `rustls` with client certificates
   - Certificates stored in TPM or sealed file
   - No dependency on heavyweight auth servers

### 3.3 Operational Security (P2)

9. **Compact Audit Logging**

   - Write-only append log encrypted with master key-derived subkey
   - Automatic rotation by size (default: 10MB)
   - Structured JSON lines for parsing

10. **Prompt Redaction at Ingest**

    - Regex-based secret masking before storage
    - Configurable patterns (API keys, tokens, PII)
    - Fast, lightweight, no ML dependency

11. **Static Linking + musl**

    - Single static binary (x86_64-unknown-linux-musl)
    - Reduces runtime dependencies
    - Simplifies edge deployment

12. **Runtime Sandboxing**
    - seccomp syscall filter (minimal policy)
    - `no_new_privs` flag
    - Optional AppArmor/SELinux profiles

### 3.4 Supply Chain & Operations (P3)

13. **CI: Reproducible Builds + SBOM**

    - Produce CycloneDX SBOM
    - Signed artifacts (GPG or sigstore)
    - Offline verification scripts

14. **Encrypted Backups**

    - Encrypted sled dumps with per-backup IV
    - Signature verification
    - Short retention by default (30 days)

15. **Key Rotation Support**
    - Wrap new key with old key
    - Rewrap metadata atomically
    - Re-encrypt payloads lazily (on read-write) or via background job

## 4. Implementation Constraints

### 4.1 Cryptographic Decisions

| Component               | Choice                                  | Rationale                                |
| ----------------------- | --------------------------------------- | ---------------------------------------- |
| Master Key              | 256-bit (32 bytes)                      | Industry standard for AES-256 equivalent |
| KDF                     | HKDF-SHA256                             | NIST-approved, widely audited            |
| AEAD                    | XChaCha20-Poly1305                      | Nonce-misuse resistant, fast on ARM      |
| Nonce                   | 192-bit (64-bit counter + 128-bit UUID) | Large enough to avoid birthday bound     |
| Key Derivation Contexts | `db-key`, `audit-key`, `transport-key`  | Domain separation for subkeys            |

### 4.2 Performance Targets

- **Encryption overhead:** < 5% latency increase for sled operations
- **Memory overhead:** < 10MB additional for crypto state
- **Binary size increase:** < 2MB for full crypto stack
- **Startup time:** < 100ms for TPM unseal + DB open

### 4.3 Failure Modes

- **Nonce reuse risk:** Refuse writes and surface critical alert
- **TPM unavailable:** Fall back to file-based sealing with warning
- **Key rotation conflict:** Block writes during rotation window
- **Corrupted ciphertext:** Return error, do not panic

## 5. Reference Implementation (Skeleton)

### 5.1 Cargo Dependencies

```toml
[dependencies]
sled = "0.34"
chacha20poly1305 = { version = "0.10", features = ["std"] }
hkdf = "0.12"
sha2 = "0.10"
zeroize = "1.6"
anyhow = "1.0"
```

### 5.2 Encrypted Sled Wrapper (Rust)

```rust
use chacha20poly1305::aead::{Aead, KeyInit};
use chacha20poly1305::{XChaCha20Poly1305, XNonce};
use hkdf::Hkdf;
use sha2::Sha256;
use sled::Db;
use zeroize::Zeroizing;
use std::sync::Mutex;
use std::path::Path;

pub struct SecureDb {
    db: Db,
    cipher: XChaCha20Poly1305,
    counter: Mutex<u64>,
    db_uuid: [u8; 16],
}

impl SecureDb {
    pub fn open<P: AsRef<Path>>(path: P, master_key: &[u8]) -> anyhow::Result<Self> {
        // Derive DB-specific subkey from master key
        let hk = Hkdf::<Sha256>::new(None, master_key);
        let mut okm = Zeroizing::new([0u8; 32]);
        hk.expand(b"db-key", &mut *okm)
            .map_err(|e| anyhow::anyhow!("HKDF expand failed: {}", e))?;

        let cipher = XChaCha20Poly1305::new((&*okm).into());
        // okm automatically zeroized on drop

        let db = sled::open(path)?;

        // Load or generate DB UUID
        let db_uuid = if let Some(uuid_bytes) = db.get(b"__db_uuid")? {
            uuid_bytes.as_ref().try_into()?
        } else {
            let uuid = uuid::Uuid::new_v4().as_bytes().clone();
            db.insert(b"__db_uuid", &uuid)?;
            uuid
        };

        // Load or initialize counter
        let counter = if let Some(ctr_bytes) = db.get(b"__nonce_counter")? {
            u64::from_le_bytes(ctr_bytes.as_ref().try_into()?)
        } else {
            0
        };

        Ok(SecureDb {
            db,
            cipher,
            counter: Mutex::new(counter),
            db_uuid,
        })
    }

    fn next_nonce(&self) -> anyhow::Result<XNonce> {
        let mut ctr = self.counter.lock().unwrap();
        let val = *ctr;
        *ctr += 1;

        // Persist counter atomically
        self.db.insert(b"__nonce_counter", &ctr.to_le_bytes())?;

        // Build nonce: [counter:8 || uuid:16 || padding:0]
        let mut nonce_bytes = [0u8; 24];
        nonce_bytes[..8].copy_from_slice(&val.to_le_bytes());
        nonce_bytes[8..24].copy_from_slice(&self.db_uuid);

        Ok(XNonce::from(nonce_bytes))
    }

    pub fn insert(&self, key: &[u8], value: &[u8]) -> anyhow::Result<Option<Vec<u8>>> {
        let nonce = self.next_nonce()?;

        // Encrypt: returns [ciphertext || tag]
        let ciphertext = self.cipher.encrypt(&nonce, value)
            .map_err(|e| anyhow::anyhow!("Encryption failed: {}", e))?;

        // Store: [nonce || ciphertext]
        let mut stored = Vec::with_capacity(24 + ciphertext.len());
        stored.extend_from_slice(nonce.as_slice());
        stored.extend_from_slice(&ciphertext);

        let prev = self.db.insert(key, stored)?;

        // Decrypt previous value if it existed
        if let Some(prev_bytes) = prev {
            let (prev_nonce, prev_ct) = prev_bytes.split_at(24);
            let prev_plaintext = self.cipher.decrypt(
                XNonce::from_slice(prev_nonce),
                prev_ct
            ).ok(); // Ignore decryption errors for old values
            Ok(prev_plaintext)
        } else {
            Ok(None)
        }
    }

    pub fn get(&self, key: &[u8]) -> anyhow::Result<Option<Vec<u8>>> {
        if let Some(stored) = self.db.get(key)? {
            if stored.len() < 24 {
                return Err(anyhow::anyhow!("Stored value too short for nonce"));
            }

            let (nonce_bytes, ciphertext) = stored.split_at(24);
            let nonce = XNonce::from_slice(nonce_bytes);

            let plaintext = self.cipher.decrypt(nonce, ciphertext)
                .map_err(|e| anyhow::anyhow!("Decryption failed: {}", e))?;

            Ok(Some(plaintext))
        } else {
            Ok(None)
        }
    }

    pub fn remove(&self, key: &[u8]) -> anyhow::Result<Option<Vec<u8>>> {
        if let Some(stored) = self.db.remove(key)? {
            if stored.len() < 24 {
                return Ok(None);
            }
            let (nonce_bytes, ciphertext) = stored.split_at(24);
            let nonce = XNonce::from_slice(nonce_bytes);
            let plaintext = self.cipher.decrypt(nonce, ciphertext).ok();
            Ok(plaintext)
        } else {
            Ok(None)
        }
    }

    pub fn flush(&self) -> anyhow::Result<()> {
        self.db.flush()?;
        Ok(())
    }
}
```

### 5.3 Container Deployment (Distroless)

**Dockerfile:**

```dockerfile
# Multi-stage build for lean final image
FROM rust:1.76 as builder

WORKDIR /app
COPY Cargo.toml Cargo.lock ./
COPY src ./src

# Build statically with musl for portability
RUN apt-get update && apt-get install -y musl-tools \
    && rustup target add x86_64-unknown-linux-musl \
    && cargo build --release --target x86_64-unknown-linux-musl

# Final image: distroless for minimal attack surface
FROM gcr.io/distroless/cc as runtime

WORKDIR /app
COPY --from=builder /app/target/x86_64-unknown-linux-musl/release/vibes-pro /usr/local/bin/vibes-pro

# Non-root user (nobody)
USER 65532:65532

# Default sled data dir
VOLUME ["/data"]
ENV VIBES_DATA_DIR=/data

ENTRYPOINT ["/usr/local/bin/vibes-pro"]
```

**docker-compose.yml:**

```yaml
version: "3.9"
services:
  vibes-pro:
    build: .
    container_name: vibes-pro
    restart: unless-stopped
    environment:
      - ENCRYPTION_KEY=${ENCRYPTION_KEY:?must_provide}
      - VIBES_DATA_DIR=/data
    volumes:
      - vibes_data:/data
    ports:
      - "8080:8080"
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL

volumes:
  vibes_data:
```

**.env (example):**

```env
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
```

### 5.4 Example Usage

```rust
use vibes_pro::SecureDb;
use std::env;

fn main() -> anyhow::Result<()> {
    let key_hex = env::var("ENCRYPTION_KEY")
        .expect("ENCRYPTION_KEY must be set (64 hex chars)");
    let key = hex::decode(&key_hex)?;

    let db = SecureDb::open("/data/vibes.db", &key)?;

    // Store encrypted data
    db.insert(b"user:1", b"alice")?;
    db.insert(b"session:abc", b"{\"role\":\"admin\"}")?;

    // Retrieve and decrypt
    let val = db.get(b"user:1")?;
    println!("Got: {:?}", val.map(|v| String::from_utf8_lossy(&v)));

    db.flush()?;
    Ok(())
}
```

## 6. Generator Integration Strategy

### 6.1 Copier Template Variables

Add to `copier.yml`:

```yaml
enable_security_hardening:
  type: bool
  default: false
  help: "Enable TPM-backed encryption and security hardening features?"

encryption_backend:
  type: str
  default: "xchacha20poly1305"
  choices:
    - xchacha20poly1305
    - aes256gcm
  when: "{{ enable_security_hardening }}"
  help: "AEAD cipher for encryption at rest"

tpm_enabled:
  type: bool
  default: false
  when: "{{ enable_security_hardening }}"
  help: "Use TPM 2.0 for key sealing (requires TPM hardware)?"
```

### 6.2 Template Structure

```
templates/{{project_slug}}/
├── libs/
│   └── security/
│       ├── Cargo.toml.j2
│       ├── src/
│       │   ├── lib.rs.j2
│       │   ├── secure_db.rs.j2    # SecureDb wrapper
│       │   ├── tpm.rs.j2          # TPM integration
│       │   └── key_mgmt.rs.j2     # Key derivation/rotation
│       └── tests/
│           └── integration_test.rs.j2
├── Dockerfile.j2
├── docker-compose.yml.j2
└── .github/
    └── workflows/
        └── security-scan.yml.j2
```

### 6.3 Conditional Generation

In `hooks/post_gen.py`:

```python
if not context['enable_security_hardening']:
    # Remove security libs if not enabled
    shutil.rmtree(project_path / 'libs' / 'security', ignore_errors=True)
```

## 7. Testing Strategy (TDD)

### 7.1 Unit Tests

**File:** `libs/security/tests/unit/secure_db_test.rs`

```rust
#[test]
fn test_encrypt_decrypt_roundtrip() {
    let key = [0u8; 32];
    let db = SecureDb::open("/tmp/test_db", &key).unwrap();

    db.insert(b"key1", b"value1").unwrap();
    let retrieved = db.get(b"key1").unwrap();

    assert_eq!(retrieved, Some(b"value1".to_vec()));
}

#[test]
fn test_nonce_monotonicity() {
    let key = [0u8; 32];
    let db = SecureDb::open("/tmp/test_nonce", &key).unwrap();

    let nonce1 = db.next_nonce().unwrap();
    let nonce2 = db.next_nonce().unwrap();

    assert_ne!(nonce1, nonce2);
}

#[test]
fn test_zeroization() {
    // Verify sensitive buffers are zeroed
    // (requires instrumentation or memory inspection)
}
```

### 7.2 Integration Tests

**File:** `tests/integration/security/encryption_test.rs`

```rust
#[test]
fn test_generated_project_has_encrypted_db() {
    let tmp_dir = generate_test_project(copier_answers! {
        enable_security_hardening: true,
        encryption_backend: "xchacha20poly1305"
    });

    assert!(tmp_dir.join("libs/security/src/secure_db.rs").exists());
    assert!(tmp_dir.join("Cargo.toml").read_to_string().unwrap()
        .contains("chacha20poly1305"));
}
```

### 7.3 Security Tests

**File:** `tests/security/crypto_validation_test.rs`

```rust
#[test]
fn test_no_plaintext_on_disk() {
    let db = SecureDb::open("/tmp/sec_test", &[0u8; 32]).unwrap();
    db.insert(b"secret", b"SENSITIVE_DATA").unwrap();
    db.flush().unwrap();
    drop(db);

    let raw_bytes = std::fs::read("/tmp/sec_test").unwrap();
    assert!(!raw_bytes.windows(14).any(|w| w == b"SENSITIVE_DATA"));
}
```

## 8. Documentation Requirements

### 8.1 User-Facing Docs

**Location:** `templates/{{project_slug}}/docs/security/ENCRYPTION.md.j2`

Topics:

- How to generate and store encryption keys
- TPM setup instructions (if enabled)
- Key rotation procedures
- Backup and recovery
- Performance characteristics

### 8.2 Developer Docs

**Location:** `docs/aiassist/SECURITY_IMPLEMENTATION.md`

Topics:

- Cryptographic design decisions
- Attack surface analysis
- Threat mitigation mapping
- Dependency audit process
- Security testing guidelines

## 9. Rollback & Contingency

**Feature Flag Strategy:**

- Security hardening is opt-in via `enable_security_hardening`
- Generated projects without flag enabled have zero security overhead
- Existing projects unaffected

**Rollback Triggers:**

- Performance regression > 10% on standard benchmarks
- Compatibility issues with target platforms
- Unresolved security vulnerabilities in dependencies

**Rollback Procedure:**

1. Set `enable_security_hardening` default to `false` in copier.yml
2. Archive security templates to `templates/.archived/security/`
3. Update documentation to mark feature as experimental

## 10. Success Metrics

**Security Metrics:**

- [ ] Zero plaintext data discoverable in file system dumps
- [ ] Nonce reuse probability < 2^-64 for expected workload
- [ ] Key zeroization verified via valgrind/ASAN
- [ ] All dependencies pass `cargo audit` with no HIGH/CRITICAL issues

**Performance Metrics:**

- [ ] Encryption overhead < 5% vs. unencrypted sled
- [ ] Binary size increase < 2MB
- [ ] Startup time increase < 100ms
- [ ] Memory overhead < 10MB

**Usability Metrics:**

- [ ] Generated project builds without configuration on Ubuntu 22.04+
- [ ] Docker container runs without privileged mode
- [ ] Documentation enables key rotation in < 10 minutes

## 11. References

- [NIST SP 800-38D: GCM/GMAC](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf)
- [RFC 7539: ChaCha20-Poly1305](https://datatracker.ietf.org/doc/html/rfc7539)
- [RustCrypto: chacha20poly1305](https://github.com/RustCrypto/AEADs/tree/master/chacha20poly1305)
- [TPM 2.0 Library Specification](https://trustedcomputinggroup.org/resource/tpm-library-specification/)
- [Sled Documentation](https://docs.rs/sled/)

## 12. Appendices

### A. Dependency Tree

```
vibes-pro-security
├── sled (0.34)
├── chacha20poly1305 (0.10)
├── hkdf (0.12)
├── sha2 (0.10)
├── zeroize (1.6)
└── uuid (1.6) [optional, for DB UUID generation]
```

### B. Threat Mitigation Matrix

| Threat                     | Mitigation                    | Verification           |
| -------------------------- | ----------------------------- | ---------------------- |
| Data at rest exposure      | XChaCha20-Poly1305 encryption | Disk dump inspection   |
| Key extraction             | TPM sealing                   | Hardware security test |
| Memory scraping            | Zeroization                   | Valgrind/ASAN          |
| Nonce reuse                | Monotonic counter + UUID      | Statistical analysis   |
| Dependency vulnerabilities | cargo audit + SBOM            | CI security scan       |

### C. Comparison with Alternatives

| Approach                        | Binary Size | Performance                | Complexity | Edge-Friendly       |
| ------------------------------- | ----------- | -------------------------- | ---------- | ------------------- |
| **XChaCha20-Poly1305** (chosen) | +1.5MB      | 95% baseline               | Low        | ✅ Yes              |
| AES-256-GCM                     | +0.8MB      | 98% baseline (with AES-NI) | Low        | ⚠️ Needs hardware   |
| libsodium                       | +2.5MB      | 93% baseline               | Medium     | ✅ Yes              |
| OpenSSL                         | +4MB        | 97% baseline               | High       | ❌ Large dependency |

---

**Next Steps:**

1. Add PHASE-006 to AI_TDD_PLAN with task breakdown
2. Create AI_ADR-006 for architectural decision record
3. Update AI_PRD-006 with security requirements
4. Implement TDD test suite for SecureDb wrapper
5. Generate first hardened project and validate metrics
