#!/usr/bin/env bash
# Test Vector Logfire integration - ensures Logfire metadata is preserved end-to-end
# Tests: DEV-PRD-018, DEV-SDS-018, DEV-SDS-005 (redaction macros reuse)
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
VECTOR_CONFIG="${ROOT_DIR}/ops/vector/vector.toml"
MACRO_FILE="${ROOT_DIR}/tools/vector/macros.vrl"
LOGFIRE_NORMALIZER_PATH=""
LOGFIRE_NORMALIZE_FILE="${ROOT_DIR}/ops/vector/transforms/logs_logfire_normalize.vrl"

log() { printf "==> %s\n" "$*"; }
die() {
  printf "❌ %s\n" "$*" >&2
  exit 1
}
have() { command -v "$1" >/dev/null 2>&1; }

ensure_tools() {
  have vector || die "vector not found in PATH"
  have jq || die "jq not found in PATH"
}

prepare_normalizer_program() {
  if [[ -n "${LOGFIRE_NORMALIZER_PATH}" ]]; then
    return
  fi

  LOGFIRE_NORMALIZER_PATH="$(mktemp)"
  {
    cat "${ROOT_DIR}/ops/vector/transforms/logs_logfire_normalize.vrl"
    echo "."
  } >"${LOGFIRE_NORMALIZER_PATH}"
}

normalize_payload() {
  prepare_normalizer_program
  local payload="$1"
  local payload_line

  payload_line=$(printf "%s\n" "${payload}" | jq -c '.')
  printf "%s\n" "${payload_line}" | VECTOR_LOG=error vector vrl --program "${LOGFIRE_NORMALIZER_PATH}" --print-object
}

test_vector_config_valid() {
  log "Validating Vector configuration"
  vector validate "${VECTOR_CONFIG}" >/dev/null || die "Vector config validation failed"
}

test_logfire_transform_exists() {
  log "Checking Logfire normalization transform"
  grep -q '\[transforms\.logs_logfire_normalize\]' "${VECTOR_CONFIG}" || die "Logfire normalize transform missing"
  grep -q 'inputs.*=.*\["logs_redact_pii"\]' "${VECTOR_CONFIG}" || die "Logfire normalize input not wired after redaction"
  grep -q '\.trace_id' "${LOGFIRE_NORMALIZE_FILE}" || die "Trace correlation logic missing in normalize transform"
  grep -q '\.span_id' "${LOGFIRE_NORMALIZE_FILE}" || die "Span correlation logic missing in normalize transform"
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

test_trace_id_variants() {
  log "Validating trace_id normalization variants"
  local keys=("trace_id" "logfire.trace_id" "logfire_trace_id")

  for key in "${keys[@]}"; do
    local payload output
    payload=$(jq -n --arg key "${key}" '{attributes: {($key): "ABCDEF12"}}')
    output=$(normalize_payload "${payload}") || die "Vector normalization failed for key=${key}"

    echo "${output}" | jq -e '.trace_id == "abcdef12"' >/dev/null ||
      die "trace_id not normalized for ${key}"
  done
}

test_span_id_variants() {
  log "Validating span_id normalization variants"
  local keys=("span_id" "logfire.span_id" "logfire_span_id")

  for key in "${keys[@]}"; do
    local payload output
    payload=$(jq -n --arg key "${key}" '{attributes: {($key): "ABC12345"}}')
    output=$(normalize_payload "${payload}") || die "Vector normalization failed for key=${key}"

    echo "${output}" | jq -e '.span_id == "abc12345"' >/dev/null ||
      die "span_id not normalized for ${key}"
  done
}

test_metadata_passthrough() {
  log "Ensuring Logfire metadata fields are copied"
  local payload output
  payload=$(jq -n '{
    attributes: {
      "logfire.span_name": "payment_flow",
      "logfire.observation_id": "OBS-123"
    }
  }')

  output=$(normalize_payload "${payload}") || die "Vector normalization failed for metadata passthrough"

  echo "${output}" | jq -e '.span_name == "payment_flow"' >/dev/null ||
    die "span_name not propagated"
  echo "${output}" | jq -e '.observation_id == "OBS-123"' >/dev/null ||
    die "observation_id not propagated"
}

test_missing_attributes() {
  log "Checking behavior when Logfire attributes are absent"
  local payload output

  payload='{"message":"no special attributes"}'
  output=$(normalize_payload "${payload}") || die "Vector normalization failed for missing attributes case"

  echo "${output}" | jq -e 'has("trace_id") | not' >/dev/null ||
    die "trace_id should not be set when attributes are missing"
  echo "${output}" | jq -e 'has("span_id") | not' >/dev/null ||
    die "span_id should not be set when attributes are missing"

  payload=$(jq -n '{attributes: {"trace_id": "", "span_id": ""}}')
  output=$(normalize_payload "${payload}") || die "Vector normalization failed for empty attribute case"

  echo "${output}" | jq -e 'has("trace_id") | not' >/dev/null ||
    die "trace_id should not be set when attribute is empty"
  echo "${output}" | jq -e 'has("span_id") | not' >/dev/null ||
    die "span_id should not be set when attribute is empty"
}

test_severity_fallback() {
  log "Verifying severity fallback to level"
  local payload output

  payload='{"level":"WARN"}'
  output=$(normalize_payload "${payload}") || die "Vector normalization failed for severity fallback"

  echo "${output}" | jq -e '.severity_text == "WARN"' >/dev/null ||
    die "severity_text not derived from level when missing"

  payload='{"severity_text":"INFO","level":"ERROR"}'
  output=$(normalize_payload "${payload}") || die "Vector normalization failed for severity preservation"

  echo "${output}" | jq -e '.severity_text == "INFO"' >/dev/null ||
    die "severity_text should remain unchanged when already present"
}

main() {
  log "Testing Vector Logfire pipeline integration"
  trap '[[ -n "${LOGFIRE_NORMALIZER_PATH}" ]] && rm -f "${LOGFIRE_NORMALIZER_PATH}"' EXIT

  ensure_tools
  test_vector_config_valid
  test_logfire_transform_exists
  test_macros_reused
  test_enrich_receives_logfire_output
  test_trace_id_variants
  test_span_id_variants
  test_metadata_passthrough
  test_missing_attributes
  test_severity_fallback
  log "✅ Vector Logfire pipeline checks passed"
}

main "$@"
