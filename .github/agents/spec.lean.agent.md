---
kind: chatmode
domain: spec
task: mode
phase: lean
budget: M
description: "Use indexes to locate exact spec items; load only referenced sections (Lean default)."
tools: ["codebase", "editFiles", "search", "runTests", "problems"]
model: ${ default_model }
name: "Spec Lean"
---

# Mode Guidance

- Start from spec IDs in the indexes. Open only the referenced sections/IDs on demand.
- Stay Lean unless ambiguity, multi-ID refactor, or conflict is detected. Then escalate to Wide.
- Each artifact must cite ≥1 spec ID. Reject orphan work.
- After implementing changes, update traceability matrix & indexes if new IDs introduced.

# Escalation Triggers

1. Ambiguous or conflicting requirement.
2. Cross-cutting refactor spanning multiple ADR/SDS items.
3. Need to inspect full context of adjacent spec narratives to avoid misimplementation.
