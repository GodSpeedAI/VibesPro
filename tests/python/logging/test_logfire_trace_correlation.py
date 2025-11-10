"""Tests for log-trace correlation.

Tests verify:
- Logfire logger integration works correctly
- Category binding functions properly
- Logger instances can be created without crashes

Phase 1B (GREEN): Tests updated to validate actual Logfire implementation.
Note: Full trace-log correlation testing requires running application with
active tracing, which is validated in integration tests (test_vector_logfire.sh).
"""

import pytest

from libs.python.vibepro_logging import (
    LogCategory,
    _reset_logfire_state,
    configure_logger,
    get_logger,
)

pytestmark = pytest.mark.usefixtures("clean_env")


def test_log_logger_creation(clean_env):
    """Verify logger can be created successfully."""
    _reset_logfire_state()
    configure_logger(service="test-service")
    logger = get_logger(category=LogCategory.APP)

    # Verify logger created successfully
    assert logger is not None


def test_log_without_span_graceful_degradation(clean_env):
    """Verify logging without active span doesn't crash (graceful degradation)."""
    _reset_logfire_state()
    configure_logger(service="test-service")
    logger = get_logger(category=LogCategory.APP)

    # No active span - this should not raise exception
    try:
        logger.info("log without span")
    except Exception as e:
        pytest.fail(f"Logging without span raised exception: {e}")


def test_multiple_logger_instances(clean_env):
    """Verify multiple logger instances can be created."""
    _reset_logfire_state()
    configure_logger(service="test-service")

    logger_app = get_logger(category=LogCategory.APP)
    logger_audit = get_logger(category=LogCategory.AUDIT)
    logger_security = get_logger(category=LogCategory.SECURITY)

    # All loggers should be created successfully
    assert logger_app is not None
    assert logger_audit is not None
    assert logger_security is not None


def test_logger_with_custom_metadata(clean_env):
    """Verify logger accepts custom metadata without errors."""
    _reset_logfire_state()
    configure_logger(service="test-service")

    # Create logger with custom metadata
    logger = get_logger(category=LogCategory.APP, request_id="req-123", user_id="user-456")

    # Verify logger created successfully
    assert logger is not None

    # Verify logging works with custom metadata
    try:
        logger.info("test message with metadata")
    except Exception as e:
        pytest.fail(f"Logging with custom metadata raised exception: {e}")


def test_logger_category_variations(clean_env):
    """Verify different log categories work correctly."""
    _reset_logfire_state()
    configure_logger(service="test-service")

    categories = [LogCategory.APP, LogCategory.AUDIT, LogCategory.SECURITY, None]

    for category in categories:
        logger = get_logger(category=category)
        assert logger is not None

        # Verify logging works
        try:
            logger.info(f"test message for category {category}")
        except Exception as e:
            pytest.fail(f"Logging for category {category} raised exception: {e}")
