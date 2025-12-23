# Shared Domain - Hexagonal Architecture Foundations

Core hexagonal architecture abstractions for VibesPro generated projects.

## Overview

This library provides production-ready implementations of:

- **Unit of Work (UoW)**: Transaction boundary management
- **Event Bus**: Domain event pub/sub mechanism

Both patterns are available in TypeScript and Python with feature parity.

## TypeScript Usage

```typescript
import { InMemoryUnitOfWork, InMemoryEventBus } from '@vibes-pro/shared-domain';

// Unit of Work
const uow = new InMemoryUnitOfWork();
await uow.withTransaction(async () => {
  uow.registerNew(entity);
  await repository.save(entity);
});

// Event Bus
const eventBus = new InMemoryEventBus();
eventBus.subscribe({ name: 'UserCreated' }, (event) => {
  console.log('User created:', event);
});
eventBus.publish({ name: 'UserCreated', userId: '123' });
```

## Python Usage

```python
from libs.shared.domain.python.adapters.in_memory_uow import InMemoryUnitOfWork
from libs.shared.domain.python.adapters.in_memory_eventbus import InMemoryEventBus

# Unit of Work
uow = InMemoryUnitOfWork()
async def work():
    uow.register_new(entity)
    await repository.save(entity)

await uow.with_transaction(work)

# Event Bus
event_bus = InMemoryEventBus()
event_bus.subscribe(UserCreatedEvent, lambda e: print(f"User created: {e}"))
event_bus.publish(UserCreatedEvent(user_id="123"))
```

## Architecture

Follows hexagonal architecture principles:

- **Ports**: Interfaces/Protocols defining contracts
- **Adapters**: Implementations (in-memory, database, message broker, etc.)

## Testing

TypeScript:

```bash
pnpm exec nx test shared-domain
```

Python:

```bash
uv run pytest libs/shared/domain/python/tests/ -v
```

## Specifications

- DEV-ADR-024: Unit of Work and Event Bus as First-Class Abstractions
- DEV-PRD-025: Unit of Work Abstraction
- DEV-PRD-026: Event-Driven Architecture with EventBus
- DEV-SDS-024: Unit of Work Design
- DEV-SDS-025: Event Bus Contract Design
