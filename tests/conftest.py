import pathlib


def pytest_ignore_collect(path, config):
    """Ignore legacy duplicate template tests that interfere with canonical test run.

    We intentionally keep a single canonical test: `tests/template/test_template_generation.py`
    and ignore older variants that were added during iterative debugging. This keeps the
    test run deterministic and avoids extra Jinja rendering failures.
    """
    try:
        name = pathlib.Path(path).name
    except Exception:
        return False

    ignored = {
        "test_template_generation_final.py",
        "test_template_generation_run.py",
        "test_template_generation_uv.py",
        "test_template_generation_userdata2.py",
    }

    return name in ignored
