---
description: "Environment workflows for Copilot and AI agents"
applyTo: "**"
kind: instructions
domain: environment
precedence: 30
---

# Environment Stack

- Use the layered stack `Devbox → mise → SOPS → Just → pnpm/uv` and run commands from the repo root.
- Enter `devbox shell` (or `devbox run -- just <task>`) before touching OS tools defined in `devbox.json`.
- Run `mise install` whenever `.mise.toml` changes and avoid mixing in other runtime managers.

# Package Managers

- Use `pnpm` via Corepack for all Node workflows.
- Use `uv` for Python installs, scripts, and test runners.
- Let Just recipes drive package managers; do not call `npm`, `pip`, or `poetry` directly in this repo.

# Secrets and Environment Variables

- Store secrets only in `.secrets.env.sops`.
- Load secrets via `sops exec-env .secrets.env.sops '<command>'` or the provided `.envrc`, and never commit decrypted files.
- Keep the age key in `~/.config/sops/age/keys.txt` with `chmod 600`.
- In CI export `SOPS_AGE_KEY`, write the key file, and pipe `sops -d .secrets.env.sops` into `$GITHUB_ENV` as shown in `.github/workflows/*`.

# Required Commands

- Run `just setup` after cloning or when dependencies change so pnpm, uv, and tooling stay aligned.
- Keep `just doctor` clean before shipping changes.
- Treat `just ai-validate` as the default presubmit gate for lint, type checks, and targeted tests.
- Run `just test-generation` to verify template synthesis and inspect `../test-output`.
- Invoke Nx work via `nx run`, `nx run-many`, or the corresponding Just wrappers, never the raw framework CLIs.

# Python Tooling

- Prefer the mise-provided Python plus `uv`.
- When a virtual environment is unavoidable, create `.venv/`, install mypy plus stub packages, and keep the directory gitignored.
- Install `uv` via the official bootstrap script (`curl -LsSf https://astral.sh/uv/install.sh | sh`) if `just setup` has not already provided it.

# Troubleshooting References

- Use `docs/ENVIRONMENT.md` for deep-dive setup steps and recovery commands.
- Mirror `.github/workflows/*` when debugging CI parity; they are the authoritative minimal paths for Devbox, mise, pnpm, uv, and SOPS.
