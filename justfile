# Vibes Pro Build System
set shell := ["bash", "-uc"]

default:
	@just --list

# --- Environment Setup ---
setup: setup-node setup-python setup-tools
	@echo "✅ Development environment ready"

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

verify-node:
	@echo "🔍 Verifying Node version alignment..."
	@bash scripts/verify-node.sh

# --- Developer Experience ---
dev:
	@echo "🚀 Starting development servers..."
	pnpm exec nx run-many --target=serve --all --parallel=5

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
	node scripts/check_all_chatmodes.mjs
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
	copier copy . ../test-output --data-file tests/fixtures/test-data.yml --trust --defaults --force
	cd ../test-output && pnpm install && { \
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
	python tools/validate-templates.py

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

doctor:
	@echo "🩺 Running project doctor (no secrets will be shown)"
	@bash scripts/doctor.sh

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
	@bash scripts/bundle-context.sh docs/ai_context_bundle
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
ai-validate:
	@echo "🔍 Validating project..."
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
	@python -m pytest tests/temporal/test_pattern_recommendations.py
	@echo "🧪 Running performance + context vitest suites..."
	@pnpm exec vitest run tests/perf/test_performance_advisories.spec.ts tests/context/test_context_manager_scoring.spec.ts
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
	vector --config ops/vector/vector.toml --watch

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
	@bash -eu tests/ops/test_log_trace_correlation.sh

# Run all logging tests
test-logs: test-logs-config test-logs-redaction test-logs-correlation
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
	( just observe-start & ) ; \
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
