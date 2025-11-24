# mypy: ignore-errors
# -*- coding: utf-8 -*-
"""
Renders all Jinja2 templates to validate them against a sample context.

This script is a crucial CI/CD tool for ensuring that Jinja2 templates
used by the Copier project generator are free of syntax errors and undefined
variables. It uses Jinja2's `StrictUndefined` mode, which raises an error
if any template variable is not present in the provided context.

Usage:
  # Check only templates in the 'docs' subdirectory (default)
  python tools/check_templates.py

  # Check all templates in the project
  python tools/check_templates.py --all

  # Check a specific subdirectory
  python tools/check_templates.py --subdir "path/to/dir"

The script exits with a non-zero status code if any template fails to render,
making it suitable for use in automated testing pipelines.

Security Note:
    This script configures Jinja2 with `autoescape=True` as a best practice
    to mitigate Cross-Site Scripting (XSS) risks, even though it is used as an
    offline validation tool. This ensures that if these templates were ever used
    in a web context, they would be safe by default.
"""

import argparse
import os
import sys
from typing import cast, Dict, Any

from jinja2 import Environment, FileSystemLoader, StrictUndefined

# nosemgrep: python.flask.security.xss.audit.direct-use-of-jinja2
# Justification: autoescape=True is explicitly enabled. This is an offline
# template validator for a FastAPI project, not a live Flask application.

# The root directory where the templates to be validated are located.
ROOT = os.path.join(os.getcwd(), "templates", "{{project_slug}}")

# A minimal, conservative sample context for rendering the templates.
# This context should contain all the common variables that templates are
# expected to use. Add new keys here as the project's templates evolve.
SAMPLE_CONTEXT: Dict[str, Any] = {
    "project_name": "Example Project",
    "project_slug": "example-project",
    "author_name": "Acme Maintainer",
    "repo_url": "https://github.com/example/example-project",
    "year": "2025",
}


def find_templates(root: str, subdir: str | None = None) -> list[str]:
    """
    Finds all Jinja2 template files (`.j2`) within a given directory.

    Args:
        root (str): The absolute path to the root directory to start the search from.
        subdir (str, optional): If specified, restricts the search to only this
                                subdirectory within the root.

    Returns:
        list[str]: A sorted list of template file paths, relative to the root
                   directory. The paths use forward slashes for consistency.
    """
    templates = []
    for dirpath, _, filenames in os.walk(root):
        for f in filenames:
            if f.endswith(".j2"):
                rel_path = os.path.relpath(os.path.join(dirpath, f), root)
                # Normalize path separators for cross-platform consistency.
                rel_path_posix = rel_path.replace(os.path.sep, "/")
                if subdir:
                    # Check if the template is within the specified subdirectory.
                    if rel_path_posix.startswith(subdir.rstrip("/") + "/"):
                        templates.append(rel_path_posix)
                else:
                    templates.append(rel_path_posix)
    return sorted(templates)


def main() -> int:
    """
    Main entry point for the Jinja2 template validation script.

    Parses command-line arguments, sets up the Jinja2 environment, finds
    the relevant templates, and attempts to render each one. It reports
    all successes and failures and returns an exit code indicating the result.

    Returns:
        int: Returns 0 on success, 1 if there are template rendering failures,
             and 2 for configuration errors (e.g., templates not found).
    """
    parser = argparse.ArgumentParser(
        description="Check Jinja2 templates under templates/{{project_slug}} using StrictUndefined."
    )
    parser.add_argument(
        "--subdir",
        "-s",
        default="docs",
        help="Subdirectory to check (default: 'docs').",
    )
    parser.add_argument(
        "--all", action="store_true", help="Check all templates."
    )
    parser.add_argument(
        "--year", default=SAMPLE_CONTEXT["year"], help="Year to inject into sample context."
    )
    args = parser.parse_args()

    # Cast argparse results for better type checking.
    all_arg = cast(bool, args.all)
    subdir_arg = cast(str | None, args.subdir)
    year_arg = cast(str, args.year)

    if not os.path.isdir(ROOT):
        print(f"Error: Templates root directory not found at '{ROOT}'.")
        return 2

    loader = FileSystemLoader(ROOT)
    # Configure Jinja2 environment for safety and strictness.
    env = Environment(loader=loader, undefined=StrictUndefined, autoescape=True)

    target_subdir = None if all_arg else subdir_arg
    templates = find_templates(ROOT, subdir=target_subdir)
    if not templates:
        print(f"Warning: No templates found to check in '{ROOT}' for subdir '{target_subdir}'.")
        return 0 # Not a failure if no templates exist to check.

    print(f"Found {len(templates)} templates to check...")

    # Create the rendering context, allowing CLI overrides.
    ctx = dict(SAMPLE_CONTEXT)
    ctx["year"] = year_arg

    failures = 0
    for tname in templates:
        try:
            template = env.get_template(tname)
            template.render(ctx)
            print(f"✅ OK: {tname}")
        except Exception as e:
            failures += 1
            print(f"❌ ERROR: {tname} -> {type(e).__name__}: {e}")

    if failures:
        print(f"\nFAILED: {failures} of {len(templates)} templates failed to render.")
        return 1

    print("\n✅ All templates rendered successfully.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
