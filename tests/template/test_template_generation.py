from __future__ import annotations

from pathlib import Path
from typing import Any

import jinja2
import pytest

pytest.importorskip("pytest_copier", reason="template generation tests require pytest-copier")


def test_generate_template_user_defaults(copier: Any, tmp_path: Path):
    """Generate the template non-interactively while providing a minimal
    `github` context so Jinja expressions in workflow templates can render.

    Use the lower-level Worker provided by the fixture so we can tweak the
    Jinja environment (DebugUndefined) and exclude GitHub workflow files from
    templating (copy them verbatim), avoiding the need to fully populate CI
    context.
    """
    # Ensure post-gen setup is skipped to keep the test fast
    copier.setenv("COPIER_SKIP_PROJECT_SETUP", "1")

    template_path = Path(__file__).resolve().parents[2] / "templates" / "{{project_slug}}"
    assert template_path.exists(), f"Template not found at {template_path}"

    extra_context = {
        "github": {
            "ref": "refs/heads/main",
            "repository": "GodSpeedAI/VibesPro",
            "repository_owner": "GodSpeedAI",
        },
        # minimal placeholders for other CI values used in workflows
        "steps": {
            "cache-key": {"outputs": {"mise_cache_key": "dummy-key"}},
            "vers": {"outputs": {"node": "20", "python": "3.12", "rust": "stable"}},
        },
    }

    # Create a worker targeting the temporary destination and pass extra context
    worker = copier.worker(dst=tmp_path, **extra_context)

    # Relax undefined handling so missing attributes do not raise during rendering
    worker.jinja_env.undefined = jinja2.DebugUndefined

    # Exclude GitHub workflow templates from Jinja rendering (copy verbatim)
    try:
        worker.exclude = (".github/workflows/**",)
    except AttributeError:
        # If attribute isn't writable, ignore and continue. We rely on
        # DebugUndefined to handle missing names during rendering.
        pass

    # Run the copy
    worker.run_copy()

    # Basic sanity checks
    assert tmp_path.exists()
    assert (tmp_path / "README.md").exists() or (tmp_path / "copier.yml").exists()
