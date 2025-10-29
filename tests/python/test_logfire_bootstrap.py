
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from opentelemetry.sdk.trace.export.in_memory_span_exporter import InMemorySpanExporter
from opentelemetry.sdk.trace.export import SimpleSpanProcessor
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
        console=False  # Don't output to the console
    )

    client = TestClient(app)
    response = client.get("/test")

    assert response.status_code == 200

    spans = exporter.get_finished_spans()
    assert len(spans) > 0
    span = spans[0]
    # The span name is now internal to the asgi instrumentation
    assert "GET" in span.name
    assert span.attributes["http.method"] == "GET"
    assert span.attributes["http.status_code"] == 200

