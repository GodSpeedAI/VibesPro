#!/usr/bin/env python3
"""Validate Copier templates render without errors.

This script performs a dry-run validation of all Jinja2 templates
to ensure they render correctly with default answers.

Invariant: INV-02 - All Jinja2 templates must render without errors

Usage:
    python tools/copier/validate_templates.py

Traceability: AI_ADR-001, AI_SDS-001
"""

from __future__ import annotations

import shutil
import subprocess
import sys
import tempfile
from pathlib import Path


def main() -> int:
    """Run template validation."""
    repo_root = Path(__file__).parent.parent.parent
    smoke_data = repo_root / "tests/fixtures/smoke-data.yml"

    if not smoke_data.exists():
        print(f"❌ Smoke data file not found: {smoke_data}")
        return 1

    print("🔍 Validating Copier templates...")

    temp_dir = tempfile.mkdtemp(prefix="copier-validate-templates-")
    try:
        # Run copier with --pretend to validate without writing files
        result = subprocess.run(
            [
                "copier",
                "copy",
                "--pretend",
                "--defaults",
                "--trust",
                "--data-file",
                str(smoke_data),
                ".",
                temp_dir,
            ],
            capture_output=True,
            text=True,
            cwd=repo_root,
        )

        if result.returncode != 0:
            print("❌ Template validation failed!")
            print("STDOUT:", result.stdout)
            print("STDERR:", result.stderr)
            return 1

        print("✅ All templates validated successfully")
        return 0
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)


if __name__ == "__main__":
    sys.exit(main())
