#!/usr/bin/env python3
# mypy: ignore-errors
#!/usr/bin/env python3
"""
Backup of original structlog quickstart moved to avoid stdlib shadowing.
"""
# ruff: noqa: N999

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
