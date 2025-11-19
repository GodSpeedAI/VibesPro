---
matrix_ids:
    - AI_ADR-003
    - AI_PRD-002
    - AI_SDS-002
    - AI_TS-005
---

# Maintainer Guide · AI Workflow Alignment

This guide consolidates the authoritative references maintainers need when evolving the AI-assisted workflow in Vibes Pro.
It adapts the integration blueprint from `devkit-prompts-instructions-integration.md` and maps it to the assets imported during
PHASE-001 of the AI implementation plan. Use this document as the starting point before modifying any AI guardrails or
prompts.

## Canonical Specification Stack

Maintainers must review the full specification chain before performing updates. The documents live in `docs/aiassist/`:

- **Architecture Decisions:** [`AI_ADR.md`](./AI_ADR.md)
- **Product Requirements:** [`AI_PRD.md`](./AI_PRD.md)
- **Software Design Specification:** [`AI_SDS.md`](./AI_SDS.md)
- **Technical Specification:** [`AI_TS.md`](./AI_TS.md)
- **Integration Blueprint:** [`vibepdk-ai-integration-plan.md`](./vibepdk-ai-integration-plan.md)
- **Traceability Matrix:** [`AI_traceability.md`](./AI_traceability.md)

Every change must cite the relevant spec IDs in commits, docs, and tests to satisfy the traceability mandate captured in AI_ADR-003.

## Imported `.github` Governance Assets

PHASE-001 copied the unified Copilot guardrails from VibePDK into the template. Generated projects now include:

- [`.github/copilot-instructions.md`](../../templates/{{project_slug}}/.github/copilot-instructions.md) detailing how
  contributors interact with Copilot, chat modes, and prompts.
- Modular instruction files inside [`.github/instructions/`](../../templates/{{project_slug}}/.github/instructions/) that encode
  general guidance, performance tips, security posture, style rules, testing strategy, and commit message policy.
- Prompt catalog housed in [`.github/prompts/`](../../templates/{{project_slug}}/.github/prompts/) containing spec-driven workflows
  (e.g., bootstrap, implement/change feature, traceability matrix updates, AI doc generation).
- Chat modes under [`.github/chatmodes/`](../../templates/{{project_slug}}/.github/chatmodes/) including the spec-wide and spec-lean
  personas layered on top of the existing role-based personas.
- Model defaults defined in [`.github/models.yaml`](../../templates/{{project_slug}}/.github/models.yaml) aligning Copilot tooling with
  our security and token budget policies.

Do not edit `.vscode/settings.json` automatically. Document any desired changes in this guide and land them through a dedicated
PR after security review, as required by AI_SDS-002 and AI_TS-005.

## Maintenance Workflow

1. **Plan via specs:** Capture updates in the PRD/SDS/TS before touching code or docs. Update `AI_traceability.md` accordingly.
2. **Validate assets locally:**
    - `pnpm prompt:lint` to enforce prompt budgets and frontmatter requirements.
    - `pnpm prompt:plan` for lifecycle previews.
    - `pnpm spec:matrix` to regenerate traceability data.
    - `pnpm lint:md` and `pnpm docs:links` to ensure documentation stays healthy.
3. **Regress generated projects:** Run `pnpm test:integration` or the targeted smoke tests in `tests/integration/` to confirm the
   Copier template emits the synced assets.
4. **Record outcomes:** Update this guide and the integration plan with lessons learned or deviations. Reference the relevant
   spec IDs and include risk/mitigation notes for the next iteration.

## Security & Compliance Reminders

- Never enable `chat.tools.autoApprove`; uphold the guardrails defined in `.github/instructions/security.instructions.md`.
- Treat all prompts and instructions as code: review token budgets, link to specs, and run prompt lint before merging.
- When adding new instructions, include precedence metadata in the file header and cross-link the owning spec documents.

## Review Checklist

Use the following checklist (derived from AI_TS-005) before approving AI-workflow PRs:

- [ ] Specs updated with traceable IDs (AI_ADR, AI_PRD, AI_SDS, AI_TS) and matrix regenerated.
- [ ] Maintainer guide reflects any new or removed `.github` assets.
- [ ] Prompt lint/plan, spec matrix, and docs lint commands pass locally and in CI.
- [ ] Security posture validated: no unauthorized settings changes or dependency additions without ADR coverage.
- [ ] Generated project smoke tests confirm assets appear under `.github/`.

Document any exceptions in `AI_traceability.md` so we can revisit the deviation during the next governance review cycle.
