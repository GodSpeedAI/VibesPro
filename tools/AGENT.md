# tools/ Agent Instructions

## 📍 Context

> **Purpose**: Development Tools - Utilities, generators, metrics, validation scripts, and AI assistance tools.
> **When to use**: When building tooling, measuring tokens, validating templates, generating types, or creating developer utilities.

## 🔗 Parent Context

See [root copilot-instructions.md](/.github/copilot-instructions.md) for comprehensive project guidance and [AGENT-MAP.md](/AGENT-MAP.md) for navigation across contexts.

## 🎯 Local Scope

**This directory handles:**
- Development utilities and helper tools
- Token measurement and metrics collection
- Template validation and linting
- Type generation and code analysis
- AI context management tools
- CLI utilities for developers
- Performance monitoring tools
- Documentation generation tools

**Architecture Layer**: N/A (Infrastructure/Tooling)

## 📁 Key Files & Patterns

### Directory Structure
```
tools/
├── package.json                    # Node.js tools dependencies
├── ai/                             # AI assistance tools
│   ├── context_manager.ts          # Context bundling
│   └── token_counter.ts            # Token measurement
├── audit/                          # Code auditing tools
│   └── dependency_check.py         # Security scanning
├── calm/                           # CALM diagram tools
│   └── generate_calm.py            # Architecture diagram generation
├── ci/                             # CI/CD utilities
│   └── validate_workflows.js       # GitHub Actions validation
├── cli/                            # Command-line interfaces
│   └── dev_cli.ts                  # Developer CLI
├── docs/                           # Documentation tools
│   ├── link_check.js               # Markdown link checker
│   └── generate_api_docs.ts        # API doc generator
├── logging/                        # Logging utilities
│   └── structured_logger.ts        # Structured logging
├── metrics/                        # Metrics collection
│   ├── token_metrics.py            # Token usage tracking
│   └── build_metrics.js            # Build performance
├── monitoring/                     # Monitoring tools
│   └── health_check.ts             # Health checks
├── performance/                    # Performance tools
│   └── profiler.js                 # Performance profiling
├── prompt/                         # Prompt engineering tools
│   ├── validate_prompts.py         # Prompt validation
│   └── render_prompt.js            # Prompt rendering
├── reference/                      # Reference generators
│   └── generate_types.ts           # Type generation
├── spec/                           # Specification tools
│   ├── spec_parser.py              # Parse spec documents
│   └── traceability_checker.js    # Check spec traceability
├── test/                           # Testing utilities
│   ├── test_helpers.ts             # Test utilities
│   └── fixture_generator.py       # Test fixture generation
├── type-generator/                 # Type generation
│   └── generate_schema_types.ts   # Schema to types
└── utils/                          # General utilities
    ├── file_utils.ts               # File operations
    └── string_utils.py             # String manipulation
```

### File Naming Conventions

| File Type | Pattern | Example |
|-----------|---------|---------|
| **Node/TS Tools** | `*.ts`, `*.js` | `context_manager.ts` |
| **Python Tools** | `*.py` | `token_metrics.py` |
| **Test Files** | `*.test.ts`, `test_*.py` | `context_manager.test.ts` |
| **CLI Scripts** | `*_cli.ts` | `dev_cli.ts` |
| **Validators** | `validate_*.{ts,js,py}` | `validate_prompts.py` |
| **Generators** | `generate_*.{ts,js,py}` | `generate_types.ts` |

### Tool Categories

| Category | Purpose | Primary Language |
|----------|---------|-----------------|
| **AI Tools** | Context management, token counting | TypeScript |
| **Validation** | Template, prompt, spec validation | Python, TypeScript |
| **Metrics** | Token usage, build metrics | Python, JavaScript |
| **Generators** | Type generation, docs, fixtures | TypeScript |
| **CLI** | Developer command-line tools | TypeScript |
| **Documentation** | Link checking, API docs | JavaScript, TypeScript |

## 🧭 Routing Rules

### Use This Context When:

- [ ] Building developer utilities or tools
- [ ] Creating validation scripts
- [ ] Implementing metrics collection
- [ ] Generating code or types
- [ ] Working with AI context management
- [ ] Building CLI interfaces
- [ ] Creating test utilities or fixtures
- [ ] Performance profiling or monitoring

### Refer to Other Contexts When:

| Context | When to Use |
|---------|-------------|
| [scripts/AGENT.md](/scripts/AGENT.md) | Orchestration scripts or shell automation |
| [tests/AGENT.md](/tests/AGENT.md) | Writing test cases for tools |
| [.github/AGENT.md](/.github/AGENT.md) | AI workflows or prompt engineering |
| [docs/AGENT.md](/docs/AGENT.md) | Documentation generation or spec parsing |
| [libs/AGENT.md](/libs/AGENT.md) | Business logic (not tooling) |

## 🔧 Local Conventions

### Language Choice Guidelines

**Use TypeScript/JavaScript when:**
- Integrating with Nx workspace
- Working with Node.js ecosystem
- Building CLI tools with inquirer, commander
- Processing JSON or YAML files
- Type generation from schemas

**Use Python when:**
- Text processing or parsing
- Data analysis or metrics
- Template validation (Jinja2)
- Scientific computing or ML
- File system batch operations

### Coding Standards

#### TypeScript Tools
```typescript
// Strict mode always enabled
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Export typed interfaces
export interface ToolOptions {
  verbose: boolean;
  dryRun: boolean;
}

// Pure functions preferred
export function processFile(path: string, options: ToolOptions): Result {
  // Implementation
}

// Error handling with proper types
export class ToolError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ToolError';
  }
}
```

#### Python Tools
```python
"""
Module docstring with purpose and usage.

Example:
    python tools/my_tool.py --input file.txt
"""
from pathlib import Path
from typing import Optional, List
import sys

def process_files(
    input_path: Path,
    output_path: Optional[Path] = None,
    verbose: bool = False
) -> List[str]:
    """Process files with type hints.

    Args:
        input_path: Input file or directory path
        output_path: Optional output path
        verbose: Enable verbose output

    Returns:
        List of processed file paths

    Raises:
        FileNotFoundError: If input_path doesn't exist
        ValueError: If input is invalid
    """
    # Implementation with proper error handling
```

### Testing Requirements

**All tools must have tests:**
- Unit tests in `tests/unit/tools/`
- Use `node:assert` for simple Node tests
- Use `pytest` for Python tests
- Mock file system operations
- Test error conditions

**Example test structure:**
```typescript
// tests/unit/tools/context_manager.test.ts
import assert from 'node:assert';
import { describe, it } from 'node:test';
import { ContextManager } from '../../../tools/ai/context_manager';

describe('ContextManager', () => {
  it('should bundle context files', () => {
    // Arrange, Act, Assert
  });
});
```

### CLI Tool Conventions

**Use consistent patterns:**
```typescript
#!/usr/bin/env node
import { Command } from 'commander';
import { version } from '../package.json';

const program = new Command();

program
  .name('dev-cli')
  .description('Developer CLI for VibesPro')
  .version(version);

program
  .command('validate')
  .description('Validate project files')
  .option('-v, --verbose', 'Verbose output')
  .option('--dry-run', 'Dry run mode')
  .action((options) => {
    // Implementation
  });

program.parse();
```

### Error Handling & Logging

**Structured logging:**
```typescript
import { createLogger } from './logging/structured_logger';

const logger = createLogger('tool-name');

logger.info('Processing files', { count: 5, path: '/some/path' });
logger.error('Failed to process', { error: err, context: { file: 'x.ts' } });
```

**Exit codes:**
```typescript
// Success
process.exit(0);

// Validation error
process.exit(1);

// Runtime error
process.exit(2);

// Configuration error
process.exit(3);
```

## 📚 Related Instructions

**Modular instructions that apply here:**
- [.github/instructions/testing.instructions.md](/.github/instructions/testing.instructions.md) - Testing strategies
- [.github/instructions/security.instructions.md](/.github/instructions/security.instructions.md) - Security in tools
- [.github/instructions/style.frontend.instructions.md](/.github/instructions/style.frontend.instructions.md) - TypeScript style
- [.github/instructions/style.python.instructions.md](/.github/instructions/style.python.instructions.md) - Python style
- [.github/instructions/performance.instructions.md](/.github/instructions/performance.instructions.md) - Performance guidelines

**Relevant prompts:**
- [.github/prompts/tool.techstack.sync.prompt.md](/.github/prompts/tool.techstack.sync.prompt.md) - Techstack synchronization

## 💡 Examples

### Example 1: Creating a Validation Tool (TypeScript)

```typescript
// tools/validate/validate_config.ts
import { readFileSync } from 'node:fs';
import { z } from 'zod';

// Define schema
const ConfigSchema = z.object({
  version: z.string(),
  features: z.array(z.string()),
  settings: z.record(z.unknown()),
});

export type Config = z.infer<typeof ConfigSchema>;

export function validateConfig(filePath: string): Config {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const json = JSON.parse(content);
    return ConfigSchema.parse(json);
  } catch (error) {
    throw new ValidationError(
      `Invalid config file: ${filePath}`,
      'INVALID_CONFIG',
      { originalError: error }
    );
  }
}

// CLI wrapper
if (import.meta.url === `file://${process.argv[1]}`) {
  const [,, filePath] = process.argv;
  try {
    const config = validateConfig(filePath);
    console.log('✅ Config is valid');
    process.exit(0);
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    process.exit(1);
  }
}
```

### Example 2: Token Measurement Tool (Python)

```python
# tools/metrics/token_metrics.py
"""Token measurement and tracking utility."""
from pathlib import Path
from typing import Dict, List
import tiktoken
import json

def count_tokens(text: str, model: str = "gpt-4") -> int:
    """Count tokens using tiktoken.

    Args:
        text: Input text to tokenize
        model: Model name for tokenizer

    Returns:
        Token count
    """
    encoding = tiktoken.encoding_for_model(model)
    return len(encoding.encode(text))

def analyze_file(file_path: Path) -> Dict[str, int]:
    """Analyze token usage in a file.

    Returns:
        Dict with metrics: tokens, lines, chars
    """
    content = file_path.read_text()
    return {
        "tokens": count_tokens(content),
        "lines": len(content.splitlines()),
        "chars": len(content),
        "file": str(file_path),
    }

def main(files: List[Path], output: Path | None = None) -> None:
    """Analyze multiple files and save metrics."""
    results = [analyze_file(f) for f in files]

    if output:
        output.write_text(json.dumps(results, indent=2))
    else:
        print(json.dumps(results, indent=2))

if __name__ == "__main__":
    import sys
    files = [Path(p) for p in sys.argv[1:]]
    main(files)
```

### Example 3: Type Generator from Schema

```typescript
// tools/type-generator/generate_schema_types.ts
import { compile } from 'json-schema-to-typescript';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

export async function generateTypes(
  schemaPath: string,
  outputPath: string
): Promise<void> {
  const schema = JSON.parse(readFileSync(schemaPath, 'utf-8'));

  const types = await compile(schema, schema.title || 'Schema', {
    bannerComment: '/* Generated by generate_schema_types.ts - DO NOT EDIT */',
    style: {
      semi: true,
      singleQuote: true,
      trailingComma: 'es5',
    },
  });

  writeFileSync(outputPath, types);
  console.log(`✅ Generated types: ${outputPath}`);
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const [,, schemaPath, outputPath] = process.argv;
  generateTypes(schemaPath, outputPath).catch((err) => {
    console.error('❌ Generation failed:', err);
    process.exit(1);
  });
}
```

### Example 4: AI Context Bundler

```typescript
// tools/ai/context_manager.ts
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { glob } from 'glob';

export interface ContextBundle {
  files: Map<string, string>;
  metadata: {
    timestamp: string;
    totalFiles: number;
    totalTokens: number;
  };
}

export class ContextManager {
  constructor(private readonly rootDir: string) {}

  async bundleContext(outputDir: string): Promise<ContextBundle> {
    const files = new Map<string, string>();

    // Collect CALM docs
    const calmFiles = await glob('architecture/calm/**/*.md', {
      cwd: this.rootDir,
    });

    // Collect specs
    const specFiles = await glob('docs/dev_*.md', {
      cwd: this.rootDir,
    });

    // Read and bundle
    for (const file of [...calmFiles, ...specFiles]) {
      const fullPath = join(this.rootDir, file);
      const content = readFileSync(fullPath, 'utf-8');
      files.set(file, content);
    }

    // Write bundle
    mkdirSync(outputDir, { recursive: true });

    for (const [file, content] of files) {
      const outPath = join(outputDir, file);
      mkdirSync(join(outPath, '..'), { recursive: true });
      writeFileSync(outPath, content);
    }

    return {
      files,
      metadata: {
        timestamp: new Date().toISOString(),
        totalFiles: files.size,
        totalTokens: this.estimateTokens(files),
      },
    };
  }

  private estimateTokens(files: Map<string, string>): number {
    // Rough estimate: ~4 chars per token
    const totalChars = Array.from(files.values())
      .reduce((sum, content) => sum + content.length, 0);
    return Math.ceil(totalChars / 4);
  }
}
```

## ✅ Checklist

### Before Creating a New Tool:

- [ ] Check if similar tool already exists
- [ ] Choose appropriate language (TS vs Python)
- [ ] Define clear purpose and interface
- [ ] Plan error handling strategy
- [ ] Design for testability
- [ ] Consider CLI usage patterns

### While Developing:

- [ ] Write type definitions (TypeScript) or type hints (Python)
- [ ] Implement proper error handling
- [ ] Add logging for debugging
- [ ] Write unit tests
- [ ] Add docstrings/JSDoc comments
- [ ] Handle edge cases

### After Developing:

- [ ] Run linters: `pnpm lint` or `ruff check`
- [ ] Run type checker: `tsc --noEmit` or `mypy`
- [ ] Run tests: `just test-unit`
- [ ] Update this AGENT.md if new pattern emerges
- [ ] Document usage in tool's README or docstring
- [ ] Add to justfile if frequently used

## 🔍 Quick Reference

### Common Commands

```bash
# Run Node.js tools
node tools/path/to/tool.js [args]
pnpm tsx tools/path/to/tool.ts [args]

# Run Python tools
python tools/path/to/tool.py [args]
uv run tools/path/to/tool.py [args]

# Run tests for tools
pnpm test:tools
pytest tests/unit/tools/

# Lint tools
pnpm lint
ruff check tools/

# Type check
tsc --noEmit
mypy tools/
```

### Key Tools by Category

#### AI & Context
- `ai/context_manager.ts` - Bundle AI context
- `ai/token_counter.ts` - Count tokens
- `prompt/render_prompt.js` - Render prompts

#### Validation
- `prompt/validate_prompts.py` - Validate prompt files
- `ci/validate_workflows.js` - Validate GitHub Actions
- `check_templates.py` - Validate Jinja2 templates

#### Metrics
- `metrics/token_metrics.py` - Track token usage
- `metrics/build_metrics.js` - Build performance
- `performance/profiler.js` - Performance profiling

#### Generation
- `type-generator/generate_schema_types.ts` - Generate types
- `docs/generate_api_docs.ts` - Generate API docs
- `test/fixture_generator.py` - Generate test fixtures

#### Documentation
- `docs/link_check.js` - Check markdown links
- `calm/generate_calm.py` - Generate CALM diagrams

## 🛡️ Security Considerations

**CRITICAL** for tools:

- ⚠️ **NEVER** hardcode secrets or API keys in tool code
- ⚠️ **NEVER** execute arbitrary user input without validation
- ⚠️ Validate all file paths (avoid path traversal)
- ⚠️ Sanitize shell commands (avoid injection)
- ⚠️ Use environment variables for sensitive configuration
- ⚠️ Audit dependencies regularly: `just audit`

**Example secure file access:**
```typescript
import { resolve, relative, dirname } from 'node:path';

function safeReadFile(basePath: string, userPath: string): string {
  const resolved = resolve(basePath, userPath);
  const rel = relative(basePath, resolved);

  // Prevent path traversal
  if (rel.startsWith('..') || resolve(rel) !== resolved) {
    throw new Error('Invalid path: path traversal detected');
  }

  return readFileSync(resolved, 'utf-8');
}
```

## 🎯 Integration Patterns

### With Justfile

Add frequently used tools to `justfile`:

```makefile
# Run token metrics
token-metrics file:
    python tools/metrics/token_metrics.py {{file}}

# Validate templates
validate-templates:
    python tools/check_templates.py

# Generate types
generate-types schema output:
    pnpm tsx tools/type-generator/generate_schema_types.ts {{schema}} {{output}}
```

### With CI/CD

Integrate validation tools in `.github/workflows/`:

```yaml
- name: Validate prompts
  run: python tools/prompt/validate_prompts.py .github/prompts/

- name: Check links
  run: node tools/docs/link_check.js docs/
```

### With Nx Workspace

Register tools as Nx targets in `project.json`:

```json
{
  "targets": {
    "validate": {
      "executor": "nx:run-commands",
      "options": {
        "command": "python tools/check_templates.py"
      }
    }
  }
}
```

## 📊 Testing Strategy

**Tool testing priorities:**

1. **Input validation** - Test with invalid inputs
2. **Error handling** - Verify error messages and codes
3. **Edge cases** - Empty files, special characters, large inputs
4. **Integration** - Test with real project files (fixtures)
5. **Performance** - Benchmark for large inputs

**Example test:**
```typescript
import { describe, it } from 'node:test';
import assert from 'node:assert';
import { validateConfig } from '../../../tools/validate/validate_config';

describe('validateConfig', () => {
  it('should validate correct config', () => {
    const result = validateConfig('tests/fixtures/valid_config.json');
    assert.ok(result);
    assert.strictEqual(result.version, '1.0.0');
  });

  it('should throw on invalid config', () => {
    assert.throws(
      () => validateConfig('tests/fixtures/invalid_config.json'),
      /Invalid config/
    );
  });
});
```

## 🔄 Maintenance

### Regular Tasks

- **Weekly**: Run tool tests to catch regressions
- **Monthly**: Update tool dependencies
- **Quarterly**: Audit tool usage and deprecate unused tools
- **As needed**: Refactor based on usage patterns

### When to Update This AGENT.md

- New tool category added
- Testing patterns change
- CLI conventions evolve
- Integration patterns emerge
- Security best practices update

---

_Last updated: 2025-10-13 | Maintained by: VibesPro Project Team_
_Parent context: [copilot-instructions.md](/.github/copilot-instructions.md) | Navigation: [AGENT-MAP.md](/AGENT-MAP.md)_
