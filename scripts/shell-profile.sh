#!/usr/bin/env bash
# ============================================================================
# VibesPro Shell Profile Integration
# ============================================================================
# Add this to your ~/.bashrc or ~/.zshrc:
#
#   if [[ -f ~/projects/VibesPro/scripts/shell-profile.sh ]]; then
#     source ~/projects/VibesPro/scripts/shell-profile.sh
#   fi
#
# Or for project-specific activation, add to your shell's cd hook.
#
# What this does:
#   1. Ensures mise shims are in PATH globally
#   2. Sets up command aliases for common operations
#   3. Auto-activates when entering the VibesPro directory
#
# Traceability: AI_ADR-001, DEV-SDS-018
# ============================================================================

# Only run if interactive
[[ $- != *i* ]] && return

# ============================================================================
# Core PATH Setup
# ============================================================================
# Add mise shims to PATH if not already present
# Shims are version-aware wrappers that auto-select the right tool version
add_to_path() {
  local dir="$1"
  if [[ -d "${dir}" ]] && [[ ":${PATH}:" != *":${dir}:"* ]]; then
    export PATH="${dir}:${PATH}"
  fi
}

# mise shims directory (version-aware)
add_to_path "${HOME}/.local/share/mise/shims"

# mise bin directory (mise itself)
add_to_path "${HOME}/.local/bin"

# ============================================================================
# Auto-Activation Hook
# ============================================================================
# This function is called after every `cd` command to auto-activate
# the environment when entering a VibesPro project directory.
__vibespro_cd_hook() {
  local dir="${PWD}"

  # Look for VibesPro markers
  if [[ -f "${dir}/.mise.toml" ]] && [[ -f "${dir}/copier.yml" ]]; then
    # This looks like a VibesPro project
    if [[ -z "${VIBESPRO_ACTIVATED:-}" ]] || [[ "${VIBESPRO_ACTIVATED}" != "${dir}" ]]; then
      # Activate mise for this directory
      if command -v mise &>/dev/null; then
        eval "$(mise hook-env 2>/dev/null)" || true
        export VIBESPRO_ACTIVATED="${dir}"
      fi
    fi
  fi
}

# Install the cd hook based on shell type
if [[ -n "${BASH_VERSION:-}" ]]; then
  # Bash: use PROMPT_COMMAND
  if [[ "${PROMPT_COMMAND}" != *"__vibespro_cd_hook"* ]]; then
    PROMPT_COMMAND="__vibespro_cd_hook${PROMPT_COMMAND:+;$PROMPT_COMMAND}"
  fi
elif [[ -n "${ZSH_VERSION:-}" ]]; then
  # Zsh: use chpwd hook
  autoload -Uz add-zsh-hook 2>/dev/null || true
  if type add-zsh-hook &>/dev/null; then
    add-zsh-hook chpwd __vibespro_cd_hook
  fi
fi

# ============================================================================
# Convenience Aliases
# ============================================================================
# These aliases use the env-wrapper to ensure environment is active

alias vp='cd ~/projects/VibesPro'
alias vp-dev='cd ~/projects/VibesPro && just dev'
alias vp-test='cd ~/projects/VibesPro && just test'
alias vp-setup='cd ~/projects/VibesPro && just setup'

# Nx aliases with env-wrapper
alias nxg='~/projects/VibesPro/scripts/env-wrapper.sh pnpm exec nx graph'
alias nxb='~/projects/VibesPro/scripts/env-wrapper.sh pnpm exec nx build'
alias nxt='~/projects/VibesPro/scripts/env-wrapper.sh pnpm exec nx test'
alias nxl='~/projects/VibesPro/scripts/env-wrapper.sh pnpm exec nx lint'

# ============================================================================
# VS Code Integration
# ============================================================================
# Function to launch VS Code with proper environment
code-vp() {
  local project_dir="${1:-${HOME}/projects/VibesPro}"
  cd "${project_dir}" || return 1

  # Ensure mise environment is active
  if command -v mise &>/dev/null; then
    eval "$(mise hook-env 2>/dev/null)" || true
  fi

  # Launch VS Code
  code .
}

# ============================================================================
# Diagnostic Function
# ============================================================================
# Run this to check if the environment is properly configured
vibespro-doctor() {
  echo "🔍 VibesPro Environment Diagnostics"
  echo "===================================="
  echo ""

  echo "📦 Tool Versions:"
  echo "  mise:   $(mise --version 2>/dev/null || echo 'NOT FOUND')"
  echo "  node:   $(node --version 2>/dev/null || echo 'NOT FOUND')"
  echo "  pnpm:   $(pnpm --version 2>/dev/null || echo 'NOT FOUND')"
  echo "  bun:    $(bun --version 2>/dev/null || echo 'NOT FOUND')"
  echo "  python: $(python --version 2>/dev/null || echo 'NOT FOUND')"
  echo "  uv:     $(uv --version 2>/dev/null || echo 'NOT FOUND')"
  echo "  just:   $(just --version 2>/dev/null || echo 'NOT FOUND')"
  echo ""

  echo "📁 Path Check:"
  echo "  mise shims in PATH: $(echo $PATH | grep -q 'mise/shims' && echo 'YES ✓' || echo 'NO ✗')"
  echo "  local/bin in PATH:  $(echo $PATH | grep -q '.local/bin' && echo 'YES ✓' || echo 'NO ✗')"
  echo ""

  echo "🔧 Environment:"
  echo "  MISE_SHELL:          ${MISE_SHELL:-'not set'}"
  echo "  VIBESPRO_ACTIVATED:  ${VIBESPRO_ACTIVATED:-'not set'}"
  echo ""

  echo "📍 Tool Locations:"
  echo "  node: $(which node 2>/dev/null || echo 'not found')"
  echo "  pnpm: $(which pnpm 2>/dev/null || echo 'not found')"
  echo "  mise: $(which mise 2>/dev/null || echo 'not found')"
  echo ""

  # Check if in VibesPro directory
  if [[ -f "./copier.yml" ]]; then
    echo "📂 In VibesPro project: YES ✓"
    echo ""
    echo "🧪 Quick Test:"
    if pnpm exec nx --version &>/dev/null; then
      echo "  Nx available: YES ✓ ($(pnpm exec nx --version 2>/dev/null))"
    else
      echo "  Nx available: NO ✗"
    fi
  else
    echo "📂 In VibesPro project: NO (cd to project and re-run)"
  fi
}

echo "VibesPro shell integration loaded. Run 'vibespro-doctor' to check setup."
