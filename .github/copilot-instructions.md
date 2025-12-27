# AI Agent Instructions for VibesPro

VibesPro is a **Generative Development Environment** enforcing Hexagonal Architecture, Spec-Driven Development, and Institutional Memory.

## 🧭 Context Navigation Protocol (Index First)

**PROTOCOL**: Minimizing context is critical. Follow this **Index-First** flow:

1.  **Consult Index**: Find your task's **Active Domain** in the table below.
2.  **Load Specific**: Read **ONLY** the designated `AGENT.md`. Do **NOT** read other contexts.
3.  **Cross-Reference**: If you need deeper guidance, check the **Mapped Instructions** column.
4.  **Fallback**: Use search (`find_by_name`/`grep_search`) **ONLY** if the index yields no match.

| Active Domain       | Context File (Index) | Mapped Instructions (Load ONLY if needed)                                              |
| :------------------ | :------------------- | :------------------------------------------------------------------------------------- |
| **Business Logic**  | `libs/AGENT.md`      | `hexagonal-architecture`, `style.*`, `coding-standards`, `refactoring`, `architecture` |
| **Interfaces/Apps** | `apps/AGENT.md`      | `style.*`, `hexagonal-architecture`, `performance`, `src`                              |
| **Testing/QA**      | `tests/AGENT.md`     | `testing`, `debugging`, `ci-workflow`                                                  |
| **DevOps/Infra**    | `ops/AGENT.md`       | `environment`, `logging`, `security`, `performance`                                    |
| **Specs/Docs**      | `docs/AGENT.md`      | `sdd_constitution`, `docs`, `documentation`, `commit-msg`, `general`                   |
| **Tools/Scripts**   | `tools/AGENT.md`     | `nx`, `src`, `context`, `skills`, `temporal-db`                                        |
| **Templating**      | `templates/AGENT.md` | `generators-first`, `docs`                                                             |
| **AI/Prompts**      | `.github/AGENT.md`   | `agents`, `prompts`, `ai-workflows.*`, `context`                                       |
| **Project Root**    | **N/A**              | `PRODUCT.md`, `ARCHITECTURE.md`, `docs/ENVIRONMENT.md`                                 |

## 🧠 Strategic Principles (Universal Mandates)

**These rules apply to ALL domains and override local instructions.**

1.  **Safety First**:
    - **Security**: Follow `.github/instructions/security.instructions.md` religiously. Secrets in `sops` only.
    - **Traceability**: Every logical unit must trace to a Spec ID in `docs/specs/`.
    - **Type Safety**: strict `mypy`, no `any`, exhaustive checking.

2.  **Reliability & Idempotency**:
    - **Generators**: Follow `.github/instructions/generators-first.instructions.md`. Never write boilerplate manually.
    - **Re-runnable**: Scripts MUST be idempotent.
    - **Hermetic**: Tests use `Testcontainers`/`Mountebank` for isolation.

3.  **Isomorphism (Structure)**:
    - **Domain Match**: File structure mirrors business domain (Bounded Contexts).
    - **Manifest**: `ce.manifest.jsonc` is the Source of Truth.

## ⚡ Critical Workflows

### 1. Spec-Driven Implementation

1.  **Query**: `just temporal-ai-query "topic"` (Consult memory).
2.  **Plan**: Update `docs/specs/` (ADR -> PRD -> SDS). See `sdd_constitution`.
3.  **Trace**: Comment code with Spec IDs: `// Implements [SDS-015]`.
4.  **Verify**: `just spec-guard`.

### 2. Validation Loop

- **Fast**: `just ai-validate` (Lint, Types, Links, Smoke).
- **Deep**: `./scripts/ci-local.sh docker` (Bit-perfect CI).
- **Debug**: `just debug-start` -> `repro` -> `fix`.

## 🛠️ Technical constraints

- **Stack**: Node 20+ (pnpm), Python 3.11+ (uv), Rust (Temporal DB).
- **Build**: `just` (Task runner), `nx` (Monorepo).
- **Logs**: `vibepro_logging` (Logfire) only. No `console.log`.

**ANTI-PATTERNS**: Importing `infrastructure` in `domain`; Modifying generated files without understanding templates; Committing `.env`.
