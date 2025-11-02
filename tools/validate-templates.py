#!/usr/bin/env python3
# ruff: noqa: N999
# mypy: ignore-errors
"""
Compatibility wrapper for legacy template validation entrypoints.

`just lint-templates` expects this script; delegate to check_templates.main().
"""

from check_templates import main

if __name__ == "__main__":
    raise SystemExit(main())
