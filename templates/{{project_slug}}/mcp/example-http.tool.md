# Example HTTP Tool

**Category**: `http`

## Overview

This is an example MCP tool descriptor demonstrating how to document HTTP-based MCP servers.
For production use, replace this with your actual MCP server documentation.

## Configuration

-   **Name**: `example-http`
-   **Endpoint**: `https://example.com/api`
-   **Authentication**: Use environment variable `EXAMPLE_TOKEN`; do not commit secrets
-   **Usage**: Demo purposes only

## Environment Variables

Required environment variables:

-   `EXAMPLE_HTTP_BASE_URL` - Base URL for the API endpoint
-   `EXAMPLE_HTTP_TOKEN` - Authentication token (do not hardcode or commit)

## Example Usage

Configure in `.vscode/mcp.json`:

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

## Security Notes

-   Never hardcode credentials in configuration files
-   Use environment variables for all sensitive values
-   Keep `.env` files out of version control
-   Document required environment variables in your README
