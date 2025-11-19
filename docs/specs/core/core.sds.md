# CORE SDSs

<!-- matrix_ids: [] -->

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

## DEV-SDS-016 — Chezmoi optional bootstrap (addresses DEV-PRD-011/012)

Principle: Zero-friction first-run on fresh machines.

Design: Provide optional Chezmoi templates for shell hook order and a run_after that executes direnv allow for new .envrc files (local only).

Error modes: None in CI (not used). Local failures fall back to manual direnv allow.

Artifacts: Chezmoi templates (outside repo), docs pointer only.

## DEV-SDS-019 — Database Schema and Migration Workflow (addresses DEV-PRD-022)

- Principle: Database schema changes are atomic, version-controlled, and trigger downstream effects.
- Design:
    - **Migrations:** Use the native Supabase CLI for managing database migrations (`supabase/migrations/*.sql`). Each migration file contains plain SQL and is timestamped for ordering.
    - **Local Development:** A `just db-migrate` command will apply all new migrations to the local Dockerized Supabase instance.
    - **CI/CD:** The production deployment pipeline will run migrations against the production database before deploying the application code.
    - **Workflow:** To create a change, a developer runs a command that creates a new, empty migration file. After adding SQL, they run the migration and regeneration command.
- Artifacts: `supabase/migrations/`, `justfile` targets for `db-migrate`, `db-reset`.
- Cross-references: DEV-ADR-020, DEV-PRD-022

---

## DEV-SDS-020 — Type Generation and Propagation Pipeline (addresses DEV-PRD-020, DEV-PRD-022)

- Principle: Generated types are artifacts derived from a single source of truth and should never be manually edited.
- Design:
    - **TypeScript Generation:** A `just gen-types-ts` command will execute `npx supabase gen types typescript --local`. The output is piped to a central, shared library file: `libs/shared/types/src/database.types.ts`.
    - **Python Generation:** A custom script or tool will be used to convert the TypeScript types or introspect the database to generate Pydantic models in `libs/shared/types-py/src/models.py`. This ensures parity.
    - **Orchestration:** A top-level `just gen-types` command will run both the TypeScript and Python generation steps in sequence. This command is chained with `db-migrate` in the main workflow command.
    - **CI Validation:** A CI check will run the `gen-types` command and fail if the output differs from what is committed in the repository, ensuring generated types are never stale.
- Artifacts: `libs/shared/types/src/database.types.ts`, `libs/shared/types-py/src/models.py`, `justfile` targets.
- Cross-references: DEV-ADR-019, DEV-ADR-020, DEV-PRD-020

---

## DEV-SDS-022 — Ports and Adapters Design for Hexagonal Architecture (addresses DEV-ADR-022)

- Principle: The application's core logic depends on abstractions (ports), not on concrete implementations. Adapters provide the concrete implementations for these abstractions.
- Design:
    - **Port Definition:** Ports will be defined as technology-agnostic interfaces within the `libs/<domain>/application` directory. To facilitate testing and dependency inversion, each port will be defined as an abstract contract.

        Example:

    - Structural implementation (preferred — no inheritance needed)

        ```python
        # libs/auth/infrastructure/adapters/supabase_user_repository.py
        from __future__ import annotations
        from typing import Optional

        from libs.auth.domain.models import User
        from libs.auth.application.ports.user_repository import IUserRepository

        class SupabaseUserRepository:
          def get_user_by_email(self, email: str) -> User | None:
            # Supabase client logic here...
            # return User(...) or None
            ...
        ```

        - Explicit inheritance (use only if needed)

        ```python
        # libs/auth/infrastructure/adapters/supabase_user_repository.py
        from __future__ import annotations
        from typing import Optional

        from libs.auth.domain.models import User
        from libs.auth.application.ports.user_repository import IUserRepository

        class SupabaseUserRepository(IUserRepository):
          def get_user_by_email(self, email: str) -> User | None:
            # Supabase client logic here...
            ...
        ```

        Notes:
        - Keep return type User | None (or Optional[User]) to satisfy strict typing.
        - Use @runtime_checkable on the Protocol only if you plan to call isinstance()/issubclass() checks at runtime.
        - Ensure import paths match the monorepo layout and run mypy/ruff as part of the TDD/validation workflow.
        - **Driving (API/UI) Adapters:** FastAPI routes (`api` layer) and UI components (`ui` layer) will act as driving adapters. They will depend on the application services, which are injected with the port interfaces.

    - **Dependency Injection:** Application services will be initialized with implementations of the ports. This will be managed by the application's main entry point or a dependency injection framework.

- Artifacts: New `ports` subdirectories within each domain's `application` layer; new `adapters` subdirectories within the `infrastructure` layer.
- Cross-references: DEV-ADR-022, DEV-PRD-023

---

## DEV-SDS-019 — Complete Generator Specification Template Design (addresses DEV-PRD-019)

Principle: The generator specification template must be comprehensive, AI-friendly, and executable—enabling AI agents to create valid Nx generators just-in-time without hallucinations or external context.

### Design Overview

| Component                | Purpose                                                           | Implementation                                                         |
| ------------------------ | ----------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Spec Template            | Single source of truth for generator patterns                     | `templates/{{project_slug}}/docs/specs/generators/GENERATOR_SPEC.md`   |
| Schema Documentation     | JSON Schema draft-07 examples covering all property types         | Section 3: Inputs/Options with validation rules and prompt types       |
| Type Mapping Matrix      | Schema ↔ TypeScript alignment guide                              | Section 3.1: Table mapping each property to TS type + validation rules |
| Pattern Library          | Reusable generator patterns (domain, service, component, adapter) | Section 3.5: Common Generator Patterns with executable examples        |
| Implementation Hints     | Nx devkit usage patterns and best practices                       | Section 7: Code snippets using `@nx/devkit` helpers                    |
| Acceptance Tests         | Test templates matching project conventions                       | Section 8: Test categories with examples from `tests/generators/*.ts`  |
| AI Quick-Start           | Workflow steps reducing cognitive load                            | Section 13: Step-by-step generator creation process                    |
| Troubleshooting Taxonomy | Categorized error guide (Schema/Runtime/Tests)                    | Section 14: Common errors with resolutions                             |
| Validation Automation    | Commands for automated checking                                   | Throughout: `ajv`, `just ai-validate`, `just spec-guard` references    |
| MCP Assistance           | External knowledge queries for grounding                          | Section 10: context7/ref/exa queries for Nx docs and examples          |

### Detailed Design Sections

#### Section 1: Purpose & Scope

- **Decision Tree (Mermaid):** Visual guide for when to use vs. write custom code
- **Use cases:** Clear examples of appropriate generator scenarios
- **Non-goals:** Explicit anti-patterns to prevent misuse

#### Section 3: Inputs/Options (Schema)

**Schema Property Types Coverage:**

```typescript
interface SchemaPropertyTypes {
    string: {
        validation: ["pattern", "minLength", "maxLength", "format"];
        examples: ["kebab-case names", "email", "url"];
    };
    number: {
        validation: ["minimum", "maximum", "multipleOf"];
        examples: ["port numbers", "retry counts"];
    };
    boolean: {
        defaults: true;
        examples: ["skipTests", "buildable", "publishable"];
    };
    array: {
        validation: ["minItems", "maxItems", "uniqueItems"];
        items: "string | object";
        examples: ["tags", "dependencies"];
    };
    enum: {
        validation: ["enum values"];
        examples: ["language: typescript|python", "framework: next|remix"];
    };
    conditional: {
        keywords: ["if", "then", "else"];
        examples: ["require boundedContext when type=domain"];
    };
}
```

**Prompt Types Coverage:**

```json
{
    "x-prompt": {
        "input": "Simple text input",
        "list": {
            "message": "Select option",
            "items": [
                { "value": "a", "label": "Option A" },
                { "value": "b", "label": "Option B" }
            ]
        },
        "confirmation": "Boolean yes/no prompt",
        "multiselect": {
            "message": "Select multiple",
            "items": ["option1", "option2", "option3"]
        }
    }
}
```

**Default Sources:**

```json
{
    "$default": {
        "$source": "argv", // Command-line argument
        "index": 0 // Position
    },
    "$default": {
        "$source": "projectName" // Current Nx project context
    },
    "$default": {
        "$source": "workspaceName" // Workspace root name
    }
}
```

#### Section 3.1: Type Mapping Matrix

| schema.json Property | TypeScript Type       | Validation Rules               | Example                         |
| -------------------- | --------------------- | ------------------------------ | ------------------------------- |
| `name: string`       | `name: string`        | `pattern: "^[a-z][a-z0-9-]*$"` | `"user-service"`                |
| `port: number`       | `port?: number`       | `minimum: 3000, maximum: 9999` | `3001`                          |
| `skipTests: boolean` | `skipTests?: boolean` | `default: false`               | `true`                          |
| `tags: array`        | `tags?: string[]`     | `items: { type: "string" }`    | `["scope:api", "type:service"]` |
| `type: enum`         | `type: LayerType`     | `enum: ["domain", "infra"]`    | `"domain"`                      |

**Synchronization Rules:**

1. Every `schema.json` property MUST have corresponding `schema.d.ts` field
2. Optional properties in JSON (`required` array) map to TypeScript `?` suffix
3. Enum values become TypeScript union types or string literal types
4. Array items types must match TypeScript array element types

#### Section 3.5: Common Generator Patterns

**Pattern Categories:**

1. **Domain Entity Generator:** Creates DDD entities with value objects
2. **Service/Adapter Generator:** Scaffolds hexagonal layer services
3. **Component Generator:** UI components with styling options
4. **Conditional Schema:** Different options based on generator type

Each pattern includes:

- Complete `schema.json` example
- Matching `schema.d.ts` interface
- Usage example with `pnpm nx g`
- Expected output files

#### Section 6: Generator Composition

**Calling Other Generators:**

```typescript
import { Tree } from '@nx/devkit';
import { libraryGenerator } from '@nx/js';

export default async function(tree: Tree, schema: MySchema) {
  // Call another generator
  await libraryGenerator(tree, {
    name: `${schema.name}-shared`,
    directory: 'libs/shared'
  });

  // Continue with custom logic
  generateFiles(tree, ...);
}
```

**Conditional File Emission:**

```typescript
// In generator.ts
const filesToGenerate = schema.includeTests
  ? ['src/index.ts', 'src/index.spec.ts']
  : ['src/index.ts'];

// In template files/__fileName__.ts.template
<% if (includeTests) { %>
import { describe, it, expect } from 'vitest';
<% } %>
```

#### Section 7: Implementation Hints

**Nx Devkit Patterns:**

```typescript
// File generation with templates
import { generateFiles, Tree, formatFiles, names } from '@nx/devkit';

const normalizedOptions = {
  ...schema,
  ...names(schema.name) // Provides: className, fileName, propertyName, constantName
};

generateFiles(tree, templatePath, targetPath, normalizedOptions);
await formatFiles(tree);

// Project configuration
import { addProjectConfiguration, updateProjectConfiguration } from '@nx/devkit';

addProjectConfiguration(tree, projectName, {
  root: `libs/${projectName}`,
  projectType: 'library',
  sourceRoot: `libs/${projectName}/src`,
  targets: { build: {...} },
  tags: ['scope:domain', 'type:feature']
});

// Validation
function validateSchema(schema: MySchema): void {
  if (!/^[a-z][a-z0-9-]*$/.test(schema.name)) {
    throw new Error(`Invalid name: ${schema.name}. Must be kebab-case.`);
  }
}
```

#### Section 8: Acceptance Tests

**Test Categories with Templates:**

1. **Generation Success:** Verify all expected files created
2. **Content Validation:** Check generated file contents match spec
3. **Schema Validation:** Reject invalid inputs with clear errors
4. **Idempotency:** Re-running produces no diff
5. **Project Graph:** Nx graph remains valid after generation
6. **Target Execution:** Generated targets (build, test, lint) execute successfully

**Test Harness Integration:**

```typescript
import { runGenerator } from "./utils"; // Existing project utility

it("should generate all expected files", async () => {
    const result = await runGenerator("domain-entity", {
        name: "user",
        boundedContext: "identity",
    });

    expect(result.success).toBe(true);
    expect(result.files).toContain("libs/user/domain/entities/User.ts");
});
```

#### Section 13: AI Agent Instructions

**Generator Creation Workflow:**

```
Step 1: Parse Spec Requirements → Extract purpose, schema, outputs, tests
Step 2: Generate schema.json → Use JSON Schema draft-07, include all validations
Step 3: Generate schema.d.ts → Align exactly with schema.json using mapping matrix
Step 4: Generate generator.ts → Import @nx/devkit, validate inputs, use templates
Step 5: Generate Test Suite → Use patterns from tests/generators/*.test.ts
Step 6: Validate Generator → Run dry-run, tests, lint, graph checks
```

**Common Pitfalls:**

- ❌ Using `any` type → ✅ Use proper TypeScript types
- ❌ Hardcoding paths → ✅ Use `path.join` and `names()` helper
- ❌ Skipping `formatFiles()` → ✅ Always format at end
- ❌ Creating circular dependencies → ✅ Respect hexagonal layers

#### Section 14: Troubleshooting

**Categorized Error Guide:**

| Category          | Error Pattern                     | Resolution                                         |
| ----------------- | --------------------------------- | -------------------------------------------------- |
| Schema Validation | "Property 'x' is required"        | Add to `required` array in schema.json             |
| Schema Validation | "Value does not match pattern"    | Adjust pattern regex or input format               |
| Generator Runtime | "Cannot find module '@nx/devkit'" | Run `pnpm add -D @nx/devkit`                       |
| Generator Runtime | "Tree.exists is not a function"   | Ensure `tree` parameter passed correctly           |
| Test Failures     | "result.files missing expected"   | Check template path and output path configuration  |
| Test Failures     | "Generated content doesn't match" | Log actual content for debugging: `tree.read(...)` |

### Error Modes & Recovery

**Missing Spec Sections:**

- Detection: Jest tests fail on TODO detection regex
- Recovery: Green phase fills sections with concrete examples
- Validation: `grep "TODO:" GENERATOR_SPEC.md` returns zero

**Schema/TypeScript Drift:**

- Detection: Type mapping matrix validation fails
- Recovery: Update schema.d.ts to match schema.json properties
- Validation: Automated comparison in `spec-completeness.test.ts`

**Invalid Schema Examples:**

- Detection: AJV validation fails on sample schemas
- Recovery: Fix JSON Schema syntax and validation rules
- Validation: `npx ajv validate -s schema.json -d test-data.json`

**AI Hallucination:**

- Detection: AI simulation test produces invalid generator
- Recovery: Enhance spec with missing patterns and examples
- Validation: AI agent successfully creates generator on retry

### Artifacts & Source Control

**Template Files:**

- `templates/{{project_slug}}/docs/specs/generators/GENERATOR_SPEC.md` — Main spec template
- `templates/{{project_slug}}/docs/specs/generators/data-access.generator.spec.md` — Example completed spec
- `templates/{{project_slug}}/docs/specs/generators/*.generator.spec.md` — Additional examples

**Test Files:**

- `tests/generators/spec-template.test.ts` — Template validation tests
- `tests/generators/spec-completeness.test.ts` — TODO detection and section checks
- `tests/generators/ai-agent-simulation.test.ts` — AI workflow simulation
- `tests/shell/generator-spec-workflow_spec.sh` — End-to-end ShellSpec test

**Supporting Files:**

- `tests/generators/utils.ts` — Existing copier-based test harness
- `tests/fixtures/generator-schema-sample.json` — Sample data for AJV validation
- `docs/generator_plan_review.md` — Gap analysis and recommendations
- `docs/plans/generator_spec_completion_plan.md` — TDD cycle plan

### Performance & Benchmark Goals

- Template generation time: < 2 seconds (Copier processing)
- Spec validation time: < 5 seconds (all tests)
- AI generator creation time: < 5 minutes (end-to-end)
- Test suite execution: < 30 seconds (all generator tests)

### Implementation Dependencies

**Tools:**

- Jest for unit/integration tests
- ShellSpec for shell script validation
- AJV for JSON Schema validation
- Copier for template generation
- Nx devkit for generator implementation

**External Knowledge:**

- Context7 Nx documentation (`/websites/nx_dev`)
- JSON Schema specification (draft-07)
- Existing Nx generator schemas (@nx/js, @nx/react, @nxlv/python)

**Project Files:**

- `.github/instructions/generators-first.instructions.md` — Policy
- `.github/instructions/testing.instructions.md` — Test guidelines
- `.tessl/usage-specs/tessl/npm-nx/docs/generators-executors.md` — Nx devkit docs

### Cross-References

- DEV-ADR-019 — Architecture decision for spec completion
- DEV-PRD-019 — Product requirements and success metrics
- `docs/generator_plan_review.md` — Detailed gap analysis
- `docs/plans/generator_spec_completion_plan.md` — MECE TDD cycles A–C
- `docs/traceability_matrix.md` — Spec ID mappings (to be updated)

### Exit Criteria

- [ ] All 14 spec sections have concrete content with zero TODO markers
- [ ] Schema examples cover all types: string, number, boolean, array, enum, conditional
- [ ] All `x-prompt` types documented: input, list, confirmation, multiselect
- [ ] All `$default` sources documented: argv, projectName, workspaceName
- [ ] Type mapping matrix complete and validated
- [ ] Generator composition patterns with executable examples
- [ ] AI quick-start workflow with step-by-step instructions
- [ ] Troubleshooting guide categorized by error type
- [ ] Test templates align with `tests/generators/utils.ts` patterns
- [ ] Validation commands integrated: `ajv`, `just ai-validate`, `just spec-guard`
- [ ] `just test-generation` produces zero TODOs in `../test-output`
- [ ] All tests pass: Jest, ShellSpec, AJV validation
- [ ] Documentation reviewed and approved by platform team
- [ ] Traceability matrix updated with DEV-PRD-019, DEV-SDS-019, DEV-ADR-019

---

## DEV-SDS-024 — Dependency Tag Configuration & Linting (addresses DEV-PRD-025)

- Tag Taxonomy: `scope:<domain>`, `type:domain|application|infrastructure|api|ui|shared`, `layer:interface`.
- Generator Output: All `project.json` files emitted by generators must include the appropriate tags immediately.
- Lint Rules: Enable `@nx/enforce-module-boundaries` with disallow lists mapping to hexagonal layers (e.g., `type:domain` cannot depend on `type:infrastructure`).
- Conformance: When Nx Conformance is available, configure the enforce-project-boundaries rule to mirror lint constraints for non-JS projects.
- Docs: Update developer docs to explain tag usage and provide troubleshooting steps for lint failures.

## DEV-SDS-025 — Unit of Work & Event Bus Reference Implementations (addresses DEV-PRD-026)

- Contracts: Scaffold `unit_of_work.ts`/`.py` and `event_bus.ts`/`.py` inside each domain’s application layer using TypeScript interfaces and Python `typing.Protocol`.
- In-Memory Adapters: Generators create `InMemoryUnitOfWork` and `InMemoryEventBus` implementations for fast tests.
- Infrastructure Adapters: Provide pre-wired Supabase repositories and message bus placeholders to show extension points.
- Integration: FastAPI routers retrieve UoW/Event Bus via dependency injection; React hooks obtain services already bound to UoW.
- Tests: Application unit tests use in-memory adapters; integration tests validate transactional behavior and event dispatch.

## DEV-SDS-029 — Strict Typing Configuration (addresses DEV-PRD-030)

- TypeScript: Set `"strict": true`, `noUncheckedIndexedAccess`, and forbid implicit anys in `tsconfig.base.json`; ESLint rule `@typescript-eslint/no-explicit-any` set to error with documented escape hatches.
- Python: Configure `mypy.ini` with `strict = True`, enabling `warn-unused-ignores`, `disallow-any-generics`, `warn-return-any`, `no-implicit-reexport`.
- Tooling: Ensure `uv run mypy --strict` is part of CI quality gates (`just spec-guard`).
- Education: Provide snippets in developer docs illustrating branded types, `satisfies`, and Protocol usage.
- Monitoring: Add lint rules and scripts that fail PRs introducing `Any` types unless explicitly justified.

## DEV-SDS-030 — Type Sync Workflow & Hooks (addresses DEV-PRD-031)

- CI Workflow: Add `ci/type-sync.yml` that runs Supabase schema introspection, regenerates TS/Python types, and asserts clean git state.
- Just Targets: Expose `just gen-types`, `just db-migrate-and-gen`, and optional `just type-sync-ci` orchestrating the full pipeline.
- Pre-Commit Hook: Provide `scripts/hooks/pre-commit-type-sync.sh` invoked via Just/mise to regenerate types before commit (opt-in).
- Failure Guidance: Document remediation steps in `docs/ENVIRONMENT.md` (rerun generator, commit regenerated types).
- Traceability: Update `docs/traceability_matrix.md` to map Supabase schema changes to PRDs/SDSs ensuring consistent implementation.
