#!/usr/bin/env bash
# Compatibility wrapper for relocated decrypt script.
# Delegate to scripts/ci/decrypt-ci-env.sh if present.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET="${SCRIPT_DIR}/ci/decrypt-ci-env.sh"

if [[ -x "${TARGET}" ]]; then
  exec "${TARGET}" "$@"
fi

echo "decrypt-ci-env: missing target script at ${TARGET}" >&2
exit 127
