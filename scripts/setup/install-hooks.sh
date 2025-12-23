#!/usr/bin/env bash
set -euo pipefail

HOOK_PATH=".git/hooks/pre-commit"
cat >"${HOOK_PATH}" <<'HOOK'
#!/usr/bin/env bash
# Pre-commit hook: Check AGENT.md links before committing
python3 tools/check_agent_links.py || {
  echo "AGENT.md link check failed. Fix links or bypass with --no-verify." >&2
  exit 1
}
HOOK

chmod +x "${HOOK_PATH}"
echo "Installed pre-commit hook at ${HOOK_PATH}"
