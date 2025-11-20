#!/usr/bin/env bash
set -euo pipefail

# Ensure developer has a compatible Rust toolchain when the workspace requests edition=2024
ROOT="$(pwd)"
if grep -q 'edition = "2024"' "${ROOT}/Cargo.toml" 2>/dev/null; then
  if ! command -v rustup >/dev/null 2>&1; then
    echo "❌ Cargo requires edition=2024 but 'rustup' is not installed." >&2
    echo "   Install rustup: https://rustup.rs/" >&2
    echo "   Then run: rustup toolchain install nightly && rustup override set nightly" >&2
    exit 1
  fi
  if ! rustc --version | grep -q 'nightly'; then
    echo "❌ Cargo requires edition=2024 but current rustc is not a nightly toolchain." >&2
    echo "   This repository pins a specific nightly in rust-toolchain.toml: 'nightly-2025-11-01'." >&2
    echo "   Recommended: rustup install nightly-2025-11-01 && rustup override set nightly-2025-11-01" >&2
    echo "   Or run locally without changing override: RUSTUP_TOOLCHAIN=nightly-2025-11-01 just test-logs" >&2
    exit 1
  fi
fi
