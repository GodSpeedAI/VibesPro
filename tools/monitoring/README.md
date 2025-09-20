# Monitoring Toolkit

This directory contains utilities for measuring template generation performance.

## generation_benchmark.py

Runs `copier copy` with the sample fixture in `tests/fixtures/test-data.yml` and
records the duration in `.monitoring/metrics.json`. Use this as a baseline for
performance regression tracking.

```bash
uv run tools/monitoring/generation_benchmark.py
```
