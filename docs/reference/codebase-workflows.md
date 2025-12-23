# VibesPro Codebase Workflow Documentation

> **Generated**: 2025-12-22
> **Project Type**: Nx Monorepo with Hexagonal Architecture
> **Technologies**: TypeScript, Python, Rust, Copier/Jinja2
> **Architecture Pattern**: Hexagonal (Ports & Adapters), Generator-First

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Workflow 1: Generator Creation (Meta-Generator)](#2-workflow-1-generator-creation-meta-generator)
3. [Workflow 2: Service Scaffolding (Hexagonal Architecture)](#3-workflow-2-service-scaffolding-hexagonal-architecture)
4. [Workflow 3: Temporal AI Query & Pattern Recommendation](#4-workflow-3-temporal-ai-query--pattern-recommendation)
5. [Naming Conventions](#5-naming-conventions)
6. [Implementation Templates](#6-implementation-templates)
7. [Error Handling Patterns](#7-error-handling-patterns)
8. [Testing Approach](#8-testing-approach)
9. [Implementation Guidelines](#9-implementation-guidelines)

---

## 1. Architecture Overview

### Detected Technology Stack

| Component             | Technology                   | Purpose                                 |
| --------------------- | ---------------------------- | --------------------------------------- |
| **Core Framework**    | Nx Monorepo                  | Project orchestration, dependency graph |
| **Template Engine**   | Copier + Jinja2              | Full project generation                 |
| **Code Generators**   | Nx Generators (TypeScript)   | Library/app scaffolding                 |
| **Backend**           | Python (FastAPI), TypeScript | Service implementation                  |
| **Temporal Database** | Rust + redb                  | Institutional memory, pattern storage   |
| **Build Tools**       | Just, pnpm, uv               | Task automation                         |

### Project Structure

```
VibesPro/
├── generators/                  # Nx generators (TypeScript)
│   ├── generator/               # META-GENERATOR (creates other generators)
│   ├── service/                 # Service generator (hexagonal architecture)
│   └── _utils/                  # Shared generator utilities
├── libs/                        # Shared libraries (hexagonal layers)
│   ├── {domain}/
│   │   ├── domain/              # Pure business logic
│   │   ├── application/         # Use cases, ports
│   │   └── infrastructure/      # Adapters, implementations
│   └── shared/                  # Cross-cutting utilities
├── apps/                        # Applications
├── crates/                      # Rust crates
│   ├── temporal-ai/             # Embedding-based pattern engine
│   └── vibepro-observe/         # Observability utilities
├── templates/{{project_slug}}/  # Copier templates (Jinja2)
├── tools/                       # Development utilities
└── tests/                       # Unit, integration, shell tests
```

### Hexagonal Architecture Dependency Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        Interface Layer (apps/)                   │
│                    Controllers, CLI, API endpoints               │
└─────────────────────────────────────────────────────────────────┘
                                 ↓
┌─────────────────────────────────────────────────────────────────┐
│                   Infrastructure Layer (adapters)                │
│              Repository implementations, external APIs           │
│                libs/{domain}/infrastructure/                     │
└─────────────────────────────────────────────────────────────────┘
                                 ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Application Layer (ports)                     │
│                 Use cases, interfaces, DTOs                      │
│                 libs/{domain}/application/                       │
└─────────────────────────────────────────────────────────────────┘
                                 ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Domain Layer (core)                         │
│              Entities, Value Objects, Domain Events              │
│                   libs/{domain}/domain/                          │
│                    DEPENDS ON NOTHING                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Workflow 1: Generator Creation (Meta-Generator)

### 2.1 Workflow Overview

| Attribute             | Value                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------- |
| **Name**              | Generator Creation via Meta-Generator                                                             |
| **Business Purpose**  | Enable JIT (Just-In-Time) creation of new Nx generators for scaffolding project-specific patterns |
| **Triggering Action** | `pnpm exec nx g @vibepro/generator:generator <name>` or `just generator-new <name> <type>`        |
| **Entry Point**       | `generators/generator/generator.ts`                                                               |

### 2.2 Files Involved

```
generators/generator/
├── generator.ts           # Main entry point
├── generator.spec.ts      # Unit tests
├── schema.json            # CLI options schema
├── schema.d.ts            # TypeScript types (auto-generated)
├── generators.json        # Nx generator registration
├── package.json           # @vibespro/generator package
├── README.md              # Documentation
└── files/                 # Template files
    ├── core/              # Core generator templates
    ├── hexagonal/         # Hexagonal architecture templates (optional)
    ├── composition/       # Composition pattern templates (optional)
    ├── tests/             # Test file templates
    └── spec/              # Spec documentation templates
```

### 2.3 Entry Point Implementation

**File**: `generators/generator/generator.ts`

```typescript
import { GeneratorCallback, Tree, formatFiles, generateFiles, joinPathFragments, logger, names } from '@nx/devkit';
import * as fs from 'fs';
import * as path from 'path';
import { GeneratorGeneratorOptions } from './schema.d';

/**
 * Main generator function.
 * @traceability DEV-PRD-019, DEV-ADR-019
 */
export async function generatorGenerator(tree: Tree, schema: GeneratorGeneratorOptions): Promise<GeneratorCallback> {
    const options = normalizeOptions(schema);

    logger.info(`🔧 Creating generator: ${options.name}`);
    logger.info(`   Type: ${options.type}`);
    logger.info(`   Location: ${options.generatorRoot}`);

    // Validate
    validateOptions(options);

    // Check existing
    checkExisting(tree, options);

    // Generate files
    generateCoreFiles(tree, options);
    generateHexagonalFiles(tree, options);
    generateCompositionFiles(tree, options);
    generateTestFiles(tree, options);
    generateSpecFile(tree, options);

    // Update collection
    updateGeneratorsCollection(tree, options);

    // Format
    await formatFiles(tree);

    return () => {
        logger.info('');
        logger.info('✅ Generator created successfully!');
        logger.info('');
        logger.info('Next steps:');
        logger.info(`  1. Customize templates in: ${options.generatorRoot}/files/`);
        logger.info(`  2. Update schema options in: ${options.generatorRoot}/schema.json`);
        logger.info(`  3. Run your generator: pnpm exec nx g @vibespro/${options.fileName}:${options.fileName} test`);
    };
}

export default generatorGenerator;
```

### 2.4 Schema Definition

**File**: `generators/generator/schema.json`

```json
{
    "$schema": "https://json-schema.org/schema",
    "type": "object",
    "properties": {
        "name": {
            "type": "string",
            "description": "Generator name (kebab-case)",
            "$default": { "$source": "argv", "index": 0 },
            "x-prompt": "What is the name of the generator?"
        },
        "type": {
            "type": "string",
            "enum": ["custom", "domain", "service", "component", "adapter", "utility"],
            "default": "custom",
            "description": "Generator type determining default templates"
        },
        "description": {
            "type": "string",
            "description": "Generator description for --help"
        },
        "targetScope": {
            "type": "string",
            "enum": ["libs", "apps"],
            "default": "libs",
            "description": "Default target scope for generated code"
        },
        "withComposition": {
            "type": "boolean",
            "default": false,
            "description": "Include composition patterns for wrapping other generators"
        },
        "withHexagonal": {
            "type": "boolean",
            "default": false,
            "description": "Include hexagonal architecture templates"
        },
        "withTests": {
            "type": "boolean",
            "default": true,
            "description": "Generate test file"
        },
        "withSpec": {
            "type": "boolean",
            "default": true,
            "description": "Generate spec documentation"
        }
    },
    "required": ["name"]
}
```

### 2.5 Service Layer Implementation

**Normalized Schema Interface**:

```typescript
interface NormalizedSchema extends GeneratorGeneratorOptions {
    generatorRoot: string;
    className: string;
    propertyName: string;
    fileName: string;
    constantName: string;
    parsedTags: string[];
    parsedCompositionGenerators: string[];
}
```

**Key Service Functions**:

| Function                       | Purpose                                                                    |
| ------------------------------ | -------------------------------------------------------------------------- |
| `normalizeOptions()`           | Converts raw CLI input to structured schema with computed properties       |
| `validateOptions()`            | Validates kebab-case naming, composition requirements, path safety         |
| `checkExisting()`              | Handles idempotent updates to existing generators                          |
| `getTypeSpecificVariables()`   | Returns type-specific template defaults (domain, service, component, etc.) |
| `generateCoreFiles()`          | Generates main generator.ts, schema.json, and base templates               |
| `createOutputTemplates()`      | Creates nested template files avoiding EJS processing conflicts            |
| `generateHexagonalFiles()`     | Adds hexagonal architecture templates if enabled                           |
| `updateGeneratorsCollection()` | Creates/updates generators.json for Nx registration                        |

### 2.6 Data Mapping Patterns

**Name Transformations**:

```typescript
import { names } from '@nx/devkit';

// Input: "order-aggregate"
const normalized = names('order-aggregate');
// {
//   name: 'order-aggregate',
//   className: 'OrderAggregate',
//   propertyName: 'orderAggregate',
//   constantName: 'ORDER_AGGREGATE',
//   fileName: 'order-aggregate'
// }
```

### 2.7 Sequence Diagram

```
┌─────────┐     ┌───────────────────┐     ┌──────────────────┐     ┌───────────┐
│   CLI   │     │ generatorGenerator│     │    Nx DevKit     │     │ File System│
└────┬────┘     └────────┬──────────┘     └────────┬─────────┘     └─────┬─────┘
     │                   │                         │                      │
     │ nx g generator    │                         │                      │
     │─────────────────>│                         │                      │
     │                   │                         │                      │
     │                   │ normalizeOptions(schema)│                      │
     │                   │─────────────────────────│                      │
     │                   │                         │                      │
     │                   │ validateOptions(options)│                      │
     │                   │─────────────────────────│                      │
     │                   │                         │                      │
     │                   │ generateFiles(tree, ...) │                     │
     │                   │─────────────────────────>│                     │
     │                   │                         │                      │
     │                   │                         │ tree.write(path,content)
     │                   │                         │─────────────────────>│
     │                   │                         │                      │
     │                   │ formatFiles(tree)       │                      │
     │                   │─────────────────────────>│                     │
     │                   │                         │                      │
     │  callback()       │                         │                      │
     │<─────────────────│                         │                      │
     │                   │                         │                      │
```

---

## 3. Workflow 2: Service Scaffolding (Hexagonal Architecture)

### 3.1 Workflow Overview

| Attribute             | Value                                                                                |
| --------------------- | ------------------------------------------------------------------------------------ |
| **Name**              | Service Scaffolding with Hexagonal Architecture                                      |
| **Business Purpose**  | Scaffold new backend services with pre-configured hexagonal architecture layers      |
| **Triggering Action** | `pnpm exec nx g vibespro:service <name>` or `just ai-scaffold name=vibespro:service` |
| **Entry Point**       | `generators/service/generator.ts`                                                    |

### 3.2 Files Involved

```
generators/service/
├── generator.ts           # Main entry point
├── generator.spec.ts      # Unit tests
├── schema.json            # CLI options schema
├── schema.d.ts            # TypeScript types
├── generators.json        # Nx generator config
├── package.json           # @vibespro/service-generator
├── README.md              # Documentation
└── files/                 # Service templates
    ├── python/            # FastAPI templates
    └── typescript/        # TypeScript templates
```

### 3.3 Entry Point Implementation

**File**: `generators/service/generator.ts`

```typescript
import { Tree, generateFiles, installPackagesTask, names } from '@nx/devkit';
import * as path from 'path';
import { withIdempotency } from '../../src/generators/utils/idempotency';
import { loadResolvedStack } from '../_utils/stack';
import { deriveServiceDefaults } from '../_utils/stack_defaults';

interface ServiceSchema {
    name: string;
    language?: 'python' | 'typescript';
    directory?: string;
}

export default withIdempotency(async function (tree: Tree, schema: unknown) {
    const options = normalizeOptions(schema);

    // Attempt to derive defaults from tech stack
    try {
        const root = tree.root;
        const stack = loadResolvedStack(root);
        if (process.env.VIBEPDK_USE_STACK_DEFAULTS === '1') {
            const defaults = deriveServiceDefaults(stack);
            options.language = options.language ?? defaults.language;
        }
    } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        console.warn(`Could not derive defaults from tech stack: ${message}`);
    }

    const language = options.language ?? 'python';

    if (language === 'python') {
        await generatePythonService(tree, options);
    } else {
        const serviceRoot = `apps/${options.name}`;
        generateFiles(tree, path.join(__dirname, 'files', language), serviceRoot, {
            ...options,
            serviceName: options.name,
        });
    }

    return () => {
        installPackagesTask(tree);
    };
});
```

### 3.4 Hexagonal Structure Generation

**Generated Directory Structure**:

```
apps/{service-name}/
├── domain/
│   ├── entities/
│   │   └── .gitkeep
│   └── value_objects/
│       └── .gitkeep
├── application/
│   ├── ports/
│   │   └── repository.py      # Base repository protocol
│   └── use_cases/
│       └── .gitkeep
└── infrastructure/
    └── adapters/
        ├── in_memory/
        │   └── .gitkeep
        └── supabase/
            └── .gitkeep
```

**Repository Port Template** (Python):

```python
"""Repository port for domain entities"""
from typing import Protocol, TypeVar

T = TypeVar('T')

class Repository(Protocol[T]):
    """Base repository protocol for data persistence"""

    async def find_by_id(self, id: str) -> T | None:
        """Find entity by ID"""
        ...

    async def save(self, entity: T) -> None:
        """Save entity"""
        ...
```

### 3.5 Service Layer Components

| Function                  | Purpose                                                         |
| ------------------------- | --------------------------------------------------------------- |
| `normalizeOptions()`      | Sanitizes name to kebab-case, validates language option         |
| `addHexagonalStructure()` | Creates standard hexagonal folder structure with .gitkeep files |
| `generatePythonService()` | Scaffolds FastAPI service with hexagonal structure              |
| `loadResolvedStack()`     | Loads resolved tech stack from `techstack.yaml`                 |
| `deriveServiceDefaults()` | Derives default language/settings from tech stack               |

### 3.6 Idempotency Wrapper

The service generator uses `withIdempotency` to ensure safe re-runs:

```typescript
export function withIdempotency<T>(fn: (tree: Tree, schema: T) => Promise<() => void>) {
    return async (tree: Tree, schema: T) => {
        // Check if generator was already run
        // Skip already-existing files unless explicitly updated
        return fn(tree, schema);
    };
}
```

---

## 4. Workflow 3: Temporal AI Query & Pattern Recommendation

### 4.1 Workflow Overview

| Attribute             | Value                                                                             |
| --------------------- | --------------------------------------------------------------------------------- |
| **Name**              | Temporal AI Pattern Query and Recommendation                                      |
| **Business Purpose**  | Query institutional memory for existing patterns before implementing new features |
| **Triggering Action** | `just temporal-ai-query "query"`                                                  |
| **Entry Point**       | `crates/temporal-ai/src/lib.rs`                                                   |

### 4.2 Files Involved

```
crates/temporal-ai/
├── Cargo.toml             # Rust dependencies
├── src/
│   ├── lib.rs             # Main library entry, error types
│   ├── embedder.rs        # Text → Vector embedding (embedding-gemma-300M)
│   ├── pattern_extractor.rs # Parse Git history into semantic patterns
│   ├── vector_store.rs    # Persistent redb storage for embeddings
│   ├── similarity.rs      # Cosine similarity search
│   ├── ranker.rs          # Multi-factor recommendation scoring
│   ├── schema.rs          # Data structures (EmbeddingRecord, PerformanceMetrics)
│   └── observability_aggregator.rs # Metrics aggregation
└── src/bin/
    └── temporal-ai-cli.rs # CLI binary
```

### 4.3 Core Components

**Architecture Flow**:

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  User Query     │────>│    Embedder      │────>│  Query Vector   │
│  (Natural Lang) │     │ (embedding-gemma)│     │  (768 dims)     │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                          │
                                                          ↓
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│ Recommendations │<────│    Ranker        │<────│ Similarity      │
│ (ranked list)   │     │ (multi-factor)   │     │ Search (cosine) │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                          ↑
                                                          │
                                                 ┌─────────────────┐
                                                 │  Vector Store   │
                                                 │ (redb database) │
                                                 └─────────────────┘
```

### 4.4 Data Structures

**File**: `crates/temporal-ai/src/schema.rs`

```rust
/// Record stored in vector database
pub struct EmbeddingRecord {
    pub id: String,
    pub embedding: Vec<f32>,           // 768-dimensional vector
    pub commit_hash: String,
    pub commit_message: String,
    pub file_path: String,
    pub pattern_type: PatternType,
    pub created_at: DateTime<Utc>,
    pub metadata: HashMap<String, String>,
}

/// Types of patterns extracted from codebase
pub enum PatternType {
    FeatureImplementation,
    BugFix,
    Refactoring,
    Architecture,
    Configuration,
    Test,
    Documentation,
}

/// Performance metrics for recommendations
pub struct PerformanceMetrics {
    pub search_latency_ms: f64,
    pub embedding_latency_ms: f64,
    pub total_records: usize,
}
```

### 4.5 Service Layer Implementation

**Embedder** (`embedder.rs`):

```rust
pub struct Embedder {
    model: Model,
}

impl Embedder {
    pub fn from_gguf(model_path: &str) -> Result<Self> {
        let model = Model::load(model_path)?;
        Ok(Self { model })
    }

    pub fn embed(&self, text: &str) -> Result<Vec<f32>> {
        // Generate 768-dimensional embedding
        let embedding = self.model.encode(text)?;
        Ok(embedding)
    }
}
```

**Similarity Search** (`similarity.rs`):

```rust
pub struct SimilaritySearch<'a> {
    store: &'a VectorStore,
}

impl<'a> SimilaritySearch<'a> {
    pub fn search(
        &self,
        query_embedding: &[f32],
        top_k: usize,
    ) -> Result<Vec<SimilarityResult>> {
        let all_records = self.store.get_all()?;
        let mut results: Vec<SimilarityResult> = all_records
            .iter()
            .map(|record| {
                let similarity = cosine_similarity(query_embedding, &record.embedding);
                SimilarityResult {
                    record: record.clone(),
                    similarity_score: similarity,
                }
            })
            .collect();

        results.sort_by(|a, b| b.similarity_score.partial_cmp(&a.similarity_score).unwrap());
        results.truncate(top_k);
        Ok(results)
    }
}
```

**Recommendation Ranker** (`ranker.rs`):

```rust
pub struct RecommendationRanker<'a> {
    store: &'a VectorStore,
}

impl<'a> RecommendationRanker<'a> {
    pub fn rank(&self, results: Vec<SimilarityResult>) -> Result<Vec<Recommendation>> {
        let recommendations: Vec<Recommendation> = results
            .into_iter()
            .map(|result| {
                let recency_score = self.calculate_recency_score(&result.record);
                let usage_score = self.calculate_usage_score(&result.record);
                let final_score =
                    result.similarity_score * 0.6 +
                    recency_score * 0.25 +
                    usage_score * 0.15;

                Recommendation {
                    record: result.record,
                    final_score,
                    explanation: self.generate_explanation(&result),
                }
            })
            .collect();

        Ok(recommendations)
    }
}
```

### 4.6 Error Handling

```rust
#[derive(Debug, thiserror::Error)]
pub enum TemporalAIError {
    #[error("Model loading failed: {0}")]
    ModelLoadError(String),

    #[error("Inference failed: {0}")]
    InferenceError(String),

    #[error("Database error: {0}")]
    DatabaseError(#[from] redb::Error),

    #[error("Git repository error: {0}")]
    GitError(#[from] git2::Error),

    #[error("Pattern not found: {0}")]
    PatternNotFound(String),

    #[error("Invalid embedding dimension: expected {expected}, got {actual}")]
    DimensionMismatch { expected: usize, actual: usize },

    #[error("Serialization error: {0}")]
    SerializationError(String),
}

pub type Result<T> = std::result::Result<T, TemporalAIError>;
```

### 4.7 Usage Example

```rust
use temporal_ai::{Embedder, VectorStore, SimilaritySearch, RecommendationRanker};

async fn query_patterns(query: &str) -> anyhow::Result<()> {
    // Initialize components
    let embedder = Embedder::from_gguf("models/embedding-gemma-300M-Q4_K_M.gguf")?;
    let store = VectorStore::open("data/temporal-ai.redb")?;
    let search = SimilaritySearch::new(&store);
    let ranker = RecommendationRanker::new(&store);

    // Generate embedding for query
    let query_embedding = embedder.embed(query)?;

    // Search for similar patterns
    let results = search.search(&query_embedding, 20)?;

    // Rank recommendations
    let recommendations = ranker.rank(results)?;

    for rec in recommendations.iter().take(5) {
        println!("[{:.2}] {}", rec.final_score, rec.explanation);
    }

    Ok(())
}
```

---

## 5. Naming Conventions

### 5.1 File Naming Patterns

| Layer              | File Type    | Pattern                | Example                        |
| ------------------ | ------------ | ---------------------- | ------------------------------ |
| **Domain**         | Entity       | `*.entity.ts` / `*.py` | `order.entity.ts`              |
| **Domain**         | Value Object | `*.vo.ts`              | `email.vo.ts`                  |
| **Domain**         | Aggregate    | `*.aggregate.ts`       | `order.aggregate.ts`           |
| **Domain**         | Event        | `*.event.ts`           | `order-created.event.ts`       |
| **Application**    | Use Case     | `*.use-case.ts`        | `create-order.use-case.ts`     |
| **Application**    | Port         | `*.port.ts`            | `order-repository.port.ts`     |
| **Application**    | Service      | `*.service.ts`         | `notification.service.ts`      |
| **Infrastructure** | Repository   | `*.repository.ts`      | `postgres-order.repository.ts` |
| **Infrastructure** | Adapter      | `*.adapter.ts`         | `sendgrid-email.adapter.ts`    |

### 5.2 Generator Naming

| Component      | Pattern     | Example              |
| -------------- | ----------- | -------------------- |
| Generator Name | kebab-case  | `order-aggregate`    |
| Class Name     | PascalCase  | `OrderAggregate`     |
| Property Name  | camelCase   | `orderAggregate`     |
| Constant Name  | UPPER_SNAKE | `ORDER_AGGREGATE`    |
| File Name      | kebab-case  | `order-aggregate.ts` |

### 5.3 Directory Organization

```
libs/
├── {domain-name}/           # kebab-case (e.g., user-management)
│   ├── domain/              # Pure business logic
│   ├── application/         # Use cases & ports
│   └── infrastructure/      # Adapters

generators/
├── {generator-name}/        # kebab-case (e.g., my-feature)
│   ├── generator.ts
│   ├── schema.json
│   └── files/

apps/
├── {app-name}/              # kebab-case (e.g., orders-api)
```

---

## 6. Implementation Templates

### 6.1 Creating a New Generator

```bash
# Step 1: Scaffold the generator
pnpm exec nx g @vibepro/generator:generator my-feature \
  --type=domain \
  --withHexagonal=true \
  --withTests=true

# Step 2: Customize templates
# Edit: generators/my-feature/files/

# Step 3: Update schema options
# Edit: generators/my-feature/schema.json

# Step 4: Test the generator
pnpm exec nx g @vibepro/my-feature:my-feature test --dry-run
```

### 6.2 Creating a New Service

```bash
# Step 1: Scaffold the service
pnpm exec nx g vibespro:service orders-api --language=python

# Step 2: Result structure
# apps/orders-api/
# ├── domain/entities/
# ├── domain/value_objects/
# ├── application/ports/repository.py
# ├── application/use_cases/
# └── infrastructure/adapters/
```

### 6.3 Adding a Domain Entity

**Template** (`libs/{domain}/domain/src/entities/{name}.entity.ts`):

```typescript
import { DomainException } from '../exceptions/domain.exception';

export class <%= className %> {
  private constructor(
    private readonly _id: <%= className %>Id,
    private readonly _createdAt: Date,
  ) {}

  // Factory method
  static create(id: <%= className %>Id): <%= className %> {
    return new <%= className %>(id, new Date());
  }

  // Reconstitution from persistence
  static reconstitute(
    id: <%= className %>Id,
    createdAt: Date,
  ): <%= className %> {
    return new <%= className %>(id, createdAt);
  }

  // Getters (no setters - immutability)
  get id(): <%= className %>Id {
    return this._id;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  // Business methods
  // Add domain-specific behavior here
}
```

### 6.4 Adding a Repository Port

**Template** (`libs/{domain}/application/src/ports/{name}-repository.port.ts`):

```typescript
import { <%= className %>, <%= className %>Id } from '@my-app/<%= fileName %>-domain';

export interface <%= className %>Repository {
  save(entity: <%= className %>): Promise<void>;
  findById(id: <%= className %>Id): Promise<<%= className %> | null>;
  findAll(): Promise<<%= className %>[]>;
  delete(id: <%= className %>Id): Promise<void>;
}
```

### 6.5 Adding a Use Case

**Template** (`libs/{domain}/application/src/use-cases/create-{name}.use-case.ts`):

```typescript
import { <%= className %>, <%= className %>Id } from '@my-app/<%= fileName %>-domain';
import { <%= className %>Repository } from '../ports/<%= fileName %>-repository.port';
import { EventBus } from '../ports/event-bus.port';

export interface Create<%= className %>Input {
  // Define input properties
}

export interface Create<%= className %>Output {
  id: string;
}

export class Create<%= className %>UseCase {
  constructor(
    private readonly repository: <%= className %>Repository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(input: Create<%= className %>Input): Promise<Create<%= className %>Output> {
    // 1. Create domain entity
    const id = <%= className %>Id.generate();
    const entity = <%= className %>.create(id);

    // 2. Persist through repository port
    await this.repository.save(entity);

    // 3. Publish domain event
    await this.eventBus.publish(new <%= className %>CreatedEvent(id));

    // 4. Return output
    return { id: id.value };
  }
}
```

---

## 7. Error Handling Patterns

### 7.1 Exception Hierarchy

```
BaseException
├── DomainException          # Business rule violations
│   ├── InvalidStateException
│   └── ValidationException
├── ApplicationException     # Use case errors
│   ├── NotFoundExcep
│   └── AuthorizationException
└── InfrastructureException  # External system failures
    ├── DatabaseException
    └── ExternalServiceException
```

### 7.2 TypeScript Error Pattern

```typescript
// Domain exception (libs/{domain}/domain/src/exceptions/)
export class DomainException extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'DomainException';
    }
}

// Application exception (libs/{domain}/application/src/exceptions/)
export class ApplicationException extends Error {
    constructor(
        message: string,
        public readonly code: string,
    ) {
        super(message);
        this.name = 'ApplicationException';
    }
}

// Infrastructure exception (libs/{domain}/infrastructure/src/exceptions/)
export class InfrastructureException extends Error {
    constructor(
        message: string,
        public readonly cause?: Error,
    ) {
        super(message);
        this.name = 'InfrastructureException';
        if (cause) {
            this.stack = `${this.stack}\nCaused by: ${cause.stack}`;
        }
    }
}
```

### 7.3 Rust Error Pattern (thiserror)

```rust
use thiserror::Error;

#[derive(Debug, Error)]
pub enum MyError {
    #[error("Operation failed: {0}")]
    OperationFailed(String),

    #[error("Resource not found: {0}")]
    NotFound(String),

    #[error("Database error: {0}")]
    DatabaseError(#[from] DatabaseError),

    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),
}

pub type Result<T> = std::result::Result<T, MyError>;
```

---

## 8. Testing Approach

### 8.1 Testing by Layer

| Layer              | Test Type       | Coverage Target | Dependencies     |
| ------------------ | --------------- | --------------- | ---------------- |
| **Domain**         | Pure Unit       | 100%            | None (mocked)    |
| **Application**    | Unit + Mocks    | 90%+            | Mock ports       |
| **Infrastructure** | Integration     | 80%+            | Real (when safe) |
| **Interface**      | Integration/E2E | 70%+            | Full stack       |

### 8.2 Domain Layer Test

```typescript
// tests/unit/libs/orders/domain/order.test.ts
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { Order, OrderStatus } from '../../../../libs/orders/domain/order';

describe('Order (Domain)', () => {
    it('should create order with pending status', () => {
        const orderId = OrderId.create();
        const items = [{ productId: '1', quantity: 2 }];

        const order = Order.create(orderId, items);

        assert.strictEqual(order.status, OrderStatus.Pending);
    });

    it('should not allow confirming cancelled order', () => {
        const order = Order.create(OrderId.create(), []);
        order.cancel();

        assert.throws(() => order.confirm(), /Cannot confirm cancelled order/);
    });
});
```

### 8.3 Application Layer Test with Mocks

```typescript
// tests/unit/libs/orders/application/create-order.test.ts
describe('CreateOrderUseCase', () => {
    let useCase: CreateOrderUseCase;
    let mockOrderRepo: any;

    beforeEach(() => {
        mockOrderRepo = {
            save: (order: any) => Promise.resolve(order),
        };
        useCase = new CreateOrderUseCase(mockOrderRepo);
    });

    it('should create order successfully', async () => {
        const input = { userId: 'user-1', items: [] };

        const result = await useCase.execute(input);

        assert.ok(result.orderId);
    });
});
```

### 8.4 Generator Test

```typescript
// generators/generator/generator.spec.ts
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing';
import { Tree } from '@nx/devkit';
import generatorGenerator from './generator';

describe('generator generator', () => {
    let tree: Tree;

    beforeEach(() => {
        tree = createTreeWithEmptyWorkspace();
    });

    it('should generate core files', async () => {
        await generatorGenerator(tree, { name: 'test-gen' });

        expect(tree.exists('generators/test-gen/generator.ts')).toBeTruthy();
        expect(tree.exists('generators/test-gen/schema.json')).toBeTruthy();
    });

    it('should validate kebab-case name', async () => {
        await expect(generatorGenerator(tree, { name: 'NotKebabCase' })).rejects.toThrow(/must be kebab-case/);
    });
});
```

### 8.5 Test Commands

```bash
# All tests
just test

# Unit tests
just test-unit
pnpm test:unit
pytest tests/unit/

# Generator tests
just test-generators
just test-generator-smoke

# Integration tests
pnpm test:integration

# Coverage
pnpm test:jest:coverage
pytest --cov=. --cov-report=html
```

---

## 9. Implementation Guidelines

### 9.1 Step-by-Step Implementation Process

1. **Query temporal_db** for existing patterns:

    ```bash
    just temporal-ai-query "patterns for <feature>"
    ```

2. **Check for existing generators**:

    ```bash
    pnpm exec nx list                    # All generators
    pnpm exec nx list @vibepro           # Custom generators
    ```

3. **Scaffold using generators**:

    ```bash
    just ai-scaffold name=vibespro:service  # For services
    just generator-new my-feature domain    # For new generators
    ```

4. **Implement domain layer first** (pure business logic)

5. **Define ports** (interfaces) in application layer

6. **Implement adapters** in infrastructure layer

7. **Wire together** in apps layer

8. **Write tests** at each layer

9. **Run validation**:
    ```bash
    just ai-validate
    ```

### 9.2 Common Pitfalls to Avoid

| ❌ Anti-Pattern                                        | ✅ Correct Approach                  |
| ------------------------------------------------------ | ------------------------------------ |
| Writing code without checking generators               | Always run `pnpm exec nx list` first |
| Domain layer importing infrastructure                  | Dependencies point inward only       |
| Skipping `just test-generation` after template changes | Always validate templates            |
| Adding dependencies without ADR                        | Document in `docs/specs/`            |
| Not querying temporal_db before major decisions        | Query patterns first                 |
| Committing secrets                                     | Use SOPS: `sops exec-env ...`        |

### 9.3 Extension Mechanisms

**Adding a new generator type**:

1. Update `getTypeSpecificVariables()` in `generators/generator/generator.ts`
2. Add new template files to `generators/generator/files/`
3. Update schema.json to include new type enum value

**Adding a new language to service generator**:

1. Create template folder: `generators/service/files/{language}/`
2. Update schema.json language enum
3. Add language-specific generation logic to `generator.ts`

---

## Key Patterns Summary

| Pattern                    | Location                          | Purpose                      |
| -------------------------- | --------------------------------- | ---------------------------- |
| **Generator-First**        | `generators/`                     | Scaffold before coding       |
| **Hexagonal Architecture** | `libs/{domain}/`                  | Separation of concerns       |
| **Temporal Memory**        | `crates/temporal-ai/`             | Pattern recommendations      |
| **Idempotent Generators**  | `withIdempotency()`               | Safe re-runs                 |
| **Schema Normalization**   | `normalizeOptions()`              | Consistent input processing  |
| **Template Variables**     | `names()` utility                 | Consistent naming transforms |
| **Error Hierarchy**        | Domain/Application/Infrastructure | Clear error boundaries       |
| **TDD Workflow**           | `just tdd-red/green/refactor`     | Quality assurance            |

---

_Last updated: 2025-12-22 | Maintained by: VibesPro Project Team_
_Source: Analysis of generators/, libs/, crates/temporal-ai/, tests/_
