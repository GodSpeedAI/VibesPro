# Environment Integration Agent Instructions

## Overview

VibesPro uses **mise** and **devbox** for environment management. This creates a challenge for GUI applications (like VS Code with Nx Console) that don't inherit shell environments.

This directory contains scripts that solve this problem in a production-ready, portable way.

## The Problem

When VS Code is launched from the desktop (not a terminal), it doesn't inherit:

- PATH modifications from mise/devbox
- Environment variables from `.envrc`
- Tool shims from `~/.local/share/mise/shims`

This causes Nx Console to fail with "pnpm: not found" errors.

## The Solution

A multi-layer approach that ensures tools are available regardless of how VS Code is launched:

### Layer 1: systemd User Environment (`gui-env-setup.sh`)

Creates `~/.config/environment.d/50-vibespro.conf` which systemd reads at login and makes available to all user processes, including GUI apps.

```bash
./scripts/setup/gui-env-setup.sh --install-systemd
# Then: log out/in or run:
systemctl --user import-environment PATH
```

### Layer 2: VS Code Terminal Settings (`.vscode/settings.json`)

Sets PATH explicitly for VS Code's integrated terminal and extensions:

```json
"terminal.integrated.env.linux": {
  "PATH": "${env:HOME}/.local/share/mise/shims:..."
}
```

### Layer 3: Environment Wrapper Script (`env-wrapper.sh`)

A shell script that activates mise/devbox before running any command:

```bash
./scripts/env-wrapper.sh pnpm exec nx graph
./scripts/env-wrapper.sh just test
```

### Layer 4: VS Code Tasks (`.vscode/tasks.json`)

All tasks use the env-wrapper to ensure consistent environment.

## Scripts

| Script                   | Purpose                                     |
| ------------------------ | ------------------------------------------- |
| `env-wrapper.sh`         | Wraps commands with environment activation  |
| `shell-profile.sh`       | Shell integration for interactive terminals |
| `setup/gui-env-setup.sh` | Sets up PATH for GUI applications           |

## Quick Fix

If Nx Console shows "pnpm: not found":

1. Run from terminal (in the project directory):

   ```bash
   ./scripts/setup/gui-env-setup.sh --install-systemd
   systemctl --user import-environment PATH
   ```

2. Reload VS Code (Ctrl+Shift+P → "Developer: Reload Window")

3. If still not working, log out and back in (to apply systemd changes)

## Diagnostic Commands

```bash
# Check if environment is properly set up
source ./scripts/shell-profile.sh
vibespro-doctor

# Test the env-wrapper
./scripts/env-wrapper.sh node --version
./scripts/env-wrapper.sh pnpm --version

# Verify mise shims are working
which node   # Should point to mise shims
which pnpm   # Should point to mise shims
```

## CI/CD Considerations

In CI environments, the environment is typically set up by the workflow. The scripts detect this and skip activation if tools are already available.

```yaml
# Example GitHub Actions usage
- name: Run with env-wrapper
  run: ./scripts/env-wrapper.sh just test
```

## Architecture

```
User Login
    │
    ├── [systemd] Reads ~/.config/environment.d/*.conf
    │   └── Sets PATH with mise shims
    │
    ├── [Shell] Sources .bashrc/.zshrc
    │   └── shell-profile.sh adds mise hooks
    │
    └── [VS Code] Launched from desktop
        ├── [Internal] Reads PATH from systemd user environment
        ├── [Terminal] Uses settings.json env overrides
        └── [Tasks] Uses env-wrapper.sh
```

## Invariants

| ID     | Invariant          | Verification                           |
| ------ | ------------------ | -------------------------------------- | ---------------- |
| ENV-01 | mise shims in PATH | `echo $PATH                            | grep mise/shims` |
| ENV-02 | node available     | `which node` returns mise-managed path |
| ENV-03 | pnpm available     | `pnpm --version` succeeds              |
| ENV-04 | Nx Console works   | No "command not found" errors          |

## Traceability

- ADR: AI_ADR-001 (Environment Management)
- SDS: DEV-SDS-018 (Secret and Environment Handling)
