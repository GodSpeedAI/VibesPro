# RISK_ASSESSMENT

Status: draft
Date: 2025-11-05

## Scope

Top technical, architectural, and process risks for HexDDD integration. For each: likelihood, impact, detection trigger, mitigation, contingency.

## Seeded risks (from PHASE-000)

1. Generator Non-Idempotency

    - Likelihood: Medium
    - Impact: High
    - Detection: Double-run test failures
    - Mitigation: Deterministic write patterns, marker files, AST transforms
    - Contingency: Manual scaffold + docs

2. Nx Tag Circular Dependencies

    - Likelihood: Low
    - Impact: High
    - Detection: Lint/graph errors
    - Mitigation: MECE validation, incremental rollout of tag enforcement
    - Contingency: Disable enforcement temporarily and fix

3. Type Drift (TS ↔ Python ↔ DB)
    - Likelihood: Medium
    - Impact: Medium
    - Mitigation: Type-sync CI + pre-commit checks
    - Contingency: Manual type regeneration + PR

## Next steps

-   Run repository and CI history analysis to populate detection triggers and past incident examples.
-   Assign owners and SLAs for each mitigation item.
