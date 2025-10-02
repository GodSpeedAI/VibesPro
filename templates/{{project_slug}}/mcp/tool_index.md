# MCP Tool Index

This directory contains Model Context Protocol (MCP) tool descriptors for integrating external services with GitHub Copilot.

## Available Tools

- [example-http.tool.md](./example-http.tool.md) — Example HTTP tool descriptor (replace with your actual tools)

## Quick Start

### 1. Configure MCP Servers

Create or edit `.vscode/mcp.json` in your project root:

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

### 2. Set Environment Variables

Add required variables to your shell profile (`~/.zshrc`, `~/.bashrc`) or workspace `.env` file:

```bash
export EXAMPLE_HTTP_BASE_URL="https://api.example.com"
export EXAMPLE_HTTP_TOKEN="your-secret-token-here"
```

### 3. Reload VS Code

Restart VS Code or reload the window (`Cmd/Ctrl + Shift + P` → "Developer: Reload Window") to apply MCP configuration.

## Security Best Practices

- **Never hardcode secrets** in configuration files or code
- Use environment variables (`${env:VAR_NAME}`) for all sensitive values
- Add `.env` to `.gitignore` to prevent accidental commits
- Document all required environment variables in your README
- Use different credentials for development and production environments

## Adding New Tools

1. Create a new `*.tool.md` file in this directory
2. Document the tool's purpose, configuration, and usage
3. Add MCP server configuration to `.vscode/mcp.json`
4. Update this index with a link to the new tool descriptor
5. Test the integration with Copilot

## Documentation Convention

Each tool descriptor should include:

- Tool name and category
- Overview/purpose
- Configuration details
- Required environment variables
- Example usage
- Security considerations

## Resources

- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)
- [GitHub Copilot MCP Integration](https://docs.github.com/en/copilot)
- [VS Code MCP Configuration](https://code.visualstudio.com/docs/copilot/copilot-mcp)

## Notes

- This repository ships no custom MCP broker; Copilot reads `.vscode/mcp.json` directly
- Keep tool descriptors (`*.tool.md`) in this folder to document capabilities and example requests
- Follow the security guidelines above to prevent credential leaks
