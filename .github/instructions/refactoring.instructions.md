---
description: 'Refactoring workflow to reduce debt while preserving behavior'
applyTo: '**'
kind: instructions
domain: refactoring
precedence: 39
---

# Refactoring Workflow

- **Stabilize first:** Ensure a baseline green suite (or add covering tests) before restructuring. Freeze behavior before optimizing.
- **Small, reversible steps:** Make one mechanical change at a time (rename, extract function, reorder deps). Keep PR scope narrow and commit messages explicit.
- **Honor architecture:** Maintain hexagonal boundaries and Nx project isolation; move logic toward domain and keep I/O behind ports.
- **Simplify and delete:** Prefer removing code/flags over adding indirection. Inline trivial abstractions; remove unused generators/tasks.
- **Performance-aware:** If the refactor aims at speed, add a micro-benchmark or targeted perf test; otherwise, avoid premature optimization.
- **Document touchpoints:** Update README/traceability where behavior or public interfaces shift. Note follow-ups explicitly if deferred.

See also: `architecture.instructions.md` (boundaries), `testing.instructions.md` (safety nets), `documentation.instructions.md` (record changes), `performance.instructions.md` (perf-specific refactors).
