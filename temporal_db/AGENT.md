# temporal_db/ Agent Instructions

## 📍 Context

> **Purpose**: Temporal learning database for AI-assisted development - stores architectural decisions, patterns, and learning over time.
> **When to use**: When querying project history, storing AI learning insights, or understanding past architectural decisions.

## 🔗 Parent Context

See [root copilot-instructions.md](/.github/copilot-instructions.md) for comprehensive project guidance and [AGENT-MAP.md](/AGENT-MAP.md) for navigation across contexts.

## 🎯 Local Scope

**This directory handles:**
- Rust-based embedded database (sled)
- Temporal learning storage for AI agents
- Architectural decision history
- Pattern recognition and anti-pattern tracking
- Development insights over time
- Project specification database

**Technology**: [sled](https://github.com/spacejam/sled) - Embedded database in Rust

## 📁 Key Files & Patterns

### Directory Structure

```
temporal_db/
├── Cargo.toml              # Rust dependencies and configuration
├── Cargo.lock              # Locked dependency versions
├── src/
│   ├── lib.rs              # Library entry point
│   ├── db.rs               # Database operations
│   ├── models.rs           # Data models
│   ├── query.rs            # Query interface
│   └── learning.rs         # Learning algorithms
├── tests/
│   ├── integration.rs      # Integration tests
│   └── fixtures/           # Test data
├── benches/
│   └── performance.rs      # Performance benchmarks
├── project_specs.db/       # Generated database files (gitignored)
└── README.md               # Database documentation
```

### Key Configuration Files

#### Cargo.toml

```toml
[package]
name = "temporal_db"
version = "0.1.0"
edition = "2021"
rust-version = "1.70"

[dependencies]
sled = "0.34"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
chrono = { version = "0.4", features = ["serde"] }
thiserror = "1.0"
tracing = "0.1"

[dev-dependencies]
criterion = "0.5"
tempfile = "3.8"

[[bench]]
name = "performance"
harness = false
```

## 🧭 Routing Rules

### Use This Context When:

- [ ] Querying AI learning history
- [ ] Storing architectural decisions programmatically
- [ ] Implementing pattern recognition features
- [ ] Working with Rust code in temporal_db
- [ ] Benchmarking database performance
- [ ] Understanding temporal learning system

### Refer to Other Contexts When:

| Context | When to Use |
|---------|-------------|
| [docs/AGENT.md](/docs/AGENT.md) | Reading ADRs and specifications (high-level) |
| [tools/AGENT.md](/tools/AGENT.md) | Building tools that query temporal DB |
| [.github/AGENT.md](/.github/AGENT.md) | AI workflows that use learning insights |
| [architecture/AGENT.md](/architecture/AGENT.md) | Architectural patterns and CALM docs |

## 🔧 Local Conventions

### Rust Code Style

**Follow Rust standard conventions:**
- Use `rustfmt` for formatting
- Use `clippy` for linting
- Document all public APIs with `///` doc comments
- Use `Result<T, E>` for error handling
- Prefer `&str` over `String` for function parameters

**Example module structure:**

```rust
// src/db.rs
use sled::{Db, Tree};
use std::path::Path;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum DbError {
    #[error("Database error: {0}")]
    Sled(#[from] sled::Error),

    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),

    #[error("Entry not found: {0}")]
    NotFound(String),
}

pub type DbResult<T> = Result<T, DbError>;

/// Temporal database for AI learning and architectural decisions.
pub struct TemporalDb {
    db: Db,
    specs: Tree,
    decisions: Tree,
    patterns: Tree,
}

impl TemporalDb {
    /// Open or create a temporal database at the given path.
    pub fn open<P: AsRef<Path>>(path: P) -> DbResult<Self> {
        let db = sled::open(path)?;
        let specs = db.open_tree("specs")?;
        let decisions = db.open_tree("decisions")?;
        let patterns = db.open_tree("patterns")?;

        Ok(Self {
            db,
            specs,
            decisions,
            patterns,
        })
    }

    /// Store a specification entry.
    pub fn store_spec(&self, spec: &Specification) -> DbResult<()> {
        let key = spec.id.as_bytes();
        let value = serde_json::to_vec(spec)?;
        self.specs.insert(key, value)?;
        Ok(())
    }

    /// Retrieve a specification by ID.
    pub fn get_spec(&self, id: &str) -> DbResult<Option<Specification>> {
        match self.specs.get(id.as_bytes())? {
            Some(bytes) => {
                let spec = serde_json::from_slice(&bytes)?;
                Ok(Some(spec))
            }
            None => Ok(None),
        }
    }

    /// Query specifications by type.
    pub fn query_specs_by_type(&self, spec_type: SpecType) -> DbResult<Vec<Specification>> {
        let mut results = Vec::new();

        for item in self.specs.iter() {
            let (_, value) = item?;
            let spec: Specification = serde_json::from_slice(&value)?;

            if spec.spec_type == spec_type {
                results.push(spec);
            }
        }

        Ok(results)
    }

    /// Flush all pending writes to disk.
    pub fn flush(&self) -> DbResult<()> {
        self.db.flush()?;
        Ok(())
    }
}
```

### Data Models

```rust
// src/models.rs
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

/// Specification type.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum SpecType {
    ADR,  // Architectural Decision Record
    PRD,  // Product Requirements Document
    SDS,  // Software Design Specification
    TS,   // Technical Specification
}

/// A specification entry in the database.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Specification {
    pub id: String,
    pub spec_type: SpecType,
    pub title: String,
    pub content: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub tags: Vec<String>,
}

/// An architectural decision record.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Decision {
    pub id: String,
    pub title: String,
    pub status: DecisionStatus,
    pub context: String,
    pub decision: String,
    pub consequences: Vec<String>,
    pub alternatives: Vec<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum DecisionStatus {
    Proposed,
    Accepted,
    Rejected,
    Deprecated,
    Superseded,
}

/// A recognized pattern or anti-pattern.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Pattern {
    pub id: String,
    pub name: String,
    pub pattern_type: PatternType,
    pub description: String,
    pub examples: Vec<String>,
    pub frequency: u32,
    pub last_seen: DateTime<Utc>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum PatternType {
    Success,
    AntiPattern,
    Neutral,
}
```

### Query Interface

```rust
// src/query.rs
use crate::{db::TemporalDb, models::*};
use std::collections::HashMap;

/// Query builder for temporal database.
pub struct QueryBuilder<'a> {
    db: &'a TemporalDb,
    filters: Vec<Box<dyn Fn(&Specification) -> bool>>,
}

impl<'a> QueryBuilder<'a> {
    pub fn new(db: &'a TemporalDb) -> Self {
        Self {
            db,
            filters: Vec::new(),
        }
    }

    pub fn with_type(mut self, spec_type: SpecType) -> Self {
        self.filters.push(Box::new(move |spec| spec.spec_type == spec_type));
        self
    }

    pub fn with_tag(mut self, tag: String) -> Self {
        self.filters.push(Box::new(move |spec| spec.tags.contains(&tag)));
        self
    }

    pub fn execute(self) -> DbResult<Vec<Specification>> {
        let all_specs = self.db.query_all_specs()?;

        Ok(all_specs
            .into_iter()
            .filter(|spec| self.filters.iter().all(|f| f(spec)))
            .collect())
    }
}
```

## 📚 Related Instructions

**Modular instructions that apply here:**
- [.github/instructions/security.instructions.md](/.github/instructions/security.instructions.md) - Security in database operations
- [.github/instructions/testing.instructions.md](/.github/instructions/testing.instructions.md) - Testing Rust code
- [.github/instructions/performance.instructions.md](/.github/instructions/performance.instructions.md) - Performance benchmarking

**Relevant documentation:**
- [sled documentation](https://docs.rs/sled/)
- [Rust book](https://doc.rust-lang.org/book/)
- [Cargo book](https://doc.rust-lang.org/cargo/)

## 💡 Examples

### Example 1: Store Architectural Decision

```rust
use temporal_db::{TemporalDb, Decision, DecisionStatus};
use chrono::Utc;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let db = TemporalDb::open("project_specs.db")?;

    let decision = Decision {
        id: "ADR-001".to_string(),
        title: "Use hexagonal architecture".to_string(),
        status: DecisionStatus::Accepted,
        context: "Need clean architecture for testability".to_string(),
        decision: "Adopt hexagonal architecture (Ports & Adapters)".to_string(),
        consequences: vec![
            "Better testability".to_string(),
            "Clearer boundaries".to_string(),
            "Initial overhead".to_string(),
        ],
        alternatives: vec![
            "Layered architecture".to_string(),
            "Clean architecture".to_string(),
        ],
        created_at: Utc::now(),
    };

    db.store_decision(&decision)?;
    db.flush()?;

    println!("✅ Decision stored: {}", decision.id);
    Ok(())
}
```

### Example 2: Query Patterns

```rust
use temporal_db::{TemporalDb, PatternType};

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let db = TemporalDb::open("project_specs.db")?;

    // Find all anti-patterns
    let anti_patterns = db.query_patterns_by_type(PatternType::AntiPattern)?;

    println!("🚫 Anti-patterns found: {}", anti_patterns.len());
    for pattern in anti_patterns {
        println!("  - {}: {}", pattern.name, pattern.description);
        println!("    Frequency: {} occurrences", pattern.frequency);
    }

    Ok(())
}
```

### Example 3: Learning from Patterns

```rust
use temporal_db::{TemporalDb, Pattern, PatternType};
use chrono::Utc;

fn record_success_pattern(
    db: &TemporalDb,
    name: &str,
    description: &str,
    example: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    // Check if pattern exists
    let existing = db.get_pattern_by_name(name)?;

    if let Some(mut pattern) = existing {
        // Update frequency and last seen
        pattern.frequency += 1;
        pattern.last_seen = Utc::now();
        pattern.examples.push(example.to_string());
        db.update_pattern(&pattern)?;
    } else {
        // Create new pattern
        let pattern = Pattern {
            id: uuid::Uuid::new_v4().to_string(),
            name: name.to_string(),
            pattern_type: PatternType::Success,
            description: description.to_string(),
            examples: vec![example.to_string()],
            frequency: 1,
            last_seen: Utc::now(),
        };
        db.store_pattern(&pattern)?;
    }

    db.flush()?;
    Ok(())
}
```

### Example 4: Integration with AI Tools

```typescript
// tools/ai/query-temporal-db.ts
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface Specification {
  id: string;
  spec_type: string;
  title: string;
  content: string;
}

/**
 * Query temporal database for specifications.
 */
export async function querySpecs(
  specType?: string
): Promise<Specification[]> {
  const cmd = specType
    ? `cargo run --manifest-path temporal_db/Cargo.toml --bin query -- --type ${specType}`
    : `cargo run --manifest-path temporal_db/Cargo.toml --bin query -- --all`;

  const { stdout } = await execAsync(cmd);
  return JSON.parse(stdout);
}

/**
 * Get architectural decisions.
 */
export async function getDecisions(): Promise<any[]> {
  const { stdout } = await execAsync(
    'cargo run --manifest-path temporal_db/Cargo.toml --bin query -- --decisions'
  );
  return JSON.parse(stdout);
}
```

## ✅ Checklist

### Before Modifying Database Code:

- [ ] Review current data models in `src/models.rs`
- [ ] Check for breaking changes to serialization
- [ ] Plan migration strategy if schema changes
- [ ] Consider backward compatibility

### While Implementing Features:

- [ ] Write tests first (Rust TDD)
- [ ] Document public APIs with `///` comments
- [ ] Handle errors with `Result<T, E>`
- [ ] Use `?` operator for error propagation
- [ ] Add tracing/logging for debugging
- [ ] Write benchmarks for performance-critical code

### After Making Changes:

- [ ] Run tests: `cargo test --manifest-path temporal_db/Cargo.toml`
- [ ] Run clippy: `cargo clippy --manifest-path temporal_db/Cargo.toml`
- [ ] Format code: `cargo fmt --manifest-path temporal_db/Cargo.toml`
- [ ] Run benchmarks: `cargo bench --manifest-path temporal_db/Cargo.toml`
- [ ] Update README.md if API changes
- [ ] Test integration with tools

## 🔍 Quick Reference

### Common Commands

```bash
# Build temporal_db
cargo build --manifest-path temporal_db/Cargo.toml

# Run tests
cargo test --manifest-path temporal_db/Cargo.toml

# Run with verbose output
cargo test --manifest-path temporal_db/Cargo.toml -- --nocapture

# Run specific test
cargo test --manifest-path temporal_db/Cargo.toml test_store_spec

# Run benchmarks
cargo bench --manifest-path temporal_db/Cargo.toml

# Check code without building
cargo check --manifest-path temporal_db/Cargo.toml

# Lint with clippy
cargo clippy --manifest-path temporal_db/Cargo.toml -- -D warnings

# Format code
cargo fmt --manifest-path temporal_db/Cargo.toml

# Generate documentation
cargo doc --manifest-path temporal_db/Cargo.toml --open
```

### Database Operations

```rust
// Open database
let db = TemporalDb::open("project_specs.db")?;

// Store data
db.store_spec(&spec)?;
db.store_decision(&decision)?;
db.store_pattern(&pattern)?;

// Retrieve data
let spec = db.get_spec("DEV-ADR-001")?;
let decisions = db.query_decisions()?;
let patterns = db.query_patterns_by_type(PatternType::Success)?;

// Flush to disk
db.flush()?;

// Compact database
db.compact()?;
```

### Error Handling Pattern

```rust
use thiserror::Error;

#[derive(Error, Debug)]
pub enum MyError {
    #[error("Database error: {0}")]
    Database(#[from] DbError),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Custom error: {0}")]
    Custom(String),
}

pub type Result<T> = std::result::Result<T, MyError>;
```

## 🛡️ Security Considerations

**Security in temporal database:**

- ⚠️ **Access control**: Database is local, but protect from unauthorized access
- ⚠️ **Input validation**: Validate all data before storing
- ⚠️ **Sanitization**: Sanitize user input in stored content
- ⚠️ **Path traversal**: Validate database path
- ⚠️ **Resource limits**: Prevent unbounded queries
- ⚠️ **Sensitive data**: Don't store secrets or PII

**Example validation:**

```rust
pub fn validate_spec_id(id: &str) -> Result<(), ValidationError> {
    // Must match pattern: DEV-XXX-NNN
    let re = Regex::new(r"^DEV-[A-Z]{2,4}-\d{3}$").unwrap();

    if !re.is_match(id) {
        return Err(ValidationError::InvalidSpecId(id.to_string()));
    }

    Ok(())
}

pub fn sanitize_content(content: &str) -> String {
    // Remove potential script tags or dangerous content
    content
        .replace("<script>", "&lt;script&gt;")
        .replace("</script>", "&lt;/script&gt;")
        .trim()
        .to_string()
}
```

## 🎯 Testing Strategy

### Unit Tests

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn test_store_and_retrieve_spec() {
        let temp_dir = TempDir::new().unwrap();
        let db = TemporalDb::open(temp_dir.path()).unwrap();

        let spec = Specification {
            id: "TEST-001".to_string(),
            spec_type: SpecType::ADR,
            title: "Test spec".to_string(),
            content: "Test content".to_string(),
            created_at: Utc::now(),
            updated_at: Utc::now(),
            tags: vec!["test".to_string()],
        };

        db.store_spec(&spec).unwrap();

        let retrieved = db.get_spec("TEST-001").unwrap();
        assert!(retrieved.is_some());
        assert_eq!(retrieved.unwrap().title, "Test spec");
    }
}
```

### Integration Tests

```rust
// tests/integration.rs
use temporal_db::*;
use tempfile::TempDir;

#[test]
fn test_query_workflow() {
    let temp_dir = TempDir::new().unwrap();
    let db = TemporalDb::open(temp_dir.path()).unwrap();

    // Store multiple specs
    for i in 1..=5 {
        let spec = create_test_spec(i);
        db.store_spec(&spec).unwrap();
    }

    // Query by type
    let adrs = db.query_specs_by_type(SpecType::ADR).unwrap();
    assert_eq!(adrs.len(), 5);
}
```

### Benchmarks

```rust
// benches/performance.rs
use criterion::{black_box, criterion_group, criterion_main, Criterion};
use temporal_db::*;

fn benchmark_insert(c: &mut Criterion) {
    let temp_dir = TempDir::new().unwrap();
    let db = TemporalDb::open(temp_dir.path()).unwrap();

    c.bench_function("insert spec", |b| {
        b.iter(|| {
            let spec = create_test_spec(1);
            db.store_spec(&spec).unwrap();
        });
    });
}

criterion_group!(benches, benchmark_insert);
criterion_main!(benches);
```

## 🎯 Integration Patterns

### With AI Tools

**Query from TypeScript/Node.js:**
```typescript
import { querySpecs, getDecisions } from './tools/ai/query-temporal-db';

// Get all ADRs
const adrs = await querySpecs('ADR');

// Get decisions
const decisions = await getDecisions();
```

**Query from Python:**
```python
import subprocess
import json

def query_temporal_db(spec_type: str = None) -> list:
    """Query temporal database from Python."""
    cmd = ['cargo', 'run', '--manifest-path', 'temporal_db/Cargo.toml',
           '--bin', 'query', '--']

    if spec_type:
        cmd.extend(['--type', spec_type])
    else:
        cmd.append('--all')

    result = subprocess.run(cmd, capture_output=True, text=True)
    return json.loads(result.stdout)
```

### With AI Workflows

**Store learning insights:**
```rust
// Called from post-generation hooks
pub fn record_generation_insight(
    db: &TemporalDb,
    pattern_name: &str,
    success: bool,
) -> Result<()> {
    let pattern_type = if success {
        PatternType::Success
    } else {
        PatternType::AntiPattern
    };

    let pattern = Pattern {
        id: uuid::Uuid::new_v4().to_string(),
        name: pattern_name.to_string(),
        pattern_type,
        description: format!("Pattern observed during generation"),
        examples: vec![],
        frequency: 1,
        last_seen: Utc::now(),
    };

    db.store_pattern(&pattern)?;
    Ok(())
}
```

## 🔄 Maintenance

### Regular Tasks

- **Weekly**: Check database size, consider compaction
- **Monthly**: Review stored patterns, archive old data
- **Quarterly**: Benchmark performance, optimize queries
- **Per feature**: Update data models if schema changes

### When to Update This AGENT.md

- Rust version updates
- sled library updates
- Data model changes
- New query patterns
- Performance optimizations

### Database Maintenance

```bash
# Check database size
du -sh temporal_db/project_specs.db

# Compact database (in Rust code)
db.compact()?;

# Backup database
cp -r temporal_db/project_specs.db temporal_db/project_specs.db.backup

# Export to JSON (for migration)
cargo run --manifest-path temporal_db/Cargo.toml --bin export -- --output backup.json
```

---

_Last updated: 2025-10-13 | Maintained by: VibesPro Project Team_
_Parent context: [copilot-instructions.md](/.github/copilot-instructions.md) | Navigation: [AGENT-MAP.md](/AGENT-MAP.md)_
