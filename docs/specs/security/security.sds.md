# SECURITY SDSs

<!-- matrix_ids: [] -->

## DEV-SDS-012 — Secrets with SOPS (local & CI) (addresses DEV-PRD-013, DEV-PRD-015)

Principle: Secrets at rest are always encrypted; decryption is ephemeral.

Design:

Local: .secrets.env.sops checked into Git (encrypted); developers run inside a shell that executes sops exec-env .secrets.env.sops <cmd> (via .envrc locally or manual wrapper).

CI (no direnv): Decrypt with CI-provided AGE key or KMS:

sops -d .secrets.env.sops > /tmp/ci.env && set -a && source /tmp/ci.env && set +a

Ensure /tmp/ci.env is removed post-job.

Error modes: Missing key, stale recipients, plaintext leakage. Pipeline fails closed with clear logs; pre-commit rule forbids .env commits.

Artifacts: .sops.yaml, .secrets.env.sops (encrypted), CI snippets.
