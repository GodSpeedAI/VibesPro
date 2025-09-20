# Technical Specification: HexDDD-VibePDK Generator-First Integration

**Status**: Proposed
**Date**: 2025-09-19
**Technical ID**: TS-MERGE-001
**Matrix IDs**: [TS-MERGE-001, TS-MERGE-002, TS-MERGE-003, TS-MERGE-004, TS-MERGE-005, TS-MERGE-006, TS-MERGE-007, TS-MERGE-008]

## Technical Architecture Overview

This document provides detailed technical specifications for implementing the HexDDD-VibePDK merger using a generator-first integration approach.

## TS-MERGE-001: Copier Template Engine Implementation

**Technology Stack**:

- **Template Engine**: Copier 9.0+
- **Templating Language**: Jinja2 with custom extensions
- **Configuration**: YAML with JSON Schema validation
- **Update Strategy**: Git-based with smart conflict resolution

**Template Structure**:

```text
copier-templates/
├── copier.yml                    # Main configuration
├── includes/                     # Shared template components
│   ├── justfile.jinja           # Base justfile template
│   ├── package.json.jinja       # Node.js package template
│   └── pyproject.toml.jinja     # Python package template
├── hexagonal-monorepo/          # HexDDD-style template
│   ├── copier.yml
│   ├── {% raw %}{{project_slug}}{% endraw %}/
│   │   ├── apps/
│   │   ├── libs/
│   │   └── tools/
│   └── extensions/              # Custom Copier extensions
└── ai-platform/                 # VibePDK-style template
    ├── copier.yml
    └── {% raw %}{{project_slug}}{% endraw %}/
        ├── .github/
        ├── specs/
        └── tools/
```

**Custom Copier Extensions**:

```python
# extensions/hex_architecture.py
from copier import Worker
from typing import Dict, Any

class HexArchitectureExtension:
    """Custom Copier extension for hexagonal architecture generation"""

    def __init__(self, worker: Worker):
        self.worker = worker
        self.context = worker.data

    def generate_domain_structure(self, domain_name: str) -> Dict[str, Any]:
        """Generate hexagonal domain structure"""
        return {
            'domain_path': f"libs/{domain_name}",
            'layers': {
                'domain': f"libs/{domain_name}/domain",
                'application': f"libs/{domain_name}/application",
                'infrastructure': f"libs/{domain_name}/infrastructure"
            },
            'eslint_tags': [
                f"domain:{domain_name}",
                "type:domain",
                "type:application",
                "type:infrastructure"
            ]
        }

    def validate_architecture_compliance(self, file_path: str) -> bool:
        """Validate hexagonal architecture compliance"""
        # Implementation for architectural validation
        pass
```

**Template Configuration Schema**:

```yaml
# copier.yml with advanced features
_templates_suffix: .jinja
_envops:
  block_start_string: "{%"
  block_end_string: "%}"

_jinja_extensions:
  - extensions.hex_architecture:HexArchitectureExtension
  - extensions.ai_context:AIContextExtension

# Template variables with validation
project_slug:
  type: str
  validator: "{% if not project_slug.isidentifier() %}Invalid project slug{% endif %}"
  help: "Python-compatible project identifier"

architecture_type:
  type: str
  choices:
    - hexagonal-monorepo
    - ai-platform
    - hybrid
  default: hybrid
  help: "Choose the architectural pattern"

frontend_frameworks:
  type: str
  choices:
    - next
    - remix
    - expo
    - all
  default: all
  when: "{{ architecture_type in ['hexagonal-monorepo', 'hybrid'] }}"

ai_features:
  type: bool
  default: true
  help: "Enable AI-assisted development features"

python_version:
  type: str
  choices:
    - "3.11"
    - "3.12"
    - "3.13"
  default: "3.12"

# Advanced conditional generation
_skip_if_exists:
  - "pyproject.toml"
  - "package.json"

_tasks:
  - "uv sync"
  - "pnpm install"
  - "just setup-dev-environment"
```

## TS-MERGE-002: AI Context Management System

**Technology Stack**:

- **AI Integration**: GitHub Copilot API + Custom Context Injection
- **Context Storage**: tsink (time-series database) + Redis (optional caching)
- **Token Management**: tiktoken for accurate counting
- **Pattern Recognition**: scikit-learn + custom models

**Context Manager Implementation**:

```typescript
// src/ai/context-manager.ts
import tsink from 'tsink-node';  // Node.js bindings for tsink
import { encoding_for_model } from 'tiktoken';

interface ContextSource {
  readonly id: string;
  readonly priority: number;
  readonly tokenCost: number;
  getContent(): Promise<string>;
}

interface TokenBudget {
  readonly total: number;
  readonly allocated: Map<string, number>;
  readonly remaining: number;
}

export class AIContextManager {
  private db: tsink.Database;
  private tokenizer = encoding_for_model('gpt-4');
  private cache = new Map<string, ContextSource>();

  constructor(
    private budgetConfig: TokenBudget,
    private sources: ContextSource[]
  ) {
    this.initializeDatabase();
  }

  async getOptimalContext(task: string): Promise<string> {
    // 1. Analyze task to determine context needs
    const taskAnalysis = await this.analyzeTask(task);

    // 2. Score and rank available context sources
    const rankedSources = await this.rankContextSources(
      taskAnalysis,
      this.sources
    );

    // 3. Select sources within token budget
    const selectedSources = this.selectWithinBudget(
      rankedSources,
      this.budgetConfig
    );

    // 4. Compose final context
    return this.composeContext(selectedSources);
  }

  private async analyzeTask(task: string): Promise<TaskAnalysis> {
    const tokens = this.tokenizer.encode(task);

    return {
      taskType: this.classifyTask(task),
      complexity: this.assessComplexity(tokens),
      domains: this.extractDomains(task),
      requiredPatterns: this.identifyPatterns(task)
    };
  }

  private async rankContextSources(
    analysis: TaskAnalysis,
    sources: ContextSource[]
  ): Promise<RankedSource[]> {
    const rankings = await Promise.all(
      sources.map(async (source) => {
        const relevance = await this.calculateRelevance(source, analysis);
        const recency = await this.getRecencyScore(source);
        const success = await this.getHistoricalSuccess(source, analysis);

        return {
          source,
          score: relevance * 0.5 + recency * 0.2 + success * 0.3
        };
      })
    );

    return rankings.sort((a, b) => b.score - a.score);
  }
}
```

**Pattern Recognition System**:

```python
# src/ai/pattern_recognition.py
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import DBSCAN
from sklearn.metrics.pairwise import cosine_similarity
import asyncio
from datetime import datetime, timedelta
import tsink

class ArchitecturalPatternRecognizer:
    def __init__(self, db_path: str):
        self.db_path = db_path
        self.db: Optional[tsink.Database] = None
        self.patterns_series: Optional[tsink.Series] = None
        self.vectorizer = TfidfVectorizer(
            max_features=1000,
            stop_words='english',
            ngram_range=(1, 3)
        )
        self.clustering_model = DBSCAN(eps=0.3, min_samples=2)

    async def initialize(self):
        """Initialize tsink database connection"""
        self.db = await tsink.Database.open(self.db_path)
        self.patterns_series = await self.db.series("patterns")

    async def learn_patterns(self) -> List[ArchitecturalPattern]:
        """Learn architectural patterns from historical decisions using time-series data"""

        # Extract decision contexts and outcomes
        decisions = self.db.execute("""
            SELECT decision_point, chosen_option, alternatives,
                   rationale, context, timestamp
            FROM decisions
            WHERE timestamp > NOW() - INTERVAL '90 days'
        """).fetchall()

        # Vectorize decision contexts
        contexts = [d['context'] for d in decisions]
        feature_vectors = self.vectorizer.fit_transform(contexts)

        # Cluster similar decision contexts
        clusters = self.clustering_model.fit_predict(feature_vectors)

        # Extract patterns from clusters
        patterns = []
        for cluster_id in set(clusters):
            if cluster_id == -1:  # Skip noise points
                continue

            cluster_decisions = [
                d for i, d in enumerate(decisions)
                if clusters[i] == cluster_id
            ]

            pattern = self.extract_pattern_from_cluster(cluster_decisions)
            patterns.append(pattern)

        return patterns

    def predict_next_decision(self, context: str) -> DecisionPrediction:
        """Predict likely next architectural decision"""
        context_vector = self.vectorizer.transform([context])

        # Find most similar historical contexts
        similarities = cosine_similarity(
            context_vector,
            self.historical_vectors
        ).flatten()

        top_indices = np.argsort(similarities)[-5:]
        similar_decisions = [self.historical_decisions[i] for i in top_indices]

        # Analyze common outcomes
        outcomes = [d['chosen_option'] for d in similar_decisions]
        outcome_weights = [similarities[i] for i in top_indices]

        return DecisionPrediction(
            predicted_options=self.weight_outcomes(outcomes, outcome_weights),
            confidence=np.mean(similarities[top_indices]),
            similar_contexts=similar_decisions
        )
```

## TS-MERGE-003: Temporal Database Schema and Management

**Technology Stack**:

- **Database**: tsink (Rust-based time-series database)
- **Schema Management**: Rust-native migrations with serde
- **Data Modeling**: Pydantic v2 for validation + Rust structs with serde
- **Time Series**: Native tsink Gorilla compression and time-series optimizations

**Database Schema Definition**:

```rust
// temporal_db/schema.rs
use serde::{Deserialize, Serialize};
use tsink::{Database, Series, Point};
use uuid::Uuid;
use chrono::{DateTime, Utc};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct SpecificationRecord {
    pub id: Uuid,
    pub spec_type: SpecificationType,
    pub identifier: String, // e.g., 'ADR-MERGE-001'
    pub title: String,
    pub content: String,
    pub template_variables: serde_json::Value,
    pub timestamp: DateTime<Utc>,
    pub version: u32,
    pub author: Option<String>,
    pub matrix_ids: Vec<String>,
    pub metadata: serde_json::Value,
    pub hash: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub enum SpecificationType {
    ADR,
    PRD,
    SDS,
    TS,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct DecisionPoint {
    pub id: Uuid,
    pub specification_id: Uuid,
    pub decision_point: String,
    pub context: String,
    pub timestamp: DateTime<Utc>,
    pub metadata: serde_json::Value,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct DecisionOption {
    pub id: Uuid,
    pub decision_point_id: Uuid,
    pub option_name: String,
    pub description: Option<String>,
    pub pros: Vec<String>,
    pub cons: Vec<String>,
    pub selected: bool,
    pub selection_rationale: Option<String>,
    pub timestamp: DateTime<Utc>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ArchitecturalPattern {
    pub id: Uuid,
    pub pattern_name: String,
    pub pattern_type: PatternType,
    pub context_similarity: f64, // 0.0 to 1.0
    pub usage_frequency: u32,
    pub success_rate: Option<f64>,
    pub last_used: Option<DateTime<Utc>>,
    pub pattern_definition: serde_json::Value,
    pub examples: Vec<String>,
    pub metadata: serde_json::Value,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub enum PatternType {
    Domain,
    Application,
    Infrastructure,
    Interface,
}

// Time-series optimized change tracking
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct SpecificationChange {
    pub spec_id: String,
    pub change_type: ChangeType,
    pub field: String,
    pub old_value: Option<String>,
    pub new_value: String,
    pub author: String,
    pub context: String,
    pub confidence: Option<f64>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub enum ChangeType {
    Create,
    Update,
    Delete,
    Decision,
    Pattern,
}
```

**Data Access Layer**:

```python
```python
# temporal_db/repository.py
from typing import List, Optional, Dict, Any
import asyncio
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel
import tsink
from .schema import (
    SpecificationRecord, DecisionPoint, DecisionOption,
    ArchitecturalPattern, SpecificationChange, ChangeType
)

class TemporalRepository:
    def __init__(self, db_path: str):
        self.db_path = db_path
        self.db: Optional[tsink.Database] = None
        self.specs_series: Optional[tsink.Series] = None
        self.patterns_series: Optional[tsink.Series] = None
        self.decisions_series: Optional[tsink.Series] = None

    async def initialize(self):
        """Initialize tsink database and series"""
        self.db = await tsink.Database.open(self.db_path)

        # Create time series for different data types
        self.specs_series = await self.db.series(
            "specifications",
            compression=tsink.Compression.Gorilla  # Ideal for timestamps
        )
        self.patterns_series = await self.db.series(
            "patterns",
            compression=tsink.Compression.Gorilla
        )
        self.decisions_series = await self.db.series(
            "decisions",
            compression=tsink.Compression.Gorilla
        )

    async def store_specification(
        self,
        spec: SpecificationRecord
    ) -> SpecificationRecord:
        """Store new specification as time-series point"""
        # Create change record for time-series
        change = SpecificationChange(
            spec_id=spec.identifier,
            change_type=ChangeType.Create,
            field="content",
            old_value=None,
            new_value=spec.content,
            author=spec.author or "unknown",
            context=spec.title,
            confidence=None
        )

        # Write to time series
        point = tsink.Point(
            timestamp=spec.timestamp,
            value=change
        )

        await self.specs_series.write(point)
        return spec

    async def get_latest_specification(
        self,
        spec_type: str,
        identifier: str
    ) -> Optional[SpecificationRecord]:
        """Get latest version of specification from time series"""
        # Query recent time range to find latest version
        now = datetime.now(timezone.utc)
        since = now - timedelta(days=365)  # Look back 1 year max

        query = tsink.Query.builder()\
            .time_range(tsink.TimeRange.between(since, now))\
            .filter("spec_id", identifier)\
            .order_by("timestamp", tsink.Order.Desc)\
            .limit(1)\
            .build()

        results = await self.specs_series.query(query)

        if not results:
            return None

        # Reconstruct specification from latest change
        latest_change = results[0].value

        # Note: In practice, you'd maintain full spec records
        # This is simplified for the example
        return SpecificationRecord(
            id=identifier,
            spec_type=spec_type,
            identifier=identifier,
            title=latest_change.context,
            content=latest_change.new_value,
            template_variables={},
            timestamp=results[0].timestamp,
            version=1,  # Would track properly in real implementation
            author=latest_change.author,
            matrix_ids=[],
            metadata={}
        )

    async def analyze_decision_patterns(
        self,
        lookback_days: int = 90
    ) -> List[Dict[str, Any]]:
        """Analyze decision patterns using time-series aggregation"""
        now = datetime.now(timezone.utc)
        since = now - timedelta(days=lookback_days)

        # Query decisions in time range
        query = tsink.Query.builder()\
            .time_range(tsink.TimeRange.between(since, now))\
            .filter("change_type", "Decision")\
            .build()

        results = await self.decisions_series.query(query)

        # Aggregate decision patterns
        patterns = {}
        for result in results:
            change = result.value
            key = (change.spec_id, change.field)  # Decision point identifier

            if key not in patterns:
                patterns[key] = {
                    'decision_point': change.field,
                    'spec_type': change.spec_id.split('-')[0],  # Extract from ID
                    'total_decisions': 0,
                    'selected_count': 0,
                    'contexts': []
                }

            patterns[key]['total_decisions'] += 1
            patterns[key]['contexts'].append(change.context)

            # Track selections (simplified logic)
            if change.confidence and change.confidence > 0.7:
                patterns[key]['selected_count'] += 1

        return list(patterns.values())
```

## TS-MERGE-004: Hybrid Build System Implementation

**Technology Stack**:

- **Task Runner**: just (justfile)
- **Build Orchestration**: Nx 21.5+ with custom executors
- **Package Management**: pnpm (Node.js) + uv (Python)
- **Tool Integration**: Custom executors for polyglot support

**Justfile Architecture**:

```bash
# justfile - Main task interface
set shell := ["bash", "-uc"]

# Default task shows available commands
default:
    @just --list

# Environment setup
setup: setup-node setup-python
    @echo "Development environment ready"

setup-node:
    corepack enable
    pnpm install

setup-python:
    uv sync --dev

# Build tasks with automatic complexity detection
build TARGET="": (_detect_build_strategy TARGET)

_detect_build_strategy TARGET:
    #!/usr/bin/env bash
    if [ -z "{{TARGET}}" ]; then
        if [ -f "nx.json" ] && [ "$(find apps libs -name 'project.json' | wc -l)" -gt 3 ]; then
            echo "Complex monorepo detected, using Nx orchestration"
            just build-nx
        else
            echo "Simple project detected, using direct tools"
            just build-direct
        fi
    else
        just build-target "{{TARGET}}"
    fi

build-direct:
    uv run python -m build
    pnpm run build

build-nx:
    nx run-many --target=build --all --parallel=3

build-target TARGET:
    nx run {{TARGET}}:build

# Test tasks with similar intelligence
test TARGET="": (_detect_test_strategy TARGET)

_detect_test_strategy TARGET:
    #!/usr/bin/env bash
    if [ -z "{{TARGET}}" ]; then
        if [ -f "nx.json" ]; then
            just test-nx
        else
            just test-direct
        fi
    else
        just test-target "{{TARGET}}"
    fi

test-direct:
    uv run pytest
    pnpm test

test-nx:
    nx run-many --target=test --all --parallel=3

test-target TARGET:
    nx run {{TARGET}}:test

# AI-enhanced tasks
ai-validate: _ai_context_setup
    @echo "Running AI-enhanced validation..."
    nx run-many --target=ai-validate --all

ai-generate COMPONENT: _ai_context_setup
    @echo "Generating {{COMPONENT}} with AI assistance..."
    node tools/ai/generator.js --component={{COMPONENT}}

_ai_context_setup:
    @echo "Setting up AI context..."
    node tools/ai/context-injector.js

# Development tasks
dev:
    nx run-many --target=serve --all --parallel=5

lint:
    nx run-many --target=lint --all
    uv run mypy .

format:
    nx run-many --target=format --all
    uv run black .
    uv run isort .

# Database and infrastructure
db-start:
    docker-compose -f docker/docker-compose.supabase.yml up -d

db-stop:
    docker-compose -f docker/docker-compose.supabase.yml down

db-reset: db-stop db-start
    sleep 5
    just db-migrate

db-migrate:
    uv run alembic upgrade head

# Type generation and validation
types-generate:
    nx run type-generator:generate

types-verify:
    nx run type-generator:verify

# CI/CD tasks
ci-test:
    just lint
    just test
    just types-verify

ci-build:
    just build
    just types-generate

# Spec-driven development tasks (from VibePDK)
spec-feature THREAD:
    @mkdir -p "specs/{{THREAD}}"
    @echo "---" > "specs/{{THREAD}}/spec.md"
    @echo "thread: {{THREAD}}" >> "specs/{{THREAD}}/spec.md"
    @echo "matrix_ids: []" >> "specs/{{THREAD}}/spec.md"
    @echo "" >> "specs/{{THREAD}}/spec.md"
    @echo "# Feature Specification" >> "specs/{{THREAD}}/spec.md"

spec-plan THREAD FAMILY:
    @mkdir -p "specs/{{THREAD}}"
    node tools/spec/plan-generator.js --thread={{THREAD}} --family={{FAMILY}}

spec-tasks THREAD:
    @mkdir -p "specs/{{THREAD}}"
    node tools/spec/task-generator.js --thread={{THREAD}}

# Prompt engineering tasks
prompt-lint:
    node tools/prompt/lint.js .github/prompts/*.prompt.md

prompt-test PROMPT:
    node tools/prompt/test.js .github/prompts/{{PROMPT}}.prompt.md

# Cleanup and maintenance
clean:
    nx reset
    rm -rf node_modules/.cache
    rm -rf .nx/cache
    uv cache clean

reset: clean setup
    @echo "Project reset complete"
```

**Custom Nx Executors**:

```typescript
// tools/executors/ai-validate/executor.ts
import { ExecutorContext, logger } from '@nx/devkit';
import { AIContextManager } from '../../ai/context-manager';
import { ArchitecturalValidator } from '../../ai/validator';

interface AIValidateExecutorOptions {
  files?: string[];
  rules?: string[];
  aiModel?: string;
  strictMode?: boolean;
}

export default async function runExecutor(
  options: AIValidateExecutorOptions,
  context: ExecutorContext
): Promise<{ success: boolean }> {
  const projectName = context.projectName!;
  const projectConfig = context.workspace.projects[projectName];

  logger.info(`Running AI validation for ${projectName}`);

  try {
    // Initialize AI components
    const contextManager = new AIContextManager({
      projectPath: projectConfig.root,
      tokenBudget: 8000,
      prioritizeArchitecture: true
    });

    const validator = new ArchitecturalValidator(contextManager);

    // Get files to validate
    const filesToValidate = options.files ||
      await getProjectFiles(projectConfig.root);

    // Run AI-enhanced validation
    const results = await validator.validateFiles(filesToValidate, {
      rules: options.rules || ['hexagonal-compliance', 'ddd-patterns'],
      strictMode: options.strictMode || false,
      aiModel: options.aiModel || 'gpt-4'
    });

    // Report results
    if (results.violations.length > 0) {
      logger.error(`Found ${results.violations.length} violations:`);
      results.violations.forEach(violation => {
        logger.error(`  ${violation.file}:${violation.line} - ${violation.message}`);
      });

      return { success: false };
    }

    if (results.suggestions.length > 0) {
      logger.info(`AI suggestions (${results.suggestions.length}):`);
      results.suggestions.forEach(suggestion => {
        logger.info(`  ${suggestion.file} - ${suggestion.message}`);
      });
    }

    logger.info(`Validation complete: ${filesToValidate.length} files processed`);
    return { success: true };

  } catch (error) {
    logger.error(`AI validation failed: ${error.message}`);
    return { success: false };
  }
}

async function getProjectFiles(projectRoot: string): Promise<string[]> {
  // Implementation to get relevant project files
  // Focus on source files, ignore build artifacts
  return [];
}
```

## TS-MERGE-005: Real-time Validation System

**Technology Stack**:

- **ESLint Integration**: Custom rules for hexagonal architecture
- **VS Code Extension**: Real-time feedback in editor
- **Language Server**: TypeScript/Python language server integration
- **CI Integration**: GitHub Actions with validation pipeline

**ESLint Plugin Implementation**:

```typescript
// eslint-plugin-hexagonal-architecture/index.ts
import { Rule } from 'eslint';
import { Node } from 'estree';

interface HexRule extends Rule.RuleModule {
  meta: Rule.RuleMetaData & {
    hexagonal?: {
      layer?: 'domain' | 'application' | 'infrastructure' | 'interface';
      allowedDependencies?: string[];
    };
  };
}

const rules: Record<string, HexRule> = {
  'no-layer-violation': {
    meta: {
      type: 'problem',
      docs: {
        description: 'Prevent violations of hexagonal architecture layer boundaries',
        category: 'Architectural'
      },
      schema: []
    },
    create(context: Rule.RuleContext): Rule.RuleListener {
      return {
        ImportDeclaration(node: Node) {
          const currentFile = context.getFilename();
          const currentLayer = detectLayer(currentFile);
          const importPath = (node as any).source.value;
          const importedLayer = detectLayerFromImport(importPath);

          if (!isValidDependency(currentLayer, importedLayer)) {
            context.report({
              node,
              message: `Layer '${currentLayer}' cannot depend on layer '${importedLayer}'. ` +
                      `Hexagonal architecture violation detected.`,
              data: {
                currentLayer,
                importedLayer,
                allowedDependencies: getAllowedDependencies(currentLayer)
              }
            });
          }
        }
      };
    }
  },

  'port-adapter-compliance': {
    meta: {
      type: 'suggestion',
      docs: {
        description: 'Ensure proper port/adapter pattern implementation',
        category: 'Architectural'
      },
      schema: []
    },
    create(context: Rule.RuleContext): Rule.RuleListener {
      return {
        ClassDeclaration(node: Node) {
          const className = (node as any).id.name;
          const currentFile = context.getFilename();

          if (isInApplicationLayer(currentFile) && className.endsWith('Port')) {
            validatePortInterface(node, context);
          }

          if (isInInfrastructureLayer(currentFile) && className.endsWith('Adapter')) {
            validateAdapterImplementation(node, context);
          }
        }
      };
    }
  }
};

function detectLayer(filePath: string): string {
  if (filePath.includes('/domain/')) return 'domain';
  if (filePath.includes('/application/')) return 'application';
  if (filePath.includes('/infrastructure/')) return 'infrastructure';
  if (filePath.includes('/apps/')) return 'interface';
  return 'unknown';
}

function isValidDependency(currentLayer: string, targetLayer: string): boolean {
  const validDependencies: Record<string, string[]> = {
    'domain': [],
    'application': ['domain'],
    'infrastructure': ['domain', 'application'],
    'interface': ['application']
  };

  return validDependencies[currentLayer]?.includes(targetLayer) ||
         currentLayer === targetLayer;
}

export = { rules };
```

**VS Code Extension**:

```typescript
// vscode-extension/src/extension.ts
import * as vscode from 'vscode';
import { AIContextManager } from './ai/context-manager';
import { ArchitecturalValidator } from './ai/validator';

export function activate(context: vscode.ExtensionContext) {
  const contextManager = new AIContextManager();
  const validator = new ArchitecturalValidator(contextManager);

  // Real-time validation on file save
  const onSaveDisposable = vscode.workspace.onDidSaveTextDocument(
    async (document) => {
      if (isRelevantFile(document.fileName)) {
        await validateDocument(document, validator);
      }
    }
  );

  // Real-time validation on text change (debounced)
  let validationTimeout: NodeJS.Timeout;
  const onChangeDisposable = vscode.workspace.onDidChangeTextDocument(
    (event) => {
      clearTimeout(validationTimeout);
      validationTimeout = setTimeout(async () => {
        if (isRelevantFile(event.document.fileName)) {
          await validateDocument(event.document, validator);
        }
      }, 1000); // 1 second debounce
    }
  );

  // Command for AI-assisted generation
  const generateCommand = vscode.commands.registerCommand(
    'hexagonal.generateComponent',
    async () => {
      const componentType = await vscode.window.showQuickPick([
        'Domain Entity',
        'Value Object',
        'Domain Service',
        'Application Service',
        'Port Interface',
        'Adapter Implementation'
      ]);

      if (componentType) {
        await generateComponent(componentType, contextManager);
      }
    }
  );

  context.subscriptions.push(
    onSaveDisposable,
    onChangeDisposable,
    generateCommand
  );
}

async function validateDocument(
  document: vscode.TextDocument,
  validator: ArchitecturalValidator
): Promise<void> {
  const diagnostics = await validator.validateFile(document.fileName);

  const vscDiagnostics = diagnostics.map(diag => {
    const range = new vscode.Range(
      diag.line, diag.column,
      diag.line, diag.column + diag.length
    );

    const diagnostic = new vscode.Diagnostic(
      range,
      diag.message,
      diag.severity === 'error'
        ? vscode.DiagnosticSeverity.Error
        : vscode.DiagnosticSeverity.Warning
    );

    diagnostic.source = 'hexagonal-architecture';
    return diagnostic;
  });

  vscode.languages.setDiagnostics(document.uri, vscDiagnostics);
}

function isRelevantFile(fileName: string): boolean {
  return fileName.endsWith('.ts') ||
         fileName.endsWith('.tsx') ||
         fileName.endsWith('.py');
}
```

## TS-MERGE-006: Type Generation System

**Technology Stack**:

- **Schema Introspection**: Supabase CLI + custom introspection
- **Type Generation**: TypeScript Compiler API + Python AST
- **Validation**: JSON Schema + Pydantic
- **CI Integration**: GitHub Actions with automated PRs

**Type Generator Implementation**:

```typescript
// tools/type-generator/src/generator.ts
import { createConnection } from '@supabase/supabase-js';
import { Project, SourceFile } from 'ts-morph';
import { generatePythonTypes } from './python-generator';

interface DatabaseSchema {
  tables: TableSchema[];
  views: ViewSchema[];
  functions: FunctionSchema[];
  types: TypeSchema[];
}

interface TableSchema {
  name: string;
  columns: ColumnSchema[];
  constraints: ConstraintSchema[];
  indexes: IndexSchema[];
}

interface ColumnSchema {
  name: string;
  type: string;
  nullable: boolean;
  default?: string;
  description?: string;
}

export class UnifiedTypeGenerator {
  private project: Project;
  private supabase: any;

  constructor(
    private config: {
      supabaseUrl: string;
      supabaseKey: string;
      outputDir: string;
    }
  ) {
    this.project = new Project({
      tsConfigFilePath: 'tsconfig.json'
    });
    this.supabase = createConnection(config.supabaseUrl, config.supabaseKey);
  }

  async generateTypes(): Promise<void> {
    // 1. Introspect database schema
    const schema = await this.introspectSchema();

    // 2. Generate TypeScript types
    const tsTypes = await this.generateTypeScriptTypes(schema);

    // 3. Generate Python types
    const pyTypes = await this.generatePythonTypes(schema);

    // 4. Validate type parity
    const validation = await this.validateTypeParity(tsTypes, pyTypes);

    if (!validation.isValid) {
      throw new Error(`Type parity validation failed: ${validation.errors.join(', ')}`);
    }

    // 5. Write generated files
    await this.writeGeneratedFiles(tsTypes, pyTypes);

    // 6. Update version tracking
    await this.updateVersionTracking(schema);
  }

  private async introspectSchema(): Promise<DatabaseSchema> {
    const { data: tables } = await this.supabase
      .from('information_schema.tables')
      .select('*')
      .eq('table_schema', 'public');

    const schema: DatabaseSchema = {
      tables: [],
      views: [],
      functions: [],
      types: []
    };

    for (const table of tables) {
      const { data: columns } = await this.supabase
        .from('information_schema.columns')
        .select('*')
        .eq('table_name', table.table_name)
        .eq('table_schema', 'public');

      schema.tables.push({
        name: table.table_name,
        columns: columns.map(col => ({
          name: col.column_name,
          type: col.data_type,
          nullable: col.is_nullable === 'YES',
          default: col.column_default,
          description: col.description
        })),
        constraints: [], // TODO: Implement constraint introspection
        indexes: [] // TODO: Implement index introspection
      });
    }

    return schema;
  }

  private async generateTypeScriptTypes(schema: DatabaseSchema): Promise<TypeScriptTypes> {
    const databaseTypesFile = this.project.createSourceFile(
      `${this.config.outputDir}/database-types.ts`,
      '',
      { overwrite: true }
    );

    // Generate table interfaces
    for (const table of schema.tables) {
      databaseTypesFile.addInterface({
        name: `${toPascalCase(table.name)}Row`,
        properties: table.columns.map(col => ({
          name: col.name,
          type: mapPostgresToTypeScript(col.type),
          hasQuestionToken: col.nullable
        }))
      });

      // Generate insert/update types
      databaseTypesFile.addInterface({
        name: `${toPascalCase(table.name)}Insert`,
        properties: table.columns
          .filter(col => !col.name.endsWith('_at') || col.default) // Exclude auto timestamps
          .map(col => ({
            name: col.name,
            type: mapPostgresToTypeScript(col.type),
            hasQuestionToken: col.nullable || !!col.default
          }))
      });
    }

    // Generate Zod schemas
    const zodSchemasFile = this.project.createSourceFile(
      `${this.config.outputDir}/zod-schemas.ts`,
      '',
      { overwrite: true }
    );

    zodSchemasFile.addImportDeclaration({
      moduleSpecifier: 'zod',
      namedImports: ['z']
    });

    for (const table of schema.tables) {
      const schemaProperties: Record<string, string> = {};

      for (const col of table.columns) {
        let zodType = mapPostgresToZod(col.type);
        if (col.nullable) {
          zodType += '.nullable()';
        }
        if (col.default && !col.nullable) {
          zodType += '.default()';
        }
        schemaProperties[col.name] = zodType;
      }

      zodSchemasFile.addVariableStatement({
        declarationKind: 'const',
        declarations: [{
          name: `${toCamelCase(table.name)}Schema`,
          initializer: `z.object(${JSON.stringify(schemaProperties, null, 2)
            .replace(/"/g, '')
            .replace(/([a-zA-Z_][a-zA-Z0-9_]*:)/g, '$1 ')}`
        }]
      });
    }

    return {
      databaseTypes: databaseTypesFile.getFullText(),
      zodSchemas: zodSchemasFile.getFullText()
    };
  }

  private async generatePythonTypes(schema: DatabaseSchema): Promise<PythonTypes> {
    return generatePythonTypes(schema, this.config.outputDir);
  }
}

function mapPostgresToTypeScript(pgType: string): string {
  const mapping: Record<string, string> = {
    'integer': 'number',
    'bigint': 'number',
    'text': 'string',
    'varchar': 'string',
    'boolean': 'boolean',
    'timestamp': 'string', // ISO string
    'timestamptz': 'string',
    'json': 'Record<string, any>',
    'jsonb': 'Record<string, any>',
    'uuid': 'string'
  };

  return mapping[pgType] || 'unknown';
}

function mapPostgresToZod(pgType: string): string {
  const mapping: Record<string, string> = {
    'integer': 'z.number().int()',
    'bigint': 'z.number().int()',
    'text': 'z.string()',
    'varchar': 'z.string()',
    'boolean': 'z.boolean()',
    'timestamp': 'z.string().datetime()',
    'timestamptz': 'z.string().datetime()',
    'json': 'z.record(z.any())',
    'jsonb': 'z.record(z.any())',
    'uuid': 'z.string().uuid()'
  };

  return mapping[pgType] || 'z.unknown()';
}
```

## TS-MERGE-007: AI-Enhanced Code Generation

**Technology Stack**:

- **AI Integration**: OpenAI GPT-4 + GitHub Copilot
- **Code Analysis**: TypeScript Compiler API + Python AST
- **Template Engine**: Handlebars with custom helpers
- **Validation**: ESLint + mypy integration

**AI Code Generator**:

```typescript
// tools/ai-generator/src/hexagonal-generator.ts
import { OpenAI } from 'openai';
import { AIContextManager } from '../ai/context-manager';
import { ArchitecturalPatterns } from '../patterns/architectural-patterns';

interface GenerationRequest {
  component: 'entity' | 'value-object' | 'service' | 'port' | 'adapter';
  domain: string;
  requirements: string;
  existingContext?: string[];
}

interface GenerationResult {
  code: string;
  tests: string;
  documentation: string;
  patterns: string[];
  suggestions: string[];
}

export class HexagonalAIGenerator {
  private openai: OpenAI;
  private contextManager: AIContextManager;
  private patterns: ArchitecturalPatterns;

  constructor(config: {
    openaiApiKey: string;
    model: string;
  }) {
    this.openai = new OpenAI({ apiKey: config.openaiApiKey });
    this.contextManager = new AIContextManager();
    this.patterns = new ArchitecturalPatterns();
  }

  async generateComponent(request: GenerationRequest): Promise<GenerationResult> {
    // 1. Gather relevant context
    const context = await this.gatherContext(request);

    // 2. Select appropriate patterns
    const relevantPatterns = await this.patterns.getRelevantPatterns(
      request.component,
      request.domain
    );

    // 3. Compose AI prompt
    const prompt = await this.composePrompt(request, context, relevantPatterns);

    // 4. Generate code with AI
    const aiResponse = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: this.getSystemPrompt(request.component)
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1, // Low temperature for consistent code generation
      max_tokens: 2000
    });

    // 5. Parse and validate generated code
    const generatedCode = aiResponse.choices[0].message.content!;
    const parsedResult = await this.parseGeneratedCode(generatedCode);

    // 6. Apply architectural validation
    const validation = await this.validateArchitecture(parsedResult, request);

    if (!validation.isValid) {
      // Regenerate with validation feedback
      return this.regenerateWithFeedback(request, validation.errors);
    }

    // 7. Generate accompanying tests
    const tests = await this.generateTests(parsedResult, request);

    // 8. Generate documentation
    const documentation = await this.generateDocumentation(parsedResult, request);

    return {
      code: parsedResult.code,
      tests,
      documentation,
      patterns: relevantPatterns.map(p => p.name),
      suggestions: validation.suggestions
    };
  }

  private async gatherContext(request: GenerationRequest): Promise<string> {
    const contextSources = [
      `domain/${request.domain}/**/*.ts`,
      `domain/${request.domain}/**/*.py`,
      'docs/domain-models.md',
      'docs/architectural-decisions.md'
    ];

    return this.contextManager.gatherRelevantContext(contextSources, {
      tokenBudget: 4000,
      prioritizePatterns: true,
      focusDomain: request.domain
    });
  }

  private getSystemPrompt(component: string): string {
    const basePrompt = `
You are an expert software architect specializing in hexagonal architecture and domain-driven design.
Your task is to generate high-quality, production-ready code that follows these principles:

1. Hexagonal Architecture: Clear separation between domain, application, and infrastructure layers
2. Domain-Driven Design: Rich domain models with explicit business rules
3. SOLID Principles: Especially single responsibility and dependency inversion
4. Type Safety: Full type annotations and strict typing
5. Testability: Code that is easy to unit test with clear dependencies

Generate code that is:
- Clean and readable
- Well-documented with clear intent
- Following established patterns in the codebase
- Compliant with linting rules
- Production-ready quality
`;

    const componentSpecific: Record<string, string> = {
      'entity': `
Focus on creating a domain entity with:
- Rich business behavior, not just data containers
- Invariant enforcement in constructors and methods
- Domain events for state changes
- Immutable value objects where appropriate
`,
      'value-object': `
Focus on creating a value object with:
- Immutability
- Value-based equality
- Validation in constructor
- No identity, only values matter
`,
      'service': `
Focus on creating a domain service with:
- Stateless operations
- Domain-focused behavior that doesn't belong in entities
- Clear, intention-revealing method names
- Dependency injection via constructor
`,
      'port': `
Focus on creating a port interface with:
- Clear contract definition
- Technology-agnostic abstractions
- Input/output models using domain types
- Comprehensive method documentation
`,
      'adapter': `
Focus on creating an adapter implementation with:
- Implementation of the corresponding port interface
- Technology-specific details encapsulated
- Error handling and logging
- Connection management and resource cleanup
`
    };

    return basePrompt + (componentSpecific[component] || '');
  }

  private async generateTests(
    parsedCode: ParsedCode,
    request: GenerationRequest
  ): Promise<string> {
    const testPrompt = `
Generate comprehensive unit tests for the following ${request.component}:

${parsedCode.code}

Requirements:
1. Test all public methods and scenarios
2. Use appropriate mocking for dependencies
3. Include edge cases and error conditions
4. Follow naming conventions: describe_what_should_happen_when_condition
5. Use appropriate testing framework (Jest for TS, pytest for Python)
6. Include property-based tests where applicable

Generated tests should achieve >90% code coverage.
`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert in test-driven development and comprehensive testing strategies.'
        },
        {
          role: 'user',
          content: testPrompt
        }
      ],
      temperature: 0.1,
      max_tokens: 1500
    });

    return response.choices[0].message.content!;
  }
}
```

## TS-MERGE-008: Performance and Monitoring

**Technology Stack**:

- **Monitoring**: OpenTelemetry + Custom metrics
- **Performance**: Node.js performance hooks + Python profiling
- **Caching**: Redis + in-memory LRU caches
- **Analytics**: tsink for temporal analytics and pattern recognition

**Performance Monitoring Implementation**:

```typescript
// src/monitoring/performance-monitor.ts
import { performance, PerformanceObserver } from 'perf_hooks';
import { trace, metrics } from '@opentelemetry/api';

interface PerformanceMetrics {
  templateGeneration: number;
  aiContextLoading: number;
  typeGeneration: number;
  validationTime: number;
  cacheHitRate: number;
}

export class PerformanceMonitor {
  private tracer = trace.getTracer('hexagonal-generator');
  private meter = metrics.getMeter('hexagonal-generator');
  private metrics: PerformanceMetrics = {
    templateGeneration: 0,
    aiContextLoading: 0,
    typeGeneration: 0,
    validationTime: 0,
    cacheHitRate: 0
  };

  constructor() {
    this.setupObservers();
    this.createMetrics();
  }

  private setupObservers(): void {
    const obs = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.recordMetric(entry.name, entry.duration);
      }
    });

    obs.observe({ entryTypes: ['measure'] });
  }

  private createMetrics(): void {
    this.meter.createHistogram('template_generation_duration', {
      description: 'Time taken to generate templates',
      unit: 'ms'
    });

    this.meter.createHistogram('ai_context_loading_duration', {
      description: 'Time taken to load AI context',
      unit: 'ms'
    });

    this.meter.createCounter('cache_hits', {
      description: 'Number of cache hits'
    });

    this.meter.createCounter('cache_misses', {
      description: 'Number of cache misses'
    });
  }

  async measureTemplateGeneration<T>(fn: () => Promise<T>): Promise<T> {
    const span = this.tracer.startSpan('template_generation');
    performance.mark('template-start');

    try {
      const result = await fn();
      performance.mark('template-end');
      performance.measure('template_generation', 'template-start', 'template-end');

      span.setStatus({ code: 1 }); // SUCCESS
      return result;
    } catch (error) {
      span.setStatus({ code: 2, message: error.message }); // ERROR
      throw error;
    } finally {
      span.end();
    }
  }

  private recordMetric(name: string, duration: number): void {
    const histogram = this.meter.getHistogram(name);
    if (histogram) {
      histogram.record(duration);
    }

    // Store in local metrics for reporting
    if (name in this.metrics) {
      this.metrics[name as keyof PerformanceMetrics] = duration;
    }
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }
}
```

This comprehensive technical specification provides the foundation for implementing the HexDDD-VibePDK merger using a generator-first integration approach. The system will combine the architectural rigor of HexDDD with the AI-enhanced development experience of VibePDK, creating a unique platform for modern software development.
