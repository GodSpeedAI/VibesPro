# How-to: Manage `.secrets.env.sops` secrets for MCP configs

This guide shows how to add an API key to `.secrets.env.sops`, re-encrypt the file safely, and supply the secret to tools that you configure such as `.vscode/mcp.json`. Read this together with `docs/how-to/sops-secrets.md` for the full SOPS primer.

## Prerequisites

- `sops` and an age/PGP/KMS key that can decrypt `.secrets.env.sops`
- Shell or terminal configured the same way you run the repository (Devbox, mise, direnv, etc.)
- A text editor that respects `$EDITOR` (SOPS opens the decrypted view there)

## 1. Decrypt and edit the secrets file

Open the encrypted dotenv file with SOPS; it will transparently decrypt before showing the contents and re-encrypt on save:

```bash
sops .secrets.env.sops
```

Add your secret exactly like a normal `.env` entry:

```dotenv
# inside the editor view
SMITHERY_API_KEY=sk_live_example_123
```

Tips:

- Keep keys upper-case with `_` separators; `.sops.yaml` rules often target that pattern.
- Do not surround values with quotes unless the value itself requires them.
- Save and exit; SOPS writes the encrypted version back to disk automatically.

If you edited the file with another tool, re-encrypt in place before committing:

```bash
sops -e -i .secrets.env.sops
```

Verify the key is present (SOPS decrypts just long enough to read the value):

```bash
sops -d .secrets.env.sops | grep SMITHERY_API_KEY
```

If you forget the variable name, list every key without exposing values:

```bash
sops -d .secrets.env.sops | awk -F= '/^[A-Z0-9_]+=/{print $1}'
```

That pipeline decrypts to stdout, extracts the part before `=`, and prints each exported variable name.

## 2. Load secrets into your environment

You rarely need to create a plaintext `.env`. Instead, inject the decrypted values into a subshell when you run commands:

```bash
# Run any command with secrets available
sops exec-env .secrets.env.sops -- just ai-validate

# Launch VS Code so Copilot inherits the secrets
sops exec-env .secrets.env.sops -- code .
```

If you use `direnv`, the provided `.envrc` already runs `sops --decrypt .secrets.env.sops` and exports every variable when you `cd` into the repo. Either way, confirm the variable exists before wiring it to MCP tools:

```bash
printenv SMITHERY_API_KEY
```

Forgot the variable name? List every exported key without revealing values:

```bash
sops -d .secrets.env.sops | awk -F= '/^[A-Z0-9_]+=/{print $1}'
```

## 3. Reference secrets in `.vscode/mcp.json`

Visual Studio Code substitutes `${env:VAR_NAME}` with environment variables that exist when Copilot starts. Avoid the `secrets.` prefix shown in older examples—stick to `${env:...}`.

Example MCP HTTP tool configuration (pattern matches the example in `mcp/tool_index.md`):

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

Key points:

- The `env` block makes secrets available to the MCP CLI process without hardcoding them.
- Use those environment variables inside your CLI/tool configuration (headers, query params, config files). Check the tool’s docs for the exact flags or config fields.
- If you change secrets, restart Copilot (or VS Code) so it reloads the environment.

## 4. Additional safety notes

- Never commit decrypted `.env` files; only the `.sops` file belongs in Git.
- Store your age private key (`SOPS_AGE_KEY` or `SOPS_AGE_KEY_FILE`) securely—treat it like any other credential.
- For CI, inject the private key via GitHub Secrets and run `sops exec-env` in the workflow (see `docs/how-to/sops-secrets.md` for a YAML example).
- Rotate secrets periodically and prune entries that are no longer in use.

Following this workflow keeps secrets encrypted at rest, limits exposure to the processes that actually need them, and keeps MCP tool configuration compliant with the repository’s security rules.
