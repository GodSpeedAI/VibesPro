# Temporal Database Storage

This directory contains the tsink time-series database files for storing specifications and AI learning patterns.

## Structure

- `specifications.tsinkdb` - Stores temporal specification records (ADR, PRD, SDS, TS)
- `patterns.tsinkdb` - Stores AI learning patterns and context history
- `migrations/` - Database schema migrations
- `backups/` - Automated backup storage

## Configuration

The temporal database is configured through environment variables:

```env
TSINK_DB_PATH=./temporal_db
TSINK_COMPRESSION=gorilla
TSINK_RETENTION_DAYS=365
TSINK_BACKUP_INTERVAL=24h
```

## Usage

```python
from temporal_db.repository import TemporalRepository

# Initialize repository
repo = TemporalRepository("./temporal_db")

# Store specification
await repo.store_specification(spec_record)

# Query recent decisions
recent = await repo.get_recent_specifications("ADR", days=30)
```

See `/tools/temporal-db/` for management utilities.
