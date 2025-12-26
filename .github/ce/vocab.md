# Vocabulary

This file defines the controlled vocabulary for artifact kinds and tags used in `ce.manifest.jsonc`.

## Kinds

- **doc**: A markdown document that acts as a source of truth.
- **agent**: A custom agent definition file used to orchestrate tasks.
- **prompt**: A deterministic entry point for specific tasks.
- **instruction**: A behavioural overlay applied to file patterns.
- **skill**: A portable capability package.
- **toolset**: A named group of tools.
- **task**: A VS Code task used to run validations or other actions.

## Tags

| Tag           | Description                                    |
| ------------- | ---------------------------------------------- |
| routing       | Enables semantic routing and context selection |
| planning      | Used for tasks that turn intent into plans     |
| execution     | Applies changes or runs code                   |
| review        | Evaluates outputs against constraints          |
| product       | Relates to product scope and goals             |
| architecture  | Relates to system design and constraints       |
| contributing  | Relates to process and collaboration           |
| validation    | Drives quality and correctness checks          |
| security      | Deals with secrets, auth and threat modelling  |
| compliance    | Manages legal and policy constraints           |
| reliability   | Involves resilience and observability          |
| performance   | Optimises speed and resource usage             |
| testing       | Concerned with unit, integration and e2e tests |
| context-min   | Encourages progressive disclosure              |
| context-debug | Supports debugging of context routing          |
| glossary      | Defines shared vocabulary                      |
| tools         | Metadata about tool usage                      |
| mcp           | Metadata about MCP servers and toolsets        |
| tasks         | Metadata about VS Code tasks                   |
