#!/usr/bin/env bash
set -euo pipefail
. tests/env/helpers.sh

echo "Testing CI workflow configuration..."

# Test 1: env-check.yml workflow exists
echo "  ✓ Checking for .github/workflows/env-check.yml..."
assert_file_exists ".github/workflows/env-check.yml"

# Test 2: Workflow does NOT use direnv (CI should be explicit)
echo "  ✓ Ensuring workflow doesn't use direnv..."
if grep -q "direnv" .github/workflows/env-check.yml; then
  echo "    ❌ CI workflow should not use direnv (use explicit sops -d instead)"
  exit 1
fi

# Test 3: Workflow explicitly decrypts secrets with SOPS
echo "  ✓ Checking for explicit SOPS decryption..."
if ! grep -q -E "sops.*-d.*\\.secrets\\.env\\.sops" .github/workflows/env-check.yml; then
  echo "    ❌ CI workflow should decrypt secrets with a sops -d invocation (variations like 'sops -d .secrets.env.sops | source /dev/stdin' are acceptable)"
  exit 1
fi

# Test 4: Workflow installs mise
echo "  ✓ Checking for mise installation step..."
if ! grep -q "mise install" .github/workflows/env-check.yml && \
   ! grep -q "Install mise" .github/workflows/env-check.yml; then
  echo "    ❌ CI workflow should install mise and runtimes"
  exit 1
fi

# Test 5: Workflow uses devbox (optional but recommended)
echo "  ✓ Checking for devbox installation step..."
if ! grep -q "devbox" .github/workflows/env-check.yml && \
   ! grep -q "Install Devbox" .github/workflows/env-check.yml; then
  echo "    ⚠️  Warning: CI workflow doesn't explicitly use devbox (optional)"
fi

# Test 6: Workflow runs environment tests
echo "  ✓ Checking for test execution..."
if ! grep -q "just test" .github/workflows/env-check.yml && \
   ! grep -q "test-env" .github/workflows/env-check.yml; then
  echo "    ⚠️  Warning: CI workflow should run tests"
fi

# Test 7: Workflow uses SOPS_AGE_KEY secret
echo "  ✓ Checking for SOPS_AGE_KEY secret usage..."
if ! grep -q "SOPS_AGE_KEY" .github/workflows/env-check.yml; then
  echo "    ❌ CI workflow should use SOPS_AGE_KEY from GitHub secrets"
  exit 1
fi

# Test 8: Workflow cleans up secrets
echo "  ✓ Checking for secret cleanup..."
if ! grep -qE "(rm.*ci\.env|rm.*secrets|cleanup.*secret)" .github/workflows/env-check.yml; then
  echo "    ⚠️  Warning: CI workflow should clean up decrypted secrets"
fi

echo "CI workflow configuration test OK"
