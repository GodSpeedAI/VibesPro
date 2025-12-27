# Skills Technical Reference

This document provides a technical reference for the core skills in VibesPro.

## Temporal AI Skill (`ce.skill.temporal-ai`)

**ID**: `ce.skill.temporal-ai`
**Interface**: `port.md`
**Implementation**: `adapter.md` (Python wrapper + Rust binary)

### Commands

| Command  | Arguments                     | Implementation Detail                     |
| :------- | :---------------------------- | :---------------------------------------- |
| `init`   | `--project-name`              | `python tools/temporal-db/init.py init`   |
| `status` | None                          | `python tools/temporal-db/init.py status` |
| `embed`  | `--file`, `--text`, `--model` | `cargo run ... -- embed`                  |
| `query`  | `--text`, `--limit`           | `cargo run ... -- query`                  |

---

## Observability Skill (`ce.skill.observability`)

**ID**: `ce.skill.observability`
**Interface**: `port.md`
**Implementation**: `adapter.md` (Shell scripts + Python SDK)

### Commands

| Command        | Arguments | Implementation Detail                                        |
| :------------- | :-------- | :----------------------------------------------------------- |
| `check`        | None      | Verification script (ENV check + curl)                       |
| `demo`         | None      | `python tools/logging/logfire-quickstart.py`                 |
| `stack.start`  | None      | `bash ops/openobserve/run-with-secrets.sh` (sops decryption) |
| `stack.stop`   | None      | `docker compose down`                                        |
| `stack.status` | None      | `docker compose ps`                                          |

---

## API Mocking Skill (`ce.skill.api-mocking`)

**ID**: `ce.skill.api-mocking`
**Interface**: `port.md`
**Implementation**: `adapter.md` (Python scaffold script)

### Commands

| Command   | Arguments | Implementation Detail                                         |
| :-------- | :-------- | :------------------------------------------------------------ |
| `init`    | None      | `python tools/mocking/init.py` (checks deps, creates fixture) |
| `example` | None      | `python tools/mocking/init.py` (idempotent creation)          |

---

## Frontend Design Skill (`ce.skill.frontend-design`)

**ID**: `ce.skill.frontend-design`
**Definition**: `SKILL.md` (Design guidelines & Creative direction)

### Commands

_This skill is directive/generative and does not expose CLI commands._
