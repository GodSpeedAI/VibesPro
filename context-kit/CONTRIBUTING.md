# Contributing Guide

Thank you for considering contributing to this project. Following these guidelines helps maintain quality and consistency across the repository.

## Development Workflow

1. Before starting work, ensure your local copy is up to date and run the `Context Kit: Validate` VS Code task to confirm the kit is consistent.
2. Create a descriptive branch name for your work.
3. Use the `artifact-registry` skill to scaffold new artifacts (agents, prompts, instructions, skills or toolsets) and automatically register them in `ce.manifest.jsonc`.
4. Write code and documents following the coding standards and instructions. Keep descriptions clear and concise.
5. Run the validation task again before committing to ensure no manifest or schema violations.
6. Open a pull request with a clear description of the changes and the problem they solve.

## Naming Conventions

- File names must be lowercase with hyphens separating words.
- IDs in the manifest must follow the `ce.<kind>.<slug>` pattern.
- Skill names must match their folder name.

## Commit Messages

Write commit messages in the imperative mood and include a summary and rationale. For example:

Add new testing strategy skill

    Describe what was added, why, and any follow‑on tasks.

## Code Style

- Use consistent indentation (two spaces) and Unix line endings.
- Include frontmatter with required fields in markdown files.
- Follow language‑specific style guides and best practices.

## Pull Request Checklist

- [ ] Validate the kit using the `Context Kit: Validate` task.
- [ ] Ensure all new files are registered in `ce.manifest.jsonc`.
- [ ] Provide documentation or comments as needed.
- [ ] Verify that tests pass and that new functionality is covered.

By adhering to these guidelines, you help ensure that the project remains maintainable and high‑quality.
