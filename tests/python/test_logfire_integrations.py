from unittest.mock import patch

import pytest
import requests
from opentelemetry.sdk.trace.export import SimpleSpanProcessor
from opentelemetry.sdk.trace.export.in_memory_span_exporter import InMemorySpanExporter

from libs.python.vibepro_logging import instrument_integrations


def test_requests_instrumentation():
    """
    Asserts that requests instrumentation emits spans.
    """
    try:
        from opentelemetry.instrumentation.requests import RequestsInstrumentor  # noqa: F401
    except ImportError:
        pytest.skip("opentelemetry-instrumentation-requests package not installed")

    exporter = InMemorySpanExporter()
    processor = SimpleSpanProcessor(exporter)

    # Configure logfire with our test processor
    import logfire

    logfire.configure(send_to_logfire=False, console=False, additional_span_processors=[processor])

    # Enable requests instrumentation
    instrument_integrations(requests=True)

    # Make a deterministic HTTP request by mocking the Session.send call
    with patch("requests.sessions.Session.send") as mock_send:
        response = requests.Response()
        prepared = requests.Request(method="GET", url="https://example.test/logfire").prepare()
        response.status_code = 200
        response.headers = {"Content-Type": "application/json"}
        response._content = b'{"ok": true}'
        response.request = prepared
        response.url = prepared.url
        mock_send.return_value = response

        requests.get("https://example.test/logfire", timeout=1)

    # Flush spans to ensure the exporter receives them before assertions
    processor.force_flush(timeout_millis=5_000)

    # Check that spans were created
    spans = exporter.get_finished_spans()
    assert len(spans) > 0

    # Find the HTTP span
    http_spans = [span for span in spans if "http" in span.name.lower()]
    assert len(http_spans) > 0

    # Verify the span has HTTP attributes
    http_span = http_spans[0]
    assert http_span.attributes.get("http.method") == "GET"
    assert http_span.attributes.get("http.url") is not None


@patch("libs.python.vibepro_logging.logfire")
def test_pydantic_instrumentation(mock_logfire):
    """
    Asserts that pydantic instrumentation is enabled.
    """
    instrument_integrations(pydantic=True)
    mock_logfire.instrument_pydantic.assert_called_once()
