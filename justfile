# Vibes Pro Build System
  set shell := ["bash", "-uc"]

  # Default task shows available commands
  default:
      @just --list

  # Environment setup
  setup: setup-node setup-python setup-tools
      @echo "✅ Development environment ready"

  setup-node:
      @echo "🔧 Setting up Node.js environment..."
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

  # Development tasks
  dev:
      @echo "🚀 Starting development servers..."
      nx run-many --target=serve --all --parallel=5

  build: _detect_build_strategy

  _detect_build_strategy:
      #!/usr/bin/env bash
      if [ -f "nx.json" ]; then
          echo "🏗️  Building with Nx..."
          just build-nx
      else
          echo "🏗️  Building directly..."
          just build-direct
      fi

  build-nx:
      nx run-many --target=build --all --parallel=3

  build-direct:
      uv run python -m build
      pnpm run build

  # Testing
  test: test-python test-node test-integration

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
      cd ../test-output && pnpm install && pnpm build

  # Code quality
  lint: lint-python lint-node lint-templates

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

  format: format-python format-node

  format-python:
      @echo "✨ Formatting Python code..."
      uv run black .
      uv run isort .

  format-node:
      @echo "✨ Formatting Node.js code..."
      pnpm format

  # Database and AI tools
  db-init:
      @echo "🗄️  Initializing temporal database..."
      python tools/temporal-db/init.py

  db-backup:
      @echo "💾 Backing up temporal database..."
      python tools/temporal-db/backup.py

  # Migration tools
  migrate-hexddd PROJECT_PATH:
      @echo "🔄 Migrating HexDDD project..."
      python tools/migration/hexddd-migrator.py {{PROJECT_PATH}}

  migrate-vibepdk TEMPLATE_PATH:
      @echo "🔄 Migrating VibePDK template..."
      python tools/migration/vibepdk-migrator.py {{TEMPLATE_PATH}}

  # Type generation
  types-generate:
      @echo "🏷️  Generating types..."
      python tools/type-generator/generate.py

  types-validate:
      @echo "🔍 Validating type consistency..."
      python tools/type-generator/validate.py

  # Cleanup
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

  # Documentation
  docs-build:
      @echo "📚 Building documentation..."
      python tools/docs/generator.py

  docs-serve:
      @echo "📚 Serving documentation..."
      python -m http.server 8000 -d docs/build

  # AI tools
  ai-analyze PROJECT_PATH:
      @echo "🤖 Analyzing project with AI..."
      python tools/ai/analyzer.py {{PROJECT_PATH}}

  ai-suggest CONTEXT:
      @echo "🤖 Getting AI suggestions..."
      python tools/ai/suggester.py "{{CONTEXT}}"
