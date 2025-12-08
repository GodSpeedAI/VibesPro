# Environment Setup Guide

This guide covers setting up your development environment for VibesPro.

## Prerequisites

| Tool               | Version | Purpose                               |
| ------------------ | ------- | ------------------------------------- |
| **Docker**         | v20+    | Container runtime for Supabase        |
| **Docker Compose** | v2+     | Multi-container orchestration         |
| **just**           | v1.0+   | Command runner (`cargo install just`) |
| **psql**           | v15+    | PostgreSQL client for migrations      |
| **Node.js**        | v20+    | JavaScript runtime                    |
| **pnpm**           | v9+     | Package manager                       |
| **Python**         | v3.11+  | Python runtime                        |
| **uv**             | v0.4+   | Python package manager                |

## Quick Setup

```bash
# Clone and enter project
git clone <repository-url>
cd vibespro

# Run full setup (installs Node, Python deps, tools)
just setup

# Verify environment
just doctor
```

## Devbox (Recommended)

VibesPro uses [Devbox](https://www.jetpack.io/devbox/) for reproducible development environments. Devbox automatically provides all required tools.

```bash
# Install devbox
curl -fsSL https://get.jetpack.io/devbox | bash

# Enter devbox shell (auto-installs all tools)
devbox shell

# Or run commands directly
devbox run just setup
```

## Supabase Local Development

VibesPro uses a local Supabase stack for database development. See [Supabase Workflow Guide](guides/supabase-workflow.md) for complete details.

### Quick Start

```bash
# Start the Supabase stack
just supabase-start

# Apply database migrations
just db-migrate

# Open Studio UI in browser
just supabase-studio

# Stop the stack when done
just supabase-stop
```

### Port Reference

| Service    | Default Port | Environment Variable |
| ---------- | ------------ | -------------------- |
| PostgreSQL | 54322        | `POSTGRES_PORT`      |
| Studio UI  | 54323        | `STUDIO_PORT`        |
| PostgREST  | 54324        | `REST_PORT`          |
| Kong API   | 54321        | `KONG_PORT`          |

Ports are configured in `docker/.env.supabase`. Dynamic port detection is used, so you can change ports without modifying the justfile.

## Troubleshooting

### Docker Issues

**Docker daemon not running:**

```bash
# Linux
sudo systemctl start docker

# macOS
open -a Docker
```

**Permission denied:**

```bash
# Add user to docker group (Linux)
sudo usermod -aG docker $USER
# Log out and back in
```

### Port Conflicts

**Check what's using a port:**

```bash
lsof -i :54322  # Check database port
```

**Use different ports:**

```bash
# Edit docker/.env.supabase
POSTGRES_PORT=55322
STUDIO_PORT=55323
```

### Devbox Issues

**Devbox update issues:**

```bash
just devbox-fix
```

**Supabase CLI not found in devbox:**

```bash
just devbox-check
```

### Python Environment Issues

**Virtual environment not found:**

```bash
just setup-python
```

**Package conflicts:**

```bash
rm -rf .venv
just setup-python
```

## Related Documentation

- [Supabase Workflow Guide](guides/supabase-workflow.md) - Database development
- [copilot-instructions.md](/.github/copilot-instructions.md) - Project overview
- [Architecture Overview](architecture/) - System architecture
