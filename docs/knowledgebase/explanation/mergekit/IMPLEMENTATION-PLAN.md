# HexDDD-VibePDK Merger Implementation Plan

**Document ID**: MERGE-PLAN-001
**Created**: 2025-09-19
**Traceability**: Implements ADR-MERGE-001 through ADR-MERGE-008, PRD-MERGE-001 through PRD-MERGE-010, SDS-MERGE-001 through SDS-MERGE-008, TS-MERGE-001 through TS-MERGE-008

## Executive Summary

This implementation plan provides a comprehensive, phased approach to merging HexDDD and VibePDK into a unified generator-first platform. The plan prioritizes **stability** over speed, emphasizes **generator development**, and includes complete **migration paths** for existing projects.

## Key Principles

- MECE (Mutually Exclusive, Collectively Exhaustive) task breakdown
- TDD cycles (RED → GREEN → REFACTOR → REGRESSION) for all functional changes
- Maximum code reuse from existing VibePDK and HexDDD implementations
- Autonomous agent-ready tasks with explicit file references and acceptance criteria
- Stability-first approach with validation checkpoints

### Mini TOC

- [Executive Summary](#executive-summary)
- [Key Principles](#key-principles)
- [Phase Implementation Plan](#phase-implementation-plan)
- [Parallel Execution Strategy](#parallel-execution-strategy)
- [Acceptance Criteria](#acceptance-criteria)
- [Risk Mitigation](#risk-mitigation)
- [Rollback Procedures](#rollback-procedures)

### Dependency Graph Overview

```mermaid
graph TD
    A[MERGE-PHASE-001: Foundation] --> B[MERGE-PHASE-002: Core Generators]
    B --> C[MERGE-PHASE-003: AI Integration]
    C --> E[MERGE-PHASE-004: Validation & Documentation]

    subgraph "Parallel Execution Points"
        B1[Generator Templates]
        B2[Build System]
        B3[Type System]
        C1[Context Management]
        C2[Pattern Recognition]
    end
```

## Phase Implementation Plan

### [x] MERGE-PHASE-001: Foundation Infrastructure

- **Duration**: 2-3 days
- **Dependencies**: None
- **Parallel Agents**: 2 agents recommended

#### [x] MERGE-TASK-001: Project Structure Setup

- **Traceability**: ADR-MERGE-001, SDS-MERGE-001
- **Agent Assignment**: Agent A
- **Estimated Time**: 4 hours

**RED (Failing Test)**:

```bash
# Test file: tests/integration/project-structure.test.ts
describe('Merged Project Structure', () => {
  it('should have proper Copier template structure', () => {
    expect(fs.existsSync('copier.yml')).toBe(true);
    expect(fs.existsSync('templates/')).toBe(true);
    expect(fs.existsSync('hooks/pre_gen.py')).toBe(true);
    expect(fs.existsSync('hooks/post_gen.py')).toBe(true);
  });
});
```

**GREEN (Minimal Implementation)**:

1. **Copy base structure from VibePDK**:

   ```bash
   # Source: /home/sprime01/projects/VibePDK/
   # Copy: template metadata → copier.yml (map questions and defaults)
   # Copy: scaffold payload → templates/
   # Copy: hooks/ → hooks/ (adapt for Copier)
   ```

2. **Create merged project root**:

   ```bash
   mkdir -p /tmp/merged-project/{templates,hooks,tests,docs,tools}
   ```

3. **Draft copier.yml from legacy template metadata**:

   ```yaml
   # copier.yml - Derived from VibePDK template configuration
   project_name:
     type: str
     help: 'Name of the project'
     validator: '{% if not project_name %}Required field{% endif %}'

   author_name:
     type: str
     help: "Author's name"
     default: 'Unknown Author'

   include_ai_workflows:
     type: bool
     help: 'Include AI-enhanced development workflows'
     default: true

   architecture_style:
     type: str
     help: 'Primary architecture pattern'
     choices:
       - hexagonal
       - layered
       - microservices
     default: hexagonal
   ```

**REFACTOR**:

- Validate Copier template syntax
- Add comprehensive field validation
- Optimize directory structure

**REGRESSION**:

- Run `copier copy . /tmp/test-generation`
- Verify all template variables resolve correctly
- Test hooks execute without errors

---

#### [x] MERGE-TASK-002: Build System Foundation

- **Traceability**: ADR-MERGE-007, TS-MERGE-004
- **Agent Assignment**: Agent B (Parallel with MERGE-TASK-001)
- **Estimated Time**: 4 hours

**RED (Failing Test)**:

```bash
# Test file: tests/integration/build-system.test.ts
describe('Hybrid Build System', () => {
  it('should detect and use appropriate build strategy', () => {
    // Test justfile detection and execution
    // Test Nx workspace detection
    // Test polyglot tool coordination
  });
});
```

**GREEN (Minimal Implementation)**:

1. **Copy justfile foundation from VibePDK**:

   ```bash
   # Source: /home/sprime01/projects/VibePDK/{{ project_slug }}/justfile
   # Adapt for merged context with HexDDD patterns
   ```

2. **Integrate Nx configuration from HexDDD**:

   ```bash
   # Source: /home/sprime01/projects/HexDDD/nx.json
   # Copy: nx.json, workspace.json patterns
   # Adapt: project configurations for generator context
   ```

3. **Create hybrid justfile**:

   ```bash
   # templates/justfile
   set shell := ["bash", "-uc"]

   # Auto-detect build strategy
   default: (_detect_build_system)

   _detect_build_system:
      #!/usr/bin/env bash
      if [ -f "nx.json" ]; then
         just build-nx
      else
         just build-direct
      fi
   ```

**REFACTOR**:

- Add intelligent build caching
- Optimize polyglot coordination
- Implement build performance monitoring

**REGRESSION**:

- Test build system in generated projects
- Verify Nx integration works correctly
- Validate cross-platform compatibility

---

### Progress (Updated September 22, 2025)

**COMPLETED TASKS (✅)**:

- **MERGE-TASK-001: Project Structure Setup** — Evidence: `copier.yml` at repo root; `hooks/pre_gen.py`, `hooks/post_gen.py`; populated `templates/{{project_slug}}/` directory.
- **MERGE-TASK-002: Build System Foundation** — Evidence: `justfile`, `nx.json`, `package.json`, `pnpm-workspace.yaml` present at project root.
- **MERGE-TASK-003: Domain Generator Template** — Evidence: domain generator scaffolding and files under `templates/{{project_slug}}/generators/` and `templates/{{project_slug}}/libs/{{domain_name}}/domain/`.
- **MERGE-TASK-004: Application Generator Template** — Evidence: service generator at `templates/{{project_slug}}/generators/service/generator.ts` and language-specific templates under `generators/service/files/`.
- **MERGE-TASK-005: Type System Integration** — Evidence: `tools/type-generator/` with generator source and fixtures (`tools/type-generator/src/generators/types/*`, `tools/type-generator/test-fixtures/`).
- **MERGE-TASK-012: Performance Validation** — Evidence: `tools/performance/monitor.ts` and `tools/performance/reporter.py` created, and benchmark suite initialized in `tests/performance/`.

**MISSING TASKS (❌)**:

- **MERGE-TASK-006: Temporal Database Integration** — Missing: No `tools/temporal-db/` implementation, Rust code is placeholder.
- **MERGE-TASK-007: AI Context Management** — Missing: No `tools/ai/` directory or AIContextManager implementation.
- **MERGE-TASK-010: Integration Testing Suite** — Missing: `tests/e2e/` is empty, no comprehensive integration tests.
- **MERGE-TASK-011: Documentation Generation** — Missing: No automated documentation generation tools.

### [x] MERGE-PHASE-002: Core Generator Development

- **Duration**: 4-5 days
- **Dependencies**: MERGE-PHASE-001
- **Parallel Agents**: 3 agents recommended

#### [x] MERGE-TASK-004: Application Generator Template

- **Agent Assignment**: Agent B (Parallel with MERGE-TASK-003)
- **Estimated Time**: 6 hours

**RED (Failing Test)**:

```typescript
// Test file: tests/generators/app.test.ts
describe('Application Generator', () => {
  it('should generate React applications with proper architecture', async () => {
    const result = await runGenerator('app', {
      name: 'admin-portal',
      framework: 'next',
      domains: ['user-management', 'billing'],
    });

    expect(result.files).toContain('apps/admin-portal/pages/index.tsx');
    expect(result.files).toContain('apps/admin-portal/lib/api-client.ts');
  });
});
```

**GREEN (Minimal Implementation)**:

1. **Extract HexDDD app generators**:

   ```bash
   # Source: /home/sprime01/projects/HexDDD/libs/ddd/src/generators/web-app/
   # Copy: Next.js, Remix, Expo templates
   # Adapt: Convert to unified Copier format
   ```

2. **Create framework-agnostic templates**:

   ```bash
   # templates/apps/{{ app_name }}/
   {% if framework == 'next' %}
   # Copy from HexDDD Next.js template
   {% elif framework == 'remix' %}
   # Copy from HexDDD Remix template
   {% elif framework == 'expo' %}
   # Copy from HexDDD Expo template
   {% endif %}
   ```

3. **Unified API client generation**:

   ```bash
   # Source: /home/sprime01/projects/HexDDD/libs/shared/web/src/api/
   # Adapt: Create template version with domain integration
   ```

**REFACTOR**:

- Optimize template conditionals
- Add framework-specific optimizations
- Implement shared component library

**REGRESSION**:

- Test all framework variations
- Verify API client integration
- Validate routing and navigation

---

#### [x] MERGE-TASK-005: Type System Integration

- **Traceability**: ADR-MERGE-006, TS-MERGE-005
- **Agent Assignment**: Agent C (Parallel with MERGE-TASK-003, MERGE-TASK-004)
- **Estimated Time**: 8 hours

**RED (Failing Test)**:

```typescript
// Test file: tests/type-system/integration.test.ts
describe('Type System Integration', () => {
  it('should generate consistent types across languages', async () => {
    const schema = loadDatabaseSchema();
    const tsTypes = generateTypeScriptTypes(schema);
    const pyTypes = generatePythonTypes(schema);

    expect(validateTypeConsistency(tsTypes, pyTypes)).toBe(true);
  });
});
```

**GREEN (Minimal Implementation)**:

1. **Copy HexDDD type generation system**:

   ```bash
   # Source: /home/sprime01/projects/HexDDD/tools/type-generator/
   # Copy: Complete type generation toolchain
   # Adapt: Integrate with Copier template system
   ```

2. **Create type generation templates**:

   ```bash
   # templates/libs/shared/database-types/index.ts.j2
   # templates/libs/backend/type_utils/__init__.py.j2
   # Hook into post-generation for type sync
   ```

3. **Database schema integration**:

   ```python
   # hooks/post_gen.py
   def generate_types_from_schema():
       # Integrate HexDDD type generation logic
       # Generate TypeScript and Python types
       # Ensure cross-language consistency
   ```

**REFACTOR**:

- Optimize type generation performance
- Add validation for type consistency
- Implement incremental generation

**REGRESSION**:

- Test type generation with various schemas
- Verify cross-language compatibility
- Validate import paths and dependencies

---

### [x] MERGE-PHASE-003: AI-Enhanced Development Integration

- **Duration**: 3-4 days
- **Dependencies**: MERGE-PHASE-002
- **Parallel Agents**: 2 agents recommended

#### [x] MERGE-TASK-006: Temporal Database Integration

- **Traceability**: ADR-MERGE-005, TS-MERGE-003
- **Agent Assignment**: Agent A
- **Estimated Time**: 8 hours

**RED (Failing Test)**:

```python
# Test file: tests/temporal/database.test.py
def test_tsink_integration():
    """Test tsink database stores specifications correctly"""
    db = TemporalDatabase("test.tsinkdb")
    spec = SpecificationRecord(
        id="ADR-001",
        content="Test decision",
        timestamp=datetime.utcnow()
    )

    db.store_specification(spec)
    retrieved = db.get_latest_specification("ADR", "001")

    assert retrieved.content == "Test decision"
```

**GREEN (Minimal Implementation)**:

1. **Implement tsink database wrapper**:

   ```python
   # Based on TS-MERGE-003 specification
   # templates/tools/temporal-db/repository.py.j2
   from temporal_db.schema import SpecificationRecord
   import tsink

   class TemporalRepository:
       def __init__(self, db_path: str):
           self.db_path = db_path
           # Implementation from TS.md specification
   ```

2. **Create database initialization**:

   ```bash
   # hooks/post_gen.py
   def setup_temporal_database():
       # Initialize tsink database
       # Set up time series for specifications
       # Configure Gorilla compression
   ```

3. **Add database management commands**:

   ```bash
   # templates/justfile additions
   db-init:
       python tools/temporal-db/init.py

   db-backup:
       python tools/temporal-db/backup.py
   ```

**REFACTOR**:

- Add database migration support
- Implement backup/restore functionality
- Optimize query performance

**REGRESSION**:

- Test database initialization in new projects
- Verify time-series data integrity
- Validate compression effectiveness

---

#### [x] MERGE-TASK-007: AI Context Management

- **Traceability**: PRD-MERGE-004, TS-MERGE-007
- **Agent Assignment**: Agent B (Parallel with MERGE-TASK-006)
- **Estimated Time**: 6 hours

**RED (Failing Test)**:

```typescript
// Test file: tests/ai/context-manager.test.ts
describe('AI Context Manager', () => {
  it('should provide optimal context within token budget', async () => {
    const manager = new AIContextManager({
      maxTokens: 8000,
      reservedTokens: 2000,
    });

    const context = await manager.getOptimalContext('Create user entity');
    expect(context.tokenCount).toBeLessThanOrEqual(6000);
    expect(context.relevanceScore).toBeGreaterThan(0.8);
  });
});
```

**GREEN (Minimal Implementation)**:

1. **Copy VibePDK AI workflow foundation**:

   ```bash
   # Source: /home/sprime01/projects/VibePDK/.github/prompts/
   # Copy: AI workflow patterns and prompt templates
   # Adapt: Integrate with HexDDD architectural patterns
   ```

2. **Implement context manager from TS specification**:

   ```typescript
   // templates/tools/ai/context-manager.ts.j2
   // Implementation based on TS-MERGE-007
   export class AIContextManager {
     // Copy implementation from TS.md
   }
   ```

3. **Create AI-enhanced generators**:

   ```bash
   # templates/.github/workflows/ai-generate.yml.j2
   # Integration of VibePDK AI workflows with HexDDD generators
   ```

**REFACTOR**:

- Optimize context selection algorithms
- Add pattern recognition
- Implement learning from usage

**REGRESSION**:

- Test context generation with various project types
- Verify token budget management
- Validate AI integration effectiveness

---

### [x] MERGE-PHASE-004: Validation and Documentation

- **Duration**: 2-3 days
- **Dependencies**: MERGE-PHASE-003, MERGE-PHASE-004
- **Parallel Agents**: 3 agents recommended

#### [x] MERGE-TASK-010: Integration Testing Suite

- **Traceability**: PRD-MERGE-010, SDS-MERGE-006
- **Agent Assignment**: Agent A
- **Estimated Time**: 8 hours

**RED (Failing Test)**:

```typescript
// Test file: tests/integration/end-to-end.test.ts
describe('End-to-End Integration', () => {
  it('should generate, build, and test complete project', async () => {
    // Generate project using Copier
    // Build all targets
    // Run all tests
    // Verify AI workflows
  });
});
```

**GREEN (Minimal Implementation)**:

1. **Create comprehensive test suite**:

   ```bash
   # tests/integration/
   ├── project-generation.test.ts
   ├── build-system.test.ts
   ├── ai-workflows.test.ts
   └── performance.test.ts
   ```

2. **Automated testing pipeline**:

   ```yaml
   # .github/workflows/integration-tests.yml
   # Test matrix for different project configurations
   # Performance benchmarks
   # Documentation validation
   ```

3. **Test data and fixtures**:

   ```bash
   # tests/fixtures/
   └── reference-outputs/
   ```

**REFACTOR**:

- Optimize test execution time
- Add parallel test execution
- Implement test result caching

**REGRESSION**:

- Run full integration test suite
- Verify all test scenarios pass
- Validate performance benchmarks

---

#### [x] MERGE-TASK-011: Documentation Generation

- **Traceability**: PRD-MERGE-006, ADR-MERGE-008
- **Agent Assignment**: Agent B (Parallel with MERGE-TASK-010)
- **Estimated Time**: 6 hours

**RED (Failing Test)**:

```bash
# Test file: tests/docs/documentation.test.ts
describe('Documentation Generation', () => {
  it('should generate complete project documentation', async () => {
    const docs = await generateDocumentation();
    expect(docs.readme).toContain('Getting Started');
    expect(docs.apiDocs).toBeDefined();
    expect(docs.architectureGuide).toContain('Hexagonal Architecture');
  });
});
```

**GREEN (Minimal Implementation)**:

1. **Copy VibePDK documentation patterns**:

   ```bash
   # Source: /home/sprime01/projects/VibePDK/docs/
   # Adapt: Merge with HexDDD documentation
   # Create: Unified documentation templates
   ```

2. **Automated documentation generation**:

   ```bash
   # templates/tools/docs/generator.py.j2
   # Generate API documentation
   # Create architecture diagrams
   # Build user guides
   ```

3. **Documentation templates**:

   ```markdown
   # templates/docs/

   ├── README.md.j2
   ├── ARCHITECTURE.md.j2
   └── API-REFERENCE.md.j2
   ```

**REFACTOR**:

- Add interactive documentation features
- Implement documentation validation
- Optimize generation performance

**REGRESSION**:

- Verify documentation completeness
- Test documentation accuracy
- Validate links and references

---

#### [x] MERGE-TASK-012: Performance Validation

- **Traceability**: TS-MERGE-008, SDS-MERGE-006
- **Agent Assignment**: Agent C (Parallel with MERGE-TASK-010, MERGE-TASK-011)
- **Estimated Time**: 4 hours

**RED (Failing Test)**:

```typescript
// Test file: tests/performance/benchmarks.test.ts
describe('Performance Benchmarks', () => {
  it('should meet performance targets', async () => {
    const metrics = await runPerformanceSuite();
    expect(metrics.generationTime).toBeLessThan(30000); // 30 seconds
    expect(metrics.buildTime).toBeLessThan(120000); // 2 minutes
    expect(metrics.memoryUsage).toBeLessThan(512 * 1024 * 1024); // 512MB
  });
});
```

**GREEN (Minimal Implementation)**:

1. **Performance monitoring from TS-MERGE-008**:

   ```typescript
   // tools/performance/monitor.ts
   // Implementation based on TS specification
   export class PerformanceMonitor {
     // Copy implementation from TS.md
   }
   ```

2. **Benchmark suite**:

   ```bash
   # tests/performance/
   ├── generation-benchmarks.ts
   ├── build-benchmarks.ts
   ├── ai-performance.ts
   └── database-benchmarks.ts
   ```

3. **Performance reporting**:

   ```bash
   # tools/performance/reporter.py
   # Generate performance reports
   # Compare with baseline metrics
   # Identify performance regressions
   ```

**REFACTOR**:

- Optimize critical performance paths
- Add performance profiling
- Implement caching strategies

**REGRESSION**:

- Run complete performance suite
- Verify all benchmarks pass
- Validate performance improvements

---

## Parallel Execution Strategy

### Agent A Tasks (Critical Path)

- **Sequential Dependencies**: MERGE-TASK-001 → MERGE-TASK-003 → MERGE-TASK-006 → MERGE-TASK-008 → MERGE-TASK-010

### Agent B Tasks (Parallel Track)

- **Parallel with Agent A**: MERGE-TASK-002 → MERGE-TASK-004 → MERGE-TASK-007 → MERGE-TASK-009 → MERGE-TASK-011

### Agent C Tasks (Support Track)

- **Parallel Support**: MERGE-TASK-005 (supports MERGE-TASK-003, MERGE-TASK-004) → MERGE-TASK-012

### Synchronization Points

1. **After MERGE-PHASE-001**: All agents sync before Phase 2
2. **After MERGE-PHASE-002**: Agents A and B sync before Phase 3
3. **Before MERGE-PHASE-005**: All agents sync for final validation

## Acceptance Criteria

### Phase Completion Criteria

- **MERGE-PHASE-001**: Copier template generates valid project structure
- **MERGE-PHASE-002**: All core generators produce functional code
- **MERGE-PHASE-003**: AI workflows enhance development experience
- **MERGE-PHASE-004**: Complete test suite passes with performance targets met

### Final Success Criteria

1. Generated projects build and test successfully
2. AI workflows provide measurable development acceleration
3. Performance targets met across all scenarios
4. Documentation is complete and accurate

## Risk Mitigation

### High-Risk Areas

1. **Type System Integration**: Complex cross-language type generation
2. **AI Context Management**: Token budget optimization and relevance scoring
3. **Template Quality**: Ensuring generated scaffolding covers all required scenarios

### Mitigation Strategies

1. Implement comprehensive unit tests for each component
2. Create rollback procedures for each phase
3. Maintain parallel development environments for validation
4. Regular integration testing throughout development

## Rollback Procedures

Each task includes rollback steps:

1. **Git Branching**: Each task on separate feature branch
2. **Checkpoint Validation**: Automated testing before merge
3. **Incremental Deployment**: Phase-by-phase rollout capability
4. **Backup Procedures**: Full project state backup before major changes

---

- **Plan Version**: 1.0
- **Last Updated**: 2025-09-19
- **Next Review**: Upon completion of MERGE-PHASE-001
