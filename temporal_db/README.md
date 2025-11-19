# Temporal Database (redb)

Embedded temporal database for storing architectural decisions, patterns, and AI learning data in VibesPro.

**Note**: Migrated from tsink/sled to redb in TASK-017 (PHASE-006) for better long-term stability and active maintenance.

## Overview

The temporal database uses [redb](https://docs.rs/redb/) for storing time-series data related to:

- **Specifications**: ADRs, PRDs, SDS documents
- **Architectural Patterns**: Proven design patterns and their context
- **Decision Points**: Historical choices and their rationale
- **Changes**: Time-series change tracking

## Structure

### Tables

```rust
const SPECIFICATIONS_TABLE: TableDefinition<&str, &[u8]> = TableDefinition::new("specifications");
const PATTERNS_TABLE: TableDefinition<&str, &[u8]> = TableDefinition::new("patterns");
const CHANGES_TABLE: TableDefinition<&str, &[u8]> = TableDefinition::new("changes");
```

### Key Format

- **Specifications**: `spec:{identifier}:{timestamp_nanos}`
- **Patterns**: `pattern:{id}:{timestamp_nanos}`
- **Changes**: `change:{spec_id}:{timestamp_nanos}`

All values are JSON-serialized structs stored as byte slices.

## Configuration

Database is configured at runtime (no environment variables needed for basic usage):

```rust
let db_path = "./temporal_db/project_specs.db";
let repo = initialize_temporal_database(db_path).await?;
```

## Usage

### Rust (Direct)

```rust
use temporal_db::{initialize_temporal_database, SpecificationRecord, SpecificationType};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize repository
    let mut repo = initialize_temporal_database("./temporal_db/specs.db").await?;

    // Store specification
    let spec = SpecificationRecord::new(
        SpecificationType::ADR,
        "ADR-001".to_string(),
        "Use Event Sourcing".to_string(),
        "We will use event sourcing...".to_string(),
        Some("architect@example.com".to_string()),
    );

    repo.store_specification(&spec).await?;

    // Retrieve latest specification
    let latest = repo.get_latest_specification("ADR", "ADR-001").await?;

    repo.close().await?;
    Ok(())
}
```

### Python (via Adapter)

```python
from libs.prompt_optimizer.infrastructure.temporal_db import RedbTemporalDatabaseAdapter

async def example():
    # Initialize adapter (uses JSON/SQLite fallback if redb bindings unavailable)
    db = RedbTemporalDatabaseAdapter("./temporal_db")
    await db._ensure_initialized()

    # Store prompt analysis
    await db.store_prompt_analysis(prompt, timestamp)
```

## CLI Tools

See `/tools/temporal-db/` for management utilities:

```bash
# Initialize with baseline specifications
python tools/temporal-db/init.py init

# Check database status
python tools/temporal-db/init.py status

# Backup database
python tools/temporal-db/init.py backup --output ./backups/
```

## Testing

Run the temporal database tests:

```bash
cargo test --lib
```

## Migration from sled/tsink

VibesPro migrated to redb in TASK-017 for better maintenance and stability.

### Key Differences

| Aspect           | sled/tsink   | redb                           |
| ---------------- | ------------ | ------------------------------ |
| **Transactions** | Implicit     | Explicit (begin_write/commit)  |
| **Table Model**  | Key prefixes | Named tables (TableDefinition) |
| **Maintenance**  | Unmaintained | Actively maintained            |

See `/docs/TEMPORAL-DB-MIGRATION-SUMMARY.md` for complete migration details.

## References

- **redb Documentation**: https://docs.rs/redb/
- **Migration Summary**: `/docs/TEMPORAL-DB-MIGRATION-SUMMARY.md`
- **PHASE-006 Checklist**: `/docs/aiassist/PHASE-006-CHECKLIST.md` (TASK-017)
