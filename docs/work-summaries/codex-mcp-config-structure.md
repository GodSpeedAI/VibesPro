# Codex MCP Server Configuration Guide

**Date**: October 12, 2025
**Task**: Structure MCP servers for Codex CLI
**Spec Reference**: N/A (External tool configuration)

## Summary

Configured multiple Streamable HTTP MCP servers for use with Codex CLI, following the official configuration format from the Codex documentation.

## Configuration Structure

Based on the [Codex config documentation](https://github.com/openai/codex/blob/main/docs/config.md#connecting-to-mcp-servers), here's the proper structure for your MCP servers:

### Complete config.toml Structure

```toml
# Enable experimental RMCP client (REQUIRED for Streamable HTTP servers)
experimental_use_rmcp_client = true

# Context7 - Up-to-date developer documentation
[mcp_servers.context7]
url = "https://server.smithery.ai/@upstash/context7-mcp/mcp"
bearer_token_env_var = "SMITHERY_API_KEY"
enabled = true
startup_timeout_sec = 20
tool_timeout_sec = 60

# Ref - Reference tools for documentation
[mcp_servers.ref]
url = "https://server.smithery.ai/@ref-tools/ref-tools-mcp/mcp"
bearer_token_env_var = "SMITHERY_API_KEY"
enabled = true
startup_timeout_sec = 20
tool_timeout_sec = 60

# Memory Tool - User preference storage
[mcp_servers.memory]
url = "https://server.smithery.ai/@mem0ai/mem0-memory-mcp/mcp"
bearer_token_env_var = "SMITHERY_API_KEY"
enabled = true
startup_timeout_sec = 20
tool_timeout_sec = 60

# Exa Search - Code context and web search
[mcp_servers.exa]
url = "https://server.smithery.ai/exa/mcp"
bearer_token_env_var = "SMITHERY_API_KEY"
enabled = true
startup_timeout_sec = 20
tool_timeout_sec = 60

# Microsoft Docs - Official Microsoft/Azure documentation
[mcp_servers.microsoftdocs]
url = "https://learn.microsoft.com/api/mcp"
enabled = true
startup_timeout_sec = 20
tool_timeout_sec = 60

# DeepWiki - GitHub repository documentation
[mcp_servers.deepwiki]
url = "https://mcp.deepwiki.com/sse"
enabled = true
startup_timeout_sec = 20
tool_timeout_sec = 60

# Vibe Check - Metacognitive questioning and learning
[mcp_servers.vibecheck]
url = "https://server.smithery.ai/@PV-Bhat/vibe-check-mcp-server/mcp"
bearer_token_env_var = "SMITHERY_API_KEY"
enabled = true
startup_timeout_sec = 20
tool_timeout_sec = 60
```

## Key Configuration Details

### 1. Experimental RMCP Client
**CRITICAL**: Must be enabled at the top level of `config.toml`:
```toml
experimental_use_rmcp_client = true
```

### 2. Authentication
Instead of embedding API keys in URLs (insecure), use environment variables:

```toml
bearer_token_env_var = "SMITHERY_API_KEY"
```

Then set the environment variable:
```bash
export SMITHERY_API_KEY="cc369a4a-eaf7-47a4-b6ba-61fae9e9e628"
```

### 3. Server Names
- Use simple, lowercase names (e.g., `context7`, `ref`, `memory`)
- Avoid spaces and special characters
- Names should match the table headers: `[mcp_servers.NAME]`

### 4. Optional Configurations
- `startup_timeout_sec`: Default is 10s, increased to 20s for reliability
- `tool_timeout_sec`: Default is 60s (can be adjusted per server)
- `enabled`: Set to `false` to disable a server without removing it

## Environment Setup

Create or update your shell profile (`~/.zshrc` or `~/.bashrc`):

```bash
# MCP Server Authentication
export SMITHERY_API_KEY="cc369a4a-eaf7-47a4-b6ba-61fae9e9e628"
```

Then reload:
```bash
source ~/.zshrc
```

## Managing MCP Servers

### List configured servers
```bash
codex mcp list
codex mcp list --json
```

### View specific server details
```bash
codex mcp get context7
```

### Remove a server
```bash
codex mcp remove context7
```

### OAuth login (if supported)
```bash
codex mcp login deepwiki
```

## Notes from Original Configuration

Your original configuration had several issues:
1. ❌ Used `"type": "http"` (not needed for Codex)
2. ❌ Embedded API keys and profile params in URLs (insecure)
3. ❌ Used `"gallery"` and `"version"` fields (not applicable to Codex)
4. ❌ Missing `experimental_use_rmcp_client = true`

The corrected configuration:
1. ✅ Uses proper Codex TOML format
2. ✅ Separates auth tokens into environment variables
3. ✅ Enables experimental RMCP client
4. ✅ Uses simple, descriptive server names
5. ✅ Includes timeout configurations

## References

- [Codex Config Documentation](https://github.com/openai/codex/blob/main/docs/config.md)
- [MCP Specification](https://modelcontextprotocol.io/specification/2025-06-18/basic/transports#streamable-http)
- Spec ID: External (no internal spec reference)
