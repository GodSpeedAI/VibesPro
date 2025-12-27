from __future__ import annotations

from pathlib import Path
from typing import Any

import jinja2
import pytest

pytest.importorskip("pytest_copier", reason="copier template tests require pytest-copier")


def _generate_template(copier: Any, destination: Path) -> Path:
    """Render the template into ``destination`` using the standard Copier fixtures."""
    copier.setenv("COPIER_SKIP_PROJECT_SETUP", "1")

    template_path = Path(__file__).resolve().parents[2] / "templates" / "{{project_slug}}"

    extra_context = {
        "github": {
            "ref": "refs/heads/main",
            "repository": "GodSpeedAI/VibesPro",
            "repository_owner": "GodSpeedAI",
        },
        "steps": {
            "cache-key": {"outputs": {"mise_cache_key": "dummy-key"}},
            "vers": {"outputs": {"node": "20", "python": "3.12", "rust": "stable"}},
        },
    }

    worker = copier.worker(src_path=template_path, dst=destination, **extra_context)
    worker.jinja_env.undefined = jinja2.DebugUndefined

    try:
        worker.exclude = (".github/workflows/**",)
    except AttributeError:
        # Copiers prior to 9.2 expose ``exclude`` as a read-only property.
        # Rely on DebugUndefined to tolerate missing workflow inputs instead.
        pass

    worker.run_copy()
    return destination


def test_logfire_env_vars_are_rendered(copier: Any, tmp_path: Path) -> None:
    """Generated projects must expose Logfire configuration placeholders."""
    project_path = _generate_template(copier, tmp_path)

    env_file = project_path / ".env.example"
    assert env_file.exists(), ".env.example file missing from generated template"

    contents = env_file.read_text()
    required_placeholders = [
        "LOGFIRE_TOKEN=",
        "LOGFIRE_ENVIRONMENT=",
        "LOGFIRE_SERVICE_NAME=",
        "LOGFIRE_SEND_TO_LOGFIRE=",
    ]

    for placeholder in required_placeholders:
        assert placeholder in contents, (
            f"Expected '{placeholder}' placeholder in rendered .env.example file"
        )
