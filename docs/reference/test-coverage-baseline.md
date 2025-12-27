# Test Coverage Baseline

> **Date**: 2025-12-27  
> **Status**: ✅ All tests passing

## Test Summary

| Category       | Suites | Tests | Passed | Skipped |
| -------------- | ------ | ----- | ------ | ------- |
| **Python**     | 21     | 82    | 82     | 0       |
| **Node (Nx)**  | 7      | 58    | 56     | 2       |
| **Generators** | 9      | 38    | 34     | 4       |
| **Rust**       | 2      | 2     | 2      | 0       |
| **Total**      | 39     | 180+  | 174+   | 6       |

---

## By Test Category

### Python Tests (`tests/` via pytest)

| File                                          | Tests |
| --------------------------------------------- | ----- |
| `tests/copier/test_copier_invariants.py`      | 11    |
| `tests/copier/test_logfire_template.py`       | 1     |
| `tests/copier/test_smoke_generation.py`       | 4     |
| `tests/observability/test_logfire_metrics.py` | 3     |
| `tests/python/logging/test_logfire_*.py`      | 25    |
| `tests/temporal/*.py`                         | 23    |
| `tests/template/test_template_generation.py`  | 1     |
| Other unit tests                              | 14    |

### Node Tests (7 Nx Projects)

| Project                             | Tests |
| ----------------------------------- | ----- |
| `@nx-ddd-hex-plugin/type-generator` | 12    |
| `shared-domain`                     | 13    |
| `shared-web`                        | 4     |
| `@vibepro/node-logging`             | 3     |
| `generators-idempotency`            | 1     |
| `ai-context-tools`                  | 6     |
| `generator-smoke-tests`             | 22    |

### Generator Tests (`tests/generators/`)

| File                        | Tests    |
| --------------------------- | -------- |
| `idempotency.test.ts`       | 1        |
| `meta-generator.test.ts`    | 8        |
| `service-structure.test.ts` | 5        |
| `spec_*.test.ts`            | Multiple |
| `schema-to-types.test.ts`   | Multiple |

### Rust Tests

| Crate             | Tests                  |
| ----------------- | ---------------------- |
| `temporal-ai`     | 1 (build verification) |
| `vibepro-observe` | 1 (OTLP integration)   |

---

## Skipped Tests

| Test                                      | Reason                      |
| ----------------------------------------- | --------------------------- |
| `type-generator/test_json_stub.test.ts`   | Intentionally skipped       |
| `temporal-ai-client.spec.ts::integration` | Requires temporal-ai binary |
| 4 generator tests                         | Schema fixtures pending     |

---

## Commands

```bash
# Run all tests
just test-all

# Run by category
just test-python      # Python tests
just test-node        # Node tests via Nx
just test-generators  # Generator tests

# E2E tests
just test-e2e

# Full CI locally
./scripts/ci-local.sh all
```

---

## CI Parity

Local and CI environments are aligned via:

1. **Version lockfile**: `.mise.toml` + `package.json` packageManager field
2. **CI local script**: `./scripts/ci-local.sh` mirrors all CI jobs
3. **Docker mode**: `./scripts/ci-local.sh docker` for full parity
