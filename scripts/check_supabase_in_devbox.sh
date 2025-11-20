#!/usr/bin/env bash
set -euo pipefail

# Check for supabase availability inside Devbox shell
if ! command -v devbox >/dev/null 2>&1; then
  echo "devbox not installed — run: curl -fsSL https://get.jetpack.io/devbox | bash"
  exit 2
fi

echo "🔎 Checking supabase inside devbox..."
if devbox run -- supabase --version >/dev/null 2>&1; then
  echo "✅ supabase is available in devbox";
  devbox run -- supabase --version || true
  exit 0
else
  echo "⚠️  supabase not available inside devbox. You can run: just devbox-fix && DEVBOX_DEBUG=1 devbox update && devbox shell";
  exit 1
fi
