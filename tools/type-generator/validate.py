#!/usr/bin/env python3
"""Wrapper to call the Node typegen verify command.
Usage: python validate.py <ts_dir> <py_dir>
"""

import subprocess
import sys
from pathlib import Path

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: validate.py <ts_dir> <py_dir>")
        sys.exit(2)
    ts_dir = sys.argv[1]
    py_dir = sys.argv[2]
    cwd = Path(__file__).parent
    try:
        subprocess.check_call(["node", "./cli.js", "verify", ts_dir, py_dir], cwd=cwd)
    except subprocess.CalledProcessError as e:
        print(f"Command failed: {e}")
        sys.exit(1)
