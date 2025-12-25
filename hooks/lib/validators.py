"""Input validation and sanitization utilities for Copier hooks.

This module provides comprehensive input validation and sanitization functions
to ensure safe path construction and prevent security issues like path traversal.

Traceability: AI_ADR-001, AI_SDS-001
"""

from __future__ import annotations

import re
from pathlib import Path


def sanitize_for_platform_id(value: str) -> str:
    """Sanitize project slug for use in platform IDs (Android packages, iOS bundles).

    Converts to lowercase, replaces invalid characters, ensures valid segments.

    Args:
        value: Raw value to sanitize

    Returns:
        Sanitized platform-safe identifier
    """
    if not value:
        return "app"

    # Convert to lowercase and replace invalid characters with dots
    sanitized = re.sub(r"[^a-zA-Z0-9.]", ".", value.lower())

    # Collapse consecutive dots
    sanitized = re.sub(r"\.+", ".", sanitized)

    # Trim leading and trailing dots
    sanitized = sanitized.strip(".")

    # Split into segments and validate each starts with a letter
    segments = []
    for segment in sanitized.split("."):
        if not segment:
            continue
        if not segment[0].isalpha():
            segment = f"app{segment}"
        segments.append(segment)

    # If no valid segments, use default
    if not segments:
        return "app"

    return ".".join(segments)


def sanitize_for_filesystem(value: str, fallback: str = "unnamed") -> str:
    """Sanitize a value for use in filesystem paths.

    Prevents path traversal and ensures safe characters only.

    Args:
        value: Raw value to sanitize
        fallback: Value to use if sanitization fails

    Returns:
        Filesystem-safe string
    """
    if not value:
        return fallback

    # Trim whitespace
    value = value.strip()
    if not value:
        return fallback

    # Reject path traversal attempts
    if ".." in value or value.startswith(".") or "/" in value or "\\" in value:
        return fallback

    # Allow only alphanumeric, hyphens, and underscores
    sanitized = re.sub(r"[^a-zA-Z0-9\-_]", "-", value)

    # Replace multiple hyphens/underscores with single hyphen
    sanitized = re.sub(r"[-_]+", "-", sanitized)

    # Trim leading/trailing hyphens
    sanitized = sanitized.strip("-")

    if not sanitized:
        return fallback

    return sanitized


def validate_within_target(target: Path, path_component: str, base_dir: str) -> Path:
    """Validate that a path component stays within the target directory.

    Returns a safe Path object or raises ValueError if validation fails.

    Args:
        target: Base target directory
        path_component: Path component to validate
        base_dir: Subdirectory within target (e.g., "libs", "apps")

    Returns:
        Safe Path object within target

    Raises:
        ValueError: If path would escape target directory
    """
    safe_component = sanitize_for_filesystem(path_component)
    full_path = (target / base_dir / safe_component).resolve()

    # Ensure the path is within target directory
    try:
        target_resolved = target.resolve()
        if hasattr(full_path, "is_relative_to"):
            # Python 3.9+
            if not full_path.is_relative_to(target_resolved):
                raise ValueError(f"Path traversal detected: {path_component}")
        else:
            # Python 3.8 fallback
            if not any(parent == target_resolved for parent in full_path.parents):
                raise ValueError(f"Path traversal detected: {path_component}")

        return target / base_dir / safe_component
    except (OSError, ValueError) as exc:
        raise ValueError(f"Invalid path component '{path_component}': {exc}") from exc


def sanitize_domain_name(value: str, target: Path) -> Path:
    """Sanitize domain name and validate it's within target/libs.

    Args:
        value: Raw domain name
        target: Target project directory

    Returns:
        Safe Path to domain directory

    Raises:
        ValueError: If domain name is invalid
    """
    if not value:
        raise ValueError("Domain name cannot be empty")

    # Trim and lowercase
    value = value.strip().lower()

    # Use strict pattern: alphanumeric, hyphen, underscore only
    if not re.match(r"^[a-z0-9\-_]+$", value):
        raise ValueError(
            f"Domain name '{value}' contains invalid characters. "
            "Only alphanumeric, hyphens, and underscores allowed."
        )

    return validate_within_target(target, value, "libs")


def sanitize_service_name(value: str, target: Path) -> Path:
    """Sanitize service name and validate it's within target/apps.

    Args:
        value: Raw service name
        target: Target project directory

    Returns:
        Safe Path to service directory

    Raises:
        ValueError: If service name is invalid
    """
    if not value:
        raise ValueError("Service name cannot be empty")

    # Trim and validate characters
    value = value.strip()

    # Reject path separators, "..", leading dots
    if any(char in value for char in ["/", "\\", ".."]) or value.startswith("."):
        raise ValueError(f"Service name '{value}' contains invalid path characters")

    # Allow only alphanumerics, dashes, underscores
    if not re.match(r"^[a-zA-Z0-9\-_]+$", value):
        raise ValueError(
            f"Service name '{value}' contains invalid characters. "
            "Only alphanumeric, hyphens, and underscores allowed."
        )

    # Enforce max length
    if len(value) > 50:
        raise ValueError(f"Service name '{value}' is too long (max 50 characters)")

    return validate_within_target(target, value, "apps")


def sanitize_project_slug(value: str) -> str:
    """Sanitize project slug for general use in paths and identifiers.

    Args:
        value: Raw project slug

    Returns:
        Sanitized project slug
    """
    if not value:
        return "project"

    # Convert to lowercase and replace invalid characters with dashes
    sanitized = re.sub(r"[^a-zA-Z0-9\-]", "-", value.lower())

    # Replace multiple dashes with single dash
    sanitized = re.sub(r"-+", "-", sanitized)

    # Trim leading/trailing dashes
    sanitized = sanitized.strip("-")

    if not sanitized:
        return "project"

    return sanitized


def sanitize_domains(domains: list[str]) -> list[str]:
    """Sanitize a list of domain names to ensure they are safe.

    Args:
        domains: List of raw domain names

    Returns:
        List of sanitized domain names
    """
    sanitized_domains = []
    for domain in domains:
        # Trim and lowercase
        domain = domain.strip().lower()

        # Use strict pattern: alphanumeric, hyphen, underscore only
        if re.match(r"^[a-z0-9\-_]+$", domain):
            sanitized_domains.append(domain)
        else:
            # Replace with sanitized version
            safe_domain = re.sub(r"[^a-z0-9\-_]", "-", domain)
            if safe_domain:
                sanitized_domains.append(safe_domain.strip("-"))

    # Remove duplicates and empty strings
    return list(dict.fromkeys([d for d in sanitized_domains if d]))
