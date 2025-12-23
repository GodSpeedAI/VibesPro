#!/bin/bash
# Script to create a feature specification

set -e

# Check if THREAD argument is provided
if [[ -z "${1}" ]]; then
  echo "Usage: $0 <feature-slug>"
  echo "Example: $0 test-feature"
  exit 1
fi

# Handle THREAD=<value> format
THREAD="${1}"
if [[ "${THREAD}" == THREAD=* ]]; then
  THREAD="${THREAD#THREAD=}"
fi
mkdir -p "docs/specs/${THREAD}"
{
  printf "---\n"
  printf "thread: %s\n" "${THREAD}"
  printf "matrix_ids: []\n\n"
  printf "# Feature Specification\n\n"
  printf "## What\n\n"
  printf "## Why\n\n"
} >"docs/specs/${THREAD}/spec.md"
echo "Created feature specification for thread: ${THREAD}"
