# AI-Assisted, Spec-Driven Development Framework — Analysis and Recommendations

Scope: {{ project_slug }} template and guardrails (prompts, instructions, chat modes, tooling). Includes VS Code customizations context.

## Executive Summary

The framework is a mature, safety‑first, spec‑driven approach for using AI in day‑to‑day development. It combines:

- Spec discipline (PRD/ADR/SDS/TS) and traceability utilities.
- Curated Copilot chat modes for TDD/Debug/Spec‑driven work.
- Reusable prompts for common tasks (implement/change feature, security review, tech stack sync, etc.).
- Repository‑wide custom instructions and modular instruction files.
- “Context bundle” generation to keep the AI architecture‑aware (CALM + tech stack).
- Portable “just” recipes that degrade gracefully, plus light tooling for prompt lint/plan.

Overall posture is strong: consistent guardrails, minimal side‑effects, and good ergonomics in VS Code. The main friction is naming/organization drift across prompts and instructions, which increases recall burden and slows discovery. This report proposes a cohesive naming system to reduce cognitive load and make workflows easier to follow.

## How It Works (Overview)

- Instructions and guardrails
    - Canonical repo‑wide instructions: `.github/copilot-instructions.md`.
    - Modular instruction files: `.github/instructions/*.instructions.md` (security, testing, performance, docs, src, context, commit‑msg, etc.).
    - Good safety posture (no `chat.tools.autoApprove`, no auto‑editing `.vscode` settings). See: `{{ project_slug }}/.github/instructions/security.instructions.md`.

- Prompts
    - Action templates under `{{ project_slug }}/.github/prompts/*.prompt.md` (e.g., `implement-feature`, `security-review`, `traceability-matrix`, transcripts → specs, etc.).
    - Frontmatter + headings are linted by `tools/prompt/lint.js`; token heuristics via `tools/prompt/plan_preview.js` and `budgets.js`.

- Chat modes
    - Modes under `{{ project_slug }}/.github/chatmodes/*.chatmode.md` (e.g., TDD Red/Green/Refactor, Debug phases, Spec‑driven Lean vs Wide).
    - Each mode declares model, tool affordances, and links to instructions/specs.

- Context bundling
    - `just ai-context-bundle` or `scripts/bundle-context.sh` packs `architecture/calm/**` and `techstack.yaml` into `docs/ai_context_bundle/` for consistent context injection.
    - Rationale notes under: `{{ project_slug }}/docs/vibecoding/explanation/architecture-aware-context.md` and `ai-workflows-rationale.md`.

- Spec/traceability utilities
    - Spec ID extraction: `{{ project_slug }}/tools/spec/ids.js`.
    - Matrix generator: `{{ project_slug }}/tools/spec/matrix.js` → `docs/traceability_matrix.md`.

- VS Code customization
    - Guidance for Custom Instructions and MCP usage in `docs/vscode_customization.md`. MCP setup documented at `{{ project_slug }}/docs/vibecoding/how-to/configure-mcp.md` and `{{ project_slug }}/mcp/tool_index.md`.

- Justfile workflows
    - AI workflows are namespaced `ai-*` (`ai-tdd-*`, `ai-debug-*`, `ai-context-bundle`, `ai-validate`, `ai-scaffold`). See: `{{ project_slug }}/justfile`.

## Strengths

- Safety: clear prohibition on auto‑approve and `.vscode` modifications; secrets treated correctly.
- Portability: tasks degrade when pnpm/Nx missing; scripts avoid host‑specific features.
- Spec‑first: strong emphasis on IDs and traceability; matrix tooling in place.
- Mode discipline: TDD/Debug phases provide stepwise structure and reduce risk.
- Context hygiene: CALM + techstack bundle standardizes architecture‑aware prompting.
- Tooling: prompt lint/plan and token heuristics prevent bloat.

## Observations and Gaps

- Prompt naming drift and mixed styles
    - Some prompts are verb‑forward (`implement-feature`), others brand‑forward (`vibecoder-*`), others compound (`traceability-matrix`).
    - This increases recall burden, impairs alphabetical grouping, and makes quick filtering harder.

- Instruction naming mostly consistent but untagged
    - All end with `.instructions.md` (good), but frontmatter lacks a stable taxonomy (domain/task/phase). Discovery relies on file names alone.

- Model selection and budgets
    - Modes use model strings like “GPT‑5 (Preview)” or “GPT‑4.1” without a central override. Consider a single source of truth to avoid fragmentation across files.

- run_prompt placeholder and token accuracy
    - `scripts/run_prompt.sh` is intentionally a stub; this is fine, but note that discoverability could improve by clarifying how to invoke prompts from VS Code.
    - Token estimate is heuristic; acceptable, with future option to swap in a tokenizer.

- Minor guidance risk
    - `context.instructions.md` suggests chain‑of‑thought. Some providers discourage forcing hidden reasoning; prefer “show key steps succinctly” to avoid conflicts.

## Naming System Proposal (Cognitive Ergonomics)

Goals

- Recognition over recall: consistent, scan‑friendly names group by domain/task/phase.
- Predictable search: easy `rg`/Quick Open filtering (e.g., `spec.*.prompt.md`).
- Low churn: preserve existing folders and suffixes; focus on prefixes and frontmatter.

Pattern

- Filename: `<domain>.<task>[.<phase>].<kind>.md`
    - `domain`: spec | tdd | debug | docs | perf | sec | tool | ui | platform
    - `task`: implement | change | traceability | review | generate | analyze | sync | scaffold | housekeeping | transcript | items | create‑component
    - `phase` (optional): red | green | refactor | start | repro | isolate | fix | regress | lean | wide
    - `kind`: prompt | chatmode | instructions

Frontmatter (prompts and modes)

```yaml
kind: prompt|chatmode|instructions
domain: spec|tdd|debug|docs|perf|sec|tool|ui|platform
task: implement|change|traceability|review|generate|analyze|sync|scaffold|housekeeping|transcript|items|create-component
phase: red|green|refactor|start|repro|isolate|fix|regress|lean|wide|null
budget: S|M|L # guidance only; pairs with tools/prompt/budgets.js
model: <default-model> # optional; allow central override
inputs: [...]
outputs: [...]
```

Instruction frontmatter (minimal)

```yaml
kind: instructions
domain: security|testing|performance|docs|src|context|commit
applyTo: "**" # keep existing semantics
precedence: 10 # lower loads earlier when composing
```

Suggested Renames (representative)

- Prompts (retain folder; update links over time):
    - `implement-feature.prompt.md` → `spec.implement.prompt.md`
    - `change-feature.prompt.md` → `spec.change.prompt.md`
    - `traceability-matrix.prompt.md` → `spec.traceability.update.prompt.md`
    - `load-spec-items.prompt.md` → `spec.items.load.prompt.md`
    - `transcript-to-spec.prompt.md` → `spec.transcript.to-spec.prompt.md`
    - `transcript-to-devspec.prompt.md` → `spec.transcript.to-devspec.prompt.md`
    - `vibecoder-tdd.prompt.md` → `tdd.workflow.prompt.md`
    - `vibecoder-debug.prompt.md` → `debug.workflow.prompt.md`
    - `generate-ai-docs.prompt.md` → `docs.generate.prompt.md`
    - `create-react-component.prompt.md` → `ui.react.create-component.prompt.md`
    - `performance-analysis.prompt.md` → `perf.analyze.prompt.md`
    - `security-review.prompt.md` → `sec.review.prompt.md`
    - `spec-housekeeping.prompt.md` → `spec.housekeeping.prompt.md` (kept, normalized prefix)
    - `sync-techstack.prompt.md` → `tool.techstack.sync.prompt.md`
    - `bootstrap-dev-platform.prompt.md` → `platform.bootstrap.prompt.md`

- Chat modes (renamed to domain.task pattern):
    - `ai-tdd-red.chatmode.md` → `tdd.red.chatmode.md` (completed)
    - `ai-debug-repro.chatmode.md` → `debug.repro.chatmode.md` (completed)
    - `spec-driven-lean.chatmode.md` → `spec.lean.chatmode.md` (completed)
    - `spec-driven.chatmode.md` → `spec.wide.chatmode.md` (completed)

- Instructions (keep `.instructions.md`; add `domain` in frontmatter, names already readable):
    - `security.instructions.md`, `testing.instructions.md`, `performance.instructions.md`, `docs.instructions.md`, `src.instructions.md`, `dev-docs.instructions.md`, `commit-msg.instructions.md`, `general.instructions.md`, `context.instructions.md`.

Why this helps

- Files cluster meaningfully in Quick Open (typing `spec.` or `debug.` narrows immediately).
- Mental model aligns with “What domain? What task? What phase?”
- Friendly to grep and automation; pairs cleanly with the existing prompt linter.

## Additional Recommendations

- Centralize model selection
    - Add a small `{{ project_slug }}/.github/models.json` or `models.yaml` and let chat modes reference `${{ default_model }}`. Reduces drift when model defaults change.

- Tighten prompt linting
    - Extend `tools/prompt/lint.js` to validate the proposed `frontmatter` fields (`kind`, `domain`, `task`, optional `phase`). This enforces the taxonomy and prevents back‑slide.

- Clarify VS Code invocation
    - In `scripts/run_prompt.sh`, add a comment with a concrete VS Code command example or a link to `docs/vibecoding/reference/prompts.md` showing how to load a prompt in chat. Keep it a stub but discoverable.

- Adjust “chain‑of‑thought” guidance
    - Replace “encourage chain‑of‑thought reasoning” with “explain key steps succinctly” to avoid conflicts with provider policies while preserving reasoning quality.

- Create a Prompt/Mode Index
    - Add `{{ project_slug }}/docs/vibecoding/reference/index.md` listing all prompts/modes with domain/task/phase, inputs/outputs, and a one‑liner. This makes onboarding much faster.

## Implementation Plan (Non‑Breaking → Optional Renames)

Phase 1 — Adopt taxonomy without file renames

- Add frontmatter fields to prompts/modes/instructions as proposed (no file moves yet).
- Update `docs/vibecoding/reference/prompts.md` and `chat-modes.md` to display domain/task/phase for each item.
- Teach `prompt:lint` to enforce the fields.

Phase 2 — Gentle transitions

- Introduce new filenames in parallel and keep stubs in the old names that link to the new location (or add a short header “Moved to …”).
- Update references in chat modes and docs. Validate with `tools/spec/matrix.js` and link checkers.

Phase 3 — Clean up

- Remove stubs once links are updated and contributors are comfortable.
- Optional: group prompts into subfolders by domain (`.github/prompts/spec/*`, `debug/*`, etc.).

## Quick File References (reviewed)

- `{{ project_slug }}/.github/instructions/ai-workflows.instructions.md`
- `{{ project_slug }}/.github/instructions/security.instructions.md`
- `{{ project_slug }}/.github/prompts/spec.implement.prompt.md`
- `{{ project_slug }}/.github/prompts/sec.review.prompt.md`
- `{{ project_slug }}/.github/prompts/spec.traceability.update.prompt.md`
- `{{ project_slug }}/.github/chatmodes/tdd.red.chatmode.md`
- `{{ project_slug }}/.github/chatmodes/spec.wide.chatmode.md`
- `{{ project_slug }}/justfile`
- `{{ project_slug }}/techstack.yaml`
- `{{ project_slug }}/scripts/bundle-context.sh`
- `{{ project_slug }}/tools/spec/matrix.js`
- `docs/vscode_customization.md`

## Acceptance Criteria for Adoption

- All prompts/modes/instructions carry the new frontmatter fields.
- Reference pages updated to surface domain/task/phase groupings.
- Linter rejects files missing the fields; CI green.
- No behavioral change to workflows; renames are optional and staged.

## Closing Note

Your system is already robust and thoughtfully constrained. The proposed naming taxonomy and minimal metadata add a consistent surface for discovery and learning, reducing cognitive load without disrupting current flows. This keeps contributors moving fast while staying within your spec/security guardrails.
