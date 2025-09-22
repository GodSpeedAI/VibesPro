#!/bin/bash
# Script to create a feature specification

set -e

# Check if THREAD argument is provided
if [ -z "$1" ]; then
    echo "Usage: $0 <feature-slug>"
    echo "Example: $0 test-feature"
    exit 1
fi

# Handle THREAD=<value> format
THREAD="$1"
if [[ "$THREAD" == THREAD=* ]]; then
    THREAD="${THREAD#THREAD=}"
fi
mkdir -p "docs/specs/$THREAD"
echo "---" > "docs/specs/$THREAD/spec.md"
echo "thread: $THREAD" >> "docs/specs/$THREAD/spec.md"
echo "matrix_ids: []" >> "docs/specs/$THREAD/spec.md"
echo "" >> "docs/specs/$THREAD/spec.md"
echo "# Feature Specification" >> "docs/specs/$THREAD/spec.md"
echo "" >> "docs/specs/$THREAD/spec.md"
echo "## What" >> "docs/specs/$THREAD/spec.md"
echo "" >> "docs/specs/$THREAD/spec.md"
echo "## Why" >> "docs/specs/$THREAD/spec.md"
echo "" >> "docs/specs/$THREAD/spec.md"
echo "Created feature specification for thread: $THREAD"
