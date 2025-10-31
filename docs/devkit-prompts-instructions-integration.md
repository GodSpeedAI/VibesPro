# Devkit → vibePDK: .github prompts, instructions, chat modes, and settings integration

Refs: DEV-PRD-001, DEV-ADR-001, DEV-SDS-001, DEV-TS-001

## Scope and goals

-   Integrate devkit’s Copilot guardrails and spec-driven workflows into vibePDK without duplicating or weakening existing guidance.
-   Reuse where possible; compose instructions and chat modes rather than copy wholesale.
-   Keep security posture: do not auto‑approve tools; avoid modifying VS Code settings automatically.

## Inventory (summary)

-   vibePDK
    -   `.github/instructions`: context, general, performance, security, style, testing.
    -   `.github/prompts`: create-react-component, performance-analysis, security-review.
    -   `.github/chatmodes`: rich personas (architect, PM, QA, DevOps, security, etc.).
    -   `.vscode/settings.json`: enables instruction/prompt discovery, chat modes, disables autoApprove.
-   devkit
    -   `.github/instructions`: docs, dev-docs, src, security.
    -   `.github/prompts`: spec/traceability workflow (bootstrap, implement/change feature, traceability-matrix, transcript converters, test-hardening, housekeeping).
    -   `.github/spec.wide.chatmode.md`, `spec.lean.chatmode.md` (at `.github/` root).
    -   `.vscode/settings.json`: explicit codeGeneration.instructions list (golden specs + instruction files), commit message guidance, agent mode enabled.

## Decisions (copy vs compose)

1. Instructions

-   Keep vibePDK’s existing instruction set as the base.
-   Import devkit’s docs/dev-docs/src/security instructions as additional modules.
-   Compose via discovery (no explicit list in settings) with precedence/ordering encoded in instruction texts:
    1. ADR > SDS/Technical Specs > PRD (product) > DEV-\* specs > general/style/perf/testing.
-   Avoid editing `.vscode/settings.json` directly (security policy). If explicit ordering is later required, gate it behind a manual settings change in a separate PR.

2. Prompts

-   Bring in devkit prompts that add clear value:
    -   bootstrap-dev-platform, implement-feature, change-feature, traceability-matrix, test-hardening, transcript-to-spec, transcript-to-devspec, spec-housekeeping, generate-ai-docs, load-spec-items.
-   Normalize frontmatter/title and budgets; keep prompts small and token-efficient.

3. Chat modes

-   Add `spec.wide.chatmode.md` and `spec.lean.chatmode.md` into vibePDK’s `.github/chatmodes/`.
-   Keep existing personas; spec-driven modes become “how to work” overlays rather than replacing personas.

4. Settings

-   Do not auto-modify `.vscode/settings.json`.
-   Add a new repository instruction file for commit messages (see below) to convey commit guidance without touching settings.
-   Keep `chat.tools.autoApprove=false`.

## Step-by-step plan

1. [x] Instructions import and de-dup

-   Copy devkit instruction files into `vibePDK/.github/instructions/` with names preserved:
    -   `docs.instructions.md`, `dev-docs.instructions.md`, `src.instructions.md`, `security.instructions.md`.
-   Adjust links to vibePDK’s docs (PRD/ADR/SDS/TS and DEV-\* counterparts). If a doc is missing, add a short “Spec Gaps” note in the instruction file with resolution options.
-   Keep vibePDK’s `security.instructions.md` as canonical; merge any non-overlapping guidance from devkit’s security file and add a pointer to the canonical one.

2. [x] Copilot instructions merge

-   Merge high-value devkit guidance into `vibePDK/.github/copilot-instructions.md`:
    -   Spec-first behavior and traceability references (PRD-xxx, ADR-xxx, SDS-xxx, TS-xxx, DEV-\* IDs).
    -   Optional MCP section already present: align naming and environment variable requirements (no secrets in code).
    -   Cross-link to the new commit message instruction file.

3. [x] New commit message instruction

-   Add `.github/instructions/commit-msg.instructions.md` covering:
    -   Include spec IDs when applicable; summarize change, rationale, risk/mitigations.
    -   Keep <72 char subject, wrap body at ~72‑100 cols; use imperative mood.
    -   Aligns with existing Husky `commit-msg` hook that requires a spec ID.

4. [x] Prompts

-   Copy selected devkit prompts to `vibePDK/.github/prompts/`.
-   Ensure each prompt passes prompt lint and budget plan (token estimate).
-   Add minimal README lines at the top of each prompt explaining when to use.

5. [x] Chat modes

-   Move devkit chat mode files into `vibePDK/.github/chatmodes/`.
-   Verify discovery in chat: titles, constraints, and references to instruction files.
-   Add a short NOTE in each mode about budget discipline and tool safety.

6. Validation and guardrails

-   [x] Pre-commit: prompt lint + plan already wired; ensure new files conform.
-   [ ] CI: spec-guard workflow runs matrix/link/lint/plan/tests; ensure links updated.
-   [ ] Run a smoke test: use `prompt_lifecycle` CLI with “implement-feature.prompt.md”, confirm transcript logging and matrix updates.

## Enhancements (assumed approved)

-   Add `commit-msg.instructions.md` and a brief `docs/commit_message_guidelines.md` for humans; cross-link from README.
-   Add a “Onboarding” chat mode to help new contributors discover spec files, guardrails, and lifecycle commands.
-   Budget tiers: annotate prompts with level (S/M/L) and include a “max tokens” policy line.
-   Optional scheduled housekeeping: run `spec-housekeeping.prompt.md` weekly (documented only; no scheduler committed).

## Risks and mitigations

-   Conflicting security guidance: designate `vibePDK/.github/instructions/security.instructions.md` as canonical; merge others carefully.
-   Settings drift: keep minimal settings; document optional explicit instruction lists if teams need hard ordering.
-   Token bloat: enforce prompt lint/plan budgets; reject large prompts in CI.

## Rollout & rollback

-   Rollout in a single PR with clear commit messages referencing DEV-\* IDs.
-   If needed, rollback by removing imported prompts/chat modes and reverting merged instruction sections; no settings changes means low blast radius.

## Acceptance criteria

-   [x] Instructions: devkit docs/dev-docs/src/security integrated, links valid, no duplication; commit-msg instruction added.
-   [x] Chat modes: spec-driven and spec-driven-lean present and discoverable.
-   [x] Prompts: selected devkit prompts added and pass lint/plan checks.
-   [ ] CI/Guardrails: existing pipelines pass with new content.
-   [ ] Documentation: commit message guide present; README points to prompts/modes.
