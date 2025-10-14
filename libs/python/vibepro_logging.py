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
import structlog


def configure_logger(service: str = None) -> structlog.BoundLogger:
    """
    Configure and return a structured logger instance.

    Args:
        service: Service name (defaults to SERVICE_NAME env var or 'vibepro-py')

    Returns:
        Configured structlog logger with JSON output

    Example:
        >>> log = configure_logger('user-api')
        >>> log.info("request started", category="app", user_id_hash="abc123")
    """
    if service is None:
        service = os.getenv("SERVICE_NAME", "vibepro-py")

    # Configure stdlib logging to output to stdout
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=logging.INFO,
        force=True
    )

    # Configure structlog with JSON renderer
    structlog.configure(
        processors=[
            # Add log level
            structlog.processors.add_log_level,

            # Add timestamp in ISO format
            structlog.processors.TimeStamper(fmt="iso"),

            # Render as JSON
            structlog.processors.JSONRenderer()
        ],

        # Filtering wrapper (INFO level by default)
        wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),

        # Use dict for context
        context_class=dict,

        # Use stdlib logging factory
        logger_factory=structlog.stdlib.LoggerFactory(),

        # Don't cache loggers (allow reconfiguration)
        cache_logger_on_first_use=False,
    )

    # Create logger with bound context
    logger = structlog.get_logger()

    # Bind service metadata
    return logger.bind(
        service=service,
        environment=os.getenv("APP_ENV", "local"),
        application_version=os.getenv("APP_VERSION", "dev"),
    )
