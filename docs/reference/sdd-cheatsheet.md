# SDD Quick Reference

> Print this page. Keep it handy.

## Commands

| Command                      | When                             | What You Get               |
| ---------------------------- | -------------------------------- | -------------------------- |
| `/vibepro.specify <idea>`    | Starting a feature               | `spec.md`                  |
| `/vibepro.clarify`           | Spec has `[NEEDS CLARIFICATION]` | Updated spec               |
| `/vibepro.plan <tech stack>` | Spec is complete                 | `plan.md`, `data-model.md` |
| `/vibepro.tasks`             | Plan is approved                 | `tasks.md`                 |
| `/vibepro.implement`         | Tasks are ready                  | Working code               |
| `/vibepro.prd <feature>`     | Product requirements             | `prd.md` with PRD ID       |
| `/vibepro.adr <decision>`    | Architecture decision            | `adr.md` with ADR ID       |
| `/vibepro.sds <system>`      | Software design                  | `sds.md` with SDS ID       |

## Workflow

```
Idea → specify → (clarify) → plan → tasks → implement
```

## Output Paths

```
docs/specs/<bounded-context>/<feature>/
├── spec.md         ← /vibepro.specify
├── plan.md         ← /vibepro.plan
├── data-model.md   ← /vibepro.plan
├── contracts/      ← /vibepro.plan
└── tasks.md        ← /vibepro.tasks
```

## Context Keywords

| Say This             | Gets Context    |
| -------------------- | --------------- |
| login, auth, user    | `auth`          |
| order, cart, payment | `orders`        |
| trace, log, metric   | `observability` |
| default              | `features`      |

## Tips

- **Be outcome-focused**: "Users can..." not "Create a function..."
- **Clarify first**: Cheaper than fixing later
- **Review before implement**: Last chance to pivot
- **One feature at a time**: Don't bundle unrelated work

## Common Fixes

| Problem              | Solution                            |
| -------------------- | ----------------------------------- |
| Command not found    | Reload VS Code window               |
| Spec exists          | Use different feature name          |
| Over-engineered plan | Add "Keep it simple" to plan prompt |

## Files to Know

| File                                                    | Purpose             |
| ------------------------------------------------------- | ------------------- |
| `.github/instructions/sdd_constitution.instructions.md` | SDD rules           |
| `.github/skills/spec-kit-workflow/skill.md`             | Command definitions |
| `docs/guides/spec-driven-development.md`                | Full guide          |
