# GENERATOR_SPEC — Route Contract

**Spec Path (docs):** `docs/specs/generators/route-contract.generator.spec.md`  
**Owning Plugin (target):** `@myorg/vibepro` (at `tools/vibepro/`)  
**Generator Name:** `route-contract`  
**Version Target:** `v1`  
**Owners:** Core Platform Team  
**Related ADRs:** ADR-011 (HTTP contract style), ADR-014 (Testing defaults)  
**Related PRD/SDS:** SDS-API-###, PRD-###  
**VibePro Context:** Complies with `.github/instructions/ai-workflows.instructions.md`, `.github/instructions/testing.instructions.md`, and relevant `AGENT.md`.

---

## 1) Purpose & Scope

Create a **tests-first HTTP route contract** that standardizes request/response schemas, status mapping, handler stubs, and typed clients. The generator must embed validation scaffolding, error taxonomy defaults, and align with workspace tags and cache policies.

**When to use**

- Defining a new HTTP endpoint or refactoring an existing route to the unified contract style.

**Non-goals**

- Implementing business logic, persistence, or infrastructure concerns (auth, rate limiting, etc.).

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

**Plugin Layout**

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

> Names/types must match `schema.json` and `schema.d.ts`.

**Required**

- `name: string` — route identifier (kebab-case).
- `method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'`.
- `path: string` — HTTP path (must start with `/`).

**Recommended**

- `scope: 'api' | 'shared'` (default: `api`).
- `directory?: string` — subfolder under `apps/api` or `libs/shared`.
- `validator: 'zod' | 'valibot' | 'none'` (default: `zod`).
- `statusCodes?: string` — comma-separated list (e.g. `200,201,400,404,422,500`).
- `withE2E?: boolean` (default: `false`).
- `client?: 'typescript' | 'none'` (default: `typescript`).
- `unitTestRunner?: 'vitest' | 'jest'` (default: `vitest`).
- `tags?: string` — extra tags appended to Nx config.

**Validation Rules**

- `name` must be kebab-case.
- `path` must start with `/` and may include `:param` segments.
- `statusCodes`, when provided, must be CSV integers.
- `client='typescript'` requires emitting shared client library artifacts.

**Example `schema.json` (excerpt)**

```json
{
  "$schema": "https://json-schema.org/schema",
  "$id": "MyOrgRouteContract",
  "title": "Route Contract",
  "type": "object",
  "properties": {
    "name": { "type": "string", "$default": { "$source": "argv", "index": 0 } },
    "method": {
      "type": "string",
      "enum": ["GET", "POST", "PUT", "PATCH", "DELETE"]
    },
    "path": { "type": "string" },
    "scope": { "type": "string", "enum": ["api", "shared"], "default": "api" },
    "directory": { "type": "string" },
    "validator": {
      "type": "string",
      "enum": ["zod", "valibot", "none"],
      "default": "zod"
    },
    "statusCodes": { "type": "string" },
    "withE2E": { "type": "boolean", "default": false },
    "client": {
      "type": "string",
      "enum": ["typescript", "none"],
      "default": "typescript"
    },
    "unitTestRunner": {
      "type": "string",
      "enum": ["vitest", "jest"],
      "default": "vitest"
    },
    "tags": { "type": "string" }
  },
  "required": ["name", "method", "path"]
}
```

**Example `schema.d.ts` (excerpt)**

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

**Core contract & handler stub**

```
apps/api/src/routes/<directory?>/<name>.ts
apps/api/src/routes/__tests__/<name>.spec.ts
apps/api/src/contracts/<name>.contract.ts
```

**Optional artifacts**

- `withE2E: true` → `apps/api-e2e/src/<name>.e2e.spec.ts`.
- `client: 'typescript'` → `libs/shared/http-client/<name>.ts` and `__tests__/`.

**Workspace configuration**

- Update or create `project.json` entries ensuring tags include `scope:<scope>` and `type:route-contract`.
- Ensure `nx.json` reflects tags for module-boundary rules and cacheability.

---

## 5) Targets & Cacheability

- Ensure affected projects expose `test`, `lint`, `type-check` targets configured for Nx caching.
- Align new targets with workspace `namedInputs` and task defaults.

---

## 6) Conventions & Policy

- Handler stubs remain pure; validation and typing live in `contracts`.
- Tests are RED-first and define the contract shape and error taxonomy.
- No real network I/O or side effects in generated code.

---

## 7) Implementation Hints (for future generator author)

- Use `@nx/devkit` helpers (`generateFiles`, `formatFiles`, `names`, `addProjectConfiguration`, `updateProjectConfiguration`) as documented in `.tessl/usage-specs/tessl/npm-nx/docs/generators-executors.md` and `devkit-core.md`.
- Derive tags via existing Nx config accessors (`readProjectConfiguration`, `createProjectGraphAsync`) to keep module-boundary lint accurate.
- Guard against reruns by checking for existing routes/contracts and updating idempotently without destructive overwrites.
- When emitting typed clients, reuse shared HTTP utilities to maintain consistency across contracts.

---

## 8) Acceptance Tests (for generator once built)

- Dry run prints the expected file plan with all options.
- Generated files exist with correct paths, tags, and validator wiring.
- `pnpm nx test <affected>` passes with chosen runner; include e2e when `withE2E`.
- Re-running the generator with identical inputs produces no diffs.
- Module-boundary lint passes after scaffolding (tags enforced).
- Workspace graph (`pnpm nx graph --focus <project>`) resolves without missing dependencies.

---

## 9) Rollback & Safety

- Emit a change list so users can revert quickly.
- Keep handlers and clients side-effect free; no secrets or live endpoints.
- Prefer minimal stubs, blocking generation if target files would be overwritten without `--force`.

---

## 10) VibePro Execution Hooks

```bash
just ai-context-bundle
pnpm nx run-many -t test -p <affected-projects>
just ai-validate
```

---

## MCP Assistance

- **context7:** Pull ADR-011, ADR-014, relevant PRD/SDS excerpts, similar route specs, and docs from `.github/instructions/`.
- **ref:** Compare with existing routes/contracts to spot duplication, check module-boundary seams, and validate project graph dependencies.
- **exa:** Review 3–5 external HTTP contract examples (e.g., FastAPI, NestJS swagger schemas, Stripe API patterns, GitHub REST spec, RFC 7807) and capture insights for reviewers.

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

- [ ] `schema.json` and `schema.d.ts` match option names/types.
- [ ] Tags include `scope:<scope>` and `type:route-contract`.
- [ ] Targets are cacheable and align with `namedInputs`.
- [ ] Generator re-run is idempotent; dry run reflects actual outputs.
- [ ] Tests (unit/e2e) and lint/module-boundary checks pass.
- [ ] Docs and dry-run examples updated; typed client optionality respected.
