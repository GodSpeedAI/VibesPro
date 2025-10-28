#!/usr/bin/env python3
# mypy: ignore-errors
#!/usr/bin/env python3
"""Pre-generation validation hook for Copier."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any

REQUIRED_ARCHITECTURES = {"hexagonal", "layered", "microservices"}


def validate_project_config(context: dict[str, Any]) -> None:
    """Validate the Copier context before generation begins."""

    project_slug = context.get("project_slug", "")
    if not project_slug:
        print("❌ Missing project_slug in Copier context.")
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


def normalize_identifier(name: str) -> str:
    """Normalize an identifier to Android package-friendly form.

    Rules applied:
    - lowercase
    - replace any character not in [a-z0-9_] with underscore
    - ensure it starts with a lowercase letter; if not, prefix with 'a'
    """
    if not name:
        return ""
    s = name.lower()
    # replace invalid chars with underscore
    s = re.sub(r"[^a-z0-9_]", "_", s)
    # ensure it starts with a letter
    if not s or not re.match(r"^[a-z]", s):
        s = "a_" + s
    return s


def is_valid_identifier(name: str) -> bool:
    """Return True if name matches the Android identifier rule ^[a-z][a-z0-9_]*$"""
    if not name:
        return False
    return bool(re.fullmatch(r"[a-z][a-z0-9_]*", name))


def main() -> None:
    # Copier passes the context path via COPIER_CONFID global.
    # For now we load the rendered context JSON if available.
    print("🔧 Running pre-generation validation...")

    context_path = Path.cwd() / "copier_answers.json"
    context: dict[str, Any]
    if context_path.exists():
        context = json.loads(context_path.read_text())
    else:
        # Placeholder until Copier hook wiring is implemented.
        context = {}

    if not context:
        print("⚠️ No copier context available; skipping pre-generation validation.")
        return

    validate_project_config(context)

    # Normalize project_slug and app_name for Android package names
    project_slug = context.get("project_slug", "")
    app_name = context.get("app_name", "")

    normalized_project_slug = normalize_identifier(project_slug)
    normalized_app_name = normalize_identifier(app_name)

    # Honor strict mode if requested in the copier context
    fail_on_invalid = bool(context.get("fail_on_invalid_identifiers", False))

    # If strict, error out if identifiers are invalid
    if fail_on_invalid:
        if not is_valid_identifier(normalized_project_slug) or not is_valid_identifier(
            normalized_app_name
        ):
            print(
                "❌ Invalid project_slug or app_name for Android package naming."
                " Set 'fail_on_invalid_identifiers' to false to auto-normalize."
            )
            print(f"project_slug: '{project_slug}' -> normalized: '{normalized_project_slug}'")
            print(f"app_name: '{app_name}' -> normalized: '{normalized_app_name}'")
            sys.exit(1)

    changed = False
    if normalized_project_slug != project_slug:
        print(f"ℹ️ Normalizing project_slug: '{project_slug}' -> '{normalized_project_slug}'")
        context["project_slug"] = normalized_project_slug
        changed = True

    if normalized_app_name != app_name:
        print(f"ℹ️ Normalizing app_name: '{app_name}' -> '{normalized_app_name}'")
        context["app_name"] = normalized_app_name
        changed = True

    if changed:
        # Persist normalized values back to the answers file so template rendering uses them
        try:
            context_path.write_text(json.dumps(context, indent=2))
            print("✅ Normalized identifiers written back to copier_answers.json")
        except Exception as exc:
            print(f"❌ Failed to write normalized context: {exc}")
            sys.exit(1)


if __name__ == "__main__":
    main()
