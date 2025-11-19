#!/usr/bin/env bash
set -euo pipefail

if [[ "${DEVBOX_BOOT_SILENT:-0}" == "1" ]]; then
  exit 0
fi

# Devbox boot script - displays banner and basic diagnostics
# Called when entering devbox shell

cat << 'EOF'
╔════════════════════════════════════════════════════════════╗
║                   🎯 Devbox Environment                    ║
║                  OS Toolchain Activated                    ║
╚════════════════════════════════════════════════════════════╝

Available tools:
  • git, curl, jq, make
  • PostgreSQL 15
  • ripgrep (rg), fd
  • ffmpeg
  • uv (Python package manager)

Quick commands:
  just setup     - Install all dependencies
  just doctor    - Check environment health
  just test-env  - Run environment tests
  just dev       - Start development servers

Type 'exit' to leave the devbox shell.

EOF

# Show minimal diagnostics
echo "📊 Quick diagnostics:"
POSTGRES_PATH=""
if command -v postgres >/dev/null 2>&1; then
  POSTGRES_PATH=$(command -v postgres)
  POSTGRES_VERSION=$(postgres --version 2>/dev/null | head -1 || true)
  if [[ -n "${POSTGRES_VERSION}" ]]; then
    printf "   PostgreSQL: %s\n" "${POSTGRES_VERSION}"
  else
    printf "   PostgreSQL: installed (%s)\n" "${POSTGRES_PATH}"
  fi
else
  printf "   PostgreSQL: not initialized\n"
fi

printf "   Node/pnpm: managed by mise (run 'mise install' if needed)\n"
printf "   Python: managed by mise + uv\n"
printf "\n"

# Ensure user-local bin is on PATH so user-installed tools (just, etc.) are found
if [[ ":${PATH}:" != *":${HOME}/.local/bin:"* ]]; then
  export PATH="${HOME}/.local/bin:${PATH}"
  # Persist for this shell session (devbox will pick it up automatically)
fi

# Ensure supabase CLI is present or try to install it — this is a safe fallback
if ! command -v supabase >/dev/null 2>&1; then
  if [[ -x "${PWD}/scripts/install_supabase.sh" ]]; then
    echo "→ Supabase CLI not found. Attempting fallback installation..."
    bash "${PWD}/scripts/install_supabase.sh" || true
  else
    echo "→ Supabase CLI not present and no install helper found (scripts/install_supabase.sh)"
  fi
fi

# Idempotent install of `just` into ~/.local/bin if missing. This keeps the
# Devbox experience reproducible for contributors who don't have `just` preinstalled.
if ! command -v just >/dev/null 2>&1; then
  echo "just not found in PATH — installing to ~/.local/bin (user-local)"
  mkdir -p "${HOME}/.local/bin"
  # Try best-effort install; do not fail shell entry if install fails.
  if curl --proto '=https' --tlsv1.2 -sSf https://just.systems/install.sh | bash -s -- --to "${HOME}/.local/bin"; then
    export PATH="${HOME}/.local/bin:${PATH}"
    if command -v just >/dev/null 2>&1; then
      just_path=$(command -v just || true)
      if [[ -n "${just_path}" ]]; then
        echo "just installed: ${just_path}"
      else
        echo "just installed: not found"
      fi
    fi
  else
    echo "warning: failed to install just automatically. You can install it manually inside devbox:"
    echo "  curl --proto '=https' --tlsv1.2 -sSf https://just.systems/install.sh | bash -s -- --to ~/.local/bin"
  fi
fi
