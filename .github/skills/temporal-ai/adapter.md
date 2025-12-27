# Temporal AI Adapter

This adapter maps the skill commands to the underlying Python scripts and Rust binaries that implement the Temporal AI system.

## Command Mappings

### `/vibepro.temporal.init`

Initializes the ReDB database using the Python tooling script.

- **Implementation**: `python3 tools/temporal-db/init.py init`
- **Arguments**:
  - `--project-name`: Maps to `--project-name` argument.
  - `--db-path`: Maps to `--db-path` (optional).

```bash
python3 tools/temporal-db/init.py init --project-name "$1"
```

### `/vibepro.temporal.status`

Checks the status of the ReDB database and AI models.

- **Implementation**: `python3 tools/temporal-db/init.py status`
- **Arguments**: None.

```bash
python3 tools/temporal-db/init.py status
```

### `/vibepro.temporal.embed`

Embeds content using the Rust `temporal-ai` crate (via `embedder.rs`).

- **Implementation**: `cargo run -q -p temporal-ai --bin temporal-ai -- embed`
- **Arguments**:
  - `--file`: Input file path.
  - `--text`: Input text string.
  - `--model`: GGUF model path (optional).

```bash
# Example wrapper
cargo run -q -p temporal-ai --bin temporal-ai -- embed --file "$1"
```

### `/vibepro.temporal.query`

Queries the vector store using the Rust `temporal-ai` crate.

- **Implementation**: `cargo run -q -p temporal-ai --bin temporal-ai -- query`
- **Arguments**:
  - `--text`: Query text.
  - `--limit`: Number of results.

```bash
# Example wrapper
cargo run -q -p temporal-ai --bin temporal-ai -- query --text "$1" --limit "${2:-5}"
```
