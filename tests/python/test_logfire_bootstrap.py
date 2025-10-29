import importlib

import pytest


def test_bootstrap_logfire_stub_exists() -> None:
    """Ensure the bootstrap entrypoint is present and correctly deferred to DEV-TDD cycle 2A."""
    module = importlib.import_module("libs.python.vibepro_logging")
    app = object()

    # Verify that bootstrap_logfire is a stub that raises NotImplementedError
    # This is expected behavior until DEV-TDD cycle 2A when Logfire implementation will be completed
    with pytest.raises(NotImplementedError):
        module.bootstrap_logfire(app)  # type: ignore[attr-defined]
