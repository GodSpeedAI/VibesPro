# Observability Adapter

This adapter maps observability commands to the underlying Python scripts and Docker operations.

## Command Mappings

### `/vibepro.monitor.check`

Verifies that necessary environment variables are set and the stack is reachable.

- **Implementation**: Shell script checking `LOGFIRE_TOKEN` and curling OpenObserve.

```bash
#!/bin/bash
echo "🔍 Checking Observability Configuration..."

if [ -z "$LOGFIRE_TOKEN" ]; then
    echo "❌ LOGFIRE_TOKEN is missing."
else
    echo "✅ LOGFIRE_TOKEN is set."
fi

if curl -s http://localhost:5080/health > /dev/null; then
    echo "✅ OpenObserve is running at http://localhost:5080"
else
    echo "⚠️  OpenObserve is unreachable (might be stopped)."
fi
```

### `/vibepro.monitor.demo`

Runs the existing Logfire quickstart script to generate traffic.

- **Implementation**: `python3 tools/logging/logfire-quickstart.py`

```bash
python3 tools/logging/logfire-quickstart.py
```

### `/vibepro.monitor.stack.start`

Starts the OpenObserve stack using the secure wrapper script.

- **Implementation**: `bash ops/openobserve/run-with-secrets.sh`

```bash
# This script handles SOPS decryption internally
bash ops/openobserve/run-with-secrets.sh
```

### `/vibepro.monitor.stack.stop`

Stops the OpenObserve docker stack.

- **Implementation**: `docker compose down` (in `ops/openobserve`)

```bash
cd ops/openobserve && docker compose down
```

### `/vibepro.monitor.stack.status`

Checks the status of containers defined in `ops/openobserve/docker-compose.yml`.

- **Implementation**: `docker compose ps`

```bash
cd ops/openobserve && docker compose ps --format "table {{.Name}}\t{{.State}}\t{{.Status}}"
```
