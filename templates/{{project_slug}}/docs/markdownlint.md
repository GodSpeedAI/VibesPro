## MarkdownLint

This project uses `markdownlint` to enforce Markdown style and catch common issues in `.md` files.

Files:

- `.markdownlint.json` — project rules and overrides.

Local usage

1. Install dev dependencies:

   npm ci

2. Run the linter across the repository:

   npm run lint:md

The script runs `markdownlint` against all `**/*.md` files using the repository config.

CI

GitHub Actions workflow `.github/workflows/markdownlint.yml` runs on pushes and pull requests to `main`. It uses `npx markdownlint` to run the same checks used locally.

Best practices

- Run `npm run lint:md` before opening a PR.
- If a rule needs to be relaxed for a specific file, consider adding an inline ignore comment or updating `.markdownlint.json` with a justified exception.
