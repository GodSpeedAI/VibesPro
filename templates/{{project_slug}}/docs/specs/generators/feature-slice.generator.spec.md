# GENERATOR_SPEC — Feature Slice

**Spec Path (docs):** `docs/specs/generators/feature-slice.generator.spec.md`
**Owning Plugin (target):** `@myorg/vibepro` (at `tools/vibepro/`)
**Generator Name:** `feature-slice`
**Version Target:** `v1`
**Owners:** Core Platform Team
**Related ADRs:** ADR-010 (Domain boundaries), ADR-014 (Testing defaults)
**Related PRD/SDS:** PRD-020 (New feature module), SDS-009 (API contract style)
**VibePro Context:** Complies with `.github/instructions/ai-workflows.instructions.md`, `testing.instructions.md`, and local `AGENT.md`.

---

## 1) Purpose & Scope

**Problem**
Standardize creation of a self-contained “feature slice” with:

- A domain library (`libs/<scope>/<name>`) exporting a clear public API
- Optional API endpoint shell in `apps/api`
- Opinionated tests, linting, types, tags, and targets
- Workspace policies (module boundaries, caching) applied automatically

**When to use**

- New product capability or bounded context (e.g., `billing`, `profiles`, `notifications`)

**Non-goals**

- Implement business logic beyond minimal stubs
- Wire external secrets or infra
- Create UI apps or DB migrations (use dedicated specs/generators)

---

## 2) Invocation & Placement (once implemented)

**CLI**

```bash
pnpm nx g @myorg/vibepro:feature-slice <name> \
  --scope=api \
  --directory=optional/subdir \
  --withApi=true \
  --unitTestRunner=vitest
```

**Plugin Layout (target location after implementation)**

```
tools/vibepro/
  package.json   # name: "@myorg/vibepro"
  src/
    generators/
      feature-slice/
        generator.ts
        schema.json
        schema.d.ts
        files/            # templates used by generator
```

---

## 3) Inputs / Options (Schema)

> The generator must expose these options exactly (names/types) via `schema.json` & `schema.d.ts`.

**Required**

- `name: string` — kebab-case project name

**Recommended**

- `scope: "api" | "store" | "shared" | "data"` (determines folder + tags; default: `"api"`)
- `directory?: string` — subfolder under the chosen scope
- `withApi?: boolean` — also scaffold API route shell in `apps/api` (default: `false`)
- `unitTestRunner?: "vitest" | "jest"` (default: `vitest`)
- `publishable?: boolean` (default: `false`)
- `importPath?: string` — required if `publishable: true`
- `tags?: string` — extra tags (comma-separated, appended)

**Validation Rules**

- `name` must be kebab-case (`/^[a-z0-9]+(?:-[a-z0-9]+)*$/`)
- `scope` must be one of the enumerated values
- If `publishable: true` → `importPath` is required
- `directory` cannot escape workspace; normalize slashes

**Example `schema.json`**

```json
{
    "$schema": "https://json-schema.org/schema",
    "$id": "MyOrgFeatureSlice",
    "title": "Feature Slice",
    "type": "object",
    "properties": {
        "name": {
            "type": "string",
            "description": "Feature name (kebab-case)",
            "$default": { "$source": "argv", "index": 0 },
            "x-prompt": "What is the feature name (kebab-case)?"
        },
        "scope": {
            "type": "string",
            "description": "Organizational scope (affects folder & tags)",
            "enum": ["api", "store", "shared", "data"],
            "default": "api",
            "x-prompt": {
                "message": "Choose a scope",
                "type": "list",
                "items": [
                    { "value": "api", "label": "api" },
                    { "value": "store", "label": "store" },
                    { "value": "shared", "label": "shared" },
                    { "value": "data", "label": "data" }
                ]
            }
        },
        "directory": { "type": "string" },
        "withApi": { "type": "boolean", "default": false },
        "unitTestRunner": {
            "type": "string",
            "enum": ["vitest", "jest"],
            "default": "vitest"
        },
        "publishable": { "type": "boolean", "default": false },
        "importPath": { "type": "string" },
        "tags": { "type": "string", "description": "comma-separated" }
    },
    "required": ["name"],
    "allOf": [
        {
            "if": { "properties": { "publishable": { "const": true } } },
            "then": { "required": ["importPath"] }
        }
    ]
}
```

**Example `schema.d.ts`**

```ts
export interface FeatureSliceSchema {
    name: string;
    scope: 'api' | 'store' | 'shared' | 'data';
    directory?: string;
    withApi?: boolean;
    unitTestRunner?: 'vitest' | 'jest';
    publishable?: boolean;
    importPath?: string;
    tags?: string;
}
```

---

## 4) Outputs / Artifacts

> The generator should emit exactly these artifacts (subject to options).

**Library (always)**

```
libs/<scope>/<directory?>/<name>/
  project.json                  # build/test/lint targets
  src/index.ts                  # public API surface
  src/lib/<name>.ts             # minimal implementation stub
  src/lib/__tests__/<name>.spec.ts
  tsconfig.json
  README.md
```

**API Route Shell (if `withApi: true`)**

```
apps/api/src/routes/<name>.ts
apps/api/src/routes/__tests__/<name>.spec.ts
```

**Workspace config changes**

- `nx.json`: add tags `["scope:<scope>", "type:feature-slice", ...extraTags]`
- ESLint / tsconfig path mappings as needed

---

## 5) Targets & Cacheability

**Default targets for the new lib**

- `build` → `@nx/js:tsc` (cacheable)
- `test` → `vitest` or `jest` per option (cacheable)
- `lint` → ESLint
- `type-check` → `tsc -b` or equivalent

**namedInputs / outputs**

- Conform to workspace standards so `run-many` batching benefits from Nx cache.

---

## 6) Conventions & Policy

- Foldering: `libs/<scope>/<directory?>/<name>`
- Tags: must include `scope:<scope>` and `type:feature-slice`
- Testing: default to **Vitest** with `clearMocks: true`
- Module boundaries: tags enable lint rule enforcement (no cross-scope imports)

---

## 7) Implementation Hints (for the future generator author)

- Use `@nx/devkit` helpers documented in `.tessl/usage-specs/tessl/npm-nx/docs/generators-executors.md` (e.g., `generateFiles`, `formatFiles`, `addProjectConfiguration`, `updateProjectConfiguration`, `readNxJson`, `readProjectConfiguration`).
- Build tags and project definitions via the devkit rather than manual JSON edits; verify with `createProjectGraphAsync` for consistent dependency graphs.
- Idempotent behavior is critical—detect existing libs/routes and update only when safe.
- Compose other generators (service, route-contract) when options request API shells or additional adapters.
- Ensure `--dry-run` output mirrors actual writes for AI workflow previews.

---

## 8) Acceptance Tests (for generator once built)

- **Dry run**: emits the correct file plan with the chosen options
- **Scaffold**: files exist with correct content, names, and paths
- **Tags**: project tagged with `scope:<scope>`, `type:feature-slice`
- **Targets**: `pnpm nx test <project>` and `pnpm nx build <project>` succeed
- **Idempotency**: second run produces no diff
- **Module boundaries**: lint rules pass (no illegal imports)
- **Graph & config**: `pnpm nx graph --focus <project>` renders without missing deps; project tags/namedInputs set correctly
- **API option**: if `withApi: true`, route + test created under `apps/api`

---

## 9) Rollback & Safety

- Output a change list (files created/modified) for easy revert
- Never write secrets; all tests use mocks/fakes
- Prefer minimal stubs; avoid behavior that would hit real I/O

---

## 10) VibePro Execution Hooks (for plan/agents)

**Before**

```bash
just ai-context-bundle
```

**During**

```bash
pnpm nx run-many -t test -p <affected-projects>
```

**Exit (phase gate)**

```bash
just ai-validate
```

**MCP Assistance (how agents should use them during execution)**

- **context7**: pull ADR/PRD/SDS excerpts + any prior generator specs for similar slices; compile glossary & constraints
- **ref**: analyze existing libs for seams to avoid duplication; propose module boundaries; flag circular deps
- **exa**: surface 3–5 external examples for public API patterns or route conventions; add links to the PR description

---

## 11) Example

**Command (after implementation)**

```bash
pnpm nx g @myorg/vibepro:feature-slice profiles \
  --scope=api \
  --withApi=true \
  --unitTestRunner=vitest
```

**Resulting structure**

```
libs/api/profiles/
  project.json
  src/index.ts
  src/lib/profiles.ts
  src/lib/__tests__/profiles.spec.ts
  tsconfig.json
  README.md

apps/api/src/routes/profiles.ts
apps/api/src/routes/__tests__/profiles.spec.ts
```

---

## 12) Review Checklist (PR)

- [ ] `schema.json` and `schema.d.ts` match exactly
- [ ] Tags include `scope:<scope>` and `type:feature-slice`
- [ ] Targets are cacheable; namedInputs conform to workspace standard
- [ ] Tests pass locally and in CI
- [ ] Idempotent re-run verified
- [ ] Docs updated (README usage, dry-run example)
