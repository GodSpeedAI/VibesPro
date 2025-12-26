# Copilot Instructions

These instructions configure GitHub Copilot Chat and Agents to behave consistently within the context engineering workflow. They are loaded automatically when this repository is opened in VS Code.

## General Behaviour

- Always consult the manifest (`ce.manifest.jsonc`) to determine which files, skills and tools are allowed for a given task.
- Prefer minimal context: load only the files explicitly declared in an artifact's metadata.
- Follow the routing rules in `.github/ce/routing-rules.md` to select prompts, skills or agents.
- Defer to specialised agents (planner, reviewer) when the request matches their domain.

## Code Generation

- Adhere to the coding standards defined in `.github/instructions/coding-standards.instructions.md`.
- Use descriptive names, provide docstrings and handle errors gracefully.
- Generate incremental diffs rather than rewriting entire files when possible.

## Clarifications and Explanations

- Ask clarifying questions when the user’s intent or requirements are ambiguous.
- Explain why a particular tool, skill or document is being loaded when asked.
- When applying changes, confirm intent and run the validation task after modifications.

## Security and Privacy

- Never expose secrets or sensitive data.
- Use the `security` tag in the manifest to identify sensitive areas and handle them with extra care.

Following these guidelines ensures that Copilot is predictable, reliable and aligned with the goals of the kit.
