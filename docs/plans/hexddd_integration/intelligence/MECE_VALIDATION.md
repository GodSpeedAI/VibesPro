# MECE_VALIDATION

Status: draft
Date: 2025-11-05

## Purpose

Validate that planned tasks are Mutually Exclusive and Collectively Exhaustive (MECE). This file will contain the task boundary matrix and overlap detection results.

## Planned workflow

1. Enumerate all planned task file globs and owners.
2. Use `nx_visualize_graph` / `nx_workspace` to detect project overlaps and shared roots.
3. Flag potential conflicts and propose ownership changes.

## MECE table (seeded from PHASE-000 plan)

| Task        | Owns (File Globs)                        | Excludes (File Globs) | Conflicts With | Completes Requirements |
| ----------- | ---------------------------------------- | --------------------- | -------------- | ---------------------- |
| PHASE-001-A | `tests/generators/utils/idempotency.ts`  | All production code   | None           | DEV-SDS-023            |
| PHASE-001-B | `tests/generators/utils/test-helpers.ts` | Idempotency lib       | None           | DEV-SDS-023            |
| ...         | TODO                                     | TODO                  | TODO           | TODO                   |

-   ## Domain ownership rows (workspace discovery)

| Task                                 | Owns (File Globs)                       | Excludes (File Globs)                                                         | Conflicts With          | Completes Requirements |
| ------------------------------------ | --------------------------------------- | ----------------------------------------------------------------------------- | ----------------------- | ---------------------- |
| DOMAIN-my-test-domain:domain         | `libs/my-test-domain/domain/**`         | `libs/my-test-domain/application/**`, `libs/my-test-domain/infrastructure/**` | None (template present) | DEV-SDS-XXX            |
| DOMAIN-my-test-domain:application    | `libs/my-test-domain/application/**`    | `libs/my-test-domain/domain/**`, `libs/my-test-domain/infrastructure/**`      | None (template present) | DEV-SDS-XXX            |
| DOMAIN-my-test-domain:infrastructure | `libs/my-test-domain/infrastructure/**` | `libs/my-test-domain/domain/**`, `libs/my-test-domain/application/**`         | None (template present) | DEV-SDS-XXX            |

## Next steps

-   Run Nx analysis to fill `Conflicts With` and add any missing tasks.
-   Produce final pass for the MECE matrix and embed it here.
