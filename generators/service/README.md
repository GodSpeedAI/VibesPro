# @vibespro/service-generator - Backend Service Generator

> Creates backend services with hexagonal architecture, supporting Python (FastAPI) and TypeScript.

## Overview

This generator scaffolds a new backend service in the `apps/` directory with a folder structure adhering to Hexagonal Architecture (Ports and Adapters). It supports generating services in Python (with FastAPI) or TypeScript.

## Installation

Already included in the VibesPro platform.

## Usage

### Basic Usage

```bash
# Create a Python service (default)
pnpm exec nx g @vibespro/service-generator:service my-api

# Create a TypeScript service
pnpm exec nx g @vibespro/service-generator:service my-api --language=typescript
```

### Using Tech Stack Defaults

When `VIBEPDK_USE_STACK_DEFAULTS=1` is set, the generator will automatically detect your project's tech stack and choose the appropriate language:

```bash
VIBEPDK_USE_STACK_DEFAULTS=1 pnpm exec nx g @vibespro/service-generator:service my-api
```

## Options

| Option      | Type                     | Default     | Description               |
| ----------- | ------------------------ | ----------- | ------------------------- |
| `name`      | string                   | (required)  | Service name (kebab-case) |
| `language`  | `python` \| `typescript` | auto/python | Programming language      |
| `directory` | string                   | -           | Custom directory path     |

## Generated Structure

### Python Service (FastAPI)

```
apps/<name>/
├── pyproject.toml           # Python dependencies
├── src/
│   └── main.py              # FastAPI application
├── domain/
│   ├── entities/            # Domain entities
│   └── value_objects/       # Value objects
├── application/
│   ├── ports/               # Interface definitions
│   │   └── repository.py    # Repository protocol
│   └── use_cases/           # Business logic
└── infrastructure/
    └── adapters/
        ├── in_memory/       # In-memory implementations
        └── supabase/        # Supabase implementations
```

### TypeScript Service

```
apps/<name>/
├── package.json
└── src/
    └── index.ts
```

## Hexagonal Architecture

The generated service follows hexagonal architecture principles:

### Domain Layer

- **Entities**: Core business objects with identity
- **Value Objects**: Immutable objects without identity

### Application Layer

- **Ports**: Interfaces defining how the application interacts with the outside world
- **Use Cases**: Business logic orchestration

### Infrastructure Layer

- **Adapters**: Implementations of ports for specific technologies

## Example Port

Generated repository port for Python:

```python
from typing import Protocol, TypeVar

T = TypeVar('T')

class Repository(Protocol[T]):
    """Base repository protocol for data persistence"""

    async def find_by_id(self, id: str) -> T | None:
        """Find entity by ID"""
        ...

    async def save(self, entity: T) -> None:
        """Save entity"""
        ...
```

## Integration with Observability

Python services include integration with VibesPro's logging infrastructure:

```python
from libs.python.vibepro_logging import (
    LogCategory,
    bootstrap_logfire,
    configure_logger,
)

app = FastAPI(title="my-service")
bootstrap_logfire(app, service="my-service")
logger = configure_logger("my-service")

@app.get("/")
def read_root():
    logger.info("health check", category=LogCategory.APP)
    return {"status": "ok"}
```

## Development

After generating a service:

1. **Install dependencies**: `cd apps/<name> && uv sync` (Python) or `pnpm install` (TypeScript)
2. **Run locally**: Check the generated pyproject.toml or package.json for scripts
3. **Add domain logic**: Create entities in `domain/entities/`
4. **Implement use cases**: Add business logic in `application/use_cases/`
5. **Add adapters**: Implement ports in `infrastructure/adapters/`

## Environment Variables

| Variable                     | Description                                        |
| ---------------------------- | -------------------------------------------------- |
| `VIBEPDK_USE_STACK_DEFAULTS` | Set to `1` to auto-detect language from tech stack |

## Related Commands

```bash
# Validate the generator
just generator-validate service

# Run quality checks
just generator-quality
```

## Traceability

- **Spec**: Hexagonal Architecture Pattern
- **Related**: `@vibespro/generator:generator` for creating custom generators
