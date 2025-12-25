#!/usr/bin/env bash
# scripts/release/determine-version-bump.sh
# Analyzes commits since last tag to determine semantic version bump

set -euo pipefail

CURRENT_VERSION=$(git describe --tags --abbrev=0 2>/dev/null || echo "v0.0.0")
CURRENT_VERSION=${CURRENT_VERSION#v} # Strip 'v' prefix

echo "📊 Analyzing commits since v$CURRENT_VERSION..."

# Get commits since last tag
COMMITS=$(git log "v$CURRENT_VERSION"..HEAD --oneline 2>/dev/null || git log --oneline)

if [[ -z "$COMMITS" ]]; then
  echo "⚠️  No commits since last tag"
  exit 1
fi

COMMIT_COUNT=$(echo "$COMMITS" | wc -l)
echo "   Found $COMMIT_COUNT commits"
echo ""

# Semantic commit analysis (case-insensitive)
BREAKING=$(echo "$COMMITS" | grep -iE "BREAKING[ -]CHANGE|^[a-f0-9]+ [a-z]+(\([^)]*\))?!:" || true)
FEAT=$(echo "$COMMITS" | grep -iE "^[a-f0-9]+ feat" || true)
FIX=$(echo "$COMMITS" | grep -iE "^[a-f0-9]+ (fix|perf)" || true)

# Determine bump type
if [[ -n "$BREAKING" ]]; then
  BUMP_TYPE="major"
  echo "🔴 MAJOR version bump required (breaking changes detected):"
  echo "$BREAKING" | head -5
  [[ $(echo "$BREAKING" | wc -l) -gt 5 ]] && echo "   ... and more"
elif [[ -n "$FEAT" ]]; then
  BUMP_TYPE="minor"
  echo "🟡 MINOR version bump required (new features detected):"
  echo "$FEAT" | head -5
  [[ $(echo "$FEAT" | wc -l) -gt 5 ]] && echo "   ... and more"
elif [[ -n "$FIX" ]]; then
  BUMP_TYPE="patch"
  echo "🟢 PATCH version bump required (fixes detected):"
  echo "$FIX" | head -5
  [[ $(echo "$FIX" | wc -l) -gt 5 ]] && echo "   ... and more"
else
  echo "⚠️  No conventional commits found. Defaulting to patch."
  echo "   Recent commits:"
  echo "$COMMITS" | head -5
  BUMP_TYPE="patch"
fi

echo ""

# Calculate new version
IFS='.' read -r MAJOR MINOR PATCH <<<"$CURRENT_VERSION"
# Handle edge case where version parts might be empty
MAJOR=${MAJOR:-0}
MINOR=${MINOR:-0}
PATCH=${PATCH:-0}

case "$BUMP_TYPE" in
  major)
    MAJOR=$((MAJOR + 1))
    MINOR=0
    PATCH=0
    ;;
  minor)
    MINOR=$((MINOR + 1))
    PATCH=0
    ;;
  patch)
    PATCH=$((PATCH + 1))
    ;;
esac

NEW_VERSION="$MAJOR.$MINOR.$PATCH"

# Store results for other scripts
RELEASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
echo "$NEW_VERSION" >"$RELEASE_DIR/.next-version"
echo "$BUMP_TYPE" >"$RELEASE_DIR/.bump-type"

echo "✅ Version bump: $CURRENT_VERSION → $NEW_VERSION ($BUMP_TYPE)"
echo ""
echo "   Stored in:"
echo "   - .next-version: $NEW_VERSION"
echo "   - .bump-type: $BUMP_TYPE"
