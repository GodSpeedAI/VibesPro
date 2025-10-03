---
kind: prompt
domain: ui
task: create-component
thread: ui-react-create-component
matrix_ids: []
budget: S
mode: "agent"
model: GPT-5 mini
tools: ["githubRepo", "codebase"]
description: "Generate a new React component"
---

# Create a React Component

You're tasked with generating a new React component in our codebase. Follow these guidelines:

- Use TypeScript and functional components.
- Apply our style guidelines [../instructions/style.instructions.md].
- Adhere to our general and performance guidelines [../instructions/general.instructions.md] and [../instructions/performance.instructions.md].
- Ask the user for the component name and a list of props if they are not provided.
- Use our design system components where appropriate.

After implementing the component, provide a brief explanation of your choices and note any assumptions made.
