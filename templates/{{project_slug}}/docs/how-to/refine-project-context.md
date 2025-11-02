---
description: "How to refine project context for AI Copilot"
applies_to: "generated projects"
related_specs:
    - AI_PRD-001
    - DEV-ADR-002
---

# How to Refine Project Context for AI Copilot

As your project evolves, you should update the "Codebase Context" section in
`.github/copilot-instructions.md` to help AI assistants understand your specific business
domain and technical architecture.

## Why This Matters

The codebase context section provides AI assistants with:

-   **Business purpose**: What problem your application solves
-   **Domain structure**: Your bounded contexts and business areas
-   **Technical stack**: Frameworks, databases, and key integrations
-   **Architectural patterns**: Notable design decisions and patterns

This context helps Copilot:

-   Generate more relevant code suggestions
-   Understand your domain terminology
-   Respect your architectural constraints
-   Suggest appropriate patterns for your stack

## When to Update

Update your project context when:

-   ✨ Adding new bounded contexts or domains
-   🔧 Introducing new technologies (databases, message queues, etc.)
-   🏗️ Making significant architectural changes
-   🔌 Integrating with new third-party services
-   📦 Decomposing into microservices
-   🎯 Pivoting business focus or features

## Method 1: Conversational Refinement (Recommended)

Use the built-in prompt for a guided conversation:

```bash
# In VS Code, open chat and run:
@workspace .github/prompts/project.describe-context.prompt.md
```

**The prompt will ask you about:**

1. Business purpose and target users
2. Main bounded contexts and domains
3. Technology stack additions
4. Architectural patterns and decisions

**Then it will:**

-   Generate a concise 2-4 sentence description
-   Show you a diff of the changes
-   Update `.github/copilot-instructions.md` for you

### Example Flow

```text
You: @workspace .github/prompts/project.describe-context.prompt.md

Copilot: [Asks questions about your project]

You: This is a customer support platform with AI-powered ticket routing.
     Main domains: ticketing, users, ai-suggestions, analytics.
     We added Redis for caching and integrate with OpenAI and SendGrid.
     We use event-driven patterns for ticket state changes.

Copilot: [Generates description and shows diff]

You: Looks good, apply it!

Copilot: [Updates the file]
```

## Method 2: Manual Update

If you prefer direct editing, update lines 10-14 in `.github/copilot-instructions.md`:

```markdown
## Codebase Context

**You are assisting with** [BUSINESS PURPOSE]. This application follows
[ARCHITECTURE_STYLE] architecture with domain-driven design, organized around
bounded contexts: [LIST_DOMAINS]. The technology stack includes [FRONTEND],
[BACKEND], [DATABASE], and [KEY_INTEGRATIONS]. [NOTABLE_PATTERNS].
```

### Template Structure

Replace the bracketed sections:

-   **[BUSINESS PURPOSE]**: 1-2 sentences about what the app does
-   **[ARCHITECTURE_STYLE]**: hexagonal, microservices, event-driven, etc.
-   **[LIST_DOMAINS]**: Comma-separated bounded contexts
-   **[FRONTEND]**: Next.js, Remix, Expo, etc.
-   **[BACKEND]**: FastAPI, Express, Django, etc.
-   **[DATABASE]**: PostgreSQL, MySQL, MongoDB, etc.
-   **[KEY_INTEGRATIONS]**: Redis, Temporal, Stripe, SendGrid, etc.
-   **[NOTABLE_PATTERNS]**: CQRS, event sourcing, saga pattern, etc.

### Example

```markdown
## Codebase Context

**You are assisting with** a customer support platform that uses AI to suggest
responses and automate ticket routing. This application follows hexagonal
architecture with domain-driven design, organized around bounded contexts:
ticketing, user-management, ai-suggestions, and analytics. The technology stack
includes Next.js (frontend), FastAPI (backend), PostgreSQL (database), Redis
(caching), and integrates with OpenAI for AI suggestions and SendGrid for email
notifications. The system implements event-driven patterns for ticket state
changes and uses background workers for AI processing.
```

## Best Practices

### Keep It Concise

-   2-4 sentences maximum
-   Focus on what makes your project unique
-   Avoid implementation details (those belong in code comments)

### Be Specific

-   ❌ "A web application for users"
-   ✅ "A customer support platform for SaaS companies"

### Mention Architecture Patterns

-   Event-driven architecture
-   CQRS/Event Sourcing
-   Saga pattern for distributed transactions
-   Background job processing
-   Real-time features (WebSockets, SSE)

### Include Key Integrations

AI assistants can better suggest code when they know your integrations:

-   Payment processing (Stripe, PayPal)
-   Authentication (Auth0, Supabase Auth)
-   Email/SMS (SendGrid, Twilio)
-   AI services (OpenAI, Anthropic)
-   Observability (Datadog, Sentry)

### Update Regularly

-   Set a reminder to review quarterly
-   Update after major architectural changes
-   Review after adding new domains

## Validation

After updating, verify the context is helpful:

1. **Ask Copilot to summarize your project:**

    ```plaintext
    @workspace What is this application about?
    ```

2. **Request domain-specific code:**

    ```plaintext
    Create a use case for [your domain]
    ```

3. **Check architectural awareness:**

    ```plaintext
    What architectural patterns does this project use?
    ```

If Copilot's responses are more relevant and accurate, your context is good!

## Troubleshooting

### Copilot Gives Generic Suggestions

**Problem**: Context is too vague
**Solution**: Add more specific domain terminology and architectural patterns

### Copilot Suggests Wrong Technologies

**Problem**: Technology stack not clear
**Solution**: Explicitly list frameworks, databases, and key integrations

### Copilot Misunderstands Business Domain

**Problem**: Business purpose unclear
**Solution**: Lead with a clear problem statement and target users

## Related Resources

-   [Architecture Decision Records](../docs/ADR/) - Detailed architectural decisions
-   [Domain Documentation](../docs/domains/) - Deep dives into each bounded context
-   [System Design Specification](../docs/SDS.md) - Complete system architecture
-   [Copilot Instructions](../copilot-instructions.md) - Full AI assistant configuration

---

**Pro Tip**: Keep a changelog of context updates in your ADR to track how your project's description evolves over time.
