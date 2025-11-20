# Scripts Directory

Organized scripts for CI, setup, and development tasks.

## Directory Structure

- **`ci/`** - CI/CD-specific scripts (used in GitHub Actions workflows)
- **`setup/`** - Environment setup and installation scripts
- **`dev/`** - Development utilities and tools
- **`seed/`** - Database seeding scripts
- **`init/`** - Project initialization scripts

## CI Scripts

| Script                         | Purpose                        | Used By                         |
| ------------------------------ | ------------------------------ | ------------------------------- |
| `decrypt-ci-env.sh`            | Decrypt SOPS secrets in CI     | build-matrix.yml, env-check.yml |
| `fetch_github_actions_logs.sh` | Download CI logs for debugging | Manual                          |

## Setup Scripts

| Script                     | Purpose                       |
| -------------------------- | ----------------------------- |
| `install_supabase.sh`      | Install Supabase CLI          |
| `ensure_rust_toolchain.sh` | Ensure correct Rust toolchain |
| `install-hooks.sh`         | Install git pre-commit hooks  |
| `devbox_boot.sh`           | Devbox shell initialization   |
| `devbox_fix_pin.sh`        | Fix Devbox nixpkgs pinning    |

## Development Scripts

| Script                             | Purpose                             |
| ---------------------------------- | ----------------------------------- |
| `check_supabase_in_devbox.sh`      | Verify Supabase availability        |
| `check_supabase_overlay.sh`        | Validate Supabase overlay           |
| `validate_supabase_overlay_pin.sh` | Check overlay pin correctness       |
| `verify-node.sh`                   | Verify Node version consistency     |
| `doctor.sh`                        | Environment health check            |
| `run-with-secrets.sh`              | Run commands with decrypted secrets |

## Deprecated/Redundant Scripts

The following scripts may be redundant or deprecated:

- `just` - Wrapper for just command (use mise instead)
- `copier` - Wrapper for copier command (use uv tool instead)
