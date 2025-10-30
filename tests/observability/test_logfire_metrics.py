from __future__ import annotations

import json
from pathlib import Path

DASHBOARD_PATH = Path("docs/observability/dashboards/logfire.json")
SCHEMA_PATH = Path("tools/observability/schema.json")
VECTOR_CONFIG = Path("ops/vector/vector.toml")


def _load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def test_dashboard_defines_logfire_panels() -> None:
    assert DASHBOARD_PATH.exists(), "Logfire dashboard definition is missing"
    data = _load_json(DASHBOARD_PATH)
    assert data.get("title") == "Logfire Overview", "Dashboard title should be Logfire Overview"
    panel_queries = " ".join(json.dumps(panel) for panel in data.get("panels", []))
    assert "logfire.span.duration" in panel_queries, "Dashboard must chart logfire.span.duration"


def test_schema_describes_logfire_metrics() -> None:
    assert SCHEMA_PATH.exists(), "Observability schema missing logfire definitions"
    schema = _load_json(SCHEMA_PATH)
    metrics = schema.get("metrics", {})
    assert "logfire.span.duration" in metrics, "logfire.span.duration metric not documented"
    assert (
        metrics["logfire.span.duration"]["unit"] == "ms"
    ), "Duration metric should use milliseconds"


def test_vector_metrics_pipeline_wires_logfire_sink() -> None:
    config = VECTOR_CONFIG.read_text(encoding="utf-8")
    assert "[transforms.metrics_logfire_extract]" in config, "Logfire metrics transform missing"
    assert (
        "[sinks.metrics_logfire_openobserve]" in config
    ), "Logfire metrics OpenObserve sink missing"
    assert (
        'inputs = ["metrics_logfire_enrich"]' in config
    ), "Logfire metrics sink should depend on enrichment transform"
