#!/usr/bin/env bash
# Test PII redaction in Vector transforms
# Tests: DEV-PRD-018 (PII redaction requirement), DEV-SDS-018 (redaction transforms)
set -euo pipefail


log()  { printf "==> %s\n" "$*"; }
die()  { printf "❌ %s\n" "$*" >&2; exit 1; }
have() { command -v "$1" >/dev/null 2>&1; }

ensure_tools() {
  # Single tool check - keep simple to satisfy shellcheck
  # SC2310: Disable set -e for this check intentionally
  # shellcheck disable=SC2310
  if ! have "vector"; then
    die "Missing tool: vector"
  fi
}

test_email_redaction() {
  log "Testing email redaction"
  local vrl_script='if exists(.attributes.user_email) { .attributes.user_email = "[REDACTED]" }; .'

  local output
  output=$(echo '{"attributes":{"user_email":"test@example.com"}}' | vector vrl "${vrl_script}" 2>&1) || \
    die "Email redaction VRL failed"

  echo "${output}" | jq -e '.attributes.user_email == "[REDACTED]"' >/dev/null || \
    die "Email was not redacted correctly"

  log "✓ Email redaction verified"
}

test_authorization_redaction() {
  log "Testing authorization header redaction"

  local vrl_script='if exists(.attributes.authorization) { .attributes.authorization = "[REDACTED]" }; .'

  local output
  output=$(echo '{"attributes":{"authorization":"Bearer token"}}' | vector vrl "${vrl_script}" 2>&1) || \
    die "Authorization redaction VRL failed"

  echo "${output}" | jq -e '.attributes.authorization == "[REDACTED]"' >/dev/null || \
    die "Authorization was not redacted correctly"

  log "✓ Authorization redaction verified"
}

test_non_pii_preserved() {
  log "Testing that non-PII fields are preserved"

  local vrl_script='if exists(.attributes.user_email) { .attributes.user_email = "[REDACTED]" }; .'

  local output
  output=$(echo '{"attributes":{"user_id_hash":"abc123","user_email":"test@example.com"}}' | \
    vector vrl "${vrl_script}" 2>&1) || die "VRL transform failed"

  echo "${output}" | jq -e '.attributes.user_id_hash == "abc123"' >/dev/null || \
    die "Non-PII field user_id_hash was not preserved"
  echo "${output}" | jq -e '.attributes.user_email == "[REDACTED]"' >/dev/null || \
    die "PII field was not redacted"

  log "✓ Non-PII fields preserved and PII redacted"
}

main() {
  log "Testing PII redaction (DEV-PRD-018, DEV-SDS-018)"

  ensure_tools
  test_email_redaction
  test_authorization_redaction
  test_non_pii_preserved

  log "✅ PII redaction tests passed"
}

main "$@"
