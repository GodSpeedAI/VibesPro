#!/usr/bin/env bash
set -euo pipefail

# Thin wrapper to keep CI and local callers pointing at the canonical script.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "${SCRIPT_DIR}/dev/validate_supabase_overlay_pin.sh"
