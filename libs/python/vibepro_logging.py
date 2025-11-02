# mypy: ignore-errors
"""
VibePro Logfire helpers.

Provides thin wrappers to configure Logfire, bind required metadata, and
instrument supported frameworks. All generated services should rely on these
helpers instead of importing logging libraries directly.

See DEV-SDS-018 and DEV-PRD-018 for schema requirements.
"""

from __future__ import annotations

import os
from collections.abc import Mapping
from typing import TYPE_CHECKING

import logfire

from .logging_settings import settings

if TYPE_CHECKING:  # pragma: no cover - used for type hints only
    from fastapi import FastAPI


_LOGFIRE_INSTANCE: logfire.Logfire | None = None


def configure_logger(service: str | None = None, **kwargs) -> logfire.Logfire:
    """
    Configure Logfire (once) and return a bound logger instance.

    Args:
        service: Optional service override. Falls back to SERVICE_NAME env var.
        **kwargs: Additional keyword arguments forwarded to logfire.configure()
                  on the first invocation.

    Returns:
        Logfire-bound logger with default metadata pre-applied.
    """
    service_name = _resolve_service_name(service)
    logger = _configure_global_logfire(service_name=service_name, **kwargs)
    return _apply_metadata(logger, default_metadata(service_name))


def default_metadata(service: str | None = None) -> dict[str, str]:
    """Return a dictionary with default OTEL metadata."""
    if service is None:
        service = os.getenv("SERVICE_NAME", "vibepro-py")

    return {
        "service": service,
        "environment": os.getenv("APP_ENV", "local"),
        "application_version": os.getenv("APP_VERSION", "dev"),
    }


def bootstrap_logfire(app: FastAPI, **kwargs) -> None:
    """
    Bootstrap Logfire for FastAPI applications.
    This function configures Logfire and instruments the FastAPI application
    to emit OpenTelemetry spans for each request.
    kwargs are passed to logfire.configure()
    """
    service_name = _resolve_service_name(kwargs.pop("service", None))
    _configure_global_logfire(service_name=service_name, **kwargs)
    logfire.instrument_fastapi(app)


def get_logger(category: str | None = None, **kwargs) -> logfire.Logfire:
    """
    Returns a Logfire-bound logger with shared metadata.
    """
    logger = _configure_global_logfire(service_name=_resolve_service_name(None))

    metadata = default_metadata()
    if category:
        metadata["category"] = category
    metadata.update(kwargs)
    return _apply_metadata(logger, metadata)


class LogCategory:
    APP = "app"
    AUDIT = "audit"
    SECURITY = "security"


def instrument_integrations(requests: bool = False, pydantic: bool = False) -> None:
    """
    Enable optional Logfire instrumentations.
    """
    if requests or settings.INSTRUMENT_REQUESTS:
        logfire.instrument_requests()
    if pydantic or settings.INSTRUMENT_PYDANTIC:
        logfire.instrument_pydantic()


def _resolve_service_name(service: str | None) -> str:
    return service or os.getenv("SERVICE_NAME", "vibepro-py")


def _configure_global_logfire(service_name: str, **kwargs) -> logfire.Logfire:
    """
    Configure the global Logfire instance once and return the shared logger.
    Subsequent invocations reuse the existing configuration but still return
    the logger to keep helper functions ergonomic.
    """
    global _LOGFIRE_INSTANCE

    configure_kwargs: dict[str, object] = {
        "service_name": service_name,
        "environment": os.getenv("APP_ENV", "local"),
        "send_to_logfire": "if-token-present",
    }
    configure_kwargs.update({k: v for k, v in kwargs.items() if v is not None})

    if _LOGFIRE_INSTANCE is None:
        _LOGFIRE_INSTANCE = logfire.configure(**configure_kwargs)

    return _LOGFIRE_INSTANCE


def _apply_metadata(logger: logfire.Logfire, metadata: Mapping[str, object]) -> logfire.Logfire:
    tags = tuple(f"{key}:{value}" for key, value in metadata.items() if value is not None)
    if not tags:
        return logger
    return logger.with_settings(tags=tags)
