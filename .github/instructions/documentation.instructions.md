---
description: 'Documentation and annotations for code, specs, and developer docs'
applyTo: '**'
kind: instructions
domain: documentation
precedence: 36
---

# Documentation & Traceability

- **Source of truth:** Specs live in `docs/specs/` (PRD/SDS/TS/ADR). Link updates back to spec IDs; update `docs/traceability_matrix.md` when behavior changes.
- **Commit/tagging:** Use `type(scope): message [SPEC-ID]`. Note new assumptions or gaps inline with brief rationale.
- **Code-facing docs:** Keep READMEs and inline comments focused on intent and invariants, not restating code. Prefer short usage blocks and edge-case notes.
- **API/DTO updates:** When changing IO surfaces, document request/response shapes and validation in the relevant README or module docstring; sync OpenAPI/clients if present.
- **Templates:** When adjusting `templates/{{project_slug}}/**`, note variable/answer changes and run `just test-generation`; document new knobs in template README.
- **Cross-links:** In doc files, reference exact files/targets (e.g., `tests/unit/foo.test.js`, `apps/web/src/...`) to make navigation trivial.

See also: `docs.instructions.md` (format rules inside docs/), `architecture.instructions.md` (placement), `testing.instructions.md` (test coverage notes), `security.instructions.md` (assumptions), `refactoring.instructions.md` (when cleaning docs during refactors).
