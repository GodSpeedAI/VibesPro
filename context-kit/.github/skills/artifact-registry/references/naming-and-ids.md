# Naming and ID Conventions

To maintain consistency across the context engineering kit, follow these conventions when naming
files and assigning IDs:

1. **IDs**. Each artifact ID must start with `ce.` followed by the artifact kind (`doc`, `agent`,
   `prompt`, `instruction`, `skill`, `toolset` or `task`) and a slug, separated by dots (e.g.
   `ce.prompt.my-feature`). IDs must be unique across the entire manifest.

2. **Slugs**. Use lower‑case letters, numbers and hyphens only. Avoid underscores and spaces.
   Slugs should describe the purpose concisely (e.g. `create-plan`, `review-changes`).

3. **File names**. Match the slug and file type. Prompt files end with `.prompt.md`, agents with
   `.agent.md`, instruction files with `.instructions.md`, skill descriptors as `SKILL.md`, toolset
   files as `.toolsets.jsonc` and tasks are defined in `.vscode/tasks.json`.

4. **Folder structure**. Place agents under `.github/agents/`, prompts under `.github/prompts/`,
   instructions under `.github/instructions/`, skills under `.github/skills/<slug>/`,
   toolsets under `toolsets/`, and tasks in `.vscode/tasks.json`. Docs such as PRODUCT.md and
   ARCHITECTURE.md live at the repository root.

Adhering to these conventions helps both humans and the routing logic locate and load resources
efficiently.
