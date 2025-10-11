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
echo "   PostgreSQL: $(command -v postgres >/dev/null 2>&1 && postgres --version | head -1 || echo 'not initialized')"
echo "   Node/pnpm: managed by mise (run 'mise install' if needed)"
echo "   Python: managed by mise + uv"
echo ""
