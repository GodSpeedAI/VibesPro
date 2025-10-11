#!/usr/bin/env bash
set -euo pipefail

echo "🔎 Running environment tests in tests/env"

shopt -s nullglob 2>/dev/null || true
tests=(tests/env/test_*.sh)
if [ ${#tests[@]} -eq 0 ]; then
  echo "⚠️  No env tests found (look for tests/env/test_*.sh)" >&2
  exit 0
fi

for t in "${tests[@]}"; do
  echo "--- Running $t ---"
  bash "$t"
done

echo "✅ All env tests passed"
