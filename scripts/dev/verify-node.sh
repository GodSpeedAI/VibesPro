#!/usr/bin/env bash
set -euo pipefail

# Verify Node version alignment between mise and Volta (if present)
# Exit 0 if aligned or Volta not present
# Exit 1 if misaligned

echo "🔍 Checking Node version alignment..."

# Get mise version
mise_node=""
if command -v mise >/dev/null 2>&1 && [[ -f ".mise.toml" ]]; then
  mise_node=$(grep '^node = ' .mise.toml | cut -d'"' -f2 || echo "")
  if [[ -n "${mise_node}" ]]; then
    echo "  mise (.mise.toml): ${mise_node}"
  fi
fi

# Get Volta version from package.json
volta_node=""
if [[ -f "package.json" ]]; then
  if command -v jq >/dev/null 2>&1; then
    volta_node=$(jq -r '.volta.node // empty' package.json 2>/dev/null || echo "")
  else
    # Fallback if jq not available
    volta_node=$(grep -A 1 '"volta"' package.json | grep '"node"' | cut -d'"' -f4 || echo "")
  fi

  if [[ -n "${volta_node}" ]]; then
    echo "  Volta (package.json): ${volta_node}"
  fi
fi

# Compare versions
if [[ -n "${mise_node}" && -n "${volta_node}" ]]; then
  # Extract major versions
  mise_major=$(echo "${mise_node}" | cut -d'.' -f1)
  volta_major=$(echo "${volta_node}" | cut -d'.' -f1)

  if [[ "${mise_major}" != "${volta_major}" ]]; then
    echo ""
    echo "❌ ERROR: Node version mismatch between mise and Volta!"
    echo ""
  echo "   mise (.mise.toml):      ${mise_node}"
  echo "   Volta (package.json):   ${volta_node}"
    echo ""
    echo "   Please align versions:"
    echo "   1. Update .mise.toml to match Volta, OR"
    echo "   2. Update package.json Volta section to match mise, OR"
    echo "   3. Remove Volta section from package.json (mise is authoritative)"
    echo ""
    exit 1
  else
    echo ""
    echo "✅ Node versions aligned (major version ${mise_major})"
  echo "   mise will be used as authoritative source"
    echo ""
    exit 0
  fi
elif [[ -n "${mise_node}" ]]; then
  echo ""
  echo "✅ mise is managing Node (${mise_node})"
  echo "   No Volta configuration detected"
  echo ""
  exit 0
elif [[ -n "${volta_node}" ]]; then
  echo ""
  echo "⚠️  Volta configuration found but no mise config"
  echo "   Volta version: ${volta_node}"
  echo "   Consider adding to .mise.toml: node = \"${volta_node}\""
  echo ""
  exit 0
else
  echo ""
  echo "ℹ️  No Node version pinning detected"
  echo "   Consider adding Node version to .mise.toml"
  echo ""
  exit 0
fi
