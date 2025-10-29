import os


def get_bool_env(name: str, default: bool = False) -> bool:
    """Return the boolean value of an environment variable."""
    return os.getenv(name, str(default)).lower() in ("true", "1", "t")


class LogfireSettings:
    """Settings for Logfire integrations."""

    INSTRUMENT_REQUESTS: bool = get_bool_env("LOGFIRE_INSTRUMENT_REQUESTS")
    INSTRUMENT_PYDANTIC: bool = get_bool_env("LOGFIRE_INSTRUMENT_PYDANTIC")


settings = LogfireSettings()
