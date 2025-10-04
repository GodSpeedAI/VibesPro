# Repository-Wide Copilot Instructions

> **Purpose**: Provide comprehensive, context-aware guidance to GitHub Copilot and VS Code AI chat features for optimal effectiveness in the Vibes-Pro project.

---

## 🎯 Project Overview

**Vibes-Pro** is a generator-first platform that creates complete, production-ready applications without runtime dependencies. The platform combines:

- **Hexagonal Architecture** (Ports & Adapters) with **Domain-Driven Design (DDD)**
- **AI-Enhanced Development Workflows** via native VS Code and GitHub Copilot integration
- **Zero-Configuration Setup** for immediate developer productivity
- **Template-Based Generation** using Copier + Jinja2 with Nx monorepo orchestration

### Primary Goal
Optimize developer experience through intelligent code generation, AI-assisted workflows, and spec-driven development—all integrated natively into VS Code tooling.

---

## 🏗️ Architecture & Structure

### High-Level Architecture

Vibes-Pro operates as a **generator-first platform** producing applications that follow hexagonal architecture principles. The system comprises five major interconnected layers:

1. **Generator Core** (Copier + Jinja2 templates)
2. **AI Enhancement Layer** (Temporal learning, context management, chat modes)
3. **Build & Automation** (Nx, justfile orchestration)
4. **Documentation Engine** (Spec-driven docs, traceability)
5. **Type System** (Strict TypeScript/Python typing)

### Key Directory Structure

```
.github/              # AI development system
├── copilot-instructions.md
├── instructions/     # Modular MECE instruction files
├── prompts/          # Task-specific prompts (*.prompt.md)
├── chatmodes/        # Specialized AI personas (*.chatmode.md)
└── workflows/        # CI/CD automation

apps/                 # Application interfaces (web, mobile, CLI, APIs)
libs/                 # Business logic libraries
├── {domain}/
│   ├── domain/       # Pure business logic, entities, value objects
│   ├── application/  # Use cases, application services, ports
│   └── infrastructure/ # Repository implementations, adapters

docs/                 # Project documentation
├── dev_adr.md        # Architectural Decision Records
├── dev_prd.md        # Product Requirements Document
├── dev_sds.md        # Software Design Specification
├── dev_technical-specifications.md
├── spec_index.md     # Specification index
├── dev_spec_index.md # Developer spec index
└── traceability_matrix.md

scripts/              # Orchestration helpers, token metrics, A/B wrappers
tools/                # Development tools, type generators, AI context tools
temporal_db/          # AI learning database (sled - Rust-based embedded DB)
```

### Core Technology Stack

- **Languages**: TypeScript (strict mode), Python 3.12+, Rust (temporal DB)
- **Runtime**: Node.js 18+ LTS, pnpm package manager
- **Templating**: Copier, Jinja2
- **Monorepo**: Nx workspace
- **Orchestration**: justfile (task runner)
- **AI Integration**: GitHub Copilot, VS Code native mechanisms
- **Database**: PostgreSQL 14+ (optional), sled (temporal/learning DB)

---

## 🤝 Development Partnership Model

### How We Work Together

**You (Copilot)** and **I (Developer)** build production code together:
- **Developer**: Guides architecture, catches complexity early, makes decisions
- **Copilot**: Handles implementation details, suggests patterns, validates approaches

### Core Workflow: Research → Plan → Implement → Validate

**Always start every feature with**: *"Let me research the codebase and create a plan before implementing."*

1. **Research** - Understand existing patterns and architecture
   - Use semantic search, grep, and file reads to gather context
   - Identify related specs, ADRs, and existing implementations
   
2. **Plan** - Propose approach and verify with developer
   - Present 2-3 options when uncertainty exists
   - Reference spec IDs and architectural constraints
   - Get explicit approval before proceeding

3. **Implement** - Build with tests and error handling
   - Follow established patterns from codebase
   - Match testing approach to code complexity
   - Include traceability comments (spec IDs)

4. **Validate** - ALWAYS run formatters, linters, and tests
   - Execute `just ai-validate` after implementation
   - Check for errors with get_errors tool
   - Run relevant test suites

---

## 📋 Coding Standards & Conventions

### General Principles

- **Prioritize maintainability over cleverness**: Clear, explicit code beats clever abstractions
- **Composition over inheritance**: Favor small, testable functions and modules
- **Dependency injection**: Use DI where appropriate; avoid deep hierarchies
- **Explicit over implicit**: Clear function names, obvious data flow, direct dependencies
- **Small, focused functions**: If you need comments to explain sections, split into separate functions
- **Many small files over few large ones**: Group related functionality into clear packages

### Type Safety (CRITICAL)

#### TypeScript
- **Strict mode enabled**: `strict: true` in tsconfig.json
- **No `any` types**: Use `unknown` and type guards instead
- **100% type coverage**: All public APIs must be fully typed
- **Prefer interfaces over types** for object shapes

#### Python
- **mypy strict mode**: 100% type coverage required
- **Type all function signatures**: Args, returns, and raises
- **Use `typing` module**: Generic types, Protocol, TypedDict

### File Naming Patterns

| File Type | Pattern | Location | Example |
|-----------|---------|----------|---------|
| Prompts | `*.prompt.md` | `.github/prompts/` | `tdd.workflow.prompt.md` |
| Instructions | `*.instructions.md` | `.github/instructions/` | `security.instructions.md` |
| Chat Modes | `*.chatmode.md` | `.github/chatmodes/` | `persona.system-architect.chatmode.md` |
| Templates | `{{variable}}.ext.j2` | `templates/` | `{{project_slug}}.config.ts.j2` |
| Tests (Node) | `*.test.js` / `*.test.ts` | `tests/unit/`, `tests/integration/` | `context-manager.test.ts` |
| Tests (Python) | `test_*.py` | `tests/` | `test_spec_parser.py` |
| Specs (Shell) | `*_spec.sh` | `tests/shell/` | `run_prompt_spec.sh` |

### Code Organization Patterns

#### Hexagonal Architecture Layers

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

// Interface Layer (apps/) - Controllers/CLI/GraphQL
export class UserController {
  constructor(private readonly createUser: CreateUserUseCase) {}
}
```

### Import Conventions

- **Use relative imports** within packages
- **Use workspace aliases** for cross-package imports
- **Keep modules loosely coupled**: Minimize cross-domain dependencies
- **Order imports**: External → Internal → Relative

---

## 🔒 Security Guidelines (HIGHEST PRIORITY)

> **Precedence**: Security guidelines override all other guidelines (performance, style, etc.)

### Critical Security Rules

1. **NEVER modify VS Code configuration files without explicit user confirmation**
   - `.vscode/settings.json`
   - `.vscode/tasks.json`
   - Rationale: Malicious changes can enable auto-approval (`chat.tools.autoApprove`) → Remote Code Execution

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
   - Expect `.env` files or external secret management
   - Never commit keys to version control

5. **Cryptographic Standards**
   - Use `crypto/rand` for randomness (not Math.random)
   - Use modern crypto libraries (libsodium, Web Crypto API)
   - Follow current best practices for hashing, encryption

6. **Input Validation**
   - Validate all inputs at boundaries
   - Use type guards and schema validation (Zod, io-ts)
   - Fail securely with appropriate error messages

### Security Review Process

- Use `.github/prompts/sec.review.prompt.md` for security audits
- Add STRIDE-style threat notes in PRs for new attack surfaces
- Map features to PRD/SDS security requirements
- Reference security spec IDs in code comments

---

## 📐 Spec-Driven Development Workflow

### Specification Ordering (CRITICAL)

**Always prefer architectural and interface constraints first:**

```
ADR → SDS/Technical Specs → PRD → DEV-* specs
(DEV-ADR → DEV-SDS → DEV-TS → DEV-PRD)
```

### Traceability Requirements

- **Reference spec IDs** in code comments and commits
- **Maintain traceability matrix**: Update `docs/traceability_matrix.md`
- **Capture spec gaps**: Document conflicts with 2-3 proposed options
- **Link implementations to requirements**: Use spec IDs consistently

### Key Specification Documents

| Document | Purpose | Location |
|----------|---------|----------|
| ADR | Architectural decisions | `docs/dev_adr.md` |
| PRD | Product requirements | `docs/dev_prd.md` |
| SDS | Software design spec | `docs/dev_sds.md` |
| TS | Technical specifications | `docs/dev_technical-specifications.md` |
| Spec Index | Specification catalog | `docs/spec_index.md`, `docs/dev_spec_index.md` |
| Traceability | Requirement mapping | `docs/traceability_matrix.md` |

### Handling Conflicts

1. **Identify the conflict** between specs or guidelines
2. **Document in "Spec Gaps"** section of relevant doc
3. **Propose 2-3 options** with trade-offs
4. **Request developer decision** before proceeding
5. **Update traceability matrix** after resolution

---

## 🧪 Testing Strategy

### Testing Philosophy

**Match testing approach to code complexity:**

| Scenario | Approach | Rationale |
|----------|----------|-----------|
| Complex business logic | **TDD** (Test-First) | High confidence, clear requirements |
| Simple CRUD operations | **Code-First, Then Tests** | Avoid over-engineering |
| Hot paths / Performance-critical | **Add benchmarks after implementation** | Measure before optimizing |
| Security-sensitive code | **TDD + Security Review** | Zero tolerance for vulnerabilities |

### Test Types & Organization

#### Unit Tests

**Node.js/TypeScript (Jest)**
- Location: `tests/unit/**/*.test.ts`, `tests/unit/**/*.test.js`
- Use `node:assert` for simple cases, Jest for complex scenarios
- Structure: Arrange → Act → Assert
- Isolation: Mock external dependencies, use dependency injection

**Python (pytest)**
- Location: `tests/unit/test_*.py`
- Use pytest fixtures for setup
- mypy strict mode: 100% type coverage in tests
- Use `pytest-cov` for coverage reports

**Rust (cargo test)**
- Location: `temporal_db/tests/`
- Run: `cargo test --manifest-path temporal_db/Cargo.toml`

#### Integration Tests

- Location: `tests/integration/**/*.test.ts`
- Exercise full workflows: prompt rendering, token measurement, context bundling
- Test key integrations: Nx, Copier generation, GitHub workflows
- Examples:
  - `template-smoke.test.ts` - Full Copier generation
  - `generated-ci-regression.test.ts` - Workflow configuration

#### Shell Tests (ShellSpec)

- Location: `tests/shell/**/*_spec.sh`
- Purpose: Test shell scripts in `scripts/`
- Mirror script paths: `scripts/run_prompt.sh` → `tests/shell/scripts/run_prompt_spec.sh`
- Use temporary directories: `mktemp -d`
- Assert on exit status and stdout/stderr

### Running Tests

```bash
# All tests
just test

# Unit tests only
just test-unit

# Integration tests only
just test-integration

# Rust temporal DB tests
cargo test --manifest-path temporal_db/Cargo.toml

# With coverage
pnpm run test:jest:coverage

# AI validation (lint + typecheck + tests)
just ai-validate
```

### Testing Best Practices

1. **Specification-driven TDD**: Every change traces to spec IDs
2. **Static analysis first**: Run `mypy`, `ruff`, `pnpm lint` before tests
3. **Golden tests for prompts**: Snapshot rendered stacks, compare on PR
4. **Template health checks**: `python tools/validate-templates.py`
5. **Idempotent tests**: No shared state, clean up temp files
6. **Fast feedback**: Keep unit tests under 1 second each

---

## 🚀 Build & Deployment

### Development Environment Setup

```bash
# Clone and setup
git clone <repository-url>
cd vibes-pro
just setup            # Install all dependencies (Node + Python + Tools)

# Optional: Database setup
just db-setup

# Start development
just dev              # Start all services in parallel
```

### Build Commands

```bash
# Build all applications
just build

# Build specific app
just build-app web

# Generate project from template
pnpm generate

# Test generation workflow
pnpm test-generation
```

### Key Orchestration Commands (justfile)

| Command | Purpose |
|---------|---------|
| `just setup` | Full environment setup (Node + Python + Tools) |
| `just dev` | Start all dev servers (parallel) |
| `just test` | Run all test suites |
| `just ai-validate` | Lint + typecheck + optional tests |
| `just ai-context-bundle` | Generate AI context bundle in `docs/ai_context_bundle/` |
| `just ai-scaffold name=<gen>` | Run Nx generator safely |
| `just spec-guard` | Validate specs, prompts, and docs |
| `just prompt-lint` | Lint all prompt files |

### CI/CD Integration

- **GitHub Workflows**: `.github/workflows/`
- **Pre-commit hooks**: `hooks/pre_gen.py`, `hooks/post_gen.py`
- **Automated checks**: Spec matrix validation, prompt linting, link checking

---

## 🤖 AI Workflows & Chat Modes

### Context Management

**AI Context Bundle** (`just ai-context-bundle`)
- Generates `docs/ai_context_bundle/` with:
  - CALM architecture docs
  - Tech stack information
  - Key specifications
  - Traceability matrix
- Chat modes reference this path for optimal context

### Custom Chat Modes

Specialized AI personas in `.github/chatmodes/`:

#### Development Personas
- `persona.system-architect.chatmode.md` - Architectural guidance
- `persona.senior-backend.chatmode.md` - Backend best practices
- `persona.senior-frontend.chatmode.md` - Frontend patterns
- `persona.qa.chatmode.md` - Testing strategies

#### Workflow Modes
- **TDD**: `tdd.red`, `tdd.green`, `tdd.refactor`
- **Debug**: `debug.start`, `debug.repro`, `debug.isolate`, `debug.fix`, `debug.refactor`, `debug.regress`
- **DevOps**: `devops.audit`, `devops.deployment`
- **Product**: `product.manager`, `product.elevator-pitch`, `product.features-list`

#### Specification Modes
- `spec.lean.chatmode.md` - Minimal spec generation
- `spec.wide.chatmode.md` - Comprehensive spec generation
- `spec.nfr.chatmode.md` - Non-functional requirements

### Task-Specific Prompts

Key prompts in `.github/prompts/`:

| Prompt | Purpose |
|--------|---------|
| `spec.implement.prompt.md` | Implement from specification |
| `spec.plan.*.prompt.md` | Generate ADR, PRD, SDS, TS docs |
| `tdd.workflow.prompt.md` | TDD workflow guidance |
| `debug.workflow.prompt.md` | Debugging workflow |
| `sec.review.prompt.md` | Security audit |
| `perf.analyze.prompt.md` | Performance analysis |
| `docs.generate.prompt.md` | Documentation generation |

### Modular Instruction Stacking

**MECE Principle** (Mutually Exclusive, Collectively Exhaustive)

Instructions are organized by domain with precedence:
1. `security.instructions.md` (precedence: 10) - HIGHEST
2. `testing.instructions.md` (precedence: 35)
3. `general.instructions.md` (precedence: 50)
4. `performance.instructions.md`
5. `style.*.instructions.md`

**Composition**: Instructions stack per task in precedence order, with security always overriding others.

---

## 🎨 Code Quality & Style

### General Code Quality

- **No technical debt**: If you notice debt, create a plan to address it
- **Code reviews**: Reference existing code and documentation
- **Dependencies**: Update to latest stable versions, avoid known vulnerabilities
- **Token efficiency**: Summarize when possible, don't include entire files unnecessarily
- **Performance**: Measure before optimizing—no guessing

### Frontend Style (React/TypeScript)

See `.github/instructions/style.frontend.instructions.md` for details:
- Functional components with hooks
- CSS Modules or styled-components
- Accessibility (ARIA, semantic HTML)
- Responsive design patterns

### Python Style

See `.github/instructions/style.python.instructions.md` for details:
- PEP 8 compliance via `ruff`
- Type hints everywhere (`mypy --strict`)
- Docstrings (Google style)
- Use `uv` for dependency management

### Documentation

See `.github/instructions/docs.instructions.md` for details:
- Markdown linting (markdownlint)
- Link checking automated
- API documentation auto-generated
- Keep docs in sync with code

---

## 🔄 Commit Messages & Reviews

### Commit Message Format

Follow `.github/instructions/commit-msg.instructions.md`:

```
<type>(<scope>): <subject> [SPEC-ID]

<body>

<footer>
```

**Example:**
```
feat(auth): add OAuth2 authentication [DEV-PRD-023]

Implements OAuth2 flow with Google and GitHub providers.
Includes rate limiting and CSRF protection.

Refs: DEV-SDS-045, DEV-ADR-012
Risk: New attack surface - mitigated with OWASP controls
```

### Requirements

- **Subject**: ≤ 72 characters, imperative mood
- **Spec IDs**: Reference relevant spec IDs
- **What/Why**: Explain what changed and why
- **Risks & Mitigations**: Note security/performance impacts

---

## 💡 Problem-Solving & Decision-Making

### When Uncertain

- **"Let me ultrathink about this architecture."** - Use for complex architectural decisions
- **Present options**: "I see approach A (simple) vs B (flexible). Which do you prefer?"
- **Stop and ask**: Developer redirects prevent over-engineering

### When Stuck

- **Stop and reassess**: The simple solution is usually correct
- **Gather more context**: Use semantic search, grep, read files
- **Consult specs**: Check ADR, SDS, technical specifications
- **Reference existing patterns**: Search for similar implementations

### Maximizing Efficiency

1. **Parallel operations**: Run multiple searches, reads, greps in single message
2. **Batch similar work**: Group related file edits together
3. **Multiple agents**: Split complex tasks (one for tests, one for implementation)
4. **Avoid redundancy**: Don't repeat yourself after tool calls—pick up where you left off

---

## 🛠️ MCP Tools (Optional)

### Tool Descriptors

- Location: `mcp/` with `tool_index.md` and individual `*.tool.md` files
- Purpose: Document available tools for MCP-aware setups
- **Security**: Do NOT hardcode secrets; read tokens from environment variables

### Available MCP Integrations

- Context7: Library documentation
- Microsoft Docs: Official Microsoft/Azure documentation
- Exa Search: Code context and web search
- Memory Tool: User preference storage
- Nx MCP Server: Nx workspace operations
- Pylance MCP: Python language server features

---

## 📊 Key Feature Areas

### AI-Enhanced Development

1. **Temporal Learning System**
   - Records architectural decisions in `temporal_db/project_specs.db`
   - Learns from development patterns over time
   - Uses sled (Rust embedded database) for persistence

2. **Context Management**
   - Token budget optimization
   - Relevance scoring for context inclusion
   - Dynamic context bundling

3. **Custom Chat Modes**
   - 30+ specialized personas
   - Workflow-specific guidance (TDD, debugging, planning)
   - Product and technical modes

4. **Task Orchestration**
   - VS Code tasks run prompts with dynamic context
   - Token measurement and tracking
   - A/B testing support for prompt variations

### Modular Instruction Stacking

- MECE principle: Mutually Exclusive, Collectively Exhaustive
- Guidance broken into domain-specific files
- Composed per task via ordered stacking
- Precedence: Security > Testing > General > Performance > Style

---

## 📚 Documentation Standards

### Documentation Hierarchy

1. **Architecture docs** (CALM, ADR) - Highest authority
2. **Specifications** (SDS, Technical Specs, PRD)
3. **Developer specs** (DEV-*)
4. **API Reference** - Auto-generated from code
5. **How-to guides** - Task-oriented tutorials

### Markdown Standards

- **Linting**: markdownlint with `.markdownlint.json` config
- **Link checking**: Automated via `node tools/docs/link_check.js`
- **Formatting**: Consistent headings, lists, code blocks
- **Cross-references**: Use relative links, maintain link integrity

---

## ⚡ Performance Guidelines

- **Measure first**: No premature optimization
- **Profile hot paths**: Identify bottlenecks with data
- **Benchmark after implementation**: Add performance tests for critical code
- **Token efficiency**: Optimize context usage, minimize redundancy
- **Build performance**: Keep build times under control with caching

See `.github/instructions/performance.instructions.md` for detailed guidance.

---

## 🎯 Quick Reference Card

### When Starting Any Task

1. **Research** - "Let me research the codebase and create a plan"
2. **Check specs** - Reference ADR, SDS, PRD, DEV-* docs
3. **Find patterns** - Search for similar existing implementations
4. **Plan** - Propose 2-3 options if uncertain
5. **Get approval** - Wait for developer confirmation

### Before Implementing

- [ ] Understand the specification (spec IDs)
- [ ] Identify architectural constraints (ADR)
- [ ] Check security implications (STRIDE)
- [ ] Plan testing strategy (TDD vs code-first)
- [ ] Review existing patterns

### After Implementing

- [ ] Add traceability comments (spec IDs)
- [ ] Write/update tests
- [ ] Run `just ai-validate` (lint + typecheck)
- [ ] Check for errors with get_errors tool
- [ ] Update traceability matrix if needed
- [ ] Verify documentation is current

### Red Flags (STOP)

- ❌ Modifying `.vscode/settings.json` or `.vscode/tasks.json` without confirmation
- ❌ Using `any` type in TypeScript
- ❌ Hardcoding secrets or credentials
- ❌ Bypassing input validation
- ❌ Adding code without spec traceability
- ❌ Over-engineering simple solutions

---

## 📖 Additional Resources

### Key Documentation Files

- `docs/ARCHITECTURE.md` - Hexagonal architecture guide
- `docs/dev_spec_index.md` - Developer specification index
- `docs/traceability_matrix.md` - Requirements traceability
- `.github/instructions/ai-workflows.instructions.md` - AI workflow conventions

### External References

Use Context7 MCP for up-to-date library documentation:
- React, Next.js, Node.js patterns
- TypeScript best practices
- Python ecosystem tools

---

## 🎓 Learning & Adaptation

### Temporal Database Insights

The `temporal_db/` stores:
- Architectural decisions and rationale
- Development patterns that worked well
- Anti-patterns to avoid
- Domain-specific context

**Query before making major decisions** to learn from project history.

### Continuous Improvement

- **Capture learnings**: Document insights in ADRs
- **Update specs**: Keep specifications current
- **Refine prompts**: Improve prompt effectiveness over time
- **Share patterns**: Document successful approaches

---

## Summary

**Vibes-Pro is a generator-first, spec-driven platform** that prioritizes:

1. **Security First** - No compromises on security guidelines
2. **Spec Traceability** - Every change maps to requirements
3. **Type Safety** - Strict typing in all languages
4. **Testing Excellence** - Match strategy to complexity
5. **AI Enhancement** - Leverage temporal learning and context management
6. **Developer Partnership** - Research, plan, implement, validate

**Always remember**: 
- Simple solutions are usually correct
- Security overrides all other concerns  
- Specs before code
- Tests match complexity
- Validate after every change

For detailed guidance on any topic, consult the modular instruction files in `.github/instructions/`.
