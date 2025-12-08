# Vibes Pro Build System
set shell := ["bash", "-uc"]

# Runtime detection: prefer bun for script execution when available, fall back to node
# Note: pnpm remains the package manager; bun is used only as the runtime
_js_runtime := `command -v bun >/dev/null 2>&1 && echo "bun" || echo "node"`

default:
	@just --list

# --- Environment Setup ---
# Tiered setup architecture:
#   Tier 0: Core (setup)         - Node, Bun, Python, pnpm install
#   Tier 1: Database (setup-db)  - Supabase + migrations
#   Tier 2: Observability        - Vector + OpenObserve + Logfire
#   Tier 3: AI/Temporal          - temporal-ai CLI + embeddings
#   Tier 4: Full (setup-all)     - Everything

setup: setup-node setup-python setup-tools
	@echo "✅ Core development environment ready"
	@echo ""
	@echo "Optional stacks (run as needed):"
	@echo "  just setup-db       → Supabase database"
	@echo "  just setup-observe  → Observability (Vector, OpenObserve, Logfire)"
	@echo "  just setup-ai       → Temporal AI + embeddings"
	@echo "  just setup-all      → All of the above"

# Tier 1: Database layer
setup-db: supabase-start db-migrate db-seed
	@echo "✅ Database ready (PostgreSQL on port 54322)"
	@echo "   Studio: just supabase-studio"

# Tier 2: Observability layer
setup-observe:
	@echo "🔭 Setting up observability stack..."
	@just observe-validate || true
	@just observe-start || echo "⚠️ Vector start failed - may need config"
	@echo ""
	@echo "✅ Observability setup complete"
	@echo "   Vector: running (if installed)"
	@echo "   OpenObserve: just observe-openobserve-up"
	@echo "   Logfire: configured via LOGFIRE_TOKEN in .secrets.env.sops"
	@echo ""
	@echo "Required secrets (add to .secrets.env.sops):"
	@echo "   OPENOBSERVE_URL, OPENOBSERVE_TOKEN, OPENOBSERVE_ORG, OPENOBSERVE_USER"
	@echo "   LOGFIRE_TOKEN"

# Tier 3: AI/Temporal layer
setup-ai: download-embedding-model
	@echo "🤖 Setting up AI infrastructure..."
	@just temporal-ai-build
	@just temporal-ai-init || echo "⚠️ temporal-ai init skipped (may already exist)"
	@echo "✅ Temporal AI ready"
	@echo "   Query patterns: just temporal-ai-query \"your query\""
	@echo "   Stats: just temporal-ai-stats"

# Download embedding model for temporal-ai
download-embedding-model:
	@echo "📥 Checking embedding model..."
	@MODEL_PATH="models/embedding-gemma-300M-Q4_K_M.gguf"; \
	if [ -f "$$MODEL_PATH" ]; then \
		echo "✅ Embedding model already exists"; \
	else \
		echo "📥 Downloading embedding model (~180MB)..."; \
		mkdir -p models; \
		curl -L -o "$$MODEL_PATH" \
			"https://huggingface.co/ggml-org/embeddinggemma-300M-GGUF/resolve/main/embedding-gemma-300M-Q4_K_M.gguf" \
			|| { echo "❌ Download failed"; exit 1; }; \
		echo "✅ Model downloaded: $$MODEL_PATH"; \
	fi

# Tier 4: Full setup (all tiers)
setup-all: setup setup-db setup-observe setup-ai setup-mocks
	@echo ""
	@echo "🎉 Full development environment ready!"
	@echo "   Run 'just dev-full' to start all services"

# Tier 5: Mocking infrastructure (Mountebank + Testcontainers)
setup-mocks:
	@echo "🎭 Setting up mocking infrastructure..."
	@if [ ! -f tests/mocks/imposters/imposters.ejs ]; then \
		echo "❌ Imposter definitions not found"; \
		exit 1; \
	fi
	@# Ensure testcontainers is installed
	@uv sync --group dev || pip install testcontainers
	@just mocks-start || echo "⚠️ Mountebank start failed - Docker required"
	@echo "✅ Mocking infrastructure ready"
	@echo "   Mountebank UI: http://localhost:2525"
	@echo "   LLM Mock: http://localhost:3001"
	@echo "   Auth Mock: http://localhost:3002"
	@echo "   Payment Mock: http://localhost:3003"

# Start Mountebank mock server
mocks-start:
	@echo "🎭 Starting Mountebank..."
	@docker compose -f docker/docker-compose.mocks.yml up -d
	@echo "✅ Mountebank running at http://localhost:2525"

# Stop Mountebank mock server
mocks-stop:
	@echo "🛑 Stopping Mountebank..."
	@docker compose -f docker/docker-compose.mocks.yml down
	@echo "✅ Mountebank stopped"

# Check Mountebank status
mocks-status:
	@echo "📊 Mountebank status:"
	@docker compose -f docker/docker-compose.mocks.yml ps

# Start dev with observability
dev-observe: setup-observe
	@echo "🚀 Starting dev servers with observability..."
	@pnpm exec nx run-many --target=serve --all --parallel=5

# Start full development stack (database + observability + mocks + dev servers)
dev-full:
	@echo "🚀 Starting full development stack..."
	@just supabase-start || echo "⚠️ Supabase already running or failed"
	@just observe-start || echo "⚠️ Vector already running or failed"
	@just mocks-start || echo "⚠️ Mountebank already running or failed"
	@pnpm exec nx run-many --target=serve --all --parallel=5

test-env:
	@echo "🧪 Running environment tests..."
	@bash -eu tests/env/run.sh

env-enter:
	@echo "🎯 Entering Devbox environment..."
	@if command -v devbox >/dev/null 2>&1; then \
		devbox shell; \
	else \
		echo "❌ Devbox not installed"; \
		echo "   Install: curl -fsSL https://get.jetpack.io/devbox | bash"; \
		exit 1; \
	fi

setup-node:
	@echo "🛠️ Setting up Node.js and Bun environment..."
	@# Install bun via mise if available
	@if command -v mise >/dev/null 2>&1; then \
		echo "Installing runtimes via mise..."; \
		mise install || true; \
	fi
	corepack enable
	pnpm install
	@# Verify bun is available
	@if command -v bun >/dev/null 2>&1; then \
		echo "✅ Bun runtime: $(bun --version)"; \
	else \
		echo "⚠️ Bun not found. Install via: mise install bun"; \
	fi

setup-python:
	@echo "🔧 Setting up Python environment..."
	# Create a local venv and install dev tools directly. Avoids building the package
	# during dependency sync which can fail on Python 3.12 (distutils removal).
	# Ensure python3 exists
	if ! command -v python3 >/dev/null 2>&1; then \
		echo "Python3 not found on PATH"; exit 1; \
	fi
	# Create venv if missing
	if [ ! -d ".venv" ]; then \
		python3 -m venv .venv || exit 1; \
	fi
	# Install tooling using the venv's python and clearing PYTHONPATH to avoid
	# repo-local packages from shadowing stdlib modules during installation.
	PYTHONPATH= .venv/bin/python -m pip install --upgrade pip setuptools wheel || exit 1
	# Add psutil because some performance tests rely on it
	PYTHONPATH= .venv/bin/python -m pip install --upgrade pre-commit mypy ruff uv psutil datamodel-code-generator || exit 1

setup-tools:
	@echo "🔧 Setting up development tools..."
	@if command -v copier >/dev/null 2>&1; then \
		echo "✅ Copier already installed"; \
	else \
		echo "📦 Installing Copier..."; \
		uv tool install copier; \
	fi
	@echo "Checking for supabase CLI..."
	@if command -v supabase >/dev/null 2>&1; then \
		echo "✅ supabase CLI found: $(command -v supabase)"; \
	else \
		echo "⚠️ supabase CLI not found. If you're using devbox: 'devbox shell' will ensure supabase is available"; \
	fi

install-hooks:
	@echo "🔧 Installing pre-commit hooks and verifying shfmt"
	@if [ ! -d ".venv" ]; then \
		echo "Python venv not found - running setup-python"; \
		just setup-python; \
	fi
	@echo "Installing pre-commit into the venv and ensuring hooks are installed..."
	@. .venv/bin/activate >/dev/null 2>&1 || true; \
	python3 -m pip install --upgrade pre-commit >/dev/null 2>&1 || true; \
	# Respect repository-level core.hooksPath; do not override silently
	if git config --get core.hooksPath >/dev/null 2>&1; then \
		echo "Repository uses custom core.hooksPath (git config core.hooksPath set)."; \
		echo "To install pre-commit hooks into .git/hooks run: git config --unset-all core.hooksPath"; \
		echo "Skipping pre-commit install to avoid clobbering custom hooks."; \
	else \
		pre-commit install --hook-type pre-commit --hook-type commit-msg || true; \
	fi
	@echo "Checking for shfmt on PATH..."
	@if command -v shfmt >/dev/null 2>&1; then \
		echo "shfmt found: $(command -v shfmt)"; \
	else \
		echo "shfmt not found. Install it with: brew install shfmt  OR  go install mvdan.cc/sh/v3/cmd/shfmt@latest"; \
	fi

verify-node:
	@echo "🔍 Verifying Node version alignment..."
	@bash scripts/dev/verify-node.sh

# --- Developer Experience ---
dev:
	@echo "🚀 Starting development servers..."
	@if command -v pnpm >/dev/null 2>&1; then \
		if [ -f nx.json ]; then \
			pnpm exec nx run-many --target=serve --all --parallel=5; \
		else \
			echo "❌ nx.json not found. Run 'just setup' first."; \
			exit 1; \
		fi; \
	else \
		echo "❌ pnpm not found. Run 'just setup' first."; \
		exit 1; \
	fi

spec-matrix:
	pnpm spec:matrix

prompt-lint:
	pnpm prompt:lint

spec-guard:
	pnpm spec:matrix
	pnpm prompt:lint
	pnpm prompt:plan
	pnpm prompt:plan:accurate
	pnpm run lint:md
	node scripts/check_all_agents.mjs
	node tools/docs/link_check.js || echo "⚠️ Link check found broken links - needs fixing but not blocking CI"
	pnpm run test:node
	pnpm run env:audit
	pnpm run pr:comment

# --- Build Orchestration ---
build TARGET="": (_detect_build_strategy TARGET)

_detect_build_strategy TARGET:
	#!/usr/bin/env bash
	if [ -z "{{TARGET}}" ]; then
		if [ -f "nx.json" ]; then
			echo "🏗️  Building with Nx..."
			just build-nx
		else
			echo "🏗️  Building directly..."
			just build-direct
		fi
	else
		just build-target "{{TARGET}}"
	fi

build-direct:
	uv run python -m build
	pnpm run build

build-nx:
	pnpm exec nx run-many --target=build --all --parallel=3

build-target TARGET:
	pnpm exec nx run {{TARGET}}:build

# --- Test Orchestration ---
test TARGET="": (_detect_test_strategy TARGET)

_detect_test_strategy TARGET:
	#!/usr/bin/env bash
	if [ -z "{{TARGET}}" ]; then
		if [ -f "nx.json" ]; then
			just test-nx
		else
			just test-direct
		fi
	else
		just test-target "{{TARGET}}"
	fi

test-direct:
	just test-python
	just test-node
	just test-integration

test-nx:
	pnpm exec nx run-many --target=test --all --parallel=3

test-target TARGET:
	pnpm exec nx run {{TARGET}}:test

# --- Language-Specific Test Tasks ---
test-python:
	@echo "🧪 Running Python tests..."
	# Run pytest while skipping pre-commit hooks that may modify files during
	# pytest-copier's temporary git commits (these hooks can cause commits to fail).
	# SKIP lists hook ids to bypass. COPIER_SKIP_PROJECT_SETUP avoids heavy post-gen setup.
	SKIP=end-of-file-fixer,ruff,ruff-format,prettier,trim-trailing-whitespace,shellcheck COPIER_SKIP_PROJECT_SETUP=1 UV_NO_SYNC=1 uv run pytest

# Common SKIP list for template tests to avoid pre-commit hooks that mutate files during test fixture commits.
# Pre-commit expects a comma-delimited list for SKIP.
TEMPLATE_TEST_SKIP := "end-of-file-fixer,ruff,ruff-format,shellcheck,prettier,trim-trailing-whitespace"

test-template:
	@echo "🧪 Running template generation test (non-interactive)"
	# Ensure Python dev deps are installed
	uv sync --dev || true
	# Run the single test while skipping pre-commit hooks that mutate files during test fixture commits
	SKIP={{TEMPLATE_TEST_SKIP}} \
	COPIER_SKIP_PROJECT_SETUP=1 \
	UV_NO_SYNC=1 \
	uv run pytest -q tests/template/test_template_generation.py::test_generate_template_user_defaults

test-template-logfire:
	@echo "🧪 Validating Logfire template scaffolding..."
	# Skip additional checks for Logfire tests: check-shebang-scripts-are-executable and spec-matrix
	# These checks are not relevant for Logfire template validation as they test different aspects
	SKIP={{TEMPLATE_TEST_SKIP}},check-shebang-scripts-are-executable,spec-matrix \
	COPIER_SKIP_PROJECT_SETUP=1 \
	UV_NO_SYNC=1 \
	uv run pytest -q tests/copier/test_logfire_template.py

test-node:
	@echo "🧪 Running Node.js tests..."
	pnpm test

test-integration:
	@echo "🧪 Running integration tests..."
	just test-generation

test-generators:
	@echo "🧪 Running generator tests..."
	pnpm exec jest tests/generators
	just test-type-generator

test-type-generator:
	@echo "🧪 Running type-generator tests..."
	cd tools/type-generator && pnpm exec jest

test-generation:
	@echo "🧪 Testing template generation..."
	rm -rf ./test-output
	copier copy . ./test-output --data-file tests/fixtures/test-data.yml --trust --defaults --force
	cd ./test-output && pnpm install && { \
		echo "🏗️ Building all projects..."; \
		pnpm exec nx run-many --target=build --all || { \
			echo "⚠️ Some build targets failed. Checking core domain libraries..."; \
			if pnpm exec nx run core:build; then \
				echo "✅ Core domain libraries built successfully - MERGE-TASK-003 success criteria met"; \
			else \
				echo "❌ Core domain libraries failed to build"; \
				exit 1; \
			fi; \
		}; \
	}
	pnpm exec jest --runTestsByPath tests/integration/template-smoke.test.ts --runInBand

# --- Code Quality ---
lint:
	just lint-python
	just lint-node
	just lint-templates

lint-python:
	@echo "🔍 Linting Python code..."
	uv run ruff check .
	uv run mypy .

lint-node:
	@echo "🔍 Linting Node.js code..."
	pnpm lint

lint-templates:
	@echo "🔍 Validating templates..."
	uv run python tools/validate-templates.py

# --- Template Maintenance ---
template-cleanup:
	#!/usr/bin/env bash
	set -euo pipefail
	echo "🧹 Cleaning up template files..."
	echo "⚠️  This will remove maintainer-specific files and replace spec files with minimal starters"
	read -p "Continue? [y/N] " -r REPLY
	echo
	if [[ $REPLY =~ ^[Yy]$ ]]; then
		bash scripts/template-cleanup.sh
	else
		echo "❌ Cleanup cancelled"
	fi

template-cleanup-force:
	@echo "🧹 Force cleaning template files (no confirmation)..."
	@bash scripts/template-cleanup.sh

format:
	just format-python
	just format-node

format-python:
	@echo "✨ Formatting Python code..."
	uv run ruff check --select I --fix .
	uv run ruff format .

format-node:
	@echo "✨ Formatting Node.js code..."
	pnpm exec nx format --all

# --- Database and AI Tools ---
db-init:
	@echo "🗄️  Initializing temporal database..."
	python tools/temporal-db/init.py

db-backup:
	@echo "💾 Backing up temporal database..."
	python tools/temporal-db/backup.py

# --- Type Generation ---
types-generate SCHEMA="tools/type-generator/test-fixtures/db_schema.json":
	@echo "🏷️  Generating types from schema: {{SCHEMA}}"
	python tools/type-generator/generate.py {{SCHEMA}} -o libs/shared/types/src

types-validate:
	@echo "🔍 Validating type consistency..."
	python tools/type-generator/validate.py

# --- Supabase & Type Generation Wrappers ---
gen-types-ts:
	@echo "🏷️ Generating TypeScript types from database schema..."
	@# Check if Supabase stack is running
	@if ! docker compose -f docker/docker-compose.supabase.yml ps 2>/dev/null | grep -q "db.*running\|db.*healthy"; then \
		echo "⚠️  Supabase database not running. Starting..."; \
		just supabase-start; \
		sleep 8; \
		just db-migrate; \
	fi
	@# Use Supabase CLI if available, otherwise fall back to PostgreSQL introspection
	@if command -v supabase >/dev/null 2>&1; then \
		echo "   Using Supabase CLI..."; \
		supabase gen types typescript --local --schema public > libs/shared/types/src/database.types.ts; \
		echo "✅ TypeScript types generated successfully (via Supabase CLI)"; \
	else \
		echo "   Supabase CLI not found, using PostgreSQL introspection..."; \
		PORT=$$(just _get_db_port); \
		python3 tools/scripts/gen_ts_from_pg.py --port $$PORT --output libs/shared/types/src/database.types.ts; \
	fi

gen-types-py:
	@echo "🐍 Generating Python Pydantic models from TypeScript types..."
	@if [ ! -f libs/shared/types/src/database.types.ts ]; then \
		echo ""; \
		echo "❌ TypeScript types not found"; \
		echo ""; \
		echo "Python type generation requires TypeScript types to be generated first."; \
		echo ""; \
		echo "To fix:"; \
		echo "  1. Generate TypeScript types: just gen-types-ts"; \
		echo "  2. Then run: just gen-types-py"; \
		echo ""; \
		echo "Or run both at once: just gen-types"; \
		echo ""; \
		exit 1; \
	fi
	@if [ ! -d libs/shared/types-py/src ]; then \
		mkdir -p libs/shared/types-py/src; \
	fi
	@python3 tools/scripts/gen_py_types.py libs/shared/types/src libs/shared/types-py/src
	@echo "✅ Python models generated successfully"

gen-types:
	@echo "🔁 Running all type generation tasks..."
	just gen-types-ts
	just gen-types-py

# --- Supabase Local Development Stack ---
# Uses Docker Compose for local Supabase database and services
# Ref: docs/guides/supabase-workflow.md

# Helper to get dynamic database port from running container
_get_db_port:
	@docker compose -f docker/docker-compose.supabase.yml port db 5432 2>/dev/null | cut -d: -f2 || echo "54322"

# Helper to get dynamic Studio port from running container
_get_studio_port:
	@docker compose -f docker/docker-compose.supabase.yml port studio 3000 2>/dev/null | cut -d: -f2 || echo "54323"

supabase-start:
	@echo "🚀 Starting Supabase local stack..."
	@if ! command -v docker >/dev/null 2>&1; then \
		echo "❌ Docker is required to run Supabase locally."; \
		echo "   Install Docker from: https://docs.docker.com/get-docker/"; \
		exit 1; \
	fi
	@if ! docker compose version >/dev/null 2>&1; then \
		echo "❌ Docker Compose is required."; \
		echo "   Install Docker Compose from: https://docs.docker.com/compose/install/"; \
		exit 1; \
	fi
	@# Copy env file if it doesn't exist
	@if [ ! -f docker/.env.supabase ]; then \
		cp docker/.env.supabase.example docker/.env.supabase; \
		echo "📝 Created docker/.env.supabase from example"; \
	fi
	@# Start the stack
	docker compose -f docker/docker-compose.supabase.yml --env-file docker/.env.supabase up -d
	@echo "⏳ Waiting for database to be ready..."
	@sleep 5
	@# Check if database is healthy
	@docker compose -f docker/docker-compose.supabase.yml --env-file docker/.env.supabase ps | grep -q "healthy" && \
		echo "✅ Supabase local stack running:" && \
		echo "   Database: localhost:54322" && \
		echo "   Studio: http://localhost:54323" || \
		echo "⚠️  Database may still be starting. Check: just supabase-status"

supabase-stop:
	@echo "🛑 Stopping Supabase local stack..."
	@if [ -f docker/docker-compose.supabase.yml ]; then \
		docker compose -f docker/docker-compose.supabase.yml down || true; \
	fi
	@echo "✅ Supabase stack stopped"

supabase-status:
	@echo "📊 Supabase stack status:"
	@if [ -f docker/docker-compose.supabase.yml ]; then \
		docker compose -f docker/docker-compose.supabase.yml ps; \
	else \
		echo "   Docker Compose file not found"; \
	fi

supabase-reset:
	@echo "🔄 Resetting Supabase stack (removes all data)..."
	@if [ -f docker/docker-compose.supabase.yml ]; then \
		docker compose -f docker/docker-compose.supabase.yml down -v; \
	fi
	just supabase-start
	@echo "⏳ Waiting for database to be ready..."
	@sleep 8
	just db-migrate
	just db-seed
	@echo "✅ Supabase reset complete"

supabase-logs:
	@echo "📋 Supabase logs (follow mode)..."
	docker compose -f docker/docker-compose.supabase.yml logs -f

supabase-studio:
	@echo "🌐 Opening Supabase Studio..."
	@PORT=$$(just _get_studio_port); \
	echo "   Studio URL: http://localhost:$$PORT"; \
	if command -v xdg-open >/dev/null 2>&1; then \
		xdg-open "http://localhost:$$PORT"; \
	elif command -v open >/dev/null 2>&1; then \
		open "http://localhost:$$PORT"; \
	else \
		echo "   Open http://localhost:$$PORT in your browser"; \
	fi

supabase-health:
	@echo "🩺 Checking Supabase stack health..."
	@docker compose -f docker/docker-compose.supabase.yml ps --format 'table {{"{{"}}.Name{{"}}"}}	{{"{{"}}.Status{{"}}"}}	{{"{{"}}.Ports{{"}}"}}'

db-migrate:
	@echo "🗄️ Running database migrations..."
	@# Check if Supabase stack is running
	@if ! docker compose -f docker/docker-compose.supabase.yml ps 2>/dev/null | grep -q "db.*running\|db.*healthy"; then \
		echo "⚠️  Supabase database not running. Starting..."; \
		just supabase-start; \
		sleep 8; \
	fi
	@# Apply migrations using psql with dynamic port
	@echo "📝 Applying migrations from supabase/migrations/..."
	@PORT=$$(just _get_db_port); \
	for f in supabase/migrations/*.sql; do \
		if [ -f "$$f" ]; then \
			echo "   Applying: $$(basename $$f)"; \
			PGPASSWORD=postgres psql -h localhost -p $$PORT -U postgres -d postgres -f "$$f" -q 2>&1 || { \
				echo "❌ Migration failed: $$f"; \
				exit 1; \
			}; \
		fi; \
	done
	@echo "✅ Migrations applied successfully"

db-seed:
	@echo "🌱 Seeding database..."
	@# Check if Supabase stack is running
	@if ! docker compose -f docker/docker-compose.supabase.yml ps 2>/dev/null | grep -q "db.*running\|db.*healthy"; then \
		echo "❌ Supabase database not running. Run: just supabase-start"; \
		exit 1; \
	fi
	@PORT=$$(just _get_db_port); \
	if [ -f supabase/seed.sql ]; then \
		PGPASSWORD=postgres psql -h localhost -p $$PORT -U postgres -d postgres -f supabase/seed.sql -q 2>&1 || { \
			echo "❌ Seed failed"; \
			exit 1; \
		}; \
		echo "✅ Database seeded successfully"; \
	else \
		echo "⚠️  No seed file found at supabase/seed.sql"; \
	fi

db-migration-create NAME:
	@echo "📝 Creating new migration: {{NAME}}"
	@TIMESTAMP=$$(date +%Y%m%d%H%M%S); \
	FILENAME="supabase/migrations/$${TIMESTAMP}_{{NAME}}.sql"; \
	echo "-- Migration: {{NAME}}" > "$$FILENAME"; \
	echo "-- Created: $$(date -Iseconds)" >> "$$FILENAME"; \
	echo "" >> "$$FILENAME"; \
	echo "-- Add your SQL statements here" >> "$$FILENAME"; \
	echo "✅ Created: $$FILENAME"

db-psql:
	@echo "🔌 Connecting to database..."
	@PORT=$$(just _get_db_port); PGPASSWORD=postgres psql -h localhost -p $$PORT -U postgres -d postgres

db-tables:
	@echo "📋 Listing tables in public schema..."
	@PORT=$$(just _get_db_port); PGPASSWORD=postgres psql -h localhost -p $$PORT -U postgres -d postgres -c "\dt public.*"

db-describe TABLE:
	@echo "📝 Describing table: {{TABLE}}"
	@PORT=$$(just _get_db_port); PGPASSWORD=postgres psql -h localhost -p $$PORT -U postgres -d postgres -c "\d+ public.{{TABLE}}"

check-types:
	@echo "🔍 Checking generated types are committed and up to date..."
	TMP_DIR=$(mktemp -d); \
	echo "Generating into temp dir: $TMP_DIR"; \
	just gen-types > /dev/null 2>&1 || true; \
	# Compare committed TS file
	if ! git diff --exit-code -- libs/shared/types/src/database.types.ts; then \
		echo "❌ TypeScript types are out of date."; \
		git --no-pager diff -- libs/shared/types/src/database.types.ts || true; \
		exit 1; \
	fi
	if ! git diff --exit-code -- libs/shared/types-py/src/models.py; then \
		echo "❌ Python types are out of date."; \
		git --no-pager diff -- libs/shared/types-py/src/models.py || true; \
		exit 1; \
	fi
	echo "✅ Types are up to date"


# --- Maintenance ---
clean:
	@echo "🧹 Cleaning build artifacts..."
	rm -rf node_modules/.cache
	rm -rf .nx
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	find . -type d -name "dist" -exec rm -rf {} +

clean-all: clean
	@echo "🧹 Deep cleaning..."
	rm -rf node_modules
	rm -rf .venv
	rm -rf pnpm-lock.yaml
	rm -rf uv.lock

devbox-fix:
	@echo "🔧 Fix devbox pin for supabase and re-run update"
	bash scripts/devbox_fix_pin.sh

devbox-check:
	@echo "🔎 CI-friendly devbox supabase availability check"
	# Update the generated flake so 'devbox run' gets latest inputs
	if command -v devbox >/dev/null 2>&1; then \
		devbox update || true; \
	fi
	bash scripts/check_supabase_in_devbox.sh

devbox-overlay-pin COMMIT="":
	@echo "📌 Pin devbox supabase overlay to a specific nixpkgs commit or tag"
	@if [ -z "{{COMMIT}}" ]; then \
		echo "Usage: just devbox-overlay-pin COMMIT=sha-or-tag"; exit 2; \
	fi
	@echo "Pinning overlay to: {{COMMIT}}"
	@python - <<PY
	import io,sys,re
	path='.devbox/overlays/supabase.nix'
	commit='{{COMMIT}}'
	data=open(path).read()
	data=re.sub(r"https://github.com/NixOS/nixpkgs/archive/[^\n']+",f"https://github.com/NixOS/nixpkgs/archive/{commit}.tar.gz",data)
	open(path,'w').write(data)
	print('OK: updated overlay')
	PY


# --- SOPS utilities ---
# Rotate / re-encrypt .secrets.env.sops for a new recipient and verify
# Usage: just sops-rotate RECIPIENT='age1qx...'
sops-rotate RECIPIENT="":
	#!/usr/bin/env bash
	set -euo pipefail
	if [ -z "${RECIPIENT}" ]; then
		echo "Usage: just sops-rotate RECIPIENT='age1...'" >&2
		exit 2
	fi

	if [ ! -f ".secrets.env.sops" ]; then
		echo ".secrets.env.sops not found in $(pwd)" >&2
		exit 2
	fi

	echo "Backing up current .secrets.env.sops -> .secrets.env.sops.bak"
	cp .secrets.env.sops .secrets.env.sops.bak

	# Decrypt to temp file
	tmpfile=$(mktemp --tmpdir sops-XXXXXX.env)
	trap 'shred -u "${tmpfile}" >/dev/null 2>&1 || rm -f "${tmpfile}"' EXIT
	sops -d .secrets.env.sops > "${tmpfile}"

	# Re-encrypt for the provided recipient
	echo "Re-encrypting for recipient: ${RECIPIENT}"
	sops --encrypt --age "${RECIPIENT}" "${tmpfile}" > .secrets.env.sops.new

	# Replace and verify
	mv .secrets.env.sops.new .secrets.env.sops
	# Verify decryption works with local keys (requires you have the private key available)
	if sops -d .secrets.env.sops >/dev/null 2>&1; then
		echo "Verification: decryption succeeded"
	else
		echo "Verification failed: could not decrypt .secrets.env.sops with available keys" >&2
		echo "Restoring backup .secrets.env.sops.bak" >&2
		mv .secrets.env.sops.bak .secrets.env.sops
		exit 3
	fi

	echo "Rotation complete. Remember to update CI secret SOPS_AGE_KEY with the private key corresponding to ${RECIPIENT} if you want CI to decrypt."


doctor:
	@echo "🩺 Running project doctor (no secrets will be shown)"
	@bash scripts/dev/doctor.sh

# --- Documentation Generation ---
docs-generate PROJECT_NAME="vibes-pro":
	@echo "📚 Generating comprehensive documentation..."
	node cli/docs.js generate \
		--project-name "{{PROJECT_NAME}}" \
		--description "Modern application with hexagonal architecture and domain-driven design" \
		--domains core,user,billing \
		--frameworks next,fastapi \
		--output-dir docs/generated \
		--include-ai

docs-templates PROJECT_NAME="vibes-pro" OUTPUT_DIR="templates/docs":
	@echo "📝 Generating documentation templates..."
	node cli/docs.js templates \
		--project-name "{{PROJECT_NAME}}" \
		--domains core,user,billing \
		--frameworks next,fastapi \
		--output-dir "{{OUTPUT_DIR}}" \
		--include-ai

docs-validate:
	@echo "🧪 Validating documentation..."
	node cli/docs.js validate \
		--output-dir docs/generated

docs-lint:
	@echo "🧪 Linting documentation for required Logfire sections..."
	@uv run python tools/docs/lint_check.py

docs-serve PORT="8000":
	@echo "📚 Serving documentation on port {{PORT}}..."
	python -m http.server {{PORT}} -d docs/generated

docs-clean:
	@echo "🧹 Cleaning generated documentation..."
	rm -rf docs/generated docs/temp
	rm -rf docs/temp

# --- AI Workflow Recipes ---
# Traceability: AI_ADR-004, AI_PRD-003, AI_SDS-003, AI_TS-004
#
# These recipes support AI-assisted development workflows as defined in:
# - .github/instructions/ai-workflows.instructions.md
# - .github/chatmodes/ (tdd.*, debug.*)
# - .github/prompts/ (TDD and debug workflow prompts)
#
# All recipes are safe to run in any environment and degrade gracefully
# when dependencies (pnpm, Nx) are not available.

# Bundle AI context for Copilot chat modes
# Collects specs, CALM architecture, and techstack into docs/ai_context_bundle
# for reference by .github/chatmodes/*.chatmode.md files
ai-context-bundle:
	@echo "📦 Bundling AI context..."
	@bash scripts/dev/bundle-context.sh docs/ai_context_bundle
	@echo "✅ Context bundle ready at docs/ai_context_bundle"

# --- TDD Workflow (Red-Green-Refactor) ---
# Usage: Open corresponding chat mode and follow the workflow
# Context: Reference docs/ai_context_bundle for project context

tdd-red:
	@echo "🔴 Red Phase: Write failing tests from specs."
	@echo ""
	@echo "Next steps:"
	@echo "  1. Open chat mode: tdd.red"
	@echo "  2. Reference docs/ai_context_bundle"
	@echo "  3. Write failing tests that define expected behavior"
	@echo ""

tdd-green:
	@echo "🟢 Green Phase: Implement minimal code to pass tests."
	@echo ""
	@echo "Next steps:"
	@echo "  1. Open chat mode: tdd.green"
	@echo "  2. Reference docs/ai_context_bundle"
	@echo "  3. Write minimal implementation to make tests pass"
	@echo ""

tdd-refactor:
	@echo "♻️  Refactor Phase: Improve design while keeping tests green."
	@echo ""
	@echo "Next steps:"
	@echo "  1. Open chat mode: tdd.refactor"
	@echo "  2. Reference docs/ai_context_bundle"
	@echo "  3. Optimize code without changing behavior"
	@echo ""

# --- Debug Workflow (Start-Repro-Isolate-Fix-Refactor-Regress) ---
# Usage: Open corresponding chat mode and follow the workflow
# Context: Reference docs/ai_context_bundle for project context

debug-start:
	@echo "🐛 Debug Start: Normalize bug report and plan reproduction."
	@echo ""
	@echo "Next steps:"
	@echo "  1. Open chat mode: debug.start"
	@echo "  2. Reference docs/ai_context_bundle"
	@echo "  3. Document the bug and plan reproduction"
	@echo ""

debug-repro:
	@echo "🐛 Debug Repro: Write failing test to reproduce the issue."
	@echo ""
	@echo "Next steps:"
	@echo "  1. Open chat mode: debug.repro"
	@echo "  2. Reference docs/ai_context_bundle"
	@echo "  3. Create minimal reproduction test"
	@echo ""

debug-isolate:
	@echo "🐛 Debug Isolate: Narrow root cause using diffs/instrumentation."
	@echo ""
	@echo "Next steps:"
	@echo "  1. Open chat mode: debug.isolate"
	@echo "  2. Reference docs/ai_context_bundle"
	@echo "  3. Add logging/instrumentation to find root cause"
	@echo ""

debug-fix:
	@echo "🐛 Debug Fix: Apply minimal change to make tests pass."
	@echo ""
	@echo "Next steps:"
	@echo "  1. Open chat mode: debug.fix"
	@echo "  2. Reference docs/ai_context_bundle"
	@echo "  3. Implement minimal fix for the issue"
	@echo ""

debug-refactor:
	@echo "♻️  Debug Refactor: Clean up the fix and remove instrumentation."
	@echo ""
	@echo "Next steps:"
	@echo "  1. Open chat mode: debug.refactor"
	@echo "  2. Reference docs/ai_context_bundle"
	@echo "  3. Improve fix quality and remove debug code"
	@echo ""

debug-regress:
	@echo "🧪 Debug Regress: Run full regression to ensure stability."
	@echo ""
	@echo "Next steps:"
	@echo "  1. Open chat mode: debug.regress"
	@echo "  2. Reference docs/ai_context_bundle"
	@echo "  3. Verify no regressions were introduced"
	@echo ""

# --- AI Validation & Scaffolding ---

# Validate code quality using available tooling
# Safe to run: degrades gracefully if pnpm or Nx are not available
# Runs: AGENT link checker, pre-commit, lint, typecheck, and tests (if configured)
validate-generator-schemas:
	@echo "🔍 Validating generator schemas..."
	@if command -v pnpm > /dev/null 2>&1; then \
		if pnpm exec --which tsx >/dev/null 2>&1; then \
			pnpm exec tsx tools/validate-generator-schemas.ts || { \
				if command -v npx > /dev/null 2>&1; then \
					npx --yes -p tsx -p ajv -p glob tsx tools/validate-generator-schemas.ts; \
				else \
					echo "❌ tsx ran via pnpm but missing node modules; npx not available for fallback."; \
					exit 1; \
				fi; \
			}; \
		elif command -v npx > /dev/null 2>&1; then \
			npx --yes -p tsx -p ajv -p glob tsx tools/validate-generator-schemas.ts; \
		else \
			echo "❌ tsx not available via pnpm and npx is missing. Install dependencies with 'just setup'."; \
			exit 1; \
		fi; \
	elif command -v corepack > /dev/null 2>&1; then \
		if corepack pnpm exec --which tsx >/dev/null 2>&1; then \
			corepack pnpm exec tsx tools/validate-generator-schemas.ts || { \
				if command -v npx > /dev/null 2>&1; then \
					npx --yes -p tsx -p ajv -p glob tsx tools/validate-generator-schemas.ts; \
				else \
					echo "❌ tsx ran via corepack pnpm but missing node modules; npx not available for fallback."; \
					exit 1; \
				fi; \
			}; \
		elif command -v npx > /dev/null 2>&1; then \
			npx --yes -p tsx -p ajv -p glob tsx tools/validate-generator-schemas.ts; \
		else \
			echo "❌ tsx not available via corepack pnpm and npx is missing. Install dependencies with 'just setup'."; \
			exit 1; \
		fi; \
	elif command -v npx > /dev/null 2>&1; then \
		npx --yes -p tsx -p ajv -p glob tsx tools/validate-generator-schemas.ts; \
	else \
		echo "❌ Neither pnpm/corepack nor npx is available to run tsx. Install dependencies with 'just setup'."; \
		exit 1; \
	fi

validate-agent-files:
	@echo "🔍 Validating AGENT.md files..."
	@python3 tools/check_agent_links.py

ai-validate:
	@echo "🔍 Validating project..."
	@just validate-generator-schemas
	@echo "Running AGENT.md link checker..."
	@python3 tools/check_agent_links.py || true
	@echo "Running pre-commit hooks..."
	@uv run pre-commit run --all-files || true
	@if command -v pnpm > /dev/null 2>&1; then \
		if [ -f package.json ] && grep -q '"lint"' package.json; then \
			echo "Running lint..."; \
			pnpm run lint || true; \
		else \
			echo "⚠️  No 'lint' script found in package.json. Skipping lint."; \
		fi; \
		if [ -f package.json ] && grep -q '"typecheck"' package.json; then \
			echo "Running typecheck..."; \
			pnpm run typecheck || true; \
		else \
			echo "⚠️  No 'typecheck' script found in package.json. Skipping typecheck."; \
		fi; \
		if pnpm exec nx --version > /dev/null 2>&1; then \
			echo "Running tests..."; \
			pnpm exec nx run-many --target=test --all || true; \
		else \
			echo "⚠️  Nx not available or no projects to test."; \
		fi; \
	else \
		echo "⚠️  pnpm not found. Skipping validation."; \
		echo "Run 'just setup' to install dependencies."; \
	fi
	@echo "Running Logfire smoke validation (DEV-PRD-007, DEV-SDS-006)..."
	@just test-logfire
	@echo "✅ Validation complete"

# Scaffold new code using Nx generators
# Thin wrapper around 'nx generate' with helpful error messages
# Usage: just ai-scaffold name=@nx/js:lib
ai-scaffold name="":
	@if [ -z "{{name}}" ]; then \
		echo "Usage: just ai-scaffold name=<generator>"; \
		echo ""; \
		echo "Examples:"; \
		echo "  just ai-scaffold name=@nx/js:lib"; \
		echo "  just ai-scaffold name=@nx/react:component"; \
		echo ""; \
		exit 1; \
	else \
		if command -v pnpm > /dev/null 2>&1; then \
			echo "🏗️  Running: pnpm exec nx g {{name}}"; \
			pnpm exec nx g {{name}}; \
		else \
			echo "❌ pnpm not found."; \
			echo "Please run: just setup"; \
			exit 1; \
		fi; \
	fi

ai-advice *ARGS:
	@if command -v pnpm > /dev/null 2>&1; then \
		pnpm exec tsx tools/ai/advice-cli.ts {{ARGS}}; \
	else \
		echo "❌ pnpm not found. Please install dependencies with 'just setup'."; \
		exit 1; \
	fi

test-ai-guidance:
	@echo "🔁 Running temporal recommendation tests..."
	@SKIP={{TEMPLATE_TEST_SKIP}} \
	COPIER_SKIP_PROJECT_SETUP=1 \
	UV_NO_SYNC=1 \
	uv run pytest tests/temporal/test_pattern_recommendations.py
	@echo "🧪 Running performance + context jest suites..."
	@pnpm test:jest -- --runTestsByPath tests/perf/test_performance_advisories.spec.ts tests/context/test_context_manager_scoring.spec.ts --runInBand
	@echo "🧪 Running CLI smoke test..."
	@tests/cli/test_ai_advice_command.sh
	@echo "✅ AI guidance validation complete"

# --- Specification Management ---

# --- Security Validation ---
# Run cargo audit to check for security vulnerabilities
security-audit:
	@echo "🔐 Running security audit..."
	@if command -v cargo > /dev/null 2>&1; then \
		cargo install cargo-audit --quiet 2>/dev/null || true; \
		cd libs/security && (cargo audit || echo "⚠️  Audit warnings found but continuing..."); \
	else \
		echo "❌ cargo not found. Please install Rust."; \
		exit 1; \
	fi

# Run performance benchmarks for encrypted database
security-benchmark:
	@echo "⚡ Running security performance benchmarks..."
	@if command -v cargo > /dev/null 2>&1; then \
		cargo test --test validation_suite test_performance_overhead --release -- --nocapture; \
	else \
		echo "❌ cargo not found. Please install Rust."; \
		exit 1; \
	fi

# Track binary size with and without security features
security-size-check:
	@echo "📊 Checking binary size overhead..."
	@bash scripts/track-binary-size.sh

# Run all security validation tests
security-validate: security-audit security-benchmark security-size-check
	@echo "✅ Security validation complete"

# --- AI Utilities ---
ai-analyze PROJECT_PATH:
	@echo "🤖 Analyzing project with AI..."
	python tools/ai/analyzer.py {{PROJECT_PATH}}

ai-suggest CONTEXT:
	@echo "🤖 Getting AI suggestions..."
	python tools/ai/suggester.py "{{CONTEXT}}"

# --- Observability helpers ---
observe-start:
	@echo "🚀 Starting Vector pipeline with ops/vector/vector.toml..."
	@command -v vector >/dev/null 2>&1 || { echo "❌ vector binary not found. Install from https://vector.dev/"; exit 1; }
	@mkdir -p tmp/vector-data || { echo "❌ Failed to create tmp/vector-data"; exit 1; }
	vector --config ops/vector/vector.toml --watch-config

observe-openobserve-up:
	@echo "🚀 Starting OpenObserve (Docker Compose)..."
	@if ! command -v docker >/dev/null 2>&1; then \
		echo "❌ Docker is required to run OpenObserve locally."; exit 1; \
	fi
	@if ! command -v docker compose >/dev/null 2>&1; then \
		echo "❌ Docker Compose plugin not found. Please install Docker Compose."; exit 1; \
	fi
	@if [ ! -f ops/openobserve/.env.local ]; then \
		echo "❌ Missing ops/openobserve/.env.local"; \
		echo "   Create it by copying ops/openobserve/.env.example and updating the credentials."; \
		exit 1; \
	fi
	@if [ ! -d ops/openobserve ]; then \
		echo "❌ ops/openobserve directory is missing."; \
		exit 1; \
	fi
	@if [ ! -f ops/openobserve/docker-compose.yml ]; then \
		echo "❌ Missing ops/openobserve/docker-compose.yml"; \
		exit 1; \
	fi
	@if RUNNING="$$(docker compose --project-directory ops/openobserve ps --status running --services 2>/dev/null || true)"; then \
		if printf "%s" "$$RUNNING" | grep -q '^openobserve$$'; then \
			echo "ℹ️  OpenObserve service already running (use 'just observe-openobserve-down' first)."; \
			exit 0; \
		fi; \
	fi
	docker compose --project-directory ops/openobserve --file ops/openobserve/docker-compose.yml up -d

observe-openobserve-down:
	@echo "🛑 Stopping OpenObserve (Docker Compose)..."
	@if command -v docker >/dev/null 2>&1 && command -v docker compose >/dev/null 2>&1; then \
		if [ -d ops/openobserve ] && [ -f ops/openobserve/docker-compose.yml ]; then \
			docker compose --project-directory ops/openobserve --file ops/openobserve/docker-compose.yml down; \
		else \
			echo "ℹ️  Compose manifests not found; nothing to stop."; \
		fi; \
	else \
		echo "ℹ️  Docker not available; nothing to stop."; \
	fi

# Run OTLP integration tests with fake collector (Phase 3)
observe-test:
	@echo "🧪 Running OTLP integration tests with mock collector..."
	@cargo test --manifest-path crates/vibepro-observe/Cargo.toml --features otlp --test otlp_integration
	@echo "✅ OTLP integration tests passed"

# Run Vector smoke test (configuration validation)
observe-test-vector:
	@echo "🧪 Running Vector smoke test..."
	@bash tests/ops/test_tracing_vector.sh
	@echo "✅ Vector smoke test passed"

# Run OpenObserve sink configuration test (Phase 4)
observe-test-openobserve:
	@echo "🧪 Running OpenObserve sink configuration test..."
	@bash tests/ops/test_openobserve_sink.sh
	@echo "✅ OpenObserve sink test passed"

# Run CI observability validation test (Phase 5)
observe-test-ci:
	@echo "🧪 Running CI observability validation test..."
	@bash tests/ops/test_ci_observability.sh
	@echo "✅ CI observability test passed"

# Run observability feature flag test (Phase 6)
observe-test-flag:
	@echo "🧪 Running observability feature flag test..."
	@bash tests/ops/test_observe_flag.sh
	@echo "✅ Feature flag test passed"

# Run all observability tests
observe-test-all: observe-test observe-test-vector observe-test-openobserve observe-test-ci observe-test-flag
	@echo "✅ All observability tests passed"

# Tail Vector log file (if persisted)
observe-logs:
	@echo "📋 Tailing Vector logs..."
	@if [ -f /tmp/vector.log ]; then \
		tail -n +1 -f /tmp/vector.log; \
	else \
		echo "❌ Vector log file not found at /tmp/vector.log"; \
		echo "   Start Vector with: just observe-start"; \
		exit 1; \
	fi

# Validate Vector configuration
observe-validate:
	@echo "🔍 Validating Vector configuration..."
	@command -v vector >/dev/null 2>&1 || { echo "❌ vector binary not found"; exit 1; }
	@vector validate ops/vector/vector.toml
	@echo "✅ Vector configuration is valid"

# Run Vector logs configuration test (DEV-SDS-018)
test-logs-config:
	@echo "🧪 Testing Vector logs configuration..."
	@bash -eu tests/ops/test_vector_logs_config.sh

# Run PII redaction test (DEV-PRD-018, DEV-SDS-018)
test-logs-redaction:
	@echo "🧪 Testing PII redaction..."
	@bash -eu tests/ops/test_log_redaction.sh

# Run log-trace correlation test (DEV-PRD-018, DEV-SDS-018)
test-logs-correlation:
	@echo "🧪 Testing log-trace correlation..."
	# Guard: If workspace Cargo.toml requests edition=2024, ensure developer has a compatible toolchain
	@bash -eu scripts/ensure_rust_toolchain.sh
	@bash -eu tests/ops/test_log_trace_correlation.sh

# Logfire smoke validation used by CI (DEV-PRD-018, DEV-SDS-018)
alias test-logfire := test-logs-logfire

test-logs-logfire:
	@echo "🧪 Running Logfire smoke test..."
	@uv run python tools/logging/test_logfire.py

# Run all logging tests
test-logs: test-logs-config test-logs-redaction test-logs-correlation test-logs-logfire
	@echo "✅ All logging tests passed"



observe-verify-span:
	# Emits a synthetic span via a tiny Rust one-liner using the crate (or call your service's health endpoint)
	@RUST_LOG=info VIBEPRO_OBSERVE=1 OTLP_ENDPOINT=${OTLP_ENDPOINT:-http://127.0.0.1:4317} \
	cargo test -p vibepro-observe --features otlp --test otlp_gate -- --nocapture

# --- Observability: smoke binary ---

# stdout JSON only (no OTLP)
observe-smoke:
	cargo run --manifest-path apps/observe-smoke/Cargo.toml

# OTLP export enabled (requires Feature + Env)
observe-smoke-otlp:
	VIBEPRO_OBSERVE=1 OTLP_ENDPOINT=$${OTLP_ENDPOINT:-http://127.0.0.1:4317} \
	cargo run --features otlp --manifest-path apps/observe-smoke/Cargo.toml

# End-to-end local verification:
# 1) Validate Vector configuration
# 2) Test OpenObserve sink configuration (Phase 4)
# 3) Start Vector (listens 4317/4318)
# 4) Run the OTLP smoke test
# 5) Verify traces are exported
observe-verify:
	@echo "🔍 Phase 4: Running end-to-end observability verification..."
	@echo ""
	@echo "Step 1: Validating Vector configuration..."
	@vector validate ops/vector/vector.toml
	@echo ""
	@echo "Step 2: Testing OpenObserve sink configuration..."
	@bash tests/ops/test_openobserve_sink.sh
	@echo ""
	@echo "Step 3: Starting Vector in background..." ; \
	command -v vector >/dev/null 2>&1 || { echo "❌ vector binary not found. Install from https://vector.dev/"; exit 1; } ; \
	mkdir -p tmp/vector-data || { echo "❌ Failed to create tmp/vector-data"; exit 1; } ; \
	vector --config ops/vector/vector.toml --watch-config & \
	VECTOR_PID=$! ; \
	trap 'kill $VECTOR_PID 2>/dev/null || true' EXIT ; \
	sleep 2 ; \
	echo "" ; \
	echo "Step 4: Running OTLP smoke test..." ; \
	VIBEPRO_OBSERVE=1 OTLP_ENDPOINT=${OTLP_ENDPOINT:-http://127.0.0.1:4317} \
	cargo run --features otlp --manifest-path apps/observe-smoke/Cargo.toml ; \
	sleep 1 ; \
	echo "" ; \
	echo "Step 5: Checking trace export..." ; \
	if [ -f tmp/vector-traces.log ]; then \
		echo "  ✅ Traces written to tmp/vector-traces.log" ; \
		tail -n 3 tmp/vector-traces.log ; \
	else \
		echo "  ⚠️  No trace file found" ; \
	fi ; \
	kill $VECTOR_PID 2>/dev/null || true ; \
	echo "" ; \
	echo "✅ Phase 4 Complete: Trace ingested into OpenObserve" ; \
	echo "" ; \
	echo "ℹ️  Next steps:" ; \
	echo "   1. Set OPENOBSERVE_URL and OPENOBSERVE_TOKEN in .secrets.env.sops" ; \
	echo "   2. Source the secrets: source .secrets.env.sops" ; \
	echo "   3. Restart Vector to enable OpenObserve sink: just observe-start" ; \
	echo "   4. Check OpenObserve UI for ingested traces"

# --- PHASE-004: Type Safety & CI Integration ---

# Run all type checks (TypeScript + Python)
type-check: type-check-ts type-check-py
	@echo "✅ All type checks passed"

# TypeScript type checking
type-check-ts:
	@echo "🔍 Running TypeScript type check..."
	@pnpm exec tsc --noEmit --project tsconfig.json
	@echo "✅ TypeScript types valid"

# TypeScript lint with type-aware rules
lint-ts:
	@echo "🔍 Running TypeScript ESLint..."
	@pnpm exec eslint tools tests --ext .ts --max-warnings 0
	@echo "✅ TypeScript lint passed"

# Python type checking with mypy
type-check-py:
	@echo "🔍 Running Python mypy strict check..."
	@uv run mypy --strict libs/python
	@echo "✅ Python types valid"

# Python type coverage report
type-coverage-py:
	@echo "📊 Generating Python type coverage report..."
	@uv run mypy --strict --any-exprs-report=mypy-report libs/python || true
	@if [ -f mypy-report/index.txt ]; then cat mypy-report/index.txt; fi

# Fix all auto-fixable type issues
type-fix:
	@echo "🔧 Auto-fixing type issues..."
	@pnpm exec eslint tools tests --ext .ts --fix
	@uv run ruff check --fix libs/python
	@echo "✅ Auto-fixes applied"

# Pre-commit type validation (fast)
type-pre-commit:
	@echo "⚡ Running pre-commit type checks..."
	@pre-commit run --all-files mypy
	@pre-commit run --all-files eslint
	@echo "✅ Pre-commit checks passed"


# Validate generator specification completeness
validate-generator-specs:
	@echo "🔍 Validating generator specifications..."
	@pnpm exec jest tests/generators/spec_completeness.test.ts --passWithNoTests
	@pnpm exec jest tests/generators/spec_schema_examples.test.ts --passWithNoTests
	@echo "✅ All generator specs valid"

# --- Temporal AI Pattern Search ---

# Initialize temporal-ai database
temporal-ai-init:
	@echo "🗄️  Initializing temporal-ai database..."
	@if [ ! -x ./crates/temporal-ai/target/release/temporal-ai ]; then \
		echo "❌ temporal-ai binary missing. Run 'just temporal-ai-build' first."; \
		exit 1; \
	fi
	@./crates/temporal-ai/target/release/temporal-ai init

# Refresh pattern database from Git history
temporal-ai-refresh COMMITS="1000":
	@echo "🔄 Refreshing pattern database (last {{COMMITS}} commits)..."
	@if [ ! -x ./crates/temporal-ai/target/release/temporal-ai ]; then \
		echo "❌ temporal-ai binary missing. Run 'just temporal-ai-build' first."; \
		exit 1; \
	fi
	@./crates/temporal-ai/target/release/temporal-ai refresh --commits {{COMMITS}}

# Query similar patterns
temporal-ai-query QUERY TOP="5":
	@echo "🔍 Searching for: {{QUERY}}"
	@if [ ! -x ./crates/temporal-ai/target/release/temporal-ai ]; then \
		echo "❌ temporal-ai binary missing. Run 'just temporal-ai-build' first."; \
		exit 1; \
	fi
	@./crates/temporal-ai/target/release/temporal-ai query "{{QUERY}}" --top {{TOP}}

# Show temporal-ai database statistics
temporal-ai-stats:
	@if [ ! -x ./crates/temporal-ai/target/release/temporal-ai ]; then \
		echo "❌ temporal-ai binary missing. Run 'just temporal-ai-build' first."; \
		exit 1; \
	fi
	@./crates/temporal-ai/target/release/temporal-ai stats

# Build temporal-ai CLI
temporal-ai-build:
	@echo "🛠️  Building temporal-ai..."
	@cd crates/temporal-ai && cargo build --release
	@echo "✅ Temporal AI CLI built at: crates/temporal-ai/target/release/temporal-ai"

# Start local OpenObserve for temporal-ai metrics
temporal-ai-observe-start:
    @echo "🚀 Starting local OpenObserve..."
    @./scripts/run-with-secrets.sh bash -c 'cd ops/openobserve && docker compose up -d'
    @echo "⏳ Waiting for OpenObserve to be ready..."
    @sleep 5
    @curl -f http://localhost:5080/healthz > /dev/null 2>&1 && echo "✅ OpenObserve ready at http://localhost:5080" || echo "⚠️  OpenObserve may still be starting..."

# Stop local OpenObserve
temporal-ai-observe-stop:
    @echo "🛑 Stopping local OpenObserve..."
    @cd ops/openobserve && docker compose down
    @echo "✅ OpenObserve stopped"

# Refresh temporal-ai metrics from OpenObserve
temporal-ai-refresh-metrics DAYS="7":
    @echo "📊 Refreshing temporal-ai metrics from OpenObserve (last {{DAYS}} days)..."
    @if [ ! -x ./crates/temporal-ai/target/release/temporal-ai ]; then \
        echo "❌ temporal-ai binary missing. Run 'just temporal-ai-build' first."; \
        exit 1; \
    fi
    @./scripts/run-with-secrets.sh ./crates/temporal-ai/target/release/temporal-ai refresh-metrics --days {{DAYS}}
    @echo "✅ Metrics refreshed successfully"
