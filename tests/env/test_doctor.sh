#!/usr/bin/env bash
set -euo pipefail
. tests/env/helpers.sh

echo "Testing doctor script..."

assert_file_exists "scripts/doctor.sh"

# Run doctor and capture output
output=$(bash scripts/doctor.sh 2>&1)

# Verify key sections are present
echo "$output" | grep -q "Environment doctor" || {
  echo "❌ Doctor output missing header"
  exit 1
}

# Check for either old or new format
if ! echo "$output" | grep -qE "(Tool versions|Runtime versions|OS-level tool versions)"; then
  echo "❌ Doctor output missing version information"
  exit 1
fi

# Ensure no common secret patterns appear in output
if echo "$output" | grep -iE '(secret|password|token|key).*=' ; then
  echo "❌ Doctor output may contain secrets"
  exit 1
fi

echo "Doctor test OK"
