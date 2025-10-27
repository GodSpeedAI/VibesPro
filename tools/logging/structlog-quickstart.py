#!/usr/bin/env python3
# mypy: ignore-errors
#!/usr/bin/env python3
# ruff: noqa: N999
"""
structlog logger quick-start example
Tests: DEV-SDS-018 (Python logging implementation)

Usage:
    python3 tools/logging/structlog-quickstart.py

Expected output: JSON logs with trace correlation fields
"""

import os
import sys

# Add libs to path for import
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../"))

from libs.python.vibepro_logging import configure_logger

# Create logger with custom service name
log = configure_logger("quickstart-demo")

# Simulate trace context (in real apps, this comes from OpenTelemetry)
trace_context = {"trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "span_id": "00f067aa0ba902b7"}

print("==> Testing VibePro Python logging (structlog)\n", file=sys.stderr)

# App logs
log.info("request accepted", **trace_context, category="app", user_id_hash="user_abc123")

log.info("request completed", **trace_context, category="app", duration_ms=45, status=200)

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
print(
    "Expected fields in each line: timestamp, level, event, trace_id, span_id, service, environment, application_version, category",
    file=sys.stderr,
)
