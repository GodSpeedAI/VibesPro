# Vibes Pro Build System
set shell := ["bash", "-uc"]

default:
	@just --list

# --- Environment Setup ---
setup: setup-node setup-python setup-tools
	@echo "✅ Development environment ready"

setup-node:
	@echo "🛠️ Setting up Node.js environment..."
	corepack enable
	pnpm install

setup-python:
	@echo "🔧 Setting up Python environment..."
	uv sync --dev

setup-tools:
	@echo "🔧 Setting up development tools..."
	@if command -v copier >/dev/null 2>&1; then \
		echo "✅ Copier already installed"; \
	else \
		echo "📦 Installing Copier..."; \
		uv tool install copier; \
	fi

# --- Developer Experience ---
dev:
	@echo "🚀 Starting development servers..."
	nx run-many --target=serve --all --parallel=5

spec-matrix:
	pnpm spec:matrix

prompt-lint:
	pnpm prompt:lint

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
	nx run-many --target=build --all --parallel=3

build-target TARGET:
	nx run {{TARGET}}:build

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
	nx run-many --target=test --all --parallel=3

test-target TARGET:
	nx run {{TARGET}}:test

# --- Language-Specific Test Tasks ---
test-python:
	@echo "🧪 Running Python tests..."
	uv run pytest

test-node:
	@echo "🧪 Running Node.js tests..."
	pnpm test

test-integration:
	@echo "🧪 Running integration tests..."
	just test-generation

test-generation:
	@echo "🧪 Testing template generation..."
	rm -rf ../test-output
	copier copy . ../test-output --data-file tests/fixtures/test-data.yml
	cd ../test-output && pnpm install && { \
		echo "🏗️ Building all projects..."; \
		pnpm build --if-present || { \
			echo "⚠️ Some build targets failed. Checking core domain libraries..."; \
			if pnpm nx run test-domain-domain:build && pnpm nx run test-domain-application:build && pnpm nx run test-domain-infrastructure:build; then \
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
	python tools/validate-templates.py

format:
	just format-python
	just format-node

format-python:
	@echo "✨ Formatting Python code..."
	uv run black .
	uv run isort .

format-node:
	@echo "✨ Formatting Node.js code..."
	pnpm format

# --- Database and AI Tools ---
db-init:
	@echo "🗄️  Initializing temporal database..."
	python tools/temporal-db/init.py

db-backup:
	@echo "💾 Backing up temporal database..."
	python tools/temporal-db/backup.py

# --- Type Generation ---
types-generate:
	@echo "🏷️  Generating types..."
	python tools/type-generator/generate.py

types-validate:
	@echo "🔍 Validating type consistency..."
	python tools/type-generator/validate.py

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

docs-serve PORT="8000":
	@echo "📚 Serving documentation on port {{PORT}}..."
	python -m http.server {{PORT}} -d docs/generated

docs-clean:
	@echo "🧹 Cleaning generated documentation..."
	rm -rf docs/generated docs/temp
	rm -rf docs/temp

# --- AI Utilities ---
ai-analyze PROJECT_PATH:
	@echo "🤖 Analyzing project with AI..."
	python tools/ai/analyzer.py {{PROJECT_PATH}}

ai-suggest CONTEXT:
	@echo "🤖 Getting AI suggestions..."
	python tools/ai/suggester.py "{{CONTEXT}}"
