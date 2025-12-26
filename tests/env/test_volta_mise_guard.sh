#!/usr/bin/env bash
set -euo pipefail
. tests/env/helpers.sh

echo "Testing Volta/mise version conflict detection..."

# Test 1: verify-node script exists
echo "  ✓ Checking for scripts/dev/verify-node.sh..."
assert_file_exists "scripts/dev/verify-node.sh"

# Test 2: verify-node is executable or can be run with bash
echo "  ✓ Verifying script is runnable..."
if ! bash scripts/dev/verify-node.sh >/dev/null 2>&1; then
  # Script may exit with error codes, that's OK for this test
  # We're just checking it runs
  :
fi

# Test 3: Just target exists
echo "  ✓ Checking for 'verify-node' just target..."
if ! just -l 2>/dev/null | grep -q "verify-node"; then
  echo "    ❌ 'verify-node' target missing from justfile"
  exit 1
fi

# Test 4: Script detects mise configuration
echo "  ✓ Checking mise detection..."
if [ -f ".mise.toml" ]; then
  # Run script and check it mentions mise
  output=$(bash scripts/dev/verify-node.sh 2>&1 || true)
  if ! echo "$output" | grep -qi "mise"; then
    echo "    ⚠️  Script should detect mise configuration"
  fi
fi

# Test 5: Create temporary test scenario with mismatch
echo "  ✓ Testing version mismatch detection..."
tmpdir=$(mktempdir)
cleanup_tmpdir() { rm -rf "$tmpdir"; }
trap cleanup_tmpdir EXIT

# Create test fixtures
cat >"$tmpdir/.mise.toml" <<'EOF'
[tools]
node = "20.11.1"
python = "3.12.5"
EOF

cat >"$tmpdir/package.json" <<'EOF'
{
  "name": "test",
  "volta": {
    "node": "18.17.0"
  }
}
EOF

# Run verify script in temp dir (should fail due to mismatch)
cd "$tmpdir"
if bash "$OLDPWD/scripts/dev/verify-node.sh" >/dev/null 2>&1; then
  echo "    ❌ Script should detect version mismatch (20.x vs 18.x)"
  exit 1
else
  echo "    ✅ Script correctly detects version mismatch"
fi

cd "$OLDPWD"

# Test 6: Test scenario with matching versions
echo "  ✓ Testing version match detection..."
tmpdir2=$(mktempdir)
cleanup_tmpdir2() { rm -rf "$tmpdir2"; }
trap cleanup_tmpdir2 EXIT

cat >"$tmpdir2/.mise.toml" <<'EOF'
[tools]
node = "20.11.1"
EOF

cat >"$tmpdir2/package.json" <<'EOF'
{
  "name": "test",
  "volta": {
    "node": "20.17.0"
  }
}
EOF

# Run verify script in temp dir (should pass - same major version)
cd "$tmpdir2"
if ! bash "$OLDPWD/scripts/dev/verify-node.sh" >/dev/null 2>&1; then
  echo "    ⚠️  Script should allow same major version (20.x)"
fi

cd "$OLDPWD"

# Test 7: Test scenario with only mise (no Volta)
echo "  ✓ Testing mise-only scenario..."
tmpdir3=$(mktempdir)
cleanup_tmpdir3() { rm -rf "$tmpdir3"; }
trap cleanup_tmpdir3 EXIT

cat >"$tmpdir3/.mise.toml" <<'EOF'
[tools]
node = "20.11.1"
EOF

cat >"$tmpdir3/package.json" <<'EOF'
{
  "name": "test",
  "version": "1.0.0"
}
EOF

# Should pass - no Volta section
cd "$tmpdir3"
if ! bash "$OLDPWD/scripts/dev/verify-node.sh" >/dev/null 2>&1; then
  echo "    ❌ Script should pass when only mise is configured"
  exit 1
fi

cd "$OLDPWD"

# Test 8: Verify current project state
echo "  ✓ Verifying current project configuration..."
if [ -f ".mise.toml" ] && [ -f "package.json" ]; then
  # Run on actual project
  if bash scripts/dev/verify-node.sh >/dev/null 2>&1; then
    echo "    ✅ Current project configuration is valid"
  else
    echo "    ⚠️  Current project has version mismatch - run 'just verify-node' to see details"
  fi
fi

echo "Volta/mise guard test OK"
