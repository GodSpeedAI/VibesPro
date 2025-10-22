#!/usr/bin/env bash
set -euo pipefail

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
