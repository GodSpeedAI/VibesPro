---
description: 'Hexagonal architecture patterns with code examples'
applyTo: 'libs/**,generators/**'
kind: instructions
domain: architecture
precedence: 16
---

# Hexagonal Architecture (Ports & Adapters)

## The Dependency Rule

```
┌─────────────────────────────────────────────────────────────┐
│                    APPS (Interface Layer)                   │
│               Controllers, UI, CLI, API endpoints           │
├─────────────────────────────────────────────────────────────┤
│                  INFRASTRUCTURE (Adapters)                  │
│         PostgresRepo, SendGridAdapter, RedisCache           │
│         Implements ports defined in Application layer       │
├─────────────────────────────────────────────────────────────┤
│                  APPLICATION (Use Cases)                    │
│         CreateOrderUseCase, ports/OrderRepository           │
│         Orchestrates domain, defines interfaces             │
├─────────────────────────────────────────────────────────────┤
│                    DOMAIN (Core Logic)                      │
│         Order, OrderItem, Money, DomainEvent                │
│         Pure business rules, NO external dependencies       │
└─────────────────────────────────────────────────────────────┘
                Dependencies flow INWARD only ↑
```

**Rules:**

- ✅ Domain depends on NOTHING (pure TypeScript/Python)
- ✅ Application depends ONLY on Domain
- ✅ Infrastructure depends on Application + Domain
- ❌ Inner layers NEVER depend on outer layers

## Layer 1: Domain (Pure Business Logic)

```typescript
// libs/{domain}/domain/src/entities/order.entity.ts
export class Order {
  private constructor(
    private readonly _id: OrderId,
    private _items: OrderItem[],
    private _status: OrderStatus,
  ) {}

  // Factory method - validates invariants
  static create(id: OrderId, items: OrderItem[]): Order {
    if (items.length === 0) {
      throw new DomainException('Order requires at least one item');
    }
    return new Order(id, items, OrderStatus.Pending);
  }

  // Business methods (behavior, not just data)
  confirm(): void {
    if (this._status === OrderStatus.Cancelled) {
      throw new DomainException('Cannot confirm cancelled order');
    }
    this._status = OrderStatus.Confirmed;
  }

  get total(): number {
    return this._items.reduce((sum, item) => sum + item.total, 0);
  }
}
```

```typescript
// libs/{domain}/domain/src/value-objects/email.vo.ts
export class Email {
  private constructor(private readonly value: string) {}

  static create(email: string): Email {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new DomainException('Invalid email format');
    }
    return new Email(email.toLowerCase().trim());
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
```

## Layer 2: Application (Use Cases & Ports)

```typescript
// libs/{domain}/application/src/ports/order-repository.port.ts
// PORT = Interface (what, not how)
export interface OrderRepository {
  save(order: Order): Promise<void>;
  findById(id: OrderId): Promise<Order | null>;
  findByUserId(userId: string): Promise<Order[]>;
}
```

```typescript
// libs/{domain}/application/src/use-cases/create-order.use-case.ts
export class CreateOrderUseCase {
  constructor(
    private readonly orderRepo: OrderRepository, // Port, not implementation
    private readonly eventBus: EventBus, // Port, not implementation
  ) {}

  async execute(input: CreateOrderInput): Promise<CreateOrderOutput> {
    // 1. Create domain entities
    const order = Order.create(OrderId.generate(), input.items);

    // 2. Persist via port
    await this.orderRepo.save(order);

    // 3. Publish domain event
    await this.eventBus.publish(new OrderCreatedEvent(order.id));

    return { orderId: order.id.value, total: order.total };
  }
}
```

## Layer 3: Infrastructure (Adapters)

```typescript
// libs/{domain}/infrastructure/src/repositories/postgres-order.repository.ts
// ADAPTER = Implementation of a port
export class PostgresOrderRepository implements OrderRepository {
  constructor(private readonly pool: Pool) {}

  async save(order: Order): Promise<void> {
    await this.pool.query('INSERT INTO orders (id, status, total) VALUES ($1, $2, $3)', [order.id.value, order.status, order.total]);
  }

  async findById(id: OrderId): Promise<Order | null> {
    const result = await this.pool.query('SELECT * FROM orders WHERE id = $1', [id.value]);
    return result.rows[0] ? this.toDomain(result.rows[0]) : null;
  }
}
```

## Directory Structure

```
libs/{domain}/
├── domain/src/
│   ├── entities/         # Rich domain models with behavior
│   ├── value-objects/    # Immutable domain concepts (Email, Money)
│   ├── events/           # Domain events (OrderCreated)
│   ├── exceptions/       # Domain-specific errors
│   └── index.ts          # Public exports only
├── application/src/
│   ├── ports/            # Interfaces for external dependencies
│   ├── use-cases/        # Application services
│   ├── dto/              # Data transfer objects
│   └── index.ts
└── infrastructure/src/
    ├── repositories/     # Database implementations
    ├── adapters/         # External service integrations
    └── index.ts
```

## Common Anti-Patterns

❌ **Anemic Domain Model** - Entity with only getters/setters, no behavior
❌ **Domain importing infrastructure** - `import { Pool } from 'pg'` in domain
❌ **Fat Use Case** - Business logic that belongs in domain entities
❌ **Leaky Abstraction** - Port interface exposing implementation details

## Scaffolding

```bash
# Create hexagonal service with all layers
just ai-scaffold name=vibespro:service

# Or manually create each layer
pnpm exec nx g @nx/js:lib domain --directory=libs/orders/domain
pnpm exec nx g @nx/js:lib application --directory=libs/orders/application
pnpm exec nx g @nx/js:lib infrastructure --directory=libs/orders/infrastructure
```

## Testing by Layer

| Layer          | Test Type    | Mocks?   | Coverage Target |
| -------------- | ------------ | -------- | --------------- |
| Domain         | Pure unit    | None     | 100%            |
| Application    | Unit + mocks | Ports    | 90%+            |
| Infrastructure | Integration  | External | 80%+            |

See also: `libs/AGENT.md`, `generators-first.instructions.md`, `testing.instructions.md`
