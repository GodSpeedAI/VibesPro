awesome — here are **two ready-to-commit generator specifications** you can drop into your repo. They match the **VibePro** conventions, keep things **generator-spec first** (no generator code), integrate **Nx**, **`just`**, and include **MCP assistance** guidance for `context7`, `ref`, and `exa`.

---

## 📄 `docs/generators/route-contract.spec.md`

# GENERATOR_SPEC — Route Contract

**Spec Path (docs):** `docs/generators/route-contract.spec.md`
**Owning Plugin (target):** `@myorg/vibepro` (at `tools/vibepro/`)
**Generator Name:** `route-contract`
**Version Target:** `v1`
**Owners:** Core Platform Team
**Related ADRs:** ADR-011 (HTTP contract style), ADR-014 (Testing defaults)
**Related PRD/SDS:** SDS-API-### (service-specific), PRD-### (feature-level requirement)
**VibePro Context:** Complies with `.github/instructions/ai-workflows.instructions.md`, `testing.instructions.md`, and relevant `AGENT.md`.

---

## 1) Purpose & Scope

Create a **tests-first HTTP route contract** (request/response schemas, status map, handler stub, tests) that’s consistent across services. Optionally emits **E2E contract tests** and **client stubs**.

**When to use**

* New endpoint or refactor of an existing one; enforce consistent validation, error taxonomy, and test shape.

**Non-goals**

* Implement business logic, persistence, or cross-cutting concerns (auth/rate-limit)—only stubs & contracts.

---

## 2) Invocation & Placement (once implemented)

**CLI**

```bash
pnpm nx g @myorg/vibepro:route-contract <name> \
  --method=GET \
  --path=/api/<resource> \
  --scope=api \
  --withE2E=true \
  --validator=zod \
  --client=typescript
```

**Plugin Layout (after implementation)**

```
tools/vibepro/
  src/generators/route-contract/
    generator.ts
    schema.json
    schema.d.ts
    files/
```

---

## 3) Inputs / Options (Schema)

**Required**

* `name: string` — route identifier (kebab-case, used in filenames)
* `method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'`
* `path: string` — HTTP path (e.g., `/api/profiles/:id`)

**Recommended**

* `scope: 'api' | 'shared'` (default: `api`)
* `directory?: string` — subfolder under `apps/api` or `libs/shared`
* `validator: 'zod' | 'valibot' | 'none'` (default: `zod`)
* `statusCodes?: string` — CSV like `"200,201,400,401,404,422,500"`
* `withE2E?: boolean` (default: `false`)
* `client?: 'typescript' | 'none'` (default: `typescript`)
* `unitTestRunner?: 'vitest' | 'jest'` (default: `vitest`)
* `tags?: string` — extra tags

**Validation Rules**

* `name` kebab-case; `path` starts with `/`; `statusCodes` must be CSV of ints.
* If `client='typescript'`, emits a typed client in `libs/shared/http-client/<name>.ts`.

**Example `schema.json` (excerpt)**

```json
{
  "$schema": "https://json-schema.org/schema",
  "$id": "MyOrgRouteContract",
  "title": "Route Contract",
  "type": "object",
  "properties": {
    "name": { "type": "string", "$default": { "$source": "argv", "index": 0 } },
    "method": { "type": "string", "enum": ["GET", "POST", "PUT", "PATCH", "DELETE"] },
    "path": { "type": "string" },
    "scope": { "type": "string", "enum": ["api", "shared"], "default": "api" },
    "directory": { "type": "string" },
    "validator": { "type": "string", "enum": ["zod", "valibot", "none"], "default": "zod" },
    "statusCodes": { "type": "string" },
    "withE2E": { "type": "boolean", "default": false },
    "client": { "type": "string", "enum": ["typescript", "none"], "default": "typescript" },
    "unitTestRunner": { "type": "string", "enum": ["vitest", "jest"], "default": "vitest" },
    "tags": { "type": "string" }
  },
  "required": ["name", "method", "path"]
}
```

**`schema.d.ts` (excerpt)**

```ts
export interface RouteContractSchema {
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  scope?: 'api' | 'shared';
  directory?: string;
  validator?: 'zod' | 'valibot' | 'none';
  statusCodes?: string;
  withE2E?: boolean;
  client?: 'typescript' | 'none';
  unitTestRunner?: 'vitest' | 'jest';
  tags?: string;
}
```

---

## 4) Outputs / Artifacts

**API Contract + Handler Stub**

```
apps/api/src/routes/<directory?>/<name>.ts            # handler shell (no business logic)
apps/api/src/routes/__tests__/<name>.spec.ts          # RED-first tests
apps/api/src/contracts/<name>.contract.ts             # request/response types, validator schema
```

**E2E (optional if `withE2E: true`)**

```
apps/api-e2e/src/<name>.e2e.spec.ts                   # smoke/e2e (uses test app bootstrap)
```

**Typed Client (if `client: typescript`)**

```
libs/shared/http-client/<name>.ts                      # fetch wrapper with typed IO
libs/shared/http-client/__tests__/<name>.spec.ts
```

**Workspace Config**

* Add tags: `["scope:api","type:route-contract", ...extra]`
* Ensure `nx.json` project tags support module-boundary lint rules.

---

## 5) Targets & Cacheability

* New/updated projects come with:

  * `test` → `vitest`/`jest`
  * `lint` → ESLint
  * `type-check` → `tsc -b`
* Aim for cacheable `build/test` where applicable; align with workspace `namedInputs`.

---

## 6) Conventions & Policy

* Handler files are **thin**; validation and typing live in `contracts`.
* Error taxonomy and response envelope follow ADR defaults.
* Tests **define** the API behavior (RED first). No network I/O; use test app bootstrap.

---

## 7) Implementation Hints (for future generator author)

* Use `@nx/devkit` to write files, update `project.json`, set tags.
* Template contract from ADRs; make validator optional (`none` → types only).
* Idempotent: if route exists, only update contracts/tests with safe guards.

---

## 8) Acceptance Tests (for generator once built)

* Dry run prints correct plan.
* Files exist with correct names/paths.
* `apps/api` unit tests pass locally/CI.
* If `withE2E`: e2e compiles and can run against test server.
* `libs/shared/http-client` compiles/tests if emitted.
* Idempotency re-run = no diff.
* Lint/module-boundaries pass.

---

## 9) Rollback & Safety

* Emit change list for revert.
* Tests use mocks; no secrets.
* Keep route handlers side-effect free in stubs.

---

## 10) VibePro Execution Hooks

**Before**: `just ai-context-bundle`
**During**: `pnpm nx run-many -t test -p api,api-e2e,shared-http-client`
**Exit**: `just ai-validate`

**MCP Assistance**

* **context7**: pull ADR/API style guide & any similar route specs for consistency.
* **ref**: analyze current route structure; suggest file placement/seams; flag duplication.
* **exa**: surface 3–5 examples of API contract patterns relevant to method/path (include URLs in PR notes).

---

## 11) Example

```bash
pnpm nx g @myorg/vibepro:route-contract profiles-get \
  --method=GET \
  --path=/api/profiles/:id \
  --withE2E=true \
  --client=typescript
```

---

## 12) Review Checklist

* [ ] `schema.json`/`schema.d.ts` match
* [ ] Tags include `scope:api`, `type:route-contract`
* [ ] Tests (unit/e2e if opted) pass, cacheable
* [ ] Idempotent on re-run
* [ ] Contracts reflect validator choice; docs updated
