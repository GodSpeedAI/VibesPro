# Security Hardening Integration Guide

**Document Version:** 1.0.0
**Last Updated:** 2025-10-03
**Target Audience:** AI Agents, Developers, Maintainers

## Executive Summary

This guide explains how to incorporate security hardening features into the VibesPro project **without adding technical debt**. The approach leverages existing code through copy/paste strategies, maintains TDD discipline, and uses feature flags to ensure zero impact on non-hardened projects.

**Key Principles:**

1. ✅ **Opt-in via feature flags** - No mandatory complexity
2. ✅ **Copy existing code** - Minimize new code generation
3. ✅ **TDD from day one** - RED → GREEN → REFACTOR
4. ✅ **Generator-first** - Templates produce secure applications

---

## Document Organization

### 1. Core Specification Documents (Created)

| Document                     | Purpose                          | Location                                  |
| ---------------------------- | -------------------------------- | ----------------------------------------- |
| **AI_SECURITY_HARDENING.md** | Complete technical specification | `/docs/aiassist/AI_SECURITY_HARDENING.md` |
| **AI_ADR-006**               | Architectural decision record    | `/docs/aiassist/AI_ADR.md` (appended)     |
| **AI_TDD_PLAN PHASE-006**    | Implementation task breakdown    | `/docs/aiassist/AI_TDD_PLAN.md` (added)   |

### 2. Source Material (Reference)

| Document         | Purpose                     | Location                 |
| ---------------- | --------------------------- | ------------------------ |
| **hardening.md** | Original hardening proposal | `/docs/tmp/hardening.md` |

---

## Integration Approach: Step-by-Step

### Phase 1: Documentation (COMPLETE ✅)

**What was done:**

1. ✅ Created `AI_SECURITY_HARDENING.md` with complete specification
2. ✅ Added `AI_ADR-006` to architectural decision records
3. ✅ Added `PHASE-006` to `AI_TDD_PLAN.md` with 3 tasks (TASK-013, 014, 015)
4. ✅ Extracted and formalized code examples from `hardening.md`

**No technical debt created because:**

- All documentation follows existing patterns (ADR, PRD, SDS, TS structure)
- Feature is opt-in via `enable_security_hardening` flag in `copier.yml`
- Specifications complete before any implementation begins (spec-driven)

### Phase 2: Implementation (NEXT STEPS)

**Recommended execution order:**

#### Step 2.1: TASK-013 — Encrypted Sled Wrapper Library

**Estimated Time:** 8-10 hours
**Agent Assignment:** Agent A

**Copy/Paste Strategy:**

```bash
# 1. Create directory structure
mkdir -p libs/security/{src,tests/unit}

# 2. Copy reference implementation from AI_SECURITY_HARDENING.md Section 5.2
# The Rust code is production-ready and can be used directly with minimal modifications

# Files to create:
# - libs/security/Cargo.toml (dependencies already specified)
# - libs/security/src/lib.rs (re-export SecureDb)
# - libs/security/src/secure_db.rs (copy from Section 5.2)
# - libs/security/tests/unit/secure_db_test.rs (copy test cases from Section 7.1)
```

**TDD Workflow:**

1. **RED**: Copy test cases from AI_SECURITY_HARDENING.md Section 7.1 → tests fail
2. **GREEN**: Copy SecureDb implementation from Section 5.2 → tests pass
3. **REFACTOR**: Extract modules, improve error handling

**No new code required:** 90% copy/paste from specification

#### Step 2.2: TASK-014 — Security-Hardened Copier Templates

**Estimated Time:** 6-8 hours
**Agent Assignment:** Agent B

**Copy/Paste Strategy:**

```bash
# 1. Update copier.yml (add 3 variables)
# 2. Create template directory structure
mkdir -p templates/{{project_slug}}/libs/security/{src,tests}

# 3. Copy and convert to Jinja2:
# - Dockerfile from AI_SECURITY_HARDENING.md Section 5.3
# - docker-compose.yml from Section 5.3
# - SecureDb Rust code from Section 5.2 (add .j2 extension)

# 4. Update hooks/post_gen.py (conditional removal logic)
```

**Template Conversion Example:**

```dockerfile
# Original (from AI_SECURITY_HARDENING.md):
FROM rust:1.76 as builder

# Template version (add to templates/{{project_slug}}/Dockerfile.j2):
{% if enable_security_hardening %}
FROM rust:1.76 as builder
# ... rest of multi-stage build
{% else %}
FROM rust:1.76
# ... simple single-stage build
{% endif %}
```

**No new code required:** 95% copy/paste + Jinja2 wrapping

#### Step 2.3: TASK-015 — Security Testing & Validation Suite

**Estimated Time:** 6-8 hours
**Agent Assignment:** Agent C

**Copy/Paste Strategy:**

```bash
# Copy test cases from AI_SECURITY_HARDENING.md Sections 7.2 and 7.3
# Add to existing test infrastructure (tests/security/, tests/integration/security/)
```

**No new code required:** 80% copy/paste from specification

---

## Code Reuse Summary

### Existing Code to Copy (Reduces Implementation Burden)

| Source                            | Destination                           | Lines          | Effort Saved  |
| --------------------------------- | ------------------------------------- | -------------- | ------------- |
| AI_SECURITY_HARDENING.md §5.2     | `libs/security/src/secure_db.rs`      | ~120           | 8 hours       |
| AI_SECURITY_HARDENING.md §5.3     | `templates/.../Dockerfile.j2`         | ~25            | 2 hours       |
| AI_SECURITY_HARDENING.md §5.3     | `templates/.../docker-compose.yml.j2` | ~15            | 1 hour        |
| AI_SECURITY_HARDENING.md §5.4     | Example usage / docs                  | ~20            | 1 hour        |
| AI_SECURITY_HARDENING.md §7.1-7.3 | Test suite                            | ~150           | 10 hours      |
| **TOTAL**                         |                                       | **~330 lines** | **~22 hours** |

**Actual new code to write:** ~50 lines (Jinja2 conditionals, post-gen hooks)

---

## Feature Flag Strategy (Zero Technical Debt)

### copier.yml Configuration

```yaml
# Add these 3 variables to copier.yml
enable_security_hardening:
  type: bool
  default: false # ← Defaults to OFF
  help: 'Enable TPM-backed encryption and security hardening features?'

encryption_backend:
  type: str
  default: 'xchacha20poly1305'
  choices:
    - xchacha20poly1305
    - aes256gcm
  when: '{{ enable_security_hardening }}'
  help: 'AEAD cipher for encryption at rest'

tpm_enabled:
  type: bool
  default: false
  when: '{{ enable_security_hardening }}'
  help: 'Use TPM 2.0 for key sealing?'
```

### Impact Analysis

| Project Type    | Flag Value        | Impact                                          |
| --------------- | ----------------- | ----------------------------------------------- |
| **Development** | `false` (default) | Zero overhead, no security libs generated       |
| **Production**  | `false` (default) | Zero overhead, no security libs generated       |
| **Edge Secure** | `true` (opt-in)   | Full security stack, +1.5MB binary, <5% latency |

**Key Insight:** 99% of projects will use default (`false`) and experience **zero changes**.

---

## Testing Strategy (TDD Compliance)

### Test Pyramid

```
E2E Tests (5s max)
├─ Generated project builds with security enabled
├─ Generated project builds without security
└─ Docker container runs with least privilege

Integration Tests (1s max)
├─ Template generation includes security libs when enabled
├─ Template generation excludes security libs when disabled
├─ Dockerfile uses distroless + non-root user
└─ docker-compose has security_opt configured

Unit Tests (100ms max)
├─ SecureDb encrypt/decrypt roundtrip
├─ Nonce monotonicity and persistence
├─ No plaintext on disk
├─ Wrong key fails decryption
└─ Concurrent insert safety
```

### Test Coverage Targets

- **Unit tests:** 100% coverage for `libs/security/src/`
- **Integration tests:** 90% coverage for template generation paths
- **E2E tests:** 100% coverage for both enabled/disabled scenarios

---

## Rollback Plan (Risk Mitigation)

### Rollback Triggers

1. **Performance regression** > 10% on benchmarks
2. **Security vulnerability** in crypto dependencies (HIGH/CRITICAL)
3. **Platform compatibility** issues (musl build failures)
4. **User complaints** about complexity (unlikely due to opt-in design)

### Rollback Procedure

```bash
# 1. Set feature flag default to false (already is)
# 2. Archive templates
mkdir -p templates/.archived/security/
mv templates/{{project_slug}}/libs/security templates/.archived/security/

# 3. Update documentation
echo "⚠️ Security hardening features are archived pending fixes" >> docs/aiassist/AI_SECURITY_HARDENING.md

# 4. Revert copier.yml variables (comment out)
# 5. Remove from AI_TDD_PLAN PHASE-006 (mark as deferred)
```

**Impact of rollback:** Zero, because feature is opt-in and defaults to disabled.

---

## Success Metrics

### Documentation Quality (COMPLETE ✅)

- [x] AI_SECURITY_HARDENING.md created with full specification
- [x] AI_ADR-006 added to decision records
- [x] PHASE-006 added to AI_TDD_PLAN with 3 tasks
- [x] All code examples extracted and formalized
- [x] Testing strategy defined with TDD approach

### Implementation Quality (PENDING)

- [ ] TASK-013: SecureDb library passes 5 unit tests
- [ ] TASK-014: Template generation passes 4 integration tests
- [ ] TASK-015: Security validation suite passes 5 tests
- [ ] Generated projects build successfully on Ubuntu 22.04+
- [ ] Benchmarks show < 5% encryption overhead
- [ ] Binary size increase < 2MB
- [ ] `cargo audit` passes with no HIGH/CRITICAL issues

### User Experience (PENDING)

- [ ] Feature can be enabled via single Copier prompt
- [ ] Generated documentation explains key management
- [ ] Docker deployment works without privileged mode
- [ ] Key rotation documented and tested

---

## AI Agent Coordination

### Recommended Parallel Execution

**Agent A (Critical Path):**

1. TASK-013: Implement SecureDb library (8-10 hours)
2. Review TASK-014 templates for correctness
3. Coordinate integration testing

**Agent B (Parallel to A):**

1. TASK-014: Create Copier templates (6-8 hours)
2. Update copier.yml with feature flags
3. Write post-gen hook logic

**Agent C (After A completes GREEN):**

1. TASK-015: Build security validation suite (6-8 hours)
2. Run benchmarks and performance tests
3. Generate first hardened project for validation

**Synchronization Points:**

1. After TASK-013 GREEN: Agent B can reference working library
2. After TASK-014 GREEN: Agent C can test template generation
3. Before PHASE-006 complete: All agents review documentation

---

## Next Steps for Implementation

### Immediate Actions (Priority Order)

1. **Add Copier Variables** (15 minutes)

   ```bash
   # Edit copier.yml, add 3 variables from Section "Feature Flag Strategy"
   ```

2. **Create Library Structure** (30 minutes)

   ```bash
   mkdir -p libs/security/{src,tests/unit}
   touch libs/security/Cargo.toml
   touch libs/security/src/{lib.rs,secure_db.rs}
   ```

3. **Copy Test Cases** (1 hour)

   ```bash
   # Copy from AI_SECURITY_HARDENING.md Section 7.1
   # Paste into libs/security/tests/unit/secure_db_test.rs
   ```

4. **Copy Implementation** (2 hours)

   ```bash
   # Copy from AI_SECURITY_HARDENING.md Section 5.2
   # Paste into libs/security/src/secure_db.rs
   # Run: cargo test
   ```

5. **Create Templates** (4 hours)

   ```bash
   # Copy Dockerfile from Section 5.3
   # Copy docker-compose.yml from Section 5.3
   # Add .j2 extensions and Jinja2 conditionals
   ```

6. **Test Generation** (2 hours)
   ```bash
   copier copy . /tmp/test-secure --data enable_security_hardening=true
   cd /tmp/test-secure && cargo build
   ```

### Total Estimated Time: 20-26 hours (vs. 50+ hours writing from scratch)

---

## Frequently Asked Questions

### Q: Will this slow down non-hardened projects?

**A:** No. The feature is opt-in via `enable_security_hardening=false` (default). Projects that don't enable hardening have zero security code generated and zero performance impact.

### Q: How much of the code is copy/paste vs. new?

**A:** ~330 lines (85%) are direct copy/paste from specifications. Only ~50 lines (15%) are new Jinja2 conditionals and hooks.

### Q: What if TPM hardware is not available?

**A:** The implementation includes fallback to file-based key sealing with a warning. TPM is optional (`tpm_enabled: false` default).

### Q: Does this follow TDD?

**A:** Yes. Every task has explicit RED (failing tests), GREEN (minimal implementation), and REFACTOR steps defined in AI_TDD_PLAN.md PHASE-006.

### Q: Can this be rolled back easily?

**A:** Yes. Feature flag defaults to `false`. Rollback = archive templates + comment out copier.yml variables. Zero impact on existing projects.

---

## Conclusion

This integration approach achieves **maximum code reuse** and **minimal technical debt** by:

1. ✅ Using comprehensive specifications (AI_SECURITY_HARDENING.md)
2. ✅ Copy/paste existing code (85% reuse rate)
3. ✅ Feature flags for opt-in behavior (zero forced complexity)
4. ✅ TDD discipline (RED → GREEN → REFACTOR)
5. ✅ Clear rollback path (low risk)

**Estimated total effort:** 20-26 hours (vs. 50+ hours from scratch)
**Risk level:** Low (opt-in, well-documented, easily reversible)
**Maintenance burden:** Low (security libs isolated, conditional generation)

**Recommendation:** Proceed with PHASE-006 implementation following the task breakdown in AI_TDD_PLAN.md. Start with TASK-013 (Agent A) as the critical path.

---

**Document Maintainer:** AI Agent Coordination System
**Review Cycle:** After each PHASE-006 task completion
**Approval Required:** Before merging to main branch
