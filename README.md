# 🚀 VibesPro – AI-Enhanced Hexagonal Architecture Generator

[![CI](https://github.com/SPRIME01/Vibes-Pro/actions/workflows/ci.yml/badge.svg)](https://github.com/SPRIME01/Vibes-Pro/actions/workflows/ci.yml)
[![License: MPL 2.0](https://img.shields.io/badge/License-MPL%202.0-brightgreen.svg)](https://opensource.org/licenses/MPL-2.0)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org)
[![Python](https://img.shields.io/badge/Python-3.12%2B-blue)](https://www.python.org)
[![Rust](https://img.shields.io/badge/Rust-1.75%2B-orange)](https://www.rust-lang.org)

> **Generator-first platform combining HexDDD’s production-ready hexagonal architecture with VibePDK’s AI acceleration, now backed by a sled-powered temporal learning stack.**

## Overview

VibesPro merges HexDDD’s disciplined Domain-Driven Design monorepo with VibePDK’s AI-assisted developer workflows. The template-first approach produces Nx workspaces with domain-centric libraries, synchronized TypeScript/Python tooling, and an embedded temporal knowledge base that learns from every architectural decision teams make.

### Why teams use VibesPro

- Launch full hexagonal, DDD-aligned Nx monorepos with ready-to-ship apps and bounded-context libraries in minutes.
- Capture architectural decisions, prompt analytics, and AI feedback in a sled-backed temporal database for continuous learning.
- Ship consistent, type-safe APIs and domain models across TypeScript and Python with single-source-of-truth generators.
- Operate under specification-driven, TDD-friendly guardrails that keep CI, documentation, and templates from drifting.

---

## Feature Pillars

### Generator-First Scaffolding

- Copier templates in `templates/{{project_slug}}/` assemble application, domain, infrastructure, and interface layers out of the box.
- Nx generators in `generators/service/` compose reusable domain features and enforce dependency direction.
- Conditional Jinja2 templates support multi-framework apps (Next.js, Remix, Expo) and FastAPI service adapters without runtime coupling.
- GitHub workflow, prompt, and instruction assets ship with generated projects so teams inherit best-practice automation on day one.

### Temporal AI Learning (sled-powered)

- The Rust crate in `temporal_db/` persists specifications, architectural patterns, and decision logs using the embedded [`sled`](https://docs.rs/sled/latest/sled/) database.
- Python prompt optimization flows (`libs/prompt-optimizer/infrastructure/temporal_db.py`) use the `SledTemporalDatabaseAdapter`, falling back to deterministic JSON/SQLite stores when the binding is unavailable.
- Template assets under `templates/tools/prompt-optimizer/` wire the sled adapter into generated projects, enabling on-device learning loops and historical prompt analysis.
- CLI utilities (`python tools/temporal-db/init.py …`, `scripts/measure_tokens_enhanced.py`) seed, inspect, and exercise the sled store so AI suggestions improve over time.

### Developer Experience & Automation

- A task-oriented `justfile` wraps pnpm, uv, and Nx; build/test targets auto-detect whether to use Nx run-many or direct commands.
- `just spec-guard` chains documentation, prompt, and specification linters (see `tests/integration/generated-ci-regression.test.ts`), mirroring CI guardrails locally.
- `tools/ai/context-manager.ts` implements token-aware context orchestration, integrating with AI providers while respecting budget constraints.
- GitHub Actions templates in `.github/workflows/` (copied from VibePDK) run markdown lint, prompt validation, and regression suites for generated repos.

### Unified Type & Domain Model Safety

- `tools/type-generator/` converts Supabase/PostgreSQL schemas into synchronized TypeScript and Python types, with validation harnesses in `tools/type-generator/tests`.
- Domain libraries under `templates/{{project_slug}}/libs` enforce strict hexagonal boundaries, using DTOs, ports, and adapters to guarantee separation of concerns.
- Type gates (`uv run mypy`, `pnpm lint`, `just types-validate`) prevent `any` leaks and keep cross-language models aligned.

### Documentation & Governance

- Specification packs live in `docs/mergekit/` (ADR, PRD, SDS, TS) with traceability matrices enforced by `just spec-matrix`.
- AI execution guardrails are documented in `AGENTS.md` and `docs/aiassist/AI_TDD_PLAN.md`, ensuring every change references governing specs.
- Docs tooling (`tools/docs/generator.py`) produces multi-format documentation; optional Pandoc support enables HTML/Docx export.

---

## Getting Started

### Prerequisites

- **Node.js 18+** with `corepack` enabled (pnpm is provisioned automatically).
- **Python 3.12+** with [`uv`](https://github.com/astral-sh/uv) installed for dependency management.
- **Rust 1.75+** (`rustup toolchain install stable`) to compile sled-backed temporal services.
- **copier 9.0+** (`uv tool install copier`) for project generation.
- **just** task runner ([installation instructions](https://github.com/casey/just#installation)).

### Bootstrap the workspace

```bash
git clone https://github.com/SPRIME01/Vibes-Pro.git
cd Vibes-Pro
corepack enable
just setup  # Installs pnpm deps, syncs uv environment, and ensures Copier is available

# Seed the sled temporal database with baseline specifications (optional but recommended)
python tools/temporal-db/init.py init --project-name "My VibesPro Demo"
```

### Generate a project scaffold

```bash
copier copy . ../my-awesome-project   --data-file tests/fixtures/test-data.yml   --defaults --force
```

### Validate your toolchain

```bash
cd ../my-awesome-project
just setup           # Install generated project dependencies (pnpm + uv)
just build           # Build all libraries & apps (auto-detects Nx)
just test            # Run unit + integration suites
just spec-guard      # Mirrors CI guardrails locally
python tools/temporal-db/init.py status  # Inspect sled/SQLite temporal store health
```

---

## Repository Layout

```text
VibesPro/
├── templates/                # Copier templates and reusable tooling bundles
│   ├── {{project_slug}}/      # Full project scaffold (apps, libs, configs, workflows)
│   ├── docs/                  # Documentation templates & MkDocs layouts
│   └── tools/prompt-optimizer # AI prompt optimizer packaging (sled-aware)
├── libs/
│   └── prompt-optimizer/      # Python prompt optimizer with sled temporal adapter
├── generators/                # Nx generators for extending template capabilities
│   └── service/
├── temporal_db/               # Rust crate + schemas powering sled temporal storage
│   ├── repository.rs
│   ├── python/                # Async Python facade & types for sled-backed data
│   └── schema.rs
├── tools/
│   ├── ai/                    # Context manager + AI orchestration utilities
│   ├── temporal-db/           # CLI scripts for initializing & backing up sled data
│   ├── type-generator/        # Cross-language schema-to-type pipeline
│   └── docs/                  # Documentation build + link checking scripts
├── tests/
│   ├── integration/           # Copier generation, CI workflow, and prompt guard tests
│   ├── temporal/              # Temporal DB contract and regression suites
│   └── unit/                  # Python + TypeScript unit tests
└── docs/
    ├── mergekit/              # ADR/PRD/SDS/TS governing specs
    └── aiassist/               # AI-assisted TDD planning artefacts
```

---

## Temporal Learning Database

VibesPro standardises on [`sled`](https://docs.rs/sled/latest/sled/) for temporal learning so architectural decisions, prompt telemetry, and optimization feedback remain local, queryable, and fast.

- **Rust core (`temporal_db/repository.rs`)** – Manages specification storage, architectural pattern analysis, and decision logging with sled key-spaces (`spec:*`, `pattern:*`, `change:*`).
- **Python adapters** – `libs/prompt-optimizer/infrastructure/temporal_db.py` talks to sled via the `SledTemporalDatabaseAdapter`, providing JSON/SQLite fallbacks when bindings are missing so generation tests stay deterministic.
- **Tooling scripts** – `python tools/temporal-db/init.py` seeds baseline ADRs, patterns, and decision history. Subcommands include `init`, `status`, and `backup` (`--db-path` defaults to `./temporal_db/project_specs.db`).
- **Prompt analytics** – `scripts/measure_tokens_enhanced.py` demonstrates using the sled-backed adapter to persist prompt token metrics and optimization outcomes.

> **Tip:** Add the `temporal_db/` directory to your generated project’s `.gitignore` if you prefer to keep temporal learning data local to each developer machine.

---

## Tooling & Automation

| Command | Purpose |
|---------|---------|
| `just setup` | Installs Node (pnpm) and Python (uv) dependencies and ensures Copier availability. |
| `just dev` | Launches all serve targets via Nx run-many with parallelism tuned for monorepos. |
| `just build` | Auto-detects Nx vs direct builds, compiling TypeScript and Python packages. |
| `just test` | Runs Python tests (`uv run pytest`), pnpm tests, and template integration suites. |
| `just test-generation` | Generates a project in `../test-output`, builds it, and runs smoke tests. |
| `just spec-guard` | Executes spec matrix generation, prompt linting, Markdown lint, GitHub checks, and Node regression tests (mirrors CI). |
| `just types-generate` / `just types-validate` | Synchronise and verify cross-language type definitions. |
| `python tools/temporal-db/init.py …` | Initialize, inspect, or back up the sled temporal database. |

Shared Nx/just automation is validated by `tests/integration/generated-ci-regression.test.ts` so generated repos remain CI-ready.

---

## Testing & Quality Gates

- **Specification-driven TDD** – Every change traces back to IDs in `docs/mergekit/*.md`; regression tests assert spec coverage.
- **Unit tests** – `uv run pytest` (Python) and `pnpm test` (TypeScript) run from `tests/unit/` and package-level suites.
- **Integration & E2E** – `tests/integration/template-smoke.test.ts` and `generated-ci-regression.test.ts` exercise full Copier generation, workflow configuration, and spec guardrails.
- **Temporal DB tests** – `temporal_db/lib.rs` includes async sled integration tests; run `cargo test --manifest-path temporal_db/Cargo.toml` when modifying Rust storage logic.
- **Static analysis** – `uv run mypy`, `uv run ruff`, `pnpm lint`, and `python tools/validate-templates.py` enforce strict typing and template health.
- **Performance** – `tests/performance/` and `just benchmark` (if enabled) ensure project generation and builds stay within SLA (<30s generation, <2m build for standard templates).

---

## Documentation & Specifications

- Governing specs: `docs/mergekit/ADR.md`, `PRD.md`, `SDS.md`, `TS.md`, and `IMPLEMENTATION-PLAN.md`.
- Agent + TDD instructions: `AGENTS.md`, `docs/aiassist/AI_TDD_PLAN.md`.
- Run `just docs-generate` to rebuild documentation (installs Markdown outputs; Pandoc enables HTML/Docx/Epub variants—see note below).
- `just spec-matrix` produces traceability matrices consumed by CI for requirement coverage.
- Prompt + instruction assets live under `.github/` templates and are linted by `pnpm prompt:lint`.

> **Pandoc note:** `tools/docs/generator.py` emits Markdown by default. Install `pandoc` if you need HTML, Docx, or Epub outputs; otherwise the script falls back to Markdown while printing a warning.

---

## Supported Generators & Frameworks

| Frontend | Backend | Database | Mobile |
|----------|---------|----------|--------|
| Next.js 14+ | FastAPI | PostgreSQL | Expo |
| Remix | Flask | MySQL | React Native |
| React 19 | Django | SQLite | - |

Templates detect your selections via Copier answers and only materialise the relevant apps, adapters, and infrastructure wiring.

---

## Roadmap & Status

### Current Release: 0.1.0 (Phase 5)

- ✅ Foundation: Copier scaffolds, Nx/just hybrid build system, CI workflows.
- ✅ Sled temporal database integration across Rust crates, Python adapters, and prompt optimizer templates.
- ✅ AI context manager + prompt optimizer tooling bundled with generated projects.
- 🚧 Advanced AI pattern prediction and context heuristics for long-running projects.
- 📋 Template marketplace & custom generator catalog (design in progress).

### Upcoming Milestones

| Version | Focus | Target |
|---------|-------|--------|
| 0.2.0 | Deeper sled analytics, performance tuning, context heuristics | Q1 2025 |
| 0.3.0 | Template marketplace, additional domain generators, observability packs | Q2 2025 |
| 1.0.0 | Production certification, comprehensive documentation refresh | Q3 2025 |

---

## Contributing

We welcome contributions from engineers, architects, and AI practitioners.

1. `just setup` to install toolchains; ensure Rust, pnpm, and uv are available.
2. Pick an issue referencing specification IDs (e.g. `MERGE-TASK-003`, `ADR-MERGE-002`).
3. Follow RED → GREEN → REFACTOR → REGRESSION; add or update tests before changing templates or tooling.
4. Reference governing specs in commit messages and PR descriptions.
5. Run `just spec-guard` and `just test-generation` before opening a pull request.

See `CONTRIBUTING.md` for style guidance and branching conventions.

---

## License & Credits

- Licensed under the **Mozilla Public License 2.0** – see `LICENSE` for details.
- Built on the shoulders of **HexDDD** (hexagonal + DDD patterns) and **VibePDK** (AI-enhanced template accelerator).
- Sled database integration inspired by ongoing community work around embedded, high-performance temporal stores.

---

## Success Metrics

- ⚡ 95% faster setup time (minutes vs weeks for enterprise-grade scaffolding).
- 🎯 100% architecture compliance enforced by automated checks.
- 🧠 >80% acceptance rate for AI-suggested architectural improvements once sled learning stabilises.
- 📊 Generation time <30s and build time <2m for the standard project template.

---

## Helpful Links

- Project documentation entry point: `docs/README.md`
- AI workflow reference: `docs/vibecoding/README.md`
- Temporal DB management: `python tools/temporal-db/init.py --help`
- Sample Copier answers: `tests/fixtures/test-data.yml`
- CI regression expectations: `tests/integration/generated-ci-regression.test.ts`
