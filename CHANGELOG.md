# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

- Initial project bootstrap for the HexDDD × VibePDK merger.
- Copier template scaffolding and migration tool skeletons.
- Monitoring, CI/CD, and development environment configuration.


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
