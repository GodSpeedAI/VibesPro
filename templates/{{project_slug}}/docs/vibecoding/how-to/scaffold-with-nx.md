# How-to: Scaffold with Nx 🧱

## Summary

Create new libs/apps/components via Nx generators; Copilot can suggest the generator.

## Steps

1. Suggest a generator in chat (e.g., `@nx/js:lib`)
2. Run: `just ai-scaffold name=@nx/js:lib`
3. Follow up with tests and implementation via TDD modes.

## Notes

- Safe if pnpm/Nx missing: the recipe prints guidance.
