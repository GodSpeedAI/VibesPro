#!/usr/bin/env python3
"""Simple benchmarking utility for template generation."""

from __future__ import annotations

import json
import subprocess
import time
from pathlib import Path

DATA_FILE = Path("tests/fixtures/test-data.yml")
OUTPUT_DIR = Path(".monitoring/test-output")


def run_generation() -> float:
    start = time.perf_counter()
    subprocess.run(
        [
            "copier",
            "copy",
            ".",
            str(OUTPUT_DIR),
            "--data-file",
            str(DATA_FILE),
            "--force",
        ],
        check=True,
    )
    return time.perf_counter() - start


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    duration = run_generation()

    metrics = {
        "template_generation_seconds": round(duration, 4),
        "sample_data_file": str(DATA_FILE),
        "output_directory": str(OUTPUT_DIR),
    }

    metrics_path = Path(".monitoring/metrics.json")
    metrics_path.write_text(json.dumps(metrics, indent=2))
    print(json.dumps(metrics, indent=2))


if __name__ == "__main__":
    main()
