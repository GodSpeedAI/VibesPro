# Architecture Guide

VibesPro is a **modular monorepo** using Nx for orchestration. Dependencies flow inward following hexagonal architecture principles.

## Architectural Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Applications                          │
│  apps/web  │  apps/api  │  apps/cli  │  apps/mobile         │
├─────────────────────────────────────────────────────────────┤
│                    Infrastructure Layer                      │
│  libs/infrastructure/*  (adapters, repositories, clients)   │
├─────────────────────────────────────────────────────────────┤
│                     Application Layer                        │
│  libs/application/*  (use cases, services, ports)           │
├─────────────────────────────────────────────────────────────┤
│                       Domain Layer                           │
│  libs/domain/*  (entities, value objects, domain events)    │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component      | Purpose                                        |
| -------------- | ---------------------------------------------- |
| `templates/`   | Copier/Jinja2 templates for project generation |
| `generators/`  | Nx generators for scaffolding libs/apps        |
| `libs/`        | Shared libraries (hexagonal layers)            |
| `tools/`       | Development utilities (TypeScript + Python)    |
| `temporal_db/` | Institutional memory (Rust + redb)             |
| `ops/`         | Observability (Vector, OpenObserve, Logfire)   |

## Design Principles

1. **Hexagonal Architecture**: Dependencies point inward only: `infrastructure → application → domain`. Domain is pure—no I/O, no frameworks.

2. **Generator-First**: Check for existing Nx generators before writing new code manually.

3. **Spec Traceability**: All changes trace to specifications in `docs/specs/`.

4. **Temporal Memory**: Query institutional memory before major architectural decisions.

5. **Type Safety**: TypeScript strict mode, Python mypy strict, Rust compiler checks.

## Data Flow

```
User Request → Copier CLI → Template Engine (Jinja2) → Generated Project
                    ↓
              copier.yml (questions/validation)
                    ↓
              hooks/post_gen.py (post-generation setup)
```

**Type Generation Flow**:

```
Supabase Schema → TypeScript types → Python Pydantic models
```

## Technology Stack

| Technology | Version | Purpose                        |
| ---------- | ------- | ------------------------------ |
| Node.js    | ≥20     | Runtime, build tools           |
| TypeScript | 5.x     | Type-safe JavaScript           |
| Python     | ≥3.11   | Tooling, type generation       |
| Rust       | stable  | Temporal database, performance |
| Nx         | latest  | Monorepo orchestration         |
| Copier     | 9.x     | Template engine                |
| Supabase   | local   | Database + auth                |

## Non-Functional Requirements

### Performance

- Template generation < 30s
- Nx build with cache < 60s
- Generator execution < 5s

### Observability

- OpenTelemetry traces via Vector
- PII redaction before export
- Logfire + OpenObserve sinks

### Security

- Secrets via SOPS (age encryption)
- No credentials in `.vscode/*.json`
- Pre-commit security checks

## Architectural Decision Records (ADR)

ADRs are located in `docs/specs/` with format `{ADR-NNN}_{title}.md`. Use `propose-adr.prompt.md` when proposing new decisions.

Key ADRs:

- ADR-0001: Core Agent System
- ADR-0002: Hexagonal Architecture
- ADR-0003: Temporal Database

## Extensibility and Maintenance

### Adding New Generators

```bash
just generator-new my-generator domain
```

### Adding New Libraries

Use generator-first approach:

```bash
pnpm exec nx g @nx/js:lib my-lib --directory=libs/domain
```

### Modifying Templates

1. Edit files in `templates/{{project_slug}}/`
2. Run `just test-generation` to validate
3. Commit with spec traceability
