# ARC AGENT SYSTEM SPECIFICATIONS

<!-- matrix_ids: [DEV-PRD-033, DEV-ADR-023, DEV-SDS-031] -->

## DEV-PRD-033 — ARC (Architectural Reasoning Companion) Agent Integration

- Description: As a developer, I want an integrated AI agent system (ARC) that provides agentic coding capabilities, enabling autonomous code generation, task planning, and multi-step reasoning within the VibesPro GDE.
- EARS: When invoking an AI task, the system shall utilize the ARC agent infrastructure to execute tool-calling agentic loops with configurable LLM providers.
- DX Metrics: Agent response latency <5s for simple tasks; task completion rate >85%; reduced manual intervention by 50%.
- Supported by: DEV-ADR-023, DEV-SDS-031

### Goals

- Provide a complete agent brain for the VibesPro Generative Development Environment.
- Enable multi-turn agentic interactions with tool execution capabilities.
- Support multiple LLM providers (Anthropic Claude, OpenAI, Databricks, embedded models).
- Integrate with VibesPro's temporal database for institutional memory.
- Prepare infrastructure for future IDE integration (VS Code fork).

### Non-Goals

- Replacing human review and oversight for critical code changes.
- Supporting production deployment automation (out of scope for initial version).
- Handling unsandboxed code execution without explicit user approval.

### User Stories

| ID        | Story                                                                                                     | Acceptance Criteria                                                                  |
| --------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| PRD-033-A | As a developer, I can configure which LLM provider the ARC agent uses via TOML configuration.             | Configuration supports Anthropic, OpenAI, Databricks, and local models via arc.toml. |
| PRD-033-B | As a developer, the ARC agent can execute tools (file read/write, shell commands) to complete my request. | Agent successfully calls tools and integrates results into response flow.            |
| PRD-033-C | As a developer, I can use the ARC CLI to start an interactive agent session.                              | `cargo run -p arc-cli` starts a functional REPL session.                             |
| PRD-033-D | As a developer, the ARC console provides a web-based interface for monitoring agent sessions.             | Console accessible at localhost:3000 when running arc-console.                       |
| PRD-033-E | As a platform engineer, I can extend ARC with new tool definitions.                                       | Tool system is extensible via Rust traits/interfaces.                                |

### Functional Requirements

- ARC crates integrate as workspace members in the VibesPro Cargo workspace.
- Configuration via `~/.config/arc/config.toml` or `./arc.toml` with API key and model settings.
- LLM providers support streaming responses with token tracking.
- Context window management with automatic thinning at configurable thresholds (50%, 60%, 70%, 80%).
- Tool execution sandboxing with user approval for destructive operations.
- Session logging for debugging and observability.

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     VibesPro GDE                                │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                   ARC Agent System                          ││
│  │  ┌───────────┐  ┌────────────┐  ┌────────────────────────┐ ││
│  │  │ arc-cli   │  │ arc-console│  │   arc-core (engine)    │ ││
│  │  │ (REPL)    │  │ (Web UI)   │  │ - Agent loop           │ ││
│  │  └─────┬─────┘  └─────┬──────┘  │ - Tool execution       │ ││
│  │        │              │         │ - Context management   │ ││
│  │        └──────────────┼─────────┤ - Streaming parser     │ ││
│  │                       │         └───────────┬────────────┘ ││
│  │  ┌────────────────────┴──────────────────────┴─────────┐   ││
│  │  │              arc-providers                          │   ││
│  │  │  ┌──────────┐  ┌────────┐  ┌──────────┐  ┌───────┐ │   ││
│  │  │  │Anthropic │  │ OpenAI │  │Databricks│  │Embedded│ │   ││
│  │  │  └──────────┘  └────────┘  └──────────┘  └───────┘ │   ││
│  │  └─────────────────────────────────────────────────────┘   ││
│  │  ┌────────────────────────────────────────────────────────┐││
│  │  │  arc-config │ arc-execution │ arc-planner │ arc-ensembles│
│  │  └────────────────────────────────────────────────────────┘││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  temporal_db    │  │   temporal-ai   │  │ vibepro-observe │ │
│  │  (redb storage) │  │  (embeddings)   │  │  (OTLP traces)  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Crate Overview

| Crate                  | Purpose                         | Native Dependencies            |
| ---------------------- | ------------------------------- | ------------------------------ |
| `arc-cli`              | Command-line REPL interface     | Depends on arc-core            |
| `arc-core`             | Agent loop, tools, context mgmt | Optional: arc-computer-control |
| `arc-config`           | TOML-based configuration        | None                           |
| `arc-providers`        | LLM provider abstractions       | Optional: llama_cpp            |
| `arc-execution`        | Code execution sandboxing       | None                           |
| `arc-planner`          | Task planning and refinement    | None                           |
| `arc-ensembles`        | Multi-agent orchestration       | None                           |
| `arc-console`          | Web-based monitoring UI         | None                           |
| `arc-computer-control` | Desktop automation              | X11, Win32, Core Graphics      |

### Dependencies

- DEV-PRD-032 — AI pattern intelligence (temporal database integration)
- DEV-ADR-018 — Temporal AI intelligence fabric
- Cargo workspace integration with existing crates

### Acceptance Tests

- `tests/arc/test_agent_loop.rs` — Validates agent loop executes tools correctly.
- `tests/arc/test_providers.rs` — Ensures LLM providers stream and parse responses.
- `tests/arc/test_context_window.rs` — Verifies context thinning at thresholds.
- Unit tests in each arc-\* crate via `cargo test`.

### Success Criteria

- All arc-\* crates compile without errors on default build.
- arc-providers tests pass (18+ tests).
- Configuration loading from arc.toml works correctly.
- Token usage tracking and context window management functional.
- Documentation in `crates/ARC.md` accurate and complete.

---

## DEV-ADR-023 — Integrate G3 Agent Codebase as ARC

### Context

VibesPro requires an AI agent subsystem to provide agentic coding capabilities. The [g3-main](https://github.com/EricGusworking/g3-main) project provides a mature, production-tested agent implementation with multiple LLM providers, tool execution, and context management.

### Decision

We integrate g3-main into VibesPro as "ARC" (Architectural Reasoning Companion) with the following strategy:

1. **Rename all crates**: `g3-*` → `arc-*`
2. **Rename all code references**: `g3_*` → `arc_*` (functions, variables, paths)
3. **Convert VibesPro root to Cargo workspace** with all crates as members
4. **Make native dependencies optional** (X11, llama_cpp) via feature flags
5. **Configure default-members** to exclude crates requiring special native dependencies

### Consequences

**Positive:**

- Immediate access to battle-tested agentic loop, tool execution, and LLM integrations.
- Unified Rust workspace with shared dependencies.
- Clear path to IDE integration when VibesPro evolves.

**Negative:**

- Some crates (arc-computer-control, arc-core with computer feature) require native libraries.
- Initial integration requires extensive renaming across codebase.
- Maintenance burden of keeping ARC aligned with upstream g3 (if needed).

### Status

Accepted and implemented (December 2024).

---

## DEV-SDS-031 — ARC Agent System Design

### Principle

The ARC agent system follows a modular, layered design enabling:

- Provider-agnostic LLM integration
- Extensible tool system
- Configurable context management
- Optional platform-specific capabilities

### Design

#### 1. Provider Abstraction (`arc-providers`)

```rust
#[async_trait]
pub trait LLMProvider: Send + Sync {
    async fn complete(&self, request: CompletionRequest) -> Result<CompletionResponse>;
    async fn stream(&self, request: CompletionRequest) -> Result<CompletionStream>;
    fn name(&self) -> &str;
    fn model(&self) -> &str;
    fn has_native_tool_calling(&self) -> bool;
    fn supports_cache_control(&self) -> bool;
    fn max_tokens(&self) -> u32;
    fn temperature(&self) -> f32;
}
```

Implementations: `AnthropicProvider`, `OpenAIProvider`, `DatabricksProvider`, `EmbeddedProvider` (optional).

#### 2. Configuration (`arc-config`)

TOML-based configuration supporting:

- API keys per provider
- Model selection
- Token limits
- Temperature settings
- Custom paths

Locations searched:

- `./arc.toml`
- `~/.config/arc/config.toml`
- `~/.arc.toml`

#### 3. Context Management (`arc-core`)

- Token estimation using character/word heuristics
- Automatic thinning at 50%, 60%, 70%, 80% thresholds
- System prompt preservation during resets
- Message caching with TTL support (Anthropic)

#### 4. Tool System (`arc-core`)

JSON-based tool calls with validation:

```rust
pub struct ToolCall {
    pub tool: String,
    pub args: serde_json::Value,
}
```

Built-in tools: file_read, file_write, shell_execute, code_search, todo_read, todo_write, etc.

#### 5. Feature Flags

- `arc-providers`:
    - `local-llm`: Enable llama_cpp for embedded inference
- `arc-core`:
    - `computer-control`: Enable desktop automation

### Error Modes

- Missing configuration file → Clear error message with example path
- API key invalid → Provider-specific error with retry guidance
- Token overflow → Automatic context thinning
- Tool execution failure → Logged with user notification

### Artifacts

- `crates/arc-*/` — All ARC agent crates
- `crates/ARC.md` — Agent system documentation
- `Cargo.toml` — Workspace manifest with arc-\* members

### Cross-References

- DEV-PRD-033 — Product requirements for ARC integration
- DEV-ADR-023 — Architecture decision record
- DEV-PRD-032 — AI pattern intelligence (temporal integration)
- DEV-ADR-018 — Temporal AI intelligence fabric

---

## Implementation Status

| Component              | Status                  | Notes                                     |
| ---------------------- | ----------------------- | ----------------------------------------- |
| Crate migration        | ✅ Complete             | All 9 crates renamed and integrated       |
| Workspace conversion   | ✅ Complete             | Root Cargo.toml is now workspace manifest |
| Code renaming (g3→arc) | ✅ Complete             | All source files updated                  |
| Feature flags          | ✅ Complete             | local-llm, computer-control configurable  |
| Default build          | ✅ Working              | Core crates build without native deps     |
| Tests                  | ✅ Passing              | 28+ tests pass on default build           |
| Documentation          | ✅ Complete             | crates/ARC.md created                     |
| Full workspace build   | ⚠️ Requires native deps | X11, libclang needed for all crates       |
