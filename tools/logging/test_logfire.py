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
    repo_root = Path(__file__).resolve().parents[2]
    repo_root_str = str(repo_root)
    if repo_root_str not in sys.path:
        sys.path.insert(0, repo_root_str)


def main() -> int:
    """Verify that the Logfire bootstrap helper is available."""
    _ensure_repo_root_on_path()
    module = importlib.import_module("libs.python.vibepro_logging")
    if not hasattr(module, "bootstrap_logfire"):
        print(
            "::error::Missing bootstrap_logfire in libs.python.vibepro_logging"
        )  # DEV-PRD-018 DEV-SDS-018
        return 1

    print("✅ Logfire bootstrap helper is available")
    return 0


if __name__ == "__main__":
    sys.exit(main())
