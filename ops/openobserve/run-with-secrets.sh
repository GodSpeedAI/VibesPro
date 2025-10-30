#!/usr/bin/env bash
set -euo pipefail

# Wrapper to start OpenObserve using the repo-level run-with-secrets helper.
# This script should be executed from the repo (or via an absolute path). It
# delegates to `scripts/run-with-secrets.sh` which decrypts `.secrets.env.sops`
# into a secure temp file and runs the provided command in a subshell with the
# secrets exported into the environment.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

exec "${REPO_ROOT}/scripts/run-with-secrets.sh" bash -c 'cd "'"${SCRIPT_DIR}"'" && docker compose up -d'
