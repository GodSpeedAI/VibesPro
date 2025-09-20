# Developer Architectural Decision Record (DX-focused)

Audience: Developers as primary users
Scope: Decisions shaping the development environment as a product platform
Source: transcript.md synthesis and repository conventions

---

## DEV-ADR-001 — Native Copilot/VS Code over custom DSL
- Decision: Use only GitHub Copilot + VS Code native mechanisms (copilot-instructions.md, instructions/*.md, prompts/*.prompt.md, chatmodes/*.chatmode.md, settings.json, tasks) instead of inventing a YAML DSL.
- Context: Constraint of “NO custom YAML files or external DSL,” need for immediate usability and hot-reload.
- Rationale: Lower cognitive load; no extra tooling; leverages existing ecosystem; simpler onboarding; safe defaults.
- DX Impact: Faster setup (<10 min), less context switching, predictable discovery; fewer toolchains to learn.
- Trade-offs: Less declarative logic in-config; conditional flows handled via tasks/scripts.

## DEV-ADR-002 — MECE modular instruction files with “LoRA-style” stacking
- Decision: Break guidance into MECE instruction files (security, performance, style, general) and compose per task by ordered stacking.
- Rationale: Mirrors adapter/LoRA composability; enables reuse and fine-grained overrides.
- DX Impact: Clear layering, simpler diffs, targeted tweaks; avoids monolithic prompts.
- Conventions: Left-to-right order determines precedence; repo-wide > mode > prompt can be tuned explicitly.

## DEV-ADR-003 — Custom chat modes as first-class personas (8 roles)
- Decision: Define chat modes for product-manager, ux-ui-designer, system-architect, senior-frontend-engineer, senior-backend-engineer, qa-test-automation-engineer, devops-deployment-engineer, security-analyst.
- Rationale: Minimizes cognitive switching; aligns with delivery phases; improves handoffs.
- DX Impact: One-click persona; consistent outputs; faster planning/implementation flows.

## DEV-ADR-004 — Tasks as orchestration layer (dynamic injection, A/B, token metrics)
- Decision: Use VS Code tasks to run prompts, inject dynamic context, measure tokens, and support A/B flows via branches/workspaces.
- Rationale: Declarative files stay simple; tasks provide controlled imperative glue.
- DX Impact: Repeatable runs; single keybindings/commands; measurable feedback loops.

## DEV-ADR-005 — Security by default: workspace trust and tool safety
- Decision: Respect workspace trust boundaries; never enable chat.tools.autoApprove; centralize safety instructions.
- Rationale: Prevent prompt-injection and RCE; protect developer machines.
- DX Impact: Confidence in running examples; fewer security reviews blocked.

## DEV-ADR-006 — Context window optimization via strategic file ordering
- Decision: Use chat.promptFilesLocations and chat.modeFilesLocations with curated ordering; prune redundant context.
- Rationale: Predictable token budgets; reduce noise; improve answer quality.
- DX Impact: Fewer truncations; faster, more relevant results.

## DEV-ADR-007 — Prompt-as-code lifecycle (VC, lint, test, plan)
- Decision: Treat prompts/instructions as code: versioned, linted, evaluated (A/B), and “planned” prior to change.
- Rationale: Reproducibility and rollback; reduces regressions.
- DX Impact: Safer iteration; observable quality trends; consistent reviews.

## DEV-ADR-008 — CALM + Wasp + Nx synergy (semantics over single-spec generation)
- Decision: Use CALM (architecture semantics/policy) over a Wasp-style single spec; Nx generators scaffold reversible polyglot services; IaC artifacts are downstream.
- Rationale: Clear separation of intent vs constraints; design-time guarantees.
- DX Impact: Deterministic scaffolds; safer service boundaries; reversible changes.

## DEV-ADR-009 — Declarative-first with imperative escape hatches
- Decision: Keep guidance declarative; use tasks/scripts for branching/conditionals and retrieval.
- Rationale: Maintains simplicity; avoids DSL creep; enables power when needed.
- DX Impact: Lower learning curve; flexibility preserved.

## DEV-ADR-010 — Evaluation hooks and token budgets
- Decision: Provide token usage logging, quality checks, and optional toxicity/safety post-process steps.
- Rationale: Close the loop on output quality and cost.
- DX Impact: Faster feedback; predictable spend; structured improvements.

---

## Developer ergonomics considerations (summary)
- Progressive disclosure of options; sensible defaults; opinionated naming.
- Idempotent tasks; hot-reload for instructions and modes.
- Clear precedence rules; consistent folder conventions; ready-to-run samples.

