# Hooks Library Agent Instructions

## Overview

The `hooks/lib/` directory contains modular, reusable Python functions for Copier pre- and post-generation hooks. This library was created as part of the Copier template optimization to eliminate technical debt and improve maintainability.

## Module Structure

```
hooks/
├── __init__.py          # Original hook module marker
├── pre_gen.py           # Pre-generation validation hook entry point
├── post_gen.py          # Post-generation setup hook entry point
├── AGENT.md             # This file
└── lib/
    ├── __init__.py      # Library exports
    ├── context.py       # Copier context loading and normalization
    ├── validators.py    # Input sanitization and path validation
    └── utils.py         # Common utilities (case conversion, file I/O)
```

## Module Responsibilities

### `context.py`

- `load_copier_context(target)`: Load answers from env vars and YAML files
- `normalize_answers(answers)`: Normalize values for consistent processing
- `parse_domains(raw)`: Parse domain lists from various input formats

### `validators.py`

- `sanitize_for_platform_id(value)`: Sanitize for Android/iOS identifiers
- `sanitize_for_filesystem(value)`: Prevent path traversal attacks
- `validate_within_target(target, path_component, base_dir)`: Path containment
- `sanitize_domain_name(value, target)`: Validate domain names
- `sanitize_service_name(value, target)`: Validate service names
- `sanitize_project_slug(value)`: Sanitize project slugs
- `sanitize_domains(domains)`: Sanitize domain lists

### `utils.py`

- `to_words(value)`: Split strings into word segments
- `pascal_case(value)`: Convert to PascalCase
- `camel_case(value)`: Convert to camelCase
- `snake_case(value)`: Convert to snake_case
- `kebab_case(value)`: Convert to kebab-case
- `title_case_from_slug(value)`: Convert slug to Title Case
- `write_text_file(path, content)`: Write files with proper encoding

## Invariants

| ID      | Invariant                          | Verification                      |
| ------- | ---------------------------------- | --------------------------------- |
| INV-06  | Hooks exit cleanly (status 0)      | `python -m py_compile hooks/*.py` |
| HOOK-01 | No path traversal possible         | Unit tests in `tests/copier/`     |
| HOOK-02 | UTF-8 encoding for all file writes | Implementation enforced           |

## Usage in Hooks

```python
# In post_gen.py
from lib import (
    load_copier_context,
    sanitize_domain_name,
    write_text_file,
    pascal_case,
)

target = Path.cwd()
answers = load_copier_context(target)
domain_path = sanitize_domain_name(answers.get("domain_name"), target)
entity_name = pascal_case(answers.get("domain_name"))
```

## Testing

```bash
# Syntax validation
python -m py_compile hooks/lib/context.py
python -m py_compile hooks/lib/validators.py
python -m py_compile hooks/lib/utils.py

# Unit tests
uv run pytest tests/copier/test_copier_invariants.py -v
```

## Anti-Patterns

- ❌ Import from `post_gen.py` directly (use `lib/` modules)
- ❌ Hardcode paths instead of using Path.cwd()
- ❌ Skip sanitization for user-provided values
- ❌ Assume YAML is available without try/except

## Traceability

- ADR: AI_ADR-001 (Copier Template Architecture)
- SDS: AI_SDS-001 (Copier Hook Design)
- PRD: AI_PRD-001 (Template Generation Requirements)
