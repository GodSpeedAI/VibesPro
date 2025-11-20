#!/usr/bin/env bash
set -euo pipefail

# Decrypts .secrets.env.sops to a secure temp file, sources it into a subshell,
# and execs the provided command so the child process inherits the env.
# The temp file is shredded/removed on exit.

SECRETS_FILE='.secrets.env.sops'

if [[ ! -f "${SECRETS_FILE}" ]]; then
  _cwd="$(pwd)"
  echo "Error: ${SECRETS_FILE} not found in ${_cwd}" >&2
  exit 2
fi

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <command> [args...]" >&2
  exit 2
fi

tmpfile="$(mktemp --tmpdir .secrets.env.XXXXXX)"
trap 'shred -u "${tmpfile}" >/dev/null 2>&1 || rm -f "${tmpfile}"' EXIT

# Decrypt
sops -d "${SECRETS_FILE}" > "${tmpfile}"
chmod 600 "${tmpfile}"

# Source into a subshell and exec the command
bash -c 'set -a; source "$1"; set +a; shift; exec "$@"' -- "${tmpfile}" "$@"
