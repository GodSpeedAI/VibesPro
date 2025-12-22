# GENERATOR_SPEC — Data Access (Repository/Adapter)

**Spec Path (docs):** `docs/specs/generators/data-access.generator.spec.md`
**Owning Plugin (target):** `@myorg/vibepro` (at `tools/vibepro/`)
**Generator Name:** `data-access`
**Version Target:** `v1`
**Owners:** Core Platform Team
**Related ADRs:** ADR-008 (Persistence strategy), ADR-012 (Port/Adapter pattern)
**Related PRD/SDS:** SDS-DAO-###, PRD-###
**VibePro Context:** Complies with `.github/instructions/ai-workflows.instructions.md`, `testing.instructions.md`, and `AGENT.md`.

---

## 1) Purpose & Scope

Standardize **repository + port/adapter** scaffolding for domain entities, with interfaces, DTOs, and integration test harness. Supports multiple backends (e.g., Postgres/HTTP) via options—**no real I/O** in stubs.

**When to use**

- New entity persistence layer or refactor to ports/adapters.

**Non-goals**

- Real DB migrations/seed data; production infra; actual network calls.

---

## 2) Invocation & Placement (once implemented)

**CLI**

```bash
pnpm nx g @myorg/vibepro:data-access <entity> \
  --scope=data \
  --backend=postgres \
  --orm=drizzle \
  --withContractTests=true \
  --unitTestRunner=vitest
```

**Plugin Layout (after implementation)**

```
tools/vibepro/
  src/generators/data-access/
    generator.ts
    schema.json
    schema.d.ts
    files/
```

---

## 3) Inputs / Options (Schema)

**Required**

- `entity: string` — singular domain entity (kebab or camel; becomes Pascal in types)

**Recommended**

- `scope: 'data' | 'shared' | 'api'` (default: `data`)
- `directory?: string`
- `backend: 'postgres' | 'sqlite' | 'http' | 'memory'` (default: `memory`)
- `orm: 'drizzle' | 'prisma' | 'knex' | 'none'` (default: `none`)

    > Only meaningful for SQL backends; ignored for `http`/`memory`.

- `withContractTests?: boolean` (default: `true`)
- `unitTestRunner?: 'vitest' | 'jest'` (default: `vitest`)
- `tags?: string`

**Validation Rules**

- `entity` maps to valid TS identifiers when PascalCased.
- `orm` must be compatible with `backend` if SQL chosen.

**Example `schema.json` (excerpt)**

```json
{
    "$schema": "https://json-schema.org/schema",
    "$id": "MyOrgDataAccess",
    "title": "Data Access",
    "type": "object",
    "properties": {
        "entity": {
            "type": "string",
            "$default": { "$source": "argv", "index": 0 }
        },
        "scope": {
            "type": "string",
            "enum": ["data", "shared", "api"],
            "default": "data"
        },
        "directory": { "type": "string" },
        "backend": {
            "type": "string",
            "enum": ["postgres", "sqlite", "http", "memory"],
            "default": "memory"
        },
        "orm": {
            "type": "string",
            "enum": ["drizzle", "prisma", "knex", "none"],
            "default": "none"
        },
        "withContractTests": { "type": "boolean", "default": true },
        "unitTestRunner": {
            "type": "string",
            "enum": ["vitest", "jest"],
            "default": "vitest"
        },
        "tags": { "type": "string" }
    },
    "required": ["entity"]
}
```

**`schema.d.ts` (excerpt)**

```ts
export interface DataAccessSchema {
    entity: string;
    scope?: 'data' | 'shared' | 'api';
    directory?: string;
    backend?: 'postgres' | 'sqlite' | 'http' | 'memory';
    orm?: 'drizzle' | 'prisma' | 'knex' | 'none';
    withContractTests?: boolean;
    unitTestRunner?: 'vitest' | 'jest';
    tags?: string;
}
```

---

## 4) Outputs / Artifacts

**Domain Data Library**

```
libs/<scope>/<directory?>/<entity>-data/
  project.json
  src/index.ts
  src/lib/<Entity>Port.ts                 # interface (port)
  src/lib/<Entity>Repository.ts           # default adapter interface
  src/lib/adapters/<backend>/<Entity>Repo<Backend>.ts   # stub adapter
  src/lib/dto/<Entity>DTO.ts              # DTO/types
  src/lib/__tests__/<entity>-repo.spec.ts # RED-first tests
  tsconfig.json
  README.md
```

**Contract Tests (if `withContractTests: true`)**

```
libs/<scope>/<directory?>/<entity>-data/src/lib/__tests__/contract/<entity>-repo.contract.spec.ts
```

**Optional HTTP shim (if backend='http')**

```
libs/<scope>/<directory?>/<entity>-data/src/lib/adapters/http/http-client.ts  # typed fetch wrapper (stub)
```

**Workspace Config**

- Tags: `["scope:<scope>","type:data-access","entity:<entity>", ...extra]`
- Ensure module-boundary rules apply.

---

## 5) Targets & Cacheability

- `test`, `lint`, `type-check`, optional `build` for publishable adapters.
- Prefer cacheable targets and align with workspace `namedInputs`.

---

## 6) Conventions & Policy

- **Port/Adapter**: high-level interface (`Port`) + adapter(s) per backend.
- **No real I/O** in stubs; fake clients where needed.
- **Tests define behavior** (CRUD-ish operations or domain-specific ops).
- **DTOs** own serialization boundaries; adapters convert as needed.

---

## 7) Implementation Hints (for future generator author)

- Lean on `@nx/devkit` utilities (`generateFiles`, `formatFiles`, `addProjectConfiguration`, `updateProjectConfiguration`, `updateJson`) as outlined in `.tessl/usage-specs/tessl/npm-nx/docs/generators-executors.md` and `devkit-core.md`.
- Build adapter-specific targets programmatically; use `createProjectGraphAsync` or `readProjectConfiguration` to confirm dependencies and tags after mutation.
- If `backend` is SQL, mention ORM scaffolding expectations in README but avoid generating migrations or touching infrastructure generators.
- Support incremental adapter creation: detect existing entity libs and add new adapters/tests without destructive changes.
- Keep all generated code side-effect free and formatted via `formatFiles`.

---

## 8) Acceptance Tests (for generator once built)

- Dry run plan OK.
- Files present with correct names and exports.
- Unit tests compile and pass with fake clients.
- If multiple adapters selected over time, contracts remain shared; tests pass for each.
- Idempotency re-run = no diff.
- Lint/module-boundaries pass.
- Workspace graph (`pnpm nx graph --focus <entity>-data`) renders without missing dependencies; `project.json` includes expected tags and targets.

---

## 9) Rollback & Safety

- Emit change list.
- No secrets; no live DB calls.
- Keep adapters pure and side-effect free in stubs.

---

## 10) VibePro Execution Hooks

**Before**: `just ai-context-bundle`
**During**: `pnpm nx run-many -t test -p <entity>-data`
**Exit**: `just ai-validate`

**MCP Assistance**

- **context7**: gather ADRs on persistence + any prior entity data-access specs; assemble glossary.
- **ref**: propose seam boundaries (port vs adapter vs dto); detect duplication across entities.
- **exa**: find 3–5 examples of clean repository patterns for chosen backend/ORM; include links in PR.

---

## 11) Example

```bash
pnpm nx g @myorg/vibepro:data-access invoice \
  --scope=data \
  --backend=postgres \
  --orm=drizzle \
  --withContractTests=true
```

---

## 12) Review Checklist

- [ ] `schema.json`/`schema.d.ts` match
- [ ] Tags include `scope:<scope>`, `type:data-access`, `entity:<entity>`
- [ ] Tests pass; cacheable targets
- [ ] Idempotent on re-run
- [ ] Port/adapter split is clean; DTOs correct
- [ ] Docs updated (usage & options)
