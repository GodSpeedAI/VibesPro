# Temporal AI - Pattern Recommendation Engine

**Embedding-based pattern recommendation engine for Git commit history**

Temporal AI analyzes your Git repository to extract development patterns and provides intelligent recommendations based on semantic similarity, recency, usage frequency, and real-world performance metrics.

## Features

- 🧠 **Semantic Search** - Uses `embedding-gemma-300M` for pattern similarity
- 📊 **Performance-Aware** - Integrates OpenObserve metrics for success rates
- 🗄️ **Zero Dependencies** - Embedded `redb` database, no external services required
- 🔍 **Multi-Factor Ranking** - Combines similarity, recency, usage, and success rate
- 🚀 **Fast** - Local inference with quantized GGUF models

## Quick Start

### Prerequisites

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Download embedding model
mkdir -p models
cd models
wget https://huggingface.co/ggml-org/embeddinggemma-300M-GGUF/resolve/main/embeddinggemma-300M-Q8_0.gguf
cd ..
```

### Build

```bash
just temporal-ai-build
```

Or manually:

```bash
cd crates/temporal-ai
cargo build --release
```

### Initialize Database

```bash
./crates/temporal-ai/target/release/temporal-ai init
```

### Index Patterns

```bash
# Index last 1000 commits
./crates/temporal-ai/target/release/temporal-ai refresh --commits 1000

# Or use just recipe
just temporal-ai-refresh COMMITS=1000
```

### Query Patterns

```bash
# Find similar patterns
./crates/temporal-ai/target/release/temporal-ai query "Add authentication to FastAPI" --top 5

# Or use just recipe
just temporal-ai-query "Add authentication to FastAPI" TOP=5
```

**Example Output**:

```
=== Top 5 Recommendations ===

1. [Score: 0.892] Similarity: 94.2% | Recency: 85.0% | Usage: 12x | Success: 96.5%
   Pattern: Add JWT authentication middleware
   Files: src/auth/middleware.py, src/auth/jwt.py
   Commit: abc123...

2. [Score: 0.847] Similarity: 89.1% | Recency: 78.3% | Usage: 8x | Success: 92.0%
   Pattern: Implement OAuth2 flow
   Files: src/auth/oauth.py, src/auth/providers.py
   Commit: def456...
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Temporal AI CLI                         │
├─────────────────────────────────────────────────────────────┤
│  Pattern Extractor  │  Embedder  │  Ranker  │  Vector Store │
│   (git2)            │ (llama-cpp)│          │    (redb)     │
└─────────────────────────────────────────────────────────────┘
                              ↕
┌─────────────────────────────────────────────────────────────┐
│              Observability Aggregator (Optional)            │
│                    ↓                                        │
│              OpenObserve SQL API                            │
│         (Pattern Performance Metrics)                       │
└─────────────────────────────────────────────────────────────┘
```

### Components

- **Pattern Extractor** - Extracts patterns from Git commit history
- **Embedder** - Generates semantic embeddings using `embedding-gemma-300M`
- **Vector Store** - Stores embeddings and metadata in `redb`
- **Similarity Search** - Finds similar patterns using cosine similarity
- **Ranker** - Ranks recommendations using multi-factor scoring
- **Observability Aggregator** - Fetches performance metrics from OpenObserve

## Observability Integration

### Setup Local OpenObserve

```bash
# Start local OpenObserve instance
just temporal-ai-observe-start

# Verify it's running
curl http://localhost:5080/healthz
```

### Configure Credentials

Add to `.secrets.env.sops`:

```bash
OPENOBSERVE_URL=http://localhost:5080
OPENOBSERVE_ORG=default
OPENOBSERVE_USER=root@example.com
OPENOBSERVE_TOKEN=your-token-here
OPENOBSERVE_MODE=auto  # auto, local, or online
```

### Refresh Metrics

```bash
# Fetch metrics from last 7 days
just temporal-ai-refresh-metrics DAYS=7

# Or manually
./scripts/run-with-secrets.sh ./crates/temporal-ai/target/release/temporal-ai refresh-metrics --days 7
```

### How It Works

1. **Vector sends telemetry** to OpenObserve (traces, logs, metrics)
2. **OpenObserve stores** pattern recommendation events
3. **Temporal AI queries** OpenObserve SQL API for performance data
4. **Metrics are calculated**:
   - `success_rate = 1.0 - error_rate`
   - `avg_latency_ms` from response times
   - `error_rate` from failed recommendations
5. **Rankings are updated** to include success rate (15% weight)

### Observability Modes

| Mode     | Behavior                                                  |
| -------- | --------------------------------------------------------- |
| `auto`   | Try `localhost:5080` first, fallback to `OPENOBSERVE_URL` |
| `local`  | Only use `localhost:5080`                                 |
| `online` | Only use `OPENOBSERVE_URL`                                |

**Default**: `auto` (local-first with online fallback)

## Configuration

### Environment Variables

| Variable            | Description                            | Default   |
| ------------------- | -------------------------------------- | --------- |
| `OPENOBSERVE_URL`   | OpenObserve API base URL               | -         |
| `OPENOBSERVE_ORG`   | Organization name                      | `default` |
| `OPENOBSERVE_USER`  | Username for basic auth                | -         |
| `OPENOBSERVE_TOKEN` | Password/token for basic auth          | -         |
| `OPENOBSERVE_MODE`  | Observability mode (auto/local/online) | `auto`    |

### Ranking Weights

Default weights for recommendation scoring:

```rust
similarity_weight: 0.35   // Semantic similarity to query
recency_weight: 0.35      // How recent the pattern is
usage_weight: 0.15        // How often it's been recommended
success_rate_weight: 0.15 // Performance from OpenObserve
```

Customize via `RecommendationRanker::with_weights()`:

```rust
let ranker = RecommendationRanker::with_weights(
    &store,
    0.4,  // similarity
    0.3,  // recency
    0.2,  // usage
    0.1   // success_rate
);
```

## Commands

### `init`

Initialize empty database.

```bash
temporal-ai init
```

### `refresh`

Index patterns from Git history.

```bash
temporal-ai refresh [--commits N]
```

**Options**:

- `--commits N` - Number of recent commits to process (default: 1000)

### `refresh-metrics`

Fetch performance metrics from OpenObserve.

```bash
temporal-ai refresh-metrics [--days N]
```

**Options**:

- `--days N` - Number of days to query (default: 7)

**Requires**: OpenObserve credentials in environment

### `query`

Find similar patterns.

```bash
temporal-ai query <text> [--top N]
```

**Options**:

- `--top N` - Number of recommendations to return (default: 5)

### `stats`

Show database statistics.

```bash
temporal-ai stats
```

## Development

### Running Tests

```bash
# All tests
cargo test -p temporal-ai

# Integration tests only
cargo test --test observability_tests

# With output
cargo test -- --nocapture
```

### Building from Source

```bash
cd crates/temporal-ai
cargo build --release
```

### Code Structure

```
crates/temporal-ai/
├── src/
│   ├── lib.rs                      # Public API
│   ├── embedder.rs                 # Embedding generation
│   ├── pattern_extractor.rs       # Git pattern extraction
│   ├── vector_store.rs             # redb storage
│   ├── similarity_search.rs        # Cosine similarity
│   ├── ranker.rs                   # Multi-factor ranking
│   ├── observability_aggregator.rs # OpenObserve integration
│   ├── schema.rs                   # Data structures
│   └── bin/
│       └── main.rs                 # CLI entry point
├── tests/
│   └── observability_tests.rs      # Integration tests
└── Cargo.toml
```

## Troubleshooting

### Model Not Found

**Error**: `Model not found: models/embeddinggemma-300M-Q8_0.gguf`

**Solution**:

```bash
mkdir -p models
cd models
wget https://huggingface.co/ggml-org/embeddinggemma-300M-GGUF/resolve/main/embeddinggemma-300M-Q8_0.gguf
```

### No Patterns Found

**Error**: `No patterns found. Run 'temporal-ai refresh' first.`

**Solution**:

```bash
temporal-ai refresh --commits 1000
```

### OpenObserve Connection Failed

**Error**: `Failed to connect to OpenObserve`

**Diagnosis**:

1. Check OpenObserve is running: `curl http://localhost:5080/healthz`
2. Verify credentials: `sops -d .secrets.env.sops | grep OPENOBSERVE`
3. Check mode: `echo $OPENOBSERVE_MODE`

**Solution**:

```bash
# Start local OpenObserve
just temporal-ai-observe-start

# Or use online mode
export OPENOBSERVE_MODE=online
export OPENOBSERVE_URL=https://your-openobserve-instance.com
```

### Stale Metrics

**Issue**: Success rates in recommendations are outdated

**Solution**:

```bash
# Refresh metrics from OpenObserve
just temporal-ai-refresh-metrics DAYS=7
```

**Note**: Metrics are not auto-refreshed. Set up a cron job for automatic updates:

```bash
# Refresh daily at 2 AM
0 2 * * * cd /path/to/VibesPro && just temporal-ai-refresh-metrics DAYS=7
```

### Database Corruption

**Error**: `Failed to open database`

**Solution**:

```bash
# Backup existing database
cp data/temporal-ai.redb data/temporal-ai.redb.bak

# Reinitialize
temporal-ai init

# Re-index patterns
temporal-ai refresh --commits 1000
```

## Performance

### Benchmarks

Tested on MacBook Pro M1 (8GB RAM):

| Operation                 | Time          | Notes                     |
| ------------------------- | ------------- | ------------------------- |
| Model load                | ~2s           | One-time cost             |
| Pattern extraction (1000) | ~5s           | Depends on repo size      |
| Embedding generation      | ~50ms/pattern | Quantized Q8_0 model      |
| Database insert           | ~1ms/pattern  | redb is fast              |
| Query (top 5)             | ~100ms        | Includes ranking          |
| Metrics refresh (7 days)  | ~500ms        | Network latency dependent |

### Optimization Tips

1. **Use batch operations** for large imports
2. **Limit commit history** to recent patterns (--commits 500)
3. **Cache model** in memory for repeated queries
4. **Index incrementally** rather than full refreshes
5. **Use local OpenObserve** for faster metrics queries

## Contributing

### Adding New Features

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make changes and add tests
4. Run tests: `cargo test -p temporal-ai`
5. Submit a pull request

### Code Style

- Follow Rust conventions
- Run `cargo fmt` before committing
- Run `cargo clippy` and fix warnings
- Add tests for new functionality

## License

MIT

## References

**Specifications**:

- DEV-PRD-032: AI Workflow PRD
- DEV-SDS-020: AI Guidance SDS
- DEV-ADR-018: AI Workflow ADR

**Dependencies**:

- [llama-cpp-2](https://github.com/edgenai/llama_cpp-rs) - Embedding inference
- [redb](https://github.com/cberner/redb) - Embedded database
- [git2](https://github.com/rust-lang/git2-rs) - Git integration
- [reqwest](https://github.com/seanmonstar/reqwest) - HTTP client

**Related Tools**:

- [OpenObserve](https://openobserve.ai/) - Observability platform
- [Vector](https://vector.dev/) - Telemetry pipeline
- [embedding-gemma](https://huggingface.co/ggml-org/embeddinggemma-300M-GGUF) - Embedding model
