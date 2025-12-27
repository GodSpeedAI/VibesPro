# API Mocking Adapter

This adapter maps mocking commands to the scaffolding script.

## Command Mappings

### `/vibepro.mock.init`

Runs the initialization script to check dependencies and create fixtures.

- **Implementation**: `python3 tools/mocking/init.py`

```bash
python3 tools/mocking/init.py
```

### `/vibepro.mock.example`

Alias for init, as the script handles both (idempotently). Can be extended to generate specific patterns.

- **Implementation**: `python3 tools/mocking/init.py`

```bash
python3 tools/mocking/init.py
```
