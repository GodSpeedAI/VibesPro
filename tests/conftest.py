import os
from pathlib import Path
from shutil import copy, copytree

import pytest

from temporal_db.python.repository import TemporalRepository, initialize_temporal_database

PYTEST_COPIER_AVAILABLE = False
try:
    from pytest_copier.errors import RunError
    from pytest_copier.plugin import run as copier_run
except ModuleNotFoundError:  # pragma: no cover - environment without pytest-copier
    PYTEST_COPIER_AVAILABLE = False
else:
    PYTEST_COPIER_AVAILABLE = True


try:
    from _pytest.path import LEGACY_PATH
except ImportError:
    LEGACY_PATH = Path


@pytest.fixture
async def temporal_repository(tmp_path: Path) -> TemporalRepository:
    """Async pytest fixture for TemporalRepository with proper cleanup."""
    db_path = tmp_path / "test.db"
    repo = await initialize_temporal_database(str(db_path))
    try:
        yield repo
    finally:
        await repo.close()


def pytest_ignore_collect(collection_path: LEGACY_PATH, config: pytest.Config, **_):
    """Ignore legacy duplicate template tests that interfere with canonical test run.

    We intentionally keep a single canonical test: `tests/template/test_template_generation.py`
    and ignore older variants that were added during iterative debugging. This keeps the
    test run deterministic and avoids extra Jinja rendering failures.
    """
    ignored = {
        "test_template_generation_final.py",
        "test_template_generation_run.py",
        "test_template_generation_uv.py",
        "test_template_generation_userdata2.py",
    }

    name = collection_path.name
    return name in ignored


if PYTEST_COPIER_AVAILABLE:
    _DEFAULT_TEMPLATE_SKIP = [
        "end-of-file-fixer",
        "ruff",
        "ruff-format",
        "shellcheck",
        "prettier",
        "trim-trailing-whitespace",
        "check-shebang-scripts-are-executable",
        "spec-matrix",
    ]

    def _copy_template_tree(template_root: Path, src: Path, template_paths: list[str]) -> None:
        if template_paths:
            for path in template_paths:
                full_path = template_root / path
                if full_path.is_dir():
                    copytree(full_path, src / path, dirs_exist_ok=True)
                else:
                    copy(full_path, src / path)
        else:
            copytree(template_root, src, dirs_exist_ok=True)

    def _initial_commit_with_allow_empty(repo_path: Path) -> None:
        """Stage all files and create an initial commit, allowing empty trees."""
        copier_run("git", "add", "-A", ".", cwd=repo_path)
        original_skip = os.environ.get("SKIP")
        skip_parts = []
        if original_skip:
            skip_parts.extend([p.strip() for p in original_skip.split(",") if p.strip()])
        for hook in _DEFAULT_TEMPLATE_SKIP:
            if hook not in skip_parts:
                skip_parts.append(hook)
        os.environ["SKIP"] = ",".join(skip_parts)

        try:
            copier_run("git", "commit", "-m", "test", cwd=repo_path)
        except RunError:
            copier_run("git", "commit", "--allow-empty", "-m", "test", cwd=repo_path)
        finally:
            if original_skip is not None:
                os.environ["SKIP"] = original_skip
            else:
                os.environ.pop("SKIP", None)

    @pytest.fixture(scope="session")
    def copier_template(
        tmp_path_factory: pytest.TempPathFactory,
        copier_template_root: Path,
        copier_template_paths: list[str],
        default_gitconfig,
    ) -> Path:
        """Override pytest-copier fixture to tolerate clean working trees.

        The upstream fixture assumes ``git commit`` always has staged changes.
        Our template setup sometimes produces an already clean tree, so the commit
        exits with status 1 and breaks the test. We recreate the fixture here but
        fall back to ``--allow-empty`` so the repository always has an initial
        commit to tag.
        """

        src = tmp_path_factory.mktemp("src", False)
        _ = default_gitconfig  # ensure fixture is initialised for git configuration
        _copy_template_tree(copier_template_root, src, copier_template_paths)

        copier_run("git", "init", cwd=src)
        _initial_commit_with_allow_empty(src)
        copier_run("git", "tag", "99.99.99", cwd=src)
        return src
