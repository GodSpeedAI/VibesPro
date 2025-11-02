# How to manage `.secrets.env.sops` for MCP tools

This walkthrough shows you how to **add**, **update**, and **use** secrets that live in `.secrets.env.sops`, especially when wiring them into MCP configurations like `.vscode/mcp.json`. Everything below assumes you are inside the repo root.

---

## Before you start

You’ll need:

-   `sops` installed
-   Access to the private key that decrypts `.secrets.env.sops`  
    (most setups export `SOPS_AGE_KEY_FILE="$HOME/.config/sops/key.txt"`)
-   A shell that loads the repo toolchain (Devbox, direnv, etc.)

If you’re new to SOPS, skim `docs/how-to/sops-secrets.md` first.

---

## Step 1 – View or edit the secrets file

Open the file with SOPS. It automatically decrypts the content in your editor and re-encrypts on save.

```bash
sops .secrets.env.sops
```

Inside the editor, add entries just like a `.env` file:

```dotenv
SMITHERY_API_KEY=sk_live_example_123
```

Guidelines:

-   Use uppercase letters and underscores for keys.
-   Don’t add quotes unless the value itself needs them.
-   Save and exit—SOPS writes the encrypted version back.

Need to flip a value later without opening the full editor? Use `sops --set`:

```bash
export SOPS_AGE_KEY_FILE="$HOME/.config/sops/key.txt"
sops --input-type dotenv --output-type dotenv \
  --set '["LOGFIRE_TOKEN"] "pylf_v1_us_real_value_here"' \
  --in-place .secrets.env.sops
```

This decrypts, updates the value, re-encrypts, and refreshes the MAC in one command. Replace the sample token with your real one.

> ℹ️ **File type flags**
>
> -   Interactive edits (`sops .secrets.env.sops`) normally need no extra flags because SOPS infers the format for you.
> -   Non-interactive commands (`--set`, `--decrypt`, `exec-env`, etc.) should always specify **both** `--input-type dotenv` and `--output-type dotenv`.  
>     Providing only the input type forces the parser but leaves the writer in “binary” mode, which triggers `Could not marshal tree: error emitting binary store: no binary data found in tree`.

---

## Step 2 – Double-check what you changed

Confirm a secret exists (SOPS only decrypts long enough to print it):

```bash
sops -d .secrets.env.sops | grep SMITHERY_API_KEY
```

Forgot the key name? List all keys without revealing the values. Because the file contains comments, always tell SOPS it’s a dotenv file:

```bash
export SOPS_AGE_KEY_FILE="$HOME/.config/sops/key.txt"
sops --input-type dotenv --output-type dotenv -d .secrets.env.sops \
  | awk -F= '/^[A-Z0-9_]+=/{print $1}'
```

Common errors and fixes:

| Error message                                               | What it means                                                     | Fix                                                         |
| ----------------------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------- |
| `invalid character '#' looking for beginning of value`      | SOPS assumed YAML/JSON                                            | Add `--input-type dotenv` (and keep it before the filename) |
| `MAC mismatch. File has …`                                  | File contents changed without re-encryption                       | Reapply your change with `sops` or restore from Git         |
| `error emitting binary store: no binary data found in tree` | `--input-type` forced the reader but writer stayed in binary mode | Add `--output-type dotenv` alongside `--input-type dotenv`  |

Example MAC recovery when the file was hand-edited:

```bash
git restore .secrets.env.sops        # or sops --set … (see above)
```

---

## Step 3 – Run commands with secrets loaded

You rarely need to dump secrets into a plain `.env`. Inject them into subprocesses instead:

```bash
sops exec-env .secrets.env.sops -- just ai-validate
sops exec-env .secrets.env.sops -- code .          # start VS Code with secrets
```

If you use `direnv`, the provided `.envrc` already exports these variables whenever you enter the repo. To confirm a variable is available:

```bash
printenv SMITHERY_API_KEY
```

---

## Step 4 – Reference secrets from MCP configs

Visual Studio Code resolves `${env:VAR_NAME}` using the environment present when Copilot (or the MCP CLI) starts. There is no `secrets.` prefix—stick to `env`.

Example `.vscode/mcp.json` fragment:

```jsonc
{
    "mcpServers": {
        "smithery-memory": {
            "command": "npx",
            "args": ["-y", "@modelcontextprotocol/cli", "http"],
            "env": {
                "SMITHERY_API_KEY": "${env:SMITHERY_API_KEY}",
                "SMITHERY_PROFILE": "married-shark-xX2c39"
            }
        }
    }
}
```

Tips:

-   Keep secrets in the `env` block; downstream tooling picks them up from there.
-   After changing a secret, restart VS Code (or Copilot) so the new value is available.
-   Follow each tool’s documentation to wire the environment variable into headers, query params, etc.

---

## Safety checklist

-   Do **not** commit decrypted `.env` files—only the `.sops` file lives in Git.
-   Protect your private key (`SOPS_AGE_KEY` / `SOPS_AGE_KEY_FILE`) like any other credential.
-   In CI, load the key from secrets and run `sops exec-env` rather than storing plaintext.
-   Rotate secrets periodically and remove ones you no longer need.

Keeping to this flow means secrets stay encrypted at rest, only the processes that need them see the plaintext, and MCP integrations remain compliant with the project’s security rules.
