# 🚀 VibesPro – AI-Enhanced Hexagonal Architecture Generator


**AI-assisted, generator-first platform for building hexagonal architecture applications with confidence and speed.**

[![CI](https://github.com/SPRIME01/Vibes-Pro/actions/workflows/ci.yml/badge.svg)](https://github.com/SPRIME01/Vibes-Pro/actions/workflows/ci.yml)
[![License: MPL 2.0](https://img.shields.io/badge/License-MPL%202.0-brightgreen.svg)](https://opensource.org/licenses/MPL-2.0)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org)
[![Python](https://img.shields.io/badge/Python-3.12%2B-blue)](https://www.python.org)
[![Rust](https://img.shields.io/badge/Rust-1.75%2B-orange)](https://www.rust-lang.org)

VibesPro helps product teams launch production-ready applications that follow hexagonal architecture and domain-driven design from day one. Templates, automation, and an embedded temporal knowledge base combine to guide daily work while leaving teams in full control of their code.

### At a Glance

- **Launch faster:** Generate complete Nx monorepos with apps, bounded contexts, and tests in minutes.
- **Stay aligned:** Guardrails keep architecture, documentation, and AI workflows consistent across teams.
- **Learn continuously:** A redb-backed temporal intelligence layer captures decisions and improves future suggestions.
- **Ship safely:** Type-safe generators, strict CI gates, and optional security hardening help production stay stable.

---

## Core Capabilities

### Generator-First Scaffolding

- Copier templates assemble layered applications covering interface, application, domain, and infrastructure code.
- Nx generators compose reusable capabilities and enforce dependency direction across the workspace.
- Jinja2 conditionals only materialise the frameworks and adapters you select, keeping output lean and dependency-free.
- GitHub workflow assets and prompt guidance are generated alongside code so teams inherit automation immediately.

### Temporal Intelligence with redb

- The Rust crate in `temporal_db/` stores architectural decisions, prompt analytics, and learning signals using the embedded [`redb`](https://docs.rs/redb/latest/redb/) database.
- Python tooling (`libs/prompt-optimizer/infrastructure/temporal_db.py`) provides async adapters so AI workflows collect insights without external services.
- Template assets under `templates/tools/prompt-optimizer/` wire the temporal database into generated projects for on-device learning loops.
- CLI utilities such as `python tools/temporal-db/init.py` seed and inspect the knowledge base, helping teams monitor improvement over time.

### Developer Experience & Automation

- A task-focused `justfile` coordinates pnpm, uv, Cargo, and Nx targets, adapting to local or CI environments.
- `just spec-guard` chains documentation, template, and prompt linters, mirroring the checks enforced in CI.
- `tools/ai/context-manager.ts` manages token budgets and context assembly for AI integrations.
- GitHub Actions in `.github/workflows/` run markdown lint, prompt validation, type checks, and regression suites for generated repositories.

### Unified Domain & Type Safety

- `tools/type-generator/` converts database schemas into synchronised TypeScript and Python types with thorough validation harnesses.
- Domain libraries in `templates/{{project_slug}}/libs` enforce ports, adapters, and DTO boundaries to preserve hexagonal architecture.
- Strict `uv run mypy`, `uv run ruff`, `pnpm lint`, and `python tools/validate-templates.py` workflows prevent type or template drift.

### Security Hardening (Optional)

- `libs/security/src/secure_db.rs` wraps redb with XChaCha20-Poly1305 encryption-at-rest.
- TPM-backed key sealing and distroless container baselines can be toggled during generation for regulated environments.
- Security validation targets (`just security-test`, `just security-scan`) keep hardened builds under watch.

---

## Architecture Snapshot

| Layer | Purpose | Included Assets |
|-------|---------|-----------------|
| Interface | Entry points for web, API, CLI, and event workloads | Next.js/Remix frontends, FastAPI adapters, CLI starters |
| Application | Use cases, service orchestration, boundary DTOs | Nx generators for use cases, CQRS-ready workflows |
| Domain | Entities, value objects, domain events, domain services | Template-driven libraries per bounded context |
| Infrastructure | Database adapters, messaging integrations, external services | Redb storage, messaging clients, observability hooks |
| Tooling | Developer experience and AI learning | Temporal DB crate, context manager, docs automation |

---

## Getting Started

1. Ensure `pnpm`, `uv`, `rustup`, and `just` are installed.
2. Clone the repository and run `just setup` to install toolchains and dependencies.
3. Generate a project using Copier or invoke specific Nx generators to add features.
4. Run `just test-generation` to validate freshly generated output before committing.

> Need a full walkthrough? See `docs/README.md` and the tutorials in `docs/how-to/`.

---

## Key Commands

| Command | Purpose |
|---------|---------|
| `just setup` | Install Node.js, Python, and Rust toolchains plus workspace dependencies. |
| `just spec-guard` | Run documentation, prompt, and template validators prior to CI. |
| `just test-generation` | Exercise Copier templates and verify generated projects remain healthy. |
| `pnpm nx run-many --target=test` | Execute TypeScript test suites across affected packages. |
| `uv run pytest` | Run Python unit and integration tests. |
| `cargo test --manifest-path temporal_db/Cargo.toml` | Validate the redb-backed temporal database crate. |
| `python tools/temporal-db/init.py --help` | Inspect or seed the temporal knowledge base. |

Shared Nx and just automation is covered by `tests/integration/generated-ci-regression.test.ts` so generated repositories remain CI-ready.

---

## Quality & Testing

- **Specification-driven TDD**: Each change maps to IDs in `docs/mergekit/` and related specification folders.
- **Unit coverage**: `uv run pytest` and `pnpm test` keep domain logic and utilities trustworthy.
- **Integration & E2E**: `tests/integration/template-smoke.test.ts` and `generated-ci-regression.test.ts` exercise full template output and CI expectations.
- **Temporal DB checks**: Rust and Python adapters ship with async tests; run `cargo test` and `uv run pytest -k temporal_db` when storage logic changes.
- **Static analysis**: `uv run mypy`, `uv run ruff`, `pnpm lint`, and `python tools/validate-templates.py` enforce type safety and template health.
- **Performance**: Benchmarks under `tests/performance/` ensure project generation stays under 30 seconds and builds under 2 minutes for reference workloads.

---

## Documentation Map

- Project overview: `docs/README.md`
- Architecture reference: `docs/ARCHITECTURE.md`
- Specification index: `docs/spec_index.md`
- Temporal database guidance: `docs/TEMPORAL-DB-MIGRATION-SUMMARY.md`
- AI workflow playbooks: `docs/aiassist/`
- Tutorials and task guides: `docs/how-to/`

Run `just docs-generate` to rebuild documentation bundles. Pandoc (optional) enables HTML, Docx, and Epub outputs.

---

## Roadmap & Status

### Current Release: 0.1.0 (Phase 5)

- ✅ Foundation: Copier scaffolds, Nx/just hybrid build system, CI workflows.
- ✅ Redb temporal database integration across Rust crates, Python adapters, and prompt optimizer templates.
- ✅ AI context manager and prompt optimizer tooling bundled with generated projects.
- 🚧 Advanced AI pattern prediction and long-running context heuristics.
- 📋 Template marketplace and custom generator catalog (design in progress).

### Upcoming Milestones

| Version | Focus | Target |
|---------|-------|--------|
| 0.2.0 | Redb analytics, performance tuning, context heuristics | Q1 2025 |
| 0.3.0 | Template marketplace, additional domain generators, observability packs | Q2 2025 |
| 1.0.0 | Production certification and documentation refresh | Q3 2025 |

---

## Contributing

We welcome contributions from engineers, architects, and AI practitioners.

1. Run `just setup` and confirm Rust, pnpm, and uv are available.
2. Select an issue referencing specification IDs (e.g. `MERGE-TASK-003`, `ADR-MERGE-002`).
3. Follow RED → GREEN → REFACTOR → REGRESSION; write or update tests before adjusting templates or tooling.
4. Reference relevant specs in commit messages and PR descriptions.
5. Execute `just spec-guard` and `just test-generation` before submitting a pull request.

See `CONTRIBUTING.md` for code style and branching conventions.

---

## License & Credits

- Licensed under the **Mozilla Public License 2.0** – see `LICENSE` for full terms.
- Built by the VibesPro community with thanks to contributors who shaped the generator-first, AI-assisted workflow.
- redb integration informed by ongoing community research into embedded, high-performance temporal stores.

---

## Success Metrics

- ⚡ 95% faster setup time (minutes instead of weeks for enterprise-grade scaffolding).
- 🎯 100% architecture compliance enforced by automated checks.
- 🧠 >80% acceptance rate for AI-suggested architectural improvements once redb learning stabilises.
- 📊 Generation time <30 seconds and build time <2 minutes for the standard project template.

---

## Helpful Links

- Project docs entry point: `docs/README.md`
- Temporal DB tooling: `python tools/temporal-db/init.py --help`
- Sample Copier answers: `tests/fixtures/test-data.yml`
- CI regression expectations: `tests/integration/generated-ci-regression.test.ts`
