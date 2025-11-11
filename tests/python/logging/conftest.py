"""Pytest fixtures for Logfire logging tests.

Provides:
- FastAPI test client with Logfire instrumentation
- Mock OTLP collector for testing telemetry export
- Environment variable isolation and cleanup
"""

import os
from collections.abc import Generator

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from opentelemetry.sdk.trace.export import SimpleSpanProcessor
from opentelemetry.sdk.trace.export.in_memory_span_exporter import (
    InMemorySpanExporter,
)


@pytest.fixture
def clean_env() -> Generator[None, None, None]:
    """Isolate environment variables for each test."""
    original_env = os.environ.copy()

    # Set test defaults
    os.environ["SERVICE_NAME"] = "test-service"
    os.environ["OTEL_EXPORTER_OTLP_ENDPOINT"] = "http://localhost:4318"
    os.environ["OTEL_EXPORTER_OTLP_PROTOCOL"] = "http/protobuf"
    os.environ["APP_ENV"] = "test"
    os.environ["APP_VERSION"] = "v0.0.0-test"

    yield

    # Restore original environment
    os.environ.clear()
    os.environ.update(original_env)


@pytest.fixture
def fastapi_app() -> FastAPI:
    """Create basic FastAPI app for testing."""
    app = FastAPI(title="Test App")

    @app.get("/health")
    def health():
        return {"status": "ok"}

    @app.get("/test")
    def test_endpoint():
        return {"message": "test"}

    return app


@pytest.fixture
def test_client(fastapi_app: FastAPI) -> TestClient:
    """Create FastAPI test client."""
    return TestClient(fastapi_app, raise_server_exceptions=False)


@pytest.fixture
def span_exporter() -> Generator[tuple[InMemorySpanExporter, SimpleSpanProcessor], None, None]:
    """Provide in-memory span exporter + processor for instrumentation tests."""
    exporter = InMemorySpanExporter()
    processor = SimpleSpanProcessor(exporter)
    try:
        yield exporter, processor
    finally:
        processor.force_flush()
        processor.shutdown()
        exporter.clear()
