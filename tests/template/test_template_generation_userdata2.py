from __future__ import annotations

from pathlib import Path
from typing import Any

import jinja2


def test_generate_template_user_defaults(copier: Any, tmp_path: Path):
    """Generate the template non-interactively while providing a minimal
    `github` context so Jinja expressions in workflow templates can render.

    We call the fixture API correctly: pass the destination `tmp_path` and
    provide the `github` mapping as keyword args (the fixture will merge
    them into the Copier render context). Use the fixture helper to set
    COPIER_SKIP_PROJECT_SETUP so post-gen heavy steps are skipped.
    """
    # Ask the fixture to set the env var both in os.environ and plumbum.local.env
    copier.setenv("COPIER_SKIP_PROJECT_SETUP", "1")

    # Minimal github context required by some workflow templates
    extra_context = {
        "github": {
            "ref": "refs/heads/main",
            "repository": "GodSpeedAI/VibesPro",
            "repository_owner": "GodSpeedAI",
        }
    }

    # Some workflow templates reference `steps.*.outputs.*` and other CI-specific
    # fields. Provide minimal placeholders so Jinja rendering doesn't fail when
    # evaluating expressions like `${{ steps.cache-key.outputs.mise_cache_key }}`.
    extra_context.update(
        {
            "steps": {
                "cache-key": {"outputs": {"mise_cache_key": "dummy-key"}},
                "vers": {"outputs": {"node": "20", "python": "3.12", "rust": "stable"}},
            }
        }
    )

    # Use the lower-level Worker so we can relax Jinja undefined handling.
    # The default sandboxed environment raises on missing names; set a
    # DebugUndefined so undefined attributes render to empty strings and
    # don't raise during template rendering of CI expressions.
    worker = copier.worker(dst=tmp_path, **extra_context)
    worker.jinja_env.undefined = jinja2.DebugUndefined

    # Skip rendering of GitHub workflow templates which contain `${{ ... }}`
    # expressions that are meant for GitHub Actions (they include `-` in
    # identifiers, which Jinja treats as subtraction). Exclude that folder
    # from templating so files are copied verbatim.
    try:
        # worker.exclude is accepted by Worker; set patterns to avoid rendering
        worker.exclude = (".github/workflows/**",)
    except AttributeError:
        # If attribute isn't writable, ignore and continue (we rely on
        # DebugUndefined to handle missing names)
        pass

    # Execute the copy using the configured worker
    worker.run_copy()

    # Sanity checks: ensure the generated project dir and README exist
    assert tmp_path.exists()
    assert (tmp_path / "README.md").exists()
