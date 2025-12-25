# GitHub Actions Workflows

This directory contains the CI/CD pipeline configuration for VibesPro.

## Quick Reference

| Workflow                | Purpose                                         | Trigger              | Timeout   |
| ----------------------- | ----------------------------------------------- | -------------------- | --------- |
| `ci.yml`                | Main CI pipeline (lint, typecheck, build, test) | Push/PR to main      | 5-15 min  |
| `build-matrix.yml`      | Multi-OS build and test                         | Push/PR to main      | 45 min    |
| `type-safety.yml`       | TypeScript and Python type checking             | Push/PR              | 15-20 min |
| `security-scan.yml`     | Security audits (cargo-audit, npm audit)        | Push/Schedule        | 15-20 min |
| `integration-tests.yml` | Full integration test suite                     | Push to main/develop | 20 min    |

## Local Reproduction

**Before pushing, run CI locally:**

```bash
# Run full CI suite
./scripts/ci-local.sh all

# Run specific job
./scripts/ci-local.sh lint
./scripts/ci-local.sh typecheck
./scripts/ci-local.sh test
./scripts/ci-local.sh build

# Full parity with Docker
./scripts/ci-local.sh docker
```

## Architecture

```
                         ┌─────────┐
                         │ Trigger │
                         └────┬────┘
                              │
           ┌──────────────────┼──────────────────┐
           │                  │                  │
           ▼                  ▼                  ▼
    ┌────────────┐     ┌────────────┐     ┌──────────────┐
    │    Lint    │     │ TypeCheck  │     │ Python Lint  │
    │   (~45s)   │     │  (~1-2m)   │     │    (~30s)    │
    └─────┬──────┘     └──────┬─────┘     └───────┬──────┘
          │                   │                   │
          └─────────┬─────────┘                   │
                    │                             │
                    ▼                             │
             ┌────────────┐                       │
             │   Build    │                       │
             │  (~3-5m)   │                       │
             └─────┬──────┘                       │
                   │                              │
                   ▼                              ▼
            ┌────────────┐                ┌─────────────┐
            │ Node Tests │                │ Python Test │
            │  (~5-10m)  │                │   (~3-5m)   │
            └─────┬──────┘                └──────┬──────┘
                  │                              │
                  └──────────┬───────────────────┘
                             │
                             ▼
                   ┌──────────────────┐
                   │ Template Validate│
                   │     (~5m)        │
                   └─────────┬────────┘
                             │
                             ▼
                      ┌────────────┐
                      │ CI Summary │
                      │   (Gate)   │
                      └────────────┘
```

## Design Principles

### 1. Deterministic Builds

- All actions pinned to SHA (not version tags)
- Runner OS pinned to `ubuntu-22.04` / `macos-14`
- Dependencies locked with `pnpm install --frozen-lockfile`

### 2. Fast Feedback

- Lint failures surface in ~45 seconds
- Jobs run in parallel where possible
- Path filters skip irrelevant runs

### 3. No Suppressions

- No `|| true` to hide failures
- Proper error handling with explicit exit codes
- All lint/test failures are real failures

### 4. Local-CI Parity

- `scripts/ci-local.sh` mirrors CI behavior
- Same tool versions via `.mise.toml`
- Docker mode for complete environment match

## Version Management

All versions are centralized in:

- **`.github/config/versions.env`** - SHA pins for actions, tool versions
- **`.mise.toml`** - Runtime versions (Node, Python, Rust)

When updating a version:

1. Update the source file
2. Update corresponding workflow references
3. Test locally with `./scripts/ci-local.sh all`
4. Submit PR and verify CI passes

## Adding a New Workflow

1. Create workflow file in `.github/workflows/`
2. Use SHA-pinned actions from `versions.env`
3. Pin `runs-on: ubuntu-22.04`
4. Add timeout for all jobs
5. Add documentation to `.github/workflows/docs/`
6. Update this README

## Troubleshooting

### CI fails but works locally

```bash
# Ensure versions match
./scripts/ci-local.sh check

# Run in Docker for full parity
./scripts/ci-local.sh docker
```

### Action permissions error

Ensure workflow has minimal permissions:

```yaml
permissions:
  contents: read
```

### Cache not working

Check cache key includes all version variables:

```yaml
key: ${{ runner.os }}-${{ hashFiles('.mise.toml') }}-${{ hashFiles('pnpm-lock.yaml') }}
```
