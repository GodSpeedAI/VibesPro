# AI-Enhanced Development Tools

This directory contains AI workflow enhancement tools for the {{project_name}} project.

## Components

### Context Manager (`context-manager.ts`)

- Optimizes AI context selection within token budgets
- Implements relevance scoring and priority-based selection
- Supports multiple context sources with different priorities

### Workflow Integration

- GitHub Actions workflows for AI-assisted development
- Automated code generation suggestions
- Pattern recognition from temporal learning system

## Usage

```typescript
import { AIContextManager } from "./context-manager.js";

const manager = new AIContextManager({
  maxTokens: 8000,
  reservedTokens: 2000,
});

const context = await manager.getOptimalContext("Create user entity");
console.log(
  `Generated context: ${context.tokenCount} tokens, relevance: ${context.relevanceScore}`,
);
```

## Configuration

Set environment variables for AI integration:

```env
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
AI_CONTEXT_MAX_TOKENS=8000
AI_CONTEXT_RESERVED_TOKENS=2000
```
