#!/usr/bin/env python3
# mypy: ignore-errors
# ruff: noqa: N999
"""
Logfire logger quick-start example.
Tests: DEV-SDS-018 (Python logging implementation)

Usage:
    python3 tools/logging/logfire-quickstart.py

Expected output: JSON spans/logs with trace correlation fields.
"""

import os
import sys

import logfire

# Add libs to path for import
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../"))

from libs.python.vibepro_logging import LogCategory, configure_logger, instrument_integrations

# Enable optional instrumentation for richer examples
instrument_integrations(requests=True, pydantic=True)

# Configure global logger with the template defaults
logger = configure_logger("quickstart-demo", console=True, send_to_logfire="if-token-present")

print("==> Testing VibePro Python logging (Logfire)\n", file=sys.stderr)

with logfire.span("demo-request", http_method="GET", route="/demo") as span:
    logger.info("request accepted", category=LogCategory.APP, user_id_hash="user_abc123")
    logger.info("request completed", category=LogCategory.APP, duration_ms=45, status=200)

    # Security log example
    logger.warn(
        "client throttled",
        category=LogCategory.SECURITY,
        action="rate_limit",
        client_ip_hash="192.168.1.1",
    )

    # Error log example
    try:
        raise TimeoutError("upstream timeout")
    except TimeoutError as exc:
        logger.exception("dependency failed", category=LogCategory.APP, error=str(exc))

    # Audit log example
    logger.info(
        "admin action performed",
        category=LogCategory.AUDIT,
        user_id_hash="admin_xyz789",
        action="user_delete",
    )

print("\n==> ✅ Logfire logging test complete", file=sys.stderr)
print(
    "Expected fields in each entry: timestamp, level, span context, service, environment, "
    "application_version, category",
    file=sys.stderr,
)
