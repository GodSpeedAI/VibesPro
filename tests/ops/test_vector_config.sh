#!/usr/bin/env bash
#
# Validate the local Vector configuration used for ingesting OTLP traffic.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")"/../.. && pwd)"
CONFIG_PATH="${1:-${REPO_ROOT}/ops/vector/vector.toml}"

if ! command -v vector >/dev/null 2>&1; then
  echo "❌ vector binary not found on PATH. Install from https://vector.dev/ before running this check." >&2
  exit 1
fi

if [[ ! -f "${CONFIG_PATH}" ]]; then
  echo "❌ Vector configuration not found at ${CONFIG_PATH}" >&2
  exit 1
fi

# Ensure Vector's data directory exists before validation to avoid false negatives.
DATA_DIR=$(grep -E '^\s*data_dir\s*=' "${CONFIG_PATH}" | head -n1 | sed -E 's/^\s*data_dir\s*=\s*"([^"]*)".*/\1/' || true)
if [[ -n "${DATA_DIR}" ]]; then
  if [[ "${DATA_DIR}" = /* ]]; then
    mkdir -p "${DATA_DIR}"
  else
    mkdir -p "${REPO_ROOT}/${DATA_DIR}"
  fi
fi

echo "🔍 Validating Vector configuration at ${CONFIG_PATH}..."
vector validate "${CONFIG_PATH}"
echo "✅ Vector configuration is valid."
