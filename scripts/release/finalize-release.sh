#!/usr/bin/env bash
# scripts/release/finalize-release.sh
# Post-merge finalization: tag, GitHub release, sync branches

set -euo pipefail

RELEASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$RELEASE_DIR"

if [[ ! -f ".next-version" ]]; then
  echo "❌ .next-version not found. Run the release process from the beginning."
  exit 1
fi

NEW_VERSION=$(cat .next-version)
RELEASE_BRANCH="release/v$NEW_VERSION"

echo "🏁 Finalizing release v$NEW_VERSION..."

# 1. Fetch latest and verify release merged to main
git fetch origin main --quiet
git fetch origin dev --quiet

# Check if the release PR was merged
MAIN_LOG=$(git log origin/main --oneline -5)
if ! echo "$MAIN_LOG" | grep -q "v$NEW_VERSION"; then
  echo "❌ Release v$NEW_VERSION not found in main branch history"
  echo "   Recent main commits:"
  echo "$MAIN_LOG"
  echo ""
  echo "   Please merge the release PR first, then run this script again."
  exit 1
fi

echo "✅ Release merge detected in main"

# 2. Switch to main and pull
git checkout main
git pull origin main

# 3. Check if tag already exists
if git rev-parse "v$NEW_VERSION" >/dev/null 2>&1; then
  echo "⚠️  Tag v$NEW_VERSION already exists"
  EXISTING_TAG_COMMIT=$(git rev-parse "v$NEW_VERSION")
  MAIN_HEAD=$(git rev-parse HEAD)
  if [[ "$EXISTING_TAG_COMMIT" != "$MAIN_HEAD" ]]; then
    echo "❌ Tag points to different commit than main HEAD"
    echo "   Tag commit:  ${EXISTING_TAG_COMMIT:0:7}"
    echo "   main HEAD:   ${MAIN_HEAD:0:7}"
    exit 1
  fi
  echo "   Tag already points to correct commit"
else
  # 4. Create and push tag
  echo "🏷️  Creating tag v$NEW_VERSION..."

  # Get changelog for tag message
  TAG_MESSAGE=$(sed -n "/## \[$NEW_VERSION\]/,/## \[/p" CHANGELOG.md 2>/dev/null | head -n -1 || echo "Release v$NEW_VERSION")

  git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION

$TAG_MESSAGE"

  git push origin "v$NEW_VERSION"
  echo "✅ Tag v$NEW_VERSION created and pushed"
fi

# 5. Merge main back to dev (keep dev in sync)
echo ""
echo "🔄 Syncing main → dev..."
git checkout dev
git pull origin dev

# Merge main into dev (should be fast-forward or simple merge)
if git merge --no-ff main -m "chore: sync main into dev after v$NEW_VERSION release"; then
  git push origin dev
  echo "✅ Dev synced with main"
else
  echo "⚠️  Merge conflict syncing main to dev"
  echo "   Resolve manually and push"
  git merge --abort
fi

# 6. Delete release branch (local and remote)
echo ""
echo "🧹 Cleaning up release branch..."
git branch -D "$RELEASE_BRANCH" 2>/dev/null || true
git push origin --delete "$RELEASE_BRANCH" 2>/dev/null || true
echo "✅ Release branch deleted"

# 7. Create GitHub release
echo ""
echo "📦 Creating GitHub release..."

CHANGELOG_NOTES=$(sed -n "/## \[$NEW_VERSION\]/,/## \[/p" CHANGELOG.md 2>/dev/null | head -n -1 || echo "Release v$NEW_VERSION")

if gh release create "v$NEW_VERSION" \
  --title "v$NEW_VERSION" \
  --notes "$CHANGELOG_NOTES" \
  --verify-tag 2>/dev/null; then
  echo "✅ GitHub release created"
else
  echo "⚠️  Could not create GitHub release automatically"
  echo "   Create manually: gh release create v$NEW_VERSION --title 'v$NEW_VERSION'"
fi

# 8. Cleanup temporary files
rm -f .next-version .bump-type

# 9. Summary
REPO_URL=$(gh repo view --json url --jq '.url' 2>/dev/null || echo "https://github.com/OWNER/REPO")

echo ""
echo "✅ Release v$NEW_VERSION completed successfully!"
echo ""
echo "📊 Release summary:"
echo "   Version:  v$NEW_VERSION"
echo "   Tag:      v$NEW_VERSION"
echo "   Release:  $REPO_URL/releases/tag/v$NEW_VERSION"
echo ""
echo "📋 Post-release checklist:"
echo "   [ ] Verify GitHub release page"
echo "   [ ] Announce release (Slack, Discord, etc.)"
echo "   [ ] Monitor for issues"
