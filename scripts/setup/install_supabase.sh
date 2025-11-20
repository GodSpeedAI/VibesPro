#!/usr/bin/env bash
set -euo pipefail

# Simplified Supabase CLI installer
# Installs a specific version of the Supabase CLI binary

SUPABASE_VERSION="${SUPABASE_VERSION:-1.145.4}"
DEST_DIR="${HOME}/.local/bin"
mkdir -p "${DEST_DIR}"

if command -v supabase >/dev/null 2>&1; then
  # Attempt to get version, might fail if output format changes, so be lenient
  CURRENT_VERSION=$(supabase --version 2>/dev/null | head -n1 | awk '{print $2}' || echo "unknown")
  if [[ "${CURRENT_VERSION}" == "${SUPABASE_VERSION}" ]]; then
    SUPABASE_BIN=$(command -v supabase)
    echo "✅ supabase ${SUPABASE_VERSION} already installed at: ${SUPABASE_BIN}"
    exit 0
  fi
  echo "⚠️  supabase version mismatch (current: ${CURRENT_VERSION}, expected: ${SUPABASE_VERSION}). Reinstalling..."
fi

echo "⚙️  Installing supabase CLI v${SUPABASE_VERSION}..."

OS="$(uname -s)"
ARCH="$(uname -m)"

case "${OS}" in
    Linux)
        PLATFORM="linux"
        ;;
    Darwin)
        PLATFORM="darwin"
        ;;
    *)
        echo "❌ Unsupported OS: ${OS}"
        exit 1
        ;;
esac

case "${ARCH}" in
    x86_64)
        ARCH="amd64"
        ;;
    arm64|aarch64)
        ARCH="arm64"
        ;;
    *)
        echo "❌ Unsupported architecture: ${ARCH}"
        exit 1
        ;;
esac

FILE_NAME="supabase_${PLATFORM}_${ARCH}.tar.gz"
DOWNLOAD_URL="https://github.com/supabase/cli/releases/download/v${SUPABASE_VERSION}/${FILE_NAME}"

echo "→ Downloading from: ${DOWNLOAD_URL}"
tmpdir=$(mktemp -d)
trap 'rm -rf "${tmpdir}"' EXIT

if ! curl -fSL --retry 3 --retry-delay 2 -o "${tmpdir}/${FILE_NAME}" "${DOWNLOAD_URL}"; then
    echo "❌ Failed to download supabase CLI"
    exit 1
fi

tar -xzf "${tmpdir}/${FILE_NAME}" -C "${tmpdir}"

if [[ -f "${tmpdir}/supabase" ]]; then
  echo "→ Installing binary to ${DEST_DIR}/supabase"
  mv "${tmpdir}/supabase" "${DEST_DIR}/supabase"
  chmod +x "${DEST_DIR}/supabase"
  echo "✅ supabase installed to ${DEST_DIR}/supabase"
  exit 0
else
  echo "❌ Extraction failed or binary not found in archive"
  exit 1
fi
