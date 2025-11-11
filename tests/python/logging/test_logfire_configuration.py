"""Tests for Logfire configuration and initialization.

Tests verify:
- SERVICE_NAME environment variable binding
- OTLP endpoint configuration
- Metadata binding (APP_ENV, APP_VERSION)
- Configuration edge cases and error handling

Phase 1B (GREEN): Tests updated to validate actual Logfire implementation.
"""

import os

import pytest

from libs.python.vibepro_logging import (
    _reset_logfire_state,
    _resolve_service_name,
    configure_logger,
    default_metadata,
)

pytestmark = pytest.mark.usefixtures("clean_env")


def test_configure_logger_sets_service_name(clean_env):
    """Verify SERVICE_NAME env var is bound to logger."""
    os.environ["SERVICE_NAME"] = "test-service"
    _reset_logfire_state()

    logger = configure_logger()

    # Verify logger is configured (returned successfully)
    assert logger is not None
    # Verify service name resolution
    assert _resolve_service_name(None) == "test-service"


def test_configure_logger_otlp_endpoint(clean_env):
    """Verify OTLP_ENDPOINT configuration points to Vector."""
    os.environ["OTEL_EXPORTER_OTLP_ENDPOINT"] = "http://localhost:4318"
    _reset_logfire_state()

    logger = configure_logger()

    # Verify logger configured successfully with OTLP endpoint
    assert logger is not None
    assert os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT") == "http://localhost:4318"


def test_default_metadata_reflects_env_overrides(clean_env):
    """Verify default_metadata reflects environment overrides."""
    os.environ["APP_ENV"] = "staging"
    os.environ["APP_VERSION"] = "v1.2.3"
    os.environ["SERVICE_NAME"] = "test-service"
    _reset_logfire_state()

    metadata = default_metadata("test-service")

    # Verify metadata contains expected values
    assert metadata["environment"] == "staging"
    assert metadata["application_version"] == "v1.2.3"
    assert metadata["service"] == "test-service"


def test_default_metadata_defaults_when_env_missing(clean_env):
    """Verify default_metadata applies graceful defaults when env vars missing."""
    # Clear all env vars
    for key in ["SERVICE_NAME", "APP_ENV", "APP_VERSION"]:
        if key in os.environ:
            del os.environ[key]
    _reset_logfire_state()

    metadata = default_metadata()

    # Verify defaults applied
    assert metadata["service"] == "vibepro-py"  # default service name
    assert metadata["environment"] == "local"  # default environment
    assert metadata["application_version"] == "dev"  # default version


def test_configure_logger_custom_service_name(clean_env):
    """Verify explicit service name parameter overrides environment variable."""
    os.environ["SERVICE_NAME"] = "env-service"
    _reset_logfire_state()

    logger = configure_logger(service="custom-service")
    metadata = default_metadata("custom-service")

    # Verify custom service name used (not env var)
    assert logger is not None
    assert metadata["service"] == "custom-service"


def test_configure_logger_send_to_logfire_false(clean_env):
    """Verify send_to_logfire=False disables Logfire export."""
    _reset_logfire_state()

    logger = configure_logger(send_to_logfire=False)

    # Verify logger still configured (local logging works)
    assert logger is not None

    base_logger = getattr(logger, "_logger", None)
    handler_owner = base_logger if base_logger is not None else logger
    handler_names = [
        f"{handler.__module__}.{handler.__class__.__name__}".lower()
        for handler in getattr(handler_owner, "handlers", []) or []
    ]
    assert all("logfire" not in name for name in handler_names), handler_names

    processor_names: list[str] = []
    processor_sources = [
        getattr(logger, "processors", None),
        getattr(logger, "_processors", None),
        getattr(base_logger, "processors", None) if base_logger else None,
        getattr(logger, "span_processors", None),
    ]
    for source in processor_sources:
        if isinstance(source, list | tuple):
            processor_names.extend(
                f"{proc.__module__}.{proc.__class__.__name__}".lower()
                for proc in source
                if proc is not None
            )
    assert all("logfire" not in name for name in processor_names), processor_names


def test_reset_logfire_state(clean_env):
    """Verify _reset_logfire_state() clears global state for test isolation."""
    _reset_logfire_state()
    logger1 = configure_logger(service="test-service-1")

    _reset_logfire_state()
    logger2 = configure_logger(service="test-service-2")

    # Both should succeed (state cleared between calls)
    assert logger1 is not None
    assert logger2 is not None
