#!/usr/bin/env bash
set -euo pipefail

# Check that the supabase overlay is present and referenced by devbox.json
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
OVERLAY_PATH="${ROOT_DIR}/.devbox/overlays/supabase.nix"
DEVBOX_JSON="${ROOT_DIR}/devbox.json"

if [[ ! -f "${OVERLAY_PATH}" ]]; then
  echo "ERROR: Overlay file not found: ${OVERLAY_PATH}" >&2
  exit 2
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "WARN: jq not found. Skipping devbox.json validation; overlay file exists." >&2
  exit 0
fi

overlay_present=$(jq -r '.nix.overlays // [] | index("./.devbox/overlays/supabase.nix")' "${DEVBOX_JSON}" || true)
if [[ "${overlay_present}" == "null" || -z "${overlay_present}" ]]; then
  echo "ERROR: devbox.json does not reference overlay './.devbox/overlays/supabase.nix'" >&2
  exit 3
fi

echo "OK: supabase overlay exists and is referenced in devbox.json"
exit 0
