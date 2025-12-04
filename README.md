# 🌟 VibesPro – Cognitive Infrastructure Platform

[![CI](https://github.com/GodSpeedAI/VibesPro/actions/workflows/ci.yml/badge.svg)](https://github.com/GodSpeedAI/VibesPro/actions/workflows/ci.yml)
[![License: MPL 2.0](https://img.shields.io/badge/License-MPL%202.0-brightgreen.svg)](https://opensource.org/licenses/MPL-2.0)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org)
[![Python](https://img.shields.io/badge/Python-3.12%2B-blue)](https://www.python.org)
[![Rust](https://img.shields.io/badge/Rust-1.75%2B-orange)](https://www.rust-lang.org)
[![DeepWiki](https://img.shields.io/badge/DeepWiki-View-orange)](https://deepwiki.com/SPRIME01/Vibes-Pro)

---

## 🎯 The Problem That Shouldn't Exist

**Every new project starts the same way:**

You spend the first week configuring tools, debating folder structures, setting up testing frameworks, and debugging "works on my machine" issues. By the time you write your first line of business logic, you're already behind schedule—and you've just created technical debt that will haunt the project for years.

**The hidden cost is staggering:** Senior developers spend 40% of their time on boilerplate and configuration. New team members need a full week to become productive. Architectural decisions get made once and forgotten, leading to drift and inconsistency across projects.

**What if your project came with an entire development team's worth of expertise already embedded in it—ready to guide every decision?**

---

## ⚡ What VibesPro Gives You

**VibesPro is a Cognitive Infrastructure Platform**—it synthesizes production-ready codebases with enterprise architecture, an embedded AI development team, and institutional memory that compounds over time.

One command:

```bash
copier copy gh:GodSpeedAI/VibesPro my-project
```

**In 30 seconds, you have:**

- ✅ **Production-ready monorepo** — Nx with hexagonal architecture, not empty folders
- ✅ **32+ AI development agents** — Architects, TDD coaches, debuggers, security analysts who understand YOUR domain
- ✅ **Institutional memory** — A Rust-based temporal database that remembers every architectural decision
- ✅ **Full observability stack** — OpenTelemetry → Vector → OpenObserve (traces, logs, metrics)
- ✅ **Zero-config environment** — Devbox + Mise + SOPS = "works everywhere"
- ✅ **Type-safe by default** — TypeScript strict, Python mypy, Rust—all configured and passing
- ✅ **Database layer** — Supabase (Postgres + pgvector) with type generation pipeline

**No more "Week 1: Setup." It's "Hour 1: Ship features."**

---

## 🚀 Try It in 3 Commands

```bash
# 1. Synthesize your cognitive infrastructure
copier copy gh:GodSpeedAI/VibesPro my-awesome-project

# 2. Activate everything (one command handles it all)
cd my-awesome-project && just setup

# 3. Start building
just dev
```

**That's it.** Your AI development team is operational. Your tests pass. Your observability pipeline is running. Your environment is reproducible.

> 💡 **Important:** Don't clone VibesPro directly. Use Copier to **synthesize** a new project. VibesPro is the platform; what you generate is your workspace.

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
- Supabase data layer with automatic type generation

**2. AI Development Team (What Makes It Smart)**

Your synthesized project includes 32+ specialized agents in `.github/agents/`:

- **System Architect** — Designs scalable patterns using CALM methodology
- **TDD Coaches** — `tdd.red`, `tdd.green`, `tdd.refactor` modes for disciplined development
- **Debug Team** — 6-phase workflow: `debug.start` → `debug.repro` → `debug.isolate` → `debug.fix` → `debug.refactor` → `debug.regress`
- **Product Manager** — Translates requirements into traceable specs (PRD/SDS/TS/ADR)
- **Security Analyst** — Audits code with STRIDE threat modeling

Each agent draws from **20 modular instruction files** with hierarchical precedence and **26 workflow protocols** for proven methodologies.

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
- **Modular Expertise** — 20 domain-specific instruction files (MECE organizational principle)
- **26 Workflow Protocols** — Proven methodologies for specs, testing, security, performance
- **Cognitive Context Management** — Intelligent information retrieval and synthesis

### 3. Institutional Memory System

- **Temporal Knowledge Store** — Rust-based redb persistence layer
- **Decision Archaeology** — Complete history of PRD/SDS/ADR/TS with temporal context
- **Pattern Intelligence** — Query organizational knowledge before architectural decisions
- **Evolutionary Understanding** — Tracks how your architecture adapts over time

### 4. Production Observability Infrastructure

- **OpenTelemetry Instrumentation** — Distributed tracing with <1µs overhead
- **Vector Data Pipeline** — Transformation, PII redaction, routing
- **Logfire Integration** — Structured logging with trace correlation
- **OpenObserve Storage** — Long-term analytics and SQL querying
- **Runtime Flags** — Enable/disable with `VIBEPRO_OBSERVE` environment variable

### 5. Data & Environment Platform

- **Supabase Stack** — Postgres + pgvector + RLS via Docker Compose
- **Type Generation Pipeline** — `just gen-types` syncs TypeScript ↔ Python models
- **Devbox** — Reproducible OS-level toolchain
- **Mise** — Node/Python/Rust version management
- **SOPS** — Secret encryption and management
- **Just** — Cross-platform task orchestration

### 6. Quality & Compliance System

- **Specification-Driven Development** — Traceability matrix for all changes
- **Generator-First Policy** — Enforced via Nx generators
- **Type Safety** — TypeScript strict mode, Python mypy, Rust compile checks
- **Security Guardrails** — Pre-commit hooks, PII redaction, input validation
- **6-Phase Debug Workflow** — Structured bug resolution with chat mode guidance

</details>

---

<details>
<summary><h2>📊 Measured Impact</h2></summary>

### Synthesis Quality

| Metric                        | Value                                             |
| ----------------------------- | ------------------------------------------------- |
| Architecture compliance       | 100% — Hexagonal boundaries enforced at synthesis |
| Manual configuration required | Zero — All tooling pre-configured                 |
| Synthesis time                | <30 seconds                                       |
| Time to passing tests         | <2 minutes                                        |

### AI Development System

| Metric                      | Value                                                  |
| --------------------------- | ------------------------------------------------------ |
| Specialized chat modes      | 32+ (TDD, debugging, specs, security)                  |
| Modular instruction files   | 20 with precedence stacking                            |
| Debug workflow phases       | 6 (start → repro → isolate → fix → refactor → regress) |
| Generator-first enforcement | Automatic via Nx                                       |

### Observability Performance

| Metric                   | Value                      |
| ------------------------ | -------------------------- |
| Span overhead            | <1µs                       |
| Vector CPU at 1k spans/s | <3%                        |
| Overhead when disabled   | Zero (`VIBEPRO_OBSERVE=0`) |

### Developer Experience

| Metric                      | Value                  |
| --------------------------- | ---------------------- |
| Setup time reduction        | 95% (minutes vs weeks) |
| Environment debugging saved | 1-2 hours per project  |
| New dev onboarding          | Day 1 productivity     |

</details>

</details>

---

<details>
<summary><h2>🛠️ Command Reference</h2></summary>

### Getting Started (Using VibesPro)

```bash
# Synthesize your project
copier copy gh:GodSpeedAI/VibesPro my-project
cd my-project

# Activate platform
just setup              # Initialize all infrastructure
just doctor             # Validate platform health
just dev                # Start development servers

# AI-assisted development
pnpm exec nx list       # Discover available generators
just ai-scaffold name=@nx/js:lib  # Scaffold new code
just ai-validate        # Run all quality checks

# Database operations
just supabase-start     # Start local Postgres + Studio
just db-migrate         # Apply migrations
just gen-types          # Generate TypeScript + Python types

# Observability
export VIBEPRO_OBSERVE=1
just observe-start      # Start Vector pipeline
just test-logs          # Validate logging pipeline
```

### Contributing to VibesPro

```bash
git clone https://github.com/GodSpeedAI/VibesPro.git
cd VibesPro
just setup

# Development
just test-generation    # Test synthesis pipeline
just ai-validate        # Validate AI agent system
just prompt-lint        # Lint workflow protocols
just spec-guard         # Full quality compliance

# Debug workflow (6 phases)
just debug-start        # Phase 1: Normalize bug report
just debug-repro        # Phase 2: Write failing test
just debug-isolate      # Phase 3: Narrow root cause
just debug-fix          # Phase 4: Minimal fix
just debug-refactor     # Phase 5: Clean up
just debug-regress      # Phase 6: Regression suite
```

</details>

---

<details>
<summary><h2>🆕 Recent Releases</h2></summary>

### v0.5.0 — CI Environment Optimization (November 2025)

**Problem:** GitHub Actions drifted from local runs—Devbox installs broke, tool versions diverged, caches underused.

**Solution:**

- Composite actions for setup (`setup-devbox`, `setup-mise`, `setup-sops`) with retries
- Single source of truth: `.github/config/versions.env`
- Aggressive caching cuts runtime 30–50%
- Zero-vuln baseline (`pnpm audit` reports 0 issues)

### v0.3.0 — Production-Ready Observability (October 2025)

**Problem:** Fragmented logging, missing traces, no unified system health view.

**Solution:**

- Rust-native `vibepro-observe` crate with OpenTelemetry
- Vector data pipeline with PII redaction
- Logfire + OpenObserve for traces and logs
- Runtime flags (`VIBEPRO_OBSERVE`) for zero-overhead disable
- <1µs span overhead, <3% CPU at 1k spans/s

### v0.2.0 — Development Environment (October 2025)

**Problem:** "Works on my machine" chaos, CI/local drift.

**Solution:**

- Devbox + Mise + SOPS stack
- Environment validation test suite
- `just doctor` health checks

### v0.1.0 — Complete Nx & TypeScript Configuration (October 2025)

**Problem:** Manual configuration of Nx, ESLint, Jest, TypeScript took hours.

**Solution:**

- Fully configured Nx workspace (no more daemon crashes)
- TypeScript strict mode, zero compilation errors
- All dependencies pre-installed

See [CHANGELOG.md](CHANGELOG.md) for complete history.

</details>

---

<details>
<summary><h2>🗺️ Roadmap</h2></summary>

### In Progress

- 🧠 Enhanced pattern recognition from temporal database
- 📊 Automated architecture validation and suggestions
- 🎯 Context-aware AI recommendations
- ⚡ Performance profiling and optimization toolkit

### Future

- 🪐 Community knowledge marketplace for organizational patterns
- 🎨 Additional domain synthesizers (auth, e-commerce, analytics)
- 🔌 Extension system for custom agent capabilities
- 🌍 Multi-cloud infrastructure patterns (AWS, Azure, GCP)

</details>

---

<details>
<summary><h2>📚 Documentation</h2></summary>

### Getting Started

- **[Quick Start](docs/QUICKSTART.md)** — 5-minute setup guide
- **[Environment Setup](docs/ENVIRONMENT.md)** — Devbox, Mise, SOPS configuration
- **[AI Agent Guide](.github/copilot-instructions.md)** — Essential workflows

### Architecture

- **[Specifications](docs/specs/)** — PRD, SDS, ADR, Technical Specs
- **[Traceability Matrix](docs/traceability_matrix.md)** — Spec-to-code mapping
- **[CALM Diagrams](architecture/calm/)** — C4 model documentation

### AI Workflows

- **[Agents](.github/agents/)** — 32+ specialized personas
- **[Prompts](.github/prompts/)** — 26 reusable templates
- **[Instructions](.github/instructions/)** — 20 modular guidance files
- **[Temporal Database](temporal_db/README.md)** — Institutional memory

### Operations

- **[Observability](docs/observability/README.md)** — OpenTelemetry + Vector + OpenObserve
- **[Nx Generators](docs/nx-generators-guide.md)** — Generator-first workflow
- **[Security](.github/instructions/security.instructions.md)** — Guardrails and SOPS

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
# Synthesize your cognitive infrastructure
copier copy gh:GodSpeedAI/VibesPro my-awesome-project

# Activate and build
cd my-awesome-project
just setup
just dev
```

Built with ❤️ by the VibesPro community.

---

_"The best architecture is the one you don't have to think about—until you need to change it. Then it welcomes you like an old friend."_
