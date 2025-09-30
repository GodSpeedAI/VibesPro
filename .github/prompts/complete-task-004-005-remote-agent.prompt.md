````prompt
---
kind: prompt
domain: docs
task: complete-tasks
thread: task-004-005-remote
matrix_ids: [AI_ADR-003, AI_PRD-002, AI_SDS-002, AI_TS-005]
budget: M
mode: "agent"
model: GPT-5 mini
tools: ["codebase", "search"]
description: "Remote-agent instructions to complete TASK-004 and TASK-005 using only repository assets: convert docs to Jinja2 .j2, add tests, update AI_TDD_PLAN.md, and open a PR."
---

You are an autonomous remote agent with readonly access to this repository on GitHub (no access to the user's local machine).

Goal
- Complete TASK-004 (Maintainer Doc Alignment) and TASK-005 (Template Doc Emission) using only files and tools available inside this repository, convert relevant docs to Jinja2 templates (.j2) so generated projects can inject values (project name, author, year, repo_url), add tests that validate template emission, update `docs/aiassit/AI_TDD_PLAN.md` to mark TASK-004 and TASK-005 GREEN with evidence, and open a Pull Request with your changes.

Preconditions (verify in-repo/state)
- Work on a branch named `feat/docs-templates-TASK-004-005`.
- Do not attempt any network or local-machine operations beyond GitHub actions or PR creation.
- All edits must be confined to: `templates/{{cookiecutter.project_slug}}/docs/`, `templates/{{cookiecutter.project_slug}}/README.md.j2`, tests under `tests/docs/` or `tests/integration/`, `.github/prompts/` (this file may be used), and `docs/aiassit/AI_TDD_PLAN.md`.
- Do NOT modify `.vscode` config files or commit secrets.

Steps you must perform (repository-only)

1) Create or update template files
  - Convert the following files (if present) under `templates/{{cookiecutter.project_slug}}/docs/` or `templates/{{cookiecutter.project_slug}}/` to Jinja2 templates with `.j2` suffix:
    - `README.md` → `README.md.j2`
    - `docs/dev_adr.md` → `docs/dev_adr.md.j2`
    - `docs/dev_prd.md` → `docs/dev_prd.md.j2`
    - `docs/dev_sds.md` → `docs/dev_sds.md.j2`
    - `docs/dev_technical-specifications.md` → `docs/dev_technical-specifications.md.j2`
  - Replace the following tokens in the templates using Jinja2 syntax:
    - project slug/name tokens: use `{{ cookiecutter.project_slug }}` and `{{ cookiecutter.project_name }}`
    - author: `{{ cookiecutter.author_name }}`
    - year: `{{ cookiecutter.year }}`
    - repo url: `{{ cookiecutter.repo_url }}`
  - Where a file should remain static, leave it unchanged.

2) Add tests
  - Add `tests/docs/maintainer-docs.test.ts` that asserts generated templates exist (in repository tests this should assert the template files have been created in `templates/...` and are non-empty). Keep the test deterministic and avoid executing the generator (the maintainer will run generation in CI).
  - Add `tests/integration/template-docs.test.ts` which is an integration-style test that will be executed in CI. Since you cannot run the generator locally, implement the test to use the project's existing helper functions (if any) for rendering, or to assert the `.j2` template files exist and contain the expected tokens (e.g., `{{ cookiecutter.project_name }}`). Keep assertions simple and deterministic.

3) Update `docs/aiassit/AI_TDD_PLAN.md`
  - Mark TASK-004 and TASK-005 as completed (`[x]`) and add a one-line evidence note for each indicating: files added/converted, tests added, and that CI should run `pnpm test`, `pnpm prompt:lint`, `just test-generation`, and `uv run pytest -q` to validate everything.
  - Reference the spec IDs: `AI_ADR-003, AI_PRD-002, AI_SDS-002, AI_TS-005` in the task evidence lines.

4) Commit & open a Pull Request
  - Commit all changes to branch `feat/docs-templates-TASK-004-005` and ensure commit message follows the repo guidelines. Example commit message header:
    - "✨feat(docs): add jinja2 templates + tests for maintainer/template docs (AI_ADR-003, AI_PRD-002)"
  - In the PR body include:
    - Short summary of changes
    - Commands the maintainer must run locally to validate (copy below)
    - Location of regression logs to check in CI
  - Assign the PR reviewers per repository CODEOWNERS or add reviewer `sprime01` if available.

Commands for maintainers to run locally (include in PR body)

```bash
# from repo root
git fetch origin main && git switch -c feat/docs-templates-TASK-004-005
pnpm install --frozen-lockfile
pnpm run prompt:lint
pnpm test
just test-generation
uv run pytest -q
````

What to attach to PR

- List of changed files (automatically shown by GitHub). Additionally include a short text summary and request that the maintainer run the full regression locally. If CI fails, add failing logs as artifacts and create an issue with `CI_Failure_Template.md`.

Acceptance criteria (for you to assert in PR description)

- `templates/{{cookiecutter.project_slug}}/README.md.j2` and at least the four docs templates exist and contain the cookiecutter tokens
- `tests/docs/maintainer-docs.test.ts` and `tests/integration/template-docs.test.ts` are present and deterministic
- `docs/aiassit/AI_TDD_PLAN.md` updated marking tasks done with evidence and spec IDs included

If anything is ambiguous or a required file is missing in the repository, create a PR that explains the gap and proposes a follow-up (do not modify unrelated files).

Security note

- Do not add or change any workspace configuration that could enable automatic tool approval (e.g., do not modify `.vscode/settings.json` or add `chat.tools.autoApprove`).

End of prompt.
