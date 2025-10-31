# GENERATOR_SPEC — <TYPE>

**Spec Path (docs):** `docs/specs/generators/<type>.generator.spec.md`  
**Owning Plugin (target):** `@myorg/vibepro` (at `tools/vibepro/`)  
**Generator Name:** `<type>`  
**Version Target:** `v1`  
**Owners:** `<team>`  
**Related ADRs:** `<ADR-###, ...>`  
**Related PRD/SDS:** `<PRD-###, SDS-###>`  
**VibePro Context:** `.github/instructions/ai-workflows.instructions.md`, `.github/instructions/testing.instructions.md`, relevant `AGENT.md`.

---

## 1) Purpose & Scope

**Problem**  
`TODO: describe why this generator exists.`

**When to use**  
`TODO: list qualifying scenarios.`

**Non-goals**  
`TODO: list exclusions.`

---

## 2) Invocation & Placement (once implemented)

**CLI**

```bash
pnpm nx g @myorg/vibepro:<type> <primary-arg> \
  --option=value
```

**Plugin Layout**

```
tools/vibepro/
  src/generators/<type>/
    generator.ts
    schema.json
    schema.d.ts
    files/
```

---

## 3) Inputs / Options (Schema)

> Keep names/types in sync with `schema.json` and `schema.d.ts`.

**Required**

-   `TODO: option`

**Recommended**

-   `TODO: option`

**Validation Rules**

-   `TODO: rule`

**Example `schema.json` (excerpt)**

```json
{
    "$schema": "https://json-schema.org/schema",
    "$id": "MyOrg<Type>",
    "type": "object",
    "properties": {
        "TODO": { "type": "string" }
    },
    "required": ["TODO"]
}
```

**Example `schema.d.ts` (excerpt)**

```ts
export interface <Type>Schema {
  TODO: string;
}
```

---

## 4) Outputs / Artifacts

-   `TODO: detail generated files`
-   `TODO: mention workspace config updates (tags, path aliases)`

---

## 5) Targets & Cacheability

-   `TODO: describe default Nx targets`
-   Ensure targets align with workspace `namedInputs` for caching.

---

## 6) Conventions & Policy

-   `TODO: folder naming, tags, testing defaults, lint rules`

---

## 7) Implementation Hints (for future generator author)

-   Use `@nx/devkit` helpers such as `generateFiles`, `formatFiles`, `addProjectConfiguration`, `updateProjectConfiguration`, `names`. See `.tessl/usage-specs/tessl/npm-nx/docs/generators-executors.md` and `devkit-core.md`.
-   Verify tags/project graph integrity with `createProjectGraphAsync` or `readProjectConfiguration`.
-   Keep the generator idempotent; validate dry-run output matches writes.
-   `TODO: additional hints`

---

## 8) Acceptance Tests (for generator once built)

-   Dry run prints expected plan.
-   Generated artifacts exist with correct content.
-   `pnpm nx test <affected>` (and other targets) succeed.
-   Re-running generator produces no diff.
-   Module-boundary lint and `pnpm nx graph --focus <project>` succeed.
-   `TODO: extra acceptance checks`

---

## 9) Rollback & Safety

-   Emit change list for revert scenarios.
-   Avoid secrets or external side effects.
-   `TODO: other safety notes`

---

## 10) VibePro Execution Hooks

```bash
just ai-context-bundle
pnpm nx run-many -t test -p <affected-projects>
just ai-validate
```

---

## MCP Assistance

-   **context7:** `TODO: list specs/docs to fetch for grounding`
-   **ref:** `TODO: seams/duplication checks`
-   **exa:** `TODO: relevant public examples (3–5)`

---

## 11) Example

```bash
pnpm nx g @myorg/vibepro:<type> sample \
  --option=value
```

---

## 12) Review Checklist

-   [ ] `schema.json` / `schema.d.ts` alignment verified.
-   [ ] Tags include `scope:<scope>` and `type:<type>` (plus extras).
-   [ ] Targets cacheable; `namedInputs` alignment checked.
-   [ ] Generator re-run idempotent; dry run accurate.
-   [ ] Tests + lint + module boundaries pass.
-   [ ] Docs updated (usage + dry-run example).
