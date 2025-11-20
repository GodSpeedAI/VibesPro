#!/usr/bin/env bash
set -euo pipefail

# Validate the supabase overlay URL is pinned to a specific commit rather than
# 'nixpkgs-unstable.tar.gz'. This helps ensure reproducibility.
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
OVERLAY_FILE="${ROOT_DIR}/.devbox/overlays/supabase.nix"

if [[ ! -f "${OVERLAY_FILE}" ]]; then
  echo "ERROR: Overlay file not found: ${OVERLAY_FILE}" >&2
  exit 2
fi

if grep -q "nixpkgs-unstable.tar.gz" "${OVERLAY_FILE}"; then
  echo "ERROR: overlay uses nixpkgs-unstable.tar.gz. Pin to a specific commit for reproducibility." >&2
  exit 3
fi

echo "OK: supabase overlay is pinned (no 'nixpkgs-unstable.tar.gz' found)"
exit 0
