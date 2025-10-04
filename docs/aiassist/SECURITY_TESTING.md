# Security Testing Procedures

**Status:** PRODUCTION
**Version:** 1.0.0
**Last Updated:** 2025-10-03
**Traceability:** AI_ADR-006, AI_PRD-006, AI_SDS-005, TASK-015

## Overview

This document describes the security testing and validation procedures for VibesPro-generated applications with security hardening enabled.

## Test Categories

### 1. Rust Unit Tests (`tests/security/validation_suite.rs`)

**Purpose:** Validate core security properties of the encrypted database implementation.

**Test Cases:**

1. **Cargo Audit (`test_cargo_audit_passes`)**
   - Verifies no HIGH/CRITICAL security vulnerabilities in dependencies
   - Runs automatically in CI on every commit
   - Command: `cargo audit`

2. **Performance Overhead (`test_performance_overhead`)**
   - Measures encryption/decryption performance impact
   - Current overhead: ~200% (acceptable for security-critical applications)
   - Future optimization target: < 10%
   - Command: `just security-benchmark`

3. **Plaintext Detection (`test_no_plaintext_in_encrypted_db`)**
   - Ensures no plaintext data is discoverable in database files
   - Critical security property
   - Must pass for all releases

4. **Startup Time (`test_startup_time_overhead`)**
   - Ensures database initialization is fast (< 100ms)
   - Current performance: ~4ms
   - Validates edge-device suitability

5. **Binary Size (`test_binary_size_increase`)**
   - Tracks size increase from security features
   - Target: < 2.5MB increase
   - Ensures viability for resource-constrained environments

**Running Tests:**

```bash
# Run all validation tests
cargo test --test validation_suite --release

# Run specific test
cargo test --test validation_suite test_plaintext_detection --release -- --nocapture

# Run with performance metrics
cargo test --test validation_suite --release -- --nocapture --test-threads=1
```

### 2. Integration Tests (`tests/integration/security/template_generation.test.ts`)

**Purpose:** Validate that generated projects include correct security configurations.

**Test Cases:**

1. **SecureDb Inclusion**
   - Verifies `libs/security/src/secure_db.rs` exists when `enable_security_hardening=true`
   - Checks `Cargo.toml` contains required cryptographic dependencies

2. **Security Exclusion**
   - Verifies `libs/security/` is absent when `enable_security_hardening=false`
   - Ensures zero overhead for non-hardened projects

3. **Distroless Dockerfile**
   - Validates use of `gcr.io/distroless/cc` base image
   - Confirms non-root user (UID 65532)

4. **Docker Compose Security Options**
   - Checks for `no-new-privileges:true`
   - Validates capability dropping (`cap_drop: ALL`)

5. **Documentation Generation**
   - Ensures `docs/security/ENCRYPTION.md` is created
   - Validates content includes XChaCha20-Poly1305 details and key rotation instructions

**Running Tests:**

```bash
# Run security integration tests
pnpm test tests/integration/security/template_generation.test.ts

# Run all integration tests
pnpm test tests/integration/
```

## Continuous Integration (CI)

### GitHub Actions Workflows

**Workflow:** `.github/workflows/security-scan.yml`

**Jobs:**

1. **cargo-audit**
   - Runs weekly and on every PR
   - Fails on HIGH/CRITICAL vulnerabilities
   - Updates advisory database automatically

2. **performance-benchmark**
   - Tracks encryption overhead over time
   - Reports metrics as artifacts
   - Fails if overhead > 300% (current threshold)

3. **binary-size-tracking**
   - Monitors size impact of security features
   - Uploads size reports as artifacts
   - Fails if increase > 2.5MB

4. **security-validation**
   - Runs full validation suite
   - Includes both Rust and TypeScript tests
   - Must pass for merge to main

5. **plaintext-detection**
   - Specialized test for data-at-rest encryption
   - Scans test outputs for leaked secrets
   - Critical security gate

**Triggering CI:**

```bash
# CI runs automatically on:
- git push origin main
- git push origin develop
- Pull request creation/update

# Manual trigger:
gh workflow run security-scan.yml
```

## Local Validation Checklist

Before committing changes that affect security:

```bash
# 1. Run security audit
just security-audit

# 2. Run performance benchmarks
just security-benchmark

# 3. Check binary size
just security-size-check

# 4. Run validation suite
just security-validate

# 5. Run integration tests
pnpm test tests/integration/security/

# 6. Generate test project and verify
copier copy . /tmp/security-test --data enable_security_hardening=true --defaults
cd /tmp/security-test
cargo test
cargo build --release
```

## Performance Optimization

### Current Metrics (GREEN Phase)

- **Encryption overhead:** ~200%
- **Startup time:** ~4ms
- **Binary size increase:** ~1.5MB (estimated)

### Optimization Targets (REFACTOR Phase)

- **Encryption overhead:** < 10%
- **Startup time:** < 100ms
- **Binary size increase:** < 2MB

### Optimization Strategies

1. **Batch Operations**
   - Buffer multiple operations before flushing
   - Reduce per-operation overhead

2. **Lazy Key Derivation**
   - Cache derived keys for session
   - Reduce HKDF calls

3. **Parallel Encryption**
   - Use Rayon for parallel batch encryption
   - Leverage multi-core processors

4. **Memory Pooling**
   - Reuse buffers to reduce allocations
   - Minimize GC pressure

## Security Metrics Dashboard

### Key Performance Indicators (KPIs)

- ✅ **Zero plaintext leaks:** 100% of tests passing
- ✅ **No HIGH/CRITICAL CVEs:** cargo audit clean
- ⚠️ **Performance overhead:** 200% (target: <10%)
- ✅ **Startup time:** 4ms (target: <100ms)
- ✅ **Binary size:** ~1.5MB (target: <2.5MB)

### Regression Detection

CI fails automatically if:
- New HIGH/CRITICAL vulnerabilities detected
- Performance overhead > 300%
- Binary size increase > 2.5MB
- Plaintext detected in encrypted database
- Startup time > 100ms

## Troubleshooting

### Common Issues

**Issue:** `cargo audit` warnings about unmaintained dependencies

**Solution:** These warnings are expected due to `sled` being unmaintained. The test checks for actual vulnerabilities, not maintenance status.

---

**Issue:** High performance overhead in tests

**Solution:** Run with `--release` flag. Debug builds have significantly higher overhead.

```bash
cargo test --test validation_suite --release
```

---

**Issue:** Binary size test fails to find binaries

**Solution:** Build binaries before running size test:

```bash
cargo build --release --features security
cargo build --release --no-default-features
just security-size-check
```

---

**Issue:** Integration tests timeout

**Solution:** Increase Jest timeout and run tests serially:

```bash
pnpm test tests/integration/security/ --runInBand --testTimeout=60000
```

## Appendix A: Test Coverage Matrix

| Security Property | Rust Test | Integration Test | CI Job |
|------------------|-----------|------------------|---------|
| No plaintext at rest | ✅ | - | ✅ |
| No CVEs | ✅ | - | ✅ |
| Performance acceptable | ✅ | - | ✅ |
| Size acceptable | ✅ | - | ✅ |
| Fast startup | ✅ | - | - |
| Correct generation | - | ✅ | ✅ |
| Docker security | - | ✅ | ✅ |
| Documentation | - | ✅ | ✅ |

## Appendix B: References

- [NIST SP 800-38D: GCM/GMAC](https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf)
- [RFC 7539: ChaCha20-Poly1305](https://datatracker.ietf.org/doc/html/rfc7539)
- [RustCrypto: chacha20poly1305](https://github.com/RustCrypto/AEADs/tree/master/chacha20poly1305)
- [cargo-audit Documentation](https://github.com/rustsec/rustsec/tree/main/cargo-audit)
- [GitHub Actions Security Best Practices](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)

---

**Maintainer Notes:**

- Update this document when adding new security tests
- Document known performance regressions
- Track optimization progress in REFACTOR phase
- Link to ADR-006 for architectural decisions
