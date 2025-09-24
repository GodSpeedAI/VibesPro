# tools/performance/reporter.py
import json
import argparse

def generate_report(metrics_file, output_file):
    """
    Generates a performance report from a JSON metrics file.
    """
    with open(metrics_file, 'r') as f:
        metrics = json.load(f)

    with open(output_file, 'w') as f:
        f.write("# Performance Report\n\n")
        f.write("| Metric             | Value         | Threshold     |\n")
        f.write("|--------------------|---------------|---------------|\n")

        # Generation Time
        gen_time = metrics.get('generationTime', 0) / 1000
        gen_threshold = 30
        gen_status = "✅" if gen_time < gen_threshold else "❌"
        f.write(f"| Generation Time    | {gen_time:.2f}s       | < {gen_threshold}s      | {gen_status}\n")

        # Build Time
        build_time = metrics.get('buildTime', 0) / 1000
        build_threshold = 120
        build_status = "✅" if build_time < build_threshold else "❌"
        f.write(f"| Build Time         | {build_time:.2f}s       | < {build_threshold}s     | {build_status}\n")

        # Memory Usage
        mem_usage = metrics.get('memoryUsage', 0) / (1024 * 1024)
        mem_threshold = 512
        mem_status = "✅" if mem_usage < mem_threshold else "❌"
        f.write(f"| Memory Usage (MB)  | {mem_usage:.2f}MB      | < {mem_threshold}MB     | {mem_status}\n")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate performance reports.")
    parser.add_argument("metrics_file", help="Path to the JSON metrics file.")
    parser.add_argument("output_file", help="Path to the output report file.")
    args = parser.parse_args()

    generate_report(args.metrics_file, args.output_file)
