#!/usr/bin/env python3
"""Utility to convert Cookiecutter placeholders to Copier syntax."""

from __future__ import annotations

import re
from pathlib import Path

TEMPLATE_ROOT = Path("templates/{{project_slug}}")


def replace_placeholders() -> int:
    pattern = re.compile(r"\{\{\s*cookiecutter\.([^}]*)\}\}")
    replacements = 0

    for path in TEMPLATE_ROOT.parent.parent.rglob("*"):
        if not path.is_file():
            continue
        try:
            text = path.read_text()
        except UnicodeDecodeError:
            continue

        new_text, count = pattern.subn(lambda m: "{{ " + m.group(1).strip() + " }}", text)
        if count:
            path.write_text(new_text)
            replacements += count

    return replacements


def add_template_suffix() -> int:
    renamed = 0

    for path in TEMPLATE_ROOT.rglob("*"):
        if not path.is_file() or path.suffix == ".j2":
            continue
        try:
            text = path.read_text()
        except UnicodeDecodeError:
            continue
        if "{{" in text or "{%" in text or "{#" in text:
            new_path = path.with_name(path.name + ".j2")
            if not new_path.exists():
                path.rename(new_path)
            renamed += 1

    return renamed


def main() -> None:
    replaced = replace_placeholders()
    renamed = add_template_suffix()

    print(f"Replaced {replaced} Cookiecutter placeholders")
    print(f"Renamed {renamed} files to include .j2 suffix")


if __name__ == "__main__":
    main()
