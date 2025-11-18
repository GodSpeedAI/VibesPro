# SECURITY PRDs

<!-- matrix_ids: [] -->

## DEV-PRD-005 — Security posture by default

-   Description: As a developer, I want safe defaults and workspace trust enforcement so that I can run prompts confidently.
-   EARS: When opening the workspace, the system shall disable auto-approve and apply security instructions globally.
-   DX Metrics: 0 insecure defaults; security checks pass rate > 95% pre-merge.
-   Supported by: DEV-ADR-005

## DEV-PRD-013 — Secure, ephemeral secrets loading (Layer IV)

Description: As a developer, I want secrets to be stored encrypted in Git and only decrypted into process environment at runtime.

EARS: Given .secrets.env.sops, the system shall decrypt to environment for local shells; in CI, the system shall decrypt to a temporary file/env vars without persisting plaintext.

DX Metrics: Secrets in plaintext committed to VCS → 0; “rotate key and re-encrypt” ≤ 5 minutes.

Supported by: DEV-ADR-013, DEV-SDS-012
