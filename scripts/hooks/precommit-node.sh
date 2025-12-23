#!/usr/bin/env bash
# =============================================================================
# Pre-commit Node.js Wrapper
# =============================================================================
# This script ensures Node.js tools (eslint, prettier, etc.) are available
# in pre-commit hooks by activating the appropriate environment manager.
#
# Supports: mise, fnm, nvm, devbox, or system Node.js
# =============================================================================

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

debug() {
  if [[ "${PRECOMMIT_DEBUG:-}" == "1" ]]; then
    echo "[DEBUG] $*" >&2
  fi
}

error() {
  echo -e "${RED}[ERROR]${NC} $*" >&2
}

warn() {
  echo -e "${YELLOW}[WARN]${NC} $*" >&2
}

# Try to activate mise (most likely for this project)
activate_mise() {
  if command -v mise &>/dev/null; then
    debug "Activating mise environment..."
    eval "$(mise activate bash 2>/dev/null)" || true
    eval "$(mise hook-env 2>/dev/null)" || true
    return 0
  fi
  return 1
}

# Try to activate fnm
activate_fnm() {
  if command -v fnm &>/dev/null; then
    debug "Activating fnm environment..."
    eval "$(fnm env --use-on-cd 2>/dev/null)" || true
    return 0
  fi
  return 1
}

# Try to activate nvm
activate_nvm() {
  local nvm_dir="${NVM_DIR:-$HOME/.nvm}"
  if [[ -s "$nvm_dir/nvm.sh" ]]; then
    debug "Activating nvm environment..."
    # shellcheck source=/dev/null
    source "$nvm_dir/nvm.sh" --no-use 2>/dev/null || true
    nvm use 2>/dev/null || true
    return 0
  fi
  return 1
}

# Try to activate devbox
activate_devbox() {
  if command -v devbox &>/dev/null && [[ -f "devbox.json" ]]; then
    debug "Activating devbox environment..."
    eval "$(devbox shellenv 2>/dev/null)" || true
    return 0
  fi
  return 1
}

# Check if Node.js is available
check_node() {
  if command -v node &>/dev/null && command -v pnpm &>/dev/null; then
    debug "Node.js $(node --version) and pnpm found"
    return 0
  fi
  return 1
}

# Main activation logic
main() {
  local tool="${1:-}"
  shift || true

  # If tools are already available, just run the command
  if check_node; then
    debug "Node.js tools already available in PATH"
  else
    # Try version managers in order of preference
    debug "Node.js tools not in PATH, trying version managers..."
    
    activate_mise || activate_fnm || activate_nvm || activate_devbox || true
    
    # Final check
    if ! check_node; then
      error "Could not find Node.js/pnpm after trying all version managers"
      error "Please ensure you have Node.js installed via mise, fnm, nvm, or devbox"
      error ""
      error "Quick fix options:"
      error "  1. Run 'mise install' in the project directory"
      error "  2. Install Node.js: https://nodejs.org/"
      error "  3. Skip this hook: git commit --no-verify"
      exit 1
    fi
  fi

  # Run the requested tool
  case "$tool" in
    prettier)
      exec pnpm exec prettier "$@"
      ;;
    eslint)
      exec pnpm exec eslint "$@"
      ;;
    node)
      exec node "$@"
      ;;
    pnpm)
      exec pnpm "$@"
      ;;
    *)
      error "Unknown tool: $tool"
      error "Usage: precommit-node.sh <prettier|eslint|node|pnpm> [args...]"
      exit 1
      ;;
  esac
}

main "$@"
