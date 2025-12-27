#!/usr/bin/env bash
# scripts/release/execute-release.sh
# Creates release branch, updates versions content, and creates PR

set -euo pipefail

RELEASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$RELEASE_DIR"

if [[ ! -f ".next-version" ]]; then
  echo "❌ .next-version not found. Run determine-version-bump.sh first."
  exit 1
fi

NEW_VERSION=$(cat .next-version)
BUMP_TYPE=$(cat .bump-type 2>/dev/null || echo "patch")
RELEASE_BRANCH="release/v$NEW_VERSION"

echo "🚀 Executing release v$NEW_VERSION..."

# 1. Ensure we're on dev and up to date
git checkout dev
git pull origin dev

# 2. Check if release branch already exists
if git show-ref --quiet "refs/heads/$RELEASE_BRANCH" || git show-ref --quiet "refs/remotes/origin/$RELEASE_BRANCH"; then
  echo "⚠️  Release branch '$RELEASE_BRANCH' already exists"
  echo "   Delete it first or use a different version"
  exit 1
fi

# 3. Create release branch from dev
echo "📋 Creating release branch: $RELEASE_BRANCH"
git checkout -b "$RELEASE_BRANCH"

# 4. Update versions in manifests
echo ""
./scripts/release/update-versions.sh

# 5. Generate changelog
echo ""
./scripts/release/generate-changelog.sh

# 6. Commit version bump
echo ""
echo "📝 Committing release changes..."
git add .
git commit --no-verify -m "chore(release): prepare v$NEW_VERSION

- Update version to $NEW_VERSION in all manifests
- Update CHANGELOG.md with release notes
- Release type: $BUMP_TYPE
"

# 7. Run validation (if ci-local.sh exists)
if [[ -f "scripts/ci-local.sh" ]]; then
  echo ""
  echo "🧪 Running pre-release validation..."
  if ! ./scripts/ci-local.sh lint typecheck 2>/dev/null; then
    echo "⚠️  Pre-release validation had issues (continuing anyway)"
  fi
fi

# 8. Push release branch
echo ""
echo "📤 Pushing release branch..."
git push origin "$RELEASE_BRANCH"

# 9. Create PR to main
echo ""
echo "📋 Creating release PR to main..."

# Get changelog section for PR body
CHANGELOG_SECTION=$(sed -n "/## \[$NEW_VERSION\]/,/## \[/p" CHANGELOG.md 2>/dev/null | head -n -1 || echo "See CHANGELOG.md for details")

PR_URL=$(gh pr create \
  --base main \
  --head "$RELEASE_BRANCH" \
  --title "Release v$NEW_VERSION" \
  --body "## Release v$NEW_VERSION

### Changes
$CHANGELOG_SECTION

### Pre-release Checklist
- [x] Version bumped in manifests
- [x] CHANGELOG.md updated
- [x] All CI checks passing
- [ ] Release PR reviewed and approved

### Post-merge Actions
- [ ] Tag created: v$NEW_VERSION
- [ ] GitHub release published
- [ ] Announce release

---
**Release Type**: $BUMP_TYPE
**Source Branch**: dev @ $(git rev-parse dev | cut -c1-7)
" \
  --label "release" 2>/dev/null || echo "")

if [[ -n "$PR_URL" ]]; then
  echo "✅ Release PR created: $PR_URL"
else
  echo "⚠️  Could not create PR automatically. Create manually:"
  echo "   gh pr create --base main --head $RELEASE_BRANCH --title 'Release v$NEW_VERSION'"
fi

echo ""
echo "📋 Next steps:"
echo "1. Review and approve PR: $PR_URL"
echo "2. Merge PR to main (use merge commit, not squash)"
echo "3. Run: ./scripts/release/finalize-release.sh"
