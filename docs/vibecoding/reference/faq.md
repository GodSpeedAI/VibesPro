# FAQ ❓

## Do I need external assistants like RooCode or Aider?
No. This template uses Copilot chat modes, prompts, and MCP only.

## Where do secrets go for MCP tools?
Use environment variables and reference them in `.vscode/mcp.json` with `${env:VAR}`.

## What if `pnpm`, `nx`, or `lint/typecheck` scripts are missing?
`just ai-validate` degrades gracefully and skips unavailable steps.
