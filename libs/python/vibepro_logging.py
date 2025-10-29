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
import logfire
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
    return logger.bind(**default_metadata(service))


def default_metadata(service: str | None = None) -> dict[str, str]:
    """Return a dictionary with default OTEL metadata."""
    if service is None:
        service = os.getenv("SERVICE_NAME", "vibepro-py")

    return {
        "service": service,
        "environment": os.getenv("APP_ENV", "local"),
        "application_version": os.getenv("APP_VERSION", "dev"),
    }


def bootstrap_logfire(app: "FastAPI", **kwargs) -> None:
    """
    Bootstrap Logfire for FastAPI applications.
    This function configures Logfire and instruments the FastAPI application
    to emit OpenTelemetry spans for each request.
    kwargs are passed to logfire.configure()
    """
    import logfire
    logfire.configure(**kwargs)
    logfire.instrument_fastapi(app)


def get_logger(category: str | None = None, **kwargs) -> "logfire.Logfire":
    """
    Returns a Logfire-bound logger with shared metadata.
    """
    metadata = default_metadata()
    if category:
        metadata['category'] = category
    metadata.update(kwargs)
    return logfire.get_logger().bind(**metadata)


class LogCategory:
    APP = "app"
    AUDIT = "audit"
    SECURITY = "security"


from .logging_settings import settings

def instrument_integrations(requests: bool = False, pydantic: bool = False):
    """
    Enable optional Logfire instrumentations.
    """
    if requests or settings.INSTRUMENT_REQUESTS:
        logfire.instrument_requests()
    if pydantic or settings.INSTRUMENT_PYDANTIC:
        logfire.instrument_pydantic()
