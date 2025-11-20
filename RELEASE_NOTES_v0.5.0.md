# Release v0.5.0 - CI Environment Optimization

## 🎯 Overview

Major CI/CD infrastructure overhaul improving reliability, performance, and maintainability. This release includes comprehensive optimizations across all GitHub Actions workflows, script organization, and security fixes.

---

## ✨ New Features

### Composite Actions

- **setup-devbox** - Automated Devbox installation with retry logic and caching
- **setup-mise** - Runtime management with comprehensive caching
- **setup-sops** - Cross-platform SOPS installation

### Centralized Configuration

- Created `.github/config/versions.env` for centralized tool version management
- Single source of truth for SOPS, Node, Python versions

### Script Organization

- Reorganized 20 scripts into logical directories:
    - `scripts/ci/` - CI/CD-specific scripts
    - `scripts/setup/` - Environment setup scripts
    - `scripts/dev/` - Development utilities
- Added comprehensive `scripts/README.md` documentation

---

## 🐛 Bug Fixes

### Critical CI Failures

- **Fixed Devbox installation** - Removed problematic `-f` flag causing version 0.16.0 download failures
- **Standardized Rust toolchain** - All workflows now use stable toolchain from `rust-toolchain.toml`
- **Added retry logic** - Exponential backoff for Devbox installation (3 attempts)

### Test Fixes

- Updated integration tests for new script locations
- Fixed bundle-context.sh path references

---

## 🔒 Security

### Vulnerability Fixes

Fixed **all 7 security vulnerabilities** (5 moderate, 2 high):

- `esbuild` - Upgraded to >=0.25.0
- `vite` - Upgraded to >=5.4.21
- `koa` - Upgraded to >=3.0.3
- `js-yaml` - Upgraded to >=3.14.2
- `glob` - Upgraded to >=10.5.0
- `estree-util-value-to-estree` - Upgraded to >=3.3.3

**Result**: `pnpm audit` now shows **0 vulnerabilities** ✅

---

## ⚡ Performance Improvements

### Comprehensive Caching Strategy

- **Devbox binary cache** - Keyed by `devbox.lock`
- **Mise runtimes cache** - Keyed by `.mise.toml` and `rust-toolchain.toml`
- **Cargo registry cache** - Keyed by `Cargo.lock`
- **Python uv cache** - Keyed by `uv.lock` and `pyproject.toml`
- **pnpm store cache** - Keyed by `pnpm-lock.yaml`

**Expected Impact**: 30-50% reduction in CI execution time

### Optimized Supabase Installation

- Simplified installation script with version pinning (v1.145.4)
- Updated Nix overlay to use `nixos-unstable` for latest packages
- Cross-platform support (Linux/macOS, amd64/arm64)

---

## 📝 Documentation

### New Documentation

- `docs/ci-optimization-summary.md` - Comprehensive technical summary
- `docs/ci-optimization-verification.md` - Final verification report
- `scripts/README.md` - Script organization guide
- `.github/config/versions.env` - Centralized version configuration

---

## 🔧 Workflow Updates

### Updated Workflows (6)

- `build-matrix.yml` - Added composite actions, caching, and retry logic
- `ci.yml` - Updated script paths and Devbox installation
- `env-check.yml` - Added composite actions and comprehensive caching
- `integration-tests.yml` - Standardized Rust toolchain
- `security-scan.yml` - Standardized Rust toolchain
- `overlay-autobump.yml` - Updated script paths and Devbox installation

---

## 📊 Metrics

- **Files Modified**: 40+
- **Scripts Reorganized**: 20
- **Workflows Updated**: 6
- **Composite Actions Created**: 3
- **Test Files Updated**: 5
- **Vulnerabilities Fixed**: 7 (100%)
- **Workflow Code Reduction**: ~33%

---

## 🚀 Migration Guide

### Script Path Changes

If you have any custom scripts or documentation referencing the old script locations, update them as follows:

**CI Scripts**:

- `scripts/decrypt-ci-env.sh` → `scripts/ci/decrypt-ci-env.sh`
- `scripts/devbox_overlay_autobump.sh` → `scripts/ci/devbox_overlay_autobump.sh`
- `scripts/fetch_github_actions_logs.sh` → `scripts/ci/fetch_github_actions_logs.sh`

**Setup Scripts**:

- `scripts/install_supabase.sh` → `scripts/setup/install_supabase.sh`
- `scripts/devbox_boot.sh` → `scripts/setup/devbox_boot.sh`
- `scripts/devbox_fix_pin.sh` → `scripts/setup/devbox_fix_pin.sh`
- `scripts/ensure_rust_toolchain.sh` → `scripts/setup/ensure_rust_toolchain.sh`
- `scripts/install-hooks.sh` → `scripts/setup/install-hooks.sh`

**Dev Scripts**:

- `scripts/verify-node.sh` → `scripts/dev/verify-node.sh`
- `scripts/check_supabase_in_devbox.sh` → `scripts/dev/check_supabase_in_devbox.sh`
- `scripts/validate_supabase_overlay_pin.sh` → `scripts/dev/validate_supabase_overlay_pin.sh`
- `scripts/bundle-context.sh` → `scripts/dev/bundle-context.sh`
- `scripts/doctor.sh` → `scripts/dev/doctor.sh`

All workflow files and tests have been updated automatically.

---

## 🙏 Credits

This release represents a comprehensive overhaul of the CI/CD infrastructure, implementing industry best practices for reliability, performance, and maintainability.

---

## 📦 Full Changelog

**Commits** (9):

1. `282c527` - fix(ci): resolve critical CI failures
2. `e92c3e8` - fix(ci): remove unreachable code in overlay-autobump.yml
3. `628e6e1` - feat(ci): implement phase 2 optimizations
4. `0766905` - feat(ci): add comprehensive caching for cargo and uv
5. `06d4c84` - feat(ci): add cargo and uv caching to build-matrix workflow
6. `e3be057` - docs: add comprehensive CI optimization summary
7. `d823bde` - feat(ci): complete phase 3 and 4 optimizations
8. `d88f2e1` - fix(tests): update bundle-context.sh path in integration tests
9. `757c281` - docs: add final CI optimization verification report

**Compare**: [v0.4.1...v0.5.0](https://github.com/GodSpeedAI/VibesPro/compare/v0.4.1...v0.5.0)
