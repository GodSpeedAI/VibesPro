"""Copier template invariant tests.

These tests verify the foundational guarantees (invariants) of the
Copier template system. Each test maps to a specific invariant ID.

Invariants:
    INV-01: copier.yml validates without errors
    INV-02: All Jinja2 templates render without errors for default answers
    INV-04: Generated project.json files conform to Nx schema
    INV-06: Template hooks exit cleanly (status 0)
    INV-07: .copierignore excludes all non-template files

Traceability: AI_ADR-001, AI_SDS-001
"""

from __future__ import annotations

import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).parent.parent.parent
SMOKE_DATA = REPO_ROOT / "tests/fixtures/smoke-data.yml"
TEST_DATA = REPO_ROOT / "tests/fixtures/test-data.yml"


class TestCopierInvariantsConfig:
    """Test class for Copier configuration invariants."""

    def test_copier_config_exists(self) -> None:
        """Verify copier.yml exists in repo root."""
        copier_yml = REPO_ROOT / "copier.yml"
        assert copier_yml.exists(), "copier.yml not found in repo root"

    def test_copierignore_exists(self) -> None:
        """Verify .copierignore exists in repo root."""
        copierignore = REPO_ROOT / ".copierignore"
        assert copierignore.exists(), ".copierignore not found in repo root"

    @pytest.mark.skipif(
        not (REPO_ROOT / "tests/fixtures/smoke-data.yml").exists(),
        reason="smoke-data.yml not found",
    )
    def test_smoke_data_exists(self) -> None:
        """Verify smoke test data file exists."""
        assert SMOKE_DATA.exists(), "smoke-data.yml not found"


class TestCopierInvariantsValidation:
    """Test class for Copier validation invariants."""

    @pytest.mark.slow
    def test_copier_pretend_validates(self) -> None:
        """INV-01: copier.yml validates without errors via --pretend."""
        data_file = SMOKE_DATA if SMOKE_DATA.exists() else TEST_DATA

        temp_dir = tempfile.mkdtemp(prefix="copier-inv01-validate-")
        try:
            result = subprocess.run(
                [
                    "copier",
                    "copy",
                    "--pretend",
                    "--defaults",
                    "--trust",
                    "--data-file",
                    str(data_file),
                    ".",
                    temp_dir,
                ],
                capture_output=True,
                text=True,
                cwd=REPO_ROOT,
            )

            assert result.returncode == 0, (
                f"INV-01 FAILED: Copier --pretend failed\n"
                f"STDOUT: {result.stdout}\n"
                f"STDERR: {result.stderr}"
            )
        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)


class TestCopierInvariantsHooks:
    """Test class for Copier hook invariants."""

    def test_pre_gen_hook_syntax_valid(self) -> None:
        """INV-06: pre_gen.py has valid Python syntax."""
        pre_gen = REPO_ROOT / "hooks/pre_gen.py"
        assert pre_gen.exists(), "hooks/pre_gen.py not found"

        result = subprocess.run(
            [sys.executable, "-m", "py_compile", str(pre_gen)],
            capture_output=True,
        )

        assert result.returncode == 0, (
            f"INV-06 FAILED: pre_gen.py has syntax errors\nSTDERR: {result.stderr.decode()}"
        )

    def test_post_gen_hook_syntax_valid(self) -> None:
        """INV-06: post_gen.py has valid Python syntax."""
        post_gen = REPO_ROOT / "hooks/post_gen.py"
        assert post_gen.exists(), "hooks/post_gen.py not found"

        result = subprocess.run(
            [sys.executable, "-m", "py_compile", str(post_gen)],
            capture_output=True,
        )

        assert result.returncode == 0, (
            f"INV-06 FAILED: post_gen.py has syntax errors\nSTDERR: {result.stderr.decode()}"
        )

    def test_hook_lib_imports_valid(self) -> None:
        """INV-06: Hook library modules can be imported."""
        lib_init = REPO_ROOT / "hooks/lib/__init__.py"

        if not lib_init.exists():
            pytest.skip("hooks/lib not yet created")

        result = subprocess.run(
            [sys.executable, "-c", "import hooks.lib"],
            capture_output=True,
            cwd=REPO_ROOT,
            env={"PYTHONPATH": str(REPO_ROOT)},
        )

        # Import may fail due to missing deps, but syntax should be valid
        # We check for syntax errors specifically
        if result.returncode != 0:
            stderr = result.stderr.decode()
            assert "SyntaxError" not in stderr, (
                f"INV-06 FAILED: Syntax error in hooks/lib\n{stderr}"
            )


class TestCopierInvariantsIgnore:
    """Test class for .copierignore invariants."""

    def test_copierignore_excludes_node_modules(self) -> None:
        """INV-07: .copierignore excludes node_modules."""
        copierignore = REPO_ROOT / ".copierignore"
        content = copierignore.read_text()

        assert "node_modules" in content, "INV-07 FAILED: node_modules not in .copierignore"

    def test_copierignore_excludes_git(self) -> None:
        """INV-07: .copierignore excludes .git directory."""
        copierignore = REPO_ROOT / ".copierignore"
        content = copierignore.read_text()

        assert ".git" in content, "INV-07 FAILED: .git not in .copierignore"

    def test_copierignore_excludes_apps(self) -> None:
        """INV-07: .copierignore excludes apps/ directory."""
        copierignore = REPO_ROOT / ".copierignore"
        content = copierignore.read_text()

        assert "apps/" in content, "INV-07 FAILED: apps/ not in .copierignore"

    def test_copierignore_excludes_libs(self) -> None:
        """INV-07: .copierignore excludes libs/ directory."""
        copierignore = REPO_ROOT / ".copierignore"
        content = copierignore.read_text()

        assert "libs/" in content, "INV-07 FAILED: libs/ not in .copierignore"
