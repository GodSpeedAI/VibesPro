# apps/ Agent Instructions

## 📍 Context

> **Purpose**: Application Interfaces - Web, mobile, CLI, and API applications that interact with users.
> **When to use**: When building user-facing applications, implementing controllers, or creating interface adapters for the hexagonal architecture.

## 🔗 Parent Context

See [root copilot-instructions.md](/.github/copilot-instructions.md) for comprehensive project guidance and [AGENT-MAP.md](/AGENT-MAP.md) for navigation across contexts.

## 🎯 Local Scope

**This directory handles:**

- User-facing applications (web, mobile, CLI, APIs)
- Interface/Presentation layer of hexagonal architecture
- Controllers and API endpoints
- UI components and views
- Application-specific configuration
- Entry points and bootstrapping

**Architecture Layer**: **Interface Layer** (Hexagonal Architecture - outermost layer)

## 📁 Key Files & Patterns

### Directory Structure

```
apps/
├── observe-smoke/              # Example application
│   ├── src/
│   │   ├── main.ts            # Application entry point
│   │   ├── app/               # Application modules
│   │   ├── controllers/       # HTTP controllers
│   │   └── views/             # UI views/templates
│   ├── project.json           # Nx project configuration
│   ├── tsconfig.json          # TypeScript config
│   └── README.md              # App-specific docs
├── {{app_name}}/              # Template for new apps
│   └── ...                    # Similar structure
└── .gitkeep
```

### Typical Application Structure (Hexagonal Architecture)

```
apps/my-app/
├── src/
│   ├── main.ts                     # Bootstrap & dependency injection
│   ├── app.module.ts               # Application module (if using framework)
│   ├── controllers/                # Interface adapters (inbound)
│   │   ├── user.controller.ts      # HTTP/REST endpoints
│   │   ├── cli.controller.ts       # CLI commands
│   │   └── graphql.resolver.ts     # GraphQL resolvers
│   ├── presenters/                 # Output formatting
│   │   └── user.presenter.ts       # Transform domain → DTO
│   ├── dto/                        # Data Transfer Objects
│   │   ├── create-user.dto.ts
│   │   └── user-response.dto.ts
│   ├── views/                      # UI templates (if applicable)
│   │   └── components/
│   ├── config/                     # App-specific config
│   │   └── app.config.ts
│   └── di/                         # Dependency injection setup
│       └── container.ts            # Wire dependencies
├── tests/
│   ├── e2e/                        # End-to-end tests
│   └── integration/                # Controller integration tests
├── project.json                    # Nx configuration
├── tsconfig.json                   # TypeScript configuration
└── README.md                       # Application documentation
```

### File Naming Conventions

| File Type       | Pattern                         | Location           | Example                 |
| --------------- | ------------------------------- | ------------------ | ----------------------- |
| **Controllers** | `*.controller.ts`               | `src/controllers/` | `user.controller.ts`    |
| **Presenters**  | `*.presenter.ts`                | `src/presenters/`  | `user.presenter.ts`     |
| **DTOs**        | `*.dto.ts`                      | `src/dto/`         | `create-user.dto.ts`    |
| **Views**       | `*.view.tsx`, `*.component.tsx` | `src/views/`       | `user-profile.view.tsx` |
| **Config**      | `*.config.ts`                   | `src/config/`      | `app.config.ts`         |
| **Main**        | `main.ts`                       | `src/`             | `main.ts`               |

## 🧭 Routing Rules

### Use This Context When:

- [ ] Building user-facing applications
- [ ] Implementing HTTP controllers or API endpoints
- [ ] Creating CLI commands or interfaces
- [ ] Building UI components or views
- [ ] Setting up application bootstrap/entry points
- [ ] Configuring dependency injection for apps
- [ ] Writing end-to-end tests

### Refer to Other Contexts When:

| Context                                     | When to Use                                     |
| ------------------------------------------- | ----------------------------------------------- |
| [libs/AGENT.md](/libs/AGENT.md)             | Implementing business logic (use cases, domain) |
| [tests/AGENT.md](/tests/AGENT.md)           | Writing tests for controllers or e2e tests      |
| [generators/AGENT.md](/generators/AGENT.md) | Scaffolding new applications with Nx            |
| [docs/AGENT.md](/docs/AGENT.md)             | Documenting APIs or application architecture    |
| [.github/AGENT.md](/.github/AGENT.md)       | Using AI workflows or chat modes                |

## 🔧 Local Conventions

### Hexagonal Architecture Principles

**Apps are the Interface/Adapter Layer:**

```typescript
// ❌ BAD - Business logic in controller
@Controller('/users')
export class UserController {
  async create(req: Request) {
    // DON'T: Put validation, business rules here
    if (!req.body.email.includes('@')) {
      throw new Error('Invalid email');
    }
    // DON'T: Direct database access
    const user = await db.users.insert(req.body);
    return user;
  }
}

// ✅ GOOD - Delegate to use case (application layer)
@Controller('/users')
export class UserController {
  constructor(
    private readonly createUser: CreateUserUseCase, // Port
    private readonly presenter: UserPresenter,
  ) {}

  async create(req: Request, res: Response) {
    // Controller responsibilities:
    // 1. Parse/validate HTTP input
    const dto = CreateUserDto.from(req.body);

    // 2. Call use case
    const user = await this.createUser.execute(dto);

    // 3. Format response
    res.json(this.presenter.toResponse(user));
  }
}
```

### Controller Responsibilities (ONLY)

1. **Parse input** from HTTP/CLI/GraphQL
2. **Validate input format** (not business rules)
3. **Call use case** (application layer)
4. **Format output** via presenter
5. **Handle HTTP concerns** (status codes, headers)

**DON'T in controllers:**

- ❌ Business logic or domain rules
- ❌ Direct database access
- ❌ Complex calculations
- ❌ External service calls (use use cases)

### Dependency Injection Pattern

**Wire dependencies in main.ts or DI container:**

```typescript
// apps/my-app/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // App-level configuration
  app.setGlobalPrefix('api');
  app.enableCors();

  await app.listen(3000);
}

bootstrap();
```

```typescript
// apps/my-app/src/app.module.ts
@Module({
  imports: [
    // Import domain/application libraries
    UserModule,
    OrderModule,
  ],
  controllers: [
    // Interface adapters
    UserController,
    OrderController,
  ],
  providers: [
    // Wire dependencies
    {
      provide: 'UserRepository',
      useClass: PostgresUserRepository, // Infrastructure
    },
    CreateUserUseCase,
    UserPresenter,
  ],
})
export class AppModule {}
```

### DTO (Data Transfer Object) Pattern

**Use DTOs for input validation:**

```typescript
// apps/my-app/src/dto/create-user.dto.ts
import { z } from 'zod';

// Schema for validation
const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  age: z.number().int().min(0).max(150).optional(),
});

export class CreateUserDto {
  email: string;
  name: string;
  age?: number;

  private constructor(data: z.infer<typeof CreateUserSchema>) {
    Object.assign(this, data);
  }

  static from(data: unknown): CreateUserDto {
    const validated = CreateUserSchema.parse(data);
    return new CreateUserDto(validated);
  }
}
```

### Presenter Pattern

**Use presenters to format output:**

```typescript
// apps/my-app/src/presenters/user.presenter.ts
import { User } from '@my-app/domain';

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  // Note: No password or sensitive data
}

export class UserPresenter {
  toResponse(user: User): UserResponse {
    return {
      id: user.id.value,
      email: user.email.value,
      name: user.name.value,
      createdAt: user.createdAt.toISOString(),
    };
  }

  toListResponse(users: User[]): UserResponse[] {
    return users.map((user) => this.toResponse(user));
  }
}
```

### Application Types

#### Web Application (Next.js/Remix)

```typescript
// apps/web/src/app/page.tsx
import { UserList } from "@my-app/ui-components";

export default async function HomePage() {
    // Server component - can call use cases directly
    const users = await getUsers();

    return (
        <main>
            <h1>Users</h1>
            <UserList users={users} />
        </main>
    );
}
```

#### API Application (Express/Fastify/NestJS)

```typescript
// apps/api/src/controllers/user.controller.ts
import { Controller, Post, Body, Get, Param } from '@nestjs/common';

@Controller('users')
export class UserController {
  constructor(
    private readonly createUser: CreateUserUseCase,
    private readonly getUser: GetUserUseCase,
    private readonly presenter: UserPresenter,
  ) {}

  @Post()
  async create(@Body() dto: CreateUserDto) {
    const user = await this.createUser.execute(dto);
    return this.presenter.toResponse(user);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const user = await this.getUser.execute({ id });
    return this.presenter.toResponse(user);
  }
}
```

#### CLI Application

```typescript
// apps/cli/src/main.ts
import { Command } from 'commander';
import { createContainer } from './di/container';

const program = new Command();
const container = createContainer();

program
  .command('user:create')
  .description('Create a new user')
  .requiredOption('-e, --email <email>', 'User email')
  .requiredOption('-n, --name <name>', 'User name')
  .action(async (options) => {
    const createUser = container.get<CreateUserUseCase>('CreateUserUseCase');

    try {
      const user = await createUser.execute({
        email: options.email,
        name: options.name,
      });
      console.log('✅ User created:', user.id.value);
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

program.parse();
```

#### Mobile Application (React Native/Expo)

```typescript
// apps/mobile/src/screens/UserProfileScreen.tsx
import { View, Text } from "react-native";
import { useUser } from "../hooks/useUser";

export function UserProfileScreen({ route }) {
    const { userId } = route.params;
    const { user, loading, error } = useUser(userId);

    if (loading) return <Text>Loading...</Text>;
    if (error) return <Text>Error: {error.message}</Text>;

    return (
        <View>
            <Text>{user.name}</Text>
            <Text>{user.email}</Text>
        </View>
    );
}
```

## 📚 Related Instructions

**Modular instructions that apply here:**

- [.github/instructions/style.frontend.instructions.md](/.github/instructions/style.frontend.instructions.md) - Frontend patterns
- [.github/instructions/security.instructions.md](/.github/instructions/security.instructions.md) - Security in interfaces
- [.github/instructions/testing.instructions.md](/.github/instructions/testing.instructions.md) - E2E testing
- [.github/instructions/generators-first.instructions.md](/.github/instructions/generators-first.instructions.md) - Scaffold apps with Nx

**Relevant prompts:**

- [.github/prompts/ui.react.create-component.prompt.md](/.github/prompts/ui.react.create-component.prompt.md) - React components

**Related chat modes:**

- `persona.senior-frontend` - Frontend patterns
- `persona.ux-ui-designer` - UI/UX guidance

## 💡 Examples

### Example 1: RESTful Controller with Hexagonal Architecture

```typescript
// apps/api/src/controllers/order.controller.ts
import { Controller, Post, Get, Body, Param, HttpStatus } from '@nestjs/common';
import { CreateOrderUseCase, GetOrderUseCase } from '@my-app/orders-application';
import { OrderPresenter } from '../presenters/order.presenter';
import { CreateOrderDto } from '../dto/create-order.dto';

@Controller('orders')
export class OrderController {
  constructor(
    private readonly createOrder: CreateOrderUseCase,
    private readonly getOrder: GetOrderUseCase,
    private readonly presenter: OrderPresenter,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: unknown) {
    // 1. Validate input
    const dto = CreateOrderDto.from(body);

    // 2. Execute use case
    const order = await this.createOrder.execute({
      userId: dto.userId,
      items: dto.items,
    });

    // 3. Format response
    return this.presenter.toResponse(order);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    // 1. Validate param
    if (!id) {
      throw new BadRequestException('Order ID required');
    }

    // 2. Execute use case
    const order = await this.getOrder.execute({ orderId: id });

    // 3. Format response
    return this.presenter.toResponse(order);
  }
}
```

### Example 2: GraphQL Resolver

```typescript
// apps/graphql-api/src/resolvers/user.resolver.ts
import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { CreateUserUseCase, GetUserUseCase } from '@my-app/users-application';
import { UserPresenter } from '../presenters/user.presenter';

@Resolver('User')
export class UserResolver {
  constructor(
    private readonly createUser: CreateUserUseCase,
    private readonly getUser: GetUserUseCase,
    private readonly presenter: UserPresenter,
  ) {}

  @Query()
  async user(@Args('id') id: string) {
    const user = await this.getUser.execute({ id });
    return this.presenter.toGraphQL(user);
  }

  @Mutation()
  async createUser(@Args('email') email: string, @Args('name') name: string) {
    const user = await this.createUser.execute({ email, name });
    return this.presenter.toGraphQL(user);
  }
}
```

### Example 3: Next.js App Router with Server Actions

```typescript
// apps/web/src/app/users/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { createContainer } from '@/di/container';
import { CreateUserUseCase } from '@my-app/users-application';

export async function createUser(formData: FormData) {
  const container = createContainer();
  const useCase = container.get<CreateUserUseCase>('CreateUserUseCase');

  const email = formData.get('email') as string;
  const name = formData.get('name') as string;

  try {
    const user = await useCase.execute({ email, name });
    revalidatePath('/users');
    return { success: true, userId: user.id.value };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

```typescript
// apps/web/src/app/users/page.tsx
import { createUser } from "./actions";

export default function UsersPage() {
    return (
        <form action={createUser}>
            <input type="email" name="email" required />
            <input type="text" name="name" required />
            <button type="submit">Create User</button>
        </form>
    );
}
```

### Example 4: CLI with Dependency Injection

```typescript
// apps/cli/src/di/container.ts
import { Container } from 'inversify';
import { CreateUserUseCase } from '@my-app/users-application';
import { PostgresUserRepository } from '@my-app/users-infrastructure';

export function createContainer(): Container {
  const container = new Container();

  // Infrastructure
  container.bind('UserRepository').to(PostgresUserRepository);

  // Application
  container.bind(CreateUserUseCase).toSelf();

  return container;
}
```

```typescript
// apps/cli/src/commands/user.commands.ts
import { Command } from 'commander';
import { createContainer } from '../di/container';

export function registerUserCommands(program: Command) {
  const container = createContainer();

  program
    .command('user:create')
    .option('-e, --email <email>')
    .option('-n, --name <name>')
    .action(async (options) => {
      const useCase = container.get(CreateUserUseCase);
      const user = await useCase.execute(options);
      console.log(`Created user: ${user.id.value}`);
    });
}
```

## ✅ Checklist

### Before Creating a New App:

- [ ] Use generator: `just ai-scaffold name=@nx/next:app` (or appropriate generator)
- [ ] Understand app type (web, API, CLI, mobile)
- [ ] Plan dependency injection strategy
- [ ] Identify required use cases from application layer
- [ ] Design controller/presenter structure
- [ ] Plan DTO validation strategy

### While Building App:

- [ ] Follow hexagonal architecture principles
- [ ] Keep controllers thin (delegate to use cases)
- [ ] Use DTOs for input validation
- [ ] Use presenters for output formatting
- [ ] Set up dependency injection properly
- [ ] Handle errors gracefully
- [ ] Add traceability comments (spec IDs)

### After Building App:

- [ ] Write e2e tests
- [ ] Write integration tests for controllers
- [ ] Document API endpoints (OpenAPI/Swagger)
- [ ] Configure for deployment
- [ ] Add health check endpoint
- [ ] Set up monitoring/observability
- [ ] Update README with setup instructions

## 🔍 Quick Reference

### Common Commands

```bash
# Generate new app
just ai-scaffold name=@nx/next:app
pnpm exec nx g @nx/next:app my-app

# Generate API app
pnpm exec nx g @nx/nest:app my-api

# Generate CLI app
pnpm exec nx g @nx/node:app my-cli

# Serve app locally
pnpm exec nx serve my-app

# Build app
pnpm exec nx build my-app

# Run app
pnpm exec nx run my-app:serve

# Test app (e2e)
pnpm exec nx e2e my-app-e2e
```

### Nx Configuration (project.json)

```json
{
  "name": "my-app",
  "targets": {
    "build": {
      "executor": "@nx/next:build",
      "options": {
        "outputPath": "dist/apps/my-app"
      }
    },
    "serve": {
      "executor": "@nx/next:server",
      "options": {
        "port": 3000
      }
    },
    "test": {
      "executor": "@nx/jest:jest"
    }
  },
  "tags": ["type:app", "scope:users"]
}
```

### Key Concepts

- **Interface Layer**: Outermost layer of hexagonal architecture
- **Controller**: Handles HTTP/CLI input, delegates to use cases
- **Presenter**: Formats domain objects for output
- **DTO**: Data Transfer Object for input validation
- **Dependency Injection**: Wire use cases and infrastructure
- **Port**: Interface that app depends on (use cases)
- **Adapter**: Implementation of port (controller is adapter)

## 🛡️ Security Considerations

**CRITICAL for applications:**

- ⚠️ **Validate ALL input**: Never trust user input
- ⚠️ **Sanitize output**: Prevent XSS attacks
- ⚠️ **Authentication/Authorization**: Verify user identity and permissions
- ⚠️ **Rate limiting**: Prevent abuse and DoS
- ⚠️ **CORS configuration**: Restrict allowed origins
- ⚠️ **Secure headers**: CSP, HSTS, X-Frame-Options
- ⚠️ **Error handling**: Don't leak sensitive info in errors
- ⚠️ **Input size limits**: Prevent payload attacks
- ⚠️ **SQL injection**: Use parameterized queries (in infrastructure)
- ⚠️ **CSRF protection**: Use tokens for state-changing operations

**Example secure controller:**

```typescript
@Controller('users')
@UseGuards(AuthGuard) // Require authentication
export class UserController {
  constructor(
    private readonly createUser: CreateUserUseCase,
    private readonly rateLimiter: RateLimiter,
  ) {}

  @Post()
  @UseGuards(RateLimitGuard) // Rate limiting
  async create(@Body() body: unknown, @Req() req: Request) {
    // 1. Validate input with strict schema
    const dto = CreateUserDto.from(body); // Throws if invalid

    // 2. Check authorization
    if (!req.user.hasPermission('users:create')) {
      throw new ForbiddenException();
    }

    // 3. Execute use case
    try {
      const user = await this.createUser.execute(dto);
      return this.presenter.toResponse(user); // Only safe data
    } catch (error) {
      // 4. Don't leak sensitive info
      throw new BadRequestException('Failed to create user');
    }
  }
}
```

## 🎯 Integration with Libraries

**Apps depend on libs, never the reverse:**

```
apps/my-app
  ↓ depends on
libs/users/application  (use cases - ports)
  ↓ depends on
libs/users/domain  (business logic)

apps/my-app (wires dependencies)
  ↓ provides
libs/users/infrastructure  (adapters - implementations)
```

**Import from libraries:**

```typescript
// apps/api/src/controllers/user.controller.ts
import { CreateUserUseCase } from '@my-app/users-application'; // Use case
import { User } from '@my-app/users-domain'; // Domain entity
```

**Configure imports in tsconfig.json:**

```json
{
  "compilerOptions": {
    "paths": {
      "@my-app/users-application": ["libs/users/application/src/index.ts"],
      "@my-app/users-domain": ["libs/users/domain/src/index.ts"]
    }
  }
}
```

## 🔄 Maintenance

### Regular Tasks

- **Weekly**: Review controller logic, extract to use cases if needed
- **Monthly**: Audit dependency injection configuration
- **Quarterly**: Review API design, plan versioning strategy
- **Per release**: Update API documentation, test deployments

### When to Update This AGENT.md

- New application type added (e.g., gRPC, WebSocket)
- Dependency injection patterns change
- New security requirements emerge
- Framework versions update significantly
- Architectural patterns evolve

---

_Last updated: 2025-10-13 | Maintained by: VibesPro Project Team_
_Parent context: [copilot-instructions.md](/.github/copilot-instructions.md) | Navigation: [AGENT-MAP.md](/AGENT-MAP.md)_
