# Secrets Decryption: Fail-fast and conditional execution

**Date**: October 13, 2025
**File**: `.github/workflows/build-matrix.yml` (around lines 159-172)

## Summary

Changed the secrets decryption step to fail-fast when the `SOPS_AGE_KEY` secret is present, and to be skipped when the secret is absent. Removed `continue-on-error: true` which previously hid decryption failures and allowed the job to continue with missing secrets.

## What I changed

- Replaced the single decryption step (which used `continue-on-error: true`) with two explicit steps:
    1. `Decrypt secrets to ephemeral env (required when SOPS_AGE_KEY present)` — runs only when `secrets.SOPS_AGE_KEY` is set. This step will fail the job if decryption fails. It sets `loaded=true` on success.
    2. `Mark secrets as not loaded (no SOPS_AGE_KEY)` — runs when `secrets.SOPS_AGE_KEY` is not set and writes `loaded=false` so downstream steps can detect absence.

## Rationale

- `continue-on-error: true` masked decryption problems. If decryption fails (wrong key, corrupted file), the job would continue without required secrets and tests/builds could silently pass or fail in confusing ways.
- Gating the decryption step with `if: secrets.SOPS_AGE_KEY != ''` ensures the step is only attempted when the secret is present and clearly fails when decryption fails.
- For workflows where secrets are optional, the new `Mark secrets as not loaded` step provides an explicit signal (`loaded=false`) instead of silent absence.

## Validation

- YAML parsed successfully after edits.
- The repository's linters reported pre-existing warnings about `secrets.SOPS_AGE_KEY` references (these are environment/static-analysis messages and not runtime failures in Actions).

## Follow-ups

- If other jobs or steps rely on `steps.sops.outputs.loaded`, validate they handle the case where the decryption step was skipped (i.e., use `if: steps.sops.outcome == 'skipped'` or check the output when available).
- This workflow now also includes a `SOPS status` step which always runs and emits a stable step output (`steps.sops_status.outputs.loaded`) and an environment variable (`SOPS_LOADED`) that downstream shell steps can read. Prefer checking `steps.sops_status.outputs.loaded == 'true'` or `env.SOPS_LOADED == 'true'` in your `if:` guards.
- Consider adding a job-level check to fail early when required secrets are not present (e.g., `if: needs.prepare.outputs.some_flag == 'true' && secrets.SOPS_AGE_KEY == ''`), depending on project policy.

## Files changed

- `.github/workflows/build-matrix.yml`

## Notes

- The change intentionally enforces fail-fast behavior for secret decryption to avoid deploying or testing with missing secrets.
