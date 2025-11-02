#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/decrypt-ci-env.sh /path/to/ci.env
# Reads a dotenv-styled file and appends variables into $GITHUB_ENV

CI_ENV_PATH=${1:-/tmp/ci.env}

if [[ ! -f "${CI_ENV_PATH}" ]]; then
  echo "No ci env file found at ${CI_ENV_PATH}" >&2
  exit 0
fi

while IFS= read -r line || [[ -n "${line}" ]]; do
  case "${line}" in
    ''|'#'*)
      continue
      ;;
    *)
      ;; # fallthrough to processing
  esac

  # Support lines that start with `export ` by stripping it
  if [[ "${line}" == export\ * ]]; then
    line=${line#export }
  fi

  key=${line%%=*}
  value=${line#*=}

  # Validate key is a POSIX env var name
  if [[ ! "${key}" =~ ^[a-zA-Z_][a-zA-Z0-9_]*$ ]]; then
    echo "Warning: skipping invalid env var name: '${key}'" >&2
    continue
  fi

  # Export into current shell so subsequent commands in the step can use them
  # Quote to avoid word-splitting
  export "${key}"="${value}"

  # Use a unique delimiter for heredoc that doesn't appear in the value
  delim="CI_DELIM_${RANDOM}"
  while [[ "${value}" == *"${delim}"* ]]; do
    delim="CI_DELIM_${RANDOM}"
  done

  # Safely append to GITHUB_ENV; if GITHUB_ENV is unset, default to /dev/null
  target_env="${GITHUB_ENV:-/dev/null}"
  {
    echo "${key}<<${delim}"
    echo "${value}"
    echo "${delim}"
  } >> "${target_env}"

done < "${CI_ENV_PATH}"

echo "Decrypted env loaded from ${CI_ENV_PATH}"
