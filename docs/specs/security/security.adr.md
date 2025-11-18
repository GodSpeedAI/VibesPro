# SECURITY ADRs

<!-- matrix_ids: [] -->

## DEV-ADR-005 — Security by default: workspace trust and tool safety

-   Decision: Respect workspace trust boundaries; never enable chat.tools.autoApprove; centralize safety instructions.
-   Rationale: Prevent prompt-injection and RCE; protect developer machines.
-   DX Impact: Confidence in running examples; fewer security reviews blocked.

## DEV-ADR-013 — Secrets managed by SOPS; ephemeral decryption

Decision: Store .secrets.env.sops in Git (encrypted) and decrypt only into process env at runtime; no plaintext .env committed.

Context: Desire to avoid secret sprawl and align local/CI flows.

Rationale: Strong auditability; easy rotation; flexible recipients (AGE/KMS).

DX Impact: Safer by default; minimal friction after keys configured.

Trade–offs: Requires developer key management; CI key plumbing.
