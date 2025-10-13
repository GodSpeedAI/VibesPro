#!/usr/bin/env bash
# tests/ops/test_tracing_vector.sh
# Smoke test for Vector configuration validation

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")"/../.. && pwd)"
CONFIG_PATH="${REPO_ROOT}/ops/vector/vector.toml"

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "❌ Required command '$1' not found on PATH." >&2
    exit 1
  fi
}

require_cmd vector

if [[ ! -f "${CONFIG_PATH}" ]]; then
  echo "❌ Vector configuration missing at ${CONFIG_PATH}" >&2
  exit 1
fi

echo "🔍 Validating Vector configuration..."
if ! vector validate "${CONFIG_PATH}"; then
  echo "❌ Vector configuration validation failed" >&2
  exit 1
fi

echo "✅ Vector configuration is valid"
echo "✅ Phase 3: Vector configuration smoke test PASSED"
echo ""
echo "ℹ️  Note: This test only validates configuration syntax."
echo "ℹ️  Full OTLP integration tests are blocked pending OpenTelemetry upgrade."
echo "ℹ️  See: docs/work-summaries/observability-phase3-completion.md"

exit 0
