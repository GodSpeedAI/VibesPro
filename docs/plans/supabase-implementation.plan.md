# Supabase Integration Implementation Plan

<!-- markdownlint-disable MD028 -->

> Complete the end-to-end type safety pipeline by integrating Supabase as the schema source of truth, implementing database migrations, and establishing a local development stack.

## User Review Required

> [!IMPORTANT]
> **Supabase Project Configuration**
> This plan assumes you want to use **Supabase local development** (Docker-based) rather than connecting to a remote Supabase project. If you prefer to connect to an existing remote Supabase project instead, please specify:
>
> - Project URL
> - Whether to use service role key or anon key
> - Whether migrations should be applied to remote or local only

> [!WARNING]
> **Breaking Changes**
>
> - The current test fixture `database.types.ts` with a simple `User` interface will be replaced with real Supabase-generated types
> - Existing `models.py` will be regenerated from the new schema
> - CI will fail if types are not regenerated after schema changes

> [!CAUTION]
> **Docker Requirement**
> This implementation requires Docker and Docker Compose for the local Supabase stack. Ensure Docker is available in:
>
> - Developer environments (via devbox or host install)
> - CI environments (GitHub Actions runners have Docker pre-installed)

---

## Proposed Changes

### Component 1: Supabase Project Initialization

Initialize Supabase project structure with migrations directory and configuration.

**[NEW]** `supabase/config.toml`

- Supabase project configuration
- Database connection settings
- API settings (JWT secret, anon key, service role key)
- Studio port configuration
- Auth provider settings

**[NEW]** `supabase/migrations/`

- Directory for SQL migration files
- Initial migration: `20250120000000_initial_schema.sql`
    - Create `users` table (id, email, created_at, is_active, updated_at)
    - Create `profiles` table (id, user_id, display_name, avatar_url, bio)
    - Add RLS policies for both tables
    - Create indexes for performance

**[NEW]** `supabase/seed.sql`

- Seed data for local development
- Sample users and profiles
- Test data for CI

---

### Component 2: Docker Compose Stack

Set up local Supabase development environment using Docker Compose.

**[NEW]** `docker/docker-compose.supabase.yml`

Supabase services:

- `db`: PostgreSQL 15 with pgvector extension
- `studio`: Supabase Studio UI (port 54323)
- `auth`: GoTrue authentication server
- `rest`: PostgREST API server
- `realtime`: Realtime subscriptions
- `storage`: S3-compatible object storage
- `imgproxy`: Image transformation
- `meta`: Metadata API
- `functions`: Edge Functions runtime
- Volume mounts for persistence
- Network configuration
- Health checks

**[NEW]** `docker/.env.supabase.example`

- Environment variables template
- JWT secrets, API keys
- Database credentials
- Port configurations
- SOPS-encrypted version: `.env.supabase.sops`

---

### Component 3: Just Task Integration

Add justfile recipes for Supabase operations.

**[MODIFY]** `justfile`

**New recipes:**

```bash
# Start Supabase local stack
supabase-start:
    @echo "🚀 Starting Supabase local stack..."
    docker compose -f docker/docker-compose.supabase.yml up -d
    @echo "✅ Supabase running at http://localhost:54323"

# Stop Supabase stack
supabase-stop:
    @echo "🛑 Stopping Supabase stack..."
    docker compose -f docker/docker-compose.supabase.yml down

# Reset Supabase (stop, remove volumes, start)
supabase-reset:
    @echo "🔄 Resetting Supabase stack..."
    docker compose -f docker/docker-compose.supabase.yml down -v
    just supabase-start
    just db-migrate
    just db-seed

# Check Supabase status
supabase-status:
    @echo "📊 Supabase stack status:"
    docker compose -f docker/docker-compose.supabase.yml ps

# Apply migrations to local database
db-migrate:
    @echo "🗄️ Running Supabase migrations..."
    @if ! command -v supabase >/dev/null 2>&1; then \
        echo ""; \
        echo "❌ supabase CLI not found"; \
        echo ""; \
        echo "Enter devbox shell: devbox shell"; \
        echo "Then retry: just db-migrate"; \
        echo ""; \
        exit 1; \
    fi
    supabase db push
    @echo "✅ Migrations applied successfully"

# Seed local database
db-seed:
    @echo "🌱 Seeding database..."
    @if ! command -v supabase >/dev/null 2>&1; then \
        echo "❌ supabase CLI not found. Enter devbox shell first."; \
        exit 1; \
    fi
    supabase db seed
    @echo "✅ Database seeded successfully"

# Generate migration from schema diff
db-migration-create NAME:
    @echo "📝 Creating new migration: {{NAME}}"
    @if ! command -v supabase >/dev/null 2>&1; then \
        echo "❌ supabase CLI not found. Enter devbox shell first."; \
        exit 1; \
    fi
    supabase migration new {{NAME}}
    @echo "✅ Migration file created in supabase/migrations/"
```

**Update existing `gen-types-ts`:**

```bash
gen-types-ts:
    @echo "🏷️ Generating TypeScript types from Supabase schema..."
    @if ! command -v supabase >/dev/null 2>&1; then \
        echo ""; \
        echo "❌ supabase CLI not found"; \
        echo ""; \
        echo "VibesPro requires Supabase CLI for type generation."; \
        echo ""; \
        echo "To install:"; \
        echo "  1. Enter devbox shell: devbox shell"; \
        echo "  2. Verify installation: supabase --version"; \
        echo ""; \
        echo "If devbox is not installed:"; \
        echo "  curl -fsSL https://get.jetpack.io/devbox | bash"; \
        echo ""; \
        echo "For more information, see: docs/ENVIRONMENT.md"; \
        echo ""; \
        exit 1; \
    fi
    @# Ensure Supabase is running
    @if ! docker compose -f docker/docker-compose.supabase.yml ps | grep -q "db.*running"; then \
        echo "⚠️  Supabase database not running. Starting..."; \
        just supabase-start; \
        sleep 5; \
    fi
    supabase gen types typescript --local --schema public > libs/shared/types/src/database.types.ts
    @echo "✅ TypeScript types generated successfully"
```

---

### Component 4: Template Integration

Ensure generated projects inherit Supabase setup.

**[MODIFY]** `templates/{{project_slug}}/justfile.j2`

- Add same Supabase recipes as main justfile
- Template variables for project-specific configuration

**[NEW]** `templates/{{project_slug}}/docker/docker-compose.supabase.yml.j2`

- Templated Docker Compose file
- Project-specific service names
- Configurable ports

**[NEW]** `templates/{{project_slug}}/supabase/config.toml.j2`

- Templated Supabase configuration
- Project-specific settings

---

### Component 5: CI Integration

Update CI workflows to validate schema and types.

**[MODIFY]** `.github/workflows/type-safety.yml`

**Add new job `supabase-integration`:**

```yaml
supabase-integration:
    name: Supabase Schema & Migration Validation
    runs-on: ubuntu-latest
    services:
        postgres:
            image: supabase/postgres:15.1.0.117
            env:
                POSTGRES_PASSWORD: postgres
            options: >-
                --health-cmd pg_isready
                --health-interval 10s
                --health-timeout 5s
                --health-retries 5
    steps:
        - uses: actions/checkout@v4

        - name: Setup Supabase CLI
          uses: supabase/setup-cli@v1
          with:
              version: latest

        - name: Start Supabase local
          run: |
              supabase init
              supabase start

        - name: Run migrations
          run: supabase db push

        - name: Verify migrations applied
          run: |
              # Check that tables exist
              supabase db diff --use-migra

        - name: Generate types and compare
          run: |
              supabase gen types typescript --local > /tmp/generated-types.ts
              if ! diff -u libs/shared/types/src/database.types.ts /tmp/generated-types.ts; then
                echo "❌ Generated types differ from committed types"
                echo "Run 'just gen-types' locally and commit the changes"
                exit 1
              fi
```

**Update `types-freshness-check` job:**

- Add dependency on `supabase-integration`
- Ensure types are generated from actual Supabase schema, not test fixtures

---

### Component 6: Documentation Updates

**[MODIFY]** `docs/ENVIRONMENT.md`

Add new section: **"Supabase Local Development"**

- Quick start guide
- Docker requirements
- Just commands reference
- Troubleshooting common issues
- Migration workflow
- Type generation workflow

**[MODIFY]** `docs/reports/project_state.md`

Update Gap 1 (lines 121-155):

- Change status from "Generation Implemented, Supabase Integration Pending" to "✅ Complete"
- Move from "Current Gaps & Priorities" to "Production-Ready Capabilities"
- Update "What Exists" section with new components
- Remove "What's Missing" section

**[NEW]** `docs/guides/supabase-workflow.md`

- Complete workflow guide
- Schema-first development process
- Migration creation and application
- Type generation and validation
- CI integration details
- Best practices

---

### Component 7: Testing

**[NEW]** `tests/integration/test_supabase_stack.sh`

ShellSpec test suite:

- Test `just supabase-start` brings up all services
- Test `just supabase-status` shows running containers
- Test `just db-migrate` applies migrations successfully
- Test `just db-seed` populates test data
- Test `just gen-types-ts` generates types from running database
- Test `just supabase-stop` stops all services
- Test `just supabase-reset` clears data and restarts

**[MODIFY]** `tests/unit/test_gen_py_types.py`

- Update test fixtures to use real Supabase schema
- Add test for `profiles` table types
- Verify RLS policy types are handled correctly

---

## Verification Plan

### Automated Tests

#### 1. ShellSpec Integration Tests

**Command:**

```bash
shellspec tests/integration/test_supabase_stack.sh
```

**What it validates:**

- Supabase stack starts successfully
- All services are healthy
- Migrations apply without errors
- Seed data loads correctly
- Type generation works from live database
- Stack stops and resets cleanly

**Prerequisites:**

- Docker and Docker Compose installed
- Supabase CLI available (via devbox)

#### 2. Python Unit Tests

**Command:**

```bash
uv run pytest tests/unit/test_gen_py_types.py -v
```

**What it validates:**

- Python type generator handles new schema
- `users` and `profiles` tables generate correct Pydantic models
- Foreign key relationships are preserved
- Optional fields are properly typed

#### 3. CI Type Safety Workflow

**Command** (runs automatically on PR):

```bash
# Triggered by .github/workflows/type-safety.yml
```

**What it validates:**

- Supabase migrations apply in CI
- Generated TypeScript types match committed types
- Generated Python models match committed models
- No schema drift detected

### Manual Verification

#### 1. Local Development Workflow

**Steps:**

1. Start Supabase: `just supabase-start`
2. Verify Studio UI: Open http://localhost:54323
3. Apply migrations: `just db-migrate`
4. Seed database: `just db-seed`
5. Check data in Studio: Navigate to Table Editor, verify `users` and `profiles` tables exist
6. Generate types: `just gen-types`
7. Verify generated files:
    - `libs/shared/types/src/database.types.ts` contains `Users` and `Profiles` interfaces
    - `libs/shared/types-py/src/models.py` contains `Users` and `Profiles` Pydantic models
8. Stop Supabase: `just supabase-stop`

**Expected outcome:** All commands succeed, types are generated correctly, Studio UI shows tables and data

#### 2. Migration Creation Workflow

**Steps:**

1. Start Supabase: `just supabase-start`
2. Create new migration: `just db-migration-create add_user_roles`
3. Edit migration file in `supabase/migrations/`
4. Apply migration: `just db-migrate`
5. Regenerate types: `just gen-types`
6. Verify Git shows changes to types files

**Expected outcome:** New migration file created, applied successfully, types updated

#### 3. Template Generation Test

**Steps:**

1. Generate test project: `just test-generation`
2. Navigate to test output: `cd test-output`
3. Verify Supabase files exist:
    - `supabase/config.toml`
    - `supabase/migrations/`
    - `docker/docker-compose.supabase.yml`
4. Start Supabase in generated project: `just supabase-start`
5. Verify it works independently

**Expected outcome:** Generated project has complete Supabase setup, can start stack independently

---

## Implementation Checklist

### Phase 1: Core Infrastructure (Day 1)

- [ ] Create `supabase/` directory structure
- [ ] Write initial migration with `users` and `profiles` tables
- [ ] Create `supabase/config.toml` with local dev settings
- [ ] Create `docker/docker-compose.supabase.yml`
- [ ] Create `.env.supabase.example`
- [ ] Test manual Supabase start/stop

### Phase 2: Just Integration (Day 1-2)

- [ ] Add `supabase-start` recipe
- [ ] Add `supabase-stop` recipe
- [ ] Add `supabase-reset` recipe
- [ ] Add `supabase-status` recipe
- [ ] Update `db-migrate` recipe
- [ ] Add `db-seed` recipe
- [ ] Add `db-migration-create` recipe
- [ ] Update `gen-types-ts` to check for running database
- [ ] Test all recipes manually

### Phase 3: Type Generation (Day 2)

- [ ] Start Supabase stack
- [ ] Run migrations
- [ ] Generate TypeScript types from live database
- [ ] Verify types match schema
- [ ] Generate Python models
- [ ] Commit generated types
- [ ] Test `check-types` recipe

### Phase 4: Template Integration (Day 2)

- [ ] Create `templates/{{project_slug}}/supabase/` structure
- [ ] Template `config.toml.j2`
- [ ] Template `docker-compose.supabase.yml.j2`
- [ ] Update `justfile.j2` with Supabase recipes
- [ ] Test template generation
- [ ] Verify generated project can start Supabase

### Phase 5: CI Integration (Day 3)

- [ ] Add `supabase-integration` job to `type-safety.yml`
- [ ] Configure PostgreSQL service
- [ ] Add Supabase CLI setup step
- [ ] Add migration validation
- [ ] Add type freshness check
- [ ] Test CI workflow on PR

### Phase 6: Testing & Documentation (Day 3)

- [ ] Write ShellSpec integration tests
- [ ] Update Python unit tests
- [ ] Update `docs/ENVIRONMENT.md`
- [ ] Update `docs/reports/project_state.md`
- [ ] Create `docs/guides/supabase-workflow.md`
- [ ] Run full test suite
- [ ] Verify all tests pass

---

## Estimated Effort

**Total:** 3 days (24 hours)

- **Day 1:** Core infrastructure + Just integration (8 hours)
- **Day 2:** Type generation + Template integration (8 hours)
- **Day 3:** CI integration + Testing + Documentation (8 hours)

---

## Dependencies

- ✅ Supabase CLI (already in devbox)
- ✅ Docker and Docker Compose (required, not in devbox)
- ✅ Type generation pipeline (already implemented)
- ✅ CI infrastructure (already in place)

---

## Risks & Mitigations

| Risk                                    | Impact | Mitigation                                                       |
| --------------------------------------- | ------ | ---------------------------------------------------------------- |
| Docker not available in dev environment | High   | Document Docker installation, provide devbox overlay if possible |
| Supabase CLI version incompatibility    | Medium | Pin specific Supabase CLI version in devbox.json                 |
| Migration conflicts in team environment | Medium | Document migration workflow, use timestamped filenames           |
| CI resource constraints (Docker in CI)  | Low    | GitHub Actions has Docker pre-installed                          |
| Type generation fails on empty database | Low    | Ensure seed data is applied before type generation               |

---

## Success Criteria

- [ ] `just supabase-start` brings up local Supabase stack
- [ ] `just db-migrate` applies all migrations successfully
- [ ] `just gen-types` generates types from live database
- [ ] Generated types match actual database schema
- [ ] CI validates type freshness on every PR
- [ ] Template-generated projects include Supabase setup
- [ ] All tests pass (ShellSpec, pytest, CI)
- [ ] Documentation is complete and accurate
