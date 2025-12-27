---
name: Observability Skill
id: ce.skill.observability
description: Manage full-stack observability using Logfire (logging/tracing) and OpenObserve (storage/visualization).
version: 1.0.0
---

# Observability Skill

This skill provides a unified interface for managing the observability stack in VibesPro. It wraps `logfire` for Python-based structured logging/tracing and `OpenObserve` for local metric and log storage. Agents can use this skill to check system health, verify configuration, and manage the local observability infrastructure.

## Commands

| Command                         | Description                                                                       | Usage                           |
| :------------------------------ | :-------------------------------------------------------------------------------- | :------------------------------ |
| `/vibepro.monitor.check`        | Verify the observability configuration (Logfire token, OpenObserve connectivity). | `/vibepro.monitor.check`        |
| `/vibepro.monitor.demo`         | Run a quickstart demo to verify end-to-end logging flow.                          | `/vibepro.monitor.demo`         |
| `/vibepro.monitor.stack.start`  | Start the local OpenObserve stack via Docker Compose (with secret injection).     | `/vibepro.monitor.stack.start`  |
| `/vibepro.monitor.stack.stop`   | Stop the local OpenObserve stack.                                                 | `/vibepro.monitor.stack.stop`   |
| `/vibepro.monitor.stack.status` | Check the running status of OpenObserve containers.                               | `/vibepro.monitor.stack.status` |

## Usage Examples

### Verify Configuration

```bash
/vibepro.monitor.check
```

### Start Local Stack

```bash
/vibepro.monitor.stack.start
```

### Run Demo

```bash
# Generates sample logs and traces to verify ingestion
/vibepro.monitor.demo
```
