# AI-Enhanced Development Tools

This directory contains AI workflow enhancement tools for the {{project_name}} project.

## Components

### Context Manager (`context-manager.ts`)

- Optimizes AI context selection within token budgets
- Implements relevance scoring and priority-based selection
- Supports multiple context sources with different priorities
- **Aider integration**: Optional LLM-powered codebase context

### Aider Integration (`aider/`)

Optional integration with [aider-chat](https://aider.chat) for LLM-powered codebase context.

**Supported Backends** (tried in fallback order):

| Backend    | Model Format                             | Environment Variable |
| ---------- | ---------------------------------------- | -------------------- |
| OpenAI     | `gpt-4o`                                 | `OPENAI_API_KEY`     |
| OpenRouter | `openrouter/anthropic/claude-3.5-sonnet` | `OPENROUTER_API_KEY` |
| Ollama     | `ollama_chat/qwen2.5-coder`              | `OLLAMA_API_BASE`    |

**Custom Endpoints** (GitHub Copilot, LiteLLM, etc.):

```bash
export OPENAI_API_BASE=https://api.githubcopilot.com
export OPENAI_API_KEY=<oauth_token>
```

## Usage

### Basic (without Aider)

```typescript
import { AIContextManager } from "./context-manager.js";

const manager = new AIContextManager({
    maxTokens: 8000,
    reservedTokens: 2000,
});

const context = await manager.getOptimalContext("Create user entity");
```

### With Aider

```typescript
import { AIContextManager } from "./context-manager.js";

const manager = new AIContextManager({
    maxTokens: 8000,
    reservedTokens: 2000,
    aider: {
        enabled: true,
        fallbackOrder: ["openai", "openrouter", "ollama"],
        model: "gpt-4o", // optional, uses default per backend
    },
});

const context = await manager.getOptimalContext("Create user entity");
// Aider context source is automatically registered
```

## Setup

```bash
# Install aider-chat
just setup-aider

# Or manually
pip install aider-chat
```

## Configuration (SOPS + direnv)

Secrets are managed via `.secrets.env.sops` and auto-loaded by direnv. **Never commit plaintext API keys.**

### Adding Aider API Keys

1. **Edit secrets file:**

    ```bash
    sops .secrets.env.sops
    ```

2. **Add your preferred backend credentials:**

    ```env
    # OpenAI (default)
    OPENAI_API_KEY=sk-...

    # Optional: Custom endpoint (GitHub Copilot, LiteLLM, etc.)
    OPENAI_API_BASE=https://api.githubcopilot.com

    # OpenRouter (alternative)
    OPENROUTER_API_KEY=sk-or-...

    # Optional: Override model for any backend
    AIDER_MODEL=gpt-4o
    ```

3. **Reload environment:**
    ```bash
    direnv allow
    ```

### Ollama (Local)

Ollama doesn't require secrets — just start the server:

```bash
ollama serve
# Optional: set custom endpoint
OLLAMA_API_BASE=http://localhost:11434
```

### Verify Configuration

```bash
# Check which backend will be used
sops -d .secrets.env.sops | grep -E 'OPENAI|OPENROUTER|AIDER'
```
