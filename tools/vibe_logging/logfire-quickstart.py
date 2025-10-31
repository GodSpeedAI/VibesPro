#!/usr/bin/env python3
# mypy: ignore-errors
# ruff: noqa: N999
"""
Logfire logger quick-start example (relocated to avoid stdlib shadowing).

Usage:
    python3 tools/vibe_logging/logfire-quickstart.py
"""

import os
import sys

import logfire

# Add libs to path for import
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../"))

from libs.python.vibepro_logging import LogCategory, configure_logger

# Configure logger with template defaults
logger = configure_logger("quickstart-demo")

print("==> Testing VibePro Python logging (Logfire)", file=sys.stderr)

with logfire.span("demo-request", http_method="GET", route="/demo"):
    logger.info("request accepted", category=LogCategory.APP, user_id_hash="user_abc123")
    logger.info("request completed", category=LogCategory.APP, duration_ms=45, status=200)
    logger.warn(
        "client throttled",
        category=LogCategory.SECURITY,
        action="rate_limit",
        client_ip_hash="192.168.1.1",
    )
    logger.info(
        "admin action performed",
        category=LogCategory.AUDIT,
        user_id_hash="admin_xyz789",
        action="user_delete",
    )

print("\n==> ✅ Logfire logging test complete", file=sys.stderr)
