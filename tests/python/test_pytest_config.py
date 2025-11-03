from __future__ import annotations

import configparser
import subprocess
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
PYTEST_CONFIG = PROJECT_ROOT / "pytest.ini"


def _read_pytest_ini() -> configparser.ConfigParser:
    config = configparser.ConfigParser()
    config.read(PYTEST_CONFIG)
    return config


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

    result = subprocess.run(
        [
            sys.executable,
            "-m",
            "pytest",
            "--collect-only",
            "tests/temporal/test_database.py",
        ],
        cwd=PROJECT_ROOT,
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0, result.stderr
    assert "test_database.py" in result.stdout, "Temporal database suite should be discoverable"
