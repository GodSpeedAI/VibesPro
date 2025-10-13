# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

- Initial project bootstrap for the HexDDD × VibePDK merger.
- Copier template scaffolding and migration tool skeletons.
- Monitoring, CI/CD, and development environment configuration.

## [0.3.0] - 2025-10-12

### Added

- **Production-Ready Observability Stack** (PR #29 / feature/observability-pack):
  - Complete 6-phase implementation following TDD methodology
  - Rust-native instrumentation with `vibepro-observe` crate (DEV-ADR-016, DEV-SDS-017, DEV-PRD-017)
  - OpenTelemetry tracing integration with runtime feature flags (`VIBEPRO_OBSERVE`)
  - Vector data pipeline for OTLP ingestion, transformation, and routing
  - OpenObserve sink for long-term storage and analytics
  - PII redaction and sampling via VRL transforms
  - Structured logging libraries for Node.js (Pino) and Python (structlog)
  - Comprehensive test suite (8 new test files in `tests/ops/`)
  - Complete documentation in `docs/observability/README.md`

- **New Observability Components**:
  - `crates/vibepro-observe/`: Rust instrumentation crate with OTLP export
  - `apps/observe-smoke/`: Smoke test application for tracing validation
  - `libs/node-logging/`: Structured JSON logging for Node.js with trace correlation
  - `libs/python/vibepro_logging.py`: Python structured logging with trace context
  - `ops/vector/`: Vector configuration with OTLP sources and multiple sinks
  - `tools/logging/`: Quick-start examples for Pino and structlog

- **Just Recipes for Observability**:
  - `just observe-start`: Start Vector edge collector
  - `just observe-stop`: Stop Vector gracefully
  - `just observe-test-all`: Run complete observability test suite
  - `just observe-logs`: Tail Vector logs
  - `just observe-validate`: Validate Vector configuration

- **CI/CD Enhancements**:
  - Automated Vector configuration validation in workflows
  - Observability test gates in CI pipeline
  - Secret management with SOPS for OpenObserve credentials

### Changed

- Updated `.eslintrc.json` with improved linting configuration
- Enhanced `justfile` with 15+ new observability-related tasks
- Improved `.github/workflows/env-check.yml` with observability validation
- Updated traceability matrix with new observability spec IDs

### Documentation

- Added comprehensive `docs/observability/README.md` (630+ lines)
- Added `docs/ENVIRONMENT.md` updates for observability setup
- Added 14 work summaries documenting each implementation phase
- Updated ADR, PRD, SDS, and technical specifications with observability requirements

### Performance

- Instrumentation overhead: <1µs per span
- Vector CPU usage: <3% at 1k spans/s
- Zero performance impact when `VIBEPRO_OBSERVE` is disabled

### Security

- PII redaction in Vector transforms
- SOPS-encrypted credentials (`.secrets.env.sops`)
- Token-based authentication with OpenObserve
- Opt-in telemetry model (disabled by default)


## [0.2.0] - 2025-10-11

### Added

- Comprehensive development environment improvements and CI fixes (PR #27 / feature/devenv):
  - New `devbox.json` and environment setup docs in `docs/ENVIRONMENT.md`.
  - CI workflow additions and environment validation (`.github/workflows/env-check.yml`, `build-matrix.yml`).
  - Just task environment awareness tests and helper scripts (`scripts/*`, `tests/env/*`).
  - SOPS/secret management improvements and Volta coexistence checks.

### Fixed

- Various CI installation and linting issues; improvements to workflows and version retrieval.

### Notes

- Tag: `v0.2.0` — release created from merge of `feature/devenv` into `main`.
