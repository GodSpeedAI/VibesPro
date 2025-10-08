# Repository-Wide Copilot Instructions

> **Purpose**: Provide comprehensive, context-aware guidance to GitHub Copilot and VS Code AI chat features for optimal effectiveness in this project.

---

## 🎯 Project Overview

**{{ project_name }}** is a [CUSTOMIZE: project type - web app, API, mobile app, etc.] that [CUSTOMIZE: brief description of what the project does].

The project combines:

- [CUSTOMIZE: Key technology or framework - e.g., "React + TypeScript + Next.js"]
- [CUSTOMIZE: Architecture pattern - e.g., "Hexagonal Architecture (Ports & Adapters)"]
- [CUSTOMIZE: Special features - e.g., "Real-time collaboration", "AI-powered features"]
- **Generator-First Development** with Nx monorepo tooling
- **AI-Enhanced Workflows** via GitHub Copilot integration

### Primary Goal

[CUSTOMIZE: What is the main objective of this project?]

### Domain Context

[CUSTOMIZE: What business domain is this? What problem does it solve? Key terminology?]

> **💡 Tip:** Run `.github/prompts/customize.copilot-instructions.prompt.md` or use the `meta.customize-instructions` chat mode to interactively customize these instructions for your project.

---

## 🎯 Core Principles (HIGHEST PRIORITY)

### 1. Generator-First Requirement ⚡

**Before writing any new code, ALWAYS check if an Nx generator exists to scaffold it.**

```bash
# List available generators
pnpm exec nx list

# Use generator via just recipe (recommended)
just ai-scaffold name=<generator>
```

**See `.github/instructions/generators-first.instructions.md` for complete workflow.**

- ✅ Use generators for: components, libraries, applications, services
- ✅ Only write custom code after confirming no appropriate generator exists
- ✅ Generators ensure: consistent structure, proper Nx configuration, correct dependencies
- 📚 Reference: `docs/nx-generators-guide.md` for all available generators

### 2. Security First 🔒

**NEVER modify VS Code configuration files without explicit user confirmation:**

- `.vscode/settings.json`
- `.vscode/tasks.json`
- **Rationale**: Malicious changes can enable auto-approval (`chat.tools.autoApprove`) → Remote Code Execution

**Always:**

- ✅ Sanitize and validate ALL user inputs
- ✅ Use prepared statements for SQL queries
- ✅ Respect VS Code workspace trust boundaries
- ✅ Never hardcode secrets (use environment variables)
- ✅ Follow current cryptographic standards

[CUSTOMIZE: Add compliance requirements if applicable - HIPAA, SOC2, PCI-DSS, GDPR]

---

## 🏗️ Architecture & Structure

### High-Level Architecture

[CUSTOMIZE: Describe your architecture - hexagonal, layered, microservices, etc.]

**Example for Hexagonal Architecture:**
This project follows **Hexagonal Architecture** (Ports & Adapters) with clear separation of concerns:

1. **Domain Layer** - Pure business logic, entities, value objects
2. **Application Layer** - Use cases, application services, ports (interfaces)
3. **Infrastructure Layer** - Repository implementations, external adapters
4. **Interface Layer** - Controllers, CLI, GraphQL resolvers

### Key Directory Structure

```
[CUSTOMIZE: Your actual directory structure]

Example:
.github/              # AI development system
├── copilot-instructions.md
├── instructions/     # Modular instruction files
├── prompts/          # Task-specific prompts
└── chatmodes/        # Specialized AI personas

apps/                 # Application interfaces
libs/                 # Business logic libraries
├── {domain}/
│   ├── domain/       # Pure business logic
│   ├── application/  # Use cases, ports
│   └── infrastructure/ # Adapters

docs/                 # Project documentation
tests/                # Test suites
```

### Core Technology Stack

[CUSTOMIZE: Your actual tech stack]

- **Languages**: [e.g., TypeScript, Python, Go]
- **Frontend**: [e.g., React 18, Next.js 15, Vue 3]
- **Backend**: [e.g., Node.js, FastAPI, NestJS]
- **Database**: [e.g., PostgreSQL, MongoDB, Redis]
- **Monorepo**: Nx workspace
- **Package Manager**: pnpm
- **Testing**: [e.g., Jest, Vitest, Playwright, Cypress]
- **Deployment**: [e.g., Vercel, AWS, Azure, GCP]

---

## 🤝 Development Partnership Model

### How We Work Together

**You (Copilot)** and **I (Developer)** build production code together:

- **Developer**: Guides architecture, catches complexity early, makes decisions
- **Copilot**: Handles implementation details, suggests patterns, validates approaches

### Core Workflow: Research → Plan → Implement → Validate

**Always start every feature with**: _"Let me research the codebase and create a plan before implementing."_

1. **Research** - Understand existing patterns and architecture

   - Use semantic search, grep, and file reads to gather context
   - Identify related specs, ADRs, and existing implementations
   - Check `docs/nx-generators-guide.md` for available generators

2. **Plan** - Propose approach and verify with developer

   - **Step 0**: Check if generator exists for this feature
   - Present 2-3 options when uncertainty exists
   - Reference spec IDs and architectural constraints (if using spec-driven development)
   - Get explicit approval before proceeding

3. **Implement** - Build with tests and error handling

   - Use generator first (if available)
   - Follow established patterns from codebase
   - Match testing approach to code complexity
   - Include clear comments explaining business logic

4. **Validate** - ALWAYS run formatters, linters, and tests
   - Execute `just ai-validate` (if available)
   - Check for errors with get_errors tool
   - Run relevant test suites
   - Verify no security vulnerabilities introduced

---

## 📋 Coding Standards & Conventions

### General Principles

- **Prioritize maintainability over cleverness**: Clear, explicit code beats clever abstractions
- **Composition over inheritance**: Favor small, testable functions and modules
- **Explicit over implicit**: Clear function names, obvious data flow, direct dependencies
- **Small, focused functions**: If you need comments to explain sections, split into separate functions
- **Many small files over few large ones**: Group related functionality into clear packages

[CUSTOMIZE: Add project-specific principles]

### Type Safety (CRITICAL)

[CUSTOMIZE based on language]

**TypeScript:**

- ✅ Strict mode enabled: `strict: true` in tsconfig.json
- ❌ No `any` types: Use `unknown` and type guards instead
- ✅ 100% type coverage: All public APIs must be fully typed
- ✅ Prefer interfaces over types for object shapes

**Python:**

- ✅ mypy strict mode: 100% type coverage required
- ✅ Type all function signatures: Args, returns, and raises
- ✅ Use `typing` module: Generic types, Protocol, TypedDict

### File Naming Patterns

[CUSTOMIZE: Your naming conventions]

| File Type  | Pattern                   | Location       | Example                |
| ---------- | ------------------------- | -------------- | ---------------------- |
| Components | `*.tsx` / `*.jsx`         | `libs/ui/`     | `Button.tsx`           |
| Tests      | `*.test.ts` / `*.spec.ts` | `tests/`       | `user-service.test.ts` |
| Utilities  | `*.util.ts`               | `libs/shared/` | `date.util.ts`         |
| Types      | `*.types.ts`              | `libs/types/`  | `user.types.ts`        |

### Code Organization Patterns

[CUSTOMIZE: Your organization style - hexagonal, feature-sliced, layered, etc.]

**Example for Hexagonal Architecture:**

```typescript
// Domain Layer (libs/{domain}/domain/) - Pure business logic
export class User {
  constructor(
    private readonly id: UserId,
    private readonly email: Email,
    private readonly profile: UserProfile
  ) {}

  // Domain methods - no infrastructure dependencies
}

// Application Layer (libs/{domain}/application/) - Use cases
export class CreateUserUseCase {
  constructor(private readonly userRepo: UserRepository) {} // Port

  async execute(input: CreateUserInput): Promise<User> {
    // Orchestrate domain logic
  }
}

// Infrastructure Layer (libs/{domain}/infrastructure/) - Adapters
export class PostgresUserRepository implements UserRepository {
  // Implement port with specific technology
}
```

### Import Conventions

- **Use relative imports** within packages
- **Use workspace aliases** for cross-package imports (e.g., `@myproject/shared`)
- **Keep modules loosely coupled**: Minimize cross-domain dependencies
- **Order imports**: External → Internal → Relative

---

## 🔒 Security Guidelines (HIGHEST PRIORITY)

> **Precedence**: Security guidelines override all other guidelines (performance, style, etc.)

### Critical Security Rules

1. **NEVER modify VS Code configuration files without explicit user confirmation**

   - `.vscode/settings.json`, `.vscode/tasks.json`
   - Rationale: Malicious changes can enable auto-approval → Remote Code Execution

2. **Always sanitize and validate ALL user inputs**

   - Never interpolate untrusted data into shell commands
   - Use prepared statements for SQL queries
   - Validate file paths, URLs, and external data

3. **Respect VS Code workspace trust boundaries**

   - Do not run tasks or execute code in untrusted folders
   - Require user confirmation before executing external commands

4. **Secret Management**

   - NEVER hardcode secrets in code or configuration
   - Use environment variables or secret stores
   - Never commit keys to version control

5. **Cryptographic Standards**

   - Use `crypto/rand` for randomness (not Math.random)
   - Use modern crypto libraries (libsodium, Web Crypto API)
   - Follow current best practices for hashing, encryption

6. **Input Validation**
   - Validate all inputs at boundaries
   - Use type guards and schema validation (Zod, io-ts, Yup)
   - Fail securely with appropriate error messages

[CUSTOMIZE: Add compliance requirements]

**Example - HIPAA Compliance:**

- ✅ Encrypt PHI at rest and in transit
- ✅ Implement audit logging for all PHI access
- ✅ Use role-based access control (RBAC)
- ✅ Regular security assessments

---

## 🧪 Testing Strategy

### Testing Philosophy

[CUSTOMIZE: Your team's testing approach]

**Match testing approach to code complexity:**

| Scenario                         | Approach                   | Rationale                           |
| -------------------------------- | -------------------------- | ----------------------------------- |
| Complex business logic           | **TDD** (Test-First)       | High confidence, clear requirements |
| Simple CRUD operations           | **Code-First, Then Tests** | Avoid over-engineering              |
| Hot paths / Performance-critical | **Add benchmarks**         | Measure before optimizing           |
| Security-sensitive code          | **TDD + Security Review**  | Zero tolerance for vulnerabilities  |

[CUSTOMIZE: Adjust based on your preferences - strict TDD, flexible, integration-focused, etc.]

### Test Types & Organization

[CUSTOMIZE: Your test structure]

**Example:**

#### Unit Tests

- **Location**: `tests/unit/**/*.test.ts`
- **Tools**: Jest, Vitest, or pytest
- **Structure**: Arrange → Act → Assert
- **Isolation**: Mock external dependencies

#### Integration Tests

- **Location**: `tests/integration/**/*.test.ts`
- **Purpose**: Test component integration, API endpoints
- **Tools**: Supertest, Testing Library

#### E2E Tests

- **Location**: `tests/e2e/**/*.spec.ts`
- **Tools**: Playwright, Cypress
- **Purpose**: Critical user flows

### Running Tests

```bash
[CUSTOMIZE: Your test commands]

# Examples:
just test              # Run all tests
just test-unit         # Unit tests only
just test-integration  # Integration tests
just test-e2e          # E2E tests
pnpm test              # Or via pnpm
```

---

## � Build & Deployment

### Development Environment Setup

```bash
[CUSTOMIZE: Your setup commands]

# Example:
git clone <repository-url>
cd {{ project_slug }}
pnpm install           # Install dependencies
just setup             # Additional setup (if available)
pnpm dev               # Start development server
```

### Build Commands

```bash
[CUSTOMIZE: Your build commands]

# Examples:
pnpm build             # Build all applications
pnpm build:app         # Build specific app
just build             # Via justfile orchestration
```

### Key Orchestration Commands

[CUSTOMIZE: If using justfile]

| Command                       | Purpose                           |
| ----------------------------- | --------------------------------- |
| `just dev`                    | Start development servers         |
| `just test`                   | Run all test suites               |
| `just lint`                   | Run linters                       |
| `just ai-validate`            | Lint + typecheck + optional tests |
| `just ai-scaffold name=<gen>` | Run Nx generator                  |

---

## 🤖 AI Workflows & Chat Modes

### Available Chat Modes

[KEEP: These are provided by the template]

#### Development Workflows

- **TDD**: `tdd.red`, `tdd.green`, `tdd.refactor` - Test-Driven Development
- **Debug**: `debug.start`, `debug.repro`, `debug.isolate`, `debug.fix` - Debugging workflows

#### Customization

- **meta.customize-instructions** - Customize these copilot instructions interactively

[CUSTOMIZE: Add project-specific chat modes if you create them]

### Task-Specific Prompts

Key prompts in `.github/prompts/`:

| Prompt                                     | Purpose                      |
| ------------------------------------------ | ---------------------------- |
| `customize.copilot-instructions.prompt.md` | Customize these instructions |
| `tdd.workflow.prompt.md`                   | TDD workflow guidance        |

[CUSTOMIZE: Document additional prompts if you create them]

---

## 📖 Domain Concepts

[CUSTOMIZE: Document your domain-specific concepts, entities, and business rules]

**Example for E-commerce:**

### Key Entities

**Product**

- Represents items for sale
- Has inventory tracking
- Belongs to categories
- Created by vendors

**Order**

- Customer purchase transaction
- Contains line items (products + quantities)
- Has fulfillment workflow: pending → paid → shipped → delivered
- Payment processing integration

**Customer**

- User account with authentication
- Has shipping/billing addresses
- Order history tracking

### Business Rules

1. **Inventory Management**

   - Products can't be oversold
   - Reserve inventory on order creation
   - Release on cancellation/timeout

2. **Pricing**
   - Dynamic pricing based on promotions
   - Tax calculation by location
   - Shipping cost calculation

[CUSTOMIZE: Your domain concepts]

---

## 🎨 Code Quality & Style

### Linting & Formatting

[CUSTOMIZE: Your linting setup]

```bash
# Examples:
pnpm lint              # Run ESLint
pnpm format            # Run Prettier
pnpm typecheck         # TypeScript type checking
```

### Code Review Checklist

Before committing:

- [ ] All tests pass
- [ ] No linting errors
- [ ] Type checking passes
- [ ] Security review (for sensitive changes)
- [ ] Documentation updated
- [ ] No hardcoded secrets

[CUSTOMIZE: Add project-specific checklist items]

---

## 💡 Problem-Solving & Decision-Making

### When Uncertain

- **"Let me research the codebase and create a plan before implementing."**
- **Present options**: "I see approach A (simple) vs B (flexible). Which do you prefer?"
- **Stop and ask**: Developer redirects prevent over-engineering

### When Stuck

- **Gather more context**: Use semantic search, grep, read files
- **Check existing patterns**: Search for similar implementations
- **Consult documentation**: Check `docs/` folder
- **Ask clarifying questions**: Better to ask than assume

---

## 🎯 Quick Reference Card

### When Starting Any Task

1. **Research** - "Let me research the codebase and create a plan"
2. **Check generators** - `pnpm exec nx list` (see `docs/nx-generators-guide.md`)
3. **Find patterns** - Search for similar existing implementations
4. **Plan** - Propose 2-3 options if uncertain
5. **Get approval** - Wait for confirmation

### Before Implementing

- [ ] Check if Nx generator exists for this feature
- [ ] Understand requirements/specs (if applicable)
- [ ] Identify architectural constraints
- [ ] Plan testing strategy
- [ ] Review existing patterns

### After Implementing

- [ ] Write/update tests
- [ ] Run linters and type checking
- [ ] Check for errors
- [ ] Update documentation if needed
- [ ] Security review for sensitive changes

### Red Flags (STOP)

- ❌ Modifying `.vscode/settings.json` or `.vscode/tasks.json` without confirmation
- ❌ Using `any` type in TypeScript
- ❌ Hardcoding secrets or credentials
- ❌ Bypassing input validation
- ❌ Over-engineering simple solutions
- ❌ Ignoring existing patterns

---

## 📚 Additional Resources

### Documentation

- `docs/` - Project documentation
- `docs/nx-generators-guide.md` - Available Nx generators (if exists)
- `.github/instructions/` - Modular instruction files
- `.github/prompts/` - Task-specific prompts

[CUSTOMIZE: Add project-specific resources]

### External References

[CUSTOMIZE: Add links to key libraries, frameworks, or company resources]

---

## 🔄 Customization

**These instructions can be customized for your project!**

Run the customization workflow:

```bash
# Interactive customization
just customize-instructions

# Or use the chat mode
# In VS Code: Open chat, reference meta.customize-instructions chatmode
```

Or edit this file directly to:

- Add domain-specific concepts
- Document your architecture patterns
- Include team conventions
- Add project-specific guidelines

---

## Summary

This project prioritizes:

1. **Generator-First** - Use Nx generators before writing code
2. **Security First** - No compromises on security guidelines
3. **Type Safety** - Strict typing in all languages
4. **Testing Excellence** - Match strategy to complexity
5. **Clear Communication** - Code should be self-documenting

**Always remember**:

- Use generators to scaffold new code
- Security overrides all other concerns
- Simple solutions are usually correct
- Tests match complexity
- Validate after every change

For detailed guidance, consult the modular instruction files in `.github/instructions/`.

---

**💡 Pro Tip:** Keep these instructions updated as your project evolves. Run the customization workflow whenever your architecture, domain, or team practices change significantly.

**Save and generated summaries in the docs/workdocs/ folder for future reference (create it if it doesn't exist).**sitory‑Wide Copilot Instructions

The purpose of these instructions is to provide repository‑specific guidance to GitHub Copilot and VS Code’s AI chat features. These instructions apply to every file in the repository.

- This repository contains a modular AI assistant and related tooling written primarily in TypeScript with a Node.js runtime. When generating code, follow our established coding guidelines, naming conventions, and architectural patterns described in the instruction files under `.github/instructions`.
- Always prioritize security: never write or modify `.vscode/settings.json` or `.vscode/tasks.json` without explicit user confirmation. Avoid setting `chat.tools.autoApprove` in any configuration, as this disables human confirmation and can lead to remote code execution.
- Use composition over inheritance when designing classes. Favor small, testable functions and modules. Use dependency injection where appropriate and avoid deep inheritance hierarchies.
- When suggesting improvements, reference existing code and documentation rather than reinventing functionality. Use relative import paths and keep modules loosely coupled.
- Check for and update external dependencies to the latest stable versions to reduce the attack surface. Do not add packages with known vulnerabilities.
- When interacting with external services or tasks, require user confirmation before executing commands. Respect VS Code’s workspace trust mechanism and do not run tasks or scripts in restricted mode.
- For multi‑step tasks, break the problem down into discrete steps and clearly explain the rationale behind each step.
- Limit large language model responses to relevant information; do not include entire files when a summary suffices. Encourage token efficiency and performance‑conscious design.
- Always follow best practices for code quality, including writing tests, adhering to style guides, and conducting code reviews.
- Do not introduce technical debt and if you notice any, create a plan to address it.

For more detailed guidelines, see the individual instruction files in `.github/instructions`.

## Spec-driven workflow and ordering

- Prefer architectural and interface constraints first: ADR → SDS/Technical Specs → PRD → DEV-\* specs (DEV-PRD/DEV-ADR/DEV-SDS/DEV-TS).
- If conflicts arise, capture a short “Spec Gaps” note in the relevant doc and propose 2–3 options.
- Maintain traceability: reference spec IDs in code/doc comments and commits, and keep the matrix up to date.

See: `docs/spec_index.md`, `docs/dev_spec_index.md`, and `docs/traceability_matrix.md` (if present).

## Commit messages and reviews

- Follow `.github/instructions/commit-msg.instructions.md` for commit messages.
- Summaries should explain what/why with spec IDs, note risks and mitigations, and keep the subject ≤ 72 chars in imperative mood.

## MCP tools (optional)

- Tool descriptors live under `mcp/` with a `tool_index.md` and individual `*.tool.md` files.
- Do not hardcode secrets; read tokens from environment variables in settings or runtime.
- These descriptors are optional and may be used to document available tools for MCP-aware setups.

## Using AI workflows (TDD, Debug)

- Chat modes added under `.github/chatmodes/`:
  - TDD: `tdd.red`, `tdd.green`, `tdd.refactor`
  - Debug: `debug.start`, `debug.repro`, `debug.isolate`, `debug.fix`, `debug.refactor`, `debug.regress`
- Prompts: `.github/prompts/tdd.workflow.prompt.md`, `.github/prompts/debug.workflow.prompt.md` (kept concise; align to specs and CALM).
- Context bundle: run `just ai-context-bundle` to generate `docs/ai_context_bundle/` (contains CALM + tech stack + key docs). Chat modes reference this path.
- Validation: `just ai-validate` runs lint/typecheck and optional Nx tests.
- Scaffolding: `just ai-scaffold name=<generator>` wraps `pnpm exec nx g` (safe if pnpm/Nx missing).

See: `.github/instructions/ai-workflows.instructions.md` for conventions and risk mitigations.

**Save and generated summaries in the docs/workdocs/ folder for future reference (create it if it doesn't exist).**
