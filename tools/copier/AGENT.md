# Copier Tools Agent Instructions

## Overview

The `tools/copier/` directory contains utilities for validating, testing, and maintaining the Copier template system. These tools support the Copier template optimization implementation.

## Contents

```
tools/copier/
├── AGENT.md                   # This file
├── smoke-project.json         # Nx project.json template for smoke example
└── validate_templates.py      # Template validation script
```

## Purpose

### `smoke-project.json`

A pre-configured Nx project.json that is copied into `apps/copier-smoke-example/` after generation. This makes the smoke example Nx-aware without requiring the template itself to generate Nx-specific files.

**Key features:**

- Name: `copier-smoke-example`
- Tags: `scope:smoke-test`, `type:generated`, `layer:testing`
- Targets: `build`, `lint`, `regenerate`, `validate`

### `validate_templates.py`

Runs a `--pretend` generation to validate all Jinja2 templates render without errors.

**Usage:**

```bash
python tools/copier/validate_templates.py
# Or via just:
just copier-validate-templates
```

## Justfile Recipes

| Recipe                      | Description                                   |
| --------------------------- | --------------------------------------------- |
| `copier-smoke-test`         | Full smoke test suite (regenerate + validate) |
| `copier-regenerate-smoke`   | Regenerate `apps/copier-smoke-example/`       |
| `copier-validate-smoke`     | Validate invariants                           |
| `copier-validate-templates` | Validate all templates render                 |
| `copier-ci`                 | Full CI validation                            |
| `copier-quick-validate`     | Fast syntax check (no generation)             |

## Invariants

| ID     | Invariant             | Tool                    |
| ------ | --------------------- | ----------------------- |
| INV-01 | copier.yml validates  | `validate_templates.py` |
| INV-02 | Templates render      | `validate_templates.py` |
| INV-03 | Nx recognizes project | `copier-validate-smoke` |
| INV-06 | Hooks exit cleanly    | `copier-validate-smoke` |

## Smoke Test Workflow

```bash
# 1. Regenerate smoke example
just copier-regenerate-smoke

# 2. Validate invariants
just copier-validate-smoke

# 3. Or run both
just copier-smoke-test
```

## CI Integration

Add to CI workflow:

```yaml
- name: Validate Copier templates
  run: just copier-ci
```

## Extending

To add new validation checks:

1. Add to `validate_templates.py` or create new script
2. Add corresponding justfile recipe
3. Update invariant table above
4. Add test in `tests/copier/test_copier_invariants.py`

## Traceability

- ADR: AI_ADR-001 (Copier Template Architecture)
- SDS: AI_SDS-001 (Copier Hook Design)
