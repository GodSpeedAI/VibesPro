# libs/ Agent Instructions

## 📍 Context

> **Purpose**: Business Logic Libraries - Domain logic, use cases, and adapters following hexagonal architecture (Ports & Adapters pattern).
> **When to use**: When implementing business logic, domain entities, use cases, or infrastructure adapters.

## 🔗 Parent Context

See [root copilot-instructions.md](/.github/copilot-instructions.md) for comprehensive project guidance and [AGENT-MAP.md](/AGENT-MAP.md) for navigation across contexts.

## 🎯 Local Scope

**This directory handles:**

- Business logic libraries organized by bounded context
- Hexagonal architecture implementation (Domain, Application, Infrastructure layers)
- Domain-Driven Design (DDD) patterns
- Ports (interfaces) and Adapters (implementations)
- Shared libraries and utilities
- Cross-cutting concerns

**Architecture Layer**: **Domain, Application, Infrastructure** (Core hexagonal architecture layers)

## 📁 Key Files & Patterns

### Directory Structure (Hexagonal Architecture)

```
libs/
├── {domain}/                   # Bounded context (e.g., users, orders, payments)
│   ├── domain/                 # Domain Layer (innermost)
│   │   ├── src/
│   │   │   ├── entities/       # Domain entities
│   │   │   ├── value-objects/  # Value objects
│   │   │   ├── aggregates/     # Aggregate roots
│   │   │   ├── events/         # Domain events
│   │   │   ├── exceptions/     # Domain exceptions
│   │   │   └── index.ts        # Public API
│   │   ├── project.json
│   │   └── README.md
│   ├── application/            # Application Layer (middle)
│   │   ├── src/
│   │   │   ├── use-cases/      # Business use cases
│   │   │   ├── ports/          # Interfaces (repositories, services)
│   │   │   ├── services/       # Application services
│   │   │   ├── dto/            # Data Transfer Objects
│   │   │   └── index.ts
│   │   ├── project.json
│   │   └── README.md
│   └── infrastructure/         # Infrastructure Layer (outermost of libs)
│       ├── src/
│       │   ├── repositories/   # Repository implementations
│       │   ├── adapters/       # External service adapters
│       │   ├── config/         # Infrastructure config
│       │   └── index.ts
│       ├── project.json
│       └── README.md
├── shared/                     # Shared utilities
│   ├── domain/                 # Shared domain concepts
│   ├── utils/                  # Common utilities
│   └── types/                  # Shared types
├── backend/                    # Backend-specific libs
├── security/                   # Security utilities
└── {{domain_name}}/            # Template for new domains
```

### Dependency Rules (CRITICAL)

**Hexagonal Architecture Dependency Flow:**

```
Apps (Interface Layer)
  ↓ depends on
Infrastructure (Adapters)
  ↓ depends on
Application (Use Cases / Ports)
  ↓ depends on
Domain (Business Logic)
  ↓ depends on
Nothing (Pure business logic)
```

**Rules:**

- ✅ Domain depends on NOTHING (pure TypeScript/Python)
- ✅ Application depends ONLY on Domain
- ✅ Infrastructure depends on Application + Domain
- ✅ Apps depend on Application + Infrastructure (wires them together)
- ❌ Domain NEVER depends on Application or Infrastructure
- ❌ Application NEVER depends on Infrastructure

### File Naming Conventions

| Layer              | File Type    | Pattern           | Example                         |
| ------------------ | ------------ | ----------------- | ------------------------------- |
| **Domain**         | Entity       | `*.entity.ts`     | `user.entity.ts`                |
| **Domain**         | Value Object | `*.vo.ts`         | `email.vo.ts`                   |
| **Domain**         | Aggregate    | `*.aggregate.ts`  | `order.aggregate.ts`            |
| **Domain**         | Event        | `*.event.ts`      | `user-created.event.ts`         |
| **Application**    | Use Case     | `*.use-case.ts`   | `create-user.use-case.ts`       |
| **Application**    | Port         | `*.port.ts`       | `user-repository.port.ts`       |
| **Application**    | Service      | `*.service.ts`    | `email-notification.service.ts` |
| **Infrastructure** | Repository   | `*.repository.ts` | `postgres-user.repository.ts`   |
| **Infrastructure** | Adapter      | `*.adapter.ts`    | `sendgrid-email.adapter.ts`     |

## 🧭 Routing Rules

### Use This Context When:

- [ ] Implementing business logic or domain models
- [ ] Creating use cases (application services)
- [ ] Defining ports (interfaces) for external dependencies
- [ ] Implementing adapters (repositories, external services)
- [ ] Organizing code by bounded contexts (DDD)
- [ ] Following hexagonal architecture patterns

### Refer to Other Contexts When:

| Context                                     | When to Use                                  |
| ------------------------------------------- | -------------------------------------------- |
| [apps/AGENT.md](/apps/AGENT.md)             | Building user interfaces or controllers      |
| [tests/AGENT.md](/tests/AGENT.md)           | Writing tests for domain/application logic   |
| [generators/AGENT.md](/generators/AGENT.md) | Scaffolding new libraries or domains         |
| [docs/AGENT.md](/docs/AGENT.md)             | Documenting domain models or specifications  |
| [.github/AGENT.md](/.github/AGENT.md)       | Using TDD workflows or architecture guidance |

## 🔧 Local Conventions

### Layer 1: Domain Layer (Pure Business Logic)

**Purpose**: Encapsulate business rules, invariants, and domain knowledge.

**Characteristics:**

- ✅ No external dependencies (no frameworks, no infrastructure)
- ✅ Pure TypeScript/Python
- ✅ 100% test coverage
- ✅ Rich domain models with behavior
- ✅ Immutable where possible

#### Domain Entity Example

```typescript
// libs/orders/domain/src/entities/order.entity.ts
import { OrderId } from '../value-objects/order-id.vo';
import { OrderItem } from '../value-objects/order-item.vo';
import { OrderStatus } from '../enums/order-status.enum';
import { DomainException } from '../exceptions/domain.exception';

export class Order {
  private constructor(
    private readonly _id: OrderId,
    private _items: OrderItem[],
    private _status: OrderStatus,
    private readonly _createdAt: Date,
  ) {}

  // Factory method
  static create(id: OrderId, items: OrderItem[]): Order {
    if (items.length === 0) {
      throw new DomainException('Order must have at least one item');
    }

    return new Order(id, items, OrderStatus.Pending, new Date());
  }

  // Getters (no setters - immutability)
  get id(): OrderId {
    return this._id;
  }

  get items(): readonly OrderItem[] {
    return Object.freeze([...this._items]);
  }

  get status(): OrderStatus {
    return this._status;
  }

  get total(): number {
    return this._items.reduce((sum, item) => sum + item.total, 0);
  }

  // Business methods (behavior)
  confirm(): void {
    if (this._status === OrderStatus.Cancelled) {
      throw new DomainException('Cannot confirm a cancelled order');
    }
    if (this._status === OrderStatus.Confirmed) {
      throw new DomainException('Order already confirmed');
    }

    this._status = OrderStatus.Confirmed;
  }

  cancel(): void {
    if (this._status === OrderStatus.Shipped) {
      throw new DomainException('Cannot cancel a shipped order');
    }

    this._status = OrderStatus.Cancelled;
  }

  addItem(item: OrderItem): void {
    if (this._status !== OrderStatus.Pending) {
      throw new DomainException('Cannot add items to non-pending order');
    }

    this._items.push(item);
  }
}
```

#### Value Object Example

```typescript
// libs/orders/domain/src/value-objects/email.vo.ts
import { DomainException } from '../exceptions/domain.exception';

export class Email {
  private constructor(private readonly value: string) {}

  static create(email: string): Email {
    if (!Email.isValid(email)) {
      throw new DomainException('Invalid email format');
    }
    return new Email(email.toLowerCase().trim());
  }
}

  private static isValid(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
```

### Layer 2: Application Layer (Use Cases & Ports)

**Purpose**: Orchestrate domain logic, define ports (interfaces) for infrastructure.

**Characteristics:**

- ✅ Depends ONLY on domain layer
- ✅ Contains use cases (application services)
- ✅ Defines ports (interfaces) for repositories, external services
- ✅ No implementation details (no database, no HTTP)
- ✅ Transaction boundaries

#### Port (Interface) Example

```typescript
// libs/orders/application/src/ports/order-repository.port.ts
import { Order, OrderId } from '@my-app/orders-domain';

export interface OrderRepository {
  save(order: Order): Promise<void>;
  findById(id: OrderId): Promise<Order | null>;
  findByUserId(userId: string): Promise<Order[]>;
  delete(id: OrderId): Promise<void>;
}
```

#### Use Case Example

```typescript
// libs/orders/application/src/use-cases/create-order.use-case.ts
import { Order, OrderId, OrderItem } from '@my-app/orders-domain';
import { OrderRepository } from '../ports/order-repository.port';
import { ProductRepository } from '../ports/product-repository.port';
import { EventBus } from '../ports/event-bus.port';
import { OrderCreatedEvent } from '../events/order-created.event';

export interface CreateOrderInput {
  userId: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
}

export interface CreateOrderOutput {
  orderId: string;
  total: number;
// libs/orders/application/src/use-cases/create-order.use-case.ts
import { Order, OrderId, OrderItem } from '@my-app/orders-domain';
import { OrderRepository } from '../ports/order-repository.port';
import { ProductRepository } from '../ports/product-repository.port';
import { EventBus } from '../ports/event-bus.port';
import { OrderCreatedEvent } from '../events/order-created.event';
import { ApplicationException } from '../exceptions/application.exception';

export class CreateOrderUseCase {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly productRepository: ProductRepository,
    private readonly eventBus: EventBus
  ) {}

  async execute(input: CreateOrderInput): Promise<CreateOrderOutput> {
    // 1. Validate products exist
    const products = await Promise.all(
      input.items.map(item => this.productRepository.findById(item.productId))
    );

    if (products.some(p => p === null)) {
      throw new ApplicationException('One or more products not found');
    }
    // …
  }
}
    if (products.some(p => p === null)) {
      throw new ApplicationException('One or more products not found');
    }

    // 2. Create domain entities
    const orderId = OrderId.generate();
    const orderItems = input.items.map((item, index) =>
      OrderItem.create(
        products[index]!,
        item.quantity
      )
    );

    // 3. Create order (domain logic)
    const order = Order.create(orderId, orderItems);

    // 4. Persist (through port)
    await this.orderRepository.save(order);

    // 5. Publish domain event
    await this.eventBus.publish(
      new OrderCreatedEvent(order.id, input.userId, order.total)
    );

    // 6. Return output
    return {
      orderId: order.id.value,
      total: order.total,
      status: order.status,
    };
  }
}
```

### Layer 3: Infrastructure Layer (Adapters)

**Purpose**: Implement ports with specific technologies (database, HTTP, etc.).

**Characteristics:**

- ✅ Implements ports defined in application layer
- ✅ Contains specific technology choices (Postgres, MongoDB, etc.)
- ✅ Adapters for external services (email, payment, etc.)
- ✅ Configuration and setup code

#### Repository Adapter Example

```typescript
// libs/orders/infrastructure/src/repositories/postgres-order.repository.ts
import { Order, OrderId } from '@my-app/orders-domain';
import { OrderRepository } from '@my-app/orders-application';
import { Pool } from 'pg';

export class PostgresOrderRepository implements OrderRepository {
  constructor(private readonly pool: Pool) {}

  async save(order: Order): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Insert order
      await client.query(
        `INSERT INTO orders (id, user_id, status, created_at, total)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET
           status = EXCLUDED.status,
           total = EXCLUDED.total`,
        [order.id.value, order.userId, order.status, order.createdAt, order.total],
      );

      // Insert order items
      for (const item of order.items) {
        await client.query(
          `INSERT INTO order_items (order_id, product_id, quantity, price)
           VALUES ($1, $2, $3, $4)`,
          [order.id.value, item.productId, item.quantity, item.price],
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw new InfrastructureException('Failed to save order', error);
    } finally {
      client.release();
    }
  }

  async findById(id: OrderId): Promise<Order | null> {
    const result = await this.pool.query(`SELECT * FROM orders WHERE id = $1`, [id.value]);

    if (result.rows.length === 0) {
      return null;
    }

    // Map database row to domain entity
    return this.toDomain(result.rows[0]);
  }

  private toDomain(row: any): Order {
    // Reconstruct domain entity from database row
    // This is where ORM mapping would happen
    return Order.reconstitute(OrderId.from(row.id), row.items, row.status, new Date(row.created_at));
  }
}
```

#### External Service Adapter Example

```typescript
// libs/notifications/infrastructure/src/adapters/sendgrid-email.adapter.ts
import { EmailService } from '@my-app/notifications-application';
import sgMail from '@sendgrid/mail';

export class SendGridEmailAdapter implements EmailService {
  constructor(apiKey: string) {
    sgMail.setApiKey(apiKey);
  }

  async send(to: string, subject: string, body: string): Promise<void> {
    try {
      await sgMail.send({
        to,
        from: 'noreply@example.com',
        subject,
        html: body,
      });
    } catch (error) {
      throw new InfrastructureException('Failed to send email', error);
    }
  }
}
```

### Shared Libraries

**Shared domain concepts:**

```typescript
// libs/shared/domain/src/value-objects/id.vo.ts
import { v4 as uuidv4 } from 'uuid';

export abstract class Id {
  protected constructor(private readonly _value: string) {
    if (!Id.isValid(_value)) {
      throw new Error('Invalid ID format');
    }
  }

  static generate(): string {
    return uuidv4();
  }

  static isValid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }

  get value(): string {
    return this._value;
  }

  equals(other: Id): boolean {
    return this._value === other._value;
  }
}
```

## 📚 Related Instructions

**Modular instructions that apply here:**

- [.github/instructions/generators-first.instructions.md](/.github/instructions/generators-first.instructions.md) - Scaffold with Nx generators
- [.github/instructions/testing.instructions.md](/.github/instructions/testing.instructions.md) - Testing strategy per layer
- [.github/instructions/security.instructions.md](/.github/instructions/security.instructions.md) - Security in domain logic
- [.github/instructions/style.frontend.instructions.md](/.github/instructions/style.frontend.instructions.md) - TypeScript style
- [.github/instructions/style.python.instructions.md](/.github/instructions/style.python.instructions.md) - Python style

**Relevant prompts:**

- [.github/prompts/spec.implement.prompt.md](/.github/prompts/spec.implement.prompt.md) - Implement from specs

**Related chat modes:**

- `persona.system-architect` - Architectural guidance
- `persona.senior-backend` - Backend patterns
- `tdd.red`, `tdd.green`, `tdd.refactor` - TDD workflow

## 💡 Examples

See inline examples above for:

- Domain Entity (Order)
- Value Object (Email)
- Port Interface (OrderRepository)
- Use Case (CreateOrderUseCase)
- Repository Adapter (PostgresOrderRepository)
- External Service Adapter (SendGridEmailAdapter)

### Example: Bounded Context Structure

```
libs/orders/
├── domain/
│   └── src/
│       ├── entities/
│       │   └── order.entity.ts
│       ├── value-objects/
│       │   ├── order-id.vo.ts
│       │   └── order-item.vo.ts
│       ├── enums/
│       │   └── order-status.enum.ts
│       ├── events/
│       │   └── order-created.event.ts
│       ├── exceptions/
│       │   └── order.exception.ts
│       └── index.ts (export public API)
├── application/
│   └── src/
│       ├── use-cases/
│       │   ├── create-order.use-case.ts
│       │   ├── confirm-order.use-case.ts
│       │   └── cancel-order.use-case.ts
│       ├── ports/
│       │   ├── order-repository.port.ts
│       │   ├── product-repository.port.ts
│       │   └── event-bus.port.ts
│       ├── events/
│       │   └── order-created.event.ts
│       └── index.ts
└── infrastructure/
    └── src/
        ├── repositories/
        │   ├── postgres-order.repository.ts
        │   └── in-memory-order.repository.ts (for testing)
        ├── adapters/
        │   └── event-bus.adapter.ts
        └── index.ts
```

## ✅ Checklist

### Before Creating a New Library:

- [ ] Use generator: `just ai-scaffold name=@nx/js:lib`
- [ ] Identify bounded context (domain name)
- [ ] Determine layer (domain, application, infrastructure)
- [ ] Plan dependencies (follow hexagonal rules)
- [ ] Design domain model (entities, value objects)
- [ ] Define ports (interfaces) in application layer

### While Building Libraries:

- [ ] Follow hexagonal architecture dependency rules
- [ ] Keep domain layer pure (no external deps)
- [ ] Define ports before implementations
- [ ] Use value objects for primitive obsession
- [ ] Encapsulate business rules in entities
- [ ] Write tests for each layer separately
- [ ] Add traceability comments (spec IDs)

### After Building Libraries:

- [ ] Verify dependency graph: `pnpm exec nx graph`
- [ ] Run tests: `just test-unit`
- [ ] Check coverage for domain layer (100%)
- [ ] Document public API in README
- [ ] Export only necessary symbols from index.ts
- [ ] Update Nx project tags for proper boundaries

## 🔍 Quick Reference

### Common Commands

```bash
# Generate new library
just ai-scaffold name=@nx/js:lib
pnpm exec nx g @nx/js:lib my-lib

# Generate domain library
pnpm exec nx g @nx/js:lib domain --directory=libs/orders/domain

# Generate application library
pnpm exec nx g @nx/js:lib application --directory=libs/orders/application

# Generate infrastructure library
pnpm exec nx g @nx/js:lib infrastructure --directory=libs/orders/infrastructure

# View dependency graph
pnpm exec nx graph

# Check circular dependencies
pnpm exec nx graph --watch

# Run affected tests
pnpm exec nx affected:test
```

### Nx Boundary Rules (project.json)

```json
{
  "name": "orders-domain",
  "tags": ["type:domain", "scope:orders"],
  "implicitDependencies": []
}
```

```json
{
  "name": "orders-application",
  "tags": ["type:application", "scope:orders"],
  "implicitDependencies": ["orders-domain"]
}
```

### Import Aliases (tsconfig.base.json)

```json
{
  "compilerOptions": {
    "paths": {
      "@my-app/orders-domain": ["libs/orders/domain/src/index.ts"],
      "@my-app/orders-application": ["libs/orders/application/src/index.ts"],
      "@my-app/orders-infrastructure": ["libs/orders/infrastructure/src/index.ts"],
      "@my-app/shared-domain": ["libs/shared/domain/src/index.ts"]
    }
  }
}
```

### Key Concepts

- **Hexagonal Architecture**: Ports & Adapters pattern
- **Domain Layer**: Pure business logic, no dependencies
- **Application Layer**: Use cases, ports (interfaces)
- **Infrastructure Layer**: Adapters, implementations
- **Port**: Interface defined in application layer
- **Adapter**: Implementation of port in infrastructure
- **Bounded Context**: Domain-specific boundary (DDD)
- **Aggregate**: Cluster of entities with root
- **Value Object**: Immutable domain concept
- **Domain Event**: Something that happened in domain

## 🛡️ Security Considerations

**Security in domain logic:**

- ⚠️ **Validate invariants**: Domain entities enforce business rules
- ⚠️ **Encapsulate state**: No public setters, use methods
- ⚠️ **Immutability**: Value objects should be immutable
- ⚠️ **Input validation**: Validate in domain, not just at boundaries
- ⚠️ **Authorization**: Check permissions in use cases
- ⚠️ **Sensitive data**: Mark PII, encrypt at infrastructure layer

**Example:**

```typescript
export class User {
  private constructor(
    private readonly _id: UserId,
    private readonly _email: Email,
    private _hashedPassword: string, // Never expose raw password
    private readonly _roles: Role[],
  ) {}

  // No getPassword() method - password never leaves entity

  verifyPassword(plainPassword: string): boolean {
    return bcrypt.compareSync(plainPassword, this._hashedPassword);
  }

  hasRole(role: Role): boolean {
    return this._roles.includes(role);
  }
}
```

## 🎯 Testing Strategy by Layer

### Domain Layer

- **Pure unit tests** - No mocks
- **100% coverage** - No exceptions
- **Test business rules** - Invariants, state transitions
- **Test value object equality**

```typescript
describe('Order (Domain)', () => {
  it('should not allow confirming cancelled order', () => {
    const order = Order.create(/* ... */);
    order.cancel();

    expect(() => order.confirm()).toThrow('Cannot confirm cancelled order');
  });
});
```

### Application Layer

- **Unit tests with mocks** - Mock ports
- **90%+ coverage**
- **Test use case orchestration**
- **Test error handling**

```typescript
describe('CreateOrderUseCase', () => {
  it('should call repository.save', async () => {
    const mockRepo = { save: jest.fn() };
    const useCase = new CreateOrderUseCase(mockRepo, ...);

    await useCase.execute({ /* ... */ });

    expect(mockRepo.save).toHaveBeenCalled();
  });
});
```

### Infrastructure Layer

- **Integration tests** - Use real dependencies when safe
- **80%+ coverage**
- **Test adapter implementations**
- **Test database queries**

```typescript
describe('PostgresOrderRepository', () => {
  it('should save and retrieve order', async () => {
    const repo = new PostgresOrderRepository(testDb);
    const order = Order.create(/* ... */);

    await repo.save(order);
    const retrieved = await repo.findById(order.id);

    expect(retrieved).toEqual(order);
  });
});
```

## 🔄 Maintenance

### Regular Tasks

- **Weekly**: Review domain model, refactor toward ubiquitous language
- **Monthly**: Audit dependencies, ensure hexagonal rules followed
- **Quarterly**: Review bounded contexts, consider splitting/merging
- **Per feature**: Update domain model first, then use cases

### When to Update This AGENT.md

- New layer patterns emerge
- Bounded context strategies change
- DDD patterns evolve
- Testing strategies per layer update
- Architecture decisions change

### Managing Technical Debt

**Signs of architectural debt:**

- Domain logic leaking into infrastructure
- Circular dependencies between layers
- Anemic domain models (just getters/setters)
- Fat use cases (too much logic)
- Ports with too many methods

**Remediation:**

- Extract business logic to domain layer
- Break circular deps, respect hierarchy
- Add behavior to entities
- Split use cases by responsibility
- Apply Interface Segregation Principle to ports

---

_Last updated: 2025-10-13 | Maintained by: VibesPro Project Team_
_Parent context: [copilot-instructions.md](/.github/copilot-instructions.md) | Navigation: [AGENT-MAP.md](/AGENT-MAP.md)_
