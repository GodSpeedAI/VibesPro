#!/usr/bin/env bash
# Wrapper to run the relocated binary size tracker in CI
# Traceability: DEV-ADR-019, AI_ADR-006

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "${SCRIPT_DIR}/dev/track-binary-size.sh" "$@"
