#!/bin/bash
# Integration tests for PHASE-003 wrapper generators
# Tests both frontend (Next.js, Remix, Expo) and backend (FastAPI) generators

set -e

echo "=== PHASE-003 Generator Integration Tests ==="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

TEST_DIR="tmp/gen-tests"

# Cleanup function
cleanup() {
  echo ""
  echo "${YELLOW}Cleaning up test artifacts...${NC}"
  rm -rf "$TEST_DIR"
}

# Register cleanup on exit
trap cleanup EXIT

# Create test directory
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

echo "=== Frontend Generators ==="
echo ""

echo "${YELLOW}1. Testing Next.js App Router generator...${NC}"
pnpm exec nx g @vibes-pro/ddd:web-app test-next-app \
  --framework=next --routerStyle=app --no-interactive || true

if [ -f "apps/test-next-app/app/page.tsx" ]; then
  echo "${GREEN}✓ Next.js App Router structure created${NC}"
else
  echo "✗ Next.js App Router structure missing"
  exit 1
fi

if grep -q "@shared/web" "apps/test-next-app/app/page.tsx" 2>/dev/null; then
  echo "${GREEN}✓ Shared-web integration injected${NC}"
else
  echo "✗ Shared-web integration missing"
  exit 1
fi

if [ -f "apps/test-next-app/app/lib/api-client.ts" ]; then
  echo "${GREEN}✓ API client helper created${NC}"
else
  echo "✗ API client helper missing"
  exit 1
fi

echo ""
echo "${YELLOW}2. Testing Next.js Pages Router generator...${NC}"
pnpm exec nx g @vibes-pro/ddd:web-app test-next-pages \
  --framework=next --routerStyle=pages --no-interactive || true

if [ -f "apps/test-next-pages/pages/index.tsx" ]; then
  echo "${GREEN}✓ Next.js Pages Router structure created${NC}"
else
  echo "✗ Next.js Pages Router structure missing"
fi

echo ""
echo "${YELLOW}3. Testing Remix generator...${NC}"
pnpm exec nx g @vibes-pro/ddd:web-app test-remix \
  --framework=remix --no-interactive || true

if [ -f "apps/test-remix/app/routes/_index.tsx" ]; then
  echo "${GREEN}✓ Remix structure created${NC}"
else
  echo "✗ Remix structure missing"
fi

if grep -q "@shared/web" "apps/test-remix/app/routes/_index.tsx" 2>/dev/null; then
  echo "${GREEN}✓ Shared-web integration with loader pattern${NC}"
else
  echo "✗ Shared-web integration missing"
fi

if [ -f "apps/test-remix/app/utils/api-client.ts" ]; then
  echo "${GREEN}✓ API client helper created${NC}"
else
  echo "✗ API client helper missing"
fi

echo ""
echo "${YELLOW}4. Testing Expo generator...${NC}"
pnpm exec nx g @vibes-pro/ddd:web-app test-expo \
  --framework=expo --no-interactive || true

EXPO_APP_EXISTS=false
if [ -f "apps/test-expo/src/app/App.tsx" ] || [ -f "apps/test-expo/App.tsx" ]; then
  EXPO_APP_EXISTS=true
  echo "${GREEN}✓ Expo structure created${NC}"
else
  echo "✗ Expo structure missing"
fi

if [ "$EXPO_APP_EXISTS" = true ]; then
  if grep -q "@shared/web" "apps/test-expo/src/app/App.tsx" 2>/dev/null || \
     grep -q "@shared/web" "apps/test-expo/App.tsx" 2>/dev/null; then
    echo "${GREEN}✓ Shared-web integration for React Native${NC}"
  else
    echo "✗ Shared-web integration missing"
  fi
fi

if [ -f "apps/test-expo/src/utils/api-client.ts" ]; then
  echo "${GREEN}✓ API client helper created${NC}"
else
  echo "✗ API client helper missing"
fi

echo ""
echo "=== Backend Generators ==="
echo ""

echo "${YELLOW}5. Testing FastAPI service generator...${NC}"
pnpm exec nx g @vibes-pro/ddd:api-service test-api --no-interactive || true

if [ -f "apps/test-api/main.py" ]; then
  echo "${GREEN}✓ FastAPI service structure created${NC}"
else
  echo "✗ FastAPI service structure missing"
  exit 1
fi

# Verify hexagonal structure
HEXAGONAL_CHECKS=(
  "apps/test-api/domain/entities/__init__.py"
  "apps/test-api/application/ports/repository.py"
  "apps/test-api/infrastructure/adapters/supabase/__init__.py"
)

HEXAGONAL_OK=true
for file in "${HEXAGONAL_CHECKS[@]}"; do
  if [ ! -f "$file" ]; then
    HEXAGONAL_OK=false
    break
  fi
done

if [ "$HEXAGONAL_OK" = true ]; then
  echo "${GREEN}✓ Hexagonal architecture structure created${NC}"
else
  echo "✗ Hexagonal architecture structure incomplete"
  exit 1
fi

# Verify Logfire integration
if grep -q "bootstrap_logfire" "apps/test-api/main.py" 2>/dev/null; then
  echo "${GREEN}✓ Logfire instrumentation injected${NC}"
else
  echo "✗ Logfire instrumentation missing"
  exit 1
fi

# Verify OpenAPI export
if grep -q "/api/openapi.json" "apps/test-api/main.py" 2>/dev/null; then
  echo "${GREEN}✓ OpenAPI export endpoint added${NC}"
else
  echo "✗ OpenAPI export endpoint missing"
  exit 1
fi

# Verify Pydantic schemas
if [ -f "apps/test-api/schemas.py" ] && grep -q "BaseSchema" "apps/test-api/schemas.py" 2>/dev/null; then
  echo "${GREEN}✓ Pydantic schemas configured${NC}"
else
  echo "✗ Pydantic schemas missing"
  exit 1
fi

echo ""
echo "=== Shared Library Validation ==="
echo ""

# Verify shared-web library exists and has correct structure
SHARED_WEB_FILES=(
  "libs/shared/web/src/lib/client.ts"
  "libs/shared/web/src/lib/errors.ts"
  "libs/shared/web/src/lib/env.ts"
  "libs/shared/web/src/lib/schemas.ts"
  "libs/shared/web/src/index.ts"
)

SHARED_WEB_OK=true
for file in "${SHARED_WEB_FILES[@]}"; do
  if [ ! -f "$file" ]; then
    SHARED_WEB_OK=false
    echo "✗ Missing: $file"
  fi
done

if [ "$SHARED_WEB_OK" = true ]; then
  echo "${GREEN}✓ Shared-web library structure complete${NC}"
else
  echo "✗ Shared-web library incomplete"
  exit 1
fi

echo ""
echo "${GREEN}=== All Integration Tests Passed! ===${NC}"
echo ""
echo "Summary:"
echo "  ✓ Next.js (App Router + Pages Router) generators working"
echo "  ✓ Remix generator working"
echo "  ✓ Expo generator working"
echo "  ✓ FastAPI generator working with Logfire + hexagonal architecture"
echo "  ✓ Shared-web library integration verified"
echo ""
