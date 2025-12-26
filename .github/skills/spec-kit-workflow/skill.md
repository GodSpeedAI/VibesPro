---
name: spec-kit-workflow
description: Spec-Driven Development workflow using VibesPro conventions
tags: [planning, product, sdd]
---

# Spec-Kit Workflow Skill

Orchestrates the Spec-Driven Development (SDD) workflow, adapting spec-kit's methodology to VibesPro conventions.

## Commands

### Feature Development (spec-kit core)

| Command              | Description                                        | Output Path                               |
| -------------------- | -------------------------------------------------- | ----------------------------------------- |
| `/vibepro.specify`   | Create feature specification from natural language | `docs/specs/<context>/<feature>/spec.md`  |
| `/vibepro.clarify`   | Clarify ambiguities in specification               | Updates existing `spec.md`                |
| `/vibepro.plan`      | Generate technical implementation plan             | `docs/specs/<context>/<feature>/plan.md`  |
| `/vibepro.tasks`     | Break plan into executable tasks                   | `docs/specs/<context>/<feature>/tasks.md` |
| `/vibepro.implement` | Execute tasks to build feature                     | Implementation files                      |

### Document Types (VibesPro format)

| Command        | Description                          | Output Path                             |
| -------------- | ------------------------------------ | --------------------------------------- |
| `/vibepro.prd` | Create Product Requirements Document | `docs/specs/<context>/<feature>/prd.md` |
| `/vibepro.adr` | Create Architecture Decision Record  | `docs/specs/<domain>/<topic>/adr.md`    |
| `/vibepro.sds` | Create Software Design Specification | `docs/specs/<context>/<feature>/sds.md` |

## Workflow

### Feature Development Flow

```
/vibepro.specify → spec.md
       ↓
/vibepro.clarify (optional)
       ↓
/vibepro.plan → plan.md, data-model.md, contracts/
       ↓
/vibepro.tasks → tasks.md
       ↓
/vibepro.implement → working code
```

### Document Type Flow

```
/vibepro.prd → prd.md (what & why)
       ↓
/vibepro.adr → adr.md (decisions)
       ↓
/vibepro.sds → sds.md (how)
       ↓
/vibepro.tasks → tasks.md
```

## Integration Points

### Upstream (spec-kit)

- Templates: `libs/tools/spec-kit/templates/`
- Commands: `libs/tools/spec-kit/templates/commands/`
- Scripts: `libs/tools/spec-kit/scripts/`

### VibesPro Adaptation

- Path mapping via [adapter.md](./adapter.md)
- Interface contract in [port.md](./port.md)
- Constitution: `.github/instructions/sdd_constitution.instructions.md`

### Agent Handoffs

- `spec.author.agent.md`: For spec authoring assistance
- `planner.core.agent.md`: For implementation planning
- `implementer.core.agent.md`: For code implementation

## Usage

Use in VS Code Chat:

```
/vibepro.specify Build a user authentication system with OAuth2 support
```

The skill will:

1. Determine bounded context (e.g., `auth`)
2. Create feature directory at `docs/specs/auth/oauth2-login/`
3. Generate `spec.md` using spec-kit template
4. Assign PRD ID for traceability
