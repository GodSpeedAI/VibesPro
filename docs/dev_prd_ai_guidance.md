# DEV-PRD-020: Temporal AI Guidance Fabric

**Traceability**: DEV-ADR-018 (Active), DEV-SDS-020
**Dependencies**: DEV-ADR-016 ✅, DEV-ADR-017 ✅, redb infrastructure ✅
**Status**: Active
**Owner**: Platform Team

---

## Overview

As a developer using AI assistants, I want **semantic pattern recommendations** based on project history so that architectural decisions remain consistent and learnings compound over time.

The Temporal AI Guidance Fabric uses **embedding-gemma-300M** (GGUF quantized, CPU-optimized) to generate 768-dimensional embeddings of code patterns extracted from Git history. These embeddings are stored in a `redb` vector database and searched using cosine similarity to provide AI agents with context-aware, performance-validated recommendations.

**Key Innovation**: Semantic similarity search over regex-based keyword matching enables intent-based recommendations that handle paraphrasing and reduce false positives by 10x.

---

## EARS (Event → Action → Response)

| Event                                              | Action                                                                                                                           | Response                                                                                                                               |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Developer asks "How should I implement auth?"      | AI agent queries temporal DB with embedded query vector → cosine similarity search finds top-5 patterns (similarity >0.75)       | Returns ranked recommendations: "jwt-authentication used in 3 services, avg 45ms latency, 98.5% success rate" with code examples       |
| AI generates code violating hexagonal architecture | Pattern engine embeds generated code → similarity search against stored anti-patterns (violation vectors)                        | Detects violation in <2s, surfaces correction: "Dependencies flow inward only. See identity/domain/user.entity.ts for correct pattern" |
| New domain "billing" created                       | Pattern extractor analyzes commit diff → generates semantic description → embedder creates 768-dim vector → stores with metadata | Future domain generation queries "create domain" → recommends billing structure: folder layout, entity patterns, 92% acceptance rate   |

---

## User Stories

### US-020-A: Semantic Pattern Recommendation

**As a** developer  
**I want** AI to suggest patterns from project history using semantic similarity  
**So that** I follow established conventions without manual research or keyword guessing

**Acceptance Criteria**:

- ✅ AI queries temporal DB when asked for implementation guidance (e.g., "implement caching", "add auth")
- ✅ Query text embedded to 768-dim vector using embedding-gemma-300M (<500ms)
- ✅ Cosine similarity search returns patterns with similarity >0.85 (strong match) or >0.75 (moderate match)
- ✅ Suggestions include: pattern name, example code snippet, semantic description, when used (timestamp), why it worked (success rate from observability)
- ✅ Recommendations ranked by combined score: `similarity * 0.6 + recency * 0.2 + success_rate * 0.2`
- ✅ Top-5 results returned with rationale (e.g., "Used in identity domain 3 months ago, 98.5% success rate")

**DX Impact**: Reduces research time from 15 minutes (manual grep) to <2 seconds (semantic query)

---

### US-020-B: Architecture Violation Detection

**As a** developer  
**I want** immediate feedback when AI suggests code violating architecture rules  
**So that** hexagonal boundaries remain intact and technical debt is prevented

**Acceptance Criteria**:

- ✅ AI-generated code embedded and compared against stored anti-pattern vectors
- ✅ Violations detected via similarity threshold: anti-pattern similarity >0.80 → flag violation
- ✅ Violations surfaced with:
    - Rule violated (e.g., "Infrastructure layer importing from domain layer")
    - Correction guidance (e.g., "Use dependency inversion: domain defines interface, infrastructure implements")
    - Historical example from compliant code (file path + snippet)
- ✅ Feedback provided within 2 seconds of code generation
- ✅ False positive rate <5% (validated via manual review of 100 samples)

**DX Impact**: Prevents architectural drift, reduces PR review cycles by catching violations pre-commit

---

### US-020-C: Learning from Observability

**As an** AI system  
**I want** to correlate code patterns with observability metrics  
**So that** I recommend patterns with proven performance characteristics

**Acceptance Criteria**:

- ✅ Temporal DB ingests span data from OpenObserve (SQL API query for pattern metrics)
- ✅ Pattern recommendations include:
    - Average latency (e.g., "45ms avg response time")
    - Error rate (e.g., "0.5% error rate over 30 days")
    - Usage frequency (e.g., "Used in 127 requests/day")
    - P95 latency (e.g., "P95: 120ms")
- ✅ Success rate calculated from observability: `success_rate = (1 - error_rate) * (1 - min(latency_ms / 1000, 0.5))`
- ✅ Patterns with error_rate >5% or avg_latency >500ms ranked lower (penalty applied)
- ✅ Metrics refreshed daily via `just temporal-ai-refresh-metrics`

**DX Impact**: AI agents avoid recommending slow or error-prone patterns, improving code quality by default

---

## DX Metrics

| Metric                               | Target                    | Measurement                                                       | Rationale                                                            |
| ------------------------------------ | ------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------- |
| **Pattern Recommendation Accuracy**  | >80% developer acceptance | Weekly survey: "Was this recommendation helpful?" (Yes/No)        | Validates semantic search quality and ranking algorithm              |
| **Query Latency (Semantic Search)**  | <100ms                    | P95 latency from embed + similarity search (excluding model load) | Ensures real-time usability in AI agent workflows                    |
| **Embedding Generation**             | <500ms per code snippet   | Benchmark with criterion.rs on embedding-gemma-300M               | CPU-only inference must be fast enough for interactive use           |
| **Temporal DB Growth**               | <50MB per 1000 commits    | Monitor `temporal_db/vectors.redb` file size                      | Vector storage efficiency (768-dim f32 = 3KB per pattern + metadata) |
| **False Positive Rate (Violations)** | <5%                       | Manual review of 100 flagged violations                           | Ensures anti-pattern detection doesn't block valid code              |
| **Model Load Time**                  | <3s on first query        | Measure GGUF model load (embedding-gemma-300M-Q4)                 | Acceptable cold-start latency for CLI tool                           |
| **Memory Usage (Runtime)**           | <512MB                    | `heaptrack` profiling during 10k pattern search                   | Fits in modest development machines                                  |

---

## Functional Requirements

### FR-020-1: Embedding Generation

- **Input**: Text (code snippet, commit message, semantic description)
- **Output**: 768-dimensional f32 vector
- **Model**: embedding-gemma-300M (GGUF Q4_K_M quantized, ~180MB)
- **Runtime**: rustformers/llm (CPU-optimized, zero GPU dependency)
- **Performance**: <500ms per embedding on modern CPU (4-core, 3.5GHz)

### FR-020-2: Vector Storage

- **Database**: redb (embedded transactional KV store)
- **Schema**:
    - `EMBEDDINGS_TABLE`: `pattern_id` → `Vec<f32>` (768-dim vector)
    - `METADATA_TABLE`: `pattern_id` → JSON (name, code_snippet, semantic_desc, domain, framework, created_at, success_rate)
    - `METRICS_TABLE`: `pattern_id` → observability data (avg_latency_ms, error_rate, usage_count, p95_latency_ms)
- **File**: `temporal_db/vectors.redb` (single-file, portable)
- **Operations**: Insert, search (cosine similarity), delete, update metrics

### FR-020-3: Similarity Search

- **Algorithm**: Cosine similarity (dot product / magnitude product)
- **Optimization**: SIMD-friendly implementation + rayon parallel iteration
- **Threshold**: Minimum similarity 0.75 (filter weak matches)
- **Top-K**: Return 5-10 best matches (configurable)
- **Performance**: <100ms for 10k patterns (full scan), <10ms with ANN index (future)

### FR-020-4: Pattern Extraction

- **Source**: Git commit history (git2 library)
- **Extraction**:
    - Commit message parsing (conventional commits preferred)
    - File path analysis (detect layers: domain, application, infrastructure)
    - Code diff summarization (function signatures, imports, exports)
- **Semantic Description**: Natural language synthesis for embedding
    - Example: "Implements JWT authentication in FastAPI using jose library. Creates token_service.py in infrastructure/auth with encode/decode functions. Used in identity domain."
- **Filters**: Skip merge commits, formatting-only changes (<10 lines diff)

### FR-020-5: Recommendation Ranking

- **Scoring Formula**:

    ```
    score = similarity * 0.6 + recency_score * 0.2 + success_rate * 0.2

    where:
      recency_score = max(0, 1 - age_days / 180)  # 6-month window
      success_rate = (1 - error_rate) * (1 - min(avg_latency_ms / 1000, 0.5))
    ```

- **Filters**: Exclude patterns >6 months old unless similarity >0.90
- **Output**: Top-5 ranked recommendations with metadata

### FR-020-6: Observability Integration

- **Data Source**: OpenObserve SQL API
- **Query**:
    ```sql
    SELECT AVG(latency_ms), SUM(errors)/COUNT(*), COUNT(*), PERCENTILE(latency_ms, 0.95)
    FROM traces
    WHERE pattern_id = ? AND timestamp > now() - INTERVAL '30 days'
    ```
- **Refresh**: Daily cron job or manual `just temporal-ai-refresh-metrics`
- **Fallback**: Default success_rate = 0.8 if no observability data

---

## Non-Functional Requirements

### NFR-020-1: Performance

- Embedding generation: <500ms (P95)
- Similarity search: <100ms for 10k patterns (P95)
- Total query latency: <600ms (embed + search)
- Model load time: <3s (cold start)

### NFR-020-2: Scalability

- Support 10k patterns initially (full scan acceptable)
- Scale to 100k patterns with ANN index (future: annoy-rs or hnswlib-rs)
- DB growth: Linear with commits (<50MB per 1000)

### NFR-020-3: Reliability

- ACID transactions for vector storage (redb guarantees)
- Graceful degradation: Return cached results if embedder fails
- Error handling: Retry logic for OpenObserve API (3 retries, exponential backoff)

### NFR-020-4: Portability

- Single-file database (vectors.redb)
- CPU-only inference (no GPU required)
- Cross-platform: Linux, macOS, Windows (GGUF + redb support all)

### NFR-020-5: Security

- No PII in embeddings (code patterns only, no user data)
- OpenObserve auth via environment variable (SOPS-encrypted)
- Temporal DB file permissions: 600 (owner read/write only)

---

## Dependencies

| Dependency                        | Status          | Notes                                          |
| --------------------------------- | --------------- | ---------------------------------------------- |
| DEV-ADR-016: Observability Stack  | ✅ Complete     | Rust tracing → Vector → OpenObserve functional |
| DEV-ADR-017: Structured Logging   | ✅ Complete     | JSON-first logging with trace correlation      |
| Temporal DB infrastructure (redb) | ✅ Exists       | Used in `temporal_db/project_specs.db`         |
| embedding-gemma-300M model        | ⏳ To download  | HuggingFace: ggml-org/embeddinggemma-300M-GGUF |
| rustformers/llm library           | ⏳ To integrate | GGUF model loading for Rust                    |
| Git repository access             | ✅ Available    | git2 library for commit analysis               |

---

## Implementation Phases

### Phase 3A: Specification Authoring (Current)

- Create DEV-PRD-020 ✅
- Create DEV-SDS-020
- Update DEV-ADR-018 (Proposed → Active)

### Phase 3B: Embedding Infrastructure

- Download embedding-gemma-300M model
- Implement embedder (crates/temporal-ai/src/embedder.rs)
- Implement vector store (crates/temporal-ai/src/vector_store.rs)
- Implement similarity search (crates/temporal-ai/src/similarity.rs)
- Tests: embedder, vector_store, similarity

### Phase 3C: Pattern Recommendation Engine

- Implement pattern extractor (crates/temporal-ai/src/pattern_extractor.rs)
- Implement ranker (crates/temporal-ai/src/ranker.rs)
- Create CLI tool (crates/temporal-ai/src/bin/main.rs)
- Create TypeScript client (tools/ai/temporal-ai-client.ts)
- Tests: integration tests (end-to-end)

### Phase 3D: Observability Integration

- Implement observability aggregator (crates/temporal-ai/src/observability_aggregator.rs)
- OpenObserve SQL API integration
- Success rate calculation and storage
- Just recipe: `temporal-ai-refresh-metrics`

---

## Success Criteria

### Cycle 3 Exit Criteria

1. ✅ Developer asks "implement caching" → receives 5 ranked recommendations with code examples
2. ✅ Query latency <600ms (P95) for embed + search
3. ✅ Recommendations include observability data (latency, error rate)
4. ✅ Architecture violations detected in <2s with <5% false positives
5. ✅ 80%+ developer acceptance rate (measured via feedback)
6. ✅ All tests passing (Rust unit + integration, TypeScript)
7. ✅ Performance benchmarks meet targets (criterion.rs)

---

## Future Enhancements

### v2: Approximate Nearest Neighbors (ANN)

- **Goal**: <10ms search for 100k+ patterns
- **Library**: annoy-rs or hnswlib-rs
- **Trigger**: When pattern count >10k (full scan >100ms)

### v3: Multi-Modal Embeddings

- **Code**: embedding-gemma for code structure
- **Documentation**: separate embeddings for README, ADR, comments
- **Hybrid Search**: Combine code similarity + doc relevance

### v4: Reinforcement Learning from Feedback

- **Track**: Developer acceptance (thumbs up/down)
- **Retrain**: Adjust ranking weights based on feedback
- **Personalization**: Per-developer pattern preferences

---

## Risks & Mitigations

| Risk                                    | Probability | Impact | Mitigation                                                                       |
| --------------------------------------- | ----------- | ------ | -------------------------------------------------------------------------------- |
| embedding-gemma-300M too slow on CPU    | Medium      | High   | Benchmark first (criterion.rs). Fallback: smaller model (150M) or keyword search |
| Redb performance degrades >10k patterns | Low         | Medium | Implement ANN index early if benchmarks show degradation                         |
| False positives in violation detection  | Medium      | Medium | Manual review of first 100 violations, tune threshold                            |
| OpenObserve API downtime blocks metrics | Low         | Low    | Graceful degradation: use cached success_rate or default 0.8                     |
| Model download failure (HuggingFace)    | Low         | High   | Mirror model to internal CDN, provide fallback URL                               |

---

## Appendix: Embedding Model Details

**Model**: embedding-gemma-300M  
**Source**: https://huggingface.co/ggml-org/embeddinggemma-300M-GGUF  
**Quantization**: Q4_K_M (4-bit, medium quality)  
**File Size**: ~180MB  
**Output Dimension**: 768  
**Context Window**: 2048 tokens (~1500 words)  
**Inference Time (CPU)**: ~400ms per embedding (4-core, 3.5GHz)  
**Memory Usage**: ~300MB loaded model + ~200MB working memory

**Why embedding-gemma over alternatives**:

- **vs BERT**: 10x faster inference (300M vs 110M params, optimized for embedding)
- **vs OpenAI API**: Zero external dependencies, no rate limits, no cost
- **vs all-MiniLM**: Better code understanding (trained on code + text)
- **vs larger models (2B)**: 5x faster with minimal accuracy loss for pattern matching

---

**Approval**: Ready for implementation (Phase 3B)
