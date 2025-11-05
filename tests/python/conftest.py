import os

import pytest

from libs.python.vibepro_logging import _reset_logfire_state


@pytest.fixture(autouse=True)
def reset_logfire_state_fixture():
    """Autouse fixture to reset logfire module state and env defaults before each test.

    This ensures tests run in isolation, do not depend on a cached
    Logfire instance from previous tests, and observe predictable
    default metadata values regardless of the external environment.
    """
    # Reset any cached instance
    _reset_logfire_state()

    # Normalize environment variables used by default_metadata()
    prev_app_env = os.environ.get("APP_ENV")
    prev_app_version = os.environ.get("APP_VERSION")
    os.environ["APP_ENV"] = "local"
    os.environ["APP_VERSION"] = "dev"

    try:
        yield
    finally:
        # Teardown: restore previous values (or remove if not set)
        if prev_app_env is None:
            os.environ.pop("APP_ENV", None)
        else:
            os.environ["APP_ENV"] = prev_app_env

        if prev_app_version is None:
            os.environ.pop("APP_VERSION", None)
        else:
            os.environ["APP_VERSION"] = prev_app_version

        _reset_logfire_state()
