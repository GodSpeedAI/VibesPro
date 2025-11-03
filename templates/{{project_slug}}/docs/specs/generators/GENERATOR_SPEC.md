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
This generator provides a standardized way to create new components, ensuring they adhere to the project's architectural and style guidelines.

**When to use**  
Use this generator when you need to create a new UI component, service, or other reusable module. The decision tree for using this generator is as follows:
- Is the component reusable?
- Does it require its own set of tests?
- Will it be consumed by multiple other components or applications?

If the answer to these questions is "yes", then this generator is the appropriate tool.

**Non-goals**  
- This generator does not create application-level features.
- It does not configure routing or navigation.
- It does not install new dependencies.

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

| Name | Type | Description | Default |
|---|---|---|---|
| `name` | `string` | The name of the component. | |
| `type` | `enum` | The type of component to create. | `ui` |
| `directory` | `string` | The directory to create the component in. | |

**Validation Rules**

-   `name` must be a valid TypeScript identifier.
-   `directory` must be a valid path.

**Example `schema.json` (excerpt)**

```json
{
    "$schema": "https://json-schema.org/schema",
    "$id": "MyOrg<Type>",
    "type": "object",
    "properties": {
        "name": { "type": "string" },
        "type": { "type": "string", "enum": ["ui", "service", "util"] },
        "directory": { "type": "string" }
    },
    "required": ["name"]
}
```

**Example `schema.d.ts` (excerpt)**

```ts
export interface <Type>Schema {
  name: string;
  type: 'ui' | 'service' | 'util';
  directory?: string;
}
```

### 3.1 Type Mapping Matrix

| Schema Type | TypeScript Type |
|---|---|
| `string` | `string` |
| `number` | `number` |
| `boolean` | `boolean` |
| `array` | `T[]` |
| `object` | `Record<string, T>` |

### 3.5 Pattern Categories

- Domain
- Service
- Component
- Conditional

---

## 4) Outputs / Artifacts

- Generates a new directory with the component's name.
- Creates `index.ts`, `component.tsx`, and `component.spec.tsx` files.
- Updates the workspace configuration with the new component.

---

## 5) Targets & Cacheability

- Defines `build`, `test`, and `lint` targets for the new component.
- All targets are cacheable.

---

## 6) Conventions & Policy

- Follows the existing conventions for folder naming, tags, testing, and linting.

---

## 7) Implementation Hints (for future generator author)

-   Use `@nx/devkit` helpers such as `generateFiles`, `formatFiles`, `addProjectConfiguration`, `updateProjectConfiguration`, `names`. See `.tessl/usage-specs/tessl/npm-nx/docs/generators-executors.md` and `devkit-core.md`.
-   Verify tags/project graph integrity with `createProjectGraphAsync` or `readProjectConfiguration`.
-   Keep the generator idempotent; validate dry-run output matches writes.

---

## 8) Acceptance Tests (for generator once built)

-   Dry run prints expected plan.
-   Generated artifacts exist with correct content.
-   `pnpm nx test <affected>` (and other targets) succeed.
-   Re-running generator produces no diff.
-   Module-boundary lint and `pnpm nx graph --focus <project>` succeed.

---

## 9) Rollback & Safety

-   Emit change list for revert scenarios.
-   Avoid secrets or external side effects.

---

## 10) VibePro Execution Hooks

```bash
just ai-context-bundle
pnpm nx run-many -t test -p <affected-projects>
just ai-validate
```

---

## MCP Assistance

-   **context7:** Fetch ADRs and other relevant documentation.
-   **ref:** Check for duplication and suggest refactoring opportunities.
-   **exa:** Find relevant public examples.

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
