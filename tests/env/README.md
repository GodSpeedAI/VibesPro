# Environment Test Harness

This directory contains lightweight environment tests and helpers used by `just test:env`.

How to run:

```sh
just test:env
```

Files:

- `helpers.sh` - small shell helpers for assertions and temp dirs
- `run.sh` - discovers and runs `tests/env/test_*.sh`
- `test_*.sh` - individual tests

Tests are intentionally minimal and POSIX/sh-compatible.
