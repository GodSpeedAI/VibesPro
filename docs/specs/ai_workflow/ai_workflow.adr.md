# AI WORKFLOW ADRs

<!-- matrix_ids: [] -->

## DEV-ADR-001 — Native Copilot/VS Code over custom DSL

-   Decision: Use only GitHub Copilot + VS Code native mechanisms (copilot-instructions.md, instructions/_.md, prompts/_.prompt.md, chatmodes/\*.chatmode.md, settings.json, tasks) instead of inventing a YAML DSL.
-   Context: Constraint of "NO custom YAML files or external DSL," need for immediate usability and hot-reload.
-   Rationale: Lower cognitive load; no extra tooling; leverages existing ecosystem; simpler onboarding; safe defaults.
-   DX Impact: Faster setup (<10 min), less context switching, predictable discovery; fewer toolchains to learn.
-   Trade–offs: Less declarative logic in-config; conditional flows handled via tasks/scripts.

## DEV-ADR-002 — MECE modular instruction files with "LoRA-style" stacking

-   Decision: Break guidance into MECE instruction files (security, performance, style, general) and compose per task by ordered stacking.
-   Rationale: Mirrors adapter/LoRA composability; enables reuse and fine-grained overrides.
-   DX Impact: Clear layering, simpler diffs, targeted tweaks; avoids monolithic prompts.
-   Conventions: Left-to-right order determines precedence; repo-wide > mode > prompt can be tuned explicitly.

## DEV-ADR-003 — Custom chat modes as first-class personas (8 roles)

-   Decision: Define chat modes for product-manager, ux-ui-designer, system-architect, senior-frontend-engineer, senior-backend-engineer, qa-test-automation-engineer, devops-deployment-engineer, security-analyst.
-   Rationale: Minimizes cognitive switching; aligns with delivery phases; improves handoffs.
-   DX Impact: One-click persona; consistent outputs; faster planning/implementation flows.

## DEV-ADR-004 — Tasks as orchestration layer (dynamic injection, A/B, token metrics)

-   Decision: Use VS Code tasks to run prompts, inject dynamic context, measure tokens, and support A/B flows via branches/workspaces.
-   Rationale: Declarative files stay simple; tasks provide controlled imperative glue.
-   DX Impact: Repeatable runs; single keybindings/commands; measurable feedback loops.

## DEV-ADR-006 — Context window optimization via strategic file ordering

-   Decision: Use chat.promptFilesLocations and chat.modeFilesLocations with curated ordering; prune redundant context.
-   Rationale: Predictable token budgets; reduce noise; improve answer quality.
-   DX Impact: Fewer truncations; faster, more relevant results.

## DEV-ADR-007 — Prompt-as-code lifecycle (VC, lint, test, plan)

-   Decision: Treat prompts/instructions as code: versioned, linted, evaluated (A/B), and "planned" prior to change.
-   Rationale: Reproducibility and rollback; reduces regressions.
-   DX Impact: Safer iteration; observable quality trends; consistent reviews.

## DEV-ADR-009 — Declarative-first with imperative escape hatches

-   Decision: Keep guidance declarative; use tasks/scripts for branching/conditionals and retrieval.
-   Rationale: Maintains simplicity; avoids DSL creep; enables power when needed.
-   DX Impact: Lower learning curve; flexibility preserved.

## DEV-ADR-010 — Evaluation hooks and token budgets

-   Decision: Provide token usage logging, quality checks, and optional toxicity/safety post-process steps.
-   Rationale: Close the loop on output quality and cost.
-   DX Impact: Faster feedback; predictable spend; structured improvements.

## DEV-ADR-018 — Temporal AI intelligence fabric for guidance & optimization

Status: Active

Context

-   Enhanced AI pattern prediction, automated performance optimization, and deeper context awareness are top DX asks, but current capabilities operate independently (temporal DB, pattern recognizer, performance telemetry, and AIContextManager scoring).
-   redb already stores architecture decisions, performance spans, and AI guidance outcomes with timestamps, yet no feedback loop closes the gap between historical success and future recommendations.
-   Developers want proactive, confident suggestions without curating prompts by hand for every task.

Decision

-   Implement embedding-based pattern search using embedding-gemma-300M (GGUF Q4_K_M, 300M params, 768-dim vectors) for semantic similarity over Git commit history.
-   Use rustformers/llm for CPU-only inference and redb for embedded vector storage with zero external dependencies.
-   Build recommendation engine with cosine similarity search, combining similarity scores with recency and usage metrics.
-   Establish shared contracts so that:
    -   Git history → pattern extraction → embedding generation → vector storage pipeline
    -   Semantic search returns top-k patterns ranked by similarity + recency + usage
    -   AIContextManager scoring incorporates pattern confidence and usage success rates when assembling bundles inside token budgets.
-   Ship the fabric in incremental phases with strict TDD coverage tracked in Cycle 3 implementation plan.

Rationale

-   **Higher-confidence guidance:** Semantic search over proven patterns reduces generic answers and aligns suggestions with historical solutions.
-   **Zero external dependencies:** Local CPU inference eliminates API costs and latency; redb provides embedded storage.
-   **Operational awareness:** Performance metrics feed into ranking algorithm to prioritize proven patterns.
-   **Context quality:** Injecting temporal success data into context scoring increases bundle relevance without exceeding budgets.
-   **Proven technology:** embedding-gemma-300M specifically designed for semantic similarity; 300M params balance quality and speed.

Consequences

| Area           | Positive                                                          | Trade–off                                                         |
| -------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------- |
| Developer DX   | Proactive, context-aware recommendations with confidence metadata | Requires ~200MB model download and initial indexing               |
| Data           | Embedded storage in single redb file (~47MB for 10k patterns)     | Must implement retention policies for pattern pruning             |
| Operations     | Background refresh jobs for pattern indexing                      | CPU usage during embedding generation (<500ms per pattern)        |
| Performance    | Sub-second recommendations (<500ms P95 end-to-end)                | Similarity search O(n) scales to ~100k patterns before ANN needed |
| Implementation | Clear specs (DEV-PRD-020, DEV-SDS-020) with Rust/TypeScript FFI   | Coordination needed across Rust core and TypeScript client        |

Implementation Requirements

1. **Phase 3A: Specifications** ✅

    - DEV-PRD-020: Product requirements with EARS tables and user stories
    - DEV-SDS-020: Software design with 6 core components and redb schema
    - DEV-ADR-018: Status updated to Active (this change)

2. **Phase 3B: Embedding Infrastructure**

    - Download embedding-gemma-300M model (~180MB GGUF)
    - Implement `embedder.rs` with llm integration
    - Implement `vector_store.rs` with redb (3 tables: EMBEDDINGS, METADATA, METRICS)
    - Implement `similarity.rs` with SIMD-optimized cosine similarity
    - Implement `pattern_extractor.rs` with git2 for commit parsing
    - Performance targets: <500ms embedding, <100ms search (10k patterns)

3. **Phase 3C: Recommendation Engine**

    - Implement `ranker.rs` with weighted scoring (similarity 50%, recency 20%, usage 30%)
    - Build CLI binary for pattern refresh and query
    - Create TypeScript FFI bindings via NAPI-RS
    - Write integration tests for end-to-end pipeline

4. **Phase 3D: Observability Integration**
    - Implement `observability_aggregator.rs` to query OpenObserve metrics
    - Correlate pattern recommendations with performance data
    - Add tracing spans for all operations
    - Create dashboard queries for recommendation effectiveness

Dependencies

-   Rust crates: `llm`, `redb`, `git2`, `anyhow`, `serde`, `napi`
-   Model: embedding-gemma-300M-Q4_K_M.gguf from Hugging Face
-   TypeScript: NAPI-RS bindings for Node.js integration

---
