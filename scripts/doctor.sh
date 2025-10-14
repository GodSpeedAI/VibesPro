#!/usr/bin/env bash
set -euo pipefail

echo "🩺 Environment doctor"

echo "User: $(whoami)"
echo "OS: $(uname -srv)"
echo "Shell: ${SHELL:-unknown}"

echo "
PATH (first 6 entries):"
echo "$PATH" | tr ':' '\n' | nl -ba | sed -n '1,6p'

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
else
  echo "  mise: not installed"
  echo "  Install: curl https://mise.jdx.dev/install.sh | sh"
fi

echo "
OS-level tool versions:"
for cmd in git jq uv corepack postgresql; do
  if command -v "$cmd" >/dev/null 2>&1; then
    case "$cmd" in
      postgresql) echo -n "  $cmd: "; postgres --version 2>/dev/null | head -1 || echo "installed" ;;
      uv) echo -n "  $cmd: "; uv --version || true ;;
      corepack) echo -n "  $cmd: "; corepack --version || true ;;
      *) echo -n "  $cmd: "; "$cmd" --version 2>&1 | head -1 || echo "installed" ;;
    esac
  else
    echo "  $cmd: (not found)"
  fi
done

echo "
Doctor finished. No secrets are printed by this script."
