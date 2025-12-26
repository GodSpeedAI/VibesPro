# Copier Template Structure Guide

This document explains how the VibesPro Copier template is structured, what gets inherited by generated projects, and how to modify it.

## Overview

VibesPro is a **template creator** that generates standalone projects. Generated projects receive:

- ✅ All core features (temporal DB, observability, CI/CD)
- ❌ No template generation capability (they can't create more projects)

## Directory Structure

```
VibesPro/
├── copier.yml              # Template configuration (excluded from output)
├── .copierignore           # Controls what's excluded from generation
├── hooks/                  # Copier pre/post hooks (excluded from output)
│   ├── pre_gen.py
│   ├── post_gen.py
│   └── lib/                # Modular hook library
└── templates/
    ├── {{project_slug}}/   # Main template (what users get)
    │   ├── .github/        # CI/CD workflows
    │   ├── libs/           # Core libraries
    │   ├── tools/          # Development tools
    │   ├── temporal_db/    # Temporal pattern storage
    │   ├── ops/            # Observability (Vector, OpenObserve)
    │   ├── supabase/       # Database migrations
    │   └── ...
    └── docs/               # Documentation templates
```

## What Users Receive

| Feature       | Included | Notes                                              |
| ------------- | -------- | -------------------------------------------------- |
| Nx monorepo   | ✅       | Pre-configured workspace                           |
| Temporal DB   | ✅       | Pattern storage (GGUF model downloaded separately) |
| Observability | ✅       | Vector + OpenObserve pipeline                      |
| CI/CD         | ✅       | GitHub Actions workflows                           |
| mise + devbox | ✅       | Environment management                             |
| Copier hooks  | ❌       | Template-only, not inherited                       |
| copier.yml    | ❌       | Template-only, not inherited                       |

## Modifying the Template

### Adding New Files

1. Add files to `templates/{{project_slug}}/`
2. Use `.j2` extension for Jinja2 templating
3. Use `{{variable_name}}` for dynamic content

Example:

```jinja
# templates/{{project_slug}}/README.md.j2
# {{project_name}}

Created by {{author_name}}
```

### Excluding Files

Add patterns to `.copierignore`:

```
# Don't copy these to generated projects
my_internal_tool/
*.secret
```

### Adding Variables

Edit `copier.yml`:

```yaml
my_new_variable:
  type: str
  default: 'default_value'
  help: 'Description shown to user'
```

### Modifying Hooks

Edit `hooks/post_gen.py` for post-generation logic:

- Install dependencies
- Run scaffolding
- Generate types

## Testing Changes

```bash
# Quick syntax validation
just copier-quick-validate

# Full smoke test (regenerates example)
just copier-smoke-test

# View generated output
ls apps/copier-smoke-example/
```

## Invariants

| ID     | Invariant          | Description                     |
| ------ | ------------------ | ------------------------------- |
| INV-01 | Config validates   | `copier.yml` must be valid YAML |
| INV-02 | Templates render   | All `.j2` files must render     |
| INV-03 | Nx recognition     | Generated project is Nx-aware   |
| INV-06 | Hooks exit cleanly | No hook errors                  |
| INV-07 | Ignore correctness | `.copierignore` patterns work   |

## Whitelabeling

Generated projects are whitelabeled:

- No "VibesPro" branding (uses user's `project_name`)
- No Copier references
- Independent Git history

To customize branding, modify:

- `templates/{{project_slug}}/README.md.j2`
- `templates/{{project_slug}}/package.json.j2`
- `templates/{{project_slug}}/AGENTS.md.j2`
