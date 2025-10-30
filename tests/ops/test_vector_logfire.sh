#!/usr/bin/env bash
# Test Vector Logfire integration - ensures Logfire metadata is preserved end-to-end
# Tests: DEV-PRD-018, DEV-SDS-018, DEV-SDS-005 (redaction macros reuse)
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
VECTOR_CONFIG="${ROOT_DIR}/ops/vector/vector.toml"
MACRO_FILE="${ROOT_DIR}/tools/vector/macros.vrl"

log()  { printf "==> %s\n" "$*"; }
die()  { printf "❌ %s\n" "$*" >&2; exit 1; }
have() { command -v "$1" >/dev/null 2>&1; }

ensure_tools() {
  have vector || die "vector not found in PATH"
}

test_vector_config_valid() {
  log "Validating Vector configuration"
  vector validate "${VECTOR_CONFIG}" >/dev/null || die "Vector config validation failed"
}

test_logfire_transform_exists() {
  log "Checking Logfire normalization transform"
  grep -q '\[transforms\.logs_logfire_normalize\]' "${VECTOR_CONFIG}" || die "Logfire normalize transform missing"
  grep -q 'inputs.*=.*\["logs_redact_pii"\]' "${VECTOR_CONFIG}" || die "Logfire normalize input not wired after redaction"
  grep -q '\.trace_id' "${VECTOR_CONFIG}" || die "Trace correlation logic missing in normalize transform"
  grep -q '\.span_id' "${VECTOR_CONFIG}" || die "Span correlation logic missing in normalize transform"
}

test_macros_reused() {
  log "Verifying shared redaction macros"
  [[ -f "${MACRO_FILE}" ]] || die "Shared VRL macros file not found at ${MACRO_FILE}"
  grep -q 'tools/vector/macros.vrl' "${VECTOR_CONFIG}" || die "Vector config does not reference macros.vrl"
}

test_enrich_receives_logfire_output() {
  log "Ensuring enrichment uses Logfire-normalized stream"
  grep -q 'inputs.*=.*\["logs_logfire_normalize"\]' "${VECTOR_CONFIG}" || die "logs_enrich transform not wired to Logfire output"
}

main() {
  log "Testing Vector Logfire pipeline integration"

  ensure_tools
  test_vector_config_valid
  test_logfire_transform_exists
  test_macros_reused
  test_enrich_receives_logfire_output
  log "✅ Vector Logfire pipeline checks passed"
}

main "$@"
