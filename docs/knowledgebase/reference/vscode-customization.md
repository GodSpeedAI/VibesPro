#### Custom Instructions (Official Documentation)

-   Custom instructions let you guide Copilot Chat so responses match your coding practices, project requirements, and development standards .
-   They are generally presented as a way to get better AI results by setting persistent guidance for the assistant.

```yaml
capability_extraction:
    feature_name: "Custom Instructions"
    configuration_method: "UI Settings" # create custom instructions in VS Code [[5]]
    scope: "Project" # align responses to project requirements [[5]]
    use_cases:
        - "Align AI responses to team coding practices, project requirements, and standards [[5]]"
        - "Improve response quality with persistent, high-level guidance [[2]]"
    limitations:
        - "Not specified in the referenced snippet"
    best_practices:
        - "Use clear, upfront guidance to improve AI results [[2]]"
        - "Pick the customization method that fits your scenario [[6]]"
    examples:
        - |
            "When suggesting code, follow our TypeScript strict mode and prefer async/await over callbacks."
        - |
            "Adhere to our lint rules and use our existing utility functions when possible."
```

#### Implementation Examples (Blog, 2025-03-26)

-   The GA announcement emphasizes using custom instructions to get better results from Copilot in VS Code.

```yaml
capability_extraction:
    feature_name: "Custom Instructions"
    configuration_method: "UI Settings" # custom instructions are configured in VS Code [[2]]
    scope: "Project" # intended to shape outcomes for the project you’re working on [[2]]
    use_cases:
        - "Set durable guidance so chat outputs better match your development workflow [[2]]"
    limitations:
        - "Not specified in the referenced snippet"
    best_practices:
        - "Keep instructions high‑impact and oriented toward your desired outcomes [[2]]"
    examples:
        - |
            "Use our monorepo conventions: workspace package scripts over npm directly, and reference internal packages by alias."
```

#### MCP Integration (Model Context Protocol)

-   MCP and tools let you connect external services and specialized tools, extending chat beyond code to interact with databases, APIs, and other development tools.
-   You can install MCP servers or tools from Marketplace extensions to enhance capabilities (for example, pull from a database or connect to external APIs) .
-   Chat agent mode can invoke built‑in tools, MCP tools, or tools from extensions during an autonomous coding session .
-   Security note: MCP servers can run arbitrary code; only add servers from trusted sources and review the publisher and server configuration before starting .

```yaml
capability_extraction:
    feature_name: "MCP"
    configuration_method: "UI Settings" # install MCP servers/tools from Marketplace UI [[4]]
    scope: "Global" # Marketplace-installed tools are available across VS Code [[4]]
    use_cases:
        - "Extend chat to interact with databases, APIs, and dev tools via MCP [[3]][[6]]"
        - "Enhance autonomous agent sessions with MCP tools and extension tools [[10]]"
        - "Pull information from external systems directly into chat [[4]]"
    limitations:
        - "MCP servers can run arbitrary code; add only trusted servers and review configs [[1]]"
    best_practices:
        - "Prefer trusted Marketplace extensions and verify publishers [[4]][[1]]"
        - "Review server configuration before starting an MCP server [[1]]"
        - "Choose the customization method (MCP vs. other methods) that fits your scenario [[6]]"
    examples:
        - "Install an MCP server extension to query a database from chat [[4]]"
        - "Use an MCP tool to call an external API during an agent session [[10]][[6]]"
```

#### Prompt Engineering (Best Practices)

-   Custom instructions are highlighted as a strategy to get better AI results in VS Code.
-   They help ensure responses match your coding practices, project requirements, and development standards.
-   Different customization methods (e.g., instructions vs. tools) may fit different scenarios .

```yaml
capability_extraction:
    feature_name: "Custom Instructions"
    configuration_method: "UI Settings" # set instructions within VS Code [[2]][[5]]
    scope: "Project" # align to project requirements and standards [[5]]
    use_cases:
        - "Guide the assistant toward your coding practices and standards [[5]]"
        - "Improve response relevance and quality with persistent guidance [[2]]"
    limitations:
        - "Not specified in the referenced snippets"
    best_practices:
        - "Make instructions project‑aware (requirements, standards, practices) [[5]]"
        - "Select the customization method appropriate to the task (instructions vs. MCP/tools) [[6]]"
    examples:
        - |
            "Testing: prefer Jest with ts-jest; include table-driven tests and edge cases."
        - |
            "Docs: generate README sections with concise code examples and installation steps."
```
