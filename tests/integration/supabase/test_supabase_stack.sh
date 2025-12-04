#!/usr/bin/env bash
# Integration test for Supabase local stack
# Tests the full lifecycle: start, migrate, seed, generate types, stop
#
# DEV-SDS-020: End-to-End Type Safety Pipeline
#
# Usage:
#   ./test_supabase_stack.sh
#
# Prerequisites:
#   - Docker and Docker Compose installed
#   - just command available
#   - psql command available

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_test() {
    echo -e "\n${YELLOW}[TEST]${NC} $1"
}

pass_test() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((TESTS_PASSED++))
}

fail_test() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((TESTS_FAILED++))
}

# Cleanup function
cleanup() {
    log_info "Cleaning up..."
    cd "$REPO_ROOT"
    just supabase-stop 2>/dev/null || true
}

# Set trap for cleanup on exit
trap cleanup EXIT

cd "$REPO_ROOT"

# Test 1: Check prerequisites
log_test "Checking prerequisites..."
if command -v docker &> /dev/null; then
    pass_test "Docker is installed"
else
    fail_test "Docker is not installed"
    exit 1
fi

if docker compose version &> /dev/null; then
    pass_test "Docker Compose is available"
else
    fail_test "Docker Compose is not available"
    exit 1
fi

if command -v just &> /dev/null; then
    pass_test "just is installed"
else
    fail_test "just is not installed"
    exit 1
fi

if command -v psql &> /dev/null; then
    pass_test "psql is installed"
else
    log_warn "psql not installed - some tests will be skipped"
fi

# Test 2: Start Supabase stack
log_test "Starting Supabase stack..."
if just supabase-start 2>&1; then
    pass_test "Supabase stack started successfully"
else
    fail_test "Failed to start Supabase stack"
    exit 1
fi

# Wait for services to be fully ready
sleep 5

# Test 3: Check Supabase status
log_test "Checking Supabase status..."
STATUS_OUTPUT=$(just supabase-status 2>&1)
if echo "$STATUS_OUTPUT" | grep -q "vibespro-supabase-db"; then
    pass_test "Database container is running"
else
    fail_test "Database container is not running"
fi

if echo "$STATUS_OUTPUT" | grep -q "vibespro-supabase-meta"; then
    pass_test "Meta container is running"
else
    fail_test "Meta container is not running"
fi

# Test 4: Run migrations
log_test "Running database migrations..."
if just db-migrate 2>&1; then
    pass_test "Migrations applied successfully"
else
    fail_test "Failed to apply migrations"
fi

# Test 5: Verify tables exist
log_test "Verifying database tables..."
if command -v psql &> /dev/null; then
    TABLES=$(PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -t -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;" 2>/dev/null | tr -d ' ')
    
    if echo "$TABLES" | grep -q "users"; then
        pass_test "Users table exists"
    else
        fail_test "Users table not found"
    fi
    
    if echo "$TABLES" | grep -q "profiles"; then
        pass_test "Profiles table exists"
    else
        fail_test "Profiles table not found"
    fi
    
    if echo "$TABLES" | grep -q "projects"; then
        pass_test "Projects table exists"
    else
        fail_test "Projects table not found"
    fi
    
    if echo "$TABLES" | grep -q "project_members"; then
        pass_test "Project_members table exists"
    else
        fail_test "Project_members table not found"
    fi
else
    log_warn "Skipping table verification (psql not available)"
fi

# Test 6: Seed database
log_test "Seeding database..."
if just db-seed 2>&1; then
    pass_test "Database seeded successfully"
else
    fail_test "Failed to seed database"
fi

# Test 7: Verify seed data
log_test "Verifying seed data..."
if command -v psql &> /dev/null; then
    USER_COUNT=$(PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -t -c "SELECT COUNT(*) FROM public.users;" 2>/dev/null | tr -d ' ')
    
    if [ "$USER_COUNT" -ge 1 ]; then
        pass_test "Seed data present ($USER_COUNT users)"
    else
        fail_test "No seed data found"
    fi
else
    log_warn "Skipping seed verification (psql not available)"
fi

# Test 8: Generate TypeScript types
log_test "Generating TypeScript types..."
if just gen-types-ts 2>&1; then
    pass_test "TypeScript types generated"
else
    fail_test "Failed to generate TypeScript types"
fi

# Test 9: Verify TypeScript types file
log_test "Verifying TypeScript types file..."
TS_FILE="libs/shared/types/src/database.types.ts"
if [ -f "$TS_FILE" ]; then
    pass_test "TypeScript types file exists"
    
    if grep -q "interface Users" "$TS_FILE"; then
        pass_test "Users interface found in types"
    else
        fail_test "Users interface not found"
    fi
    
    if grep -q "interface Profiles" "$TS_FILE"; then
        pass_test "Profiles interface found in types"
    else
        fail_test "Profiles interface not found"
    fi
    
    if grep -q "interface Database" "$TS_FILE"; then
        pass_test "Database namespace found in types"
    else
        fail_test "Database namespace not found"
    fi
else
    fail_test "TypeScript types file does not exist"
fi

# Test 10: Generate Python types
log_test "Generating Python types..."
if just gen-types-py 2>&1; then
    pass_test "Python types generated"
else
    fail_test "Failed to generate Python types"
fi

# Test 11: Verify Python types file
log_test "Verifying Python types file..."
PY_FILE="libs/shared/types-py/src/models.py"
if [ -f "$PY_FILE" ]; then
    pass_test "Python types file exists"
    
    if grep -q "class Users" "$PY_FILE"; then
        pass_test "Users class found in Python models"
    else
        fail_test "Users class not found"
    fi
    
    if grep -q "class Profiles" "$PY_FILE"; then
        pass_test "Profiles class found in Python models"
    else
        fail_test "Profiles class not found"
    fi
else
    fail_test "Python types file does not exist"
fi

# Test 12: Stop Supabase stack
log_test "Stopping Supabase stack..."
if just supabase-stop 2>&1; then
    pass_test "Supabase stack stopped"
else
    fail_test "Failed to stop Supabase stack"
fi

# Summary
echo ""
echo "============================================"
echo "Test Summary"
echo "============================================"
echo -e "Passed: ${GREEN}${TESTS_PASSED}${NC}"
echo -e "Failed: ${RED}${TESTS_FAILED}${NC}"
echo ""

if [ "$TESTS_FAILED" -gt 0 ]; then
    log_error "Some tests failed!"
    exit 1
else
    log_info "All tests passed!"
    exit 0
fi
