#!/usr/bin/env bash
set -euo pipefail

DEFAULT_BRANCH="${DEFAULT_BRANCH:-main}"
PR_BASE_REF="${GITHUB_BASE_REF:-}"
FORMAT_BASE="${NX_FORMAT_BASE:-}"

resolve_base() {
  local candidate="$1"
  if git rev-parse --verify "${candidate}" >/dev/null 2>&1; then
    echo "${candidate}"
    return 0
  fi
  return 1
}

# Determine candidate base reference
if [[ -z "${FORMAT_BASE}" ]]; then
  if [[ -n "${PR_BASE_REF}" ]]; then
    FORMAT_BASE="origin/${PR_BASE_REF}"
  else
    FORMAT_BASE="origin/${DEFAULT_BRANCH}"
  fi
fi

resolve_base "${FORMAT_BASE}" >/dev/null 2>&1
rc=$?
if [[ "${rc}" -ne 0 ]]; then
  resolve_base "origin/${DEFAULT_BRANCH}" >/dev/null 2>&1
  rc2=$?
  if [[ "${rc2}" -eq 0 ]]; then
    MERGE_BASE="$(git merge-base HEAD "origin/${DEFAULT_BRANCH}" || true)"
    if [[ -n "${MERGE_BASE}" ]]; then
      FORMAT_BASE="${MERGE_BASE}"
    else
      FORMAT_BASE=""
    fi
  else
    MERGE_BASE="$(git rev-parse HEAD^ 2>/dev/null || true)"
    FORMAT_BASE="${MERGE_BASE}"
  fi
fi

if [[ -z "${FORMAT_BASE}" ]]; then
  echo "Skipping Nx format write; no suitable base reference found." >&2
  exit 0
fi

echo "Running Nx format:write with base '${FORMAT_BASE}' and head 'HEAD'."
pnpm exec nx format:write --base="${FORMAT_BASE}" --head=HEAD
