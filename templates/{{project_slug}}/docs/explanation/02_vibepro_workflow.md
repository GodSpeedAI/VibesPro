## 🧠 VibePro Workflows

> VibePro uses **[Copilot chatmodes](../reference/03_ai_prompts_and_chatmodes.md)** to keep all AI-assisted development predictable, auditable, and aligned with our Nx + generator-first conventions.
> Each mode has a specific scope and output format. Use them consistently to keep the workspace clean and MECE.

---

### 🔧 `/tdd-plan` — Full TDD Implementation Planning

**When to use**

- You have a **feature spec** (ADR, PRD, SDS, etc.) and need a **complete implementation plan** for multiple agents to execute.
- The plan should define MECE tasks, Nx project boundaries, tests-first sequencing, and generator specs when needed.

**What it produces**

- A **multi-phase Test-Driven Development plan** following:
  - VibePro’s _generator-first_ policy (no direct generator coding)
  - Nx orchestration (`pnpm nx run-many ...`)
  - `just` recipes (`just ai-context-bundle`, `just ai-validate`)
  - Explicit **RED → GREEN → REFACTOR → REGRESSION** cycles per task

- Each generator reference will output a **Generator Specification Plan**, not code.

**Example**

```text
/tdd-plan
→ Generates a full Nx-compatible plan from docs/specs/prd.md
→ Includes MERMAID dependency graphs, task tables, and MCP usage notes
```

**MCP Tools**

- **context7** – pull contextual excerpts from ADRs/PRDs/SDSs
- **ref** – analyze refactors, duplication, seams
- **exa** – find external best-practice examples or benchmarks

---

### 🧩 `/generator-spec` — Generator Specification Router

**When to use**

- You want to **define** (not implement) a new generator for VibePro (e.g., new API route, feature slice, or data access module).
- Use this mode to draft a `GENERATOR_SPEC.md` following our Nx and organization-specific plugin structure.

**What it produces**

- A **spec-first document** classifying your intent into one of:
  1. **feature-slice** — a domain library or feature module
  2. **route-contract** — an HTTP route with tests and validators
  3. **data-access** — a repository/adapter layer for persistence

- Fills out all sections: purpose, schema options, outputs, targets, acceptance tests, MCP guidance.

**Example**

```text
/generator-spec "create GET /api/invoices route with Zod validation"
/generator-spec "add repository for orders with Postgres + Drizzle"
/generator-spec "new notifications feature slice"
```

**MCP Tools**

- **context7** – gather ADRs and prior generator specs for consistency
- **ref** – evaluate seams across libs and enforce MECE boundaries
- **exa** – suggest 3–5 real-world examples for review

---

### ⚙️ Quick Commands

| Action                                  | Command                                  | Output                               |
| --------------------------------------- | ---------------------------------------- | ------------------------------------ |
| Generate context bundle before any mode | `just ai-context-bundle`                 | Loads ADR/PRD/SDS + instructions     |
| Validate phase or generator spec        | `just ai-validate`                       | Runs Nx tests, lint, and type checks |
| Run all tests for affected projects     | `pnpm nx run-many -t test -p <affected>` | Ensures all remain green             |

---

### 🔍 Mode Decision Guide

| Task                                           | Use Chatmode              | Output                            |
| ---------------------------------------------- | ------------------------- | --------------------------------- |
| Full implementation roadmap from PRD/SDS       | **`/tdd-plan`**           | Multi-phase TDD plan              |
| Drafting a new Nx generator spec               | **`/generator-spec`**     | Generator specification (no code) |
| Code or generator implementation (future step) | _handled by build agents_ | Implementation based on specs     |

---

### 🪄 Recommended Workflow

1. `/generator-spec` → Define generator spec for new feature
2. `/tdd-plan` → Produce full TDD plan referencing that spec
3. Developers or agents implement according to plan
4. `just ai-validate` → Phase-gate validation in CI

---

## 🤖 AI-Assisted Workflows (VibePro Copilot Chatmodes)

VibePro supports **AI-assisted development** using repository-defined chatmodes and prompts under `.github/`.
These modes enforce **specification-first**, **test-driven**, and **Nx-compliant** development — keeping the workspace MECE, reproducible, and aligned with our architectural decisions.

---

### 🧱 Core Principles

- **Specification-First** — AI and humans never generate implementation directly; all work begins from explicit specs (`GENERATOR_SPEC.md`, `TDD Implementation Plan`).
- **Generator-First** — New code structures are introduced via Nx generators, not ad-hoc scaffolding.
- **Test-Driven** — Every plan and generator defines RED → GREEN → REFACTOR → REGRESSION steps.
- **Parallel-Safe** — Tasks and generators must be MECE (mutually exclusive, collectively exhaustive).
- **Auditable** — Each AI session runs in a declared chatmode with clear traceability to ADR/PRD/SDS sources.

---

### 💬 Available Chatmodes

| Mode                  | Purpose                                                                                                                                            | Typical Output                                                                      |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| **`/tdd-plan`**       | Converts ADR/PRD/SDS specs into a full multi-phase Test-Driven Development plan. Enforces generator-first policy and Nx orchestration.             | Structured TDD plan with MECE tasks, phase diagrams, and generator spec references. |
| **`/generator-spec`** | Drafts a new generator specification based on a short natural-language request. Classifies as `feature-slice`, `route-contract`, or `data-access`. | Complete `GENERATOR_SPEC.md` ready for review and commit.                           |

---

### ⚙️ Execution Commands

Use these shell recipes during or after AI-assisted sessions:

```bash
# Load full context (ADRs, PRDs, SDSs, instructions)
just ai-context-bundle

# Validate and test all affected projects
pnpm nx run-many -t test -p <affected-projects>

# Run workspace-level validation before merge
just ai-validate
```

---

### 🔍 When to Use Each Mode

| Situation                                    | Recommended Mode  | Output                                                         |
| -------------------------------------------- | ----------------- | -------------------------------------------------------------- |
| You have a feature spec and need a full plan | `/tdd-plan`       | Multi-phase TDD implementation plan                            |
| You need to define a new Nx generator spec   | `/generator-spec` | Generator spec document (no code)                              |
| You are implementing existing specs          | —                 | Follow plan manually; do **not** use chatmodes for direct code |

---

### 🧠 MCP Tooling Integration

Both chatmodes direct agents (human or automated) to use these **MCP servers** for enhanced reasoning:

| Tool         | Purpose                                                                            |
| ------------ | ---------------------------------------------------------------------------------- |
| **context7** | Retrieve contextual excerpts from ADR/PRD/SDS files and prior specs for grounding. |
| **ref**      | Analyze seams, duplication, and MECE boundaries across Nx projects.                |
| **exa**      | Discover 3–5 relevant best-practice examples or standards for reference.           |

MCP usage is **advisory**, not automated — tools guide reasoning and provide context without executing changes.

---

### 🧩 Recommended Workflow

1. **Draft** a generator specification using `/generator-spec`.
2. **Generate** a TDD plan referencing that spec via `/tdd-plan`.
3. **Implement** according to the plan (manual or agent-driven).
4. **Validate** using:

   ```bash
   just ai-validate
   ```

5. **Commit** the spec and plan under version control for traceability.
