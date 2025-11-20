# 🌟 VibesPro – Cognitive Infrastructure Platform

[![CI](https://github.com/GodSpeedAI/VibesPro/actions/workflows/ci.yml/badge.svg)](https://github.com/GodSpeedAI/VibesPro/actions/workflows/ci.yml)
[![License: MPL 2.0](https://img.shields.io/badge/License-MPL%202.0-brightgreen.svg)](https://opensource.org/licenses/MPL-2.0)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org)
[![Python](https://img.shields.io/badge/Python-3.12%2B-blue)](https://www.python.org)
[![Rust](https://img.shields.io/badge/Rust-1.75%2B-orange)](https://www.rust-lang.org)
[![DeepWiki](https://img.shields.io/badge/DeepWiki-View-orange)](https://deepwiki.com/SPRIME01/Vibes-Pro)

---

## 🎯 Why This Exists

**Every new project starts the same way:**

You spend the first week configuring tools, arguing about folder structures, setting up testing frameworks, and debugging "works on my machine" issues. By the time you write your first line of business logic, you're already behind schedule and accumulating technical debt.

**The hidden cost:** Senior developers spend 40% of their time on boilerplate, configuration, and onboarding. New team members take a week to become productive. Architectural decisions get made once and forgotten, leading to inconsistent patterns across projects.

**What if your project came with a full development team already inside it?**

---

## ⚡ What VibesPro Actually Does

**VibesPro deploys a complete software development agency as code.**

One command gives you:

```bash
copier copy gh:GodSpeedAI/VibesPro my-project
```

**In 30 seconds, you have:**

- ✅ **Production-ready monorepo** — Nx 22+ with hexagonal architecture, not empty folders
- ✅ **32+ AI development agents** — Architects, TDD coaches, debuggers, product managers who understand YOUR domain
- ✅ **Institutional memory system** — Rust-based database that remembers every architectural decision
- ✅ **Full observability stack** — OpenTelemetry → Vector → OpenObserve (traces, logs, metrics)
- ✅ **Zero-config environment** — Devbox + Mise + SOPS means "works on my machine" = "works everywhere"
- ✅ **Type-safe by default** — TypeScript strict mode, Python mypy, Rust — all configured and passing

**No more "Week 1: Setup." It's "Hour 1: Ship features."**

---

## 🚀 Try It in 3 Commands

```bash
# 1. Deploy your cognitive infrastructure
copier copy gh:GodSpeedAI/VibesPro my-awesome-project

# 2. Activate the agency (one command handles everything)
cd my-awesome-project && just setup

# 3. Start building
pnpm dev
```

**That's it.** Your AI development team is operational. Your tests pass. Your observability pipeline is running. Your environment is reproducible.

> 💡 **Important:** Don't clone VibesPro directly. Use Copier to **synthesize** a new project. VibesPro is the factory; what you generate is your actual workspace.

---

<details>
<summary><h2>🎯 How It Actually Works (Click to expand)</h2></summary>

### The Three Intelligence Layers

**1. Application Infrastructure (What You See)**

When you run `copier copy`, VibesPro synthesizes:

- Enterprise Nx monorepo with intelligent caching
- Hexagonal architecture with enforced domain boundaries
- Multi-language support (TypeScript, Python, Rust)
- Complete testing setup (Jest, pytest, cargo test)
- Production observability (OpenTelemetry + Vector + OpenObserve)
- Reproducible environments (Devbox + Mise + SOPS)

**2. AI Development Team (What Makes It Smart)**

Your synthesized project includes 32+ specialized agents in `.github/chatmodes/`:

- **System Architect** — Designs scalable patterns
- **TDD Coaches** — `tdd.red`, `tdd.green`, `tdd.refactor` modes
- **Debug Team** — `debug.start`, `debug.repro`, `debug.isolate`, `debug.fix`
- **Product Manager** — Translates requirements into specs
- **Security Analyst** — Audits and hardens code

Each agent has **modular knowledge** (16 instruction files with hierarchical precedence) and **26 workflow protocols** for proven methodologies.

**3. Institutional Memory (What Makes It Learn)**

The `temporal_db/` Rust-based database stores:

- 📋 **Specifications** — PRD, SDS, ADR, Technical Specs with timestamps
- 🎯 **Proven Patterns** — What worked, what failed, and why
- 📊 **Architectural Decisions** — Context, rationale, tradeoffs
- 🔄 **Evolution History** — Time-series tracking of how systems adapt

Query before major decisions: _"What authentication patterns have we validated in production?"_

### What This Means For You

| Before VibesPro                   | After VibesPro                              |
| --------------------------------- | ------------------------------------------- |
| Week 1: Setup configurations      | Hour 1: Writing business logic              |
| "Works on my machine" chaos       | Reproducible environments everywhere        |
| New dev needs a week to onboard   | New dev productive on day one               |
| Technical debt from day zero      | Best practices embedded from the start      |
| Every project looks different     | Consistent architecture across all projects |
| Architectural decisions forgotten | Institutional knowledge compounds over time |

</details>

---

<details>
<summary><h2>🏗️ What You Get: The Six Platform Systems</h2></summary>

### 1. Application Synthesis Engine

- Architectural intelligence that generates enterprise-grade codebases
- Hexagonal architecture with enforced domain boundaries
- Multi-language synthesis (TypeScript, Python, Rust)
- Nx monorepo orchestration for scalable organization

### 2. AI Development Team

- **32+ Specialized Agents** — System architects, TDD coaches, debuggers, security analysts, product managers
- **Modular Expertise** — 16 domain-specific knowledge systems (MECE organizational principle)
- **26 Workflow Protocols** — Proven methodologies for specs, testing, security, performance
- **Cognitive Context Management** — Intelligent information retrieval and synthesis

### 3. Institutional Memory System

- **Temporal Knowledge Store** — Rust-based redb persistence layer
- **Decision Archaeology** — Complete history of PRD/SDS/ADR/TS with temporal context
- **Pattern Intelligence** — Query organizational knowledge before architectural decisions
- **Evolutionary Understanding** — Tracks how your architecture adapts over time

### 4. Production Observability Infrastructure (v0.3.0)

- **OpenTelemetry Instrumentation** — Distributed tracing with <1µs overhead
- **Vector Data Pipeline** — Transformation, PII redaction, routing
- **OpenObserve Storage** — Long-term analytics and SQL querying
- **Runtime Flags** — Enable/disable with `VIBEPRO_OBSERVE` environment variable

### 5. Development Environment Platform (v0.2.0)

- **Devbox** — Reproducible OS-level toolchain
- **Mise** — Node/Python/Rust version management
- **SOPS** — Secret encryption and management
- **Just** — Cross-platform task orchestration
- **Environment Validation** — 11+ automated tests ensure everything works

### 6. Quality & Compliance System

- **Specification-Driven Development** — Traceability matrix for all changes
- **Generator-First Policy** — Enforced via Nx generators
- **Type Safety** — TypeScript strict mode, Python mypy, Rust compile checks
- **Security Guardrails** — Pre-commit hooks, PII redaction, input validation

</details>

---

<details>
<summary><h2>📊 Measured Impact: The Numbers</h2></summary>

### Synthesized Application Quality

- ✅ **100% architecture compliance** — Hexagonal boundaries enforced at synthesis time
- 🎯 **Zero manual configuration** — All tooling pre-configured (Nx, ESLint, Jest, mypy)
- ⚡ **<30 second synthesis** — Complete application infrastructure deployed
- 🚀 **<2 minute operational readiness** — From synthesis to passing tests
- 🛠️ **Environment determinism** — Devbox + Mise = guaranteed reproducibility

### AI Development System

- 🤖 **32+ specialized chat modes** — TDD, debugging, specs, product planning
- 📋 **16 modular instructions** — MECE principle with precedence stacking
- 🧠 **Temporal learning** — Query past architectural decisions
- 🎯 **Generator-first enforcement** — Prevents inconsistent code structure

### Observability (v0.3.0)

- 🚀 **<1µs span overhead** — Minimal performance impact
- 📊 **Full distributed tracing** — End-to-end request tracking
- 🔄 **Vector pipeline** — <3% CPU at 1k spans/s
- ⚡ **Runtime flags** — Zero overhead when `VIBEPRO_OBSERVE=0`

### Developer Experience

- ⏱️ **95% faster setup** — Minutes vs weeks
- 🔧 **1-2 hours saved per project** — No dependency debugging
- 🎯 **CI reliability** — Environment validation catches issues early
- 📚 **Living documentation** — Specs, ADRs, traceability maintained

</details>

---

<details>
<summary><h2>🛠️ Platform Operations: Complete Command Reference</h2></summary>

### For Application Developers (Using VibesPro)

```bash
# Bootstrap your development platform
copier copy gh:GodSpeedAI/VibesPro my-project

# Activate platform components
cd my-project
just setup              # Initialize all infrastructure layers
just doctor             # Validate platform health
just test-env           # Verify environment configuration

# Operate with AI development team
pnpm exec nx list       # Discover available generators
pnpm exec nx g @nx/js:lib user-domain  # AI-orchestrated scaffolding
export VIBEPRO_OBSERVE=1 && pnpm dev   # Start with telemetry active

# Platform quality gates
just spec-guard         # Validate specs, prompts, documentation
just ai-validate        # Lint + typecheck across platform
pnpm nx run-many --target=test --all  # Execute test suite
```

### For Meta-Infrastructure Contributors (Developing VibesPro)

```bash
# Clone the meta-infrastructure repository
git clone https://github.com/GodSpeedAI/VibesPro.git
cd VibesPro
just setup              # Bootstrap development environment

# Meta-infrastructure development
just test-generation    # Test synthesis pipeline
just ai-validate        # Validate AI agent system
just prompt-lint        # Lint workflow protocols
just spec-guard         # Full quality compliance gate

# Platform development
just ai-context-bundle  # Generate cognitive context bundles
just ai-scaffold name=@nx/js:lib  # Test generator integration
```

### Observability Operations (v0.3.0)

```bash
just observe-start        # Start Vector edge collector
just observe-stop         # Stop Vector gracefully
just observe-logs         # Tail Vector logs
just observe-validate     # Validate Vector config
just observe-test-all     # Run all observability tests
```

</details>

---

<details>
<summary><h2>🆕 Recent Improvements & Changelog</h2></summary>

### v0.5.0 — CI Environment Optimization (November 2025)

**The Problem We Solved:**
GitHub Actions consistently drifted from local runs—Devbox installs broke, tool versions diverged, and caches were underused—causing flaky env-check/build jobs.

**The Solution:**

- **Composite actions for setup** — new `setup-devbox`, `setup-mise`, and `setup-sops` actions with retries and checksum validation.
- **Single source of truth for versions** — `.github/config/versions.env` keeps Node/Python/SOPS pins in sync across workflows and scripts.
- **Script + workflow cleanup** — CI helpers reorganized under `scripts/{ci,setup,dev}` with updated paths and docs; Rust toolchain pins aligned to repo config.
- **Aggressive caching** — Devbox binaries, mise runtimes, pnpm store, Cargo registry, and uv cache now share consistent keys, cutting runtime 30–50%.
- **Zero-vuln baseline** — patched esbuild, vite, koa, js-yaml, glob, and estree-util-value-to-estree; `pnpm audit` now reports 0 issues.
- **Template parity (reissue)** — generated workspaces ship with root docs (`spec_index.md`, `traceability_matrix.md`, `commit_message_guidelines.md`), validated prompt frontmatter (TDD plans), and web-app scaffolds that always emit `apps/<name>/app/page.tsx` for Nx app router tests.

See `RELEASE_NOTES_v0.5.0.md` for the full breakdown and migration notes.

### v0.3.0 — Production-Ready Observability Stack (October 2025)

**The Problem We Solved:**
Modern applications need visibility into performance, errors, and behavior in production. Teams struggled with fragmented logging, missing traces, and no unified view of system health.

**The Solution:**
A **complete observability pipeline** following industry best practices (OpenTelemetry, Vector, OpenObserve):

✅ **Rust-Native Instrumentation** — `vibepro-observe` crate with OpenTelemetry tracing
✅ **Runtime Feature Flags** — Enable/disable telemetry via `VIBEPRO_OBSERVE` environment variable
✅ **Vector Data Pipeline** — OTLP ingestion, transformation, routing, and buffering
✅ **OpenObserve Storage** — Long-term trace and log storage with SQL querying
✅ **Structured Logging** — JSON logs for Node.js (Pino) and Python (Logfire)
✅ **PII Redaction** — Automatic removal of sensitive data in Vector transforms
✅ **Trace Correlation** — Link logs to distributed traces with trace_id/span_id
✅ **Comprehensive Testing** — 8 test suites validate the entire pipeline
✅ **Complete Documentation** — 630+ lines in `docs/observability/README.md`

**Performance:** <1µs span overhead, <3% CPU at 1k spans/s, zero impact when disabled

---

### v0.2.0 — Development Environment & CI/CD (October 2025)

**The Problem We Solved:**
Inconsistent development environments across machines and fragile CI pipelines caused "works on my machine" issues and failed builds. Teams struggled with tool version mismatches and missing dependencies.

**The Solution:**
Comprehensive development environment setup with automated validation:

✅ **Devbox Integration** — Reproducible dev environments via `devbox.json` configuration
✅ **Mise Tool Management** — Automatic version management for Node, Python, and Rust
✅ **SOPS Secret Management** — Secure handling of environment secrets with encryption
✅ **CI Workflow Improvements** — New `env-check.yml` and `build-matrix.yml` workflows
✅ **Environment Testing Suite** — Comprehensive tests in `tests/env/` validate tool installation
✅ **Just Task Awareness** — Tasks now detect and adapt to local environment configuration
✅ **Volta Coexistence** — Guards prevent conflicts between Volta and Mise
✅ **Complete Documentation** — New `docs/ENVIRONMENT.md` with setup and troubleshooting guides

---

### v0.1.0 — Complete Nx & TypeScript Configuration (October 2025)

**The Problem We Solved:**
Early synthesized applications required manual configuration of Nx, ESLint, Jest, and TypeScript settings. Developers faced daemon crashes, module resolution errors, and missing dependencies that took hours to fix.

**The Solution:**
Synthesized applications now include **complete, production-ready development infrastructure**:

✅ **Nx Workspace** — Fully configured with proper `namedInputs` (no more daemon crashes!)
✅ **TypeScript** — Strict mode enabled with zero compilation errors
✅ **ESLint** — Code quality enforcement with Nx module boundaries
✅ **Jest** — Complete testing framework with sample tests
✅ **All Dependencies** — Everything installed: tslib, ts-jest, @nx/jest, @nx/eslint
✅ **Module Resolution** — Fixed TypeScript bundler/node conflicts
✅ **Error Handling Patterns** — TypeScript strict mode examples included

See: [CHANGELOG.md](CHANGELOG.md) for complete release history.

</details>

---

<details>
<summary><h2>🗺️ Roadmap: What's Coming Next</h2></summary>

### 📜 **v0.4.0 — AI Platform Evolution** (Q4 2025)

Planned:

- 🧠 Enhanced pattern recognition from temporal database
- 📊 Automated architecture validation and suggestions
- 🎯 Context-aware AI recommendations
- ⚡ Performance profiling and optimization toolkit

### 🏗️ **Future** (2026+)

- 🪐 Community knowledge marketplace for organizational patterns
- 🎨 Additional domain synthesizers (auth, e-commerce, analytics)
- 🔌 Extension system for custom agent capabilities
- 🌍 Multi-cloud infrastructure patterns (AWS, Azure, GCP)

</details>

---

<details>
<summary><h2>📚 Documentation & Resources</h2></summary>

### Getting Started

- **📖 [Quick Start](docs/QUICKSTART.md)** — 5-minute setup guide
- **🛠️ [Environment Setup](docs/ENVIRONMENT.md)** — Devbox, Mise, SOPS configuration
- **🤖 [AI Agent Guide](.github/copilot-instructions.md)** — Essential workflows for AI coding

### Architecture & Specs

- **🏛️ [Software Design](docs/specs/)** — System architecture (DEV-SDS specs)
- **📋 [Product Requirements](docs/specs/)** — Feature requirements (DEV-PRD specs)
- **🎯 [Architecture Decisions](docs/specs/)** — ADRs with rationale
- **🔬 [Technical Specifications](docs/specs/)** — Implementation details
- **🗺️ [Traceability Matrix](docs/traceability_matrix.md)** — Spec-to-code mapping

### AI Workflows

- **🤖 [Chat Modes](.github/chatmodes/)** — 32+ specialized personas
- **📝 [Prompts](.github/prompts/)** — 26 reusable templates
- **📋 [Instructions](.github/instructions/)** — 16 modular guidance files
- **🧠 [Temporal Database](temporal_db/README.md)** — Learning system usage

### Observability (v0.3.0)

- **📊 [Observability Guide](docs/observability/README.md)** — 630+ line operational guide
- **📡 OpenTelemetry + Vector + OpenObserve setup**
- **🔐 VRL transforms, PII redaction, sampling**

### Development

- **🔧 [Nx Generators](docs/nx-generators-guide.md)** — Generator-first workflow
- **🧪 [Testing Strategy](docs/testing/)** — TDD, unit, integration, shell tests
- **🔒 [Security Guidelines](.github/instructions/security.instructions.md)** — Security-first practices

</details>

---

<details>
<summary><h2>🤝 Contributing & Community</h2></summary>

We welcome contributions! Whether you're:

- 🐛 Reporting bugs or suggesting features
- 📝 Improving documentation
- 🔧 Fixing issues or adding functionality
- 🎨 Creating new chat modes or prompts

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Philosophy:** Test first, ship confidently, learn continuously.

### Join the Movement

Building VibesPro is a team effort. Whether you're an engineer, architect, or AI enthusiast, there's a place for you.

**Getting involved is easy:**

1. **Start small** — Try generating a project and tell us what surprised you
2. **Share ideas** — Found a pattern worth automating? Open an issue
3. **Contribute code** — Pick a task, follow the guide in `CONTRIBUTING.md`
4. **Spread the word** — Know someone drowning in boilerplate? Send them here

</details>

---

<details>
<summary><h2>📜 License: Understanding Your Rights</h2></summary>

### The Photoshop Rule 🖼️

We follow what we call **"The Photoshop Rule"** — a simple way to understand how you can use VibesPro without getting lost in legal jargon:

> **Think of VibesPro like Photoshop.**
>
> You can use Photoshop to design, paint, or build anything — logos, posters, full digital worlds. You can sell your art, keep it private, or use it inside your company.
>
> What you _can't_ do is **sell Photoshop itself** or offer "Photoshop as a service."

It's the same with VibesPro:

- ✅ **Use VibesPro freely inside your organization** — deploy agencies, build applications, support your development operations
- ✅ **Use it to create outputs** (applications, services, codebases) and use or sell those outputs however you like
- ✅ **Modify and customize** synthesis patterns and agent workflows for your team's needs
- ❌ **Don't resell VibesPro itself** — you can't package it up and offer it as a hosted platform or SaaS to third parties without a commercial license
- ❌ **Don't strip out VibesPro's core** to make a competing cognitive infrastructure service

**Dual License Structure:**

- 🧩 **MPL-2.0 (Open Source)** — for personal, educational, and internal company use
- 💼 **Commercial License** — required if you want to embed, resell, or offer VibesPro as a hosted service

**In short:** Build amazing things with VibesPro. Sell what you build. Just don't sell VibesPro itself.

See `LICENSE` for complete legal terms.

</details>

---

## 🚦 Ready to Start?

```bash
# Deploy your software agency in 30 seconds
copier copy gh:GodSpeedAI/VibesPro my-awesome-project

# Activate and operate
cd my-awesome-project
just setup
pnpm dev
```

Built with ❤️ by the VibesPro community.

**Special thanks** to every contributor who believed that building software could feel less like archaeology and more like artistry.

---

_"The best architecture is the one you don't have to think about—until you need to change it. Then it welcomes you like an old friend."_
