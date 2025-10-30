#!/usr/bin/env python3
"""Documentation linting for required Logfire sections (DEV-PRD-018, DEV-SDS-018)."""

from __future__ import annotations

import json
import sys
from collections.abc import Iterable
from dataclasses import dataclass
from pathlib import Path
from typing import cast

REPO_ROOT = Path(__file__).resolve().parents[2]
CONFIG_PATH = Path(__file__).resolve().with_name("lint_config.json")


@dataclass(frozen=True)
class SectionSpec:
    file: str
    snippets: tuple[str, ...]


def _load_required_sections() -> list[SectionSpec]:
    if not CONFIG_PATH.exists():
        raise SystemExit(f"Lint config missing: {CONFIG_PATH}")

    with CONFIG_PATH.open("r", encoding="utf-8") as handle:
        raw_config = cast(dict[str, object], json.load(handle))

    raw_sections = raw_config.get("requiredSections", [])
    if not isinstance(raw_sections, list):
        raise SystemExit("`requiredSections` must be an array in lint_config.json")

    sections: list[SectionSpec] = []
    for entry in raw_sections:
        if not isinstance(entry, dict):
            continue

        entry_dict = cast(dict[str, object], entry)

        file_value = entry_dict.get("file")
        snippets_obj = entry_dict.get("mustContain", [])
        if not isinstance(file_value, str) or not file_value:
            continue
        if not isinstance(snippets_obj, list):
            raise ValueError(f"`mustContain` for {file_value} must be a list of strings")

        snippets_list = cast(list[object], snippets_obj)
        validated_snippets: list[str] = []
        for index, snippet in enumerate(snippets_list):
            if not isinstance(snippet, str):
                raise ValueError(
                    f"`mustContain[{index}]` for {file_value} must be a string, got {snippet!r}"
                )
            validated_snippets.append(snippet)

        sections.append(SectionSpec(file=file_value, snippets=tuple(validated_snippets)))

    return sections


def _check_snippets(content: str, snippets: Iterable[str]) -> Iterable[str]:
    for snippet in snippets:
        if snippet not in content:
            yield snippet


def main() -> int:
    required_sections = _load_required_sections()
    failures: list[str] = []

    for section in required_sections:
        target_path = REPO_ROOT / section.file
        if not target_path.exists():
            failures.append(f"{section.file}: file not found")
            continue

        try:
            content = target_path.read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError) as exc:
            failures.append(f"{section.file}: failed to read file ({exc})")
            continue
        for missing in _check_snippets(content, section.snippets):
            failures.append(f"{section.file}: missing required snippet -> {missing}")

    if failures:
        print("❌ Documentation lint failed:")
        for failure in failures:
            print(f"  - {failure}")
        return 1

    print("✅ Documentation lint checks passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
