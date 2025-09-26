# tools/performance/reporter.py
from __future__ import annotations

import argparse
import json
from collections.abc import Mapping
from pathlib import Path
from typing import Any


def generate_report(metrics_file: str | Path, output_file: str | Path) -> None:
    """
    Generates a performance report from a JSON metrics file.
    """
    metrics_path = Path(metrics_file)
    output_path = Path(output_file)
    raw_metrics = json.loads(metrics_path.read_text(encoding="utf-8"))
    if not isinstance(raw_metrics, Mapping):
        raise ValueError("Metrics file must contain a JSON object.")
    metrics: Mapping[str, Any] = raw_metrics

    with output_path.open("w", encoding="utf-8") as f:
        f.write("# Performance Report\n\n")
        f.write("| Metric             | Value         | Threshold     | Status |\n")
        f.write("|--------------------|---------------|---------------|--------|\n")

        # Generation Time
        gen_time_ms = float(metrics.get("generationTime", 0.0))
        gen_time = gen_time_ms / 1000.0
        gen_threshold = 30
        gen_status = "✅" if gen_time < gen_threshold else "❌"
        f.write(
            f"| Generation Time    | {gen_time:.2f}s       | < {gen_threshold}s      | {gen_status} |\n"
        )

        # Build Time
        build_time_ms = float(metrics.get("buildTime", 0.0))
        build_time = build_time_ms / 1000.0
        build_threshold = 120
        build_status = "✅" if build_time < build_threshold else "❌"
        f.write(
            f"| Build Time         | {build_time:.2f}s       | < {build_threshold}s     | {build_status} |\n"
        )

        # Memory Usage
        mem_usage_bytes = float(metrics.get("memoryUsage", 0.0))
        mem_usage = mem_usage_bytes / (1024.0 * 1024.0)
        mem_threshold = 512
        mem_status = "✅" if mem_usage < mem_threshold else "❌"
        f.write(
            f"| Memory Usage (MB)  | {mem_usage:.2f}MB      | < {mem_threshold}MB     | {mem_status} |\n"
        )

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate performance reports.")
    parser.add_argument("metrics_file", help="Path to the JSON metrics file.")
    parser.add_argument("output_file", help="Path to the output report file.")
    args = parser.parse_args()
    generate_report(args.metrics_file, args.output_file)
