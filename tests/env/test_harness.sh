#!/usr/bin/env bash
set -euo pipefail
. tests/env/helpers.sh

echo "Testing harness discovery..."

# Create a temp directory with test files
tmpdir=$(mktempdir)
cleanup() { rm -rf "$tmpdir"; }
trap cleanup EXIT

# Setup minimal test structure
mkdir -p "$tmpdir/tests/env"
cp tests/env/helpers.sh "$tmpdir/tests/env/"
cp tests/env/run.sh "$tmpdir/tests/env/"

# Create a dummy test that will succeed
cat >"$tmpdir/tests/env/test_dummy.sh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail
. tests/env/helpers.sh
echo "Dummy test running"
EOF
chmod +x "$tmpdir/tests/env/test_dummy.sh"

# Run the harness from temp dir
cd "$tmpdir"
output=$(bash tests/env/run.sh 2>&1)

# Verify it discovered and ran the test
echo "$output" | grep -q "test_dummy.sh" || {
  echo "❌ Harness did not discover test_dummy.sh"
  exit 1
}

echo "$output" | grep -q "Dummy test running" || {
  echo "❌ Harness did not execute test_dummy.sh"
  exit 1
}

echo "$output" | grep -q "All env tests passed" || {
  echo "❌ Harness did not report success"
  exit 1
}

echo "Harness discovery test OK"
