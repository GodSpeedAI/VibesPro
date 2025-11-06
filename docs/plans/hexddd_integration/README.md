# HexDDD Integration Implementation Plans

This directory contains the modular implementation plan for integrating hexagonal architecture patterns from [HexDDD](https://github.com/GodSpeedAI/HexDDD) into VibesPro.

## 📁 Plan Structure

```
hexddd_integration/
├── README.md                              # This file
├── MASTER_PLAN.md                         # Executive summary + coordination
├── PHASE-000-PRE_PLAN_INTELLIGENCE.md     # Intelligence gathering (2-3h)
├── PHASE-001-GENERATOR_IDEMPOTENCY.md     # Idempotency + testing (6-8h)
├── PHASE-002-HEXAGONAL_FOUNDATIONS.md     # UoW/EventBus/Tags (8-10h)
├── PHASE-003-UNIVERSAL_REACT_GENERATOR.md # Next/Remix/Expo (10-12h)
├── PHASE-004-TYPE_SAFETY_CI.md            # Strict typing + CI (6-8h)
├── PHASE-005-INTEGRATION_DOCS.md          # E2E + docs (4-6h)
└── intelligence/                          # PHASE-000 outputs
    ├── MEMORY_RECALL.md
    ├── REPOSITORY_CONTEXT.md
    ├── DOCUMENTATION_BASELINE.md
    ├── PATTERN_RESEARCH.md
    ├── VIBE_CHECK_OUTCOMES.md
    ├── MECE_VALIDATION.md
    ├── RISK_ASSESSMENT.md
    └── CRITICAL_PATH.md
```

## 🎯 Quick Start

### For AI Agents

1. **Read** `MASTER_PLAN.md` for overview and phase dependencies
2. **Execute** phases sequentially starting with `PHASE-000`
3. **Update** checklists in each phase document as you complete cycles
4. **Log** evidence artifacts in designated locations
5. **Trigger** next phase when current phase marked GREEN

### For Human Reviewers

1. **Scan** `MASTER_PLAN.md` for high-level objectives and status
2. **Spot-check** individual phase documents for cycle details
3. **Validate** evidence artifacts in `intelligence/` and `logs/`
4. **Approve** phase merges when validation checklist complete

## 📊 Plan Coverage

### Specifications Satisfied

| Type     | IDs                             | Count |
| -------- | ------------------------------- | ----- |
| **ADRs** | DEV-ADR-023 through DEV-ADR-029 | 7     |
| **PRDs** | DEV-PRD-024 through DEV-PRD-031 | 8     |
| **SDSs** | DEV-SDS-023 through DEV-SDS-030 | 8     |

### Requirements Traceability

| Requirement               | Implementing Phase(s) | Validation Method         |
| ------------------------- | --------------------- | ------------------------- |
| Generator Idempotency     | PHASE-001             | Double-run tests          |
| UoW/EventBus Abstractions | PHASE-002             | Integration tests         |
| Dependency Boundaries     | PHASE-002             | Nx lint rules             |
| Supabase Dev Stack        | PHASE-002             | Docker Compose smoke test |
| Universal React Generator | PHASE-003             | Framework-specific builds |
| Strict TypeScript         | PHASE-004             | `tsc --noEmit`            |
| Strict Python             | PHASE-004             | `mypy --strict`           |
| Type Sync CI              | PHASE-004             | GitHub Actions workflow   |

## ⏱️ Timeline

**Sequential Execution**: 36-47 hours  
**Optimal Parallelization**: 18-24 hours  
**Critical Path**: 20 hours (with all parallelization opportunities)

### Phase Durations

| Phase     | Duration | Can Parallelize Within Phase? |
| --------- | -------- | ----------------------------- |
| PHASE-000 | 2-3h     | ❌ No (sequential)            |
| PHASE-001 | 6-8h     | ✅ Yes (3 cycles)             |
| PHASE-002 | 8-10h    | ✅ Yes (4 cycles)             |
| PHASE-003 | 10-12h   | ✅ Yes (5 cycles)             |
| PHASE-004 | 6-8h     | ✅ Yes (4 cycles)             |
| PHASE-005 | 4-6h     | ✅ Yes (all cycles)           |

## 🧩 Phase Summary

### PHASE-000: Pre-Implementation Intelligence (BLOCKING)

-   **MCP Tools**: All tools (memory, github, nx, context7, exa, ref, vibe-check)
-   **Outputs**: 8 intelligence artifacts
-   **Key Deliverable**: MECE validation + risk assessment + critical path
-   **Status**: 🔵 Not Started

### PHASE-001: Generator Idempotency & Testing

-   **Cycles**: A (Pattern Library), B (Test Utils), C (Regression Suite)
-   **Key Deliverable**: All generators pass double-run tests
-   **Critical**: Idempotency library pattern affects all downstream generators
-   **Status**: 🔵 Not Started

### PHASE-002: Hexagonal Foundations

-   **Cycles**: A (UoW TS), B (UoW Python), C (EventBus), D (Nx Tags + Supabase)
-   **Key Deliverable**: UoW/EventBus contracts + enforced boundaries
-   **Critical**: Contracts needed for PHASE-003 generators
-   **Status**: 🔵 Not Started

### PHASE-003: Universal React Generator

-   **Cycles**: A (Shared Assets), B (Next.js), C (Remix), D (Expo), E (Idempotency)
-   **Key Deliverable**: Single generator scaffolds 3 frameworks
-   **Critical**: Largest implementation effort, high reuse value
-   **Status**: 🔵 Not Started

### PHASE-004: Type Safety & CI Integration

-   **Cycles**: A (TS Strict), B (Python Strict), C (Type Sync CI), D (Pre-commit Hooks)
-   **Key Deliverable**: 100% type coverage + automated sync
-   **Critical**: Prevents type drift in all generated projects
-   **Status**: 🔵 Not Started

### PHASE-005: Integration & Documentation

-   **Cycles**: E2E tests, docs updates, traceability matrix, migration guide
-   **Key Deliverable**: End-to-end validation + complete documentation
-   **Critical**: Final validation gate before production use
-   **Status**: 🔵 Not Started

## 🚦 Status Tracking

**Overall Progress**: 0% complete (0/6 phases)

Track phase completion in `MASTER_PLAN.md` status table.

## 🛠️ Tools & Commands

### Validation Commands

```bash
# Run from workspace root

# Full validation suite
just spec-guard

# Phase-specific validation
just test-generators           # PHASE-001
pnpm nx run-many -t lint       # PHASE-002 (boundary checks)
pnpm nx run-many -t build      # PHASE-003 (framework builds)
pnpm tsc --noEmit              # PHASE-004 (TS strict)
uv run mypy --strict           # PHASE-004 (Python strict)
just test                      # PHASE-005 (all tests)
```

### Evidence Collection

```bash
# Generate logs for audit trail
just ai-validate 2>&1 | tee logs/phase-<N>-cycle-<X>.log

# Capture test reports
pnpm nx run-many -t test --json > reports/phase-<N>-cycle-<X>-report.json
```

## 📞 Support & Escalation

### Decision Authority Matrix

| Decision Type            | Authority                 | Escalation                 |
| ------------------------ | ------------------------- | -------------------------- |
| Technical (within spec)  | Executing AI Agent        | Phase Lead → Platform Team |
| Architectural (spec gap) | Vibe Check → Human Review | Tech Lead                  |
| Timeline (delays >4h)    | Phase Lead                | Project Manager            |
| Scope (new ADR/PRD)      | Tech Lead                 | Product Owner              |

### Communication Channels

-   **AI Progress**: Real-time updates in phase document checklists
-   **Code Review**: GitHub PRs with phase/cycle labels
-   **Traceability**: `docs/traceability_matrix.md` updates

## ✅ Definition of Done

**Per Phase**: All cycles GREEN, evidence captured, checklist 100% complete

**Full Plan**: All 6 phases complete + master validation passes:

```bash
just test && \
just ai-validate && \
just spec-guard && \
pnpm nx run-many -t build && \
just test-generation
```

## 📚 Additional Resources

-   **HexDDD Reference**: https://github.com/GodSpeedAI/HexDDD
-   **Master Specs**: `docs/dev_adr.md`, `docs/dev_prd.md`, `docs/dev_sds.md`
-   **Architecture Docs**: `architecture/calm/`
-   **Nx Documentation**: https://nx.dev/

---

**Last Updated**: 2025-11-05  
**Plan Version**: 1.0.0  
**Aligned With**: DEV-ADR-023-029, DEV-PRD-024-031, DEV-SDS-023-030
