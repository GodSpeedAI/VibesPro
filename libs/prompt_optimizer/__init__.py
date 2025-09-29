"""Compatibility shim exposing the hyphenated prompt-optimizer library under a
PEP 8 compliant module name.

This enables static type checkers and runtime imports to resolve
``prompt_optimizer`` while re-using the canonical implementation stored in
``libs/prompt-optimizer``.
"""

from __future__ import annotations

from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path

_HYPHEN_ROOT = Path(__file__).resolve().parent.parent / "prompt-optimizer"

__path__: list[str] = []

if _HYPHEN_ROOT.exists():
    __path__.append(str(_HYPHEN_ROOT))
    init_path = _HYPHEN_ROOT / "__init__.py"
    spec = spec_from_file_location(
        "prompt_optimizer.__init__",
        init_path,
        submodule_search_locations=[str(_HYPHEN_ROOT)],
    )
    if spec and spec.loader:
        module = module_from_spec(spec)
        spec.loader.exec_module(module)
        for name, value in module.__dict__.items():
            if not name.startswith("_"):
                globals()[name] = value
