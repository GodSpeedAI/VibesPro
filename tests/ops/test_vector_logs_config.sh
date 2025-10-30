#!/usr/bin/env bash
# Test Vector logs configuration - validates OTLP logs source, transforms, and sinks
# Tests: DEV-SDS-018 (Vector configuration for structured logging)
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
  vector validate "${VECTOR_CONFIG}" || die "Vector config validation failed"
}

test_logs_source_exists() {
  log "Checking for OTLP source (unified for traces and logs)"
  grep -q '\[sources\.otlp\]' "${VECTOR_CONFIG}" || die "OTLP source not found"
  grep -q 'type.*=.*"opentelemetry"' "${VECTOR_CONFIG}" || die "OpenTelemetry source type not found"
  # Check for both gRPC (4317) and HTTP (4318) endpoints
  grep -q 'address.*=.*"0.0.0.0:4317"' "${VECTOR_CONFIG}" || die "OTLP gRPC address not configured"
  grep -q 'address.*=.*"0.0.0.0:4318"' "${VECTOR_CONFIG}" || die "OTLP HTTP address not configured"
  # Verify logs stream is used
  grep -q 'otlp\.logs' "${VECTOR_CONFIG}" || die "OTLP logs stream not found in transforms"
}

test_pii_redaction_transform() {
  log "Checking for PII redaction transform"
  grep -q '\[transforms\.logs_redact_pii\]' "${VECTOR_CONFIG}" || die "PII redaction transform not found"
  grep -q 'file = "tools/vector/macros.vrl"' "${VECTOR_CONFIG}" || die "logs_redact_pii should reuse shared macros"
  grep -q 'user_email' "${MACRO_FILE}" || die "Email redaction rule not found in macros"
  grep -q 'authorization' "${MACRO_FILE}" || die "Authorization redaction rule not found in macros"
}

test_enrichment_transform() {
  log "Checking for enrichment transform"
  grep -q '\[transforms\.logs_enrich\]' "${VECTOR_CONFIG}" || die "Enrichment transform not found"
  grep -q '\.service' "${VECTOR_CONFIG}" || die "Service field enrichment not found"
  grep -q '\.environment' "${VECTOR_CONFIG}" || die "Environment field enrichment not found"
}

test_logs_sink_exists() {
  log "Checking for logs sinks"
  # Check for OpenObserve sink
  grep -q '\[sinks\.logs_openobserve\]' "${VECTOR_CONFIG}" || die "Logs OpenObserve sink not found"
  grep -q 'inputs.*=.*\["logs_enrich"\]' "${VECTOR_CONFIG}" || die "Logs sink input not connected to enrichment"
  # Also check for console and file sinks for local debugging
  grep -q '\[sinks\.logs_console\]' "${VECTOR_CONFIG}" || log "Warning: logs_console sink not found (optional)"
  grep -q '\[sinks\.logs_file\]' "${VECTOR_CONFIG}" || log "Warning: logs_file sink not found (optional)"
}

main() {
  log "Testing Vector logs configuration (DEV-SDS-018)"

  ensure_tools
  test_vector_config_valid
  test_logs_source_exists
  test_pii_redaction_transform
  test_enrichment_transform
  test_logs_sink_exists

  log "✅ Vector logs configuration tests passed"
}

main "$@"
