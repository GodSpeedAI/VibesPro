# Spec Reorganization and Tooling Update Plan

## Goal

Reorganize the current monolithic specification files (`dev_adr.md`, `dev_prd.md`, etc.) into a structured, domain-oriented directory hierarchy under `docs/specs/`. Update the `spec-matrix` tool to enforce uniqueness and scan only the new location.

## User Review Required

> [!IMPORTANT] > **Breaking Change**: This refactor will move and split core documentation files. All links to `docs/dev_*.md` will need to be updated.
> **Splitting Strategy**: Monolithic files will be split into individual files per spec ID where possible, or moved to `index.md` if they contain general content.

## Proposed Changes

### 1. Directory Structure (DDD / Domain Context)

Create a domain-oriented structure under `docs/specs/`. Each folder represents a feature area or domain, containing grouped specification files.

```
docs/specs/
├── ai_workflow/
│   ├── prompts.prd.md       # (PRD-001, 002, 007)
│   ├── chat_modes.prd.md    # (PRD-003)
│   ├── context.prd.md       # (PRD-006)
│   └── guidance.adr.md      # (ADR-018)
├── observability/
│   ├── telemetry.prd.md     # (PRD-017, 018)
│   └── logging.sds.md       # (SDS-018)
├── generators/
│   ├── scaffolding.prd.md   # (PRD-008, 021, 024, 029)
│   └── spec_template.prd.md # (PRD-019)
├── environment/
│   ├── devbox.prd.md        # (PRD-011, 012, 014)
│   └── ci.prd.md            # (PRD-015)
├── security/
│   ├── guardrails.prd.md    # (PRD-005)
│   └── secrets.adr.md       # (ADR-013)
└── core/
    ├── architecture.adr.md  # (ADR-009, 020)
    └── type_system.prd.md   # (PRD-020, 030, 031)
```

### 2. File Migration & Grouping

I will create a migration script `scripts/migrate_specs_ddd.js` to:

1.  Parse the monolithic `docs/dev_*.md` files.
2.  Map existing Spec IDs to the domains listed above (using a predefined mapping object).
3.  Append the extracted content to the target domain file (e.g., `docs/specs/observability/telemetry.prd.md`).
4.  Ensure frontmatter in the new files lists all contained Spec IDs for the matrix tool.

### 3. Tooling Updates (`tools/spec/matrix.js`)

- **Scope**: Change scan root from `docs/` to `docs/specs/`.
- **Multi-Spec Support**: Ensure the tool correctly parses multiple specs within a single file (it already does this via regex, but we will verify).
- **Uniqueness**: Enforce that a Spec ID (e.g., `DEV-PRD-001`) appears in only _one_ file.

### 4. Reference Updates

Update all references to `docs/dev_*.md` in:

- `README.md`
- `scripts/template-cleanup.sh`
- `tools/ai/src/temporal-ai-client.ts`
- `tools/AGENT.md`
- `ESLINT_STRICT_MODE_TASK.md`
- `justfile` (if applicable)

## Verification Plan

### Automated Tests

1.  **Migration Verification**:
    - Run `scripts/migrate_specs.js`.
    - Verify file count in `docs/specs/` matches extracted sections.
2.  **Matrix Generation**:
    - Run `just spec-matrix`.
    - Verify `docs/traceability_matrix.md` is generated and contains all IDs.
3.  **Uniqueness Check**:
    - Create a temporary duplicate spec file.
    - Run `just spec-matrix` and assert it fails.
4.  **Link Check**:
    - Run `just docs:links` (if available) or `grep` for old paths.

### Manual Verification

1.  Inspect `docs/specs/` folder structure.
2.  Spot check a few generated files for correct formatting.
