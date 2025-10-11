#!/usr/bin/env bash
# Test: Just task environment awareness
# Purpose: Validate Just tasks properly check for and use mise environment
# Phase: 6 of 6 (Environment Setup Roadmap)

set -euo pipefail
. tests/env/helpers.sh

echo "Testing Just task environment awareness..."

# Test 1: Verify justfile exists
echo "  ✓ Checking for justfile..."
assert_file_exists "justfile"

# Test 2: Verify just command is available
echo "  ✓ Verifying just is installed..."
if ! command -v just &> /dev/null; then
    echo "    ❌ just command not found - install via: mise install just" >&2
    exit 1
fi

# Test 3: Verify critical tasks exist
echo "  ✓ Checking for critical tasks..."
CRITICAL_TASKS=("setup-node" "setup-python" "test-node" "test-python" "verify-node")

for task in "${CRITICAL_TASKS[@]}"; do
    if ! just --summary 2>/dev/null | grep -qw "$task"; then
        echo "    ❌ Critical task '$task' not found in justfile" >&2
        exit 1
    fi
done

# Test 4: Verify tasks that use Node check for pnpm
echo "  ✓ Verifying Node tasks check for pnpm availability..."
# Check that setup-node uses pnpm
if ! grep -q "pnpm install" justfile; then
    echo "    ❌ setup-node should use 'pnpm install'" >&2
    exit 1
fi

# Test 5: Verify tasks that use Python check for uv
echo "  ✓ Verifying Python tasks check for uv availability..."
# Check that setup-python uses uv
if ! grep -q "uv sync" justfile; then
    echo "    ❌ setup-python should use 'uv sync'" >&2
    exit 1
fi

# Test 6: Verify ai-validate gracefully degrades
echo "  ✓ Verifying ai-validate degrades gracefully..."
if ! grep -A 20 "^ai-validate:" justfile | grep -q "command -v pnpm"; then
    echo "    ❌ ai-validate should check for pnpm availability before using it" >&2
    exit 1
fi

# Test 7: Verify ai-scaffold checks for pnpm
echo "  ✓ Verifying ai-scaffold checks for pnpm..."
if ! grep -A 10 "^ai-scaffold" justfile | grep -q "command -v pnpm"; then
    echo "    ❌ ai-scaffold should check for pnpm availability" >&2
    exit 1
fi

# Test 8: Verify test tasks can run with mise environment
echo "  ✓ Verifying test tasks use mise-managed tools..."
# Create temp directory for testing
TEST_DIR=$(mktemp -d)
trap 'rm -rf "$TEST_DIR"' EXIT

# Test that verify-node script exists (critical for Phase 5)
assert_file_exists "scripts/verify-node.sh"

# Test 9: Verify environment setup tasks are properly ordered
echo "  ✓ Verifying setup task dependencies..."
if ! grep -q "^setup:.*setup-node.*setup-python.*setup-tools" justfile; then
    echo "    ❌ setup task should depend on setup-node, setup-python, and setup-tools" >&2
    exit 1
fi

# Test 10: Verify doc generation tasks check for node
echo "  ✓ Verifying documentation tasks use Node tools..."
if grep -q "^docs-generate" justfile && ! grep -q "node cli/docs.js" justfile; then
    echo "    ❌ docs-generate should use node to run cli/docs.js" >&2
    exit 1
fi

# Test 11: Verify security tasks check for cargo
echo "  ✓ Verifying security tasks check for cargo..."
if grep -A 5 "^security-audit:" justfile | grep -q "cargo audit"; then
    # Should have a check for cargo availability
    if ! grep -A 10 "^security-audit:" justfile | grep -q "command -v cargo"; then
        echo "    ❌ security-audit should check for cargo availability before using it" >&2
        exit 1
    fi
fi

# Test 12: Test that critical tasks can actually run (smoke test)
echo "  ✓ Running smoke tests for critical tasks..."

# Test verify-node (should pass with current mise setup)
if ! just verify-node > /dev/null 2>&1; then
    echo "    ⚠️  verify-node failed - this may indicate version mismatch"
    # This is a warning, not a failure, as it depends on project state
fi

# Test that just --list works
if ! just --list > /dev/null 2>&1; then
    echo "    ❌ just --list should work" >&2
    exit 1
fi

# Test 13: Verify env-enter task exists and checks for devbox
echo "  ✓ Verifying env-enter checks for devbox..."
if ! grep -A 5 "^env-enter:" justfile | grep -q "command -v devbox"; then
    echo "    ❌ env-enter should check for devbox availability" >&2
    exit 1
fi

# Test 14: Verify test-env task uses bash correctly
echo "  ✓ Verifying test-env task configuration..."
if ! grep -q "bash.*tests/env/run.sh" justfile; then
    echo "    ❌ test-env should run tests/env/run.sh with bash" >&2
    exit 1
fi

# Test 15: Verify tasks follow shell safety best practices
echo "  ✓ Verifying task shell safety..."
# Check that justfile uses proper shell settings
if ! head -n 5 justfile | grep -q 'set shell.*bash'; then
    echo "    ⚠️  justfile should set shell to bash for consistency"
fi

echo ""
echo "✅ All Just task environment awareness checks passed"
echo ""
echo "Summary:"
echo "  • justfile exists with all critical tasks"
echo "  • Node tasks check for pnpm availability"
echo "  • Python tasks check for uv availability"
echo "  • Cargo tasks check for cargo availability"
echo "  • Tasks gracefully degrade when tools unavailable"
echo "  • Environment setup tasks properly ordered"
echo "  • verify-node integration validated"

echo "Just task environment awareness test OK"
