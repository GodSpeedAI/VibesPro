#!/usr/bin/env sh
# Check for mypy in PATH and run it; otherwise print guidance and exit 0

# Prefer a mypy installed in the project's .venv if present
VENV_MYPY="$(pwd)/.venv/bin/mypy"
MYPY=""
if [ -x "${VENV_MYPY}" ]; then
  MYPY="${VENV_MYPY}"
elif command -v mypy >/dev/null 2>&1; then
  MYPY="mypy"
fi

if [ -n "${MYPY}" ]; then
  exec "${MYPY}" --install-types --non-interactive .
else
  printf 'mypy not available in .venv or PATH; skipping workspace typecheck.\n'
  printf 'To enable strict typechecking locally, create a venv and install mypy:\n'
  printf '  python3 -m venv .venv && . .venv/bin/activate && pip install mypy\n'
  exit 0
fi
