"""
Configuration settings for Logfire observability and instrumentation.

This module provides a structured way to manage settings for Logfire,
the observability platform used in the VibePro ecosystem. It reads
environment variables to determine whether to enable instrumentation for specific
libraries like 'requests' and 'pydantic'.

The settings are encapsulated in a `LogfireSettings` class, and a singleton
instance is created for easy access throughout the application.

Example:
    from .logging_settings import settings

    if settings.INSTRUMENT_REQUESTS:
        print("Requests instrumentation is enabled.")
"""

from __future__ import annotations

import os


def get_bool_env(name: str, default: bool = False) -> bool:
    """
    Parses an environment variable as a boolean value.

    This utility function interprets common string representations of booleans
    (e.g., "true", "1", "yes", "on") as `True`, and their opposites as `False`.
    It is case-insensitive and handles leading/trailing whitespace.

    Args:
        name (str): The name of the environment variable to read.
        default (bool): The default value to return if the environment variable
                      is not set or has an unrecognized value. Defaults to False.

    Returns:
        bool: The parsed boolean value, or the default if parsing fails.
    """
    truthy = {"true", "1", "t", "yes", "y", "on"}
    falsy = {"false", "0", "f", "no", "n", "off"}

    raw_value = os.getenv(name)
    if raw_value is None:
        return bool(default)

    normalized = raw_value.strip().lower()
    if normalized in truthy:
        return True
    if normalized in falsy:
        return False
    return bool(default)


class LogfireSettings:
    """
    Encapsulates all settings related to Logfire instrumentation.

    This class reads its configuration from environment variables upon instantiation.
    Each attribute corresponds to a specific instrumentation feature that can be
    dynamically enabled or disabled based on the environment.

    Attributes:
        INSTRUMENT_REQUESTS (bool): If True, enables auto-instrumentation for the
                                    `requests` library to trace HTTP calls.
                                    Controlled by the `LOGFIRE_INSTRUMENT_REQUESTS`
                                    environment variable.
        INSTRUMENT_PYDANTIC (bool): If True, enables auto-instrumentation for Pydantic
                                    to trace model validation and serialization.
                                    Controlled by the `LOGFIRE_INSTRUMENT_PYDANTIC`
                                    environment variable.
    """

    def __init__(self) -> None:
        """Initializes the settings by reading from environment variables."""
        self.INSTRUMENT_REQUESTS: bool = get_bool_env("LOGFIRE_INSTRUMENT_REQUESTS")
        self.INSTRUMENT_PYDANTIC: bool = get_bool_env("LOGFIRE_INSTRUMENT_PYDANTIC")


# A singleton instance of the settings class, intended to be imported and used
# across the application.
settings = LogfireSettings()
