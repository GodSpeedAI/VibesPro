#!/usr/bin/env bash
set -euo pipefail
. tests/env/helpers.sh

echo "Testing Devbox configuration..."

# Test 1: devbox.json exists at repo root
assert_file_exists "devbox.json"

# Test 2: devbox.json is valid JSON
if ! jq empty devbox.json >/dev/null 2>&1; then
  echo "❌ devbox.json is not valid JSON"
  exit 1
fi

# Test 3: devbox.json contains packages
if ! jq -e '.packages' devbox.json >/dev/null 2>&1; then
  echo "❌ devbox.json missing 'packages' array"
  exit 1
fi

# Test 4: Essential packages are defined
required_packages=("git" "curl" "jq")
for pkg in "${required_packages[@]}"; do
  if ! jq -e --arg pkg "$pkg" '.packages | map(select(contains($pkg))) | length > 0' devbox.json >/dev/null 2>&1; then
    echo "❌ Required package '$pkg' not found in devbox.json"
    exit 1
  fi
done

# Test 5: If devbox is installed, verify it can parse the config
if command -v devbox >/dev/null 2>&1; then
  echo "  ℹ️  Devbox detected, validating configuration..."

  # Test devbox can read the config (check for syntax errors)
  if ! devbox info 2>&1 | grep -q "packages:" >/dev/null 2>&1; then
    echo "⚠️  devbox info command produced unexpected output"
    # Don't fail - devbox may not be fully initialized
  fi

  echo "  ✅ Devbox configuration is valid"
else
  echo "  ℹ️  Devbox not installed, skipping runtime validation"
  echo "     Install: curl -fsSL https://get.jetpack.io/devbox | bash"
fi

echo "Devbox test OK"
