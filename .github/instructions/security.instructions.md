---
description: "Security-focused instructions for Copilot and chat responses"
applyTo: "**"
kind: instructions
domain: security
precedence: 10
---

# Security Guidelines (Canonical)

-   Always sanitize and validate all user inputs when generating code or scripts. Never interpolate untrusted data into shell commands or SQL queries.
-   Never modify `.vscode/settings.json` or `.vscode/tasks.json` from within a prompt or generated code. Malicious changes to these files can enable auto‑approval of tool calls (YOLO mode) and allow remote code execution.
-   Do not enable `chat.tools.autoApprove` in any workspace configuration. Keep auto‑approval disabled to ensure that human review is required before running tools or scripts.
-   Respect VS Code’s workspace trust boundaries. Do not run tasks or execute code in an untrusted folder without explicit confirmation.
-   When interacting with external APIs or MCP servers, avoid hardcoding secrets. Use environment variables or input variables in the `mcp.json` configuration.
-   Ensure that tasks defined in `.vscode/tasks.json` do not execute arbitrary commands from untrusted sources. Validate any inputs and avoid commands that can lead to command injection.
-   Use the `security-review.prompt.md` file for security audits. The prompt references this instruction file to apply these guidelines automatically.

## Additional compliance reminders

-   Map features and code paths to PRD/SDS security requirements when applicable.
-   Add brief STRIDE-style threat notes in PRs where new attack surfaces appear (S/T/R/I/D/E).
-   Secrets policy: expect `.env` or a secret store; never commit keys.

Note: This file is canonical in this repo. If you import security guidance from other sources, merge non-overlapping items here and avoid divergence.
