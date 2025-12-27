# Full Stack Observability

VibesPro provides a comprehensive "Full Stack Observability" solution that works out-of-the-box for local development.

## The Stack

- **Logfire**: A Python SDK for structured logging and distributed tracing. It instruments your agents and tools to emit OpenTelemetry-compatible signals.
- **OpenObserve**: A lightweight, high-performance observability platform (an alternative to Elasticsearch/Datadog) that runs locally via Docker.

## Getting Started

1.  **Start the Stack**:

    ```bash
    /vibepro.monitor.stack.start
    ```

    This launches OpenObserve at `http://localhost:5080`.

2.  **Check Health**:

    ```bash
    /vibepro.monitor.check
    # Verifies connectivity and token configuration
    ```

3.  **View Logs**:
    Open your browser to `http://localhost:5080` (default user: `root@example.com` / password: see SOPS secrets) to explore logs and traces.

## Logging in Python

Use the `vibepro_logging` module to emit structured logs:

```python
from libs.python.vibepro_logging import get_logger, LogCategory

logger = get_logger(category=LogCategory.APP)
logger.info("Processing task", task_id="123", complexity="high")
```

These logs are automatically enriched with service name, environment, and trace IDs before being sent to OpenObserve.
