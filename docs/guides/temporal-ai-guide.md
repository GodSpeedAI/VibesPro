# Deep Dive into Temporal AI

This guide explores the Temporal AI system in VibesPro, explaining how it combines temporal data storage with local AI capabilities.

## Architecture

The Temporal AI system consists of three main components:

1.  **ReDB (Rust Embedded Database)**: A highly efficient, embedded key-value store used for persisting temporal data and specifications.
2.  **GGUF Embeddings**: Local text-to-vector generation using `gemma-300m` (or other supported models) via `llama.cpp` bindings.
3.  **Temporal Index**: A specialized index that organizes information by time and semantic similarity, allowing for "time-travel" queries over project history.

## Key Capabilities

### 1. Semantic Search

Unlike keyword search, the Temporal AI system understands the _meaning_ of your queries. It uses vector embeddings to find relevant specifications, decisions (ADRs), and code patterns even if the exact words don't match.

### 2. Time-Travel Queries

You can query the state of the project at any point in time. This is critical for understanding _why_ a decision was made in the past context.

### 3. Feature Extraction

The system automatically extracts features from your prompts and specifications (e.g., clarity score, complexity) to help optimize agent performance over time.

## Usage Guide

### Embedding Content

To force an embedding update for a file:

```bash
/vibepro.temporal.embed --file docs/specs/my-new-spec.md
```

### Querying Knowledge

To ask questions about the project history:

```bash
/vibepro.temporal.query --text "Why did we choose Hexagonal Architecture?"
```

## Internal Tools

The system relies on the `crates/temporal-ai` Rust binary for performance-critical operations (vector math, indexing). Python scripts in `tools/temporal-db` handle higher-level orchestration and database initialization.
