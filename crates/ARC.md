# ARC - Architectural Reasoning Companion

ARC (Architectural Reasoning Companion) is the AI agent system integrated into VibesPro. It is derived from the [g3-main](https://github.com/EricGusworking/g3-main) project and has been adapted to serve as VibesPro's core agent infrastructure.

## Overview

ARC provides:

- **LLM Providers** (`arc-providers`): Abstractions for connecting to various LLM backends (Anthropic, OpenAI, Databricks, embedded models)
- **Agent Core** (`arc-core`): The core agentic loop, tool execution, context management
- **Configuration** (`arc-config`): TOML-based configuration for agent settings
- **Execution Engine** (`arc-execution`): Code execution and sandboxing capabilities
- **Computer Control** (`arc-computer-control`): Desktop automation via WebDriver and native APIs (macOS, Windows, Linux)
- **Console** (`arc-console`): Web-based monitoring and management UI
- **Planner** (`arc-planner`): Task planning and requirements refinement
- **Ensembles** (`arc-ensembles`): Multi-agent orchestration (flocks)
- **CLI** (`arc-cli`): Command-line interface for running the agent

## Integration with VibesPro

ARC serves as the "agent brain" for VibesPro's Generative Development Environment. It will eventually power:

1. **AI-Assisted Code Generation**: Leverage arc-core's agentic capabilities for iterative code generation
2. **Institutional Memory Integration**: Connect to VibesPro's temporal database for pattern recall
3. **IDE Integration**: When VibesPro evolves into a full IDE, ARC will provide the AI backbone

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        VibesPro GDE                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │temporal-ai  │  │vibepro-     │  │     ARC Agent System    │  │
│  │(embeddings) │  │observe      │  │  ┌─────────────────────┐│  │
│  └─────────────┘  │(OTLP)       │  │  │  arc-cli            ││  │
│                   └─────────────┘  │  ├─────────────────────┤│  │
│  ┌─────────────┐                   │  │  arc-core           ││  │
│  │temporal_db  │                   │  │  arc-planner        ││  │
│  │(redb)       │◀──────────────────│  │  arc-ensembles      ││  │
│  └─────────────┘                   │  ├─────────────────────┤│  │
│                                    │  │  arc-providers      ││  │
│                                    │  │  arc-config         ││  │
│                                    │  │  arc-execution      ││  │
│                                    │  │  arc-computer-ctrl  ││  │
│                                    │  │  arc-console        ││  │
│                                    │  └─────────────────────┘│  │
│                                    └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Building

### Default Build (no native dependencies required)

```bash
cargo build
```

This builds the core crates: `arc-config`, `arc-execution`, `arc-providers`, `arc-console`, `vibepro-observe`, `vibes-pro-temporal-db`.

### Full Build (requires native dependencies)

```bash
# Install dependencies first:
# - Linux: sudo apt-get install libx11-dev libssl-dev libclang-dev
# - macOS: xcode-select --install

cargo build --workspace
```

## Crate Details

| Crate                  | Description               | Native Dependencies                                 |
| ---------------------- | ------------------------- | --------------------------------------------------- |
| `arc-config`           | Configuration management  | None                                                |
| `arc-execution`        | Code execution engine     | None                                                |
| `arc-providers`        | LLM provider abstractions | None (optional: `llama_cpp` for local-llm)          |
| `arc-console`          | Web-based management UI   | None                                                |
| `arc-core`             | Agent core engine         | Optional: `arc-computer-control`                    |
| `arc-planner`          | Task planner              | None                                                |
| `arc-ensembles`        | Multi-agent orchestration | None                                                |
| `arc-cli`              | CLI interface             | Depends on `arc-core`                               |
| `arc-computer-control` | Desktop automation        | X11 (Linux), Core Graphics (macOS), Win32 (Windows) |

## Configuration

ARC uses TOML configuration files. Create `~/.config/arc/config.toml` or `./arc.toml`:

```toml
[anthropic]
api_key = "sk-ant-..."
model = "claude-sonnet-4-20250514"
max_tokens = 8192

[openai]
api_key = "sk-..."
model = "gpt-4o"
```

## Feature Flags

- `arc-providers`:
    - `local-llm`: Enable embedded LLM inference via llama.cpp
- `arc-core`:
    - `computer-control`: Enable desktop automation capabilities

## Origins

ARC is derived from **g3** (General-purpose Agent for Getting things done with code). All references to `g3` have been renamed to `arc` to reflect its new identity as the **Architectural Reasoning Companion**.

## License

See the main VibesPro LICENSE file. ARC components are integrated under the VibesPro licensing terms.
