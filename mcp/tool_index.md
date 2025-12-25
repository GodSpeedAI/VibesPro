# MCP Tool Index

- example-http.tool.md — Example HTTP tool descriptor

## Using MCP tools with Copilot

Configure MCP servers in `.vscode/mcp.json`. Example (HTTP tool with env auth):

```json
{
  "mcpServers": {
    "example-http": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/cli", "http"],
      "env": {
        "EXAMPLE_HTTP_BASE_URL": "${env:EXAMPLE_HTTP_BASE_URL}",
        "EXAMPLE_HTTP_TOKEN": "${env:EXAMPLE_HTTP_TOKEN}"
      }
    }
  }
}
```

Notes

- Do not hardcode secrets. Set `EXAMPLE_HTTP_*` in your shell/profile or workspace environment.
- Keep tool descriptors (`*.tool.md`) in this folder to document capabilities and example requests.
- This repository ships no custom MCP broker; Copilot reads `.vscode/mcp.json` directly.
