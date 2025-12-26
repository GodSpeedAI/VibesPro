"""Copier hook library for VibesPro template generation.

This module provides modular, reusable functions for Copier pre- and post-generation
hooks. The library is organized to support:

- **context**: Loading and normalizing Copier answers
- **validators**: Input sanitization and path validation
- **scaffold_domain**: Hexagonal domain library scaffolding
- **scaffold_app**: Framework-specific app scaffolding (Next/Remix/Expo)
- **scaffold_service**: Python service scaffolding (FastAPI/Flask/Django)
- **utils**: Common utilities (case conversion, file writing)

Traceability: AI_ADR-001, AI_SDS-001
"""

from __future__ import annotations

from .context import load_copier_context, normalize_answers, parse_domains
from .utils import (
    pascal_case,
    title_case_from_slug,
    to_words,
    write_text_file,
)
from .validators import (
    sanitize_domain_name,
    sanitize_domains,
    sanitize_for_filesystem,
    sanitize_for_platform_id,
    sanitize_project_slug,
    sanitize_service_name,
    validate_within_target,
)

__all__ = [
    # Context
    "load_copier_context",
    "normalize_answers",
    "parse_domains",
    # Validators
    "sanitize_domain_name",
    "sanitize_domains",
    "sanitize_for_filesystem",
    "sanitize_for_platform_id",
    "sanitize_project_slug",
    "sanitize_service_name",
    "validate_within_target",
    # Utils
    "pascal_case",
    "title_case_from_slug",
    "to_words",
    "write_text_file",
]
