---
description: 'Front-end TypeScript/React style guidelines'
applyTo: '**/*.ts,**/*.tsx,**/*.js'
kind: instructions
domain: style
precedence: 33
---

# Front-end Style Guidelines (TypeScript/React)

## Scope

- Applies to front-end TypeScript/JavaScript files (including React).
- Back-end code must use Python; see `python.style.instructions.md` for server-side guidance and Python documentation practices.

## Language & framework

- Use TypeScript for all new UI code; prefer React functional components with hooks.
- Enable strict typing; avoid `any`. Use discriminated unions and `as const` when helpful.

## Naming & structure

- PascalCase for components and types; camelCase for variables and functions.
- Keep functions/components small and focused. Extract reusable logic into well-typed helpers.

## Formatting & linting

- Use the repo’s Prettier/ESLint configs if present. Keep indentation and spacing consistent.
- Treat ESLint warnings as errors when feasible; fix at the source rather than disabling rules.

## Documentation

- Prefer TSDoc/JSDoc-style comments on exported functions, components, and complex types.
- Use concise comments to explain “why”, not “what”. Avoid redundant comments.
- For back-end documentation conventions (docstrings, Args/Returns/Raises), see `python.style.instructions.md`.

## Error handling & logging

- Fail fast with clear error messages. Narrow error types where possible.
- Use a centralized logging/util pattern; avoid console noise in production builds.

## Testing

- Write unit tests for critical logic and component behavior where the template provides testing tools.

## Performance

- Prefer memoization (useMemo/useCallback) only when profiling indicates benefit; avoid premature optimization.

## Cross-reference

- For server-side standards (typing, docstrings, testing, paths, logging), read `python.style.instructions.md`.
