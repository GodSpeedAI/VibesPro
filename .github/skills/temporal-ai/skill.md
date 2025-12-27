---
name: Temporal AI Skill
id: ce.skill.temporal-ai
description: Interface for managing the Temporal Database and AI system (ReDB + GGUF embeddings).
version: 1.0.0
---

# Temporal AI Skill

This skill provides access to the VibesPro Temporal AI system, which combines a temporal database (ReDB) with local AI capabilities (GGUF embeddings via llama.cpp). It allows agents to initialize the knowledge base, check system status, embed documents, and query the temporal index.

## Commands

| Command                    | Description                                                                  | Usage                                                        |
| :------------------------- | :--------------------------------------------------------------------------- | :----------------------------------------------------------- |
| `/vibepro.temporal.init`   | Initialize the temporal database and project specifications.                 | `/vibepro.temporal.init --project-name <name>`               |
| `/vibepro.temporal.status` | Check the status of the temporal database and AI system (embeddings/models). | `/vibepro.temporal.status`                                   |
| `/vibepro.temporal.embed`  | Embed a document or text into the temporal vector store.                     | `/vibepro.temporal.embed --file <path> --model <model-name>` |
| `/vibepro.temporal.query`  | Query the temporal knowledge base using semantic search.                     | `/vibepro.temporal.query --text <query> --limit <n>`         |

## Usage Examples

### Initialize Database

```bash
/vibepro.temporal.init --project-name "My Vibe Project"
```

### Check System Status

```bash
/vibepro.temporal.status
```

### Embed a Specification

```bash
/vibepro.temporal.embed --file docs/specs/auth/login-flow.md
```

### Semantic Query

```bash
/vibepro.temporal.query --text "What is the authentication architecture?" --limit 5
```
