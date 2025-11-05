# PHASE-005: Integration, Documentation & Final Validation

**Status:** Ready for Execution  
**Duration:** 4-6 hours  
**Parallelization:** All cycles can run in parallel  
**Critical Path:** No (all cycles independent)  
**Dependencies:** PHASE-004 complete  
**Owner:** Documentation Agent

---

## 🎯 Phase Objectives

Validate the complete integration end-to-end, update all documentation, complete the traceability matrix, and publish migration guides.

### Success Criteria

- [ ] End-to-end smoke tests pass across all domains
- [ ] All documentation updated and validated
- [ ] Traceability matrix complete (100% coverage)
- [ ] Migration guide published for existing projects
- [ ] Generator usage examples documented
- [ ] **Evidence**: `just spec-guard` GREEN + all smoke tests pass

### Traceability

**This phase completes ALL remaining spec requirements** (DEV-ADR-023-029, DEV-PRD-024-031, DEV-SDS-023-030)

---

## 📊 Cycles Overview

| Cycle | Owner | Duration | Deliverables |
|-------|-------|----------|-------------|
| **A** | QA Agent | 2h | End-to-end smoke tests |
| **B** | Docs Agent | 1.5h | Documentation updates |
| **C** | Docs Agent | 1h | Traceability matrix |
| **D** | Docs Agent | 1.5h | Migration guide |

**All cycles can run in parallel** (no dependencies)

---

## ⚡ Cycle A: End-to-End Smoke Tests

**Owner:** QA Agent  
**Duration:** 2 hours

### Test Scenarios

```bash
#!/bin/bash
# tests/e2e/hexddd-integration-smoke.sh

set -e

echo "=== HexDDD Integration Smoke Tests ==="

# 1. Generator Idempotency
echo "Testing generator idempotency..."
just test-generators || exit 1

# 2. Hexagonal Boundaries
echo "Testing Nx boundary enforcement..."
pnpm nx run-many -t lint --all || exit 1

# 3. Type Safety
echo "Testing TypeScript strict mode..."
pnpm tsc --noEmit || exit 1
echo "Testing Python mypy strict..."
uv run mypy --strict || exit 1

# 4. UoW/EventBus Integration
echo "Testing UoW/EventBus contracts..."
pnpm nx test shared-domain || exit 1

# 5. Universal React Generator
echo "Testing Next.js generator..."
nx g @ddd-plugin/ddd:web-app smoke-next --framework=next --no-interactive
nx build smoke-next || exit 1

echo "Testing Remix generator..."
nx g @ddd-plugin/ddd:web-app smoke-remix --framework=remix --no-interactive
nx build smoke-remix || exit 1

echo "Testing Expo generator..."
nx g @ddd-plugin/ddd:web-app smoke-expo --framework=expo --no-interactive
echo "(Expo build skipped in smoke test)"

# 6. Supabase Dev Stack
echo "Testing Supabase dev stack..."
nx run supabase-devstack:start
sleep 10
curl -f http://localhost:54323 || exit 1
nx run supabase-devstack:stop

# 7. Type Sync Workflow
echo "Testing type sync..."
nx run type-generator:generate
git diff --exit-code libs/shared/database-types || (
  echo "Type drift detected (expected if schema changed)"
)

echo "✅ All smoke tests passed!"
```

### Integration Test Suite

```typescript
// tests/integration/hexddd-integration.test.ts
import { UnitOfWork } from '@shared/domain';
import { EventBus } from '@shared/application';
import { ApiClient } from '@shared/web';

describe('HexDDD Integration', () => {
  describe('Hexagonal Architecture', () => {
    it('UoW manages transactions correctly', async () => {
      // Test transactional boundaries
    });

    it('EventBus dispatches domain events', async () => {
      // Test event-driven flows
    });
  });

  describe('Type Safety', () => {
    it('API client uses generated types', () => {
      // Validate type flow: DB → TS → API
    });

    it('Python types match TypeScript types', () => {
      // Validate type parity
    });
  });

  describe('Generators', () => {
    it('all generators produce valid projects', async () => {
      // Test generator outputs build successfully
    });
  });
});
```

---

## ⚡ Cycle B: Documentation Updates

**Owner:** Docs Agent  
**Duration:** 1.5 hours

### Documentation Checklist

- [ ] **README.md**: Add HexDDD integration overview
- [ ] **docs/ARCHITECTURE.md**: Update with UoW/EventBus patterns
- [ ] **docs/ENVIRONMENT.md**: Add Supabase dev stack section
- [ ] **docs/generators/**: Create usage guides for each generator
- [ ] **.github/copilot-instructions.md**: Add hexagonal architecture guidance
- [ ] **AGENTS.md**: Update with Nx tag enforcement rules

### Key Documentation Sections

```markdown
<!-- README.md addition -->
## Hexagonal Architecture

This project uses hexagonal (ports & adapters) architecture:

- **Domain Layer**: Pure business logic (`libs/*/domain`)
- **Application Layer**: Use cases (`libs/*/application`)
- **Infrastructure Layer**: Adapters (`libs/*/infrastructure`)

All generators enforce these boundaries automatically.

### Quick Start

```bash
# Generate a new domain
nx g @ddd-plugin/ddd:hex-domain user-management

# Generate a React app
nx g @ddd-plugin/ddd:web-app admin-portal --framework=next

# Start Supabase dev stack
nx run supabase-devstack:start
```
```

---

## ⚡ Cycle C: Traceability Matrix Completion

**Owner:** Docs Agent  
**Duration:** 1 hour

### Matrix Update

```markdown
<!-- docs/traceability_matrix.md -->

## HexDDD Integration Traceability

| Spec ID | Type | Requirement | Implementation | Validation | Status |
|---------|------|-------------|----------------|------------|--------|
| DEV-ADR-023 | ADR | Idempotent generators | `tests/generators/utils/idempotency.ts` | `just test-generators` | ✅ |
| DEV-ADR-024 | ADR | UoW/EventBus | `libs/shared/domain`, `libs/shared/application` | Integration tests | ✅ |
| DEV-ADR-025 | ADR | Nx boundaries | `nx.json` tags + lint rules | `pnpm nx lint` | ✅ |
| DEV-ADR-026 | ADR | Supabase stack | `docker/docker-compose.supabase.yml` | Smoke test | ✅ |
| DEV-ADR-027 | ADR | Nx upgrade | `docs/runbooks/nx_upgrade.md` | Manual process | ✅ |
| DEV-ADR-028 | ADR | Universal React gen | `generators/react/` | Framework builds | ✅ |
| DEV-ADR-029 | ADR | Strict typing | `tsconfig.base.json`, `mypy.ini` | Type checks | ✅ |
| DEV-PRD-024 | PRD | Idempotent workflow | Double-run tests | ShellSpec + Jest | ✅ |
| DEV-PRD-025 | PRD | Dependency constraints | Nx enforce-module-boundaries | Lint | ✅ |
| DEV-PRD-026 | PRD | Transactional UoW | UoW contracts + adapters | Unit tests | ✅ |
| DEV-PRD-027 | PRD | Supabase automation | Docker Compose + Nx targets | Start/stop tests | ✅ |
| DEV-PRD-028 | PRD | Nx upgrade gate | Runbook + validation suite | Manual | ✅ |
| DEV-PRD-029 | PRD | Universal React gen | Single generator, 3 frameworks | Build tests | ✅ |
| DEV-PRD-030 | PRD | Strict typing gate | TS + Python strict configs | CI checks | ✅ |
| DEV-PRD-031 | PRD | Type sync CI | GitHub Actions workflow | Type drift detection | ✅ |
| DEV-SDS-023 | SDS | Idempotency patterns | Pattern library + docs | Code review | ✅ |
| DEV-SDS-024 | SDS | Tag configuration | nx.json + project.json tags | Lint | ✅ |
| DEV-SDS-025 | SDS | UoW/EventBus impl | Contracts + in-memory adapters | Tests | ✅ |
| DEV-SDS-026 | SDS | Supabase tooling | Docker Compose + env files | Smoke | ✅ |
| DEV-SDS-027 | SDS | Upgrade runbook | `docs/runbooks/nx_upgrade.md` | Manual | ✅ |
| DEV-SDS-028 | SDS | React gen design | Generator schema + templates | E2E | ✅ |
| DEV-SDS-029 | SDS | Strict type config | Config files + lint rules | CI | ✅ |
| DEV-SDS-030 | SDS | Type sync workflow | Workflows + hooks | CI + local | ✅ |

**Coverage**: 23/23 (100%)
```

---

## ⚡ Cycle D: Migration Guide

**Owner:** Docs Agent  
**Duration:** 1.5 hours

### Migration Guide Structure

```markdown
<!-- docs/MIGRATION_HEXDDD.md -->

# HexDDD Integration Migration Guide

## For Existing VibesPro Projects

If you generated a project **before** the HexDDD integration, follow these steps to upgrade.

### 1. Update Template Dependencies

```bash
# Pull latest template changes
copier update
```

### 2. Retrofit Generators

All generators are now idempotent. Re-run them safely:

```bash
# Re-run domain generator (will not overwrite custom code)
nx g @ddd-plugin/ddd:hex-domain my-domain
```

### 3. Add Nx Boundary Tags

Update `project.json` files:

```json
{
  "tags": [
    "type:domain",  // or application, infrastructure
    "scope:my-domain"
  ]
}
```

### 4. Enable Strict Type Checking

**TypeScript:**
```json
// tsconfig.base.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true
  }
}
```

**Python:**
```ini
# mypy.ini
[mypy]
strict = True
```

### 5. Integrate UoW/EventBus (Optional)

If your domain needs transactions or events:

```typescript
import { UnitOfWork } from '@shared/domain';
import { EventBus } from '@shared/application';

// Use in your application services
```

### 6. Set Up Supabase Dev Stack (Optional)

```bash
nx run supabase-devstack:start
```

### 7. Run Migration Validation

```bash
# Ensure everything still works
just test
just ai-validate
just spec-guard
```

## Breaking Changes

**None** - All changes are additive and backward-compatible.

## Support

Questions? Open an issue or consult `docs/plans/hexddd_integration/`.
```

---

## ✅ Phase Validation Checklist

### Testing
- [ ] E2E smoke tests pass
- [ ] Integration tests pass
- [ ] All generator builds succeed
- [ ] Supabase dev stack operational

### Documentation
- [ ] README updated with HexDDD overview
- [ ] Architecture docs include UoW/EventBus
- [ ] Generator usage guides complete
- [ ] Migration guide published

### Traceability
- [ ] Matrix shows 100% coverage (23/23 specs)
- [ ] All spec IDs mapped to implementations
- [ ] Validation methods documented

### Final Gates
- [ ] `just test` GREEN
- [ ] `just ai-validate` GREEN
- [ ] `just spec-guard` GREEN
- [ ] `pnpm nx run-many -t build --all` GREEN
- [ ] `just test-generation` GREEN

### Deployment
- [ ] All phase branches merged to `dev`
- [ ] PR created: `dev` → `main`
- [ ] Changelog updated
- [ ] **PHASE-005 marked GREEN in Master Plan**
- [ ] **MASTER PLAN marked COMPLETE**

---

## 🎉 Project Completion

Upon marking this phase GREEN:

1. **Merge Strategy**: All phase branches → `dev` → `main`
2. **Release Tag**: Create `v1.0.0-hexddd`
3. **Announcement**: Update project README with integration highlights
4. **Knowledge Share**: Present retrospective findings to team

---

**Congratulations! HexDDD integration complete. VibesPro now generates production-ready hexagonal architecture applications with full type safety, automated testing, and CI/CD integration.**