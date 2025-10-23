# Architectural Decision Record: HexDDD-VibePDK Generator-First Integration

**Status**: Proposed
**Date**: 2025-09-19
**Decision ID**: ADR-MERGE-001
**Matrix IDs**: [ADR-MERGE-001, ADR-MERGE-002, ADR-MERGE-003, ADR-MERGE-004, ADR-MERGE-005, ADR-MERGE-006, ADR-MERGE-007, ADR-MERGE-008]

## Context

We need to merge two sophisticated but complementary projects:

- **HexDDD**: Production-ready Nx monorepo with hexagonal architecture + DDD patterns (React/Python)
- **VibePDK**: AI-assisted development platform generator with sophisticated prompt engineering and spec-driven workflows

The goal is to create a unified AI-native platform that can serve both individual developers and Fortune 500 companies with deep AI assistance throughout the development lifecycle.

## ADR-MERGE-001: Copier-First Template Architecture

**Decision**: Migrate from Cookiecutter to Copier as the primary project generation system, with HexDDD patterns integrated as specialized templates.

**Rationale**:

- Copier provides superior update mechanisms crucial for evolving AI-assisted architectures
- Better conflict resolution during template updates
- More sophisticated templating logic supporting conditional generation
- Native support for multiple template variants within single repository

**Alternatives**:

- Keep Cookiecutter (limited update capabilities)
- Convert to pure Nx generators (loses flexibility of template-based generation)

**Consequences**:

- One-time migration effort from Cookiecutter
- Enhanced ability to evolve templates over time
- Better support for hybrid project types

## ADR-MERGE-002: PNPM + UV Unified Package Management

**Decision**: Standardize on pnpm for Node.js dependencies and uv for Python dependencies across all generated projects.

**Rationale**:

- PNPM's workspace support aligns with monorepo patterns
- UV's speed and reliability superior to traditional pip workflows
- Consistent package management reduces cognitive load
- Both tools support advanced dependency resolution

**Alternatives**:

- Keep mixed npm/pip approach (inconsistent experience)
- Use only npm with Python bridge tools (complexity)

**Consequences**:

- All HexDDD projects migrate to pnpm
- Generated projects have consistent dependency patterns
- Faster installation and more reliable builds

## ADR-MERGE-003: Justfile-Primary Task Orchestration

**Decision**: Use justfile as the primary task runner, with Nx targets wrapped as justfile recipes for complex multi-project operations.

**Rationale**:

- Justfile provides superior developer experience for common tasks
- Platform-agnostic task definitions (works on all OS)
- Simple, readable syntax accessible to all team members
- Can wrap Nx complexity behind simple interfaces

**Architecture**:

```bash
# Primary interface
just build        # Simple builds via direct tools
just test         # Simple test runs
just nx-build     # Complex multi-project builds via Nx
just nx-test      # Complex test orchestration via Nx
```

**Alternatives**:

- Nx-only approach (steeper learning curve)
- Make/npm scripts (less powerful)

**Consequences**:

- Unified task interface across all project types
- Nx complexity hidden behind justfile abstractions
- Easier onboarding for non-Nx developers

## ADR-MERGE-004: AI-Native Architecture with Deep Integration

**Decision**: Integrate AI assistance at every architectural layer: generation, validation, learning, and evolution.

**Components**:

1. **Generation**: AI-assisted template selection and customization
2. **Validation**: Real-time architectural compliance checking
3. **Learning**: Temporal storage of decisions for pattern recognition
4. **Evolution**: Predictive suggestions for architectural improvements

**Rationale**:

- Maximizes value of AI capabilities throughout development lifecycle
- Enables both individual and enterprise use cases
- Creates feedback loops for continuous improvement
- Distinguishes platform from traditional scaffolding tools

**Alternatives**:

- Minimal AI integration (underutilizes capabilities)
- AI only for code generation (misses architectural opportunities)

**Consequences**:

- Higher implementation complexity
- Need for sophisticated AI context management
- Potential for revolutionary developer experience improvements

## ADR-MERGE-005: Temporal Specification Management System

**Decision**: Implement non-destructive additive specification evolution with temporal storage and learning capabilities.

**Architecture**:

```
specs/
├── current/
│   ├── ADR-001.md          # Active specification (populated from latest)
│   ├── PRD-002.md          # Active specification
│   └── templates/
│       ├── adr.template.md # Template with variables
│       └── prd.template.md # Template with variables
├── history/
│   ├── 2025-09-19T14:30:00Z_ADR-001_v1.md
│   ├── 2025-09-19T15:45:00Z_ADR-001_v2.md
│   └── 2025-09-20T09:15:00Z_PRD-002_v1.md
└── temporal_db/
    ├── decisions.tsinkdb   # Time-series database for specifications
    └── patterns.tsinkdb    # Learned patterns with temporal compression
```

**Learning System**:

- **Pattern Recognition**: Analyze decision sequences to identify common patterns
- **Predictive Suggestions**: Auto-regressive models predict likely next decisions
- **Context Awareness**: Understanding of domain-specific architectural patterns
- **Personalization**: Learn individual/team preferences over time

**Rationale**:

- Preserves complete decision history for analysis
- Enables AI to learn from accumulated architectural decisions
- Non-destructive approach prevents loss of valuable context
- Embedded database avoids external dependencies

**Alternatives**:

- Git-only versioning (lacks structured analysis capabilities)
- External time-series database (deployment complexity)
- Manual specification management (no learning capabilities)

**Consequences**:

- Rich data for AI learning and prediction
- Complete auditability of architectural evolution
- Requires embedded database integration
- Foundation for sophisticated AI assistance

## ADR-MERGE-006: Hexagonal Architecture as Core Pattern

**Decision**: Maintain HexDDD's hexagonal architecture as the foundational pattern, enhanced with AI-assisted compliance validation.

**Enhanced Features**:

- **AI-Guided Layer Creation**: Intelligent suggestions for port/adapter patterns
- **Real-time Validation**: Automatic detection of layer boundary violations
- **Pattern Suggestions**: AI recommendations for common hexagonal patterns
- **Dependency Analysis**: Automated validation of dependency direction

**Rationale**:

- Hexagonal architecture provides proven enterprise-grade structure
- Clear separation of concerns enables better AI analysis
- Domain-driven patterns align with AI-assisted domain modeling
- Mature implementation in HexDDD provides solid foundation

**Consequences**:

- All generated projects follow hexagonal principles
- AI system trained on hexagonal architecture patterns
- Enhanced architectural governance through automation

## ADR-MERGE-007: Hybrid Build System Architecture

**Decision**: Support both simple single-project builds and complex monorepo orchestration through layered architecture.

**Layer Architecture**:

```
┌─────────────────────────────────────────┐
│ Justfile Interface (Developer UX)       │
├─────────────────────────────────────────┤
│ Direct Tool Integration (Simple Cases)  │
├─────────────────────────────────────────┤
│ Nx Orchestration (Complex Cases)        │
├─────────────────────────────────────────┤
│ Tool Executors (Build/Test/Deploy)      │
└─────────────────────────────────────────┘
```

**Decision Matrix**:

- **Single project, simple task**: Direct tool execution via justfile
- **Multi-project, dependency aware**: Nx orchestration via justfile
- **Complex workflows**: Custom Nx executors via justfile
- **AI workflows**: Direct justfile with AI context injection

**Rationale**:

- Supports both simple and complex project structures
- Hides complexity behind simple interfaces
- Preserves Nx power while improving accessibility
- Enables gradual complexity adoption

**Consequences**:

- Flexible architecture supporting diverse use cases
- Consistent interface regardless of underlying complexity
- Easier migration path for existing projects

## ADR-MERGE-008: AI Context Management and Token Optimization

**Decision**: Implement sophisticated AI context management with token budgeting, context window optimization, and learning-based context selection.

**Context Management System**:

```typescript
interface AIContextManager {
  contextSources: {
    specifications: SpecificationContext[];
    codebase: CodebaseContext[];
    patterns: ArchitecturalPattern[];
    history: DecisionHistory[];
    learning: LearnedPatterns[];
  };
  tokenBudget: {
    total: number;
    allocation: {
      current_task: number;
      architectural_context: number;
      historical_patterns: number;
      code_context: number;
    };
  };
  optimization: {
    prioritization: ContextPrioritization;
    compression: ContextCompression;
    caching: IntelligentCaching;
  };
}
```

**Features**:

- **Dynamic Context Selection**: AI-driven selection of most relevant context
- **Token Budget Management**: Automatic allocation based on task complexity
- **Learning Integration**: Historical decisions inform context selection
- **Architecture Awareness**: Hexagonal patterns prioritized in architectural tasks

**Rationale**:

- Maximizes AI effectiveness within token constraints
- Learns optimal context patterns over time
- Supports both quick tasks and complex architectural decisions
- Enables sophisticated AI assistance without token waste

**Consequences**:

- Complex context management implementation required
- Sophisticated AI assistance capabilities
- Need for token usage analytics and optimization
- Foundation for advanced AI-native development workflows

## Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)

- Migrate VibePDK to Copier
- Create hybrid justfile + Nx system
- Implement temporal specification storage

### Phase 2: Integration (Weeks 3-5)

- Port HexDDD generators to Copier templates
- Integrate AI workflows with hexagonal patterns
- Implement basic learning system

### Phase 3: Enhancement (Weeks 6-7)

- Advanced AI context management
- Real-time validation systems
- Predictive suggestion engine

### Phase 4: Optimization (Weeks 8-9)

- Performance optimization
- Learning system refinement
- Comprehensive testing and documentation

## Success Metrics

- **Generation Time**: Project creation < 2 minutes for complex monorepos
- **AI Accuracy**: Architectural suggestions >80% acceptance rate
- **Learning Effectiveness**: Suggestion quality improves >20% over 30 days
- **Developer Productivity**: 50% reduction in time to production-ready architecture
- **Compliance**: 95% automated detection of architectural violations
