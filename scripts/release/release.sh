#!/usr/bin/env bash
# scripts/release/release.sh
# Main release orchestrator - guides through entire release process

set -euo pipefail

RELEASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$RELEASE_DIR"

echo "🎯 Release Orchestrator"
echo "======================="
echo ""

# Phase 1: Pre-flight checks
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Phase 1: Pre-flight validation"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
./scripts/release/release-preflight.sh || exit 1
echo ""

# Phase 2: Determine version bump
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Phase 2: Version determination"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
./scripts/release/determine-version-bump.sh
NEW_VERSION=$(cat .next-version)
BUMP_TYPE=$(cat .bump-type)
echo ""

# Phase 3: Confirm release
CURRENT_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo 'v0.0.0')
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Release Plan"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   Current: $CURRENT_TAG"
echo "   Next:    v$NEW_VERSION"
echo "   Type:    $BUMP_TYPE"
echo ""
echo "Proceed with release? (yes/N)"
read -r confirmation
if [[ "$confirmation" != "yes" ]]; then
  echo "❌ Release cancelled"
  rm -f .next-version .bump-type
  exit 0
fi
echo ""

# Phase 4: Execute release
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Phase 3: Release execution"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
./scripts/release/execute-release.sh
echo ""

# Phase 5: Wait for PR merge
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Phase 4: Awaiting PR merge"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⏸️  The release PR has been created."
echo ""
echo "Next steps:"
echo "1. Review and approve the PR"
echo "2. Merge the PR to main (use merge commit)"
echo "3. Run: just release-finalize"
echo ""
echo "Or press Enter to monitor PR status automatically..."
read -r

# Auto-monitor PR status
RELEASE_BRANCH="release/v$NEW_VERSION"
echo "👀 Monitoring PR status..."
while true; do
  PR_DATA=$(gh pr list --head "$RELEASE_BRANCH" --json state,number --jq '.[0]' 2>/dev/null || echo "{}")
  PR_STATE=$(echo "$PR_DATA" | jq -r '.state // "UNKNOWN"')
  PR_NUMBER=$(echo "$PR_DATA" | jq -r '.number // ""')

  if [[ "$PR_STATE" == "MERGED" ]]; then
    echo "✅ Release PR #$PR_NUMBER merged!"
    break
  elif [[ "$PR_STATE" == "CLOSED" ]]; then
    echo "❌ Release PR was closed without merging"
    exit 1
  elif [[ "$PR_STATE" == "UNKNOWN" || -z "$PR_NUMBER" ]]; then
    echo "⚠️  Could not find PR. It may have been merged already."
    echo "   Check: gh pr list --state merged --head $RELEASE_BRANCH"
    break
  fi

  echo "⏳ PR #$PR_NUMBER status: $PR_STATE (checking again in 30s...)"
  sleep 30
done
echo ""

# Phase 6: Finalize release
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Phase 5: Release finalization"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
./scripts/release/finalize-release.sh

echo ""
echo "🎉 Release process complete!"
