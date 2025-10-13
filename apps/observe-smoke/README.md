# observe-smoke

Tiny Rust binary to smoke-test VibePro's observability pipeline:
`tracing` → Vector (OTLP) → OpenObserve.

## Run (stdout JSON only)

```bash
devbox shell
mise install
cargo run --manifest-path apps/observe-smoke/Cargo.toml
