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
from collections.abc import Mapping, Sequence
from pathlib import Path
from typing import Literal, Protocol, TypedDict, Unpack, cast

from .logging_settings import settings


class LogfireLogger(Protocol):
    def with_settings(self, *, tags: Sequence[str]) -> LogfireLogger: ...


class LogfireModule(Protocol):
    def configure(self, **kwargs: object) -> LogfireLogger: ...

    def instrument_fastapi(self, app: object) -> None: ...

    def instrument_requests(self) -> None: ...

    def instrument_pydantic(self) -> None: ...


_LOGFIRE_INSTANCE: LogfireLogger | None = None


class SpanProcessor(Protocol):
    def on_start(self, *args: object, **kwargs: object) -> None: ...

    def on_end(self, *args: object, **kwargs: object) -> None: ...

    def shutdown(self) -> None: ...

    def force_flush(self, *args: object, **kwargs: object) -> bool: ...


try:
    import logfire as _logfire_module
except Exception:  # pragma: no cover

    class _FallbackLogfire(LogfireLogger):
        def with_settings(self, *, tags: Sequence[str]) -> _FallbackLogfire:
            return self

    class _FallbackLogfireModule(LogfireModule):
        def configure(self, **kwargs: object) -> _FallbackLogfire:
            return _FallbackLogfire()

        def instrument_fastapi(self, app: object) -> None:
            return None

        def instrument_requests(self) -> None:
            return None

        def instrument_pydantic(self) -> None:
            return None

    _logfire_api: LogfireModule = _FallbackLogfireModule()
else:
    _logfire_api = cast(LogfireModule, _logfire_module)


class FastAPILike(Protocol):
    """Minimal FastAPI protocol for instrumentation."""


FastAPI = FastAPILike


class ConfigureOptions(TypedDict, total=False):
    local: bool
    token: str | None
    service_version: str | None
    console: object | Literal[False] | None
    config_dir: str | Path | None
    data_dir: str | Path | None
    additional_span_processors: Sequence[SpanProcessor] | None
    metrics: object | Literal[False] | None
    scrubbing: object | Literal[False] | None
    inspect_arguments: bool | None
    sampling: object | None
    min_level: int | str | None
    add_baggage_to_attributes: bool
    code_source: object | None
    distributed_tracing: bool | None
    advanced: object | None


def configure_logger(
    service: str | None = None,
    *,
    environment: str | None = None,
    send_to_logfire: bool | Literal["if-token-present"] | None = None,
    **options: Unpack[ConfigureOptions],
) -> LogfireLogger:
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
        environment (str | None): Optional environment name override.
        send_to_logfire (bool | Literal["if-token-present"] | None): Control whether logs are sent.
        **options: Additional keyword arguments to pass directly to `logfire.configure()`.

    Returns:
        LogfireLogger: A Logfire logger instance with default metadata pre-applied.
    """
    service_name: str = _resolve_service_name(service)
    logger = _configure_global_logfire(
        service_name=service_name,
        environment=environment,
        send_to_logfire=send_to_logfire,
        **options,
    )
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


def bootstrap_logfire(
    app: FastAPI,
    service: str | None = None,
    *,
    environment: str | None = None,
    send_to_logfire: bool | Literal["if-token-present"] | None = None,
    **options: Unpack[ConfigureOptions],
) -> FastAPI:
    """
    Bootstraps Logfire for a FastAPI application.

    This convenience function handles the common setup pattern for FastAPI services.
    It configures Logfire and then instruments the FastAPI application to automatically
    create OpenTelemetry spans for each incoming HTTP request.

    Args:
        app (FastAPI): The FastAPI application instance to instrument.
        **options: Additional keyword arguments to pass to `logfire.configure()`.

    Returns:
        FastAPI: The instrumented FastAPI app instance, allowing for method chaining.
    """
    service_name: str = _resolve_service_name(service)
    _configure_global_logfire(
        service_name=service_name,
        environment=environment,
        send_to_logfire=send_to_logfire,
        **options,
    )
    _logfire_api.instrument_fastapi(app)
    return app


def get_logger(category: str | None = None, **kwargs: object) -> LogfireLogger:
    """
    Returns a Logfire-bound logger with shared and category-specific metadata.

    This is a convenient way to get a logger instance with additional context,
    such as a log category, already bound.

    Args:
        category (str, optional): The category of the log (e.g., 'app', 'audit').
                                  See the `LogCategory` class for predefined values.
        **kwargs (object): Additional key-value pairs to be included as metadata.

    Returns:
        LogfireLogger: A configured Logfire logger with the specified metadata.
    """
    logger = _configure_global_logfire(service_name=_resolve_service_name(None))

    base_metadata = default_metadata()
    metadata: dict[str, object] = {**base_metadata}
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
        _logfire_api.instrument_requests()
    if pydantic or settings.INSTRUMENT_PYDANTIC:
        _logfire_api.instrument_pydantic()


def _resolve_service_name(service: str | None) -> str:
    """Resolves the service name from an argument or environment variable."""
    if service is not None:
        return service
    env_value = os.getenv("SERVICE_NAME", "vibepro-py")
    return env_value if env_value else "vibepro-py"


def _configure_global_logfire(
    service_name: str,
    *,
    environment: str | None = None,
    send_to_logfire: bool | Literal["if-token-present"] | None = None,
    **options: Unpack[ConfigureOptions],
) -> LogfireLogger:
    """
    Configures the global Logfire instance once and returns the shared logger.
    This internal function implements the singleton pattern for configuration.
    """
    global _LOGFIRE_INSTANCE

    if _LOGFIRE_INSTANCE is None:
        configure_kwargs: ConfigureOptions = cast(ConfigureOptions, {**options})
        resolved_environment = environment or os.getenv("APP_ENV", "local")
        resolved_send_to_logfire = (
            send_to_logfire if send_to_logfire is not None else "if-token-present"
        )

        if (
            os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT")
            and "additional_span_processors" not in configure_kwargs
        ):
            configure_kwargs["additional_span_processors"] = []

        _LOGFIRE_INSTANCE = _logfire_api.configure(
            service_name=service_name,
            environment=resolved_environment,
            send_to_logfire=resolved_send_to_logfire,
            **configure_kwargs,
        )

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


def _apply_metadata(logger: LogfireLogger, metadata: Mapping[str, object]) -> LogfireLogger:
    """Applies a dictionary of metadata to a logger instance as tags."""
    tags = tuple(f"{key}:{value}" for key, value in metadata.items() if value is not None)
    if not tags:
        return logger
    return logger.with_settings(tags=tags)
