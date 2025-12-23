#!/usr/bin/env bash
set -euo pipefail
. tests/env/helpers.sh

echo "Testing mise configuration..."

# Test 1: .mise.toml exists at repo root
assert_file_exists ".mise.toml"

# Test 2: .python-version should NOT exist (mise is authoritative)
if [ -f ".python-version" ]; then
  echo "❌ .python-version should be removed (mise is now authoritative)"
  exit 1
fi

# Test 3: If mise is installed, validate configuration
if command -v mise >/dev/null 2>&1; then
  echo "  ℹ️  mise detected, validating configuration..."

  # Test mise can read the config
  if ! mise ls --json >/dev/null 2>&1; then
    echo "❌ mise ls command failed (config may be invalid)"
    exit 1
  fi

  # Get configured versions from mise
  mise_json=$(mise ls --json 2>/dev/null || echo '[]')

  # Check for expected runtimes in .mise.toml
  for runtime in node python rust; do
    if ! grep -q "^${runtime} = " .mise.toml 2>/dev/null; then
      echo "⚠️  Runtime '$runtime' not configured in .mise.toml [tools] section"
      # Don't fail - allow partial configuration
    else
      echo "  ✅ Runtime '$runtime' configured in .mise.toml"
    fi
  done # Test version resolution (if runtimes are installed)
  echo "  ℹ️  Checking installed runtimes..."

  # Node version check
  if mise which node >/dev/null 2>&1; then
    mise_node_ver=$(mise exec -- node -v 2>/dev/null | tr -d 'v' || echo "")
    expected_node_ver=$(grep -A 1 '\[tools\]' .mise.toml | grep 'node' | cut -d'"' -f2 | tr -d 'v' || echo "")

    if [ -n "$mise_node_ver" ] && [ -n "$expected_node_ver" ]; then
      # Compare major versions at minimum
      mise_major=$(echo "$mise_node_ver" | cut -d'.' -f1)
      expected_major=$(echo "$expected_node_ver" | cut -d'.' -f1)

      if [ "$mise_major" != "$expected_major" ]; then
        echo "⚠️  Node version mismatch: mise has $mise_node_ver, .mise.toml specifies $expected_node_ver"
      else
        echo "  ✅ Node version aligned: $mise_node_ver"
      fi
    fi
  else
    echo "  ℹ️  Node not installed via mise yet (run 'mise install')"
  fi

  # Python version check
  if mise which python >/dev/null 2>&1; then
    mise_py_ver=$(mise exec -- python -V 2>&1 | awk '{print $2}' || echo "")
    expected_py_ver=$(grep -A 1 '\[tools\]' .mise.toml | grep 'python' | cut -d'"' -f2 || echo "")

    if [ -n "$mise_py_ver" ] && [ -n "$expected_py_ver" ]; then
      # Compare major.minor versions
      mise_major_minor=$(echo "$mise_py_ver" | cut -d'.' -f1,2)
      expected_major_minor=$(echo "$expected_py_ver" | cut -d'.' -f1,2)

      if [ "$mise_major_minor" != "$expected_major_minor" ]; then
        echo "⚠️  Python version mismatch: mise has $mise_py_ver, .mise.toml specifies $expected_py_ver"
      else
        echo "  ✅ Python version aligned: $mise_py_ver"
      fi
    fi
  else
    echo "  ℹ️  Python not installed via mise yet (run 'mise install')"
  fi

  # Rust version check
  if mise which rustc >/dev/null 2>&1; then
    mise_rust_ver=$(mise exec -- rustc --version 2>&1 | awk '{print $2}' || echo "")
    echo "  ✅ Rust available: $mise_rust_ver"
  else
    echo "  ℹ️  Rust not installed via mise yet (run 'mise install')"
  fi

  echo "  ✅ mise configuration is valid"
else
  echo "  ℹ️  mise not installed, skipping runtime validation"
  echo "     Install: curl https://mise.jdx.dev/install.sh | sh"
fi

echo "mise test OK"
