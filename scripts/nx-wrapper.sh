#!/usr/bin/env bash
# ============================================================================
# Nx Executable Wrapper for Nx Console
# ============================================================================
# This wrapper ensures mise environment is activated before running nx.
# It's designed to be used by Nx Console extension.
#
# Usage:
#   This script is automatically used by Nx Console when configured via
#   nxConsole.nxExecutablePath in .vscode/settings.json
#
# Traceability: AI_ADR-001, DEV-SDS-018
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Activate mise environment
activate_env() {
  # Add mise shims to PATH
  local mise_shims="${HOME}/.local/share/mise/shims"
  local mise_node="${HOME}/.local/share/mise/installs/node/20.11.1/bin"
  local local_bin="${HOME}/.local/bin"

  if [[ -d "${mise_shims}" ]] && [[ ":${PATH}:" != *":${mise_shims}:"* ]]; then
    export PATH="${mise_shims}:${PATH}"
  fi

  if [[ -d "${mise_node}" ]] && [[ ":${PATH}:" != *":${mise_node}:"* ]]; then
    export PATH="${mise_node}:${PATH}"
  fi

  if [[ -d "${local_bin}" ]] && [[ ":${PATH}:" != *":${local_bin}:"* ]]; then
    export PATH="${local_bin}:${PATH}"
  fi

  # Add node_modules/.bin
  if [[ -d "${PROJECT_ROOT}/node_modules/.bin" ]]; then
    export PATH="${PROJECT_ROOT}/node_modules/.bin:${PATH}"
  fi

  # Try mise hook-env if available
  if command -v mise &>/dev/null; then
    cd "${PROJECT_ROOT}" 2>/dev/null || true
    eval "$(mise hook-env 2>/dev/null)" || true
  fi
}

# Activate the environment
activate_env

# Find pnpm
if ! command -v pnpm &>/dev/null; then
  echo "Error: pnpm not found after environment activation" >&2
  exit 1
fi

# Execute nx via pnpm
exec pnpm exec nx "$@"
