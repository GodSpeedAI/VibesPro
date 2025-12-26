# Spec-Kit Workflow Port

Interface contract between VibesPro agents and the spec-kit workflow skill.

## Port: SpecifyFeature

### Input

| Field            | Type   | Required | Description                              |
| ---------------- | ------ | -------- | ---------------------------------------- |
| `description`    | string | ✅       | Natural language feature description     |
| `boundedContext` | string | ⚪       | Target domain (auto-detected if omitted) |

### Output

| Field           | Type   | Description                               |
| --------------- | ------ | ----------------------------------------- |
| `specPath`      | string | Absolute path to generated `spec.md`      |
| `branchName`    | string | Created git branch name                   |
| `prdId`         | string | Assigned PRD identifier (e.g., `PRD-047`) |
| `checklistPath` | string | Path to quality validation checklist      |

### Errors

| Code                | Description                                 |
| ------------------- | ------------------------------------------- |
| `NO_DESCRIPTION`    | Empty feature description provided          |
| `CONTEXT_AMBIGUOUS` | Cannot determine bounded context            |
| `SPEC_EXISTS`       | Specification already exists at target path |

---

## Port: PlanFeature

### Input

| Field       | Type   | Required | Description                           |
| ----------- | ------ | -------- | ------------------------------------- |
| `specPath`  | string | ✅       | Path to feature specification         |
| `techStack` | string | ⚪       | Technology choices for implementation |

### Output

| Field           | Type   | Description                    |
| --------------- | ------ | ------------------------------ |
| `planPath`      | string | Path to generated `plan.md`    |
| `dataModelPath` | string | Path to `data-model.md`        |
| `contractsDir`  | string | Path to `contracts/` directory |
| `sdsId`         | string | Assigned SDS identifier        |

---

## Port: TaskBreakdown

### Input

| Field      | Type   | Required | Description                 |
| ---------- | ------ | -------- | --------------------------- |
| `planPath` | string | ✅       | Path to implementation plan |

### Output

| Field            | Type   | Description                   |
| ---------------- | ------ | ----------------------------- |
| `tasksPath`      | string | Path to generated `tasks.md`  |
| `taskCount`      | number | Number of tasks generated     |
| `parallelGroups` | array  | Tasks safe to run in parallel |
