# Environment & Type Generation

This document describes the development environment steps for the Type Safety Pipeline, including Supabase CLI usage, type generation, and related `just` tasks.

## Requirements

- Devbox (project `devbox.json`) will now include `supabase` CLI for local DB migrations.
- Python developer dependencies include `datamodel-code-generator`.

## Devbox

Install the following with devbox by running:

```bash
# If devbox is installed
```

`devbox.json` now includes `supabase` CLI so your dev environment has the supabase tooling available.

If `devbox` fails to install the Supabase CLI (common if the pinned `nixpkgs` commit doesn't contain the `supabase` package), use the following troubleshooting options:

### Pinning / Overlay Options

If you want to ensure `supabase` is resolvable via Nix, prefer adding an overlay or updating the nixpkgs pin rather than patching generated flake files by hand. Example approaches:

- If you control the Devbox generation process, pin `nixpkgs` to a newer commit that includes `supabase` (preferred when you can update the repository pin):

```bash
# Re-generate the flake with a new nixpkgs pin: open `.devbox/gen/flake/flake.nix` and update the nixpkgs URL to a newer commit that contains supabase
DEVBOX_DEBUG=1 devbox update
```

- If you want to avoid changing the shared pin, use a Nix overlay that brings `supabase` in from a newer nixpkgs without changing the primary pin. Create `.devbox/overlays/supabase.nix` and re-run update (example overlay shown below):

```bash
mkdir -p .devbox/overlays
cat > .devbox/overlays/supabase.nix <<'NIX'
{ pkgs }:
  let
    newer = (import (builtins.fetchTarball {
      url = "https://github.com/NixOS/nixpkgs/archive/<NEW_COMMIT>.tar.gz";
    }) {});
  in {
    supabase = newer.supabase;
  }
NIX
DEVBOX_DEBUG=1 devbox update
```

These steps are safer than editing generated flake files directly and can be committed in the repository to ensure reproducible builds.

- Update devbox (recommended)

**Note:** This repository already includes a permanent overlay at `./.devbox/overlays/supabase.nix` which imports `supabase` from `nixpkgs-unstable`. Update the `builtins.fetchTarball` URL or replace `nixpkgs-unstable` with a specific commit SHA for reproducible behavior.

# Migrate devbox.json format and refresh gen files

DEVBOX_DEBUG=1 devbox update

# If the update fails due to a pinned nixpkgs commit, try forcing a fresh generation

rm -rf .devbox/gen
DEVBOX_DEBUG=1 devbox update

````

Use the included fallback installer (works without needing a Nix package):
  - When you enter the devbox shell the repository `scripts/devbox_boot.sh` will attempt to automatically
    install `supabase` using `pnpm`/`npm` or by downloading the latest Linux binary from the official GitHub releases.
  - To run the installer manually:


```bash
bash scripts/install_supabase.sh
supabase --version
````

- If you prefer using a nix package, try pinning `nixpkgs` to a newer commit which includes `supabase` or use `devbox` config with a more recent `nixpkgs` input (for example `nixpkgs-unstable`), then re-run `devbox update`.
  If you're blocked by the pinned `nixpkgs` and cannot change the pin permanently, this repo includes a helper:

```bash
# Attempts to update the generated flake to point at nixpkgs-unstable and inject supabase
just devbox-fix

# After this, re-run devbox update and enter the shell
DEVBOX_DEBUG=1 devbox update
devbox shell
supabase --version
```

Note: `just devbox-fix` edits generated `.devbox/gen/flake/flake.nix` and then re-runs `devbox update` — it's intended as a short-term remediation; a permanent fix is to add a repository-level overlay or update the devbox input pins.

```bash
# Example troubleshooting flow. Keep in mind `devbox` regenerates `.devbox/gen` and will re-resolve nixpkgs.
git checkout -b fix/devbox-supabase-pin
rm -rf .devbox/gen
DEVBOX_DEBUG=1 devbox update
```

## Setup

Install all dev dependencies:

```bash
just setup
```

Verify `supabase` is available on PATH:

```bash
supabase --version
```

## Typical Workflows

- Generate TypeScript types from the (local) Supabase schema:

```bash
just gen-types-ts
```

- Generate Python Pydantic models from the TypeScript types:

```bash
just gen-types-py
```

- Run both generators together:

```bash
just gen-types
```

- Apply database migrations:

```bash
just db-migrate
```

- CI Check to ensure generated types are current and committed:

```bash
just check-types
```

## CI Integration

- Add `just check-types` to CI pipelines to ensure generated types have been committed and are fresh.
- If you use a branch or PR pipeline, include `just check-types` as part of the verification stage.

## Notes

- Default generation uses `tools/type-generator/test-fixtures/db_schema.json` for reproducible testing; in real usage, `supabase gen types` will be used.
- Python model generation uses `tools/scripts/gen_py_types.py` which maps TypeScript interfaces into Pydantic BaseModel classes.
