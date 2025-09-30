# DevKit ↔ VibePDK Integration Plan

Date: 2025-08-25

Links
- VibePDK DX specs: [DEV PRD](./dev_prd.md), [DEV SDS](./dev_sds.md), [DEV ADR](./dev_adr.md), [DEV Technical Specs](./dev_technical-specifications.md)
- DevKit product specs (requires cloning the DevKit docs repo alongside this project):
  - PRD: `../../devkit/docs/PRD.md`
  - SDS: `../../devkit/docs/SDS.md`
  - ADR: `../../devkit/docs/ADR.md`
  - Spec Index: `../../devkit/docs/spec_index.md`

---

## 1. Objectives and Success Criteria

Goals (traceable)
- Unify spec-driven, traceability-first workflow in VibePDK using DevKit’s mechanisms (PRD-001, PRD-002; DEV-PRD-007, DEV-PRD-001).
- Enforce lean context + prompt lifecycle with native VS Code/Copilot and tasks (PRD-005, PRD-014; DEV-PRD-001, DEV-PRD-007).
- Provide hooks/CI to require spec IDs and generate PR traceability reports (PRD-003, PRD-007, PRD-008; DEV-PRD-005, DEV-PRD-007, DEV-PRD-010).
- Bridge CALM/Wasp/Nx semantics with reversible generators and validations (PRD-008; DEV-PRD-008).

Success criteria
- ≥95% commits include at least one valid spec ID and pass local/CI checks (PRD-003/007).
- Prompt changes linted + have plan previews and token metrics before merge (PRD-014; DEV-PRD-007/010).
- CALM/Nx generator determinism verified by snapshot tests (PRD-008; DEV-PRD-008).
- Documentation cross-links and Spec Indexes resolve with 0 link check errors (SDS-010, SDS-014; DEV-SPEC-003).

Out-of-scope (initial)
- Multi-repo GitHub App automation (ADR-013 planned in DevKit PRD/SDS).
- Live tool health polling (ADR-014 planned).

---

## 2. Current State Summary (Analysis)

VibePDK highlights
- Native prompt system with modular instructions under `.github/instructions` (DEV-PRD-001/002/007; DEV-SDS-001…009).
- Tasks for running prompts and measuring tokens; scripts `run_prompt.sh`, `measure_tokens.sh` (DEV-SPEC-004/005).
- Cookiecutter/Nx-style template skeleton with CALM architecture folder and domain spec; unit tests harness (Node-only, no deps).

DevKit highlights
- Product-facing PRD/SDS/ADR defining traceability, hooks, CI reporting, Lean/Wide context, MCP tool descriptors, environment audit, prompt lint (PRD-001…015; SDS-001…020).
- Emphasis on indexes (spec_index.md, dev_spec_index.md), matrix generation, and a PR comment bot (SDS-003/010/012).

Opportunities for synergy
- Adopt DevKit’s spec/index/matrix enforcement and CI posture into VibePDK.
- Reuse VibePDK’s native prompt/tasks foundation to run DevKit’s lifecycle (lint → plan → run → evaluate) with zero new heavy deps.
- Integrate CALM/Nx bridging validations into VibePDK scaffold generators and tests.

Constraints
- Security posture: avoid secrets and disallow auto-approve (DEV-PRD-005; Security instructions).
- Token/latency budgets should be enforced but remain configurable (PRD-017; DEV-PRD-010).

---

## 3. Integration Architecture (Target)

Layers (maps to DevKit SDS-001)
1) Spec Layer
   - VibePDK adds product and developer spec indexes and a traceability matrix doc.
   - ID regex: Product PRD/ADR/SDS/TS; Developer DEV-PRD/ADR/SDS/TS (SDS-002).
2) Enforcement Layer
   - commit-msg + pre-commit hooks validate spec IDs and matrix coverage locally; CI mirrors checks (SDS-005/010/012).
3) Automation Layer
   - Node utils under `tools/*` for spec parsing, matrix generation, prompt lint/plan, budget checks (SDS-003/006/016).
4) Interaction Layer
   - Existing prompts + tasks orchestrate lint → plan → run with metrics (SDS-004/006/009; DEV-SDS-004/006/009).
5) CALM/Nx Bridge
   - Controls runner validates architecture semantics pre-generation; snapshot tests assert determinism (SDS-007).

---

## 4. Workstreams and Deliverables

W1 — Specs, Indexes, Matrix (PRD-001/002; SDS-002/003)
- Add docs: `docs/spec_index.md` (product), `docs/dev_spec_index.md` (developer), `docs/traceability_matrix.md` (generated/maintained).
- Implement parser + matrix generator in `tools/spec/` with unit tests.

W2 — Hooks & CI (PRD-003/004/007/008; SDS-005/010/012)
- Add Husky hooks: commit-msg (regex for IDs), pre-commit (index + matrix sync; prompt lint).
- Add CI workflow to run: spec validation, prompt lint, docs link check, budget checks, and PR comment update.

W3 — Prompt Lifecycle & Budgets (PRD-014/017; DEV-PRD-007/010; DEV-SDS-006/009)
- Add linter + plan preview and token budgets; integrate with `scripts/run_prompt.sh` and `scripts/measure_tokens.sh` logs.
- Append structured metrics to `transcript.md` and provide summary.

W4 — MCP Tool Descriptors (PRD-011; SDS-007)
- Optional: `mcp/*.tool.md` + `mcp/tool_index.md` + patcher that adds a section to `.github/copilot-instructions.md`.

W5 — Environment Audit (PRD-012/015; SDS-008)
- Script `scripts/audit_env.py` or Node equivalent; outputs `docs/environment_report.md` and a future-state readiness section.

W6 — CALM/Wasp/Nx Bridge (PRD-008; DEV-PRD-008; SDS-007)
- `tools/calm/controls_runner.js` + generator determinism snapshot tests; fail fast on violations.

W7 — Docs & DX (DEV-SPEC-003; Docs Guardrails)
- Cross-links, anchors, Traceability section updates; markdownlint + linkcheck tasks.

---

## 5. Phased Plan and Milestones

Phase 1 — Foundations (1–2 days)
1. W1: Add spec indexes + matrix generator with unit tests.
2. W2: Commit-msg + pre-commit hooks (local) and package.json wiring.
3. W3: Prompt linter + plan preview skeleton; budgets config.

Exit criteria: Indexes present; hooks block missing IDs; linter runs; budgets warn at ≥80% and fail at 100%.

Phase 2 — CI & Lifecycle (1–2 days)
1. W2: CI pipeline with spec/prompt/docs checks and PR comment.
2. W3: Lifecycle orchestration (lint → plan → run) with metrics appended to `transcript.md`.

Exit criteria: CI fails on missing IDs or broken prompts; transcript captures metrics; PR comment shows gaps.

Phase 3 — CALM/Nx + Extras (1–2 days)
1. W6: CALM controls + generator determinism tests.
2. W5: Environment audit; future-state plan stub.
3. W4: MCP descriptors (optional, behind flag).

Exit criteria: Controls enforce policy; generator outputs deterministic; environment report generated.

---

## 6. Concrete Changes (Planned Paths)

- docs/
  - spec_index.md (product IDs)
  - dev_spec_index.md (developer IDs)
  - traceability_matrix.md (generated)
  - dev_devkit-integration-plan.md (this document)
- tools/spec/
  - ids.js (regex + extraction) — Implements: PRD-001/002; SDS-002
  - matrix.js (generate/update matrix) — Implements: PRD-002/007; SDS-003/010
- tools/prompt/
  - lint.js, plan_preview.js, budgets.js — Implements: PRD-014/017; DEV-PRD-007/010; DEV-SDS-006/009
- tools/metrics/
  - logger.js — Implements: DEV-PRD-010
- tools/calm/
  - controls_runner.js — Implements: PRD-008; DEV-PRD-008; SDS-007
- scripts/
  - audit_env.py — Implements: PRD-012/015; SDS-008 (or Node variant)
- .husky/
  - commit-msg, pre-commit — Implements: PRD-003/004/007; SDS-005
- .github/workflows/
  - spec-guard.yml — Implements: PRD-007/008; SDS-010/012

Note: Keep security posture — no secrets in repo; do not enable auto-approve.

---

## 7. Risks and Mitigations

- False positives in ID detection
  - Mitigation: Centralize regex; allow small allowlist; clear remediation messages.
- Token budget instability
  - Mitigation: Use word/char as proxy initially; add accurate tokenizer behind optional flag.
- Hook friction for non-spec changes (e.g., README tweaks)
  - Mitigation: Permit DEV-TS IDs for infra/docs tasks; document `--no-verify` with caution note (SDS-005).
- Cross-repo links fragile
  - Mitigation: Prefer relative paths; add link-check in CI; keep DevKit docs colocated or mirrored if needed.

---

## 8. Quality Gates and Validation

Local
- Build/typecheck Node tools (ts/tsx runner already available).
- Unit tests for spec parsing, matrix, budgets; integration tests for scripts.
- Markdownlint + link-check on docs.

CI (blocking unless noted)
- Spec guard: FAIL on missing/unknown IDs or matrix omissions (PRD-007) — blocking.
- Prompt lint: FAIL on missing frontmatter or budget exceed (PRD-014/017) — blocking.
- Docs link-check: FAIL on broken links — blocking.
- PR comment bot: post summary; non-blocking if prior steps passed (SDS-010) — informational.

---

## 9. Rollout Plan

Step 1: Introduce indexes + hooks (no behavior change to runtime code).
Step 2: Land CI workflow and make checks advisory for 1–2 PRs, then enforce.
Step 3: Integrate lifecycle and budgets; educate via README updates.
Step 4: Add CALM controls and determinism tests; iterate on policies.
Step 5: Optional MCP descriptors and environment audit.

Feature flags
- `SPEC_GUARD_STRICT=true` in CI to treat warnings as errors.
- `PROMPT_BUDGET_HARD_FAIL=true` to enforce budgets locally.

---

## 10. Traceability Matrix (Plan → Spec IDs)

| Plan Item | Product IDs | Dev/DX IDs |
| --- | --- | --- |
| W1 Indexes + Matrix | PRD-001, PRD-002, PRD-007 | DEV-PRD-007; DEV-SPEC-003/009 |
| W2 Hooks + CI | PRD-003, PRD-004, PRD-007, PRD-008 | DEV-PRD-005/007/010; DEV-SDS-005 |
| W3 Prompt lifecycle + budgets | PRD-014, PRD-017 | DEV-PRD-001/002/006/007/010 |
| W4 MCP tools (optional) | PRD-011 | DEV-SDS-001/Docs |
| W5 Env audit | PRD-012, PRD-015 | DEV-SPEC-001 |
| W6 CALM/Nx bridge | PRD-008 | DEV-PRD-008 |
| W7 Docs & DX | PRD-007 | DEV-SPEC-003 |

Acceptance checks
- Spec Guard: missing IDs → fail; orphan specs → fail; matrix gaps → fail.
- Prompt Lint: missing title/frontmatter → fail; budget exceed → fail.
- Determinism: generator snapshot diff non-empty → fail.
- Docs: link-check → fail on broken.

---

## 11. Next Actions (Short List)

1) Add `docs/spec_index.md` and `docs/dev_spec_index.md` with initial entries linking existing docs (PRD-001; DEV-SPEC-003).
2) Implement `tools/spec/ids.js` + `matrix.js` with unit tests and create `docs/traceability_matrix.md` (PRD-002/007).
3) Add Husky hooks: commit-msg + pre-commit to enforce IDs and run matrix generation (PRD-003/004; SDS-005).
4) Implement `tools/prompt/lint.js`, `plan_preview.js`, and `budgets.js`; wire into tasks/scripts (PRD-014/017; DEV-PRD-007/010).
5) Draft CI workflow `spec-guard.yml` mirroring local checks; start advisory, then enforce (PRD-007/008).
6) Add CALM controls runner + generator determinism tests (PRD-008; DEV-PRD-008).

---

Notes
- Keep security posture from `.github/instructions/security.instructions.md` and DevKit Security guidance. No secrets in code. Do not enable chat.tools.autoApprove.
- Prefer composition over inheritance in tools; small, testable modules with Node built-ins only where possible.
