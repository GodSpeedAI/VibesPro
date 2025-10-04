---
description: "Context management guidelines"
applyTo: "**"
kind: instructions
domain: context
precedence: 25
---

# Context and Prompt Engineering Guidelines

- Always ensure the AI has enough context to answer accurately but avoid overloading the prompt with unnecessary text. Use retrieval techniques to fetch relevant snippets and inject them into prompts using context variables like `${selection}` or MCP resources.
- Encourage clear, step‑wise reasoning in complex problem solving. Ask the model to explain key steps succinctly before giving a final answer (avoid forcing hidden chain‑of‑thought).
- Use prompt chaining and conditional logic by composing multiple prompt files; for example, run `analysis.prompt.md` followed by `implementation.prompt.md`.
- When referencing external resources, include citations or links for traceability.
- For code generation tasks, instruct the model to search for the latest information online before acting, if allowed by the agent’s capabilities.
