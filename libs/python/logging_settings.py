from __future__ import annotations

import os


def get_bool_env(name: str, default: bool = False) -> bool:
    """Return the boolean value of an environment variable."""
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
    """Settings for Logfire integrations."""

    def __init__(self) -> None:
        self.INSTRUMENT_REQUESTS: bool = get_bool_env("LOGFIRE_INSTRUMENT_REQUESTS")
        self.INSTRUMENT_PYDANTIC: bool = get_bool_env("LOGFIRE_INSTRUMENT_PYDANTIC")


settings = LogfireSettings()
