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
└── test_sops_local.sh   # Validates SOPS encryption setup
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
- ✅ **Phase 3:** SOPS secret encryption (`.sops.yaml`, `.secrets.env.sops`) (complete)
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
