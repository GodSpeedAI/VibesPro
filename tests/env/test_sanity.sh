#!/usr/bin/env bash
set -euo pipefail
. tests/env/helpers.sh

echo "Running sanity checks..."

assert_file_exists "tests/env/helpers.sh"

echo "Sanity OK"
