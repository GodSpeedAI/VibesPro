# Environment Setup Guide

This guide covers setting up your development environment for VibesPro.

## Prerequisites

| Tool               | Version | Purpose                               |
| ------------------ | ------- | ------------------------------------- |
| **Docker**         | v20+    | Container runtime for services        |
| **Docker Compose** | v2+     | Multi-container orchestration         |
| **just**           | v1.0+   | Command runner (`cargo install just`) |
| **Node.js**        | v20+    | JavaScript runtime                    |
| **Bun**            | v1.1+   | Fast TypeScript runtime               |
| **pnpm**           | v9+     | Package manager                       |
| **Python**         | v3.11+  | Python runtime                        |
| **Rust**           | v1.80+  | Rust toolchain (for temporal-ai)      |

## Quick Setup

```bash
# Clone and enter project
git clone <repository-url>
cd vibespro

# Core setup (Node, Bun, Python, dependencies)
just setup

# Verify environment
just doctor
```

## Tiered Setup Architecture

VibesPro uses progressive disclosure for environment setup:

| Tier                 | Command              | Components                            | Time  |
| -------------------- | -------------------- | ------------------------------------- | ----- |
| **0: Core**          | `just setup`         | Node, Bun, Python, pnpm install       | ~30s  |
| **1: Database**      | `just setup-db`      | Supabase + migrations                 | ~15s  |
| **2: Observability** | `just setup-observe` | Vector + OpenObserve + Logfire        | ~10s  |
| **3: AI/Temporal**   | `just setup-ai`      | temporal-ai CLI + embeddings (~180MB) | ~2min |
| **4: Mocking**       | `just setup-mocks`   | Mountebank + Testcontainers           | ~10s  |
| **5: Full**          | `just setup-all`     | Everything                            | ~3min |

### Development Commands

| Command            | Purpose                                        |
| ------------------ | ---------------------------------------------- |
| `just dev`         | Start Nx dev servers only                      |
| `just dev-observe` | Dev servers + observability                    |
| `just dev-full`    | Database + observability + mocks + dev servers |

---

## Tool Management

### mise (Project Runtimes)

[mise](https://mise.run) manages language runtimes with exact version pinning:

```toml
# .mise.toml
[tools]
node = "20.11.1"
bun = "1.1.42"
python = "3.11.11"
rust = "1.80.1"
```

```bash
# Install mise
curl https://mise.run | sh
eval "$(mise activate bash)"

# Install all runtimes
mise install
```

### Devbox (OS Dependencies & Containers)

[Devbox](https://www.jetpack.io/devbox/) provides Nix-based OS-level dependencies:

```bash
# Install devbox
curl -fsSL https://get.jetpack.io/devbox | bash

# Enter isolated environment
devbox shell

# Generate Docker container
devbox generate dockerfile
```

---

## Secrets Management

### SOPS + age

Secrets are encrypted using [SOPS](https://github.com/mozilla/sops) with [age](https://github.com/FiloSottile/age) keys.

**Setup your key:**

```bash
# Generate an age key (one-time)
age-keygen -o ~/.config/sops/key.txt

# Share public key with team to add to .sops.yaml
cat ~/.config/sops/key.txt | grep "public key"
```

**Required secrets** (in `.secrets.env.sops`):

| Variable            | Purpose                  |
| ------------------- | ------------------------ |
| `OPENOBSERVE_URL`   | OpenObserve API endpoint |
| `OPENOBSERVE_TOKEN` | OpenObserve auth token   |
| `OPENOBSERVE_ORG`   | OpenObserve organization |
| `OPENOBSERVE_USER`  | OpenObserve user email   |
| `LOGFIRE_TOKEN`     | Logfire tracing token    |
| `SUPABASE_*`        | Supabase credentials     |

**Decrypt secrets:**

```bash
# View decrypted content
sops -d .secrets.env.sops

# Edit secrets in-place
sops .secrets.env.sops
```

### direnv

The `.envrc` file auto-loads:

1. Devbox environment
2. mise runtimes
3. Decrypted secrets (via SOPS)

```bash
# Allow direnv for this project
direnv allow
```

---

## Observability Stack

```
┌─────────────────────────┐
│ App (Rust/Python/TS)    │
│ OpenTelemetry SDK       │
└───────────┬─────────────┘
            │ OTLP
            ▼
┌─────────────────────────┐
│ Vector (edge collector) │
│ PII redaction + routing │
└───────────┬─────────────┘
            │
    ┌───────┴───────┐
    ▼               ▼
Logfire         OpenObserve
(tracing)       (long-term)
```

| Command                       | Purpose                 |
| ----------------------------- | ----------------------- |
| `just observe-start`          | Start Vector pipeline   |
| `just observe-openobserve-up` | Start OpenObserve UI    |
| `just observe-validate`       | Validate Vector config  |
| `just test-logs`              | Run observability tests |
| `just test-logfire`           | Logfire smoke test      |

---

## Temporal AI

Pattern analysis and embeddings-based similarity search.

| Command                          | Purpose                    |
| -------------------------------- | -------------------------- |
| `just setup-ai`                  | Build CLI + download model |
| `just temporal-ai-query "query"` | Query similar patterns     |
| `just temporal-ai-stats`         | Show database stats        |
| `just download-embedding-model`  | Download ~180MB model      |

---

## Mocking Infrastructure

External API mocking using Mountebank + Testcontainers.

| Command             | Purpose                           |
| ------------------- | --------------------------------- |
| `just setup-mocks`  | Setup Mountebank + Testcontainers |
| `just mocks-start`  | Start mock server                 |
| `just mocks-stop`   | Stop mock server                  |
| `just mocks-status` | Check mock server status          |

### Mock Endpoints

| Port | Service          | Purpose                           |
| ---- | ---------------- | --------------------------------- |
| 2525 | Mountebank Admin | http://localhost:2525             |
| 3001 | LLM API          | OpenAI-compatible chat/embeddings |
| 3002 | Auth API         | Ory Kratos session mock           |
| 3003 | Payment API      | Stripe payment intents mock       |

### Adding Custom Imposters

Edit `tests/mocks/imposters/imposters.ejs` to add new mock responses.

---

## Database (Supabase)

| Command                | Purpose                    |
| ---------------------- | -------------------------- |
| `just supabase-start`  | Start PostgreSQL + Studio  |
| `just supabase-studio` | Open database UI           |
| `just db-migrate`      | Apply migrations           |
| `just db-seed`         | Seed database              |
| `just gen-types`       | Generate TS + Python types |

---

## Troubleshooting

### Secrets not loading

```bash
# Check SOPS key
ls -la ~/.config/sops/key.txt

# Manually test decryption
sops -d .secrets.env.sops
```

### mise runtimes not loading

```bash
eval "$(mise activate bash)"
mise trust
mise install
```

### Docker services failing

```bash
# Check Docker is running
docker ps

# View service logs
just supabase-logs
```

### Observability not working

```bash
# Validate Vector config
just observe-validate

# Check required secrets are set
echo $OPENOBSERVE_URL
echo $LOGFIRE_TOKEN
```

---

## Related Documentation

- [Supabase Workflow Guide](guides/supabase-workflow.md)
- [copilot-instructions.md](/.github/copilot-instructions.md)
- [Architecture Overview](architecture/)
