#!/usr/bin/env bash
# scripts/release/generate-changelog.sh
# Generates changelog entry from conventional commits

set -euo pipefail

RELEASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$RELEASE_DIR"

if [[ ! -f ".next-version" ]]; then
  echo "❌ .next-version not found. Run determine-version-bump.sh first."
  exit 1
fi

NEW_VERSION=$(cat .next-version)
CURRENT_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
RELEASE_DATE=$(date -u +"%Y-%m-%d")

echo "📝 Generating changelog for v$NEW_VERSION..."

# Get commits since last tag
if [[ -n "$CURRENT_TAG" ]]; then
  COMMIT_RANGE="${CURRENT_TAG}..HEAD"
else
  COMMIT_RANGE="HEAD"
fi

# Helper function to extract commits by type
get_commits_by_type() {
  local pattern="$1"
  git log "$COMMIT_RANGE" --oneline | grep -iE "$pattern" | sed 's/^[a-f0-9]* /- /' || true
}

# Generate sections
BREAKING=$(get_commits_by_type "BREAKING[ -]CHANGE|^[a-z]+(\([^)]*\))?!:")
FEATURES=$(get_commits_by_type "^feat")
FIXES=$(get_commits_by_type "^fix")
PERF=$(get_commits_by_type "^perf")
DOCS=$(get_commits_by_type "^docs")
CHORES=$(get_commits_by_type "^chore|^ci|^build|^refactor")

# Build changelog entry
CHANGELOG_ENTRY="## [$NEW_VERSION] - $RELEASE_DATE"

if [[ -n "$BREAKING" ]]; then
  CHANGELOG_ENTRY+=$'\n\n### Breaking Changes\n'"$BREAKING"
fi

if [[ -n "$FEATURES" ]]; then
  CHANGELOG_ENTRY+=$'\n\n### Added\n'"$FEATURES"
fi

if [[ -n "$FIXES" ]]; then
  CHANGELOG_ENTRY+=$'\n\n### Fixed\n'"$FIXES"
fi

if [[ -n "$PERF" ]]; then
  CHANGELOG_ENTRY+=$'\n\n### Performance\n'"$PERF"
fi

if [[ -n "$DOCS" ]]; then
  CHANGELOG_ENTRY+=$'\n\n### Documentation\n'"$DOCS"
fi

if [[ -n "$CHORES" ]]; then
  CHANGELOG_ENTRY+=$'\n\n### Changed\n'"$CHORES"
fi

# Add comparison link
REPO_URL=$(gh repo view --json url --jq '.url' 2>/dev/null || echo "https://github.com/OWNER/REPO")
if [[ -n "$CURRENT_TAG" ]]; then
  CHANGELOG_ENTRY+=$'\n\n'"**Full Changelog**: $REPO_URL/compare/$CURRENT_TAG...v$NEW_VERSION"
fi

# Insert at top of CHANGELOG.md (after header)
if [[ -f "CHANGELOG.md" ]]; then
  # Find the line number of the first ## heading
  FIRST_HEADING_LINE=$(grep -n "^## " CHANGELOG.md | head -1 | cut -d: -f1)

  if [[ -n "$FIRST_HEADING_LINE" ]]; then
    # Split file and insert new entry
    head -n $((FIRST_HEADING_LINE - 1)) CHANGELOG.md >CHANGELOG.md.new
    echo "" >>CHANGELOG.md.new
    echo "$CHANGELOG_ENTRY" >>CHANGELOG.md.new
    echo "" >>CHANGELOG.md.new
    tail -n +$FIRST_HEADING_LINE CHANGELOG.md >>CHANGELOG.md.new
    mv CHANGELOG.md.new CHANGELOG.md
  else
    # No existing entries, append after header
    echo "" >>CHANGELOG.md
    echo "$CHANGELOG_ENTRY" >>CHANGELOG.md
  fi
  echo "✅ Updated CHANGELOG.md"
else
  # Create new CHANGELOG.md
  cat >CHANGELOG.md <<EOF
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

$CHANGELOG_ENTRY
EOF
  echo "✅ Created CHANGELOG.md"
fi

echo ""
echo "📋 Changelog entry preview:"
echo "---"
echo "$CHANGELOG_ENTRY" | head -20
[[ $(echo "$CHANGELOG_ENTRY" | wc -l) -gt 20 ]] && echo "... (truncated)"
echo "---"
