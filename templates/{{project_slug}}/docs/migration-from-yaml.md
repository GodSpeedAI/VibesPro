# Migrating from a YAML‑Based Prompt DSL to Native Copilot + VS Code

Many teams have experimented with custom YAML DSLs to manage AI prompts. While YAML offers a declarative syntax, it has limitations: no functions or logic, limited type safety, and the need for bespoke tooling. GitHub Copilot and VS Code now provide first‑class mechanisms for storing instructions and prompts directly within a repository, enabling version control, testing, and collaboration without building a custom DSL. This guide explains how to migrate from a YAML‑based system to the native file‑based approach used in this repository.

## Core Concepts Mapping

| YAML DSL Concept | Native Equivalent |
| --- | --- |
| **Global/default configuration** (e.g. `defaults:`) | `.github/copilot-instructions.md` – repository‑wide instructions automatically included in every chat request. |
| **Modules or roles** (e.g. `module: security`, `module: performance`) | Separate instruction files in `.github/instructions/` with clear `description` and `applyTo` metadata. You can reference multiple instruction files in a prompt to compose behaviour (LoRA‑style stacking). |
| **Predefined roles or personas** (e.g. `role: planner`, `role: auditor`) | Custom chat modes defined in `.github/chatmodes/*.chatmode.md` files. Chat modes include front‑matter (`description`, `tools`, `model`) and a body with instructions that shape the overall conversation. Select a chat mode from the Chat view to adopt its persona. |
| **Tasks or workflows** (imperative steps) | VS Code tasks defined in `.vscode/tasks.json`, invoking scripts in `scripts/`. Each task can run a prompt file, measure tokens, or chain tasks. |
| **Prompt templates** (with variables) | `.github/prompts/*.prompt.md` files with front‑matter (mode, model, tools) and Markdown body. Variables are referenced using `${variableName}` syntax (workspace, file, selection, user inputs). |
| **Conditions/branches** | Use the `applyTo` glob in instruction files or pass configuration arguments to scripts (e.g. `--config=style`) to switch behaviours. Additional conditional logic can be handled in scripts or tasks rather than in YAML. |
| **Macros/functions** | Break reusable logic into smaller prompt files or instruction files. You can include or reference them via Markdown links. If you need more complex logic (loops, conditions), implement it in a script that orchestrates prompts and tasks. |
| **State management** | Version control (Git) tracks changes to instruction and prompt files. Prompt files can include metadata describing which model or tool set they target. VS Code’s `chat.promptFilesLocations` and `chat.instructionsFilesLocations` settings control where files are discovered. |
| **Security settings** | Security guidance is encapsulated in `security.instructions.md` and enforced via workspace settings (`chat.tools.autoApprove: false`, workspace trust). Secrets and credentials should be provided via environment variables in `.vscode/mcp.json`. |

## Migration Steps

1. **Identify modules and split them into instruction files.** Review your YAML DSL modules (e.g. `security`, `performance`) and create corresponding `.instructions.md` files under `.github/instructions/`. Use front‑matter metadata to describe their purpose and specify `applyTo` patterns. For example:

   ```yaml
   # security.instructions.md
   ---
   description: "Security best practices"
   applyTo: "**"
   ---
   # Security Guidelines
   - Validate all inputs
   - Avoid enabling chat.tools.autoApprove
   - Respect workspace trust boundaries
   ```

2. **Convert prompt templates to Markdown prompt files.** Each YAML prompt (or step) becomes a `.prompt.md` file in `.github/prompts/`. Copy the body of your YAML prompt into a Markdown section. Add front‑matter specifying the mode (`agent` or `chat`), target model, tools, and description. Replace YAML placeholders with `${variableName}` syntax. Reference instruction files via relative links. For example:

   ```yaml
   # Old YAML
   prompt:
     description: "Create a React component"
     instructions:
       - security
       - performance
   ```

   becomes:

   ```markdown
   ---
   mode: 'agent'
   model: GPT-5
   tools: ['githubRepo']
   description: 'Create a React component'
   ---

   # Create a React Component

   Follow our [security instructions](../.github/instructions/security.instructions.md) and [performance instructions](../.github/instructions/performance.instructions.md) when generating code. Ask the user for a component name and use ${fileBasename} to determine where to create the file.
   ```

3. **Move default and global settings into `settings.json`.** YAML DSLs often include defaults like model selection, prompt file paths, or enabling/disabling features. In VS Code, these become workspace settings. For example, enable prompt files with `"chat.promptFiles": true` and point `chat.promptFilesLocations` to your `.github/prompts` folder. Disable auto‑approval with `"chat.tools.autoApprove": false`.

4. **Replace workflows or pipelines with tasks and scripts.** YAML DSLs may define pipelines that run prompts, evaluate outputs, or perform context injection. Recreate these as tasks in `.vscode/tasks.json` that call shell scripts in `scripts/`. Scripts can orchestrate prompts, implement conditional logic, or perform token counting. Tasks can depend on each other for sequencing and A/B testing.

5. **Use environment variables and MCP configuration for external integrations.** If your YAML referenced API keys or external endpoints, move those definitions into `.vscode/mcp.json`, using environment variables to avoid hardcoding secrets.

6. **Leverage Git for versioning and collaboration.** Once converted, instruction and prompt files live alongside your code. Use pull requests, code reviews, and CI checks to manage changes. The declarative Markdown and JSON format makes it easy to diff and merge changes.

## Advantages of Moving Away from YAML

* **Simplicity and readability:** Markdown is easier for developers to read and write than nested YAML. Prompts can include headings, lists, code blocks, and links without complex quoting.
* **Native tooling and validation:** VS Code provides built‑in validation for settings and tasks, and surfaces your instruction and prompt files directly in the Chat view. There is no need to implement a custom parser.
* **Modularity and composition:** Instruction and prompt files can be mixed and matched like building blocks, enabling LoRA‑style stacking and flexible combinations without a bespoke inheritance mechanism.
* **Security:** Dangerous settings like `chat.tools.autoApprove` are explicitly disabled and flagged in instructions, and workspace trust boundaries prevent tasks from running in untrusted folders.
* **Version control and collaboration:** Using standard files means changes are tracked in Git and can be reviewed, tested, and rolled back easily. The YAML DSL’s monolithic nature often makes granular changes harder to manage.

## Conclusion

Migrating from a YAML‑based DSL to the native Copilot + VS Code approach streamlines prompt management while retaining (and often enhancing) functionality. By breaking instructions into modular files, converting prompts to Markdown, using workspace settings for configuration, and orchestrating workflows with tasks and scripts, you gain the benefits of declarative simplicity and compositional power without the overhead of maintaining a custom language. This repository provides examples of how to implement these patterns and serves as a template for your own migration.
