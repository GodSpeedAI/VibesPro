# Template Structure Analysis and Refactoring Plan

## 1. Executive Summary

The `vibePDK` repository is a "meta-project" designed to generate new, self-contained developer platforms using Cookiecutter. An analysis of the current structure reveals that critical tooling, configuration, and documentation intended for the final generated project are currently located at the root of the `vibePDK` repository itself, rather than within the template directory (`{{cookiecutter.project_slug}}`).

This is incorrect, as Cookiecutter only copies and renders the contents of the template directory. The current setup would result in a generated project that is missing most of the AI-assisted development features (prompts, chat modes), testing infrastructure, and local scripts.

This report details a refactoring plan to move all project-specific files and directories into the `{{cookiecutter.project_slug}}` template, ensuring that generated projects are complete and self-contained.

Status note (2025-08-25): Initial migration has been executed. Items below are struck through when completed, with brief notes inline. Remaining items are listed as Pending or Partial.

## 2. Analysis of Files and Directories

The following is a breakdown of items at the repository root and a recommendation on whether they should be moved into the template.

### To Be MOVED into `{{cookiecutter.project_slug}}`

These items are essential for the functionality, configuration, and developer experience of the *generated project*.

*   ~~**`.github/` (Partial Move)**~~ — Moved: `chatmodes/`, `instructions/`, `prompts/`, and `copilot-instructions.md` now exist under `{{cookiecutter.project_slug}}/.github/`. The template also has `workflows/` (CI included for generated project).
*   ~~**`.husky/`**~~ — Moved with hooks (`commit-msg`, `pre-commit`) under `{{cookiecutter.project_slug}}/.husky/`.
*   ~~**`.vscode/`**~~ — Moved (`settings.json`, `tasks.json`, `mcp.json`, `extensions.json`) to `{{cookiecutter.project_slug}}/.vscode/`.
*   ~~**`mcp/`**~~ — Moved to `{{cookiecutter.project_slug}}/mcp/`.
*   ~~**`scripts/`**~~ — Moved to `{{cookiecutter.project_slug}}/scripts/` (includes `run_prompt.sh`, `measure_tokens.sh`, `plan_techstack.sh`, `sync_techstack.sh`).
*   ~~**`tests/`**~~ — Moved to `{{cookiecutter.project_slug}}/tests/` (fixtures, shell, snapshots, unit).
*   ~~**`tools/`**~~ — Moved to `{{cookiecutter.project_slug}}/tools/` (includes `audit/`, `ci/`, `cli/`, `metrics/`, plus existing `calm/`, `docs/`, `prompt/`, `spec/`, `test/`).
*   ~~**`.envrc`**~~ — Added as `{{cookiecutter.project_slug}}/.envrc.template` for safe adoption in generated projects.
*   ~~**`justfile`**~~ — Updated in template; original template `justfile` backed up as `{{cookiecutter.project_slug}}/justfile.template`.
*   ~~**`package.json` (and lockfile)**~~ — Template `package.json` replaced with root version; `pnpm-lock.yaml` copied.
*   ~~**`techstack.yaml`**~~ — Copied to template root.
*   ~~**`tsconfig.json`**~~ — Copied to template root.
*   ~~**`pnpm-workspace.yaml`**~~ — Copied to template root.

### To be KEPT at the Root

These files are essential for the `vibePDK` repository to function as a Cookiecutter template.

*   **`cookiecutter.json`**: The main Cookiecutter configuration file. **Must** remain at the root.
*   **`hooks/`**: Contains the `pre_gen_project.py` and `post_gen_project.py` scripts. Cookiecutter requires these to be at the root level, outside the template directory.
*   **`README.md`**: The root README explains how to use this repository *as a template*. It should stay.
*   **`.gitignore` (Root)**: The root `.gitignore` should contain rules for the template development environment (e.g., Python venv folders, local test artifacts). It should be reviewed against the template's `.gitignore`.

### Special Case: `docs/` Directory

The `docs` directory contains a mix of content:
*   **Template Docs**: `README.md`, `migration-from-yaml.md`. — Status: Partially moved (present under `{{cookiecutter.project_slug}}/docs/`).
*   **Project Specs**: `dev_*.md`, `spec_index.md`, `traceability_matrix.md`, etc. — Status: Partially moved. Present in template: `dev_spec_index.md`, `spec_index.md`, `traceability_matrix.md`, `markdownlint.md`. Remaining to move: `commit_message_guidelines.md`, `dev_adr.md`, `dev_devkit-integration-plan.md`, `dev_implementation_plan.md`, `dev_prd.md`, `dev_sds.md`, `dev_technical-specifications.md`, `devkit-prompts-instructions-integration.md`, `environment_report.md`, `ideation-insights.md`, and this `template_structure_analysis.md` if we want it in generated projects.

## 3. Recommended Next Steps

To resolve this structural issue, a significant refactoring is required. The high-level steps are:

1.  ~~**Move the identified files and directories** from the root of `vibePDK` into the `{{cookiecutter.project_slug}}` directory.~~ — Completed for all items listed above except portions of `docs/` (partial).
2.  ~~**Merge configurations** where necessary (e.g., `justfile`, `.gitignore`).~~ — `justfile` replaced in template; previous version saved as `justfile.template`. Review `.gitignore` deltas between root and template and consolidate as needed. Pending if differences exist.
3.  **Adjust paths** in any scripts or configuration files that might break after the move. — Pending verification pass; initial smoke tests recommended.
4.  **Clean up the root directory**, leaving only the files necessary for Cookiecutter itself. — Pending; after docs finalization, retain `cookiecutter.json`, `hooks/`, and template-development files only per plan.

Validation checklist (current state):
- Template contains: `.github/` (with prompts/instructions/chatmodes and CI), `.husky/`, `.vscode/`, `mcp/`, `scripts/`, `tests/`, `tools/`, `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `techstack.yaml`, `tsconfig.json`, `.envrc.template`, and updated `justfile` (+ backup).
- Docs: Partial; move listed remaining files to `{{cookiecutter.project_slug}}/docs/`.

This will align the repository with standard Cookiecutter practices and ensure that running the template produces a complete, functional, and feature-rich project as intended.
