"""Common utility functions for Copier hooks.

This module provides utility functions for case conversion, file writing,
and other common operations used across hook modules.

Traceability: AI_ADR-001, AI_SDS-001
"""

from __future__ import annotations

import re
from pathlib import Path


def to_words(value: str) -> list[str]:
    """Split a string into words, handling various delimiters.

    Args:
        value: String to split (can contain dashes, underscores, spaces)

    Returns:
        List of word segments
    """
    return [segment for segment in re.split(r"[^a-zA-Z0-9]+", value) if segment]


def pascal_case(value: str, fallback: str = "Domain") -> str:
    """Convert a string to PascalCase.

    Args:
        value: String to convert
        fallback: Value to return if conversion fails

    Returns:
        PascalCase string
    """
    words = to_words(value)
    if not words:
        return fallback
    return "".join(word.capitalize() for word in words)


def title_case_from_slug(value: str) -> str:
    """Convert a slug to Title Case for display.

    Args:
        value: Slug string (e.g., "my-project-name")

    Returns:
        Title case string (e.g., "My Project Name")
    """
    words = to_words(value)
    if not words:
        return value.capitalize() if value else "Application"
    return " ".join(word.capitalize() for word in words)


def camel_case(value: str, fallback: str = "domain") -> str:
    """Convert a string to camelCase.

    Args:
        value: String to convert
        fallback: Value to return if conversion fails

    Returns:
        camelCase string
    """
    words = to_words(value)
    if not words:
        return fallback
    first = words[0].lower()
    rest = [word.capitalize() for word in words[1:]]
    return first + "".join(rest)


def snake_case(value: str) -> str:
    """Convert a string to snake_case.

    Args:
        value: String to convert

    Returns:
        snake_case string
    """
    words = to_words(value)
    return "_".join(word.lower() for word in words)


def kebab_case(value: str) -> str:
    """Convert a string to kebab-case.

    Args:
        value: String to convert

    Returns:
        kebab-case string
    """
    words = to_words(value)
    return "-".join(word.lower() for word in words)


def write_text_file(path: Path, content: str) -> None:
    """Write content to a text file, creating parent directories as needed.

    Ensures:
    - Parent directories are created
    - Content ends with a newline
    - UTF-8 encoding is used

    Args:
        path: Path to file to write
        content: Content to write
    """
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n", encoding="utf-8")


def ensure_directory(path: Path) -> None:
    """Ensure a directory exists, creating it and parents if needed.

    Args:
        path: Path to directory
    """
    path.mkdir(parents=True, exist_ok=True)


def file_exists(path: Path) -> bool:
    """Check if a file exists.

    Args:
        path: Path to check

    Returns:
        True if file exists
    """
    return path.exists() and path.is_file()


def directory_exists(path: Path) -> bool:
    """Check if a directory exists.

    Args:
        path: Path to check

    Returns:
        True if directory exists
    """
    return path.exists() and path.is_dir()
