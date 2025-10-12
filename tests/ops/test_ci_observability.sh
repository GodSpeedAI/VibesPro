#!/usr/bin/env bash
# tests/ops/test_ci_observability.sh
# Phase 5: CI validation test
#
# This test verifies that the CI workflow properly validates Vector configuration
# after mise install, ensuring observability tools are checked in CI pipeline.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")"/../.. && pwd)"
WORKFLOW_FILE="${REPO_ROOT}/.github/workflows/env-check.yml"

echo "🔍 Phase 5: Testing CI observability validation..."

# Step 1: Check that workflow file exists
if [[ ! -f "${WORKFLOW_FILE}" ]]; then
  echo "❌ Workflow file not found at ${WORKFLOW_FILE}" >&2
  exit 1
fi

echo "  → Checking workflow structure..."

# Step 2: Verify Vector validation step exists
if ! grep -q "Validate Vector config" "${WORKFLOW_FILE}"; then
  echo "❌ 'Validate Vector config' step not found in CI workflow" >&2
  exit 1
fi

# Step 3: Verify Vector installation step exists
if ! grep -q "Install Vector" "${WORKFLOW_FILE}"; then
  echo "❌ 'Install Vector' step not found in CI workflow" >&2
  echo "   Vector must be installed before validation can occur" >&2
  exit 1
fi

# Step 4: Verify steps are in correct order (Install Vector → Install mise → Validate Vector)
# Extract line numbers for key steps
VECTOR_INSTALL_LINE=$(grep -n "name: Install Vector" "${WORKFLOW_FILE}" | head -n1 | cut -d: -f1)
MISE_INSTALL_LINE=$(grep -n "name: Install runtimes" "${WORKFLOW_FILE}" | head -n1 | cut -d: -f1)
VECTOR_VALIDATE_LINE=$(grep -n "name: Validate Vector config" "${WORKFLOW_FILE}" | head -n1 | cut -d: -f1)

if [[ -z "${VECTOR_INSTALL_LINE}" ]] || [[ -z "${MISE_INSTALL_LINE}" ]] || [[ -z "${VECTOR_VALIDATE_LINE}" ]]; then
  echo "❌ Could not find all required steps in workflow" >&2
  exit 1
fi

# Vector install should come before mise install
if (( VECTOR_INSTALL_LINE >= MISE_INSTALL_LINE )); then
  echo "❌ Vector installation must occur before mise install" >&2
  echo "   Found: Vector install at line ${VECTOR_INSTALL_LINE}, mise install at line ${MISE_INSTALL_LINE}" >&2
  exit 1
fi

# Vector validation should come after mise install
if (( VECTOR_VALIDATE_LINE <= MISE_INSTALL_LINE )); then
  echo "❌ Vector validation must occur after mise install" >&2
  echo "   Found: Vector validate at line ${VECTOR_VALIDATE_LINE}, mise install at line ${MISE_INSTALL_LINE}" >&2
  exit 1
fi

echo "  ✅ Steps in correct order: Install Vector (${VECTOR_INSTALL_LINE}) → mise install (${MISE_INSTALL_LINE}) → Validate Vector (${VECTOR_VALIDATE_LINE})"

# Step 5: Verify Vector cache step exists
if ! grep -q "cache.*vector" "${WORKFLOW_FILE}" && ! grep -q "Cache Vector" "${WORKFLOW_FILE}"; then
  echo "⚠️  Warning: No Vector cache step found in CI workflow" >&2
  echo "   Consider adding caching to speed up CI runs" >&2
fi

# Step 6: Verify validation command is correct
if ! grep -A 5 "name: Validate Vector config" "${WORKFLOW_FILE}" | grep -q "vector validate"; then
  echo "❌ Vector validation step does not run 'vector validate' command" >&2
  exit 1
fi

# Step 7: Verify config path is correct
if ! grep -A 5 "name: Validate Vector config" "${WORKFLOW_FILE}" | grep -q "ops/vector/vector.toml"; then
  echo "❌ Vector validation does not reference correct config path (ops/vector/vector.toml)" >&2
  exit 1
fi

echo "✅ Phase 5: CI observability validation test PASSED"
echo ""
echo "ℹ️  CI workflow validated:"
echo "   - Vector installation step present"
echo "   - Vector validation step present"
echo "   - Steps in correct order (Install → mise → Validate)"
echo "   - Correct config path referenced"
echo ""

exit 0
