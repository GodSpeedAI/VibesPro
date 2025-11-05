from __future__ import annotations

import configparser
import re
import subprocess
import sys
from pathlib import Path

import pytest

PROJECT_ROOT = Path(__file__).resolve().parents[2]
PYTEST_CONFIG = PROJECT_ROOT / "pytest.ini"


def _read_pytest_ini() -> configparser.ConfigParser:
    if not PYTEST_CONFIG.exists():
        pytest.skip(f"pytest.ini not found at expected path: {PYTEST_CONFIG}")
    config = configparser.ConfigParser()
    config.read(PYTEST_CONFIG)
    return config


def _short(text: str | None, limit: int = 1000) -> str:
    if not text:
        return "<empty>"
    text = str(text)
    if len(text) <= limit:
        return text
    return text[:limit] + "... [truncated]"


def test_temporal_and_integration_paths_are_not_excluded():
    config = _read_pytest_ini()
    assert config.has_section("pytest"), "pytest.ini must expose a [pytest] section"

    norecursedirs = config.get("pytest", "norecursedirs", fallback="")
    forbidden = {"tests/temporal", "tests/integration", "temporal", "integration"}
    configured = {
        token.strip() for token in norecursedirs.replace("\n", " ").split() if token.strip()
    }
    blocked = sorted(configured & forbidden)
    assert not blocked, f"pytest.ini still excludes directories: {blocked}"

    try:
        result = subprocess.run(
            [
                sys.executable,
                "-m",
                "pytest",
                "--collect-only",
                "tests/temporal/",
            ],
            cwd=PROJECT_ROOT,
            capture_output=True,
            text=True,
            timeout=60,
        )
    except subprocess.TimeoutExpired as exc:
        pytest.fail(f"pytest timed out after {exc.timeout} seconds: {exc}")

    msg = (
        f"pytest exit {result.returncode}\n"
        f"stdout:\n{_short(result.stdout)}\n"
        f"stderr:\n{_short(result.stderr)}"
    )
    assert result.returncode == 0, msg
    match = re.search(r"(\d+)\s+tests?\s+collected", result.stdout)
    assert match, "Unable to determine collected test count for temporal suite"
    assert int(match.group(1)) > 0, "Temporal tests directory should yield collected tests"
