"""Runtime shim exposing the generated prompt implementation.

Prefer importing the PEP8-friendly package name ``prompt_optimizer``. If the
scaffolder generated the implementation under the older hyphenated directory
``libs/prompt-optimizer``, this shim provides a backward-compatible fallback
by loading symbols from that layout. New templates should prefer the
underscored package name.
"""

from __future__ import annotations

from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path

# Backward-compatibility: if a generated project still created
# ``libs/prompt-optimizer``, expose its public symbols under the
# preferred ``prompt_optimizer`` package name.
_hyphen_root = Path(__file__).resolve().parent.parent / "prompt-optimizer"

if _hyphen_root.exists():
    init_path = _hyphen_root / "__init__.py"
    spec = spec_from_file_location(
        "prompt_optimizer.__init__",
        init_path,
        submodule_search_locations=[str(_hyphen_root)],
    )
    if spec and spec.loader:
        module = module_from_spec(spec)
        spec.loader.exec_module(module)
        for name, value in module.__dict__.items():
            if not name.startswith("_"):
                globals()[name] = value
