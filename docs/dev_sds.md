# Developer Software Design Specification (DX-first)

Audience: Developers as end-users
Scope: Design for discoverability, usability, and maintainability

---

## DEV-SDS-001 — Repository layout for discoverability (addresses DEV-PRD-001, DEV-PRD-007)
- Principle: Put the obvious things in obvious places.
- Design:
  - `.github/copilot-instructions.md` — repo-wide guidance.
  - `.github/instructions/*.instructions.md` — MECE components: security, performance, style, general, context.
  - `.github/prompts/*.prompt.md` — reusable prompt templates; frontmatter metadata.
  - `.github/chatmodes/*.chatmode.md` — 8 personas; synergy notes.
  - `.vscode/settings.json` — prompt/mode discovery locations; safe defaults.
  - `scripts/` — orchestration helpers; token metrics; A/B wrappers.
- DX Effect: Zero-hunt for files; predictable imports; fast onboarding.

## DEV-SDS-002 — Instruction stacking algorithm (addresses DEV-PRD-002, DEV-PRD-006)
- Contract: Ordered list of instruction files → concatenated with precedence.
- Rules:
  - Order: repo-wide → mode → prompt; later items may override earlier ones only where documented.
  - Pruning: remove duplicate headings/sections; cap tokens per stack via metrics.
- Error modes: Missing file, circular include, token overflow; provide clear messages.

## DEV-SDS-003 — Persona chat modes (addresses DEV-PRD-003)
- Structure: Frontmatter (name, description, tools, model) + body instructions + synergy section (links to security/perf/style instructions).
- UX: One-click selection; consistent output format; guidance for handoffs between roles.

## DEV-SDS-004 — Tasks orchestrator pattern (addresses DEV-PRD-004, DEV-PRD-010)
- Inputs: prompt file, variant flag, target selection (file/folder), metrics toggle.
- Outputs: logged token/latency; variant label.
- Behavior: Run prompt, collect metrics, optionally split traffic 50/50 for A/B.

## DEV-SDS-005 — Security defaults and trust (addresses DEV-PRD-005)
- Defaults: Disable chat.tools.autoApprove; honor workspace trust; prepend safety instructions.
- Validation: CI job verifies settings.json posture and presence of safety instructions in stacks.

## DEV-SDS-006 — Prompt-as-code lifecycle (addresses DEV-PRD-007)
- Stages: Edit → Lint → Plan (preview effective prompt) → Run (A/B) → Evaluate → Merge.
- Artifacts: Lint report, plan diff, metrics dashboard.

## DEV-SDS-007 — CALM/Wasp/Nx bridging (addresses DEV-PRD-008)
- Contract: Wasp-style spec drives features; CALM defines interfaces/controls; Nx generators output reversible services.
- Validation: CALM controls run pre-generation; fail fast on violations.

## DEV-SDS-008 — Declarative-first with hooks (addresses DEV-PRD-009)
- Design: Keep configuration declarative; expose hooks in tasks for retrieval, branching, and post-processing.
- Guardrails: Limit hook scope and sanitize inputs.

## DEV-SDS-009 — Evaluation hooks and token budgets (addresses DEV-PRD-010)
- Design: Token/latency logging always on when tasks run; optional quality/safety post-processing.
- Budgets: Per-mode budgets with warnings and hard caps; configurable thresholds.

---

## Documentation-as-code specs
- Markdown style: headers, lists, mermaid diagrams; frontmatter optional for metadata.
- Cross-references: Use relative links and DEV-PRD/ADR/SDS IDs.
- Linters: Markdown lint; link check; schema checks for frontmatter.

## API design for developer usability
- Human-first: function/task names describe intent; minimal required args; sensible defaults.
- Error handling: actionable messages; suggestions for remediation; link to docs.

## Code organization
- Feature-oriented structure for generators and scripts; shared utils for token metrics and plan diffs.
- Naming: kebab-case files, clear suffixes (.prompt.md, .instructions.md, .chatmode.md).
