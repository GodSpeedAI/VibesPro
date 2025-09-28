---
kind: chatmode
domain: onboarding
task: Provide a high-level overview and first steps for new contributors
budget: low
model: ${ default_model }
name: "Onboarding Overview"
description: |
	Explain the project layout, how to run tests, and useful pointers for first contributions.
tools: ["codebase", "search"]
---

## Use this chatmode to welcome and orient new contributors.

kind: chatmode
domain: onboarding
task: overview
budget: S
name: "Project Onboarding"
description: "Guide new contributors to specs, guardrails, prompts, and lifecycle commands."
tools: ['codebase', 'search']

---

# Welcome to vibePDK

This mode helps you ramp up quickly by surfacing:

- Where specs live (`docs/dev_prd.md`, `docs/dev_adr.md`, `docs/dev_sds.md`, `docs/dev_technical-specifications.md`, indexes, and traceability).
- Guardrails under `.github/instructions/` (security, style, performance, testing, docs).
- Prompt library under `.github/prompts/` and how to run them.
- Lifecycle commands to lint/plan/run prompts and log transcripts.

## Quick Links

- Specs Indexes: `docs/spec_index.md`, `docs/dev_spec_index.md`
- Traceability Matrix: `docs/traceability_matrix.md`
- Security Canonical: `.github/instructions/security.instructions.md`
- Commit Message Guidance: `.github/instructions/commit-msg.instructions.md` and `docs/commit_message_guidelines.md`

## Try These

1. Explore prompts: open `.github/prompts/spec.implement.prompt.md`.
2. Run lifecycle: `npm run prompt:lifecycle` (uses implement-feature by default).
3. Check budgets: `npm run prompt:plan`.

## Notes

- Tool auto-approval is disabled; keep runs deliberate.
- Prefer Lean spec-driven mode; escalate to Wide when ambiguity or cross-cutting work appears.
