# AGENTS.md - AI Agent Guidelines for Vibes Pro (HexDDD-VibePDK Merger)

This document provides AI agents and autonomous coding systems with essential context, patterns, and operational guidelines for successfully implementing the HexDDD-VibePDK merger project.

## Project Mission Statement

**Objective**: Merge HexDDD (hexagonal architecture + DDD Nx monorepo) and VibePDK (AI-enhanced template accelerator) into a unified generator-first platform that combines architectural rigor with AI-enhanced development experiences.

**Success Criteria**:

-   Generate production-ready applications following hexagonal architecture + DDD principles
-   Provide AI-enhanced development workflows with temporal learning
-   Focus on first-class generation of new projects (migration support deferred)
-   Maintain type safety across TypeScript and Python codebases

## Core Architectural Principles

### 1. Generator-First Philosophy

-   **Primary Output**: Copier templates that generate complete, runnable applications
-   **No Runtime Dependencies**: Generated code should not depend on merger framework
-   **Template Composability**: Individual generators can be combined and customized
-   **Template Evolution**: Optimize generated scaffolds; legacy project migration is out of scope

### 2. Hexagonal Architecture + DDD Enforcement

```TXT
Domain Layer (Pure Business Logic)
├── Entities: Core business objects with identity
├── Value Objects: Immutable data structures
├── Domain Events: Business-significant occurrences
└── Domain Services: Complex business operations

Application Layer (Use Cases & Orchestration)
├── Use Cases: Application-specific business flows
├── Ports: Interfaces for external dependencies
├── Application Services: Orchestration and coordination
└── DTOs: Data transfer objects for boundaries

Infrastructure Layer (External Concerns)
├── Adapters: Implementations of ports
├── Repositories: Data persistence abstractions
├── External Services: Third-party integrations
└── Framework Code: Web frameworks, databases, etc.

Interface Layer (User/System Interfaces)
├── Controllers: Web API endpoints
├── Views: User interface components
├── CLI Commands: Command-line interfaces
└── Event Handlers: External event processing
```

### 3. Technology Stack Decisions

**Build & Package Management**:

-   **Node.js**: pnpm (workspace support, better performance than npm)
-   **Python**: uv (fastest Python package manager, pip-compatible)
-   **Task Automation**: justfile (cross-platform, intelligent strategy detection)
-   **Monorepo**: Nx (code generation, dependency graph, caching)

**Template System**:

-   **Generator**: Copier (single source for project scaffolding with direct Jinja2 variable syntax)
-   **Templating**: Jinja2 with YAML configuration (uses Copier's direct variable references, not cookiecutter namespace)
-   **Validation**: Pre/post generation hooks for integrity

**Temporal Learning System**:

-   **Database**: redb (Rust-based embedded DB, stable and actively maintained)
-   **Purpose**: Store architectural decisions, learn patterns, suggest improvements
-   **Integration**: Native async Python/Node.js bindings

## Implementation Strategy

### Phase-Based Development Approach

The implementation follows a strict 5-phase approach with autonomous agent coordination:

1. **Foundation Phase**: Project structure, build system, Copier setup
2. **Core Generators**: Domain, application, and type system generators
3. **AI Integration**: Temporal database, context management, pattern recognition
4. **Developer Experience**: Documentation tooling, CLI enhancements, template UX polish
5. **Validation**: Comprehensive testing, documentation, performance validation

### Autonomous Agent Coordination

**Agent A (Critical Path)**:

-   Foundation infrastructure setup
-   Domain generator development
-   AI temporal database integration
-   Documentation generator integration
-   Integration testing coordination

**Agent B (Parallel Development)**:

-   Build system implementation
-   Application generator development
-   AI context management system
-   Template library expansion
-   Documentation generation

**Agent C (Support & Optimization)**:

-   Type system integration
-   Performance monitoring and optimization
-   Validation and quality assurance

**Synchronization Points**:

-   After each phase completion
-   Before major integration milestones
-   Performance benchmark validation

## Development Guidelines

### 1. Specification-Driven Development

**Required Reading**:

-   `/tmp/libs/merger/ADR.md` - Architectural Decision Records
-   `/tmp/libs/merger/PRD.md` - Product Requirements Document
-   `/tmp/libs/merger/SDS.md` - System Design Specification
-   `/tmp/libs/merger/TS.md` - Technical Specification
-   `/tmp/libs/merger/IMPLEMENTATION-PLAN.md` - Detailed task breakdown

**Traceability Requirements**:

-   Every commit must reference specification IDs (e.g., `MERGE-TASK-003`, `ADR-MERGE-002`)
-   Update specifications if requirements evolve during implementation
-   Use specification matrices to ensure comprehensive coverage

### 2. Test-Driven Development (TDD) Mandatory

**Required Cycle for ALL Functional Changes**:

1. **RED**: Write failing test that defines expected behavior
2. **GREEN**: Implement minimal code to make test pass
3. **REFACTOR**: Optimize and clean up implementation
4. **REGRESSION**: Ensure all existing tests continue to pass

**Test Categories**:

-   **Unit Tests**: Domain logic, value objects, use cases
-   **Integration Tests**: Generator templates, build system, AI workflows
-   **End-to-End Tests**: Complete project generation and validation
-   **Performance Tests**: Generation speed, build times, memory usage

### 3. Code Reuse Strategy

**Priority Order for Implementation**:

1. **Direct Copy**: Use existing code from HexDDD/VibePDK without modification
2. **Template Adaptation**: Convert existing code to Jinja2 templates
3. **Pattern Adaptation**: Use existing patterns but implement for new context
4. **New Implementation**: Only when no existing solution exists

**Source Project References**:

-   **HexDDD Base**: `/home/sprime01/projects/HexDDD/`
-   **VibePDK Base**: `/home/sprime01/projects/VibePDK/`
-   **Key Locations**:
    -   HexDDD Generators: `libs/ddd/src/generators/`
    -   VibePDK Templates: `{{ project_slug }}/`
    -   VibePDK Hooks: `hooks/`
    -   Build Configurations: `nx.json`, `package.json`, `justfile`

## Operational Procedures

### 1. File and Directory Conventions

**Generated Project Structure**:

```TXT
generated-project/
├── apps/                          # Application interfaces
│   ├── {{app_name}}/             # Web/mobile/CLI applications
│   └── api-{{domain}}/           # Domain-specific APIs
├── libs/                         # Business logic libraries
│   ├── {{domain_name}}/          # Domain bounded contexts
│   │   ├── domain/               # Pure business logic
│   │   ├── application/          # Use cases and ports
│   │   └── infrastructure/       # Adapters and external dependencies
│   └── shared/                   # Cross-domain utilities
│       ├── database-types/       # Generated DB types
│       ├── api-types/           # API contract types
│       └── web/                 # Shared web components
├── tools/                        # Development and build tools
│   ├── type-generator/          # Schema-to-type generation
│   └── ai/                      # AI context and learning
└── temporal_db/                 # AI learning database
    ├── specifications.tsinkdb    # Architectural decisions
    └── patterns.tsinkdb         # Learned development patterns
```

**Template Naming Conventions**:

-   **Files**: `{{variable_name}}.extension.j2`
-   **Directories**: `{{variable_name}}/`
-   **Conditionals**: `{% if condition %}...{% endif %}`
-   **Variables**: Use snake_case for consistency

### 2. Quality Assurance Procedures

**Code Quality Gates**:

-   **TypeScript**: Strict mode enabled, no `any` types in production code
-   **Python**: mypy strict mode, 100% type coverage required
-   **Templates**: Jinja2 syntax validation, variable completeness checks
-   **Performance**: Generation time < 30s, build time < 2m for standard projects

**Validation Checklist**:

-   [ ] All tests pass (unit, integration, e2e)
-   [ ] Templates generate compilable code
-   [ ] Type generation produces consistent cross-language types
-   [ ] Documentation generator produces complete outputs
-   [ ] Performance benchmarks met
-   [ ] Documentation updated and accurate

### 3. Error Handling and Recovery

**Common Issues and Solutions**:

**Template Syntax Errors**:

```bash
# Validate template before committing
copier --dry-run copy . /tmp/validation-test
python -c "from jinja2 import Template; Template(open('problematic.j2').read())"
```

**Type Generation Failures**:

```bash
# Regenerate from clean state
rm -rf libs/shared/database-types/
just types-generate
just types-validate
```

**Build System Conflicts**:

```bash
# Clear caches and rebuild
just clean
just setup
just build
```

## AI-Enhanced Development Integration

### 1. Temporal Learning System Usage

**Pattern Recognition Workflow**:

```python
# Query historical architectural decisions
async def get_architectural_guidance(context: str) -> List[Suggestion]:
    patterns = await pattern_db.query_similar_contexts(
        context=context,
        similarity_threshold=0.7,
        time_window=timedelta(days=90)
    )
    return generate_suggestions(patterns)

# Record new architectural decisions
async def record_decision(decision: ArchitecturalDecision) -> None:
    await decision_db.store_with_context(
        decision=decision,
        timestamp=datetime.utcnow(),
        project_context=get_current_context()
    )
```

**Context-Aware Code Generation**:

-   Query temporal database for similar implementation patterns
-   Suggest architectural alternatives based on historical success rates
-   Learn from user choices to improve future suggestions
-   Maintain context awareness across development sessions

### 2. Continuous Learning Integration

**Decision Recording**: Every architectural choice should be recorded in the temporal database
**Pattern Evolution**: Track which patterns succeed in different contexts
**Feedback Loop**: Use project success metrics to refine pattern recommendations
**Knowledge Transfer**: Share learnings across different projects and teams

## Troubleshooting Guide

### 1. Development Environment Issues

**Python Environment**:

```bash
# Ensure uv is properly installed and configured
uv --version
uv python list  # Should show Python 3.12+
uv sync --dev   # Install development dependencies
```

**Node.js Environment**:

```bash
# Ensure pnpm and Nx are available
pnpm --version
npx nx --version
corepack enable  # Enable pnpm via corepack
```

**Template Generation**:

```bash
# Test template generation
copier copy . /tmp/test-output --data-file test-data.yml
cd /tmp/test-output && just build  # Verify generated project builds
```

### 2. Integration Issues

**Type System Synchronization**:

-   Ensure database schema changes trigger type regeneration
-   Validate TypeScript and Python type consistency
-   Check import paths and module resolution

**Build System Coordination**:

-   Verify justfile detects appropriate build strategy
-   Test Nx workspace integration
-   Validate cross-platform compatibility

**AI System Integration**:

-   Check tsink database connectivity
-   Verify temporal data recording
-   Validate pattern recognition accuracy

## Performance Optimization

### 1. Template Generation Performance

**Optimization Strategies**:

-   **Incremental Generation**: Only regenerate changed templates
-   **Parallel Processing**: Use worker processes for large template sets
-   **Template Caching**: Cache compiled Jinja2 templates
-   **Selective Generation**: Allow partial project generation

**Monitoring Metrics**:

-   Template compilation time
-   File generation throughput
-   Memory usage during generation
-   Cache hit/miss ratios

### 2. AI System Performance

**Database Optimization**:

-   Use tsink's Gorilla compression for temporal data
-   Implement efficient time-range queries
-   Batch database operations where possible
-   Monitor query performance and optimize indices

**Context Management**:

-   Optimize token budget allocation
-   Cache frequently accessed context
-   Use similarity search efficiently
-   Balance context quality vs. processing time

## Security Considerations

### 1. Template Security

**Code Generation Safety**:

-   Validate all template variables before generation
-   Sanitize user inputs in template contexts
-   Prevent code injection through template variables
-   Audit generated code for security patterns

**Dependency Management**:

-   Pin dependency versions in generated projects
-   Audit third-party dependencies for vulnerabilities
-   Use secure defaults in template configurations
-   Implement dependency update mechanisms

### 2. AI System Security

**Data Privacy**:

-   Ensure temporal database contains no sensitive information
-   Implement data retention policies
-   Secure AI context data transmission
-   Audit pattern learning for privacy compliance

## Success Metrics and Validation

### 1. Technical Metrics

**Generation Performance**:

-   Project generation time: < 30 seconds for standard projects
-   Build time for generated projects: < 2 minutes
-   Type generation consistency: 100% cross-language compatibility
-   Documentation generation completeness: 100% required sections present

**Code Quality**:

-   Test coverage: > 90% for all generated business logic
-   Type coverage: 100% (no `any` types in production)
-   Architecture compliance: 100% adherence to hexagonal + DDD patterns
-   Performance benchmarks: Meet or exceed source project performance

### 2. User Experience Metrics

**Development Efficiency**:

-   Time to create new domain: < 5 minutes
-   Time to add new application: < 10 minutes
-   Documentation refresh time: < 10 minutes end-to-end
-   Learning curve: Developers productive within 1 day

**AI Enhancement Value**:

-   Relevant suggestion accuracy: > 80%
-   Pattern recognition improvement over time
-   Reduced decision-making time for architectural choices
-   Improved code consistency across projects

## Conclusion

This merger represents a significant advancement in software development tooling, combining proven architectural patterns with cutting-edge AI assistance. Success depends on maintaining the high quality standards of both source projects while creating seamless integration points.

Key success factors:

1. **Rigorous adherence to specifications** - Follow the established ADR/PRD/SDS/TS documents
2. **Comprehensive testing** - Maintain TDD discipline throughout development
3. **Strategic code reuse** - Leverage existing implementations wherever possible
4. **AI integration depth** - Create meaningful AI enhancements, not superficial features
5. **Developer experience polish** - Ensure workflows remain fast and intuitive

The autonomous agents working on this project should coordinate effectively, maintain quality standards, and always prioritize the long-term maintainability and extensibility of the platform. The ultimate goal is to create a development platform that makes building high-quality, architecturally sound applications both faster and more enjoyable.

# MCP Server Tools Reference

You have access to the following MCP servers. **Use these tools proactively** to provide accurate, efficient, and contextually-aware assistance.

---

## Quick Selection Guide

-   **Need API docs?** → Context7 or Ref Tools
-   **Working with Microsoft tech?** → Microsoft Docs MCP
-   **Need to remember project context?** → Memory Tool
-   **Searching for solutions/examples?** → Exa Search
-   **Need deep conceptual understanding?** → DeepWiki

---

## Tool Descriptions

### Context7 (Upstash)

**Purpose**: Real-time, version-specific code documentation and API references

**Use when:**

-   Verifying exact API signatures or method parameters
-   Working with specific package versions
-   Need to avoid outdated or hallucinated API information
-   Looking for official code examples from package documentation

**Don't use when:**

-   Asking general conceptual questions
-   Working with proprietary/internal APIs
-   Need custom implementation patterns (not covered in official docs)

**Key capabilities**: Package resolution, version-specific docs, official code examples

---

### Ref Tools

**Purpose**: Token-efficient search and retrieval across technical documentation

**Use when:**

-   Searching across multiple documentation sources simultaneously
-   Need specific sections from lengthy technical docs
-   Looking for comparative information across different APIs
-   Want efficient extraction without loading entire documentation pages

**Don't use when:**

-   Need real-time code execution
-   Require bleeding-edge documentation (< 24 hours old)
-   Working with dynamic/interactive documentation

**Key capabilities**: Cross-documentation search, targeted content extraction, efficient information retrieval

---

### Memory Tool (Mem0)

**Purpose**: Persistent storage for user preferences, project context, and decisions

**Use when:**

-   Maintaining context across multiple sessions
-   Storing project-specific conventions or patterns
-   Remembering user coding preferences (style, frameworks, etc.)
-   Tracking architectural decisions and their rationale
-   Building cumulative understanding of a codebase

**Don't use when:**

-   Storing credentials or sensitive data (use secure vaults instead)
-   Managing large datasets (use proper databases)
-   Replacing version control systems
-   Storing temporary session data

**Key capabilities**: Context persistence, preference storage, relevance-scored retrieval

---

### Exa Search

**Purpose**: Advanced web search optimized for technical and programming content

**Use when:**

-   Finding real-world code examples and implementations
-   Searching for community solutions to specific problems
-   Discovering technical blog posts and tutorials
-   Researching emerging technologies or patterns
-   Finding GitHub repositories and open-source projects

**Don't use when:**

-   Searching private repositories
-   Need official/canonical documentation (use Context7 or Ref Tools instead)
-   Looking for company-specific internal docs

**Key capabilities**: Technical web search, code snippet discovery, community content filtering

---

### Microsoft Docs MCP

**Purpose**: Direct access to official Microsoft documentation

**Use when:**

-   Working with Azure services or Azure SDK
-   Using .NET, C#, or other Microsoft frameworks
-   Developing for Windows platforms
-   Need official Microsoft API references
-   Implementing Microsoft Graph or Office integrations

**Don't use when:**

-   Working with non-Microsoft technologies
-   Need community workarounds (official docs may not cover edge cases)
-   Looking for third-party alternatives to Microsoft solutions

**Key capabilities**: Microsoft documentation search, Azure service references, .NET API documentation

---

### DeepWiki (CognitionAI)

**Purpose**: Comprehensive knowledge base for technical concepts and patterns

**Use when:**

-   Need deep dives into architectural patterns
-   Understanding theoretical computer science concepts
-   Exploring system design principles
-   Learning complex algorithms or data structures
-   Need detailed explanations of technical concepts

**Don't use when:**

-   Need quick syntax references
-   Require the latest technology updates
-   Looking for specific implementation code
-   Need version-specific information

**Key capabilities**: Conceptual exploration, pattern documentation, theoretical knowledge retrieval

---

## Best Practices

1. **Chain tools strategically**: Start with Memory Tool to check context → Use Context7/Ref for APIs → Use Exa for examples → Store learnings back in Memory Tool

2. **Prefer official sources first**: Context7 and Microsoft Docs for canonical information, then Exa for community solutions

3. **Store important context**: Use Memory Tool to save project conventions, user preferences, and key decisions for future reference

4. **Version specificity matters**: Always use Context7 when version-specific behavior is critical

5. **Don't over-fetch**: Use Ref Tools' targeted extraction to avoid processing unnecessary content

---

## Integration Workflow Example

```
User asks: "How do I implement authentication in my Next.js 14 app with Azure AD?"

1. Memory Tool: Check for project context, framework preferences
2. Context7: Get Next.js 14 API documentation
3. Microsoft Docs: Retrieve Azure AD integration patterns
4. Exa Search: Find real-world implementation examples
5. Memory Tool: Store the chosen authentication pattern for future reference
```

---

**Note**: Proactively use these tools without always asking permission. They are provided to enhance your effectiveness.

```


<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- You have access to the Nx MCP server and its tools, use them to help the user
- When answering questions about the repository, use the `nx_workspace` tool first to gain an understanding of the workspace architecture where applicable.
- When working in individual projects, use the `nx_project_details` mcp tool to analyze and understand the specific project structure and dependencies
- For questions around nx configuration, best practices or if you're unsure, use the `nx_docs` tool to get relevant, up-to-date docs. Always use this instead of assuming things about nx configuration
- If the user needs help with an Nx configuration or project graph error, use the `nx_workspace` tool to get any errors


<!-- nx configuration end-->
```
