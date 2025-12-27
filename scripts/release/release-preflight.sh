#!/usr/bin/env bash
# scripts/release/release-preflight.sh
# Pre-release validation - ensures clean state before any release operations

set -euo pipefail

echo "🔍 Pre-release validation starting..."

# 1. Verify clean working directory
if [[ -n $(git status --porcelain) ]]; then
  echo "❌ Working directory has uncommitted changes"
  git status --short
  exit 1
fi
echo "✅ Working directory clean"

# 2. Verify current branch
CURRENT_BRANCH=$(git branch --show-current)
if [[ "$CURRENT_BRANCH" != "dev" ]]; then
  echo "❌ Must be on 'dev' branch for release. Currently on: $CURRENT_BRANCH"
  exit 1
fi
echo "✅ On dev branch"

# 3. Verify branch is up-to-date with remote
git fetch origin dev --quiet
LOCAL=$(git rev-parse dev)
REMOTE=$(git rev-parse origin/dev)
if [[ "$LOCAL" != "$REMOTE" ]]; then
  echo "❌ Local 'dev' diverged from origin/dev"
  echo "   Local:  $LOCAL"
  echo "   Remote: $REMOTE"
  echo "   Run: git pull origin dev"
  exit 1
fi
echo "✅ Local dev in sync with origin/dev"

# 4. Verify CI checks passed on latest commit
LATEST_COMMIT=$(git rev-parse HEAD)
echo "   Checking CI status for commit: ${LATEST_COMMIT:0:7}..."

# Get combined status (may be "pending", "success", "failure", or empty for no checks)
CI_STATE=$(gh api "repos/{owner}/{repo}/commits/$LATEST_COMMIT/status" --jq '.state' 2>/dev/null || echo "unknown")

if [[ "$CI_STATE" == "success" ]]; then
  echo "✅ CI checks passed"
elif [[ "$CI_STATE" == "pending" ]]; then
  # Verify if there are actually running/queued jobs
  RUNNING_COUNT=$(gh run list --commit "$LATEST_COMMIT" --json status --jq 'map(select(.status == "in_progress" or .status == "queued" or .status == "requested" or .status == "pending")) | length')

  if [[ "${RUNNING_COUNT:-0}" -gt 0 ]]; then
    echo "⚠️  CI checks still running ($RUNNING_COUNT active runs). Wait for completion or check status:"
    gh run list --commit "$LATEST_COMMIT"
    exit 1
  else
    echo "⚠️  CI status is 'pending' but no active workflow runs found. Proceeding..."
  fi
elif [[ "$CI_STATE" == "failure" ]]; then
  echo "❌ CI checks failed on latest commit"
  gh run list --commit "$LATEST_COMMIT" --limit 5
  exit 1
else
  echo "⚠️  Could not determine CI status (state: $CI_STATE)"
  echo "   Checking workflow runs directly..."
  FAILED_RUNS=$(gh run list --commit "$LATEST_COMMIT" --json conclusion --jq '[.[] | select(.conclusion == "failure")] | length')
  if [[ "${FAILED_RUNS:-0}" -gt 0 ]]; then
    echo "❌ Found $FAILED_RUNS failed workflow runs"
    gh run list --commit "$LATEST_COMMIT" --limit 5
    exit 1
  fi
  echo "✅ No failed workflow runs detected"
fi

# 5. Verify no open blocking issues
BLOCKING_ISSUES=$(gh issue list --label "blocking-release" --json number --jq '. | length' 2>/dev/null || echo "0")
if [[ "$BLOCKING_ISSUES" -gt 0 ]]; then
  echo "❌ $BLOCKING_ISSUES blocking issues found:"
  gh issue list --label "blocking-release"
  exit 1
fi
echo "✅ No blocking issues"

# 6. Verify version manifests are in sync
echo "   Checking version manifest sync..."
PKG_VERSION=$(jq -r '.version' package.json 2>/dev/null || echo "")
PYPROJECT_VERSION=$(grep -E '^version = ' pyproject.toml 2>/dev/null | sed 's/version = "\(.*\)"/\1/' || echo "")

if [[ -n "$PKG_VERSION" && -n "$PYPROJECT_VERSION" && "$PKG_VERSION" != "$PYPROJECT_VERSION" ]]; then
  echo "❌ Version mismatch between manifests:"
  echo "   package.json:   $PKG_VERSION"
  echo "   pyproject.toml: $PYPROJECT_VERSION"
  exit 1
fi
echo "✅ Version manifests in sync (${PKG_VERSION:-N/A})"

# 7. Check changelog updated (warn only)
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
if [[ -n "$LAST_TAG" ]]; then
  if ! git diff "${LAST_TAG}...HEAD" --name-only | grep -q "CHANGELOG.md"; then
    echo "⚠️  CHANGELOG.md not updated since last release ($LAST_TAG)"
    echo "   Consider updating before release"
  else
    echo "✅ CHANGELOG.md has changes since $LAST_TAG"
  fi
fi

echo ""
echo "✅ Pre-release validation passed"
echo "   Current version: ${PKG_VERSION:-unknown}"
echo "   Last tag: ${LAST_TAG:-none}"
echo "   Commit: ${LATEST_COMMIT:0:7}"
