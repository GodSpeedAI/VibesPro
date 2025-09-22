# Tutorial: Getting Started with the AI-Assisted Workflow

This tutorial will guide you through your first task in this repository, demonstrating how to use the integrated AI assistant and automated workflows to develop a new feature while adhering to project standards.

**Goal:** Add a new utility function to the project.

---

## Step 1: Project Setup

Before you begin, ensure you have followed the setup instructions in the main `README.md` of the project to install necessary tools like `just`, `uv`, `node`, and `pnpm`.

## Step 2: Understand the Task

Our task is to add a new function that calculates the factorial of a number. This is a simple task, perfect for demonstrating the workflow.

Let's assume this task is part of a larger feature defined in a specification document, `DEV-SPEC-010`.

## Step 3: Use the AI Assistant to Generate Code

Instead of writing the function from scratch, let's ask our AI assistant to do it.

1.  Open your IDE's AI chat interface (e.g., GitHub Copilot Chat).
2.  Use a prompt that gives the AI context. For example:

    > "In our project, I need to add a new Python utility function that calculates the factorial of a number. Please create this function in a new file under `tools/utils/math.py`. Ensure it has type hints, a docstring, and a simple unit test."

3.  **Observe the result.** The AI should generate code that matches the project's coding style (e.g., using type hints) because it has been trained on the guidelines in `.github/instructions/`.

## Step 4: Add a Dependency (If Necessary)

Imagine our new function needed a library like `numpy`. The correct way to add this dependency is:

1.  Add `numpy` to the `techstack.yaml` file under the appropriate category.
2.  Run `just sync-techstack` to have the system process this change.

For more details, see the "How-To: Add a New Technology" guide. For our factorial function, no new dependency is needed.

## Step 5: Run the Tests

The project is configured to run tests using `nx`. Let's assume the AI generated a test file at `tests/unit/test_math.py`.

You can run all Node.js/TypeScript and Python tests via the `pnpm` script, which will use `nx` under the hood.

```bash
# This command is configured in package.json to run all test suites
pnpm test
```

Ensure all tests pass, including the one for your new function.

## Step 6: Commit Your Changes with a Spec-Driven Message

This project requires commit messages to be linked to a specification.

1.  Stage your new files (`tools/utils/math.py`, `tests/unit/test_math.py`).
2.  Write a commit message that follows the project's format:

    ```
    feat(utils): add factorial function

    Adds a new utility function to calculate the factorial of a number.
    This function is part of the feature work for mathematical operations.

    - Includes a unit test for the function.

    Refs: DEV-SPEC-010
    ```

Congratulations! you have now completed your first task using the AI-assisted workflow, correctly following project conventions for code style, testing, and commit messages.
