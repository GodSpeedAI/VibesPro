#!/usr/bin/env bash
# Smoke-test VibePro's observability pipeline using the example binary.
# Modes:
#  1) stdout JSON only (no exporter)
#  2) OTLP export with Vector (if available)
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

log()  { printf "==> %s\n" "$*"; }
die()  { printf "❌ %s\n" "$*" >&2; exit 1; }
have() { command -v "$1" >/dev/null 2>&1; }

ensure_in_repo_root() {
  [ -f "$ROOT_DIR/justfile" ] || die "Run from repo with justfile at root"
}

ensure_tools() {
  for t in cargo jq; do
    have "$t" || die "Missing tool: $t"
  done
}

build_smoke_stdout() {
  log "Building observe-smoke (stdout mode)"
  cargo build --manifest-path "$ROOT_DIR/apps/observe-smoke/Cargo.toml" >/dev/null
}

run_smoke_stdout() {
  log "Running observe-smoke (stdout mode)"
  # Expect JSON logs on stdout; capture and assert presence of known line
  local out
  set +e
  out="$(cargo run --manifest-path "$ROOT_DIR/apps/observe-smoke/Cargo.toml" 2>&1)"
  local rc=$?
  set -e
  echo "$out" | head -n 50
  [ $rc -eq 0 ] || die "observe-smoke stdout run failed"
  echo "$out" | grep -E '"level":"INFO"|{"fields"' >/dev/null \
    || die "Expected JSON-ish output not found"
}

start_vector_bg() {
  if ! have vector; then
    die "vector not found in PATH; ensure Devbox shell or install vector"
  fi
  [ -f "$ROOT_DIR/ops/vector/vector.toml" ] || die "missing ops/vector/vector.toml"

  log "Validating vector config"
  vector validate "$ROOT_DIR/ops/vector/vector.toml"

  log "Starting vector in background"
  vector --config "$ROOT_DIR/ops/vector/vector.toml" --watch-config >/tmp/vector.log 2>&1 &
  VECTOR_PID=$!
  # Wait briefly for ports to open
  sleep 2
  # quick health hint (best-effort): check log mentions listening
  grep -E "listening|Running|now ready" /tmp/vector.log || true
}

stop_vector_bg() {
  if [ -n "${VECTOR_PID:-}" ]; then
    log "Stopping vector (pid=$VECTOR_PID)"
    kill "$VECTOR_PID" 2>/dev/null || true
    wait "$VECTOR_PID" 2>/dev/null || true
    unset VECTOR_PID
  fi
}

build_smoke_otlp() {
  log "Building observe-smoke (otlp feature)"
  cargo build --features otlp --manifest-path "$ROOT_DIR/apps/observe-smoke/Cargo.toml" >/dev/null
}

run_smoke_otlp() {
  log "Running observe-smoke (OTLP export)"
  export VIBEPRO_OBSERVE=1
  export OTLP_ENDPOINT="${OTLP_ENDPOINT:-http://127.0.0.1:4317}"

  set +e
  out="$(cargo run --features otlp --manifest-path "$ROOT_DIR/apps/observe-smoke/Cargo.toml" 2>&1)"
  rc=$?
  set -e

  echo "$out" | head -n 80
  [ $rc -eq 0 ] || die "observe-smoke otlp run failed"
  echo "$out" | grep -E "OTLP exporter enabled|observe-smoke starting up" >/dev/null \
    || die "Expected exporter/init log lines not found"

  # If Vector logs exist, print tail for context (non-fatal check)
  if [ -f /tmp/vector.log ]; then
    log "Vector log tail:"
    tail -n 50 /tmp/vector.log || true
  fi
}

main() {
  ensure_in_repo_root
  ensure_tools

  # 1) stdout-only mode
  build_smoke_stdout
  run_smoke_stdout

  # 2) OTLP export mode with Vector (best-effort)
  trap stop_vector_bg EXIT
  start_vector_bg
  build_smoke_otlp
  run_smoke_otlp

  log "✅ observe-smoke tests passed"
}

main "$@"
