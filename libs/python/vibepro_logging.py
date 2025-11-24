# mypy: ignore-errors
# -*- coding: utf-8 -*-
"""
VibePro Logfire helpers for structured logging and observability.

This module provides a centralized and standardized way to interact with Logfire,
the observability platform used by VibePro. It offers thin wrappers to configure
the logger, bind required metadata (like service name and environment), and
instrument supported frameworks such as FastAPI.

The core design principle is that services should rely on these helpers instead
of importing and configuring logging or observability libraries directly. This
ensures consistency in log formats, metadata, and instrumentation across all
Python services in the monorepo.

Key Features:
    - Singleton pattern for Logfire configuration to prevent re-initialization.
    - Automatic inclusion of standard OpenTelemetry metadata.
    - Helper for bootstrapping Logfire in FastAPI applications.
    - Environment variable-driven configuration for flexibility.

See Also:
    - DEV-SDS-018: "Structured Logging Schema"
    - DEV-PRD-018: "Observability Requirements"

Example:
    from .vibepro_logging import get_logger, LogCategory

    log = get_logger(LogCategory.APP)
    log.info("User {user_id} logged in successfully.", user_id=123)
"""

from __future__ import annotations

import os
from collections.abc import Mapping
from typing import TYPE_CHECKING, Any

import logfire

from .logging_settings import settings

if TYPE_CHECKING:  # pragma: no cover - used for type hints only
    from fastapi import FastAPI

# Module-level singleton to hold the configured Logfire instance.
_LOGFIRE_INSTANCE: logfire.Logfire | None = None


def configure_logger(service: str | None = None, **kwargs: Any) -> logfire.Logfire:
    """
    Configures the global Logfire instance (if not already done) and returns a logger.

    This function is the primary entry point for obtaining a logger. It ensures that
    Logfire is configured only once per process. On the first call, it initializes
    Logfire with the provided service name and forwards any additional keyword
    arguments to `logfire.configure()`. Subsequent calls will return the existing
    logger instance with standard metadata applied.

    Args:
        service (str, optional): The name of the service. If not provided, it
                                 falls back to the `SERVICE_NAME` environment
                                 variable, and then to 'vibepro-py'.
        **kwargs (Any): Additional keyword arguments to pass directly to
                        `logfire.configure()` on the first invocation.

    Returns:
        logfire.Logfire: A Logfire logger instance with default metadata pre-applied.
    """
    service_name = _resolve_service_name(service)
    logger = _configure_global_logfire(service_name=service_name, **kwargs)
    return _apply_metadata(logger, default_metadata(service_name))


def default_metadata(service: str | None = None) -> dict[str, str]:
    """
    Constructs a dictionary of default metadata for OpenTelemetry.

    This metadata is essential for filtering and querying logs and traces in
    observability platforms. It includes the service name, environment, and
    application version, primarily sourced from environment variables.

    Args:
        service (str, optional): The service name. If None, it is resolved from
                                 the `SERVICE_NAME` environment variable.

    Returns:
        dict[str, str]: A dictionary containing the standard metadata fields.
    """
    if service is None:
        service = os.getenv("SERVICE_NAME", "vibepro-py")

    return {
        "service": service,
        "environment": os.getenv("APP_ENV", "local"),
        "application_version": os.getenv("APP_VERSION", "dev"),
    }


def bootstrap_logfire(app: FastAPI, **kwargs: Any) -> FastAPI:
    """
    Bootstraps Logfire for a FastAPI application.

    This convenience function handles the common setup pattern for FastAPI services.
    It configures Logfire and then instruments the FastAPI application to automatically
    create OpenTelemetry spans for each incoming HTTP request.

    Args:
        app (FastAPI): The FastAPI application instance to instrument.
        **kwargs (Any): Additional keyword arguments to pass to `logfire.configure()`.

    Returns:
        FastAPI: The instrumented FastAPI app instance, allowing for method chaining.
    """
    service_name = _resolve_service_name(kwargs.pop("service", None))
    _configure_global_logfire(service_name=service_name, **kwargs)
    logfire.instrument_fastapi(app)
    return app


def get_logger(category: str | None = None, **kwargs: Any) -> logfire.Logfire:
    """
    Returns a Logfire-bound logger with shared and category-specific metadata.

    This is a convenient way to get a logger instance with additional context,
    such as a log category, already bound.

    Args:
        category (str, optional): The category of the log (e.g., 'app', 'audit').
                                  See the `LogCategory` class for predefined values.
        **kwargs (Any): Additional key-value pairs to be included as metadata.

    Returns:
        logfire.Logfire: A configured Logfire logger with the specified metadata.
    """
    logger = _configure_global_logfire(service_name=_resolve_service_name(None))

    metadata = default_metadata()
    if category:
        metadata["category"] = category
    metadata.update(kwargs)
    return _apply_metadata(logger, metadata)


class LogCategory:
    """
    Provides standardized string constants for log categories.

    Using these constants helps ensure consistency in log queries and alerts.

    Attributes:
        APP (str): For general application logic logs.
        AUDIT (str): For logs related to auditable events (e.g., user actions).
        SECURITY (str): For logs related to security events.
    """

    APP = "app"
    AUDIT = "audit"
    SECURITY = "security"


def instrument_integrations(requests: bool = False, pydantic: bool = False) -> None:
    """
    Dynamically enables optional Logfire instrumentations.

    This function allows for enabling auto-instrumentation for supported libraries
    either programmatically or based on the `LogfireSettings`.

    Args:
        requests (bool): If True, forces instrumentation of the `requests` library.
        pydantic (bool): If True, forces instrumentation of the `pydantic` library.
    """
    if requests or settings.INSTRUMENT_REQUESTS:
        logfire.instrument_requests()
    if pydantic or settings.INSTRUMENT_PYDANTIC:
        logfire.instrument_pydantic()


def _resolve_service_name(service: str | None) -> str:
    """Resolves the service name from an argument or environment variable."""
    return service or os.getenv("SERVICE_NAME", "vibepro-py")


def _configure_global_logfire(service_name: str, **kwargs: Any) -> logfire.Logfire:
    """
    Configures the global Logfire instance once and returns the shared logger.
    This internal function implements the singleton pattern for configuration.
    """
    global _LOGFIRE_INSTANCE

    if _LOGFIRE_INSTANCE is None:
        send_to_logfire = kwargs.pop("send_to_logfire", "if-token-present")

        configure_kwargs: dict[str, Any] = {
            "service_name": service_name,
            "environment": os.getenv("APP_ENV", "local"),
            "send_to_logfire": send_to_logfire,
        }

        otlp_endpoint = os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT")
        if otlp_endpoint:
            configure_kwargs["additional_span_processors"] = kwargs.pop(
                "additional_span_processors", []
            )

        configure_kwargs.update({k: v for k, v in kwargs.items() if v is not None})
        _LOGFIRE_INSTANCE = logfire.configure(**configure_kwargs)

    return _LOGFIRE_INSTANCE


def _reset_logfire_state() -> None:
    """
    Resets the module-level cached Logfire instance.

    This function is intended exclusively for use in tests to ensure that each
    test case can configure Logfire in isolation, preventing state leakage
    between tests.
    """
    global _LOGFIRE_INSTANCE
    _LOGFIRE_INSTANCE = None


def _apply_metadata(
    logger: logfire.Logfire, metadata: Mapping[str, object]
) -> logfire.Logfire:
    """Applies a dictionary of metadata to a logger instance as tags."""
    tags = tuple(f"{key}:{value}" for key, value in metadata.items() if value is not None)
    if not tags:
        return logger
    return logger.with_settings(tags=tags)
