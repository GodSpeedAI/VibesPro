# Supabase Workflow Guide

This guide covers the end-to-end type safety pipeline using Docker Compose for local Supabase development.

## Overview

VibesPro uses a local Supabase stack (via Docker Compose) as the single source of truth for database schema. TypeScript and Python types are automatically generated from this schema, ensuring type safety from database to UI.

**Specification Reference**: DEV-SDS-020, DEV-PRD-020

## Prerequisites

- **Docker**: v20+ with Docker Compose plugin
- **just**: Command runner (`cargo install just`)
- **psql**: PostgreSQL client (for migrations)

## Quick Start

```bash
# Start the local Supabase stack
just supabase-start

# Apply database migrations
just db-migrate

# Seed with test data (optional)
just db-seed

# Generate types
just gen-types

# When done, stop the stack
just supabase-stop
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Type Safety Pipeline                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐  │
│  │   PostgreSQL    │───▶│   gen_ts_from   │───▶│  TypeScript     │  │
│  │   (Docker)      │    │   _pg.py        │    │  Types          │  │
│  │                 │    │                 │    │  (.ts)          │  │
│  └─────────────────┘    └─────────────────┘    └────────┬────────┘  │
│         ▲                                               │           │
│         │                                               ▼           │
│  ┌──────┴──────────┐                        ┌─────────────────────┐ │
│  │   Migrations    │                        │   gen_py_types.py   │ │
│  │   (.sql)        │                        │         ▼           │ │
│  └─────────────────┘                        │   Python Pydantic   │ │
│                                             │   Models (.py)      │ │
│                                             └─────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Just Commands Reference

### Stack Management

| Command                | Description                                                   |
| ---------------------- | ------------------------------------------------------------- |
| `just supabase-start`  | Start the Docker Compose Supabase stack                       |
| `just supabase-stop`   | Stop the stack                                                |
| `just supabase-reset`  | Reset stack (removes all data, reapplies migrations and seed) |
| `just supabase-status` | Show container status                                         |
| `just supabase-logs`   | Tail container logs                                           |

### Database Operations

| Command                         | Description                                      |
| ------------------------------- | ------------------------------------------------ |
| `just db-migrate`               | Apply all migrations from `supabase/migrations/` |
| `just db-seed`                  | Run seed script `supabase/seed.sql`              |
| `just db-migration-create NAME` | Create new migration file                        |
| `just db-psql`                  | Connect to database via psql                     |

### Type Generation

| Command             | Description                               |
| ------------------- | ----------------------------------------- |
| `just gen-types`    | Generate both TypeScript and Python types |
| `just gen-types-ts` | Generate TypeScript types only            |
| `just gen-types-py` | Generate Python Pydantic models only      |
| `just check-types`  | Verify types match database schema        |

### Developer Convenience

| Command                  | Description                                        |
| ------------------------ | -------------------------------------------------- |
| `just supabase-studio`   | Open Studio UI in browser                          |
| `just supabase-health`   | Check health of all containers with ports          |
| `just db-tables`         | List all tables in public schema                   |
| `just db-describe TABLE` | Show table schema (e.g., `just db-describe users`) |

## Directory Structure

```
.
├── docker/
│   ├── docker-compose.supabase.yml  # Docker Compose configuration
│   ├── .env.supabase.example        # Environment template
│   └── .env.supabase                # Local environment (gitignored)
├── supabase/
│   ├── config.toml                  # Supabase configuration
│   ├── migrations/                  # SQL migration files
│   │   └── 20250101000000_initial_schema.sql
│   └── seed.sql                     # Seed data
├── libs/shared/
│   ├── types/src/
│   │   └── database.types.ts        # Generated TypeScript types
│   └── types-py/src/
│       └── models.py                # Generated Python models
└── tools/scripts/
    ├── gen_ts_from_pg.py           # TypeScript generator
    └── gen_py_types.py             # Python generator
```

## Development Workflow

### 1. Making Schema Changes

1. Create a new migration:

   ```bash
   just db-migration-create add_user_roles
   ```

2. Edit the migration file in `supabase/migrations/`:

   ```sql
   -- Migration: add_user_roles
   ALTER TABLE public.users ADD COLUMN role VARCHAR(20) DEFAULT 'member';
   ```

3. Apply the migration:

   ```bash
   just db-migrate
   ```

4. Regenerate types:

   ```bash
   just gen-types
   ```

5. Commit both migration and types:
   ```bash
   git add supabase/migrations/ libs/shared/types/ libs/shared/types-py/
   git commit -m "feat(db): add user roles field"
   ```

### 2. Testing Schema Changes

The CI pipeline validates that:

- Migrations apply successfully to a fresh database
- Generated types match the committed types
- TypeScript and Python types are in sync

Run locally:

```bash
just supabase-reset  # Fresh database with migrations
just gen-types       # Regenerate types
just check-types     # Verify types are up to date
```

### 3. Using Generated Types

#### TypeScript

```typescript
import { Users, Database } from '@vibespro/shared-types';

// Use the interface directly
const user: Users = {
  id: 'uuid-here',
  email: 'test@example.com',
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Use the Database namespace for Supabase client patterns
type UserRow = Database['public']['Tables']['users']['Row'];
```

#### Python

```python
from libs.shared.types_py.src.models import Users

# Validate data with Pydantic
user = Users(
    id="uuid-here",
    email="test@example.com",
    is_active=True,
    created_at="2025-01-01T00:00:00Z",
    updated_at="2025-01-01T00:00:00Z",
)

# Access validated fields
print(user.email)
```

## CI Integration

The `.github/workflows/type-safety.yml` workflow validates:

1. **TypeScript Type Check**: Compiles TypeScript with strict mode
2. **Python Type Check**: Runs mypy with strict mode
3. **Supabase Integration**:
   - Starts PostgreSQL container
   - Applies migrations
   - Generates types from live database
   - Compares with committed types
   - Runs type safety tests

## Using Supabase Studio

Supabase Studio provides a web-based UI for database management.

### Opening Studio

```bash
# Open Studio in your default browser
just supabase-studio
```

Studio runs on port 54323 by default (configurable via `STUDIO_PORT` in `docker/.env.supabase`).

### Studio Features

- **Table Editor**: Browse and edit data in your tables
- **SQL Editor**: Run custom SQL queries
- **Database Structure**: View schemas, tables, and relationships
- **API Documentation**: Auto-generated REST API docs

### Dynamic Ports

VibesPro uses dynamic port detection. If you change ports in `docker/.env.supabase`, all commands will automatically use the correct ports:

```bash
# Check actual ports being used
just supabase-health
```

## Troubleshooting

### Docker Issues

**Port conflicts**:

```bash
# Check what's using port 54322
lsof -i :54322

# Use different ports in docker/.env.supabase
POSTGRES_PORT=54332
```

**Container won't start**:

```bash
# Check logs
just supabase-logs

# Reset everything
just supabase-reset
```

### Type Generation Issues

**TypeScript types not generating**:

```bash
# Ensure database is running
just supabase-status

# Check migrations applied
just db-psql
\dt  # List tables
```

**Python types out of sync**:

```bash
# Regenerate from TypeScript
just gen-types-py

# Or regenerate both
just gen-types
```

### Migration Issues

**Migration failed**:

```bash
# Check error in logs
just supabase-logs

# Connect to database and inspect
just db-psql
```

**Schema mismatch**:

```bash
# Reset database and reapply
just supabase-reset
```

## Best Practices

1. **Always generate types after schema changes**
2. **Commit migrations and types together**
3. **Use descriptive migration names** (e.g., `add_user_preferences`, `create_orders_table`)
4. **Test locally before pushing** with `just check-types`
5. **Keep migrations idempotent** (use `IF NOT EXISTS`, `IF EXISTS`)

## Related Documentation

- [ENVIRONMENT.md](../ENVIRONMENT.md) - Environment setup
- [Type Safety Specifications](../specs/type-safety/) - DEV-SDS-020, DEV-PRD-020
- [Architecture Overview](../architecture/) - Hexagonal architecture
