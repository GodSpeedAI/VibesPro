from __future__ import annotations

import json
from collections.abc import Mapping, Sequence
from pathlib import Path
from typing import Any

try:
    import tomllib  # Python 3.11+
except ModuleNotFoundError:  # pragma: no cover - fallback for older interpreters
    import toml as tomllib  # type: ignore[assignment]

    def _load_toml(text: str) -> dict:
        return tomllib.loads(text)
else:

    def _load_toml(text: str) -> dict:
        return tomllib.loads(text)


DASHBOARD_PATH = Path("docs/observability/dashboards/logfire.json")
SCHEMA_PATH = Path("tools/observability/schema.json")
VECTOR_CONFIG = Path("ops/vector/vector.toml")


def _load_json(path: Path) -> dict:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:  # pragma: no cover - defensive guard
        raise AssertionError(f"Failed to parse JSON from {path}: {exc}") from exc


def _panel_contains_metric(panel: Any, metric: str) -> bool:
    if isinstance(panel, Mapping):
        return any(_panel_contains_metric(value, metric) for value in panel.values())
    if isinstance(panel, list | tuple | set | frozenset):
        return any(_panel_contains_metric(item, metric) for item in panel)
    if isinstance(panel, Sequence) and not isinstance(panel, str | bytes | bytearray):
        return any(_panel_contains_metric(item, metric) for item in panel)
    if isinstance(panel, str):
        return panel == metric
    return False


def test_dashboard_defines_logfire_panels() -> None:
    assert DASHBOARD_PATH.exists(), "Logfire dashboard definition is missing"
    data = _load_json(DASHBOARD_PATH)
    assert data.get("title") == "Logfire Overview", "Dashboard title should be Logfire Overview"
    panels = data.get("panels", [])
    assert any(
        _panel_contains_metric(panel, "logfire.span.duration") for panel in panels
    ), "Dashboard must chart logfire.span.duration"


def test_schema_describes_logfire_metrics() -> None:
    assert SCHEMA_PATH.exists(), "Observability schema missing logfire definitions"
    schema = _load_json(SCHEMA_PATH)
    metrics = schema.get("metrics", {})
    assert "logfire.span.duration" in metrics, "logfire.span.duration metric not documented"
    assert (
        metrics["logfire.span.duration"]["unit"] == "ms"
    ), "Duration metric should use milliseconds"


def test_vector_metrics_pipeline_wires_logfire_sink() -> None:
    config = _load_toml(VECTOR_CONFIG.read_text(encoding="utf-8"))
    transforms = config.get("transforms", {})
    assert "metrics_logfire_extract" in transforms, "Logfire metrics transform missing"

    sinks = config.get("sinks", {})
    openobserve = sinks.get("metrics_logfire_openobserve")
    assert openobserve is not None, "Logfire metrics OpenObserve sink missing"
    inputs = openobserve.get("inputs", [])
    assert (
        "metrics_logfire_enrich" in inputs
    ), "Logfire metrics sink should depend on enrichment transform"
