#!/usr/bin/env bash
# Assemble an AI context bundle for Copilot chat modes.
#
# This collects key project context into a single directory so prompts/chat modes
# can reference a stable path. It is safe to run repeatedly and will only write
# to the output directory.
#
# Collected (when present):
# - docs/specs/*.md
# - docs/steering/*.md (or top-level docs/product.md, tech.md, structure.md)
# - architecture/calm/**
# - techstack.yaml
#
# Usage:
#   bash scripts/bundle-context.sh [OUTPUT_DIR]
#
# Defaults OUTPUT_DIR to docs/ai_context_bundle

set -euo pipefail

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
REPO_ROOT=$(dirname "$SCRIPT_DIR")

# Determine output directory (absolute path)
OUT_ARG="${1:-$REPO_ROOT/docs/ai_context_bundle}"
if [[ "$OUT_ARG" = /* ]]; then
  OUTPUT_DIR="$OUT_ARG"
else
  OUTPUT_DIR="$REPO_ROOT/$OUT_ARG"
fi

mkdir -p "$OUTPUT_DIR"

# Helper: copy all markdown files in a directory with a prefix
copy_md_with_prefix() {
  local src_dir="$1"
  local prefix="$2"
  if [ -d "$src_dir" ]; then
    find "$src_dir" -maxdepth 1 -type f -name '*.md' -print0 2>/dev/null | while IFS= read -r -d '' file; do
      local base
      base="$(basename "$file")"
      cp "$file" "$OUTPUT_DIR/${prefix}-${base}"
    done
  fi
}

# 1) Specs and steering docs (if present)
copy_md_with_prefix "$REPO_ROOT/docs/specs" "specs"
copy_md_with_prefix "$REPO_ROOT/docs/steering" "steering"

# Fallback steering: common top-level filenames
for name in product.md tech.md structure.md; do
  if [ -f "$REPO_ROOT/docs/$name" ]; then
    cp "$REPO_ROOT/docs/$name" "$OUTPUT_DIR/steering-${name}"
  fi
done

# 2) Steering updates (optional)
if [ -d "$REPO_ROOT/docs/steering/updates" ]; then
  find "$REPO_ROOT/docs/steering/updates" -maxdepth 1 -type f -name '*.md' -print0 2>/dev/null | while IFS= read -r -d '' upd; do
    cp "${upd}" "${OUTPUT_DIR}/$(basename "${upd}")"
  done
fi

# 3) Architecture CALM model
if [ -d "$REPO_ROOT/architecture/calm" ]; then
  mkdir -p "$OUTPUT_DIR/architecture"
  # Copy preserving directory structure under calm/
  cp -R "${REPO_ROOT}/architecture/calm" "${OUTPUT_DIR}/architecture/" 2>/dev/null || true
fi

# 4) Tech stack definition
if [ -f "$REPO_ROOT/techstack.yaml" ]; then
  cp "${REPO_ROOT}/techstack.yaml" "${OUTPUT_DIR}/techstack.yaml"
fi

echo "Context bundle created at: $OUTPUT_DIR"
echo "Context bundle created at: ${OUTPUT_DIR}"
