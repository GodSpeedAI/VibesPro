# Context Engineering SDK

Welcome to the Context Engineering SDK. This kit provides everything you need to start a new project with best practices for semantic routing, AI agent orchestration and context management baked in.

## Overview

The kit is organised around a strict manifest (`ce.manifest.jsonc`) that enumerates every routable artifact — documents, agents, prompts, instructions, skills, toolsets and tasks. The manifest ensures that nothing is loaded implicitly; only registered artifacts participate in routing and tool invocation. This prevents hallucination and technical debt by making context explicit.

Custom agents interpret user intent, select the minimal context required and delegate work to specialised skills and prompts. Toolsets define safe groups of capabilities (read, write, exec, mcp) and tasks enforce validation and other gates. Instructions overlay additional behaviour on files or patterns, such as coding standards or product alignment.

## Getting Started

1. Unzip this kit into the root of your new project repository.
2. Review and customise `PRODUCT.md` and `ARCHITECTURE.md` to reflect your domain.
3. Open the repository in VS Code and run the `Context Kit: Validate` task to ensure everything is consistent.
4. Use the orchestrator agent to interact with the kit. For example, ask it to “create a plan for feature X” or “review these changes”.
5. When adding new artifacts, use the `add-artifact.prompt.md` and follow the instructions; the artifact‑registry skill will scaffold and register new files automatically.

## Strict Mode

Strict mode means that unregistered files will be ignored by the routing engine. To make a file routable, scaffold it with the artifact‑registry skill and add a corresponding entry in the manifest. Always run the validation task after modifications to ensure the manifest remains consistent.

## Customisation

You can extend this kit by adding:

- New skills in `.github/skills/` to encapsulate reusable capabilities.
- New prompts in `.github/prompts/` to define deterministic entry points.
- New agents in `.github/agents/` when you need additional orchestration patterns.

Refer to the manifest schema and routing rules for details on how the pieces fit together. This documentation is intended to be clear and easy to follow so that developers of all levels can get started quickly.

## Support and Feedback

If you encounter issues or have suggestions to improve the kit, please open an issue or contribute a pull request following the guidelines in `CONTRIBUTING.md`.
