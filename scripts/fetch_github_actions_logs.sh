#!/usr/bin/env bash
# Fetch GitHub Actions workflow run logs for a given commit SHA using gh (GitHub CLI).
# Usage: ./scripts/fetch_github_actions_logs.sh <commit-sha> [output-dir]
# Requires: gh CLI authenticated (gh auth login) and repository access

set -euo pipefail
sha=${1:-}
outdir=${2:-"./_action_logs"}
repo="GodSpeedAI/VibesPro"

if [[ -z "${sha}" ]]; then
  echo "Usage: ${0} <commit-sha> [output-dir]"
  exit 2
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI not found. Install from https://cli.github.com/"
  exit 3
fi

mkdir -p "${outdir}"

# List runs for the commit
echo "Listing workflow runs for commit ${sha}..."
run_list_json=$(gh api repos/"${repo}"/actions/runs --jq ".workflow_runs[] | select(.head_sha==\"${sha}\") | {id: .id, name: .name, status: .status, conclusion: .conclusion, html_url: .html_url}" )

if [[ -z "${run_list_json}" ]]; then
  echo "No workflow runs found for commit ${sha}"
  exit 0
fi

# Iterate runs and download logs
echo "${run_list_json}" | while read -r line; do
  # parse id from the json line (simple extraction)
  id=$(echo "${line}" | sed -n 's/.*"id": *\([0-9]*\).*/\1/p')
  name=$(echo "${line}" | sed -n 's/.*"name": *"\([^\"]*\)".*/\1/p')
  echo "Downloading logs for run id=${id} name=\"${name}\"..."
  gh run download "${id}" --repo "${repo}" --dir "${outdir}/run-${id}" || echo "Download failed for run ${id}"
done

echo "Done. Logs (if any) stored under ${outdir}"
