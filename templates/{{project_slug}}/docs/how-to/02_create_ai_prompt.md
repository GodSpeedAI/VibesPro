# How-To: Create a New AI Prompt

This guide explains how to create a new AI prompt for use with an AI assistant like GitHub Copilot. Prompts are a powerful way to encapsulate complex, repetitive, or context-heavy tasks into a single, reusable command.

## Prerequisites

-   A clear idea of the task you want to automate with the prompt.
-   An understanding of how to write effective prompts for large language models.

## Step 1: Create the Prompt File

1.  Navigate to the `.github/prompts/` directory in the project root.
2.  Create a new markdown file. The filename should be descriptive and end with `.prompt.md`. For example, `summarize-code-changes.prompt.md`.

## Step 2: Write the Prompt Content

A prompt file has two main parts: the frontmatter and the body.

1.  **Frontmatter (Optional but Recommended):** Add a YAML frontmatter block at the top of the file to provide a description.

    ```yaml
    ---
    description: "A prompt to summarize the recent code changes in a file."
    ---
    ```

2.  **Body:** Write the body of the prompt. This is the text that will be sent to the AI assistant. You can use placeholders that you intend to replace with specific content when the prompt is run.

    ```markdown
    Please summarize the key changes in the following code. Focus on the "why" behind the changes, not just the "what".
    ```

## Step 3: Test the Prompt (Conceptual)

You can test the prompt by copying its content into your AI chat interface.

The project also includes a script, `run_prompt.sh`, which is designed to be a placeholder for programmatically running these prompts.

```bash
# This is a conceptual test; the script currently only echoes the action.
sh scripts/run_prompt.sh .github/prompts/summarize-code-changes.prompt.md
```

## Step 4: Update the Documentation

To make your new prompt discoverable by other developers, add it to the reference documentation.

1.  Open `docs/reference/03_ai_prompts_and_chatmodes.md`.
2.  Add your new prompt to the list under the "AI Prompts" section, along with a brief description.

You have now successfully created and documented a new AI prompt.
