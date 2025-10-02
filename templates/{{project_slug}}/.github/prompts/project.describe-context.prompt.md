---
description: "Gather project context to update Copilot instructions"
mode: "chat"
model: "gpt-4o"
thread: "project-setup"
instructions:
  - general
  - context
---

# Project Context Interview

I need to update the codebase context section in `.github/copilot-instructions.md` to accurately describe this project as it has evolved.

## Current Context

Let me first read the current description:

```typescript
// Read current copilot-instructions.md file
const currentContext = await readFile(".github/copilot-instructions.md");
```

## Questions for You

Please answer these questions to help me generate an accurate, concise description:

### 1. Business Purpose

**What is the primary purpose of this application?**

- What problem does it solve?
- Who are the primary users?
- What makes this project unique?

_Example: "A SaaS platform for managing customer support tickets with AI-powered response suggestions"_

### 2. Domain Architecture

**What are the main bounded contexts/domains in your application?**

- List the core business domains (e.g., user-management, billing, inventory)
- Are there any complex domain interactions worth highlighting?

_Current domains detected: {{ primary_domains }}_

### 3. Technology Stack Evolution

**Has your technology stack evolved beyond the initial setup?**

- New databases or caching layers (Redis, Elasticsearch, etc.)?
- Message queues or event streaming (RabbitMQ, Kafka)?
- Third-party integrations (Stripe, SendGrid, Auth0)?
- Workflow engines (Temporal, Airflow)?
- Monitoring/observability tools?

_Current stack: {{ app_framework }}, {{ backend_framework }}, {{ database_type }}_

### 4. Architectural Highlights

**Are there any architectural decisions or patterns worth highlighting?**

- Event-driven architecture?
- CQRS implementation?
- Microservices decomposition?
- Real-time features (WebSockets, Server-Sent Events)?
- Background job processing?

## Output

Based on your answers, I'll generate a 2-4 sentence description that includes:

1. **Business purpose** (what it does, who it's for)
2. **Architectural approach** (hexagonal + DDD with key patterns)
3. **Technical stack** (frameworks, databases, integrations)
4. **Domain complexity** (bounded contexts and notable interactions)

### Example Output

```markdown
## Codebase Context

**You are assisting with** a customer support platform that uses AI to suggest responses and automate ticket routing. This application follows hexagonal architecture with domain-driven design, organized around bounded contexts: ticketing, user-management, ai-suggestions, and analytics. The technology stack includes Next.js (frontend), FastAPI (backend), PostgreSQL (database), Redis (caching), and integrates with OpenAI for AI suggestions and SendGrid for email notifications. The system implements event-driven patterns for ticket state changes and uses background workers for AI processing.
```

## Action

After reviewing your input, I'll:

1. **Update** `.github/copilot-instructions.md` (lines 10-14) with the new description
2. **Preserve** all other instructions and formatting
3. **Show you** a diff for review before applying

---

**Ready?** Please answer the questions above, and I'll generate your updated context description.
