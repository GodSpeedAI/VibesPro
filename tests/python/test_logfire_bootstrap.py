import importlib

import pytest


def test_bootstrap_logfire_stub_exists() -> None:
    """Ensure the bootstrap entrypoint is present and not yet implemented."""
    module = importlib.import_module("libs.python.vibepro_logging")
    app = object()

    with pytest.raises(NotImplementedError):
        module.bootstrap_logfire(app)  # type: ignore[attr-defined]
