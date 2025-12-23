---
description: 'Debugging workflow for reproducing, isolating, and fixing issues'
applyTo: '**'
kind: instructions
domain: debugging
precedence: 38
---

# Debugging Workflow

- **Reproduce fast:** Capture exact command, env, inputs, and logs. Create a temp fixture under `.tmp-debug/` when needed.
- **Narrow the blast radius:** Use binary search (git bisect, feature flags) or minimal repros to isolate failing modules. Avoid touching unaffected areas.
- **Instrument intentionally:** Add minimal logging/metrics around boundaries (I/O, orchestration) and strip or gate them before merge.
- **Prefer deterministic checks:** Add failing tests first (unit/integration) mirroring the repro; then fix. Keep the test even if the bug seems "obvious."
- **Guardrails:** Do not bypass security policies for speed. When debugging perf, coordinate with `performance.instructions.md`; for flaky tests, stabilize fixtures and timeouts.
- **Handoffs:** Document what you tried, remaining hypotheses, and commands to rerun; link to related specs/ADRs.

See also: `testing.instructions.md` (write guarding tests), `performance.instructions.md` (profiling), `security.instructions.md` (data handling), `documentation.instructions.md` (record learnings).
