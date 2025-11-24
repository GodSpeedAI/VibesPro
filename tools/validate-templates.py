#!/usr/bin/env python3
# ruff: noqa: N999
# mypy: ignore-errors
# -*- coding: utf-8 -*-
"""
Compatibility wrapper for legacy template validation entrypoints.

This script serves as a compatibility layer, allowing older command runners or
CI configurations that specifically call `validate-templates.py` to continue
working without modification.

The actual implementation of the template validation logic has been moved to
`check_templates.py`. This script simply imports the `main` function from that
module and executes it.

This approach avoids breaking existing tooling while allowing the underlying
script to be renamed for better clarity.
"""

from check_templates import main

if __name__ == "__main__":
    # The `main` function from `check_templates` returns an exit code,
    # which is then passed to `SystemExit` to terminate this script with the
    # appropriate status.
    raise SystemExit(main())
