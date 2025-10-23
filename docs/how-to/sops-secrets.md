## Using `.secrets.env.sops` safely

This guide explains how this repository uses SOPS-encrypted environment files and how to use the repository's `.secrets.env.sops` safely for local development and CI.

### Overview

- The repository stores encrypted secrets in `.secrets.env.sops`. Do NOT commit decrypted `.env` files.
- SOPS supports multiple key backends (age, PGP, AWS/GCP/Azure KMS). Ensure you have the appropriate decryption key available locally or in CI.

### Local developer quick-start (zsh)

1. Install sops (platform-specific). For Debian/Ubuntu:

```bash
sudo apt-get update && sudo apt-get install -y sops
```

2. View decrypted contents (prints to stdout):

```bash
sops -d .secrets.env.sops
```

3. Edit the secrets file in-place (sops will re-encrypt on save):

```bash
sops .secrets.env.sops
```

4. Run the app with secrets without leaving plaintext on disk. A helper script is provided at `scripts/run-with-secrets.sh`:

```bash
chmod +x scripts/run-with-secrets.sh
scripts/run-with-secrets.sh <command> [args...]
# example: scripts/run-with-secrets.sh node ./dist/index.js
```

This script decrypts to a temporary file with restricted permissions, runs your command with the variables loaded, and securely removes the temp file.

### Helper script behavior

- Decrypts `.secrets.env.sops` to a secure temporary file
- Sets `chmod 600` on the file
- Sources the variables into a subshell and `exec`s the provided command so only the child process sees the env
- Cleans up (overwrites and removes) the temp file on exit

### CI usage (GitHub Actions example)

- Store your SOPS private key or cloud KMS credentials in GitHub Secrets (e.g., `SOPS_AGE_KEY`).
- Use an action step to install `sops`, configure the key, decrypt to a file, and run your build steps. Avoid printing secrets to logs.

Example (snippet):

```yaml
- name: Install sops
  run: sudo apt-get update && sudo apt-get install -y sops

- name: Decrypt secrets
  env:
    SOPS_AGE_KEY: ${{ secrets.SOPS_AGE_KEY }}
  run: |
    printf "%s" "$SOPS_AGE_KEY" > ~/.config/sops/age-key.txt
    chmod 600 ~/.config/sops/age-key.txt
    export SOPS_AGE_KEY_FILE=~/.config/sops/age-key.txt
    sops -d .secrets.env.sops > .secrets.env
    chmod 600 .secrets.env

- name: Run tests
  run: |
    # do not echo the file; load it as needed
    source .secrets.env
    # run your commands that require secrets here

- name: Cleanup
  if: always()
  run: shred -u .secrets.env || rm -f .secrets.env
```

Notes:

- Prefer cloud KMS-backed solutions to avoid storing long-term private keys in repo secrets.
- Do not echo or log secret contents.

### Example `.sops.yaml`

Create a `.sops.yaml` at repo root to standardize what gets encrypted and which key groups are used. Example:

```yaml
creation_rules:
  - path_regex: ".*\.sops$|.*\.env$|^\.secrets.*"
    encrypted_regex: '^(DATA|SECRET|PASSWORD|KEY|TOKEN|_KEY|_TOKEN|OPENAI|SUPABASE|OPENOBSERVE)'
    # add your backends here (age, pgp, kms)
    key_groups:
      - age: []
```

### Best practices summary

- Never commit plaintext secrets.
- Use age or cloud KMS for key management.
- Limit who has decryption keys and rotate keys periodically.
- Restrict permissions on decrypted files (chmod 600).
- Use wrapper scripts or process-level injection instead of `eval` in interactive shells.

### Next steps

- If you want, I can add the `scripts/run-with-secrets.sh` helper (executable) and a GitHub Actions workflow example to `.github/workflows/` in this repo. I already added the helper script in `scripts/` as part of this change.

### Files added to this repo

- `.sops.yaml` — repo-level SOPS config. Adjust `creation_rules` and `key_groups` if you use PGP/KMS.
- `.github/workflows/sops-decrypt.yml` — example workflow that decrypts `.secrets.env.sops` using `SOPS_AGE_KEY` and runs tests.
- `.envrc.example` — example `direnv` file showing how to decrypt on directory enter (do not commit a real `.envrc` with plaintext).

### Generating an age key (quick)

On your local machine you can generate an `age` keypair and extract the private key to store in CI secrets:

```bash
# install age if not present (platform-specific)
age-keygen -o key.txt
# the file contains the private key (store securely). The public key is printed too.
cat key.txt
```

Store the private key contents as `SOPS_AGE_KEY` in GitHub Secrets. The workflow will write it to `~/.config/sops/age-key.txt` and use it to decrypt.
