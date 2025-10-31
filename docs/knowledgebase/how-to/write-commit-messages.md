# Commit Message Guidelines (Human-Friendly)

See also: `.github/instructions/commit-msg.instructions.md` (AI/copilot guardrails).

-   Subject line: ≤ 72 chars, imperative mood (e.g., "Add", "Fix", "Refactor").
-   Body: wrap ~72–100 cols; explain the what and why, not just how.
-   Traceability: include spec IDs when applicable (PRD-xxx, ADR-xxx, SDS-xxx, TS-xxx, DEV-\*).
-   Risks/Mitigations: note security/perf/UX risks and how you mitigated them.
-   Tests/Docs: mention updates to tests and documentation.

Example

-   feat(domain): add user profile service (PRD-023, ADR-008)
    -   Adds service + integration tests; documents API in docs/dev_technical-specifications.md
    -   Risk: cache stampede on warm start; Mitigation: request coalescing

This aligns with the commit-msg hook that expects a spec ID in the commit message.
