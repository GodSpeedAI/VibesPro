# Changelog

All notable changes to this project will be documented in this file.

## [0.7.0] - 2025-12-27

**Full Changelog**: https://github.com/GodSpeedAI/VibesPro/compare/v0.6.0...v0.7.0

### ✨ New Features

- **Context Engineering SDK Integration**: Established the Context Engineering SDK as the foundational agent system, providing a robust framework for AI-powered development workflows.

- **Spec-Kit SDD Workflow Tool**: Integrated spec-kit as a dedicated Specification-Driven Development workflow skill, enabling structured specification management.

- **Expanded AI Skills Pack**: Added 6 new AI capabilities to the agent system:
  - **Temporal AI**: Time-aware AI processing and reasoning
  - **Observability Skills**: AI-assisted monitoring and debugging
  - **API Mocking**: Intelligent API simulation for development
  - **Context Routing**: Smart routing of context to appropriate agents
  - **Architecture Decisioning**: AI-guided architectural choices
  - **Doc Co-authoring**: Collaborative documentation with AI assistance

- **Enhanced Template System**: Improved Copier template validation with observability infrastructure integration, ensuring generated projects meet quality standards.

### 🔧 Improvements

- **Unified Test Framework**: Removed Vitest in favor of Jest for consistent testing across the entire monorepo. Added `test-all` and `test-e2e` just recipes for comprehensive test execution.

- **Rust Toolchain Upgrade**: Upgraded to Rust 1.83.0 for temporal-ai dependencies, ensuring compatibility with the latest language features.

- **Tool Version Alignment**: Synchronized pnpm (9.15.4) and other tool versions across all environments for reproducible builds.

- **CI/CD Stabilization**: Multiple improvements to pipeline reliability:
  - OS and architecture-specific mise caching
  - Reproducible builds with pinned Ubuntu 22.04
  - Proper mise shim PATH configuration for tool availability
  - Graceful handling of cancelled jobs in summaries

- **SEA-DSL Documentation**: Reformatted SEA DSL reference documentation to YAML format for better LLM extraction and processing.

### 🐛 Fixes

- Fixed CI job failures caused by missing tools in PATH (uv, pnpm, clippy)
- Resolved macOS ARM64 binary mismatch issues with mise-managed tools
- Fixed TypeScript errors in tests and tools configurations
- Corrected deprecated `affected.defaultBase` configuration in Nx
- Fixed spec-kit video overview anchor in documentation
- Addressed template environment/state leakage issues
- Fixed generator integration tests for CI resilience
- Removed ghost dependencies from uv.lock

### 📚 Documentation

- Added comprehensive test coverage baseline documentation
- Added SEA-DSL language reference documentation
- Updated agent instructions and skill registrations
- Documented last-mile journeys and production readiness plan
- Streamlined copilot-instructions.md for better AI context

### 🏗️ Infrastructure

- Added Vector observability tool to devbox environment
- Configured proper Clippy component for Rust nightly toolchain
- Improved gitignore for build artifacts and smoke test projects
- Applied prettier formatting to configuration files

---

## [0.6.0] - 2025-12-25

**Full Changelog**: https://github.com/GodSpeedAI/VibesPro/compare/v0.5.1...v0.6.0

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
  - Structured logging libraries for Node.js (Pino) and Python (Logfire)
  - Comprehensive test suite (8 new test files in `tests/ops/`)
  - Complete documentation in `docs/observability/README.md`

- **New Observability Components**:
  - `crates/vibepro-observe/`: Rust instrumentation crate with OTLP export
  - `apps/observe-smoke/`: Smoke test application for tracing validation
  - `libs/node-logging/`: Structured JSON logging for Node.js with trace correlation
  - `libs/python/vibepro_logging.py`: Python Logfire helpers with trace context
  - `ops/vector/`: Vector configuration with OTLP sources and multiple sinks
  - `tools/logging/`: Quick-start examples for Pino and Logfire

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
