---
description: 'Architecture guardrails (hexagonal, generator-first, typed boundaries)'
applyTo: '**'
kind: instructions
domain: architecture
precedence: 18
---

# Architecture & System Design

- **Hexagonal flow:** Dependencies only point inward (`infrastructure → application → domain`). Domain stays pure (no DB/HTTP/FS). Use ports/adapters for all I/O.
- **Generator-first:** Scaffold with Nx generators before coding. See `generators-first.instructions.md` and `nx.instructions.md` for tooling flow.
- **Type contracts:** TypeScript `strict` and Python `mypy --strict` are required. Sync schemas: `just gen-types-ts` (Supabase) → `just gen-types-py`; keep DTOs/OpenAPI in lockstep.
- **Specs > implementation:** Anchor decisions to PRD/SDS/TS/ADR. Record changes using traceability matrix and ADRs for cross-cutting decisions.
- **Environment parity:** Rely on Devbox + mise + SOPS + Just for reproducible stacks. Avoid bespoke setup steps.
- **Template + temporal knowledge:** For template changes, update `templates/{{project_slug}}/**` and validate via `just test-generation`. Check `temporal_db/README.md` when making architectural calls to avoid reversals.

See also: `security.instructions.md` (data boundaries), `testing.instructions.md` (TDD gates), `performance.instructions.md` (profiling), `documentation.instructions.md` (traceability notes).
