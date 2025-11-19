# Prompt: generator-spec

kind: prompt
domain: ai-workflows
precedence: high

---

## Instructions

When invoked under `generator-spec` chatmode:

1. **Classify Request**
    - Decide among **feature-slice**, **route-contract**, or **data-access** using the chatmode’s classification rules.
    - If ambiguous, choose the **most constrained** category (route with explicit path → route-contract; persistence-heavy → data-access; else feature-slice).
    - Note the classification decision in the output.

2. **Produce a Generator Specification (spec-first)**
    - Use the matching template sections and headings from `docs/specs/generators/<type>.generator.spec.md`.
    - Mirror the canonical structure defined in `docs/specs/generators/GENERATOR_SPEC.md`.
    - Fill concrete fields from the request: names, scope, paths, options, test focus, acceptance criteria.
    - Keep **placeholders** where inputs are unknown, clearly marked `TODO:`.

3. **Embed VibePro Execution Conventions**
    - Start with `just ai-context-bundle`.
    - Show how Nx targets will run (`pnpm nx ...`), and phase gate with `just ai-validate`.
    - Include tags for module-boundary linting.

4. **MCP Assistance (directive-only)**
    - Add a section describing how to use:
        - `context7` for grounding (list the doc snippets to pull)
        - `ref` for seams/duplication analysis across libs/apps
        - `exa` for 3–5 relevant public examples/specs to review

---

## Output Template

### Classification

- **Chosen Type**: `<feature-slice | route-contract | data-access>`
- **Rationale**: `<1–2 sentences>`

### Spec Path & Plugin

- **Spec Path (docs)**: `docs/specs/generators/<type>-<name>.generator.spec.md`
- **Owning Plugin (target)**: `@myorg/vibepro` (`tools/vibepro/`)
- **Generator Name**: `<type>`
- **Version Target**: `v1`
- **Owners**: `<team>`
- **Related ADRs**: `ADR-###, ...`
- **Related PRD/SDS**: `PRD-###, SDS-###`
- **VibePro Context**: `.github/instructions/ai-workflows.instructions.md`, `testing.instructions.md`, `AGENT.md`

### 1) Purpose & Scope

- Problem, When to use, Non-goals (tailored to the chosen type)

### 2) Invocation & Placement (once implemented)

- **CLI** example for `pnpm nx g @myorg/vibepro:<type> ...`
- **Plugin layout** under `tools/vibepro/src/generators/<type>/`

### 3) Inputs / Options (Schema)

- **Required**: …
- **Recommended**: …
- **Validation Rules**: …
- **Example `schema.json` & `schema.d.ts` excerpts** (only if non-standard from template)

### 4) Outputs / Artifacts

- File/folder plan per type (libs/apps/contracts/adapters/tests)
- Workspace config (tags, path mappings)

### 5) Targets & Cacheability

- Default Nx targets; cacheable; namedInputs alignment

### 6) Conventions & Policy

- Foldering, tags (`scope:*`, `type:*`), testing defaults, module-boundaries

### 7) Implementation Hints (for future generator author)

### 8) Acceptance Tests (for generator once built)

### 9) Rollback & Safety

### 10) VibePro Execution Hooks

```bash
just ai-context-bundle
pnpm nx run-many -t test -p <affected-projects>
just ai-validate
```

### MCP Assistance

- **context7**: what to fetch (ADRs, PRD/SDS clauses, similar prior specs)
- **ref**: where to analyze seams & duplication; circular deps checks
- **exa**: 3–5 links to external examples/standards to review

### Example (Filled)

> Provide a compact, filled example for this request:
> “`Create a GET /api/profiles/:id route with Zod validation and a TS client`”
> or
> “`New invoice repository for Postgres with Drizzle and contract tests`”

### Review Checklist

- [ ] Options match `schema.json`/`schema.d.ts` names & types
- [ ] Tags include `scope:<scope>`, `type:<type>`
- [ ] Cacheable targets; namedInputs respected
- [ ] Idempotent re-run expected
- [ ] Tests and module-boundary lint pass
- [ ] Docs updated (usage + dry-run)
