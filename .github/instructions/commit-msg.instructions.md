---
description: 'Commit message guidance with traceability'
applyTo: '**'
kind: instructions
domain: docs
precedence: 15
---

# Commit Message Guidelines

Write clear, scannable messages that explain **what changed and why**. Follow conventional commit format: type(scope): description

Structure

- Use imperative mood ("Add", not "Added").
- Keep the subject line ≤ 50 characters.
- Use bullet points for multiple changes in the body.
- If a change is breaking, add a clear "⚠️BREAKING CHANGE:" section and call it out in the subject or body.

Content focus

- Explain business impact and rationale, not implementation minutiae.
- Link to issues/tickets or spec IDs when relevant (e.g., PRD-xxx, ADR-xxx, SDS-xxx, TS-xxx, DEV-\*).
- Call out Risks/Mitigations (security, perf, UX) and any testing or rollout steps.
- Mention updated or added tests and docs.

Tone & visuals

- Use meaningful emojis sparingly (✨ for features, 🐛 for bugfixes, ♻️ for refactors, ⚠️ for risks).
- Include diagrams (e.g., mermaid) only when they clarify complex architectural changes.

Traceability & examples

- Include at least one spec ID when applicable to align with commit-msg hooks and review traceability.
- Examples:
    - ✨feat(auth): add login rate limiter (PRD-042, DEV-123)
        - Adds rate limiter + unit tests; updates docs/auth.md
        - ⚠️Risk: potential login latency spike; Mitigation: gradual rollout with monitoring
    - 🐛fix(api): handle null payloads (DEV-456)
        - Prevents 500s on malformed requests; adds regression tests

Formatting tips

- Wrap body at ~72–100 cols.
- Keep the subject concise and specific.
- Use the body for the why, impact, and test plan.

Note: This aligns with our existing commit-msg hook that expects a spec ID in the commit message.
