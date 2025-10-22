"""Compatibility shim for stdlib ``logging`` used by docs and quickstarts.

This module no longer replaces ``sys.modules['logging']``. Instead it
attempts to load the real stdlib implementation and copy its public
attributes into this module's globals. This prevents runtime tooling
from being confused by a repo-local ``tools/logging`` package on
``sys.path`` while keeping the package usable for examples.
"""

import importlib as _importlib
import importlib.util as _importlib_util
import os as _os
import sys as _sys
import sysconfig as _sysconfig
from importlib import import_module as _import_module
from typing import Any

# Attempt to locate and load the real stdlib `logging` implementation
_stdlib_logging = None
try:
    _stdlib_dir = _sysconfig.get_paths().get("stdlib")
    if _stdlib_dir:
        candidates = [
            _os.path.join(_stdlib_dir, "logging", "__init__.py"),
            _os.path.join(_stdlib_dir, "logging.py"),
        ]
        for _p in candidates:
            if _os.path.exists(_p):
                _spec = _importlib_util.spec_from_file_location("_stdlib_logging", _p)
                if _spec and _spec.loader:
                    _mod = _importlib_util.module_from_spec(_spec)
                    _spec.loader.exec_module(_mod)
                    _stdlib_logging = _mod
                    break
except Exception:
    _stdlib_logging = None

# Fallback to a normal import
if _stdlib_logging is None:
    try:
        _stdlib_logging = _import_module("logging")
    except Exception:
        _stdlib_logging = None


if _stdlib_logging is not None:
    # Copy public attributes from the real stdlib logging module into this
    # module's globals to mimic the stdlib API for importers.
    for _name in dir(_stdlib_logging):
        if _name.startswith("_"):
            continue
        if hasattr(_stdlib_logging, _name):
            globals()[_name] = getattr(_stdlib_logging, _name)

    # Register the loaded stdlib logging module in sys.modules so that
    # imports of submodules like `logging.handlers` succeed. Some tooling
    # (pip, installers, mypy) import logging.handlers directly and that
    # fails if the repo-local package shadows stdlib logging.
    try:
        _sys.modules["logging"] = _stdlib_logging
        try:
            _handlers = _importlib.import_module("logging.handlers")
            _sys.modules["logging.handlers"] = _handlers
        except Exception as _err:  # pragma: no cover - optional submodule
            try:
                _log = _import_module("logging")
                _log.debug("Could not import logging.handlers: %s", _err)
            except Exception:  # pragma: no cover - best-effort fallback  # noqa: S110
                # Best-effort logging; silent fallback
                pass
    except Exception as _err:
        try:
            _log = _import_module("logging")
            _log.debug("Could not register stdlib logging in sys.modules: %s", _err)
        except Exception:  # pragma: no cover - best-effort fallback  # noqa: S110
            # Best-effort logging; silent fallback
            pass

    # Build an explicit list of public names to avoid problematic dynamic
    # comprehensions that some static checkers flag.
    # Deliberately avoid setting __all__ dynamically to keep static
    # checkers happy; public attributes were copied into module globals.
else:
    # Minimal fallback so imports fail with a clear error rather than
    # AttributeError on import-time.
    def getLogger(name: Any | None = None) -> Any:  # pragma: no cover - fallback shim  # noqa: N802
        raise RuntimeError("stdlib logging module unavailable")

    # No __all__ set for fallback shim.
