# VibesPro – HexDDD × VibePDK Merger

VibesPro merges the HexDDD hexagonal-architecture starter and VibePDK's
AI-augmented development workflow into a single generator-first platform. The
repository hosts the Copier template, migration tooling, and accompanying
specifications that drive the merger effort.

## Project Highlights

- **Generator-first**: Copier templates that create ready-to-run applications.
- **Hexagonal + DDD**: Enforces clear domain, application, infrastructure, and
  interface boundaries across languages.
- **AI-enabled workflows**: Hooks for temporal learning, prompt-driven reviews,
  and pattern suggestions.
- **Migration utilities**: Scripts to migrate existing HexDDD and VibePDK
  projects into the unified structure.

## Getting Started

```bash
uv sync --no-dev            # Install Python dependencies
pnpm install                # Install Node dependencies
just setup                  # Provision both environments and tools
```

Generate a sample project using the included fixture:

```bash
copier copy . ./test-output \
  --data-file tests/fixtures/test-data.yml \
  --force
```

## Repository Layout

- `templates/` – Copier template assets.
- `hooks/` – Copier pre/post generation hooks.
- `tools/` – Migration, monitoring, AI, and type-system tooling.
- `docs/` – Specifications, checklists, and planning artifacts for the merger.
- `tests/` – Fixtures and suites for validating the generator.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development conventions, testing
requirements, and the change management process.
# Trigger workflow run
# Fixed pnpm workspace config
