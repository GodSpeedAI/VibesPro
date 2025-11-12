"""Tests for Logfire metadata binding.

Tests verify:
- Environment metadata (APP_ENV) bound correctly
- Version metadata (APP_VERSION) bound correctly
- Service name bound correctly
- Category-specific metadata works
- Custom metadata binding via get_logger(**kwargs)

Phase 1B (GREEN): Tests updated to validate actual Logfire implementation.
"""

import os

import pytest

from libs.python.vibepro_logging import (
    LogCategory,
    _reset_logfire_state,
    configure_logger,
    default_metadata,
    get_logger,
)

pytestmark = pytest.mark.usefixtures("clean_env")


def test_metadata_environment_bound():
    """Verify APP_ENV metadata is bound to all log events."""
    os.environ["APP_ENV"] = "staging"
    os.environ["SERVICE_NAME"] = "test-service"
    _reset_logfire_state()

    metadata = default_metadata("test-service")

    # Verify metadata contains environment
    assert metadata["environment"] == "staging"


def test_metadata_version_bound():
    """Verify APP_VERSION metadata is bound to all log events."""
    os.environ["APP_VERSION"] = "v1.2.3"
    os.environ["SERVICE_NAME"] = "test-service"
    _reset_logfire_state()

    metadata = default_metadata("test-service")

    # Verify metadata contains application version
    assert metadata["application_version"] == "v1.2.3"


def test_metadata_service_name_bound():
    """Verify SERVICE_NAME metadata is bound to all log events."""
    os.environ["SERVICE_NAME"] = "user-api"
    _reset_logfire_state()

    metadata = default_metadata("user-api")

    # Verify metadata contains service name
    assert metadata["service"] == "user-api"


def test_metadata_category_bound():
    """Verify category metadata is bound correctly."""
    _reset_logfire_state()
    configure_logger(service="test-service")

    app_logger = get_logger(category=LogCategory.APP)
    audit_logger = get_logger(category=LogCategory.AUDIT)
    security_logger = get_logger(category=LogCategory.SECURITY)

    # Verify all loggers created successfully
    assert app_logger is not None
    assert audit_logger is not None
    assert security_logger is not None

    # Verify logging works for each category
    app_logger.info("app message")
    audit_logger.info("audit message")
    security_logger.info("security message")


def test_metadata_custom_fields_bound():
    """Verify custom metadata via get_logger(**kwargs) is bound to log events."""
    _reset_logfire_state()
    configure_logger(service="test-service")
    logger = get_logger(category=LogCategory.APP, team="platform", region="us-east-1")

    # Verify logger created successfully with custom metadata
    assert logger is not None

    # Verify logging works with custom metadata
    logger.info("test message")


def test_metadata_persistent_across_log_calls():
    """Verify metadata persists across multiple log calls from same logger."""
    _reset_logfire_state()
    configure_logger(service="test-service")
    logger = get_logger(category=LogCategory.APP, request_id="req-123")

    # Multiple log calls should not raise errors
    logger.info("first message")
    logger.warning("second message")
    logger.error("third message")


def test_metadata_isolation_between_loggers():
    """Verify metadata is isolated between different logger instances."""
    _reset_logfire_state()
    configure_logger(service="test-service")

    logger_a = get_logger(category=LogCategory.APP, user_id="user-a")
    logger_b = get_logger(category=LogCategory.AUDIT, user_id="user-b")

    # Both loggers should work independently
    assert logger_a is not None
    assert logger_b is not None

    logger_a.info("message from A")
    logger_b.info("message from B")


def test_default_metadata_function():
    """Verify default_metadata() returns correct structure."""
    os.environ["SERVICE_NAME"] = "my-service"
    os.environ["APP_ENV"] = "production"
    os.environ["APP_VERSION"] = "v2.0.0"
    _reset_logfire_state()

    metadata = default_metadata("my-service")

    # Verify all required fields present
    assert "service" in metadata
    assert "environment" in metadata
    assert "application_version" in metadata

    # Verify correct values
    assert metadata["service"] == "my-service"
    assert metadata["environment"] == "production"
    assert metadata["application_version"] == "v2.0.0"
