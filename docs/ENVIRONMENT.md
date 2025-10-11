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

## SOPS (Secret Encryption)

SOPS (Secrets OPerationS) provides encrypted secret management for local development and CI/CD.

### What is SOPS?

SOPS encrypts files using age, AWS KMS, GCP KMS, Azure Key Vault, or PGP:
- **Encrypted at rest:** Secrets committed to git are encrypted
- **Decrypted in memory:** Only at runtime via direnv or CI
- **Fine-grained:** Encrypt only specific keys (encrypted_regex)
- **Git-friendly:** Encrypted files can be safely committed

### Installation

```bash
# Install SOPS (if not already installed)
brew install sops age  # macOS/Linux with Homebrew

# Or download binaries
# SOPS: https://github.com/getsops/sops/releases
# age: https://github.com/FiloSottile/age/releases

# Verify installation
sops --version
age --version
```

### First-Time Setup

**1. Generate an age key pair:**

```bash
# Generate key (only do this once)
age-keygen -o ~/.config/sops/age/keys.txt

# View your public key
grep 'public key:' ~/.config/sops/age/keys.txt
# Example output: age1abc123...xyz
```

**2. Update `.sops.yaml` with your public key:**

```yaml
creation_rules:
  - path_regex: \.secrets\.env\.sops$
    encrypted_regex: ^(OPENAI_API_KEY|DATABASE_URL|GITHUB_TOKEN|.*_SECRET|.*_KEY|.*_PASSWORD)$
    age: age1abc123...xyz  # Replace with YOUR public key from step 1
```

**3. Encrypt the secrets file:**

```bash
# Encrypt in place
sops -e -i .secrets.env.sops

# Verify it's encrypted
cat .secrets.env.sops
# Should show: sops_age__list_0__map_enc: ...
```

**4. Export age key for runtime decryption:**

```bash
# Add to your shell RC file (~/.bashrc or ~/.zshrc)
export SOPS_AGE_KEY_FILE=$HOME/.config/sops/age/keys.txt

# Reload shell
exec $SHELL
```

### Configuration

The `.sops.yaml` file controls what gets encrypted:

```yaml
creation_rules:
  - path_regex: \.secrets\.env\.sops$
    encrypted_regex: ^(OPENAI_API_KEY|DATABASE_URL|GITHUB_TOKEN|.*_SECRET|.*_KEY|.*_PASSWORD)$
    age: age1abc123...xyz
```

**Key Fields:**
- `path_regex`: Which files to encrypt (uses regex)
- `encrypted_regex`: Which keys within the file to encrypt (case-sensitive)
- `age`: Your age public key (from `age-keygen`)

### Usage

**Encrypting secrets:**

```bash
# Encrypt file in place
sops -e -i .secrets.env.sops

# Encrypt and create new file
sops -e .secrets.env.sops > .secrets.env.sops.encrypted
```

**Decrypting secrets:**

```bash
# Decrypt to stdout (inspect without saving)
sops -d .secrets.env.sops

# Decrypt to file (NEVER commit this!)
sops -d .secrets.env.sops > .env
```

**Editing encrypted secrets:**

```bash
# Opens in $EDITOR, auto-decrypts and re-encrypts on save
sops .secrets.env.sops
```

**Running commands with secrets:**

```bash
# One-time command with secrets loaded
sops exec-env .secrets.env.sops 'echo $OPENAI_API_KEY'

# Or use direnv (see below)
```

### Local Development (direnv Integration)

The `.envrc` file automatically decrypts secrets when you `cd` into the project:

```bash
# .envrc content (already configured in this repo)
use mise
watch_file .secrets.env.sops
eval "$(sops --decrypt .secrets.env.sops | sed 's/^/export /')"
```

**Setup direnv:**

```bash
# Install direnv
brew install direnv  # macOS/Linux

# Activate in shell (add to ~/.bashrc or ~/.zshrc)
eval "$(direnv hook bash)"  # or zsh

# Allow this repo's .envrc
cd /path/to/VibesPro
direnv allow
```

**How it works:**
1. You `cd` into the project directory
2. direnv automatically runs `.envrc`
3. `.envrc` decrypts `.secrets.env.sops` using your age key
4. Environment variables are loaded into your shell
5. When you `cd` out, variables are unloaded

**Security notes:**
- Secrets are only in memory, never written to disk unencrypted
- Age key (`~/.config/sops/age/keys.txt`) must be secured (chmod 600)
- direnv only works locally; CI uses different method (see below)

### CI/CD Integration

**GitHub Actions example:**

```yaml
name: CI
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # Install SOPS and age
      - name: Install SOPS
        run: |
          curl -LO https://github.com/getsops/sops/releases/download/v3.8.1/sops-v3.8.1.linux.amd64
          chmod +x sops-v3.8.1.linux.amd64
          sudo mv sops-v3.8.1.linux.amd64 /usr/local/bin/sops

      # Set age key from GitHub secret
      - name: Decrypt secrets
        env:
          SOPS_AGE_KEY: ${{ secrets.SOPS_AGE_KEY }}
        run: |
          mkdir -p ~/.config/sops/age
          echo "$SOPS_AGE_KEY" > ~/.config/sops/age/keys.txt
          chmod 600 ~/.config/sops/age/keys.txt

          # Export decrypted secrets to GITHUB_ENV
          sops -d .secrets.env.sops | tee -a $GITHUB_ENV

      # Now secrets are available as env vars
      - name: Run tests
        run: just test
```

**Setup in GitHub:**
1. Go to repository Settings → Secrets and variables → Actions
2. Add secret named `SOPS_AGE_KEY`
3. Paste your **private age key** (from `~/.config/sops/age/keys.txt`)

**WARNING:** Never commit your private age key to git!

### Security Best Practices

✅ **DO:**
- Commit `.secrets.env.sops` (encrypted) to git
- Use `.gitignore` to block plaintext `.env*` files
- Rotate age keys periodically
- Use different age keys for different environments (dev/staging/prod)
- Keep age private key secure (chmod 600)

❌ **DON'T:**
- Commit plaintext `.env` files
- Share your age private key
- Use the same key across multiple projects
- Decrypt secrets to disk unnecessarily

### Template Mode (for generated projects)

VibesPro includes `.secrets.env.sops` as an **unencrypted template**:

```bash
# Example placeholder content
APP_ENV=production
APP_VERSION=0.1.0
OPENAI_API_KEY=sk-placeholder-replace-me
DATABASE_URL=postgresql://user:pass@localhost/db
```

**After generating a project:**
1. Replace placeholders with real values
2. Update `.sops.yaml` with your age public key
3. Encrypt: `sops -e -i .secrets.env.sops`
4. Setup direnv: `direnv allow`

### Troubleshooting

**Problem:** `sops: command not found`
```bash
# Install SOPS
brew install sops  # macOS/Linux with Homebrew

# Or download binary from GitHub releases
```

**Problem:** `Failed to get the data key required to decrypt the SOPS file`
```bash
# Ensure SOPS_AGE_KEY_FILE is set
export SOPS_AGE_KEY_FILE=$HOME/.config/sops/age/keys.txt

# Verify key file exists and is readable
ls -l ~/.config/sops/age/keys.txt
# Should show: -rw------- (chmod 600)
```

**Problem:** `no matching creation rules found`
```bash
# Ensure .sops.yaml path_regex matches your file
# Default: \.secrets\.env\.sops$

# Test regex match
echo ".secrets.env.sops" | grep -E '\.secrets\.env\.sops$'
```

**Problem:** `direnv: .envrc is blocked`
```bash
# You must explicitly allow .envrc
direnv allow

# Check direnv status
direnv status
```

**Problem:** Secrets not loading in shell
```bash
# Verify direnv is hooked
echo $DIRENV_DIR  # Should show current directory

# Check .envrc was evaluated
direnv reload

# Manually test SOPS decryption
sops -d .secrets.env.sops  # Should show plaintext
```

**Problem:** CI can't decrypt secrets
```bash
# Ensure GitHub secret SOPS_AGE_KEY contains the PRIVATE key
# (entire contents of ~/.config/sops/age/keys.txt)

# Verify in CI logs (without echoing the key!)
- run: |
    echo "Age key file exists: $(test -f ~/.config/sops/age/keys.txt && echo yes || echo no)"
```

### Alternatives to SOPS

If SOPS doesn't fit your workflow:

- **Doppler:** Cloud-based secret management (SaaS)
- **Vault:** HashiCorp Vault (self-hosted)
- **AWS Secrets Manager / GCP Secret Manager:** Cloud provider native
- **1Password CLI:** For teams already using 1Password

SOPS is chosen for VibesPro because:
- ✅ Encrypted secrets can be committed to git
- ✅ No external service dependency
- ✅ Works offline
- ✅ Free and open source
- ✅ Git-friendly diffs (only changed keys show as changed)



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
├── test_mise_versions.sh # Validates mise runtime versions
├── test_sops_local.sh   # Validates SOPS encryption setup
├── test_ci_minimal.sh   # Validates CI workflow configuration
└── test_volta_mise_guard.sh # Validates Volta/mise version alignment
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

VibesPro includes automated CI workflows that validate the environment setup and ensure consistency across development and production environments.

### Overview

The CI system uses GitHub Actions with two primary workflows:

1. **env-check.yml** - Validates environment setup on Ubuntu
2. **build-matrix.yml** - Tests on Ubuntu and macOS with full build matrix

Both workflows follow the same layered approach as local development:
- Install Devbox (OS-level tools)
- Install mise (runtime versions)
- Decrypt secrets with SOPS
- Run tests and builds

### Environment Validation Workflow

**File:** `.github/workflows/env-check.yml`

This workflow runs on every push and pull request to validate:

**System Setup:**
- ✅ Installs SOPS, age, jq, make via apt
- ✅ Installs Devbox for OS-level toolchain
- ✅ Installs mise for runtime management
- ✅ Caches mise runtimes for faster builds

**Secret Management:**
- ✅ Decrypts `.secrets.env.sops` using `SOPS_AGE_KEY` secret
- ✅ Loads secrets into ephemeral environment
- ✅ Cleans up decrypted secrets after run
- ✅ **Does NOT use direnv** (explicit decryption instead)

**Validation Steps:**
- ✅ Verifies Devbox environment works
- ✅ Installs all mise runtimes (Node, Python, Rust)
- ✅ Checks for Volta/mise version conflicts
- ✅ Installs project dependencies (pnpm, uv)
- ✅ Runs build and test suites

**Key Features:**
```yaml
# Explicit SOPS decryption (not direnv)
- name: Decrypt secrets to ephemeral env
  run: |
    sops -d .secrets.env.sops > /tmp/ci.env
    set -a; source /tmp/ci.env; set +a
  env:
    SOPS_AGE_KEY: ${{ secrets.SOPS_AGE_KEY }}

# Always cleanup secrets
- name: Cleanup secrets
  if: always()
  run: rm -f /tmp/ci.env
```

### Build Matrix Workflow

**File:** `.github/workflows/build-matrix.yml`

This workflow provides comprehensive cross-platform testing:

**Matrix Strategy:**
```yaml
matrix:
  os: [ ubuntu-latest, macos-latest ]
```

**Features:**
- ✅ Tests on both Ubuntu and macOS
- ✅ Fail-fast: false (tests all platforms even if one fails)
- ✅ Platform-specific package managers (apt vs brew)
- ✅ Shared cache for mise runtimes
- ✅ Parallel execution for faster feedback

**Prepare Job:**
- Introspects `.mise.toml` for runtime versions
- Computes cache keys
- Outputs versions for matrix jobs to use

**Build-Test Job:**
- Runs on each OS in parallel
- Installs base tools (sops, age, jq)
- Sets up Devbox and mise
- Decrypts secrets
- Runs full build and test suite

### Setting Up CI Secrets

**Required GitHub Secret:**

1. Go to repository **Settings → Secrets and variables → Actions**
2. Click **New repository secret**
3. Name: `SOPS_AGE_KEY`
4. Value: Your **private age key** (contents of `~/.config/sops/age/keys.txt`)

**Security Notes:**
- ⚠️ The private age key grants access to all encrypted secrets
- 🔒 Only add to trusted repositories
- 🔄 Rotate keys periodically
- 📝 Consider using environment-specific keys (dev/staging/prod)

### CI vs Local Development

| Aspect | Local Development | CI/CD |
|--------|------------------|--------|
| **Secret Loading** | direnv (automatic) | Explicit `sops -d` |
| **Tool Installation** | Manual (one-time) | Automated (every run) |
| **Caching** | System-wide | GitHub Actions cache |
| **Environment** | Interactive shell | Non-interactive |
| **mise Activation** | Shell hook | `mise exec --` |
| **Cleanup** | Manual | Always via `if: always()` |

**Why No direnv in CI?**
- ✅ Explicit > Implicit in CI
- ✅ Easier to debug failures
- ✅ No shell hook dependencies
- ✅ Clear secret lifecycle

### Running Tests Locally Before CI

Validate your changes pass CI checks before pushing:

```bash
# Run all environment tests (same as CI validation)
just test-env

# Check environment health
just doctor

# Verify Node version alignment
just verify:node

# Run full test suite
just test

# Build all projects
just build
```

### CI Workflow Files

```
.github/workflows/
├── env-check.yml          # Environment validation (Ubuntu)
├── build-matrix.yml       # Cross-platform build matrix
├── node-tests.yml         # Node-specific test suite
├── integration-tests.yml  # Integration test suite
├── security-scan.yml      # Security scanning (Semgrep, etc.)
├── markdownlint.yml       # Documentation linting
└── spec-guard.yml         # Specification validation
```

### Debugging CI Failures

**Problem:** `sops: Failed to get the data key`

```yaml
# Solution: Ensure SOPS_AGE_KEY secret is set
# Check in workflow logs (key won't be printed)
- run: |
    echo "Age key file exists: $(test -f ~/.config/sops/age/keys.txt && echo yes || echo no)"
```

**Problem:** `mise: command not found`

```yaml
# Solution: Ensure mise is in PATH after installation
- run: |
    curl https://mise.run | bash
    echo "$HOME/.local/bin" >> $GITHUB_PATH  # Critical!
```

**Problem:** Runtime version mismatch

```yaml
# Solution: Check .mise.toml is committed and up-to-date
- run: |
    mise ls
    mise current
```

**Problem:** Cache not restoring

```yaml
# Solution: Verify cache key matches across jobs
key: mise-${{ runner.os }}-${{ hashFiles('.mise.toml') }}
# Ensure .mise.toml is not modified during workflow
```

**Problem:** Secrets not available in environment

```yaml
# Solution: Use set -a to export all variables
- run: |
    sops -d .secrets.env.sops > /tmp/ci.env
    set -a; source /tmp/ci.env; set +a  # Exports all vars
    env | grep -E 'APP_|OPENAI'  # Verify (remove in production)
```

### Workflow Triggers

**env-check.yml:**
```yaml
on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
```

**build-matrix.yml:**
```yaml
on:
  push:
    branches: [ main ]
    tags: [ "v*.*.*" ]  # Also on version tags
  pull_request:
    branches: [ main ]
```

### Performance Optimization

**Caching Strategy:**

```yaml
# Cache mise runtimes (saves ~2-3 minutes per run)
- uses: actions/cache@v4
  with:
    path: |
      ~/.local/share/mise
      ~/.cache/mise
    key: mise-${{ runner.os }}-${{ hashFiles('.mise.toml') }}

# Cache pnpm dependencies (saves ~1-2 minutes)
- uses: actions/cache@v4
  with:
    path: ~/.pnpm-store
    key: pnpm-${{ runner.os }}-${{ hashFiles('pnpm-lock.yaml') }}
```

**Concurrency Control:**

```yaml
# Cancel in-progress runs on new push
concurrency:
  group: env-check-${{ github.ref }}
  cancel-in-progress: true
```

### Monitoring CI Health

**Key Metrics:**
- ✅ Build time: Target < 5 minutes for env-check
- ✅ Cache hit rate: Should be > 80% for mise/pnpm
- ✅ Test pass rate: Should be 100% on main branch
- ✅ Secret decryption: Should always succeed

**When to Update Workflows:**
- Tool version changes (mise, devbox, sops)
- New runtime added to `.mise.toml`
- Additional OS-level dependencies needed
- Security updates for actions (dependabot)

### Local CI Simulation

Test CI behavior locally with act:

```bash
# Install act (optional)
brew install act  # macOS
# or: https://github.com/nektos/act

# Run workflow locally
act -j env-check

# Run with secrets
act -j env-check --secret-file .secrets.env
```

**Note:** act has limitations (no full Devbox support), use for quick validation only.

### Environment Test Coverage

The CI validates these aspects via `just test-env`:

| Test | Purpose | CI Validation |
|------|---------|---------------|
| `test_sanity.sh` | Basic harness works | ✅ |
| `test_doctor.sh` | Doctor script output | ✅ |
| `test_harness.sh` | Test discovery | ✅ |
| `test_devbox.sh` | Devbox config valid | ✅ |
| `test_mise_versions.sh` | Runtime versions match | ✅ |
| `test_sops_local.sh` | SOPS config valid | ✅ |
| `test_ci_minimal.sh` | CI workflow validation | ✅ |
| `test_volta_mise_guard.sh` | Volta/mise alignment | ✅ |

**Total:** 8 environment tests run in CI

### Adding New CI Checks

To add a new validation step:

1. **Create test locally:**
   ```bash
   # Create tests/env/test_new_feature.sh
   # Ensure it uses helpers.sh and follows TDD
   ```

2. **Run locally:**
   ```bash
   just test-env
   ```

3. **CI automatically picks it up:**
   - Test discovery in `tests/env/run.sh` finds `test_*.sh`
   - No workflow changes needed

4. **For non-env tests:**
   ```yaml
   # Add step to .github/workflows/env-check.yml
   - name: Run new check
     run: just new-check
   ```

### Best Practices

✅ **DO:**
- Keep workflows DRY (use reusable actions)
- Cache aggressively (mise, pnpm, apt packages)
- Fail fast for quick feedback
- Clean up secrets with `if: always()`
- Use matrix testing for cross-platform compatibility
- Pin action versions (`@v4` not `@main`)

❌ **DON'T:**
- Use direnv in CI (explicit is better)
- Echo secrets in logs (even masked)
- Skip cleanup steps
- Hardcode versions (use `.mise.toml` as source of truth)
- Commit decrypted secrets
- Run tests without caching

### Troubleshooting Guide

See individual sections above for specific error solutions.

**General debugging steps:**

1. Check workflow runs in GitHub Actions UI
2. Look for red ❌ step failures
3. Expand failed step to see logs
4. Reproduce locally: `just test-env && just build && just test`
5. Fix locally, commit, push
6. Verify CI passes

**For persistent failures:**
- Re-run workflow (may be transient)
- Clear caches (Settings → Actions → Caches)
- Check GitHub Actions status page
- Review recent changes to workflows or configuration files

## Volta Coexistence & Migration

### Overview

VibesPro uses **mise as the authoritative runtime manager**, but allows Volta configuration in `package.json` for gradual migration. The `verify-node` script detects version conflicts and enforces alignment.

### Checking for Conflicts

```bash
# Check Node version alignment
just verify-node
```

**Possible outcomes:**

1. **✅ Versions aligned:**
   ```
   ✅ Node versions aligned (major version 20)
      mise will be used as authoritative source
   ```

2. **❌ Version mismatch:**
   ```
   ❌ ERROR: Node version mismatch between mise and Volta!

      mise (.mise.toml):      20.11.1
      Volta (package.json):   18.17.0

      Please align versions:
      1. Update .mise.toml to match Volta, OR
      2. Update package.json Volta section to match mise, OR
      3. Remove Volta section from package.json (mise is authoritative)
   ```

3. **ℹ️ mise only (recommended):**
   ```
   ✅ mise is managing Node (20.11.1)
      No Volta configuration detected
   ```

### Migration Strategies

**Option 1: Gradual Migration (Keep Volta Aligned)**

Keep the Volta section in `package.json` but ensure it matches mise:

```json
// package.json
{
  "volta": {
    "node": "20.11.1"  // Match .mise.toml major version
  }
}
```

```toml
# .mise.toml
[tools]
node = "20.11.1"
```

**Benefits:**
- Team members can continue using Volta temporarily
- Gradual transition reduces disruption
- CI enforces alignment

**Drawbacks:**
- Two sources of truth (risk of drift)
- Requires manual synchronization

**Option 2: Clean Migration (Remove Volta)**

Remove Volta configuration entirely:

```bash
# Remove volta section from package.json
# (delete the "volta" key)

# Ensure .mise.toml has Node version
cat .mise.toml
# [tools]
# node = "20.11.1"

# Verify
just verify-node
# ✅ mise is managing Node (20.11.1)
```

**Benefits:**
- Single source of truth
- No synchronization needed
- Simpler configuration

**Drawbacks:**
- All team members must switch to mise
- Immediate change required

### Why mise Over Volta?

| Aspect | Volta | mise |
|--------|-------|------|
| **Languages** | Node only | Node, Python, Rust, 50+ |
| **Configuration** | package.json | .mise.toml (centralized) |
| **Installation** | Binary download | Pre-built binaries via plugins |
| **Shell Integration** | Automatic shim | Shell hooks + direct |
| **Speed** | Fast | Very fast (Rust-based) |
| **Plugin Ecosystem** | Limited | Extensive (asdf compatible) |
| **Active Development** | Slowing | Very active |

### CI Enforcement

Both CI workflows (`env-check.yml` and `build-matrix.yml`) run `just verify-node`:

```yaml
- name: Verify Node pins (mise vs Volta)
  run: just verify-node
```

**Behavior:**
- ✅ Passes if versions aligned or Volta absent
- ❌ Fails if major version mismatch
- Ensures consistent Node version across environments

### Deprecation Timeline

**Current:** Volta optional, must align if present (Phase 5 complete)
**Next minor release:** Deprecation warnings added
**Two releases later:** Volta section ignored, warnings removed
**Future:** mise-only configuration

**Recommendation:** Migrate to mise-only configuration now to avoid future disruption.

### Troubleshooting

**Problem:** `just verify-node` fails with mismatch

```bash
# Solution 1: Update mise to match Volta
# Edit .mise.toml to use Volta's version

# Solution 2: Update Volta to match mise
# Edit package.json volta.node to match .mise.toml

# Solution 3: Remove Volta (recommended)
# Delete "volta" section from package.json
```

**Problem:** Team members still using Volta

```bash
# Coordinate migration:
# 1. Announce mise transition with timeline
# 2. Share mise installation guide
# 3. Keep Volta aligned during transition period
# 4. Remove Volta section after team migrates
```

**Problem:** Different Node versions needed per project

```bash
# mise handles this automatically via .mise.toml
cd project-a  # Uses .mise.toml (node = "18.17.0")
cd ../project-b  # Uses .mise.toml (node = "20.11.1")

# No manual switching needed
```

### Testing Version Alignment

The `tests/env/test_volta_mise_guard.sh` test validates:
- ✅ verify-node script exists and is runnable
- ✅ just verify-node target exists
- ✅ Script detects mise configuration
- ✅ Script correctly identifies version mismatches (major version)
- ✅ Script allows same major version with different minor/patch
- ✅ Script works with mise-only configuration

Run tests:
```bash
just test-env
# ✅ test_volta_mise_guard.sh passes
```

## Just Task Environment Requirements

### Overview

VibesPro uses **Just** as a task runner to orchestrate development workflows across multiple languages (Node.js, Python, Rust). All tasks are designed to work seamlessly with **mise** as the authoritative runtime manager.

**Key principle:** Tasks gracefully degrade when dependencies are unavailable, providing clear error messages and installation instructions.

### Environment Detection

Tasks automatically detect and use mise-managed runtimes:

```bash
# mise ensures correct versions are active
$ just setup          # Uses mise-managed Node, Python, tools
$ just test-node      # Uses pnpm from mise Node installation
$ just test-python    # Uses uv/pytest from mise Python
```

### Task Categories & Runtime Requirements

#### Setup Tasks

| Task | Requires | Purpose | Environment Check |
|------|----------|---------|-------------------|
| `setup` | Node, Python, Copier | Full environment setup | Delegates to sub-tasks |
| `setup-node` | pnpm (via mise Node) | Install Node dependencies | None (assumes pnpm via corepack) |
| `setup-python` | uv (via mise Python) | Install Python dependencies | None (assumes uv available) |
| `setup-tools` | uv | Install Copier template tool | Checks `command -v copier` |
| `verify-node` | bash | Verify Node version alignment | None (bash script) |

#### Development Tasks

| Task | Requires | Purpose | Environment Check |
|------|----------|---------|-------------------|
| `dev` | Nx, pnpm | Start all development servers | None (assumes setup complete) |
| `env-enter` | devbox | Enter Devbox shell | ✅ Checks `command -v devbox` |

#### Build Tasks

| Task | Requires | Purpose | Environment Check |
|------|----------|---------|-------------------|
| `build` | Nx or Python build | Auto-detect build strategy | Checks for `nx.json` |
| `build-nx` | Nx, pnpm | Build all Nx projects | None |
| `build-direct` | Python, pnpm | Build without Nx | None |

#### Test Tasks

| Task | Requires | Purpose | Environment Check |
|------|----------|---------|-------------------|
| `test` | Auto-detect | Run all tests | Delegates based on `nx.json` |
| `test-node` | pnpm, Jest | Run Node.js tests | None |
| `test-python` | uv, pytest | Run Python tests | None |
| `test-env` | bash | Run environment validation tests | None |
| `test-integration` | Copier, pnpm | Test template generation | None |

#### Lint & Format Tasks

| Task | Requires | Purpose | Environment Check |
|------|----------|---------|-------------------|
| `lint` | All linters | Run all linters | Delegates to sub-tasks |
| `lint-node` | pnpm, ESLint | Lint Node.js code | None |
| `lint-python` | uv, ruff, mypy | Lint Python code | None |
| `format-node` | pnpm, Prettier | Format Node.js code | None |
| `format-python` | uv, black, isort | Format Python code | None |

#### AI Workflow Tasks

| Task | Requires | Purpose | Environment Check |
|------|----------|---------|-------------------|
| `ai-validate` | pnpm, Nx (optional) | Lint + typecheck + tests | ✅ Checks `command -v pnpm` |
| `ai-scaffold` | pnpm, Nx | Run Nx generator | ✅ Checks `command -v pnpm` |
| `ai-context-bundle` | bash | Bundle AI context | None |

#### Security Tasks

| Task | Requires | Purpose | Environment Check |
|------|----------|---------|-------------------|
| `security-audit` | cargo | Audit Rust dependencies | ✅ Checks `command -v cargo` |
| `security-benchmark` | cargo | Performance benchmarks | ✅ Checks `command -v cargo` |

#### Documentation Tasks

| Task | Requires | Purpose | Environment Check |
|------|----------|---------|-------------------|
| `docs-generate` | node | Generate documentation | None (direct `node` call) |
| `docs-serve` | Python http.server | Serve docs locally | None |

### Graceful Degradation Examples

Tasks check for tool availability before executing:

**Example 1: ai-validate**
```makefile
ai-validate:
    @echo "🔍 Validating project..."
    @if command -v pnpm > /dev/null 2>&1; then \
        if [ -f package.json ] && grep -q '"lint"' package.json; then \
            echo "Running lint..."; \
            pnpm run lint || true; \
        else \
            echo "⚠️  No 'lint' script found in package.json. Skipping lint."; \
        fi; \
        # ... more checks
    else \
        echo "⚠️  pnpm not found. Skipping validation."; \
        echo "Run 'just setup' to install dependencies."; \
    fi
```

**Example 2: env-enter**
```makefile
env-enter:
    @echo "🎯 Entering Devbox environment..."
    @if command -v devbox >/dev/null 2>&1; then \
        devbox shell; \
    else \
        echo "❌ Devbox not installed"; \
        echo "   Install: curl -fsSL https://get.jetpack.io/devbox | bash"; \
        exit 1; \
    fi
```

**Example 3: security-audit**
```makefile
security-audit:
    @echo "🔐 Running security audit..."
    @if command -v cargo > /dev/null 2>&1; then \
        cargo install cargo-audit --quiet 2>/dev/null || true; \
        cd libs/security && (cargo audit || echo "⚠️  Audit warnings found but continuing..."); \
    else \
        echo "❌ cargo not found. Please install Rust."; \
        exit 1; \
    fi
```

### Common Patterns

#### Pattern 1: Check Tool Availability
```makefile
task-name:
    @if command -v tool > /dev/null 2>&1; then \
        tool command; \
    else \
        echo "❌ tool not found. Install via: mise install"; \
        exit 1; \
    fi
```

#### Pattern 2: Optional Features
```makefile
task-name:
    @if [ -f config.json ]; then \
        echo "Using config.json"; \
    else \
        echo "⚠️  config.json not found, using defaults"; \
    fi
```

#### Pattern 3: Multi-Tool Chains
```makefile
task-name:
    @if command -v tool1 && command -v tool2; then \
        tool1 | tool2; \
    else \
        echo "❌ Requires tool1 and tool2"; \
        echo "   Run: just setup"; \
        exit 1; \
    fi
```

### Environment Validation

Run environment tests to validate Just task integration:

```bash
# Run all environment tests (including Just task awareness)
just test-env

# Expected output:
# ✅ test_just_env_awareness.sh passes
# ✅ Validates all critical tasks exist
# ✅ Confirms tasks check for tool availability
# ✅ Verifies tasks degrade gracefully
```

**Test coverage (9 tests):**
- `test_sanity.sh` - Basic harness validation
- `test_doctor.sh` - Doctor script validation
- `test_harness.sh` - Test discovery mechanism
- `test_devbox.sh` - Devbox configuration
- `test_mise_versions.sh` - mise runtime versions
- `test_sops_local.sh` - SOPS encryption setup
- `test_ci_minimal.sh` - CI workflow validation
- `test_volta_mise_guard.sh` - Volta/mise alignment
- `test_just_env_awareness.sh` - **Just task environment checks** ✨ **NEW**

### Task Execution Best Practices

1. **Always run `just setup` first** in new environments
   ```bash
   just setup  # Installs all dependencies (Node, Python, tools)
   ```

2. **Verify environment before running tasks**
   ```bash
   just test-env     # Validates entire environment
   just verify-node  # Checks Node version alignment
   just doctor       # Comprehensive environment check
   ```

3. **Use mise for runtime version management**
   ```bash
   mise install      # Install all runtimes from .mise.toml
   mise current      # Show active runtime versions
   ```

4. **Let tasks handle missing tools gracefully**
   - Tasks provide clear installation instructions
   - No need to manually check for tools
   - Run `just <task>` and follow error messages

### CI Integration

Just tasks work seamlessly in CI environments with mise:

**GitHub Actions Example:**
```yaml
- name: Install mise
  uses: jdx/mise-action@v2

- name: Install dependencies
  run: just setup

- name: Verify environment
  run: |
    just verify-node  # Check Node version alignment
    just test-env     # Run environment tests

- name: Build and test
  run: |
    just build
    just test
```

See `.github/workflows/env-check.yml` and `.github/workflows/build-matrix.yml` for complete examples.

### Troubleshooting

#### Task fails with "command not found"

**Problem:** `just <task>` fails with "pnpm: command not found"

**Solution:**
```bash
# Install mise if not installed
curl https://mise.jdx.dev/install.sh | sh

# Install runtimes from .mise.toml
mise install

# Re-run setup
just setup
```

#### Task skips steps with warnings

**Problem:** Task shows "⚠️  Nx not available" warnings

**Solution:**
```bash
# This is expected behavior - task degrades gracefully
# If you need the skipped functionality:
just setup-node  # Installs Nx via pnpm
```

#### Incorrect Node version used

**Problem:** Task uses wrong Node version

**Solution:**
```bash
# Verify mise is managing Node
mise current

# Check for Volta conflicts
just verify-node

# Fix version mismatch (see Volta Coexistence section)
```

### Testing Just Tasks

The `test_just_env_awareness.sh` test validates:

- ✅ justfile exists and is well-formed
- ✅ just command is available
- ✅ All critical tasks are defined
- ✅ Node tasks check for pnpm availability
- ✅ Python tasks check for uv availability
- ✅ Cargo tasks check for cargo availability
- ✅ Tasks gracefully degrade when tools unavailable
- ✅ Environment setup tasks properly ordered
- ✅ verify-node integration works
- ✅ Shell safety best practices followed

Run test:
```bash
bash tests/env/test_just_env_awareness.sh
# ✅ All Just task environment awareness checks passed
```

## Next Steps

- ✅ **Phase 0:** Test harness and guardrails (complete)
- ✅ **Phase 1:** Devbox integration (`devbox.json`) (complete)
- ✅ **Phase 2:** mise runtime management (`.mise.toml`) (complete)
- ✅ **Phase 3:** SOPS secret encryption (`.sops.yaml`, `.secrets.env.sops`) (complete)
- ✅ **Phase 4:** Minimal CI workflows (`env-check.yml`, `build-matrix.yml`) (complete)
- ✅ **Phase 5:** Volta coexistence checks (`verify-node`, conflict detection) (complete)
- ✅ **Phase 6:** Just task environment awareness (task validation, documentation) (complete)

**All 6 phases of the environment setup roadmap are now complete! 🎉**

See `docs/tmp/devenv.md` for the complete environment setup roadmap.

## References

- [Just Manual](https://just.systems/man/en/)
- [SOPS Documentation](https://github.com/getsops/sops)
- [Devbox Documentation](https://www.jetpack.io/devbox/)
- [mise Documentation](https://mise.jdx.dev/)
- [pnpm Documentation](https://pnpm.io/)
- [uv Documentation](https://github.com/astral-sh/uv)
