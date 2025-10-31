from fastapi import FastAPI
from fastapi.testclient import TestClient
from opentelemetry.sdk.trace.export import SimpleSpanProcessor
from opentelemetry.sdk.trace.export.in_memory_span_exporter import InMemorySpanExporter

from libs.python.vibepro_logging import bootstrap_logfire


def test_fastapi_instrumentation_emits_spans():
    """
    Asserts that instrumenting a FastAPI app with bootstrap_logfire
    results in spans being emitted for HTTP requests.
    This fulfills the "Green" step of TDD Cycle 2A.
    """
    exporter = InMemorySpanExporter()
    processor = SimpleSpanProcessor(exporter)

    app = FastAPI()

    @app.get("/test")
    def test_endpoint():
        return {"status": "ok"}

    # Pass the test processor to Logfire's configuration
    bootstrap_logfire(
        app,
        additional_span_processors=[processor],
        send_to_logfire=False,  # Don't send data to the Logfire service
        console=False,  # Don't output to the console
    )

    client = TestClient(app)
    response = client.get("/test")

    assert response.status_code == 200

    spans = exporter.get_finished_spans()
    assert len(spans) > 0

    # Find the HTTP GET span by filtering for known attributes
    http_get_spans = [span for span in spans if span.attributes.get("http.method") == "GET"]
    assert len(http_get_spans) > 0, "No HTTP GET span found"

    # Use the first matching span for assertions
    span = http_get_spans[0]

    # Safely access attributes with clear error messages
    assert "http.method" in span.attributes, "Missing http.method attribute"
    assert "http.status_code" in span.attributes, "Missing http.status_code attribute"
    assert span.attributes.get("http.method") == "GET"
    assert span.attributes.get("http.status_code") == 200
