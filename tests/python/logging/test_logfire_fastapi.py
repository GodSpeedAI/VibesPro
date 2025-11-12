"""Tests for Logfire FastAPI instrumentation.

Tests verify:
- logfire.instrument_fastapi() creates spans for HTTP requests
- Span attributes include http.method, http.route, http.status_code
- Error handling and exception tracking

Phase 1B (GREEN): Tests updated to validate actual Logfire implementation.
"""

import pytest
from fastapi.testclient import TestClient
from opentelemetry.trace import StatusCode

from libs.python.vibepro_logging import _reset_logfire_state, bootstrap_logfire

pytestmark = pytest.mark.usefixtures("clean_env")


def test_fastapi_auto_instrumentation_creates_span(fastapi_app, clean_env, span_exporter):
    """Verify logfire.instrument_fastapi() creates spans for HTTP requests."""
    exporter, processor = span_exporter
    _reset_logfire_state()
    app = bootstrap_logfire(
        fastapi_app,
        service="test-api",
        metrics=False,
        additional_span_processors=[processor],
    )
    client = TestClient(app, raise_server_exceptions=False)

    response = client.get("/health")

    # Verify response successful
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

    processor.force_flush()
    spans = exporter.get_finished_spans()
    assert spans, "Expected FastAPI instrumentation to emit spans"

    health_span = _find_span(spans, "/health")
    assert health_span is not None, "Expected span covering /health endpoint"
    assert health_span.attributes.get("http.method") == "GET"
    assert health_span.attributes.get("http.status_code") == 200


def test_fastapi_auto_instrumentation_span_attributes(
    fastapi_app,
    clean_env,
    span_exporter,
):
    """Verify span contains correct HTTP attributes."""
    exporter, processor = span_exporter
    _reset_logfire_state()
    app = bootstrap_logfire(
        fastapi_app,
        service="test-api",
        metrics=False,
        additional_span_processors=[processor],
    )
    client = TestClient(app, raise_server_exceptions=False)

    response = client.get("/test")

    # Verify response successful
    assert response.status_code == 200
    assert response.json() == {"message": "test"}

    processor.force_flush()
    spans = exporter.get_finished_spans()
    test_span = _find_span(spans, "/test")
    assert test_span is not None, "Expected span covering /test endpoint"
    assert test_span.attributes.get("http.route") in {"/test", "/{path}"}
    assert test_span.attributes.get("http.method") == "GET"
    assert test_span.attributes.get("http.status_code") == 200


def test_fastapi_trace_propagation(fastapi_app, clean_env):
    """Verify trace context headers are accepted.

    In production, Service A would call Service B via httpx,
    propagating trace context headers. This test verifies
    the instrumentation accepts such headers.
    """
    _reset_logfire_state()
    app = bootstrap_logfire(fastapi_app, service="service-a", metrics=False)
    client = TestClient(app, raise_server_exceptions=False)

    # Simulate incoming request with trace context headers
    response = client.get(
        "/health",
        headers={"traceparent": "00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-01"},
    )

    # Verify request processed successfully
    assert response.status_code == 200


def test_fastapi_error_tracking(fastapi_app, clean_env, span_exporter):
    """Verify exceptions are captured in spans with error status."""
    exporter, processor = span_exporter

    @fastapi_app.get("/error")
    def error_endpoint():
        raise ValueError("Test error")

    _reset_logfire_state()
    app = bootstrap_logfire(
        fastapi_app,
        service="test-api",
        metrics=False,
        additional_span_processors=[processor],
    )
    client = TestClient(app, raise_server_exceptions=False)

    # FastAPI will catch the exception and return 500
    response = client.get("/error")

    # Verify error response (FastAPI wraps unhandled exceptions)
    assert response.status_code == 500

    processor.force_flush()
    spans = exporter.get_finished_spans()
    error_span = _find_span(spans, "/error")
    assert error_span is not None, "Expected span covering /error endpoint"
    assert error_span.status.status_code == StatusCode.ERROR
    assert error_span.attributes.get("http.status_code") == 500

    exception_events = [event for event in error_span.events if event.name == "exception"]
    assert exception_events, "Expected exception event recorded on span"
    exception_attrs = exception_events[0].attributes
    assert exception_attrs.get("exception.type") == "ValueError"
    assert "Test error" in exception_attrs.get("exception.message", "")


def test_bootstrap_logfire_returns_app(fastapi_app, clean_env):
    """Verify bootstrap_logfire() returns the FastAPI app for chaining."""
    _reset_logfire_state()
    app = bootstrap_logfire(fastapi_app, service="test-api", metrics=False)

    # Verify app returned (enables chaining pattern)
    assert app is fastapi_app

    # Verify app is still functional
    client = TestClient(app)
    response = client.get("/health")
    assert response.status_code == 200


def _find_span(spans, route: str):
    """Locate the first span whose route/name contains the given path."""
    for span in spans:
        name = getattr(span, "name", "") or ""
        if route in name:
            return span
        span_route = span.attributes.get("http.route") if span.attributes else None
        if span_route == route:
            return span
        target = span.attributes.get("http.target") if span.attributes else None
        if target == route:
            return span
    return None
