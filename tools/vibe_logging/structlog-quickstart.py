#!/usr/bin/env python3
# ruff: noqa: N999
"""
structlog logger quick-start example (moved)

Usage:
    python3 tools/vibe_logging/structlog-quickstart.py

This file was moved to avoid shadowing the stdlib 'logging' module.
"""

import os
import sys
from typing import Any

# Add libs to path for import
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../"))

from libs.python.vibepro_logging import configure_logger

# Create logger with custom service name
log: Any = configure_logger("quickstart-demo")

# Simulate trace context
trace_context = {"trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "span_id": "00f067aa0ba902b7"}

print("==> Testing VibePro Python logging (structlog)", file=sys.stderr)

# App logs

# Security log
log.warning(
    "client throttled",
    **trace_context,
    category="security",
    action="rate_limit",
    client_ip_hash="192.168.1.1",
)

# Error log
log.error("upstream timeout", **trace_context, category="app", code=500, error="ECONNREFUSED")

# Audit log
log.info(
    "admin action performed",
    **trace_context,
    category="audit",
    user_id_hash="admin_xyz789",
    action="user_delete",
)

print("\n==> ✅ structlog logging test complete", file=sys.stderr)

# Module-level note: this script lives in `tools/vibe_logging/` to avoid
# shadowing the Python stdlib `logging` module which can break pre-commit
# hooks that import logging. Type hints are intentionally relaxed here since
# this is a quickstart script used for demos.
