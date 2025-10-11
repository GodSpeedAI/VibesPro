# Environment Setup & Testing

This document describes the VibesPro environment setup, testing infrastructure, and development workflows.

## Overview

VibesPro uses a layered environment strategy:

1. **Devbox** – OS-level toolchain isolation (optional but recommended)
2. **mise** – Runtime version management (Node, Python, Rust)
3. **SOPS** – Encrypted secrets management
4. **Just** – Task orchestration
5. **pnpm** – Node package management
6. **uv** – Python package and environment management

## Quick Start

```bash
# 1. Clone the repository
git clone <repository-url>
cd VibesPro

# 2. Run setup (installs Node and Python dependencies)
just setup

# 3. Verify environment health
just doctor

# 4. Run environment tests
just test-env
```

## Devbox (OS-Level Toolchain)

Devbox provides reproducible OS-level dependencies without polluting your host system.

### What is Devbox?

Devbox creates isolated development environments with:
- Consistent tool versions across team members
- No conflicts with system-installed packages
- Declarative configuration in `devbox.json`
- Powered by Nix for reproducibility

### Installation

```bash
# Install Devbox (if not already installed)
curl -fsSL https://get.jetpack.io/devbox | bash

# Verify installation
devbox version
```

### Usage

```bash
# Enter the Devbox shell (activates all tools)
devbox shell

# Inside devbox shell, all tools are available:
git --version
jq --version
postgresql --version

# Exit devbox shell
exit

# Run a single command in devbox environment
devbox run -- just test

# Update packages to latest versions
devbox update
```

### Configuration

The `devbox.json` file defines all OS-level tools:

```json
{
  "packages": [
    "git",
    "curl",
    "jq",
    "make",
    "ffmpeg",
    "postgresql@15",
    "ripgrep",
    "fd",
    "uv"
  ],
  "shell": {
    "init_hook": [
      "echo 'Devbox initialized: OS toolchain ready.'"
    ]
  }
}
```

### When to Use Devbox

**Use Devbox when:**
- You need specific versions of system tools (PostgreSQL, FFmpeg, etc.)
- Working in a team and need consistent tooling
- You want isolation from system packages
- CI/CD needs exact reproducibility

**Skip Devbox if:**
- You only need Node/Python (use mise instead)
- You prefer managing tools with system package managers
- You're prototyping and don't need reproducibility yet

### Troubleshooting

**Problem:** `devbox: command not found`
```bash
# Ensure devbox is in PATH
export PATH="$HOME/.local/bin:$PATH"

# Or reinstall
curl -fsSL https://get.jetpack.io/devbox | bash
```

**Problem:** Slow package installation
```bash
# Use devbox cache
devbox shell --pure=false
```

**Problem:** Package not found
```bash
# Search for available packages
devbox search <package-name>
```

## mise (Runtime Version Manager)

mise is the single source of truth for Node.js, Python, and Rust runtime versions.

### What is mise?

mise provides:
- **Declarative runtime versions** in `.mise.toml`
- **Automatic environment activation** (no manual sourcing)
- **Fast, Rust-based** implementation
- **Replaces multiple tools** (nvm, pyenv, rbenv, etc.)
- **Per-project versions** with global fallback

### Installation

```bash
# Install mise (if not already installed)
curl https://mise.jdx.dev/install.sh | sh

# Add to shell (one-time setup)
echo 'eval "$(mise activate bash)"' >> ~/.bashrc  # for bash
echo 'eval "$(mise activate zsh)"' >> ~/.zshrc    # for zsh

# Reload shell
exec $SHELL

# Verify installation
mise --version
```

### Usage

```bash
# Install all runtimes defined in .mise.toml
mise install

# Check installed runtimes
mise ls

# See which versions are active
mise current

# Update to latest patch versions
mise upgrade

# Run command with mise environment
mise exec -- node --version
mise exec -- python --version
mise exec -- rustc --version

# Use specific runtime (override .mise.toml)
mise use node@22
mise use python@3.13
```

### Configuration

The `.mise.toml` file defines all runtime versions:

```toml
[tools]
node = "20.11.1"
python = "3.12.5"
rust = "1.80.1"

[env]
# optional shared ENV defaults
```

**Version Formats:**
- Exact: `"20.11.1"` - pins to specific patch
- Prefix: `"20"` or `"20.11"` - latest matching version
- Latest: `"latest"` - always use newest (not recommended)

### Why mise Instead of nvm/pyenv/rustup?

**Before (multiple tools):**
```bash
nvm use 20        # Node
pyenv local 3.12  # Python
rustup default stable  # Rust
# 3 tools, 3 config files, 3 commands to remember
```

**After (mise only):**
```bash
mise install      # All runtimes from one config
# 1 tool, 1 config file, 1 command
```

### Migration from Other Tools

**From nvm:**
```bash
# Old: .nvmrc
# 20.11.1

# New: .mise.toml
# [tools]
# node = "20.11.1"
```

**From pyenv:**
```bash
# Remove .python-version (already done in this repo)
# mise reads versions from .mise.toml instead
```

**From Volta:**
```bash
# package.json "volta" section can coexist
# but mise is authoritative
# Use 'just verify:node' to check alignment
```

### When to Use mise

**Use mise for:**
- Node.js, Python, Rust runtimes
- Development environment version management
- Team-wide version consistency
- CI/CD reproducibility

**Don't use mise for:**
- OS-level tools (use devbox instead)
- Language packages (use pnpm/uv/cargo instead)
- System services (use devbox for PostgreSQL, etc.)

### Troubleshooting

**Problem:** `mise: command not found`
```bash
# Ensure mise is in PATH
export PATH="$HOME/.local/bin:$PATH"

# Verify installation
which mise

# Reinstall if needed
curl https://mise.jdx.dev/install.sh | sh
```

**Problem:** Runtimes not activating automatically
```bash
# Ensure mise is activated in shell
eval "$(mise activate bash)"  # or zsh

# Or add to shell RC file permanently
```

**Problem:** Version mismatch warnings
```bash
# Check what's active
mise current

# Reinstall runtimes
mise install --force

# Check for conflicts
just verify:node  # if Volta is also present
```

**Problem:** Slow runtime installation
```bash
# mise downloads pre-built binaries (fast)
# If building from source, ensure build tools installed
devbox shell  # provides make, gcc, etc.
```

## Environment Testing

### Test Harness

The `tests/env/` directory contains environment validation tests that verify:

- Tool availability and versions
- Configuration file integrity
- Secret management setup
- Build system functionality

**Structure:**

```
tests/env/
├── README.md            # Test documentation
├── helpers.sh           # Reusable test helpers (assertions, temp dirs)
├── run.sh               # Test runner (discovers test_*.sh files)
├── test_sanity.sh       # Basic harness validation
├── test_doctor.sh       # Validates doctor script output
├── test_harness.sh      # Validates test discovery
├── test_devbox.sh       # Validates devbox.json configuration
└── test_mise_versions.sh # Validates mise runtime versions
```

**Running Tests:**

```bash
# Run all environment tests
just test-env

# Run a specific test manually
bash tests/env/test_doctor.sh
```

**Test Helpers (in `helpers.sh`):**

- `assert_file_exists <path>` – Fails if file doesn't exist
- `assert_cmd_succeeds <command>` – Fails if command returns non-zero
- `assert_equal <actual> <expected> [message]` – Compares values
- `mktempdir` – Creates a temporary directory (cross-platform)

### Writing New Environment Tests

1. Create a file named `test_<feature>.sh` in `tests/env/`
2. Include the test helpers: `. tests/env/helpers.sh`
3. Use `set -euo pipefail` for fail-fast behavior
4. Write clear assertions and error messages

**Example:**

```bash
#!/usr/bin/env bash
set -euo pipefail
. tests/env/helpers.sh

echo "Testing feature..."

assert_file_exists "path/to/config.json"
assert_cmd_succeeds "node --version"

echo "Feature test OK"
```

## Environment Doctor

The `just doctor` command provides a quick health check of your development environment.

**What it checks:**

- Current user and OS information
- Shell and PATH configuration
- Availability of core tools (git, node, pnpm, python, rust, etc.)
- Tool versions

**Usage:**

```bash
just doctor
```

**Security:** The doctor script intentionally avoids printing environment variables or secrets. It only reports tool availability and versions.

## Secret Management (Pre-commit Hook)

A pre-commit hook prevents accidental commit of plaintext secrets.

**Setup:**

```bash
# Configure git to use .githooks directory
git config core.hooksPath .githooks
```

**What it prevents:**

- Committing plaintext `.env` or `.env.local` files
- Committing content with common secret patterns (API keys, tokens, passwords)

**Allowed:**

- Encrypted secrets (`.secrets.env.sops`)
- Environment variable references

**Override (not recommended):**

```bash
# Bypass the hook (only if absolutely necessary)
git commit --no-verify
```

## Task Orchestration with Just

All common development tasks are defined in the `justfile`:

### Setup & Health

```bash
just setup          # Install all dependencies
just doctor         # Check environment health
just test-env       # Run environment tests
```

### Development

```bash
just dev            # Start development servers
just build          # Build all projects
just test           # Run all tests
just lint           # Run linters
```

### AI Workflows

```bash
just ai-context-bundle   # Generate AI context bundle
just ai-validate         # Lint, typecheck, and test
just ai-scaffold name=@nx/js:lib   # Scaffold with Nx generator
```

### Debugging & Analysis

```bash
just spec-guard     # Validate specs and documentation
just prompt-lint    # Lint prompt files
```

## Environment Variables

VibesPro uses environment variables for configuration:

- **Local development:** Use `.envrc` (with direnv) or export manually
- **CI/CD:** Set in GitHub Actions secrets
- **Secrets:** Encrypt with SOPS (`.secrets.env.sops`)

**Never commit plaintext secrets.**

## Troubleshooting

### `just` command not found

Install just:

```bash
# Linux/macOS (with Homebrew)
brew install just

# Or via cargo
cargo install just
```

### Tests fail with "pipefail" error

The test harness requires bash (not sh):

```bash
# Verify bash is available
which bash

# Run tests with bash explicitly
bash tests/env/run.sh
```

### Doctor reports missing tools

Install missing tools or update PATH:

```bash
# Example: Install pnpm
corepack enable
corepack prepare pnpm@latest --activate

# Example: Install uv (Python package manager)
curl -LsSf https://astral.sh/uv/install.sh | sh
```

## Continuous Integration

Environment tests run in CI to ensure consistency:

- Validates tool availability
- Checks configuration integrity
- Prevents secret leakage
- Enforces code quality standards

See `.github/workflows/` for CI configuration.

## Next Steps

- ✅ **Phase 0:** Test harness and guardrails (complete)
- ✅ **Phase 1:** Devbox integration (`devbox.json`) (complete)
- ✅ **Phase 2:** mise runtime management (`.mise.toml`) (complete)
- **Phase 3:** Add SOPS secret encryption
- **Phase 4:** Add minimal CI workflows
- **Phase 5:** Add Volta coexistence checks
- **Phase 6:** Ensure Just tasks are environment-aware

See `docs/tmp/devenv.md` for the complete environment setup roadmap.

## References

- [Just Manual](https://just.systems/man/en/)
- [SOPS Documentation](https://github.com/getsops/sops)
- [Devbox Documentation](https://www.jetpack.io/devbox/)
- [mise Documentation](https://mise.jdx.dev/)
- [pnpm Documentation](https://pnpm.io/)
- [uv Documentation](https://github.com/astral-sh/uv)
