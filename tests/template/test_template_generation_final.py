from __future__ import annotations

import os
from pathlib import Path
from typing import Any


def test_generate_template_final(copier: Any):
    """Generate the template non-interactively and verify output.

    This test sets COPIER_SKIP_PROJECT_SETUP to skip heavy installs and passes
    a minimal `github` context so Jinja renders templates that reference it.
    """

    template_path = Path(__file__).resolve().parents[2] / "templates" / "{{project_slug}}"
    assert template_path.exists(), f"Template not found at {template_path}"

    os.environ["COPIER_SKIP_PROJECT_SETUP"] = "1"

    extra_context = {
        "github": {
            "ref": "refs/heads/main",
            "repository": "GodSpeedAI/VibesPro",
            "repository_owner": "GodSpeedAI",
        }
    }

    result = copier.copy(str(template_path), no_input=True, defaults=True, data=extra_context)

    assert result.exit_code == 0, f"copier failed: {result.exception}"
    project_dir = result.project_dir
    assert project_dir.exists()
    assert (project_dir / "copier.yml").exists() or (project_dir / "README.md").exists()
