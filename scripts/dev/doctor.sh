#!/usr/bin/env bash
set -euo pipefail

echo "🩺 Environment doctor"

whoami_output=$(whoami) || true
echo "User: ${whoami_output}"
uname_output=$(uname -srv) || true
echo "OS: ${uname_output}"
echo "Shell: ${SHELL:-unknown}"

echo "
PATH (first 6 entries):"
echo "${PATH}" | tr ':' '\n' | nl -ba | sed -n '1,6p'

echo "
Runtime versions (managed by mise):"
if command -v mise >/dev/null 2>&1; then
  # Show mise-managed runtimes
  if mise which node >/dev/null 2>&1; then
    echo -n "  node (mise): "
    mise exec -- node -v 2>/dev/null || echo "not installed"
  else
    echo "  node (mise): not installed (run 'mise install')"
  fi

  if mise which python >/dev/null 2>&1; then
    echo -n "  python (mise): "
    mise exec -- python -V 2>&1 | awk '{print $2}' || echo "not installed"
  else
    echo "  python (mise): not installed (run 'mise install')"
  fi

  if mise which rustc >/dev/null 2>&1; then
    echo -n "  rust (mise): "
    mise exec -- rustc --version 2>&1 | awk '{print $2}' || echo "not installed"
  else
    echo "  rust (mise): not installed (run 'mise install')"
  fi

  if mise which bun >/dev/null 2>&1; then
    echo -n "  bun (mise): "
    mise exec -- bun --version 2>&1 || echo "not installed"
  else
    echo "  bun (mise): not installed (run 'mise install bun')"
  fi
else
  echo "  mise: not installed"
  echo "  Install: curl https://mise.jdx.dev/install.sh | sh"
fi

echo "
OS-level tool versions:"
for cmd in git jq uv corepack postgresql; do
  if command -v "${cmd}" >/dev/null 2>&1; then
    case "${cmd}" in
      postgresql) echo -n "  ${cmd}: "; psql --version 2>/dev/null | head -1 || postgres --version 2>/dev/null | head -1 || echo "installed" ;;
      uv) echo -n "  ${cmd}: "; uv --version || true ;;
      corepack) echo -n "  ${cmd}: "; corepack --version || true ;;
      *) echo -n "  ${cmd}: "; "${cmd}" --version 2>&1 | head -1 || echo "installed" ;;
    esac
  else
    echo "  ${cmd}: (not found)"
  fi
done

printf '\nDev / environment tool availability checks:\n'
failed=0

check_and_print() {
  local name="$1"
  local hint="$2"
  if command -v "${name}" >/dev/null 2>&1; then
    # Try to print a one-line version; fall back to 'available'
    ver=$("${name}" --version 2>&1 || true)
    if [[ -n "${ver}" ]]; then
      # show first non-empty line
      printf '  %s: ' "${name}"; echo "${ver}" | sed -n '1p'
    else
      printf '  %s: available\n' "${name}"
    fi
  else
    printf '  %s: (not found)%s\n' "${name}" "${hint}"
    failed=$((failed+1))
  fi
}

# Check devbox, sops, vector, direnv
check_and_print devbox " — install: https://github.com/jetpack-io/devbox"
check_and_print sops " — install: https://github.com/mozilla/sops"
check_and_print vector " — install: https://vector.dev/"
check_and_print direnv " — install: https://direnv.net/"

printf '\nDoctor finished. No secrets are printed by this script.\n'

if [[ "${failed:-0}" -ne 0 ]]; then
  printf '\nSummary: %s check(s) missing. Install the missing tools or consult the links above.\n' "${failed}"
  exit 1
else
  printf '\nSummary: all checks passed.\n'
fi
printf '\nDoctor finished. No secrets are printed by this script.\n'
