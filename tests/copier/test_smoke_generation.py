"""Copier smoke generation test.

This test runs the full Copier generation with smoke-data.yml
and validates the output meets all invariants.

Traceability: AI_ADR-001, AI_SDS-001
"""

from __future__ import annotations

import os
import shutil
import subprocess
import tempfile
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).parent.parent.parent
SMOKE_DATA = REPO_ROOT / "tests/fixtures/smoke-data.yml"


@pytest.fixture
def smoke_output_dir():
    """Create a temporary directory for smoke test output."""
    temp_dir = tempfile.mkdtemp(prefix="copier-smoke-")
    yield Path(temp_dir)
    # Cleanup
    shutil.rmtree(temp_dir, ignore_errors=True)


class TestSmokeGeneration:
    """Test class for smoke test generation."""

    @pytest.mark.slow
    @pytest.mark.skipif(
        not SMOKE_DATA.exists(),
        reason="smoke-data.yml not found",
    )
    def test_smoke_generation_succeeds(self, smoke_output_dir: Path) -> None:
        """Verify smoke generation completes without errors."""
        result = subprocess.run(
            [
                "copier",
                "copy",
                "--defaults",
                "--trust",
                "--force",
                "--data-file",
                str(SMOKE_DATA),
                "--vcs-ref",
                "HEAD",
                ".",
                str(smoke_output_dir),
            ],
            capture_output=True,
            text=True,
            cwd=REPO_ROOT,
            env={
                **os.environ,
                "COPIER_SKIP_PROJECT_SETUP": "1",
            },
        )

        assert result.returncode == 0, (
            f"Smoke generation failed\nSTDOUT: {result.stdout}\nSTDERR: {result.stderr}"
        )

    @pytest.mark.slow
    @pytest.mark.skipif(
        not SMOKE_DATA.exists(),
        reason="smoke-data.yml not found",
    )
    def test_smoke_generates_expected_files(self, smoke_output_dir: Path) -> None:
        """Verify smoke generation creates expected files."""
        # Run generation first
        subprocess.run(
            [
                "copier",
                "copy",
                "--defaults",
                "--trust",
                "--force",
                "--data-file",
                str(SMOKE_DATA),
                "--vcs-ref",
                "HEAD",
                ".",
                str(smoke_output_dir),
            ],
            capture_output=True,
            cwd=REPO_ROOT,
            env={
                **os.environ,
                "COPIER_SKIP_PROJECT_SETUP": "1",
            },
        )

        # Check for expected files
        expected_files = [
            "package.json",
            "nx.json",
            "pyproject.toml",
            "justfile",
            "README.md",
        ]

        for filename in expected_files:
            file_path = smoke_output_dir / filename
            assert file_path.exists(), f"Expected file not generated: {filename}"

    @pytest.mark.slow
    @pytest.mark.skipif(
        not SMOKE_DATA.exists(),
        reason="smoke-data.yml not found",
    )
    def test_smoke_generates_copier_answers(self, smoke_output_dir: Path) -> None:
        """Verify smoke generation creates .copier-answers.yml."""
        # Run generation first
        subprocess.run(
            [
                "copier",
                "copy",
                "--defaults",
                "--trust",
                "--force",
                "--data-file",
                str(SMOKE_DATA),
                "--vcs-ref",
                "HEAD",
                ".",
                str(smoke_output_dir),
            ],
            capture_output=True,
            cwd=REPO_ROOT,
            env={
                **os.environ,
                "COPIER_SKIP_PROJECT_SETUP": "1",
            },
        )

        answers_file = smoke_output_dir / ".copier-answers.yml"
        assert answers_file.exists(), ".copier-answers.yml not generated"

    @pytest.mark.slow
    @pytest.mark.skipif(
        not SMOKE_DATA.exists(),
        reason="smoke-data.yml not found",
    )
    def test_smoke_generation_idempotent(self, smoke_output_dir: Path) -> None:
        """Verify running generation twice produces same output."""
        common_args = [
            "copier",
            "copy",
            "--defaults",
            "--trust",
            "--force",
            "--data-file",
            str(SMOKE_DATA),
            "--vcs-ref",
            "HEAD",
            ".",
            str(smoke_output_dir),
        ]

        env = {
            **os.environ,
            "COPIER_SKIP_PROJECT_SETUP": "1",
        }

        # First run
        subprocess.run(common_args, capture_output=True, cwd=REPO_ROOT, env=env)

        # Capture file content after first run
        package_json_1 = (smoke_output_dir / "package.json").read_text()

        # Second run (with --force to overwrite)
        subprocess.run(common_args, capture_output=True, cwd=REPO_ROOT, env=env)

        # Capture file content after second run
        package_json_2 = (smoke_output_dir / "package.json").read_text()

        # Should be identical (idempotent)
        assert package_json_1 == package_json_2, "Generation is not idempotent"
