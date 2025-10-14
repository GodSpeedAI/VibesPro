# AGENT Link Checker — CI & Hooks — 2025-10-13

What I implemented

1. CI Integration
   - Added `.github/workflows/agent-link-check.yml` which runs `tools/check_agent_links.py` on `pull_request` and `push` to `main` and `codex/**` branches.
   - The workflow sets up Python and installs `requests` (used for optional external checks).

2. Enhanced Link Checker
   - `tools/check_agent_links.py` updated to support `--check-externals` and `--max-external`.
   - External link checking uses HEAD/GET with retries and a timeout. The script prints partial-check notices when the max is reached.

3. Local Pre-commit Hook
   - Added `scripts/install-hooks.sh` to install a `.git/hooks/pre-commit` that runs the checker before commits.
   - Ran the installer locally to activate the hook for this workspace.

4. Tests
   - Ran the link checker locally (local-only mode): passed (no broken local links).
   - Ran the checker with `--check-externals --max-external 10`: executed without errors in this environment.

Notes & next steps

- The workflow will fail CI when local link problems occur. If you want the CI job to also check externals, I can add an extra step with `python3 tools/check_agent_links.py --check-externals --max-external 200` but be aware this can increase CI time.
- The pre-commit hook is installed via `scripts/install-hooks.sh`; you may prefer using `pre-commit` framework instead — I can add a `.pre-commit-config.yaml` if you'd like.
- Suggest adding the link checker to `just ai-validate` for developer ergonomics.

Files added/edited
- Added: `.github/workflows/agent-link-check.yml`
- Modified: `tools/check_agent_links.py` (external-check option)
- Added: `scripts/install-hooks.sh` (installs pre-commit hook)
- Added: `docs/work-summaries/2025-10-13-agents-link-check-ci-summary.md`

Date: 2025-10-13
Maintained by: VibesPro Project Team
