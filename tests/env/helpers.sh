#!/usr/bin/env bash
set -euo pipefail

# Small reusable helpers for tests in tests/env

assert_file_exists() {
  local file="$1"
  if [ ! -e "$file" ]; then
    echo "❌ Expected file '$file' to exist" >&2
    exit 1
  fi
}

assert_cmd_succeeds() {
  local cmd="$1"
  if ! bash -c "$cmd" >/dev/null; then
    echo "❌ Command failed: $cmd" >&2
    exit 1
  fi
}

assert_equal() {
  local a="$1"
  local b="$2"
  local msg="${3:-values differ}"
  if [ "$a" != "$b" ]; then
    echo "❌ $msg: expected '$b' but got '$a'" >&2
    exit 1
  fi
}

mktempdir() {
  mktemp -d 2>/dev/null || mktemp -d -t tmpdir
}
