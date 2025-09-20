#!/usr/bin/env python3
"""Pre-generation validation hook for Copier."""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any, Dict


REQUIRED_ARCHITECTURES = {"hexagonal", "layered", "microservices"}


def validate_project_config(context: Dict[str, Any]) -> None:
    """Validate the Copier context before generation begins."""

    project_slug = context.get("project_slug", "")
    if not project_slug or not project_slug.replace("-", "").isalnum():
        print("❌ Invalid project_slug. Must be kebab-case alphanumeric.")
        sys.exit(1)

    email = context.get("author_email", "")
    if "@" not in email:
        print("❌ Invalid author_email format.")
        sys.exit(1)

    architecture = context.get("architecture_style")
    if architecture not in REQUIRED_ARCHITECTURES:
        print(
            "❌ Invalid architecture_style. Must be one of: "
            + ", ".join(sorted(REQUIRED_ARCHITECTURES))
        )
        sys.exit(1)

    print("✅ Project configuration validated successfully")


def main() -> None:
    # Copier passes the context path via COPIER_CONFID global.
    # For now we load the rendered context JSON if available.
    print("🔧 Running pre-generation validation...")

    context_path = Path.cwd() / "copier_answers.json"
    context: Dict[str, Any]
    if context_path.exists():
        context = json.loads(context_path.read_text())
    else:
        # Placeholder until Copier hook wiring is implemented.
        context = {}

    if not context:
        print('⚠️ No copier context available; skipping pre-generation validation.')
        return

    validate_project_config(context)


if __name__ == "__main__":
    main()
