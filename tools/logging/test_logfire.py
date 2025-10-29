#!/usr/bin/env python3
"""Logfire bootstrap smoke test.

This script provides a minimal regression guard that ensures the Logfire
bootstrap helper is importable. It is intentionally lightweight so it can run
both in local `just` recipes and CI workflows.
"""

from __future__ import annotations

import importlib
import sys
from pathlib import Path


def _ensure_repo_root_on_path() -> None:
    """Add the repository root to sys.path so local modules can be imported."""
    # Start from the current file's directory and search upward for repository markers
    current_dir = Path(__file__).resolve().parent
    repo_root = None

    # Search for repository markers
    while True:
        # Check if we've reached the filesystem root
        if current_dir == current_dir.parent:
            break

        # Check for repository markers
        for marker in ["pyproject.toml", "setup.cfg", ".git"]:
            if (current_dir / marker).exists():
                repo_root = current_dir
                break

        if repo_root is not None:
            break

        current_dir = current_dir.parent

    # If no marker found, fall back to the original approach
    if repo_root is None:
        repo_root = Path(__file__).resolve().parents[2]

    repo_root_str = str(repo_root)
    if repo_root_str not in sys.path:
        sys.path.insert(0, repo_root_str)


def main() -> int:
    """Verify that the Logfire bootstrap helper is available."""
    _ensure_repo_root_on_path()

    try:
        module = importlib.import_module("libs.python.vibepro_logging")
    except ImportError as e:
        print(f"::error::Failed to import libs.python.vibepro_logging: {e}")
        return 1
    except Exception as e:
        print(f"::error::Unexpected error importing libs.python.vibepro_logging: {e}")
        return 1

    if not hasattr(module, "bootstrap_logfire"):
        print(
            "::error::Missing bootstrap_logfire in libs.python.vibepro_logging"
        )  # DEV-PRD-018 DEV-SDS-018
        return 1

    print("✅ Logfire bootstrap helper is available")
    return 0


if __name__ == "__main__":
    sys.exit(main())
