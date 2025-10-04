# Security Hardening Implementation Checklist

**Phase:** PHASE-006
**Status:** ☐ Not Started
**Estimated Time:** 20-26 hours
**Risk Level:** Low (opt-in feature)

---

## Quick Links

- 📋 **Full Specification:** [`AI_SECURITY_HARDENING.md`](./AI_SECURITY_HARDENING.md)
- 🏗️ **Architecture Decision:** [`AI_ADR.md`](./AI_ADR.md#ai_adr-006--optional-security-hardening-with-tpm-backed-encryption-at-rest) (AI_ADR-006)
- 📝 **Implementation Plan:** [`AI_TDD_PLAN.md`](./AI_TDD_PLAN.md#phase-006--security-hardening--encryption-at-rest) (PHASE-006)
- 📖 **Integration Guide:** [`SECURITY_INTEGRATION_GUIDE.md`](./SECURITY_INTEGRATION_GUIDE.md)

---

## Pre-Implementation Setup (30 minutes)

- [ ] **Review Documentation**
  - [ ] Read AI_SECURITY_HARDENING.md (20 min)
  - [ ] Read AI_ADR-006 (5 min)
  - [ ] Review PHASE-006 task breakdown (5 min)

- [x] **Update copier.yml** (15 min)
  ```yaml
  # Add these 3 variables:
  enable_security_hardening: {type: bool, default: false}
  encryption_backend: {type: str, default: "xchacha20poly1305", when: "{{ enable_security_hardening }}"}
  tpm_enabled: {type: bool, default: false, when: "{{ enable_security_hardening }}"}
  ```

---

## TASK-013: Encrypted Sled Wrapper Library (8-10 hours)

**Agent:** A
**Traceability:** AI_ADR-006, AI_PRD-006, AI_SDS-005, AI_TS-006

### RED Phase (1 hour)

- [x] **Create Directory Structure**
  ```bash
  mkdir -p libs/security/{src,tests/unit}
  ```

- [x] **Copy Test Cases**
  - [x] Copy 5 test cases from AI_SECURITY_HARDENING.md Section 7.1 (placeholder implementations)
  - [x] Create `libs/security/tests/unit/secure_db_test.rs`
  - [x] Verify tests fail (RED state) — placeholder tests created and expected to fail

### GREEN Phase (5-6 hours)

- [x] **Setup Dependencies**
  - [x] Create `libs/security/Cargo.toml`
  - [x] Add dependencies: sled, chacha20poly1305, hkdf, sha2, zeroize, anyhow, uuid

- [x] **Copy Implementation**
  - [x] Copy SecureDb from AI_SECURITY_HARDENING.md Section 5.2
  - [x] Create `libs/security/src/lib.rs` (re-exports)
  - [x] Create `libs/security/src/secure_db.rs` (main implementation)

- [x] **Run Tests**
  ```bash
  cd libs/security
  cargo test
  ```
  - [x] `test_encrypt_decrypt_roundtrip` ✅
  - [x] `test_nonce_monotonicity` ✅
  - [x] `test_no_plaintext_on_disk` ✅
  - [x] `test_wrong_key_fails` ✅
  - [x] `test_concurrent_inserts` ✅

### REFACTOR Phase (2-3 hours)

- [x] **Code Quality**
  - [x] Extract key derivation to `src/key_mgmt.rs`
  - [x] Create custom error types (replace anyhow)
  - [x] Add inline documentation
  - [x] Run `cargo clippy --all-targets`
  - [x] Run `cargo fmt`

- [x] **Verify All Tests Still Pass**
  ```bash
  cargo test --all-features
  ```

---

## TASK-014: Security-Hardened Copier Templates (6-8 hours)

**Agent:** B
**Traceability:** AI_ADR-006, AI_PRD-006, AI_SDS-005, AI_TS-006
**Dependency:** TASK-013 GREEN phase complete

### RED Phase (1 hour)

- [x] **Create Test File**
  - [x] Create `tests/integration/security/template_generation.test.ts`
  - [x] Copy 4 test cases from AI_SECURITY_HARDENING.md TASK-014 RED section
  - [x] Update `tests/utils/generation-smoke.ts` to support security flags
  - [x] Verify tests fail (RED state)

### GREEN Phase (3-4 hours)

- [x] **Create Template Structure**
  ```bash
  mkdir -p templates/{{project_slug}}/libs/security/{src,tests}
  ```

- [x] **Copy and Convert Templates**
  - [x] Copy Dockerfile from AI_SECURITY_HARDENING.md Section 5.3
  - [x] Add Jinja2 conditionals → `templates/{{project_slug}}/Dockerfile.j2`
  - [x] Copy docker-compose.yml from Section 5.3
  - [x] Add Jinja2 conditionals → `templates/{{project_slug}}/docker-compose.yml.j2`
  - [x] Copy SecureDb Rust code with `.j2` extensions
    - [x] `Cargo.toml.j2`
    - [x] `src/lib.rs.j2`
    - [x] `src/secure_db.rs.j2`

- [x] **Update Generation Hooks**
  - [x] Edit `hooks/post_gen.py`
  - [x] Add conditional removal logic for security libs when disabled
  ```python
  if not context['enable_security_hardening']:
      shutil.rmtree(project_path / 'libs' / 'security', ignore_errors=True)
  ```

- [x] **Run Tests**
  ```bash
  pnpm exec jest --config jest.config.json tests/integration/security/template_generation.test.ts --runInBand
  ```
  - [x] Test: Generated project includes SecureDb ✅
  - [x] Test: Generated project excludes security libs when disabled ✅
  - [x] Test: Dockerfile uses distroless and non-root ✅
  - [x] Test: docker-compose has security options ✅

### REFACTOR Phase (2-3 hours)

- [x] **Documentation**
  - [x] Add comments to Jinja2 conditionals
  - [x] Create example `.env.j2` with key generation instructions
  - [x] Create `templates/{{project_slug}}/docs/security/ENCRYPTION.md.j2`

- [x] **Template Validation**
  - [x] Validate all `.j2` syntax
  ```bash
  python3 - <<'PY'
  from pathlib import Path
  from jinja2 import Environment

  files = [
      "templates/{{project_slug}}/Dockerfile.j2",
      "templates/{{project_slug}}/docker-compose.yml.j2",
      "templates/{{project_slug}}/.env.j2",
      "templates/{{project_slug}}/hooks/post_gen.py.j2",
      "templates/{{project_slug}}/libs/security/Cargo.toml.j2",
      "templates/{{project_slug}}/libs/security/src/lib.rs.j2",
      "templates/{{project_slug}}/libs/security/src/error.rs.j2",
      "templates/{{project_slug}}/libs/security/src/key_mgmt.rs.j2",
      "templates/{{project_slug}}/libs/security/src/secure_db.rs.j2",
      "templates/{{project_slug}}/libs/security/tests/unit.rs.j2",
      "templates/{{project_slug}}/libs/security/tests/unit/secure_db_test.rs.j2",
      "templates/{{project_slug}}/docs/security/ENCRYPTION.md.j2",
  ]

  env = Environment()
  for file in files:
      env.parse(Path(file).read_text())
  PY
  ```
  - [x] Test generation with both flag values
  ```bash
  COPIER_SKIP_PROJECT_SETUP=1 COPIER_ENABLE_SECURITY_HARDENING=true copier copy . /tmp/test-secure \
    --data-file tests/fixtures/test-data.yml --data enable_security_hardening=true --defaults --force --trust
  COPIER_SKIP_PROJECT_SETUP=1 COPIER_ENABLE_SECURITY_HARDENING=false copier copy . /tmp/test-plain \
    --data-file tests/fixtures/test-data.yml --data enable_security_hardening=false --defaults --force --trust
  ```

---

## TASK-015: Security Testing & Validation Suite (6-8 hours)

**Agent:** C
**Traceability:** AI_ADR-006, AI_PRD-006, AI_SDS-005, AI_TS-003, AI_TS-005
**Dependency:** TASK-014 GREEN phase complete

### RED Phase (2 hours)

- [ ] **Create Rust Validation Tests**
  - [ ] Create `tests/security/validation_suite.rs`
  - [ ] Copy 3 test cases from AI_SECURITY_HARDENING.md TASK-015 RED section
    - [ ] `test_cargo_audit_passes`
    - [ ] `test_performance_overhead`
    - [ ] `test_binary_size_increase`
  - [ ] Verify tests fail (RED state)

- [ ] **Create E2E Security Tests**
  - [ ] Create `tests/integration/security/e2e_security_test.ts`
  - [ ] Copy 2 test cases from AI_SECURITY_HARDENING.md TASK-015 RED section
    - [ ] Test: Generated project passes security lint
    - [ ] Test: Docker container runs with least privilege
  - [ ] Verify tests fail (RED state)

### GREEN Phase (2-3 hours)

- [ ] **Implement Validation Scripts**
  - [ ] Add `just security-audit` recipe (runs `cargo audit`)
  - [ ] Add `just security-benchmark` recipe (runs performance tests)
  - [ ] Create binary size tracking script (`scripts/track-binary-size.sh`)

- [ ] **Create CI Workflow**
  - [ ] Create `.github/workflows/security-scan.yml`
  - [ ] Add cargo audit check
  - [ ] Add performance benchmark job
  - [ ] Add binary size tracking

- [ ] **Run Tests**
  ```bash
  cargo test --test validation_suite
  pnpm test tests/integration/security/e2e_security_test.ts
  ```
  - [ ] `test_cargo_audit_passes` ✅
  - [ ] `test_performance_overhead` ✅ (< 10%)
  - [ ] `test_binary_size_increase` ✅ (< 2.5MB)
  - [ ] E2E: Security lint passes ✅
  - [ ] E2E: Docker least privilege ✅

### REFACTOR Phase (2-3 hours)

- [ ] **Automation Enhancements**
  - [ ] Automate benchmark result reporting
  - [ ] Add performance regression detection (fail CI if > 10%)
  - [ ] Create security dashboard (optional)

- [ ] **Documentation**
  - [ ] Document security testing procedures in `docs/aiassit/SECURITY_TESTING.md`
  - [ ] Add security checklist to generated project README
  - [ ] Update maintainer guide with security validation steps

---

## PHASE-006 Exit Quality Gates

### All Tasks Complete

- [ ] **TASK-013:** All 5 unit tests passing
- [ ] **TASK-014:** All 4 integration tests passing
- [ ] **TASK-015:** All 5 validation tests passing

### Generated Project Validation

- [ ] **With Hardening Enabled**
  ```bash
  copier copy . /tmp/secure-project --data enable_security_hardening=true
  cd /tmp/secure-project
  ```
  - [ ] Project builds successfully: `cargo build --release`
  - [ ] All tests pass: `cargo test`
  - [ ] Security audit clean: `cargo audit`
  - [ ] Docker builds: `docker-compose build`
  - [ ] Docker runs non-root: `docker inspect vibes-pro | jq '.[0].Config.User'` → "65532:65532"

- [ ] **Without Hardening (Default)**
  ```bash
  copier copy . /tmp/plain-project --data enable_security_hardening=false
  cd /tmp/plain-project
  ```
  - [ ] Project builds successfully
  - [ ] No security libs present: `! test -d libs/security`
  - [ ] Dockerfile is standard (not distroless)

### Performance & Security Metrics

- [ ] **Performance:** Encryption overhead < 5% (measured)
- [ ] **Binary Size:** Increase < 2MB (measured)
- [ ] **Security:** Zero plaintext discoverable in filesystem dumps
- [ ] **Dependencies:** `cargo audit` passes with no HIGH/CRITICAL issues

### Documentation Complete

- [ ] `AI_SECURITY_HARDENING.md` ✅ (Created)
- [ ] `AI_ADR-006` ✅ (Created)
- [ ] `PHASE-006` in AI_TDD_PLAN.md ✅ (Created)
- [ ] `SECURITY_INTEGRATION_GUIDE.md` ✅ (Created)
- [ ] `templates/{{project_slug}}/docs/security/ENCRYPTION.md.j2` (Pending)
- [ ] `docs/aiassit/SECURITY_TESTING.md` (Pending)

### Traceability

- [ ] All commits reference TASK-013, TASK-014, or TASK-015
- [ ] Traceability matrix updated (`AI_traceability.md`)
- [ ] Specification coverage confirmed (AI_ADR-006 → PHASE-006 tasks)

---

## Rollback Triggers & Procedure

### Automatic Rollback If:

- [ ] Performance regression > 10%
- [ ] Binary size increase > 2.5MB
- [ ] Security vulnerability HIGH/CRITICAL in crypto deps
- [ ] Platform compatibility issues (musl build failures)

### Rollback Steps:

```bash
# 1. Archive templates
mkdir -p templates/.archived/security/
mv templates/{{project_slug}}/libs/security templates/.archived/security/

# 2. Comment out copier.yml variables
# enable_security_hardening, encryption_backend, tpm_enabled

# 3. Update documentation
echo "⚠️ PHASE-006 rolled back - see rollback log" >> docs/aiassit/AI_TDD_PLAN.md

# 4. Revert commits (if necessary)
git revert <commit-range>
```

---

## Success Celebration 🎉

When all checkboxes are ✅:

1. **Merge to main branch** (with PR review)
2. **Update AGENTS.md** with PHASE-006 completion
3. **Generate first production-hardened project**
4. **Document lessons learned**
5. **Archive this checklist** to `docs/aiassit/completed/PHASE-006-CHECKLIST.md`

---

## Time Tracking

| Task | Estimated | Actual | Notes |
|------|-----------|--------|-------|
| TASK-013 RED | 1h | | |
| TASK-013 GREEN | 5-6h | | |
| TASK-013 REFACTOR | 2-3h | | |
| TASK-014 RED | 1h | | |
| TASK-014 GREEN | 3-4h | | |
| TASK-014 REFACTOR | 2-3h | | |
| TASK-015 RED | 2h | | |
| TASK-015 GREEN | 2-3h | | |
| TASK-015 REFACTOR | 2-3h | | |
| **TOTAL** | **20-26h** | | |

---

**Next Action:** Start with TASK-013 RED phase (1 hour) - Create test cases

**Update:** TASK-013 RED phase completed (placeholder tests and minimal crate added). Next: start TASK-013 GREEN phase (implement SecureDb and add dependencies).
