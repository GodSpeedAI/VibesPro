---
name: context-routing
description: Intelligently routes requests to the correct context instructions and documentation files. Use this skill to determine which AGENT.md, guide, or technical instruction file is most relevant for a user's request.
license: Complete terms in LICENSE.txt
---

# Context Routing

This skill routes user requests to the most appropriate context instructions (`AGENT.md` files) and documentation.

## Core Logic

1. **Analyze Intent**: Determine if the request is about Business Logic, Interfaces, Testing, DevOps, Specs, Tools, or Templates.
2. **Select Context**: Map the intent to the corresponding primary context file:
   - Business Logic -> `libs/AGENT.md`
   - Interfaces/Apps -> `apps/AGENT.md`
   - Testing/QA -> `tests/AGENT.md`
   - DevOps/Infra -> `ops/AGENT.md`
   - Specs/Docs -> `docs/AGENT.md`
   - Tools/Scripts -> `tools/AGENT.md`
   - Templating -> `templates/AGENT.md`
3. **Refine Mapping**: If the request is specific, identify granular instruction files (e.g., `security.instructions.md`).

## Routing Table

| Intent             | Primary Context  | Keywords                                    |
| :----------------- | :--------------- | :------------------------------------------ |
| **Domain Logic**   | `libs/AGENT.md`  | use case, entity, domain, business rule     |
| **UI/API**         | `apps/AGENT.md`  | controller, view, react, cli, endpoint      |
| **Testing**        | `tests/AGENT.md` | test, mock, tdd, e2e, unit                  |
| **Deployment**     | `ops/AGENT.md`   | docker, k8s, terraform, logfire, monitoring |
| **Specifications** | `docs/AGENT.md`  | prd, sds, adr, spec, requirement            |
| **Tooling**        | `tools/AGENT.md` | script, automation, validation, generator   |

## Usage

When a user asks "How do I add a new API endpoint?", route to:

- `apps/AGENT.md` (Primary)
- `hexagonal-architecture.instructions.md` (Secondary)

When a user asks "Where do I put this business rule?", route to:

- `libs/AGENT.md` (Primary)
