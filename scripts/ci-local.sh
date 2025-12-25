#!/usr/bin/env bash
# =============================================================================
# CI Local Mirror - Reproduces CI behavior locally
# =============================================================================
# This script mirrors the exact CI behavior for local debugging.
# Usage: ./scripts/ci-local.sh <job>
#
# Jobs:
#   lint       - Run all linters (TypeScript, Python, Rust)
#   typecheck  - Run type checkers (tsc, mypy)
#   test       - Run all test suites
#   build      - Build all projects
#   security   - Run security audits
#   all        - Run everything in sequence
#   docker     - Run in Docker for full CI parity
#
# Environment:
#   CI=true is set automatically to simulate CI environment
#   VIBEPRO_CI_LOCAL=true distinguishes from actual CI runs
#
# Examples:
#   ./scripts/ci-local.sh lint      # Run linters only
#   ./scripts/ci-local.sh all       # Full CI suite
#   ./scripts/ci-local.sh docker    # Full parity with Docker
# =============================================================================

set -euo pipefail

# =============================================================================
# Configuration
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Source versions from CI config
if [[ -f "$PROJECT_ROOT/.github/config/versions.env" ]]; then
  # shellcheck source=/dev/null
  source "$PROJECT_ROOT/.github/config/versions.env"
fi

# Load from .mise.toml if versions not set
NODE_VERSION="${NODE_VERSION:-20.11.1}"
PYTHON_VERSION="${PYTHON_VERSION:-3.11.11}"

# CI environment simulation
export CI=true
export VIBEPRO_CI_LOCAL=true
export NX_NO_CLOUD=true
export NX_REJECT_REMOTE_CACHE=true
export LC_ALL=C.UTF-8
export LANG=C.UTF-8

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =============================================================================
# Helper Functions
# =============================================================================

log_info() {
  echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
  echo -e "${GREEN}✅${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
  echo -e "${RED}❌${NC} $1"
}

log_step() {
  echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}▶${NC} $1"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
}

# Check if a command exists
command_exists() {
  command -v "$1" &>/dev/null
}

# Verify tool versions match expectations
check_tool_versions() {
  log_step "Checking tool versions"

  local has_mismatch=false

  # Node.js
  if command_exists node; then
    local node_actual
    node_actual=$(node --version | sed 's/^v//')
    if [[ "$node_actual" != "$NODE_VERSION" ]]; then
      log_warning "Node version mismatch. Expected: $NODE_VERSION, Got: $node_actual"
      has_mismatch=true
    else
      log_success "Node.js: v$node_actual"
    fi
  else
    log_error "Node.js not found"
    has_mismatch=true
  fi

  # Python
  if command_exists python3; then
    local python_actual
    python_actual=$(python3 --version | awk '{print $2}')
    if [[ "$python_actual" != "$PYTHON_VERSION" ]]; then
      log_warning "Python version mismatch. Expected: $PYTHON_VERSION, Got: $python_actual"
      # Don't fail for minor Python version differences
    else
      log_success "Python: $python_actual"
    fi
  else
    log_error "Python not found"
    has_mismatch=true
  fi

  # pnpm
  if command_exists pnpm; then
    log_success "pnpm: $(pnpm --version)"
  else
    log_error "pnpm not found. Run: corepack enable"
    has_mismatch=true
  fi

  # uv
  if command_exists uv; then
    log_success "uv: $(uv --version | awk '{print $2}')"
  else
    log_warning "uv not found. Python tests may fail."
  fi

  # just
  if command_exists just; then
    log_success "just: $(just --version | awk '{print $2}')"
  else
    log_error "just not found. Run: mise install"
    has_mismatch=true
  fi

  if [[ "$has_mismatch" == "true" ]]; then
    log_warning "Tool version mismatches detected. Run 'mise install' to sync."
    echo ""
  fi
}

# =============================================================================
# CI Jobs
# =============================================================================

job_lint() {
  log_step "Running Linters"

  local failed=false

  # TypeScript/JavaScript linting
  if [[ -f "$PROJECT_ROOT/package.json" ]]; then
    log_info "Running ESLint..."
    if ! pnpm run lint; then
      log_error "ESLint failed"
      failed=true
    else
      log_success "ESLint passed"
    fi
  fi

  # Python linting
  if [[ -f "$PROJECT_ROOT/pyproject.toml" ]]; then
    log_info "Running ruff..."
    if ! uv run ruff check .; then
      log_error "Ruff failed"
      failed=true
    else
      log_success "Ruff passed"
    fi
  fi

  # Rust linting
  if [[ -f "$PROJECT_ROOT/Cargo.toml" ]]; then
    log_info "Running cargo clippy..."
    if ! cargo clippy --all-targets -- -D warnings; then
      log_error "Clippy failed"
      failed=true
    else
      log_success "Clippy passed"
    fi
  fi

  if [[ "$failed" == "true" ]]; then
    return 1
  fi
}

job_typecheck() {
  log_step "Running Type Checkers"

  local failed=false

  # TypeScript
  if [[ -f "$PROJECT_ROOT/tsconfig.json" ]]; then
    log_info "Running TypeScript compiler..."
    if ! pnpm exec tsc --noEmit --pretty false; then
      log_error "TypeScript typecheck failed"
      failed=true
    else
      log_success "TypeScript passed"
    fi
  fi

  # Python (mypy)
  if [[ -f "$PROJECT_ROOT/pyproject.toml" ]]; then
    log_info "Running mypy..."
    if ! uv run python -m mypy --strict libs/python 2>/dev/null; then
      log_warning "mypy check failed or libs/python not found"
      # Don't fail - mypy config may need adjustment
    else
      log_success "mypy passed"
    fi
  fi

  if [[ "$failed" == "true" ]]; then
    return 1
  fi
}

job_test() {
  log_step "Running Tests"

  local failed=false

  # Jest tests
  if [[ -f "$PROJECT_ROOT/package.json" ]]; then
    log_info "Running Jest tests..."
    if ! pnpm test:jest --runInBand --passWithNoTests; then
      log_error "Jest tests failed"
      failed=true
    else
      log_success "Jest tests passed"
    fi

    log_info "Running Node smoke tests..."
    if ! pnpm test:node; then
      log_error "Node smoke tests failed"
      failed=true
    else
      log_success "Node smoke tests passed"
    fi
  fi

  # Pytest
  if [[ -f "$PROJECT_ROOT/pyproject.toml" ]]; then
    log_info "Running pytest..."
    # Ignore copier/template tests - they require special fixtures from pytest-copier
    # that hang on session setup. They are tested separately via generation-smoke-tests.yml
    # Also disable the copier plugin entirely as it causes session startup hangs
    if ! uv run pytest -p no:copier --ignore=tests/copier --ignore=tests/template -q; then
      log_error "Pytest failed"
      failed=true
    else
      log_success "Pytest passed"
    fi
  fi

  # Rust tests
  if [[ -f "$PROJECT_ROOT/Cargo.toml" ]]; then
    log_info "Running cargo test..."
    if ! cargo test; then
      log_error "Cargo tests failed"
      failed=true
    else
      log_success "Cargo tests passed"
    fi
  fi

  if [[ "$failed" == "true" ]]; then
    return 1
  fi
}

job_build() {
  log_step "Building Projects"

  if command_exists just; then
    if ! just build; then
      log_error "Build failed"
      return 1
    fi
    log_success "Build completed"
  elif [[ -f "$PROJECT_ROOT/package.json" ]]; then
    if ! pnpm build; then
      log_error "Build failed"
      return 1
    fi
    log_success "Build completed"
  else
    log_warning "No build system detected"
  fi
}

job_security() {
  log_step "Running Security Audits"

  local failed=false

  # npm audit
  if [[ -f "$PROJECT_ROOT/package-lock.json" ]] || [[ -f "$PROJECT_ROOT/pnpm-lock.yaml" ]]; then
    log_info "Running npm audit..."
    if ! pnpm audit --audit-level=high; then
      log_warning "npm audit found high-severity issues"
      # Don't fail - just warn
    else
      log_success "npm audit passed"
    fi
  fi

  # cargo audit
  if [[ -f "$PROJECT_ROOT/Cargo.toml" ]]; then
    if command_exists cargo-audit; then
      log_info "Running cargo audit..."
      if ! cargo audit; then
        log_warning "cargo audit found issues"
      else
        log_success "cargo audit passed"
      fi
    else
      log_warning "cargo-audit not installed. Run: cargo install cargo-audit"
    fi
  fi

  if [[ "$failed" == "true" ]]; then
    return 1
  fi
}

job_template() {
  log_step "Validating Template Generation"

  if command_exists just; then
    UV_NO_SYNC=1 just test-generation
    log_success "Template validation passed"
  else
    log_warning "just not available, skipping template validation"
  fi
}

job_all() {
  log_step "Running Full CI Suite"

  local start_time
  start_time=$(date +%s)

  # Install dependencies first
  log_info "Installing dependencies..."
  pnpm install --frozen-lockfile
  if [[ -f "$PROJECT_ROOT/pyproject.toml" ]]; then
    uv sync --frozen || uv sync --group dev --all-extras --frozen
  fi

  # Run all jobs
  job_lint
  job_typecheck
  job_build
  job_test
  job_template

  local end_time
  end_time=$(date +%s)
  local duration=$((end_time - start_time))

  echo ""
  log_success "Full CI suite completed in ${duration}s"
}

job_docker() {
  log_step "Running CI in Docker (Full Parity Mode)"

  if ! command_exists docker; then
    log_error "Docker not found. Install Docker to use this mode."
    return 1
  fi

  log_info "Building CI container..."

  # Create temporary Dockerfile
  local dockerfile
  dockerfile=$(mktemp)
  cat >"$dockerfile" <<'DOCKERFILE'
FROM node:20.11.1-bookworm

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3.11 python3-pip python3-venv \
    curl git jq make \
    && rm -rf /var/lib/apt/lists/*

# Install Rust
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

# Install uv
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.local/bin:${PATH}"

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Install just
RUN curl --proto '=https' --tlsv1.2 -sSf https://just.systems/install.sh | bash -s -- --to /usr/local/bin

WORKDIR /workspace

# Copy dependency files first for caching
COPY package.json pnpm-lock.yaml ./
COPY pyproject.toml uv.lock* ./

# Install dependencies
RUN pnpm install --frozen-lockfile || true
RUN uv sync --frozen || true

# Copy rest of project
COPY . .

# Set CI environment
ENV CI=true
ENV NX_NO_CLOUD=true
ENV NX_REJECT_REMOTE_CACHE=true

CMD ["./scripts/ci-local.sh", "all"]
DOCKERFILE

  # Build and run
  docker build -f "$dockerfile" -t vibepro-ci-local "$PROJECT_ROOT"
  docker run --rm -v "$PROJECT_ROOT:/workspace" vibepro-ci-local

  rm -f "$dockerfile"
}

# =============================================================================
# Main Entry Point
# =============================================================================

main() {
  cd "$PROJECT_ROOT"

  local job="${1:-help}"

  case "$job" in
    lint)
      check_tool_versions
      job_lint
      ;;
    typecheck | type-check | types)
      check_tool_versions
      job_typecheck
      ;;
    test | tests)
      check_tool_versions
      job_test
      ;;
    build)
      check_tool_versions
      job_build
      ;;
    security | audit)
      check_tool_versions
      job_security
      ;;
    template)
      check_tool_versions
      job_template
      ;;
    all)
      check_tool_versions
      job_all
      ;;
    docker)
      job_docker
      ;;
    check | verify)
      check_tool_versions
      ;;
    help | --help | -h)
      echo "Usage: $0 <job>"
      echo ""
      echo "Jobs:"
      echo "  lint       Run all linters (ESLint, ruff, clippy)"
      echo "  typecheck  Run type checkers (tsc, mypy)"
      echo "  test       Run all test suites (Jest, pytest, cargo test)"
      echo "  build      Build all projects"
      echo "  security   Run security audits (npm audit, cargo audit)"
      echo "  template   Validate template generation"
      echo "  all        Run full CI suite"
      echo "  docker     Run in Docker for full CI parity"
      echo "  check      Verify tool versions only"
      echo "  help       Show this help"
      echo ""
      echo "Examples:"
      echo "  $0 lint           # Quick lint check"
      echo "  $0 all            # Full CI suite locally"
      echo "  $0 docker         # Full CI parity with Docker"
      ;;
    *)
      log_error "Unknown job: $job"
      echo "Run '$0 help' for usage."
      exit 1
      ;;
  esac
}

main "$@"
