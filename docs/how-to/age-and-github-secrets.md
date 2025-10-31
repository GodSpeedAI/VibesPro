# How to create an `age` key and share it with GitHub Actions

This guide walks you through the entire process, from generating an `age` keypair on your laptop to letting GitHub Actions decrypt `.secrets.env.sops` during CI runs. It is written for newcomers—follow the steps in order and you’ll be ready in a few minutes.

Everything below runs from the repository root in a trusted shell session.

---

## 1. Check your tools

You need both `age` and `sops`. Verify they are installed:

```bash
age --version
sops --version
```

If either command is missing, install them (Debian/Ubuntu example):

```bash
sudo apt update
sudo apt install -y age sops
```

Other platforms can download prebuilt binaries from:

-   age – <https://github.com/FiloSottile/age/releases>
-   sops – <https://github.com/mozilla/sops/releases>

---

## 2. Generate an `age` keypair (once per person)

1. Pick a safe location for your private key. The convention is `~/.config/sops/key.txt`.
2. Create the directory and generate a keypair:

```bash
mkdir -p ~/.config/sops
age-keygen -o ~/.config/sops/key.txt
chmod 600 ~/.config/sops/key.txt
```

3. Display the **public** key (starts with `age1…`). You will paste this into `.sops.yaml` in the next step.

```bash
grep '^# public key:' ~/.config/sops/key.txt
# Example: # public key: age1qp...your_public_key_here
```

Important safety notes:

-   `key.txt` holds your private key—never commit or share the file.
-   Keep a secure backup (password manager, encrypted disk), because losing this key means you cannot decrypt any secrets that rely on it.

---

## 3. Tell SOPS about the new recipient

Open `.sops.yaml` and add your public key under the `age` recipients. The file already has structure like the snippet below; just drop your key beside the others.

```yaml
creation_rules:
    - path_regex: '^\.secrets\.env\.sops$'
      encrypted_regex: "^(.*)$"
      key_groups:
          - age:
                - "age1...existing-team-key"
                - "age1...your_public_key_here"
```

Save the file. From now on, `sops` knows that `.secrets.env.sops` should be encrypted for everyone listed.

> Tip: keep multiple recipients (team key, CI key, individual key). Any of them can decrypt.

---

## 4. Re-encrypt `.secrets.env.sops` so the new key works

If `.secrets.env.sops` already exists, you must re-encrypt it; otherwise your new key will not be able to decrypt the file.

### Quick method (preferred)

`sops` can rewrite the file in place using the recipients declared in `.sops.yaml`:

```bash
export SOPS_AGE_KEY_FILE="$HOME/.config/sops/key.txt"
sops --input-type dotenv --output-type dotenv --encrypt --in-place .secrets.env.sops
```

That command decrypts and immediately re-encrypts using every recipient in `.sops.yaml`. No plaintext file touches disk.

### Manual method (if you want a backup)

```bash
export SOPS_AGE_KEY_FILE="$HOME/.config/sops/key.txt"
sops -d .secrets.env.sops > .secrets.env.tmp
sops --encrypt --age 'age1...your_public_key_here' \
     --age 'age1...existing-team-key' \
     .secrets.env.tmp > .secrets.env.sops.new
mv .secrets.env.sops .secrets.env.sops.bak
mv .secrets.env.sops.new .secrets.env.sops
shred -u .secrets.env.tmp       # or rm -f
```

After either approach, verify decryption succeeds:

```bash
sops --input-type dotenv -d .secrets.env.sops | head
```

Once you’re satisfied, remove any `.bak` files or store them securely offline.

---

## 5. Provide the private key to GitHub Actions

1. Open your repository on GitHub.
2. Go to **Settings → Secrets and variables → Actions → New repository secret**.
3. Name the secret `SOPS_AGE_KEY` (this matches our CI scripts).
4. Paste the entire contents of `~/.config/sops/key.txt` into the value field and save.

Now CI jobs can export the key with `SOPS_AGE_KEY` and decrypt `.secrets.env.sops`.

> Warning: never store the private key in the repository itself. GitHub encrypts repository secrets for you; that is the safest place for CI use.

---

## 6. Smoke test the setup

### Local check

```bash
export SOPS_AGE_KEY="$(cat ~/.config/sops/key.txt)"
sops --input-type dotenv -d .secrets.env.sops | head
unset SOPS_AGE_KEY
```

If you can read the contents, re-encryption succeeded.

### GitHub Actions check

Push a branch and watch the CI run. The logs should not contain “failed to decrypt” errors. If you need a quick manual test, you can run the decrypt step locally in the same way the workflow does:

```bash
sops exec-env .secrets.env.sops -- printenv SOME_SECRET
```

---

## 7. Rotating a key (if the private key leaks)

1. Generate a new keypair (repeat Step 2).
2. Replace the old public key in `.sops.yaml` with the new one.
3. Re-encrypt `.secrets.env.sops` (Step 4).
4. Update the GitHub secret `SOPS_AGE_KEY` with the new private key.
5. Invalidate any old copies of the key (remove credentials from backups, rotate downstream tokens if needed).

When rotating, it’s a good idea to leave both the old and new recipients in `.sops.yaml` until every teammate has switched, then remove the old key and re-encrypt again.

---

## 8. Checklist before committing

-   [ ] `.sops.yaml` contains the correct recipient list.
-   [ ] `.secrets.env.sops` decrypts with your new key.
-   [ ] No private keys or plaintext `.env` files were added to Git history.
-   [ ] GitHub Actions secret `SOPS_AGE_KEY` is set to the current private key.

Keep this document handy whenever you onboard a new teammate or rotate keys; the steps are always the same. Following them ensures everyone can decrypt shared secrets while keeping the private portion of the key safe. If you prefer a cloud KMS approach instead of `age`, reach out—there are ready-made templates for AWS, GCP, and Azure as well.
