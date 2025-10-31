#!/usr/bin/env bash
set -euo pipefail

# Wrapper to start OpenObserve using the repo-level run-with-secrets helper.
# This script should be executed from the repo (or via an absolute path). It
# delegates to `scripts/run-with-secrets.sh` which decrypts `.secrets.env.sops`
# into a secure temp file and runs the provided command in a subshell with the
# secrets exported into the environment.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if repo_root="$(git -C "${SCRIPT_DIR}" rev-parse --show-toplevel 2>/dev/null)"; then
	REPO_ROOT="${repo_root}"
else
	REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
fi
# NOTE (lines 10-13): the wrapper must call the repo-level
# `scripts/run-with-secrets.sh` helper from the actual repository root.
# Computing REPO_ROOT as "${SCRIPT_DIR}/../.." is fragile because this
# script lives in `ops/openobserve` — a simple ../.. works today, but if
# the layout changes or this file is invoked from a different CWD it can
# point to the wrong location (e.g. ops/scripts/...). Prefer asking git
# for the top-level directory and fall back to ../.. when git isn't
# available (for environments without a .git directory).

exec "${REPO_ROOT}/scripts/run-with-secrets.sh" bash -c 'cd "'"${SCRIPT_DIR}"'" && docker compose up -d'
