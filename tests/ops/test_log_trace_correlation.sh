#!/usr/bin/env bash
# Test log-trace correlation fields
# Tests: DEV-PRD-018 (correlation requirement), DEV-SDS-018 (trace_id/span_id fields)
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

log()  { printf "==> %s\n" "$*"; }
die()  { printf "❌ %s\n" "$*" >&2; exit 1; }
have() { command -v "$1" >/dev/null 2>&1; }

ensure_tools() {
  for t in cargo jq; do
    have "$t" || die "Missing tool: $t"
  done
}

test_rust_log_correlation() {
  log "Testing Rust log output for correlation fields"

  # Run observe-smoke and capture JSON output
  local output
  output=$(cargo run --manifest-path "$ROOT_DIR/apps/observe-smoke/Cargo.toml" 2>&1 | grep '^{' || true)

  if [ -z "$output" ]; then
    die "No JSON log output from observe-smoke"
  fi

  # Check for required correlation fields in at least one log line
  local has_span_info=false
  while IFS= read -r line; do
    if echo "$line" | jq -e '.span or .spans' >/dev/null 2>&1; then
      has_span_info=true
      log "✓ Found span correlation in log line"

      # Verify the structure
      local span_name
      span_name=$(echo "$line" | jq -r '.span.name // .spans[0].name // empty')
      if [ -n "$span_name" ]; then
        log "  Span name: $span_name"
      fi
      break
    fi
  done <<< "$output"

  if [ "$has_span_info" = "false" ]; then
    die "No span correlation fields found in logs"
  fi
}

test_required_fields() {
  log "Testing for required structured fields"

  local output
  output=$(cargo run --manifest-path "$ROOT_DIR/apps/observe-smoke/Cargo.toml" 2>&1 | grep '^{' | head -1)

  # Check for mandatory fields
  local timestamp level message target
  timestamp=$(echo "$output" | jq -r '.timestamp // empty')
  level=$(echo "$output" | jq -r '.level // empty')
  message=$(echo "$output" | jq -r '.fields.message // .message // empty')
  target=$(echo "$output" | jq -r '.target // empty')

  [ -n "$timestamp" ] || die "Missing timestamp field"
  [ -n "$level" ] || die "Missing level field"
  [ -n "$message" ] || die "Missing message field"
  [ -n "$target" ] || die "Missing target field"

  log "✓ All required fields present (timestamp, level, message, target)"
}

test_category_field() {
  log "Testing for category field in logs"

  local output
  output=$(cargo run --manifest-path "$ROOT_DIR/apps/observe-smoke/Cargo.toml" 2>&1 | grep 'category' || true)

  if [ -n "$output" ]; then
    log "✓ Category field present in logs"

    # Extract and display category values
    local categories
    categories=$(cargo run --manifest-path "$ROOT_DIR/apps/observe-smoke/Cargo.toml" 2>&1 | \
      grep '^{' | jq -r '.fields.category // empty' | sort -u | tr '\n' ' ')

    if [ -n "$categories" ]; then
      log "  Categories found: $categories"
    fi
  else
    log "⚠ Warning: No category field found (optional but recommended)"
  fi
}

main() {
  log "Testing log-trace correlation (DEV-PRD-018, DEV-SDS-018)"

  ensure_tools
  test_rust_log_correlation
  test_required_fields
  test_category_field

  log "✅ Log-trace correlation tests passed"
}

main "$@"
