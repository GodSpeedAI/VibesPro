from __future__ import annotations

import os
from pathlib import Path
from typing import Any


def test_generate_template_noninteractive(copier: Any):
    """Generate the built-in template non-interactively and verify basic output.

    Uses the pytest-copier fixture. Sets COPIER_SKIP_PROJECT_SETUP to avoid
    running heavy post-gen install/build steps that can hang in tests.
    """

    template_path = Path(__file__).resolve().parents[2] / "templates" / "{{project_slug}}"
    assert template_path.exists(), f"Template not found at {template_path}"

    os.environ.setdefault("COPIER_SKIP_PROJECT_SETUP", "1")

    # Run copier non-interactively with defaults to avoid prompts
    result = copier.copy(str(template_path), no_input=True, defaults=True)

    assert result.exit_code == 0
    assert result.exception is None
    project_dir = result.project_dir
    assert project_dir.exists()
    assert (project_dir / "copier.yml").exists() or (project_dir / "README.md").exists()
