# mypy: ignore-errors
"""
VibePro structured logger using structlog.

Emits JSON logs with mandatory fields:
- timestamp (ISO 8601)
- level (error, warn, info, debug)
- message
- trace_id (from context)
- span_id (from context)
- service
- environment
- application_version
- category (app, audit, security)

Usage:
    from libs.python.vibepro_logging import configure_logger

    log = configure_logger('my-service')
    log.info("request accepted", category="app", user_id_hash="abc123")

See DEV-SDS-018 for schema details.
See DEV-PRD-018 for requirements.
"""

import logging
import os
import sys
from typing import TYPE_CHECKING

import structlog
from structlog.stdlib import BoundLogger

if TYPE_CHECKING:  # pragma: no cover - used for type hints only
    from fastapi import FastAPI


def configure_logger(service: str | None = None) -> BoundLogger:
    """
    Configure and return a structured logger instance.

    Args:
        service: Service name (defaults to SERVICE_NAME env var or 'vibepro-py')

    Returns:
        Configured structlog logger instance

    Example:
        >>> log = configure_logger('user-api')
        >>> log.info("request started", category="app", user_id_hash="abc123")
    """
    if service is None:
        service = os.getenv("SERVICE_NAME", "vibepro-py")

    # Configure stdlib logging to output to stdout
    logging.basicConfig(format="%(message)s", stream=sys.stdout, level=logging.INFO)

    # Define processors with explicit types
    processors: list[structlog.types.Processor] = [
        structlog.processors.add_log_level,  # type: ignore[misc]
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer(),
    ]

    # Configure structlog with JSON renderer
    structlog.configure(
        processors=processors,
        wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=False,
    )

    # Create logger with bound context
    logger: BoundLogger = structlog.stdlib.get_logger()

    # Bind service metadata
    context: dict[str, str] = {
        "service": service,
        "environment": os.getenv("APP_ENV", "local"),
        "application_version": os.getenv("APP_VERSION", "dev"),
    }
    return logger.bind(**context)


def bootstrap_logfire(app: "FastAPI") -> None:
    """
    Placeholder for Logfire instrumentation bootstrap.

    This stub will be replaced with full OpenTelemetry/Logfire wiring in DEV-TDD cycle 2A.
    Currently a safe no-op that logs a warning when called.
    """
    import warnings

    warnings.warn(
        "Logfire bootstrap is not implemented yet. See DEV-PRD-018 and DEV-SDS-018.",
        UserWarning,
        stacklevel=2,
    )
