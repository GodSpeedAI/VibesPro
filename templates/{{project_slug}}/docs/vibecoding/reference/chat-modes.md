# Reference: Chat Modes 🗂️

Chat modes carry YAML frontmatter with taxonomy fields: `kind: chatmode`, `domain`, `task`, and optional `phase` (e.g., TDD red/green/refactor, spec lean/wide). Model defaults are documented in `.github/models.yaml`.

## List
- TDD: `tdd.red`, `tdd.green`, `tdd.refactor`
- Debug: `debug.start`, `debug.repro`, `debug.isolate`, `debug.fix`, `debug.refactor`, `debug.regress`
- Spec-driven: `spec.lean` (lean), `spec.wide` (wide)
- Personas/Other: system-architect, senior-frontend-engineer, senior-backend-engineer, ux-ui, ux-ui-designer, qa-test-automation-engineer, product-manager, planning, features-list, non-functional, security-analyst, devops-audit, devops-deployment-engineer, target-platforms, onboarding, usp, problem-statement, target-audience, elevator-pitch

## Details
Each mode declares tools, a target model, and guidance. See `.github/chatmodes/*.chatmode.md`.

## Best practices
- Use Lean by default; escalate only when needed.
- Keep edits small; cite spec IDs.
