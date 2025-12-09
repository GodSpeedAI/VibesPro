---
description: "Temporal database workflow for AI learning and architectural decisions"
applyTo: "temporal_db/**,tools/ai/**,tools/temporal-db/**"
kind: instructions
domain: ai-memory
precedence: 25
---

# Temporal Database (Institutional Memory)

The temporal database stores architectural decisions, patterns, and AI learning data. **Query it before major decisions to learn from past choices.**

## Purpose

- **Before implementing**: Check if similar patterns exist
- **Before refactoring**: Review past decisions and their outcomes
- **After implementing**: Record successful patterns and anti-patterns
- **During debugging**: Learn what worked/failed previously

## Core Workflow

```
┌──────────────────────────────────────────────────────────────────┐
│                    AI-Assisted Development                        │
├──────────────────────────────────────────────────────────────────┤
│  1. QUERY      → Check temporal_db for relevant patterns/ADRs    │
│  2. IMPLEMENT  → Follow hexagonal architecture                    │
│  3. RECORD     → Store successful patterns for future reference   │
│  4. LEARN      → Anti-patterns tracked to prevent recurrence      │
└──────────────────────────────────────────────────────────────────┘
```

## Data Model

```rust
// Stored in redb (embedded key-value database)
SpecificationType { ADR, PRD, SDS, TS }   // Spec documents
Pattern { Success, AntiPattern, Neutral }  // Recognized patterns
Decision { Proposed, Accepted, Rejected }  // Architectural decisions
```

## Commands

```bash
# Setup (builds CLI, downloads models, initializes DB)
just setup-ai

# Query from CLI
just temporal-ai-query "hexagonal architecture patterns"
just temporal-ai-stats

# Maintenance
just db-backup
```

## Querying (Before Implementation)

```python
# Python adapter for AI tools
from libs.prompt_optimizer.infrastructure.temporal_db import RedbTemporalDatabaseAdapter

async def check_existing_patterns(pattern_name: str):
    db = RedbTemporalDatabaseAdapter("./temporal_db")
    await db._ensure_initialized()

    # Check if this pattern has been tried before
    existing = await db.query_patterns(pattern_name)

    if existing:
        print(f"Found {len(existing)} related patterns:")
        for p in existing:
            print(f"  - {p.name}: {p.pattern_type} (seen {p.frequency}x)")
```

```rust
// Direct Rust usage
use temporal_db::{initialize_temporal_database, SpecificationType};

async fn query_decisions() -> anyhow::Result<()> {
    let repo = initialize_temporal_database("./temporal_db/specs.db").await?;

    // Get all ADRs
    let adrs = repo.query_by_type(SpecificationType::ADR).await?;

    for adr in adrs {
        println!("ADR: {} - {}", adr.id, adr.title);
    }

    Ok(())
}
```

## Recording Patterns (After Implementation)

```rust
// Record a successful pattern
let pattern = Pattern {
    id: uuid::Uuid::new_v4().to_string(),
    name: "Port-first Repository Design".to_string(),
    pattern_type: PatternType::Success,
    description: "Define repository interface before implementation".to_string(),
    examples: vec!["libs/orders/application/ports/order-repository.port.ts".to_string()],
    frequency: 1,
    last_seen: Utc::now(),
};

repo.store_pattern(&pattern).await?;
```

```rust
// Record an anti-pattern
let anti_pattern = Pattern {
    name: "Domain importing infrastructure".to_string(),
    pattern_type: PatternType::AntiPattern,
    description: "Domain layer had direct dependency on pg Pool".to_string(),
    // This helps AI avoid the same mistake
};
```

## Integration Points

### With AI Workflows

The temporal database integrates with chat modes and prompts:

```bash
# Generate context that includes temporal knowledge
just ai-context-bundle

# The bundle includes patterns from temporal_db
# Referenced by: docs/ai_context_bundle/patterns.json
```

### With Generator Post-Hooks

```python
# hooks/post_gen.py
def record_generation_result(success: bool, generator_name: str):
    """Record whether generation succeeded for learning."""
    # Stored in temporal_db for future reference
    db.store_observation(
        generator=generator_name,
        success=success,
        context=current_context
    )
```

## When to Query

| Scenario                  | Query                                 |
| ------------------------- | ------------------------------------- |
| Adding new domain entity  | "domain entity patterns for {domain}" |
| Choosing database adapter | "repository implementation patterns"  |
| Designing API endpoints   | "API design decisions ADR"            |
| Refactoring legacy code   | "anti-patterns in {area}"             |
| Performance optimization  | "performance patterns that worked"    |

## Key Files

- `temporal_db/lib.rs` - Rust database core
- `temporal_db/repository.rs` - CRUD operations
- `temporal_db/schema.rs` - Data models
- `temporal_db/python/` - Python bindings
- `tools/temporal-db/init.py` - CLI utilities
- `tools/ai/advice-cli.ts` - AI advice with temporal context

## Best Practices

1. **Query before implementing** - Check for existing patterns
2. **Record after success** - Store what worked
3. **Track anti-patterns** - Prevent repeating mistakes
4. **Link to specs** - Connect patterns to ADRs/PRDs
5. **Review periodically** - Archive outdated patterns

See also: `temporal_db/AGENT.md`, `temporal_db/README.md`, `ai-workflows.instructions.md`
