#!/usr/bin/env bash
# scripts/release/update-versions.sh
# Updates version in all manifest files

set -euo pipefail

RELEASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$RELEASE_DIR"

if [[ ! -f ".next-version" ]]; then
  echo "❌ .next-version not found. Run determine-version-bump.sh first."
  exit 1
fi

NEW_VERSION=$(cat .next-version)
echo "📦 Updating versions to $NEW_VERSION..."

UPDATED=0

# Update package.json
if [[ -f "package.json" ]]; then
  jq ".version = \"$NEW_VERSION\"" package.json > package.json.tmp
  mv package.json.tmp package.json
  echo "✅ Updated package.json"
  UPDATED=$((UPDATED + 1))
fi

# Update pyproject.toml
if [[ -f "pyproject.toml" ]]; then
  sed -i "s/^version = \".*\"/version = \"$NEW_VERSION\"/" pyproject.toml
  echo "✅ Updated pyproject.toml"
  UPDATED=$((UPDATED + 1))
fi

# Update Cargo.toml (if exists at root)
if [[ -f "Cargo.toml" ]]; then
  sed -i "s/^version = \".*\"/version = \"$NEW_VERSION\"/" Cargo.toml
  echo "✅ Updated Cargo.toml"
  UPDATED=$((UPDATED + 1))
fi

# Update README version badge (if exists)
if [[ -f "README.md" ]] && grep -q "version-.*-blue" README.md; then
  sed -i "s/version-[0-9]*\.[0-9]*\.[0-9]*-blue/version-$NEW_VERSION-blue/g" README.md
  echo "✅ Updated README.md version badge"
  UPDATED=$((UPDATED + 1))
fi

echo ""
echo "✅ Updated $UPDATED manifest files to version $NEW_VERSION"
