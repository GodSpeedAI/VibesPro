#!/usr/bin/env bash
set -euo pipefail

# idempotent installer for the supabase CLI used for local DB migration and
# type generation. This script attempts multiple installation strategies in
# this order:
#  1) If pnpm/npm is present, use it to install the CLI globally (fast fallback)
#  2) Otherwise, download the latest prebuilt Linux binary release and install
#     it in the user-local bin dir (e.g. ~/.local/bin)
# It does not require sudo and is safe to run inside devbox.

DEST_DIR="${HOME}/.local/bin"
mkdir -p "${DEST_DIR}"

if command -v supabase >/dev/null 2>&1; then
  echo "✅ supabase already installed at: $(command -v supabase)"
  exit 0
fi

echo "⚙️  Trying to install supabase CLI..."

if command -v pnpm >/dev/null 2>&1; then
  echo "→ Using pnpm to install supabase globally (user-local)..."
  if pnpm add -g supabase@latest; then
    echo "✅ supabase installed via pnpm: $(command -v supabase)"
    exit 0
  else
    echo "⚠️  pnpm install failed, falling back..."
  fi
fi

if command -v npm >/dev/null 2>&1; then
  echo "→ Using npm to install supabase globally (user-local)..."
  if npm install -g supabase@latest --silent; then
    echo "✅ supabase installed via npm: $(command -v supabase)"
    exit 0
  else
    echo "⚠️  npm install failed, falling back..."
  fi
fi

# Fall back to downloading the latest GitHub binary release for Linux (amd64)
ASSET_URL=$(curl -sSf "https://api.github.com/repos/supabase/cli/releases/latest" | jq -r '.assets[] | select(.name | test("linux.*amd64|linux_amd64|linux-x86_64|linux-x64")) | .browser_download_url' | head -n1 || true)
if [[ -z "${ASSET_URL}" ]]; then
  echo "⚠️  Could not find a Supabase CLI release asset for Linux via the GitHub API."
  echo "✋ Please install the CLI manually or check your network/proxy settings."
  exit 2
fi

echo "→ Downloading supabase release from: ${ASSET_URL}"
tmpdir=$(mktemp -d)
trap 'rm -rf "${tmpdir}"' EXIT
curl -L --fail -sS "${ASSET_URL}" -o "${tmpdir}/supabase.tar.gz"
tar -xzf "${tmpdir}/supabase.tar.gz" -C "${tmpdir}"

if [[ -f "${tmpdir}/supabase" ]]; then
  echo "→ Installing binary to ${DEST_DIR}/supabase"
  mv "${tmpdir}/supabase" "${DEST_DIR}/supabase"
  chmod +x "${DEST_DIR}/supabase"
  echo "✅ supabase installed to ${DEST_DIR}/supabase"
  # Ensure we pick up user-local bin for this shell session
  if [[ ":${PATH}:" != *":${DEST_DIR}:"* ]]; then
    export PATH="${DEST_DIR}:${PATH}"
  fi
  exit 0
fi

echo "❌ Unsupported asset format or extraction failed. Please install supabase manually from: https://github.com/supabase/cli/releases"
exit 3
