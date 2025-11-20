#!/usr/bin/env python3
"""Simple Python wrapper that delegates to the TypeScript CLI for type generation.
Usage: python generate.py <schema-json> [--output-dir <dir>]
"""

import subprocess
import sys
from pathlib import Path

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: generate.py <schema-json> [--output-dir <dir>]")
        sys.exit(2)
    schema = sys.argv[1]
    args = ["node", "./cli.js", "generate", schema]
    if len(sys.argv) > 2:
        args.extend(sys.argv[2:])
    cwd = Path(__file__).parent
    try:
        subprocess.check_call(args, cwd=cwd)
    except subprocess.CalledProcessError as e:
        print(f"Command failed: {e}")
        sys.exit(1)
