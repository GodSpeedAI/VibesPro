"""Copier context loading and normalization utilities.

This module provides functions for loading Copier answers from various sources
(environment variables, data files, answer files) and normalizing them for use
in generation hooks.

Traceability: AI_ADR-001, AI_SDS-001
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any


def read_answers_file(path: Path) -> dict[str, Any]:
    """Read and parse a YAML answers file with robust error handling.

    Args:
        path: Path to YAML answers file

    Returns:
        Dictionary of parsed answers, empty dict on error
    """
    if not path.exists():
        return {}

    try:
        contents = path.read_text()
    except OSError as exc:
        print(f"   → Unable to read {path}: {exc}")
        return {}

    # PyYAML is required for this project and should always be available
    try:
        import yaml

        # Use safe_load to prevent arbitrary code execution
        parsed = yaml.safe_load(contents) or {}

        if not isinstance(parsed, dict):
            print(f"   → {path}: YAML content is not a dictionary/object")
            return {}

        return parsed

    except ImportError:
        print("   → CRITICAL: PyYAML is not available. This is a required dependency.")
        print("   → Please install with: pip install pyyaml>=6.0")
        return {}
    except Exception as exc:
        print(f"   → Unable to parse {path}: {exc}")

        # Limited fallback for simple key:value pairs only
        if ":" in contents:
            data: dict[str, Any] = {}
            for raw_line in contents.splitlines():
                line = raw_line.strip()
                if not line or line.startswith("#") or ":" not in line:
                    continue
                try:
                    key, value = line.split(":", 1)
                    data[key.strip()] = value.strip().strip("\"'")
                except ValueError:
                    continue
            return data
        return {}


def load_copier_context(target: Path) -> dict[str, Any]:
    """Load Copier answers from all available sources.

    Sources checked (in order of priority):
    1. VIBESPRO_GENERATOR_CONTEXT environment variable (JSON)
    2. VIBESPRO_GENERATOR_DATA_FILE environment variable (path to YAML)
    3. .copier-answers.yml in target directory
    4. copier-answers.yml in target directory

    Args:
        target: Target directory where project is being generated

    Returns:
        Combined dictionary of all answers
    """
    combined: dict[str, Any] = {}

    # Check environment variable for JSON context
    env_raw = os.environ.get("VIBESPRO_GENERATOR_CONTEXT")
    if env_raw:
        try:
            env_data = json.loads(env_raw)
            if isinstance(env_data, dict):
                combined.update(env_data)
        except json.JSONDecodeError as exc:
            print(f"   → Unable to parse VIBESPRO_GENERATOR_CONTEXT: {exc}")

    # Check environment variable for data file path
    env_data_file = os.environ.get("VIBESPRO_GENERATOR_DATA_FILE")
    if env_data_file:
        combined.update(read_answers_file(Path(env_data_file)))

    # Check standard Copier answer files
    for fname in (".copier-answers.yml", "copier-answers.yml"):
        answers_path = target / fname
        if not answers_path.exists():
            continue
        data = read_answers_file(answers_path)
        if data:
            combined.update(data)
            break

    return combined


def normalize_answers(answers: dict[str, Any]) -> dict[str, Any]:
    """Normalize answer values for consistent processing.

    Handles:
    - Boolean string conversion (true/false/yes/no)
    - Whitespace trimming
    - Empty string to None conversion for optional fields

    Args:
        answers: Raw answers dictionary

    Returns:
        Normalized answers dictionary
    """
    normalized: dict[str, Any] = {}

    for key, value in answers.items():
        if isinstance(value, str):
            value = value.strip()

            # Convert boolean strings
            if value.lower() in ("true", "yes", "1", "on"):
                value = True
            elif value.lower() in ("false", "no", "0", "off"):
                value = False
            elif value == "":
                value = None

        normalized[key] = value

    return normalized


def parse_domains(raw: Any) -> list[str]:
    """Parse domains from various input formats into a list of strings.

    Args:
        raw: Input that can be None, string, list, tuple, dict, or set

    Returns:
        List of cleaned domain strings
    """
    if raw is None:
        return []
    if isinstance(raw, str):
        return [part.strip() for part in raw.split(",") if part.strip()]
    if isinstance(raw, list | tuple):
        result: list[str] = []
        for item in raw:
            value = str(item).strip()
            if value:
                result.append(value)
        return result
    if isinstance(raw, dict):
        # For dicts, use keys as domain names
        return [str(key).strip() for key in raw.keys() if str(key).strip()]
    if isinstance(raw, set):
        # For sets, convert to sorted list for consistency
        return sorted(str(item).strip() for item in raw if str(item).strip())
    return []
