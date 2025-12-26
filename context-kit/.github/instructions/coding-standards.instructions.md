---
description: 'Enforce consistent coding standards and best practices for source files.'
applyTo: '**/*.py, **/*.js, **/*.ts, **/*.json, **/*.md'
metadata:
  id: ce.instr.coding-standards
  tags: [validation, testing, security]
  inputs:
    files: [CONTRIBUTING.md]
    concepts: []
    tools: []
  outputs:
    artifacts: []
    files: []
    actions: [constrain-code]
  dependsOn:
    artifacts: [ce.doc.contributing]
    files: [CONTRIBUTING.md]
  related:
    artifacts: [ce.skill.review-and-quality]
    files: []
---

# Coding Standards Instructions

This project spans multiple languages. Adhering to consistent style and best practices helps
reduce defects and improves readability. Key guidelines include:

1. **Python.** Follow [PEP 8](https://peps.python.org/pep-0008/). Use snake_case for variables and
   functions, UpperCamelCase for classes, and UPPER_CASE for constants. Include docstrings
   explaining the purpose of modules, classes and functions. Use type hints where possible.
   Limit line length to 120 characters.

2. **JavaScript and TypeScript.** Use [ESLint](https://eslint.org/) with Prettier integration.
   Prefer `const` and `let` to `var`. Use arrow functions and descriptive variable names.
   Group imports at the top of the file and sort them alphabetically. For TypeScript, add
   appropriate type annotations.

3. **General.** Avoid global mutable state. Break large functions into smaller, testable units.
   Handle errors gracefully and log meaningful messages. Sanitise all inputs to prevent injection
   attacks. Never commit secrets or credentials to the repository.

4. **Testing.** Write unit tests covering core logic and edge cases. Include integration tests
   for components that interact. Strive for high coverage but prioritise meaningful tests over
   metrics. All tests must pass before merge.

5. **Documentation and comments.** Explain why complex logic exists, not what it does—that
   should be clear from the code. Keep comments up to date and avoid dead code. Use Markdown
   files for user‑facing documentation and keep them in sync with the implemented behaviour.

6. **Formatting and linting.** Use automated formatters (e.g. `black` for Python, `prettier` for
   JS/TS) and linters to enforce style. Configure your editor to run these tools on save to
   prevent drift. Run the validation task after making code changes to catch issues early.

Applying these standards will improve the maintainability, security and reliability of the code
base. Always review the guidelines in `CONTRIBUTING.md` for additional language‑specific rules.
