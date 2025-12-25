#!/usr/bin/env bash
# ============================================================================
# VibesPro Environment Wrapper
# ============================================================================
# This script ensures mise/devbox environment is activated before running
# any command. It's designed to be used as a wrapper for tools like Nx Console
# that may not inherit the shell environment.
#
# Usage:
#   ./scripts/env-wrapper.sh <command> [args...]
#   ./scripts/env-wrapper.sh pnpm exec nx build myapp
#   ./scripts/env-wrapper.sh node --version
#
# Environment Detection Priority:
#   1. Already activated (MISE_SHELL set) → run directly
#   2. mise available → activate mise
#   3. devbox available → activate devbox
#   4. Fallback to system PATH
#
# Traceability: AI_ADR-001, DEV-SDS-018
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Colors for output (respects NO_COLOR)
if [[ -z "${NO_COLOR:-}" ]]; then
  RED='\033[0;31m'
  GREEN='\033[0;32m'
  YELLOW='\033[0;33m'
  NC='\033[0m' # No Color
else
  RED=''
  GREEN=''
  YELLOW=''
  NC=''
fi

log_debug() {
  if [[ -n "${VIBESPRO_DEBUG:-}" ]]; then
    echo -e "${YELLOW}[env-wrapper]${NC} $*" >&2
  fi
}

log_error() {
  echo -e "${RED}[env-wrapper] ERROR:${NC} $*" >&2
}

# Check if environment is already activated
is_env_active() {
  # Check for mise activation markers
  if [[ -n "${MISE_SHELL:-}" ]] || [[ -n "${__MISE_ORIG_PATH:-}" ]]; then
    return 0
  fi
  # Check for devbox activation markers
  if [[ -n "${DEVBOX_SHELL_ENABLED:-}" ]]; then
    return 0
  fi
  # Check if pnpm and node are available (rough check)
  if command -v pnpm &>/dev/null && command -v node &>/dev/null; then
    return 0
  fi
  return 1
}

# Activate mise environment
activate_mise() {
  if ! command -v mise &>/dev/null; then
    # Try common mise locations
    local mise_paths=(
      "${HOME}/.local/bin/mise"
      "${HOME}/.mise/bin/mise"
      "/usr/local/bin/mise"
    )
    for mise_path in "${mise_paths[@]}"; do
      if [[ -x "${mise_path}" ]]; then
        export PATH="${mise_path%/*}:${PATH}"
        break
      fi
    done
  fi

  if command -v mise &>/dev/null; then
    log_debug "Activating mise..."

    # Source mise hook for the current directory
    cd "${PROJECT_ROOT}" || exit 1

    # Try mise activate (modern) or mise hook-env (legacy)
    if mise activate bash &>/dev/null; then
      eval "$(mise activate bash)"
    elif mise hook-env &>/dev/null; then
      eval "$(mise hook-env)"
    fi

    # Also run mise install if tools are missing
    if [[ -f "${PROJECT_ROOT}/.mise.toml" ]]; then
      mise install --yes 2>/dev/null || true
    fi

    return 0
  fi
  return 1
}

# Activate devbox environment
activate_devbox() {
  if ! command -v devbox &>/dev/null; then
    # Try common devbox locations
    local devbox_paths=(
      "${HOME}/.cache/devbox/bin/devbox"
      "/usr/local/bin/devbox"
    )
    for devbox_path in "${devbox_paths[@]}"; do
      if [[ -x "${devbox_path}" ]]; then
        export PATH="${devbox_path%/*}:${PATH}"
        break
      fi
    done
  fi

  if command -v devbox &>/dev/null && [[ -f "${PROJECT_ROOT}/devbox.json" ]]; then
    log_debug "Activating devbox..."
    cd "${PROJECT_ROOT}" || exit 1
    eval "$(devbox shellenv)" 2>/dev/null || true
    return 0
  fi
  return 1
}

# Add fallback paths for common tool locations
add_fallback_paths() {
  local extra_paths=(
    "${HOME}/.local/share/mise/installs/node/20.11.1/bin"
    "${HOME}/.local/share/mise/shims"
    "${HOME}/.local/bin"
    "${HOME}/.cargo/bin"
    "${PROJECT_ROOT}/node_modules/.bin"
  )

  for p in "${extra_paths[@]}"; do
    if [[ -d "${p}" ]] && [[ ":${PATH}:" != *":${p}:"* ]]; then
      export PATH="${p}:${PATH}"
    fi
  done
}

# Main activation logic
activate_environment() {
  cd "${PROJECT_ROOT}" || exit 1

  if is_env_active; then
    log_debug "Environment already active"
    return 0
  fi

  # Try mise first (preferred)
  if activate_mise; then
    log_debug "Activated via mise"
    return 0
  fi

  # Try devbox as fallback
  if activate_devbox; then
    log_debug "Activated via devbox"
    return 0
  fi

  # Add fallback paths as last resort
  log_debug "Using fallback paths"
  add_fallback_paths
}

# ============================================================================
# Main Entry Point
# ============================================================================

if [[ $# -eq 0 ]]; then
  echo "Usage: $0 <command> [args...]"
  echo ""
  echo "Activates mise/devbox environment and runs the specified command."
  echo ""
  echo "Examples:"
  echo "  $0 pnpm exec nx graph"
  echo "  $0 node --version"
  echo "  $0 just test"
  exit 1
fi

# Activate the environment
activate_environment

# Verify critical tools are available
if ! command -v node &>/dev/null; then
  log_error "node not found after environment activation"
  log_error "Please ensure mise or devbox is properly installed"
  exit 1
fi

# Execute the command
log_debug "Executing: $*"
exec "$@"
