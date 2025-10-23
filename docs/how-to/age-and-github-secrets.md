## age keypair and GitHub Actions secrets — step by step

This document shows concrete zsh commands and guidance to:

- generate an `age` keypair locally
- add the public recipient to `.sops.yaml`
- re-encrypt `.secrets.env.sops` for the new recipient(s)
- add the private key to GitHub Actions as `SOPS_AGE_KEY`
- test locally and in CI

Always follow your organization's secret-handling policies. The commands below assume you are on a trusted machine.

---

1) Install `age` and `sops` (if missing)

Debian/Ubuntu example:

```bash
sudo apt-get update
sudo apt-get install -y age sops
```

Alternatively, download releases from the projects:
- age: https://github.com/FiloSottile/age/releases
- sops: https://github.com/mozilla/sops/releases

2) Generate an age keypair and save it securely

Recommended location: `~/.config/sops/key.txt` with strict permissions.

```bash
mkdir -p ~/.config/sops
age-keygen -o ~/.config/sops/key.txt
chmod 600 ~/.config/sops/key.txt

# Print the public recipient (age1... string) to copy into .sops.yaml
grep -i 'public key' -n ~/.config/sops/key.txt || sed -n '1,120p' ~/.config/sops/key.txt
```

Notes:
- `key.txt` contains your private key and a public key comment. Keep the file private.
- Do NOT commit `key.txt` into git. Add `~/.config/sops/key.txt` to your personal backups if needed.

3) Add public recipient to `.sops.yaml`

Open `.sops.yaml` and add the `age` recipient under `key_groups` (replace the placeholder with the real public key string produced above):

```yaml
creation_rules:
  - path_regex: '^\.secrets\.env\.sops$'
    encrypted_regex: '^(.*)$'
    key_groups:
      - age:
          - 'age1qx...your_public_key_here'
```

If you have multiple recipients (e.g., a team key and a CI key), add them to the list.

4) Re-encrypt `.secrets.env.sops` to include the new recipient (safe rotation)

If you already have `.secrets.env.sops` encrypted and can decrypt it locally with your current key, re-encrypt it so the new recipient(s) can also decrypt it.

```bash
# decrypt to plaintext (temporary)
sops -d .secrets.env.sops > .secrets.env

# re-encrypt specifying recipient(s). You can use sops' key-groups or the --age flag.
# Example: encrypt for the new recipient
sops --encrypt --age 'age1qx...your_public_key_here' .secrets.env > .secrets.env.sops.new

# Inspect, back up, and replace safely
mv .secrets.env.sops .secrets.env.sops.bak
mv .secrets.env.sops.new .secrets.env.sops
shred -u .secrets.env || rm -f .secrets.env

# verify decryption works
sops -d .secrets.env.sops

# If everything looks good, remove the .bak or keep it offline for a short time
rm -f .secrets.env.sops.bak
```

Notes:
- Running `sops --encrypt` with a single `--age` will create a file encrypted for that recipient only. Use `--age` multiple times or key_groups in `.sops.yaml` to include many recipients.
- If your existing `.secrets.env.sops` already contains encrypted keys for multiple recipients, you can use `sops -d .secrets.env.sops | sops --encrypt --age 'age1...' > .secrets.env.sops` to rotate recipients in one command.

5) Add the private key to GitHub Actions (as a secret)

1. Open GitHub → your repo → Settings → Secrets and variables → Actions → New repository secret.
2. Name: `SOPS_AGE_KEY` (this matches the CI workflow in this repo).
3. Value: paste the full private key file contents from `~/.config/sops/key.txt` (the whole file). Save.

Important:
- Do not check the private key into source control. The repository secret is stored encrypted by GitHub; it is the recommended place for CI secrets.

6) Test the workflow locally (optional)

You can simulate the CI decrypt step locally by writing a temporary file from your `key.txt` and running sops decrypt:

```bash
export SOPS_AGE_KEY="$(cat ~/.config/sops/key.txt)"
mkdir -p ~/.config/sops
printf "%s" "$SOPS_AGE_KEY" > ~/.config/sops/age-key.txt
chmod 600 ~/.config/sops/age-key.txt

# decrypt and inspect
sops -d .secrets.env.sops

# cleanup if desired
# rm -f ~/.config/sops/age-key.txt
unset SOPS_AGE_KEY
```

7) Rotate keys if the private key was ever exposed

If your private key was accidentally committed, pushed, or leaked, **rotate** immediately:

- Generate a new age keypair.
- Add the new public recipient to `.sops.yaml`.
- Re-encrypt `.secrets.env.sops` for the new recipient. Use the steps in section (4).
- Update GitHub Secret `SOPS_AGE_KEY` to the new private key content.
- Optionally purge historical commits containing the old private key (use `git-filter-repo` or BFG) and force push; coordinate with your team.

8) Quick checklist before pushing changes

- Ensure `.sops.yaml` contains the correct public recipient(s).
- Ensure you did not accidentally commit any private key file (search `git log --all -- key.txt`).
- Update `.gitignore` to exclude local private key files if present (e.g., `~/.config/sops/key.txt` is outside the repo; if you used `key.txt` in repo root, add `key.txt` to `.gitignore`).
- Update CI secret `SOPS_AGE_KEY` in repository settings.

9) Example: full minimal sequence (safe, manual)

```bash
# generate key locally
mkdir -p ~/.config/sops
age-keygen -o ~/.config/sops/key.txt
chmod 600 ~/.config/sops/key.txt

# copy public recipient from the file and update .sops.yaml (manually)

# decrypt and re-encrypt for the new recipient
sops -d .secrets.env.sops > .secrets.env
sops --encrypt --age 'age1...newpub' .secrets.env > .secrets.env.sops.new
mv .secrets.env.sops .secrets.env.sops.bak
mv .secrets.env.sops.new .secrets.env.sops
shred -u .secrets.env || rm -f .secrets.env

# add private key contents to GitHub secret SOPS_AGE_KEY
```

---

If you want, I can:

- add an optional helper `Makefile` target or a `just` task that automates re-encrypting with a listed recipient (local only) and verifies the result; or
- prepare a KMS-based `.sops.yaml` and CI workflow if you prefer AWS/GCP/Azure KMS (safer for team CI).

Which helper should I add next? (add just task, KMS workflow, or both?)
