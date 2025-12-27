# Reliable Integration Testing with Mocks

Integration testing is often flaky due to external dependencies. VibesPro solves this using **Mountebank** (over-the-wire mocking) and **Testcontainers** (ephemeral environments).

## Why This Approach?

- **Hermetic**: Tests run in isolation; no shared external state.
- **Reliable**: Network flakiness is eliminated by running mocks locally in Docker.
- **Realistic**: Your application speaks real HTTP to a real (mock) server, verifying the actual wire protocol.

## Workflow

1.  **Initialize Infrastructure**:

    ```bash
    /vibepro.mock.init
    ```

    This checks for `testcontainers` and creates the `mountebank` fixture.

2.  **Write a Test**:
    Use the `mountebank` fixture in your Pytest tests.

    ```python
    def test_payment_gateway(mountebank):
        # 1. Configure the Mock
        mb_url = mountebank.get_url()
        imposter = {
            "port": 4545,
            "protocol": "http",
            "stubs": [...]
        }
        requests.post(f"{mb_url}/imposters", json=imposter)

        # 2. Run your code pointing to the mock port
        result = my_payment_service.process(..., gateway_url=...)

        # 3. Verify
        assert result.success
    ```

## Best Practices

- **Dynamic Ports**: Always ask `testcontainers` for the mapped port; never hardcode `localhost:4545`.
- **Session Scope**: The `mountebank` fixture is session-scoped for performance. It starts once per test run.
- **Cleanup**: Testcontainers handles Docker cleanup automatically.
