# tests/ Agent Instructions

## 📍 Context

> **Purpose**: Testing Infrastructure - Unit, integration, and shell tests with TDD workflow support.
> **When to use**: When writing tests, debugging test failures, following TDD workflow, or setting up test infrastructure.

## 🔗 Parent Context

See [root copilot-instructions.md](/.github/copilot-instructions.md) for comprehensive project guidance and [AGENT-MAP.md](/AGENT-MAP.md) for navigation across contexts.

## 🎯 Local Scope

**This directory handles:**

- Unit tests (Node.js/TypeScript, Python)
- Integration tests (full workflow testing)
- Shell tests (ShellSpec for scripts)
- Test fixtures and utilities
- TDD workflow support
- Test coverage and reporting
- Performance benchmarks

**Architecture Layer**: N/A (Quality Assurance/Testing)

## 📁 Key Files & Patterns

### Directory Structure

```
tests/
├── unit/                       # Unit tests
│   ├── tools/                  # Tool unit tests
│   │   └── *.test.ts
│   ├── libs/                   # Library unit tests
│   │   └── *.test.ts
│   └── test_*.py              # Python unit tests
├── integration/                # Integration tests
│   ├── template-smoke.test.ts  # Template generation
│   ├── generated-ci-regression.test.ts
│   └── workflow-*.test.ts
├── shell/                      # ShellSpec tests
│   └── scripts/
│       ├── run_prompt_spec.sh
│       ├── measure_tokens_spec.sh
│       └── doctor_spec.sh
├── fixtures/                   # Test fixtures and data
│   ├── prompts/
│   ├── configs/
│   └── templates/
├── helpers/                    # Test utilities
│   ├── test_helpers.ts
│   └── test_fixtures.py
└── .tmp-tests/                 # Temporary test files (gitignored)
```

### File Naming Conventions

| Test Type       | Pattern                  | Location             | Example                   |
| --------------- | ------------------------ | -------------------- | ------------------------- |
| **Node Unit**   | `*.test.ts`, `*.test.js` | `tests/unit/**`      | `context-manager.test.ts` |
| **Python Unit** | `test_*.py`              | `tests/unit/**`      | `test_spec_parser.py`     |
| **Integration** | `*.test.ts`              | `tests/integration/` | `template-smoke.test.ts`  |
| **Shell Spec**  | `*_spec.sh`              | `tests/shell/`       | `run_prompt_spec.sh`      |
| **Fixtures**    | Various                  | `tests/fixtures/`    | `valid_config.json`       |

### Test Organization by Layer

| Layer              | Test Location                           | Focus                                |
| ------------------ | --------------------------------------- | ------------------------------------ |
| **Domain**         | `tests/unit/libs/{domain}/domain/`      | Pure business logic, no dependencies |
| **Application**    | `tests/unit/libs/{domain}/application/` | Use cases, mock ports                |
| **Infrastructure** | `tests/integration/`                    | Repository implementations, adapters |
| **Interface**      | `tests/integration/`                    | Controllers, CLI, API endpoints      |

## 🧭 Routing Rules

### Use This Context When:

- [ ] Writing unit, integration, or shell tests
- [ ] Following TDD workflow (Red-Green-Refactor)
- [ ] Debugging test failures
- [ ] Setting up test fixtures or utilities
- [ ] Configuring test runners or coverage
- [ ] Writing performance benchmarks
- [ ] Creating test harnesses

### Refer to Other Contexts When:

| Context                               | When to Use                                             |
| ------------------------------------- | ------------------------------------------------------- |
| [.github/AGENT.md](/.github/AGENT.md) | Using TDD chat modes or workflows                       |
| [libs/AGENT.md](/libs/AGENT.md)       | Testing business logic following hexagonal architecture |
| [apps/AGENT.md](/apps/AGENT.md)       | Testing application interfaces                          |
| [tools/AGENT.md](/tools/AGENT.md)     | Testing development tools                               |
| [scripts/AGENT.md](/scripts/AGENT.md) | Writing ShellSpec tests for scripts                     |
| [docs/AGENT.md](/docs/AGENT.md)       | Tracing tests to specifications                         |

## 🔧 Local Conventions

### Testing Philosophy

**Match testing approach to code complexity:**

| Scenario                    | Approach                            | Rationale                           |
| --------------------------- | ----------------------------------- | ----------------------------------- |
| **Complex business logic**  | **TDD (Test-First)**                | High confidence, clear requirements |
| **Simple CRUD operations**  | **Code-First, Then Tests**          | Avoid over-engineering              |
| **Hot paths / Performance** | **Benchmarks after implementation** | Measure before optimizing           |
| **Security-sensitive code** | **TDD + Security Review**           | Zero tolerance for vulnerabilities  |

### TDD Workflow (Red-Green-Refactor)

**Red Phase** (Write Failing Test):

```typescript
// tests/unit/libs/auth/domain/user.test.ts
import { describe, it } from "node:test";
import assert from "node:assert";
import { User } from "../../../../libs/auth/domain/user";

describe("User", () => {
  it("should validate email format", () => {
    // Arrange
    const invalidEmail = "not-an-email";

    // Act & Assert
    assert.throws(
      () => new User({ email: invalidEmail }),
      /Invalid email format/,
    );
  });
});
```

**Green Phase** (Make It Pass):

```typescript
// libs/auth/domain/user.ts
export class User {
  constructor(private readonly email: string) {
    if (!this.isValidEmail(email)) {
      throw new Error("Invalid email format");
    }
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
```

**Refactor Phase** (Improve):

```typescript
// Extract email validation to value object
export class Email {
  private constructor(private readonly value: string) {}

  static create(email: string): Email {
    if (!Email.isValid(email)) {
      throw new Error("Invalid email format");
    }
    return new Email(email);
  }

  private static isValid(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
```

### Unit Test Standards

#### TypeScript/JavaScript (Jest/Node)

**Use `node:assert` for simple tests:**

```typescript
import { describe, it } from "node:test";
import assert from "node:assert";

describe("ContextManager", () => {
  it("should bundle context files", () => {
    // Arrange
    const manager = new ContextManager("/path/to/root");

    // Act
    const result = manager.bundleContext("/output");

    // Assert
    assert.ok(result.files.size > 0);
    assert.strictEqual(typeof result.metadata.totalTokens, "number");
  });
});
```

**Use Jest for complex scenarios:**

```typescript
import { jest } from "@jest/globals";

describe("AuthService", () => {
  it("should call repository when authenticating", async () => {
    // Arrange
    const mockRepo = {
      findByEmail: jest.fn().mockResolvedValue(mockUser),
    };
    const service = new AuthService(mockRepo);

    // Act
    await service.authenticate("user@example.com", "password");

    // Assert
    expect(mockRepo.findByEmail).toHaveBeenCalledWith("user@example.com");
  });
});
```

#### Python (pytest)

```python
# tests/unit/test_spec_parser.py
import pytest
from pathlib import Path
from tools.spec.spec_parser import SpecParser

def test_parse_valid_spec():
    """Test parsing a valid spec file."""
    # Arrange
    spec_file = Path('tests/fixtures/specs/valid_spec.md')
    parser = SpecParser()

    # Act
    result = parser.parse(spec_file)

    # Assert
    assert result is not None
    assert result.spec_id == 'DEV-PRD-001'
    assert len(result.requirements) > 0

def test_parse_invalid_spec_raises_error():
    """Test that invalid spec raises appropriate error."""
    # Arrange
    spec_file = Path('tests/fixtures/specs/invalid_spec.md')
    parser = SpecParser()

    # Act & Assert
    with pytest.raises(ValueError, match='Invalid spec format'):
        parser.parse(spec_file)

@pytest.fixture
def sample_spec():
    """Fixture providing a sample spec for testing."""
    return {
        'spec_id': 'DEV-PRD-001',
        'title': 'User Authentication',
        'requirements': ['REQ-1', 'REQ-2'],
    }
```

### Integration Test Standards

**Test full workflows:**

```typescript
// tests/integration/template-smoke.test.ts
import { describe, it } from "node:test";
import assert from "node:assert";
import { execSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

describe("Template Generation", () => {
  it("should generate project from template", () => {
    // Arrange
    const tempDir = mkdtempSync(join(tmpdir(), "test-"));

    try {
      // Act
      execSync("pnpm generate", {
        cwd: tempDir,
        env: {
          ...process.env,
          CI: "true",
        },
      });

      // Assert
      const packageJson = join(tempDir, "package.json");
      assert.ok(existsSync(packageJson));
    } finally {
      // Cleanup
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
```

### Shell Test Standards (ShellSpec)

**Mirror script structure:**

```bash
# tests/shell/scripts/run_prompt_spec.sh
Describe 'run_prompt.sh'
  Include scripts/run_prompt.sh

  setup() {
    export TEST_DIR=$(mktemp -d)
  }

  cleanup() {
    rm -rf "$TEST_DIR"
  }

  BeforeEach 'setup'
  AfterEach 'cleanup'

  It 'shows usage when no args provided'
    When run script scripts/run_prompt.sh
    The status should be failure
    The stderr should include 'Usage'
  End

  It 'executes prompt file successfully'
    prompt_file='.github/prompts/test.prompt.md'
    When run script scripts/run_prompt.sh "$prompt_file"
    The status should be success
    The output should include 'tokens'
  End

  It 'handles missing file gracefully'
    When run script scripts/run_prompt.sh "$TEST_DIR/nonexistent.md"
    The status should be failure
    The stderr should include 'not found'
  End
End
```

### Test Isolation & Cleanup

**Always clean up after tests:**

```typescript
// Use .tmp-tests/ for temporary files
const testDir = ".tmp-tests";

beforeEach(() => {
  mkdirSync(testDir, { recursive: true });
});

afterEach(() => {
  rmSync(testDir, { recursive: true, force: true });
});
```

**Mock external dependencies:**

```typescript
// Mock file system
jest.mock("node:fs", () => ({
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

// Mock HTTP requests
jest.mock("node:http", () => ({
  request: jest.fn(),
}));
```

### Test Coverage Requirements

**Coverage targets:**

- **Domain logic**: 100% coverage (no exceptions)
- **Application layer**: 90%+ coverage
- **Infrastructure**: 80%+ coverage (mock external systems)
- **Interface**: 70%+ coverage (integration tests)

**Generate coverage reports:**

```bash
# Node/TypeScript
pnpm test:jest:coverage

# Python
pytest --cov=tools --cov=libs --cov-report=html

# View reports
open coverage/index.html
open htmlcov/index.html
```

## 📚 Related Instructions

**Modular instructions that apply here:**

- [.github/instructions/testing.instructions.md](/.github/instructions/testing.instructions.md) - Testing strategies
- [.github/instructions/security.instructions.md](/.github/instructions/security.instructions.md) - Security testing
- [.github/instructions/ai-workflows.instructions.md](/.github/instructions/ai-workflows.instructions.md) - TDD workflows

**Relevant prompts:**

- [.github/prompts/tdd.workflow.prompt.md](/.github/prompts/tdd.workflow.prompt.md) - TDD guidance
- [.github/prompts/test-hardening.prompt.md](/.github/prompts/test-hardening.prompt.md) - Test hardening

**Related chat modes:**

- `tdd.red` - Write failing tests
- `tdd.green` - Make tests pass
- `tdd.refactor` - Improve code quality
- `persona.qa` - Testing strategies

## 💡 Examples

### Example 1: Domain Layer Unit Test (Hexagonal Architecture)

```typescript
// tests/unit/libs/orders/domain/order.test.ts
import { describe, it } from "node:test";
import assert from "node:assert";
import { Order, OrderStatus } from "../../../../libs/orders/domain/order";
import { OrderId } from "../../../../libs/orders/domain/order-id";

describe("Order (Domain)", () => {
  it("should create order with pending status", () => {
    // Arrange
    const orderId = OrderId.create();
    const items = [{ productId: "1", quantity: 2 }];

    // Act
    const order = Order.create(orderId, items);

    // Assert
    assert.strictEqual(order.status, OrderStatus.Pending);
    assert.strictEqual(order.items.length, 2);
  });

  it("should not allow negative quantities", () => {
    // Arrange
    const orderId = OrderId.create();
    const items = [{ productId: "1", quantity: -1 }];

    // Act & Assert
    assert.throws(
      () => Order.create(orderId, items),
      /Quantity must be positive/,
    );
  });

  it("should transition from pending to confirmed", () => {
    // Arrange
    const order = Order.create(OrderId.create(), []);

    // Act
    order.confirm();

    // Assert
    assert.strictEqual(order.status, OrderStatus.Confirmed);
  });

  it("should not allow confirming cancelled order", () => {
    // Arrange
    const order = Order.create(OrderId.create(), []);
    order.cancel();

    // Act & Assert
    assert.throws(() => order.confirm(), /Cannot confirm cancelled order/);
  });
});
```

### Example 2: Application Layer Unit Test with Mocks

```typescript
// tests/unit/libs/orders/application/create-order.test.ts
import { describe, it, beforeEach } from "node:test";
import assert from "node:assert";
import { CreateOrderUseCase } from "../../../../libs/orders/application/create-order";

describe("CreateOrderUseCase", () => {
  let useCase: CreateOrderUseCase;
  let mockOrderRepo: any;
  let mockProductRepo: any;

  beforeEach(() => {
    // Mock repositories (ports)
    mockOrderRepo = {
      save: (order: any) => Promise.resolve(order),
      findById: (id: any) => Promise.resolve(null),
    };

    mockProductRepo = {
      findById: (id: string) =>
        Promise.resolve({
          id,
          name: "Product",
          price: 100,
        }),
    };

    useCase = new CreateOrderUseCase(mockOrderRepo, mockProductRepo);
  });

  it("should create order successfully", async () => {
    // Arrange
    const input = {
      userId: "user-1",
      items: [{ productId: "prod-1", quantity: 2 }],
    };

    // Act
    const result = await useCase.execute(input);

    // Assert
    assert.ok(result.orderId);
    assert.strictEqual(result.status, "pending");
  });

  it("should throw when product not found", async () => {
    // Arrange
    mockProductRepo.findById = () => Promise.resolve(null);
    const input = {
      userId: "user-1",
      items: [{ productId: "invalid", quantity: 2 }],
    };

    // Act & Assert
    await assert.rejects(
      async () => await useCase.execute(input),
      /Product not found/,
    );
  });
});
```

### Example 3: Integration Test with Database

```typescript
// tests/integration/order-repository.test.ts
import { describe, it, beforeAll, afterAll } from "node:test";
import assert from "node:assert";
import { PostgresOrderRepository } from "../../libs/orders/infrastructure/postgres-order-repository";
import { Order } from "../../libs/orders/domain/order";
import { setupTestDatabase, teardownTestDatabase } from "../helpers/db";

describe("PostgresOrderRepository (Integration)", () => {
  let repository: PostgresOrderRepository;
  let db: any;

  beforeAll(async () => {
    db = await setupTestDatabase();
    repository = new PostgresOrderRepository(db);
  });

  afterAll(async () => {
    await teardownTestDatabase(db);
  });

  it("should save and retrieve order", async () => {
    // Arrange
    const order = Order.create(/* ... */);

    // Act
    await repository.save(order);
    const retrieved = await repository.findById(order.id);

    // Assert
    assert.ok(retrieved);
    assert.strictEqual(retrieved.id.value, order.id.value);
  });
});
```

### Example 4: Python Test with Fixtures

```python
# tests/unit/test_token_counter.py
import pytest
from pathlib import Path
from tools.ai.token_counter import TokenCounter

@pytest.fixture
def token_counter():
    """Fixture providing a TokenCounter instance."""
    return TokenCounter(model='gpt-4')

@pytest.fixture
def sample_text():
    """Fixture providing sample text."""
    return "Hello, world! This is a test."

def test_count_tokens(token_counter, sample_text):
    """Test basic token counting."""
    # Act
    count = token_counter.count(sample_text)

    # Assert
    assert isinstance(count, int)
    assert count > 0

def test_count_tokens_empty_string(token_counter):
    """Test counting empty string returns zero."""
    # Act
    count = token_counter.count("")

    # Assert
    assert count == 0

@pytest.mark.parametrize("text,expected_min", [
    ("Hello", 1),
    ("Hello world", 2),
    ("The quick brown fox jumps", 5),
])
def test_count_tokens_parametrized(token_counter, text, expected_min):
    """Test token counting with various inputs."""
    # Act
    count = token_counter.count(text)

    # Assert
    assert count >= expected_min
```

## ✅ Checklist

### Before Writing Tests:

- [ ] Understand the specification (spec IDs)
- [ ] Determine test type (unit, integration, shell)
- [ ] Choose testing approach (TDD vs code-first)
- [ ] Plan test cases (happy path + edge cases)
- [ ] Set up fixtures and test data
- [ ] Consider dependencies to mock

### While Writing Tests:

- [ ] Follow Arrange-Act-Assert pattern
- [ ] Use descriptive test names (behavior, not implementation)
- [ ] Test one behavior per test case
- [ ] Include edge cases and error conditions
- [ ] Mock external dependencies
- [ ] Clean up resources in teardown

### After Writing Tests:

- [ ] Run tests: `just test` or `pnpm test`
- [ ] Check coverage: `pnpm test:jest:coverage`
- [ ] Verify all tests pass
- [ ] Run linters: `just ai-validate`
- [ ] Update traceability matrix with spec IDs
- [ ] Document complex test scenarios

### TDD Cycle Checklist:

**Red Phase:**

- [ ] Write failing test for next requirement
- [ ] Run test to confirm it fails
- [ ] Verify failure message is meaningful

**Green Phase:**

- [ ] Write minimal code to pass test
- [ ] Run test to confirm it passes
- [ ] Don't add extra functionality

**Refactor Phase:**

- [ ] Improve code quality
- [ ] Remove duplication
- [ ] Ensure tests still pass
- [ ] Consider extracting patterns

## 🔍 Quick Reference

### Common Commands

```bash
# Run all tests
just test

# Run unit tests only
just test-unit
pnpm test:unit
pytest tests/unit/

# Run integration tests
just test-integration
pnpm test:integration

# Run shell tests
shellspec
shellspec tests/shell/scripts/specific_spec.sh

# Run with coverage
pnpm test:jest:coverage
pytest --cov=. --cov-report=html

# Run specific test file
pnpm test context-manager.test.ts
pytest tests/unit/test_spec_parser.py

# Run in watch mode (TDD)
pnpm test:watch

# Run Rust tests
cargo test --manifest-path temporal_db/Cargo.toml
```

### Test Runner Configuration

**Jest** (`jest.config.json`):

```json
{
  "preset": "ts-jest",
  "testEnvironment": "node",
  "testMatch": ["**/*.test.ts", "**/*.test.js"],
  "collectCoverageFrom": ["libs/**/*.ts", "tools/**/*.ts"],
  "coverageThreshold": {
    "global": {
      "branches": 80,
      "functions": 80,
      "lines": 80,
      "statements": 80
    }
  }
}
```

**pytest** (`pytest.ini`):

```ini
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = -v --strict-markers
markers =
    unit: Unit tests
    integration: Integration tests
    slow: Slow running tests
```

**ShellSpec** (`.shellspec`):

```
--shell bash
--pattern '*_spec.sh'
--require spec_helper
```

### Key Concepts

- **TDD**: Test-Driven Development (Red-Green-Refactor)
- **AAA**: Arrange-Act-Assert pattern
- **Mocking**: Replace dependencies with test doubles
- **Fixtures**: Reusable test data setup
- **Coverage**: Percentage of code executed by tests
- **Integration**: Test multiple components together
- **Isolation**: Tests don't affect each other

### Test Types by Scope

| Type            | Scope                 | Speed  | Dependencies     |
| --------------- | --------------------- | ------ | ---------------- |
| **Unit**        | Single function/class | Fast   | Mocked           |
| **Integration** | Multiple components   | Medium | Real (when safe) |
| **End-to-End**  | Full system           | Slow   | Real             |
| **Shell**       | Script behavior       | Fast   | Isolated         |

## 🛡️ Security Considerations

**Security testing priorities:**

- ⚠️ **Test input validation**: Verify all inputs are validated
- ⚠️ **Test authentication/authorization**: Verify access controls work
- ⚠️ **Test injection vulnerabilities**: SQL, command, XSS
- ⚠️ **Test secret handling**: Verify secrets aren't leaked
- ⚠️ **Test error messages**: Don't expose sensitive info
- ⚠️ **Security regression tests**: Add test for each security fix

**Example security test:**

```typescript
describe("UserController (Security)", () => {
  it("should not expose password in error messages", async () => {
    // Arrange
    const invalidCredentials = { email: "user@test.com", password: "wrong" };

    // Act
    const error = await controller.login(invalidCredentials).catch((e) => e);

    // Assert
    assert.ok(!error.message.includes("wrong")); // Password not in error
    assert.strictEqual(error.message, "Invalid credentials");
  });

  it("should prevent SQL injection in email field", async () => {
    // Arrange
    const maliciousEmail = "'; DROP TABLE users; --";

    // Act & Assert
    await assert.rejects(
      async () => await controller.findByEmail(maliciousEmail),
      /Invalid email format/,
    );
  });
});
```

## 🎯 Integration with Workflows

### TDD Chat Mode Integration

**Use chat modes for TDD phases:**

1. **tdd.red**: Write failing test

   ```bash
   # Activate tdd.red chat mode
   # Describe feature → AI generates failing test
   ```

2. **tdd.green**: Implement minimal solution

   ```bash
   # Activate tdd.green chat mode
   # AI implements just enough to pass test
   ```

3. **tdd.refactor**: Improve code
   ```bash
   # Activate tdd.refactor chat mode
   # AI refactors while keeping tests green
   ```

### Spec-Driven Testing

**Link tests to specifications:**

```typescript
// DEV-PRD-042, DEV-SDS-015: User authentication
describe("AuthService", () => {
  // DEV-PRD-042: Must support OAuth2
  it("should authenticate via OAuth2", () => {
    // Test implementation
  });

  // DEV-SDS-015: Must validate email format
  it("should reject invalid email formats", () => {
    // Test implementation
  });
});
```

### CI/CD Integration

Tests run automatically in CI:

```yaml
# .github/workflows/test.yml
- name: Run unit tests
  run: pnpm test:unit

- name: Run integration tests
  run: pnpm test:integration

- name: Run shell tests
  run: shellspec

- name: Upload coverage
  uses: codecov/codecov-action@v3
```

## 📊 Testing Strategy by Architecture Layer

### Domain Layer Testing

- **Pure unit tests** - No mocks needed
- **100% coverage** - No exceptions
- **Focus**: Business rules, invariants, value objects
- **No dependencies**: Test in isolation

### Application Layer Testing

- **Unit tests with mocks** - Mock repositories (ports)
- **90%+ coverage**
- **Focus**: Use case orchestration, validation
- **Mock all ports**: Repository, external services

### Infrastructure Layer Testing

- **Integration tests** - Use real dependencies when safe
- **80%+ coverage**
- **Focus**: Repository implementations, adapters
- **Test databases**: Use test containers or in-memory

### Interface Layer Testing

- **Integration tests** - Test full request/response
- **70%+ coverage**
- **Focus**: Controllers, CLI, API endpoints
- **Use test clients**: Supertest, httptest

## 🔄 Maintenance

### Regular Tasks

- **Daily**: Run tests during development (watch mode)
- **Weekly**: Review coverage reports, address gaps
- **Monthly**: Refactor test code, reduce duplication
- **Quarterly**: Audit test strategy, update patterns
- **Per PR**: All tests must pass, coverage maintained

### When to Update This AGENT.md

- New test types or patterns emerge
- Testing tools or frameworks change
- Coverage requirements adjusted
- TDD workflow evolves
- Integration with new systems

### Managing Test Debt

**Signs of test debt:**

- Flaky tests (intermittent failures)
- Slow test suite
- Low coverage in critical areas
- Brittle tests (break on refactor)
- Duplicate test logic

**Remediation:**

- Stabilize flaky tests or remove
- Parallelize slow tests
- Add tests for uncovered critical paths
- Refactor brittle tests to test behavior
- Extract test utilities/fixtures

---

_Last updated: 2025-10-13 | Maintained by: VibesPro Project Team_
_Parent context: [copilot-instructions.md](/.github/copilot-instructions.md) | Navigation: [AGENT-MAP.md](/AGENT-MAP.md)_
