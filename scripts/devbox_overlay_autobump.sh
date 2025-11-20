#!/usr/bin/env bash
set -euo pipefail

# Auto-bump the supabase overlay to the latest commit on a nixpkgs branch
# Workflow assumptions:
# - GITHUB_TOKEN is set in CI env
# - Script runs in repo root
# - devbox and git are installed in runner

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OVERLAY_PATH="${ROOT_DIR}/.devbox/overlays/supabase.nix"
REPO="${GITHUB_REPOSITORY:-$(git config --get remote.origin.url | sed -e 's#.*/\(.*\)/\(.*\)\.git#\1/\2#')}"
GITHUB_API="https://api.github.com/repos/${REPO}"
DRY_RUN=${DRY_RUN:-}
BRANCH_BASE="main"
TARGET_NIXPKGS_BRANCH="nixos-23.11"

if [[ -z "${GITHUB_TOKEN:-}" ]]; then
  echo "ERROR: GITHUB_TOKEN is required (set secrets.GITHUB_TOKEN in CI)" >&2
  exit 2
fi

echo "🔎 Fetching latest commit for nixpkgs/${TARGET_NIXPKGS_BRANCH}..."
commit_sha=$(curl -sSf -H "Accept: application/vnd.github+json" "https://api.github.com/repos/NixOS/nixpkgs/commits/${TARGET_NIXPKGS_BRANCH}" | jq -r '.sha')
if [[ -z "${commit_sha}" || "${commit_sha}" == "null" ]]; then
  echo "ERROR: could not fetch commit for branch ${TARGET_NIXPKGS_BRANCH}" >&2
  exit 3
fi
short_sha=${commit_sha:0:7}

echo "Candidate commit: ${commit_sha} (${short_sha})"

# Check if overlay already has this commit
if grep -q "${commit_sha}" "${OVERLAY_PATH}"; then
  echo "No bump necessary; overlay already pinned to ${commit_sha}";
  exit 0
fi

branch_name="autobump/devbox-overlay-supabase-${short_sha}"
echo "Creating branch: ${branch_name}"
git checkout -b "${branch_name}"

# Update overlay to new commit tarball URL
python - <<PY
from pathlib import Path
path=Path('${OVERLAY_PATH}')
data=path.read_text()
newurl=f'https://github.com/NixOS/nixpkgs/archive/${commit_sha}.tar.gz'
import re
data=re.sub(r"https://github.com/NixOS/nixpkgs/archive/[^\)\n\']+", newurl, data)
path.write_text(data)
print('Updated overlay to', newurl)
PY

# Commit change
git add -f "${OVERLAY_PATH}"
git commit -m "chore(devbox-overlay): bump supabase overlay to ${short_sha}" || true

# Validate: devbox update & supabase check
echo "Updating devbox and verifying supabase availability..."
devbox update || true
if devbox run -- supabase --version >/dev/null 2>&1; then
  echo "✅ Validation passed: supabase is available with new overlay"
else
  echo "⚠️ Validation failed: supabase not found after bump. Reverting overlay change."
  git checkout -- "${OVERLAY_PATH}" || true
  git commit -m "revert: failed overlay bump to ${short_sha}" --allow-empty || true
  exit 4
fi

# Push branch and open PR (if not already existing)
remote="https://${GITHUB_ACTOR:-github-actions}:${GITHUB_TOKEN}@github.com/${REPO}.git"
if [[ -n "${DRY_RUN:-}" ]]; then
  echo "DRY_RUN set - skipping push and PR creation"
else
  git push "${remote}" "HEAD:${branch_name}" -f
fi

pr_title="chore(devbox-overlay): bump supabase overlay to ${short_sha}"
# shellcheck disable=SC2006
pr_body="This PR updates the \`.devbox/overlays/supabase.nix\` overlay to use nixpkgs commit ${commit_sha} for reproducible devbox builds.\\n\\nAutomatically created by CI autobump workflow."

if [[ -n "${DRY_RUN:-}" ]]; then
  echo "DRY_RUN set - skipping existing PR check and PR creation"
  exit 0
fi

existing_pr=$(curl -sSf -H "Accept: application/vnd.github+json" -H "Authorization: token ${GITHUB_TOKEN}" "${GITHUB_API}/pulls?head=$(jq -rn --arg r "${GITHUB_REPOSITORY}" --arg b "${branch_name}" '$r:$b')" | jq -r '.[0].html_url // empty') || true
if [[ -n "${existing_pr}" ]]; then
  echo "PR already exists: ${existing_pr}"
  exit 0
fi

create_pr_response=$(curl -sSf -X POST -H "Accept: application/vnd.github+json" -H "Authorization: token ${GITHUB_TOKEN}" -d "{\"title\": \"${pr_title}\", \"head\": \"${branch_name}\", \"base\": \"${BRANCH_BASE}\", \"body\": \"${pr_body}\"}" "${GITHUB_API}/pulls")
pr_url=$(jq -r '.html_url' <<<"${create_pr_response}")
pr_number=$(jq -r '.number' <<<"${create_pr_response}")
echo "PR_NUMBER=${pr_number}" > .autobump_pr_number
if [[ -n "${pr_url}" && "${pr_url}" != "null" ]]; then
  echo "✅ PR created: ${pr_url}"
  exit 0
else
  echo "⚠️ Failed to create PR" >&2
  echo "Response: ${create_pr_response}" >&2
  exit 5
fi
