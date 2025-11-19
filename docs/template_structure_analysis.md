# Template Structure Analysis (Copier Alignment)

**Purpose**: Document the current state of the VibesPro Copier template so future contributors understand how assets flow into generated projects.

## 1. High-Level Layout

```
templates/
├── docs/                    # Project documentation templates
├── tools/                   # Developer tooling templates
└── {{project_slug}}/        # Main project scaffold
    ├── apps/                # Interface layer applications
    ├── libs/                # Domain + application libraries
    ├── tools/ai/            # AI workflow utilities
    ├── temporal_db/         # Temporal learning bootstrap
    ├── justfile.j2          # Task orchestration
    ├── package.json.j2      # Node workspace config
    └── nx.json.j2           # Nx workspace config
```

Key rules:

- All template files use the `.j2` suffix and Copier variable syntax (`{{ variable_name }}`) where substitution is required.
- Assets that ship directly to the generated project without interpolation live under `templates/{{project_slug}}/static/` (see ADR-MERGE-003).
- Shared documentation templates reside in `templates/docs/` and are used by the documentation generator.

## 2. Hook Responsibilities

- `hooks/pre_gen.py`: validates user answers (project slug, architecture style, author metadata) before Copier writes files.
- `hooks/post_gen.py`: installs dependencies (`pnpm install`, `uv sync --dev`), runs `just build`, and prints next steps.
- Hooks must remain idempotent; they run every time the template is applied or updated.

## 3. Type & AI Tooling

- Type generation logic is packaged under `templates/{{project_slug}}/tools/type-generator/` and pairs with `tools/type-generator` sources in the merger repo.
- AI tooling (`templates/{{project_slug}}/tools/ai/`) provides temporal database bindings and context processors.
- The temporal database seed files in `templates/{{project_slug}}/temporal_db/` initialise tsink with project metadata and patterns.

## 4. Validation Checklist

- [ ] `copier lint` passes for the template directory.
- [ ] `pnpm test:integration` succeeds after generating a fresh project.
- [ ] `node cli/docs.js generate --output-dir tmp/docs` produces documentation without warnings.
- [ ] No files in `templates/` contain deprecated placeholder syntax or references to defunct tooling.

## 5. Future Improvements

- Expand documentation templates to cover additional framework combinations.
- Introduce optional feature flags (e.g., `include_mobile`, `include_streaming`) once the base template is stable.
- Automate template smoke tests in CI using `copier --force --defaults` to generate sample workspaces.

This document intentionally excludes legacy generator systems. Any historical artefacts should be tracked in separate archival notes.
