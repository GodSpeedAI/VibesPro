{# Full AGENT.md content copied from repository canonical file. #}

> **Purpose**: AI Development System - Prompts, instructions, chat modes, and workflows for AI-assisted development.
> **When to use**: When working with AI assistance features, prompt engineering, instruction files, chat modes, or CI/CD workflows.

## 🔗 Parent Context

See [root copilot-instructions.md](/.github/copilot-instructions.md) for comprehensive project guidance and [AGENT-MAP.md](/AGENT-MAP.md) for navigation across contexts.

## 🎯 Local Scope

**This directory handles:**

- Modular instruction files (MECE principle)
- Task-specific prompts for common workflows
- Specialized AI personas via chat modes
- CI/CD automation workflows
- GitHub Actions and integration

**Architecture Layer**: N/A (Infrastructure/Tooling)

## 📁 Key Files & Patterns

### Directory Structure

```
.github/
├── copilot-instructions.md    # Master AI guidance (supreme authority)
├── instructions/               # Modular MECE instruction files
│   ├── security.instructions.md          (precedence: 10) ⚠️
│   ├── generators-first.instructions.md  (precedence: 15)
│   ├── ai-workflows.instructions.md      (precedence: 20)
│   ├── testing.instructions.md           (precedence: 35)
│   ├── general.instructions.md           (precedence: 50)
│   └── style.*.instructions.md
├── prompts/                    # Task-specific prompts
│   ├── tdd.workflow.prompt.md
│   ├── debug.workflow.prompt.md
│   ├── spec.*.prompt.md
│   └── sec.review.prompt.md
├── chatmodes/                  # Specialized AI personas
│   ├── tdd.{red,green,refactor}.chatmode.md
│   ├── debug.*.chatmode.md
│   ├── persona.*.chatmode.md
│   └── spec.*.chatmode.md
└── workflows/                  # GitHub Actions CI/CD
    └── *.yml
```

### File Naming Conventions

| File Type        | Pattern                   | Location        | Example                    |
| ---------------- | ------------------------- | --------------- | -------------------------- |
| **Instructions** | `*.instructions.md`       | `instructions/` | `security.instructions.md` |
| **Prompts**      | `*.prompt.md`             | `prompts/`      | `tdd.workflow.prompt.md`   |
| **Chat Modes**   | `domain.task.chatmode.md` | `chatmodes/`    | `tdd.red.chatmode.md`      |
| **Workflows**    | `*.yml` or `*.yaml`       | `workflows/`    | `ci.yml`                   |

### Instruction File Frontmatter

```yaml
---
description: "Brief description"
applyTo: "**" # or specific glob pattern
kind: instructions
domain: security|testing|general|etc
precedence: 10-50 # Lower = higher priority
---
```

## 🧭 Routing Rules

### Use This Context When

- [ ] Working with AI assistance features or AI workflows
- [ ] Creating or modifying prompts
- [ ] Developing chat mode personas
- [ ] Writing instruction files
- [ ] Configuring CI/CD workflows
- [ ] Understanding modular instruction stacking

### Refer to Other Contexts When

| Context                               | When to Use                                        |
| ------------------------------------- | -------------------------------------------------- |
| [docs/AGENT.md](/docs/AGENT.md)       | Implementing from specifications or updating specs |
| [tests/AGENT.md](/tests/AGENT.md)     | Writing test cases or following TDD workflow       |
| [tools/AGENT.md](/tools/AGENT.md)     | Building development tools or utilities            |
| [scripts/AGENT.md](/scripts/AGENT.md) | Creating automation scripts                        |

## 🔧 Local Conventions

### Modular Instruction Stacking (MECE)

**Precedence Order** (lower number = higher priority):

1. **security.instructions.md** (10) - ⚠️ HIGHEST PRIORITY - ALWAYS APPLIES
2. **generators-first.instructions.md** (15) - Check for Nx generators first
3. **ai-workflows.instructions.md** (20) - TDD/Debug workflow policies
4. **commit-msg.instructions.md** (15) - Commit message standards
5. **testing.instructions.md** (35) - Testing strategies
6. **general.instructions.md** (50) - General guidelines
7. **performance.instructions.md** (34) - Performance considerations
8. **style.\*.instructions.md** (varies) - Language-specific styles

**Critical Rule**: Security guidelines override ALL other guidelines.

### Chat Mode Organization

**Workflow Modes:**

- `tdd.red` → `tdd.green` → `tdd.refactor` (Test-Driven Development cycle)
- `debug.start` → `debug.repro` → `debug.isolate` → `debug.fix` → `debug.refactor` → `debug.regress`
- `spec.lean` / `spec.wide` / `spec.nfr` (Specification generation)

**Persona Modes:**

- `persona.navigator` - Elite multi-language coding assistant with MCP
- `persona.system-architect` - Architectural guidance
- `persona.senior-backend` - Backend best practices
- `persona.senior-frontend` - Frontend patterns
- `persona.qa` - Testing strategies

**Product Modes:**

- `product.manager` - Product planning
- `product.elevator-pitch` - Value proposition
- `product.features-list` - Feature breakdown

### Prompt Engineering Patterns

**Prompt Structure:**

1. **Context Section**: Describe the scenario
2. **Task Section**: Define what needs to be done
3. **Examples Section**: Show expected patterns
4. **Validation Section**: Define success criteria
5. **References Section**: Link to specs, instructions, or other prompts

**Variable Usage:**

```markdown
${selection}      # Current editor selection
${fileBasename} # Current file name
${workspaceFolder} # Workspace root path
```

### Naming for AI Recipes

- Use `ai-*` prefix for justfile recipes (e.g., `ai-validate`, `ai-context-bundle`)
- Use `domain.task` pattern for chat modes (e.g., `tdd.red`, `debug.start`)
- Prefix custom prompts with `vibecoder-` to avoid conflicts

## 📚 Related Instructions

**Core instruction files:**

- [instructions/security.instructions.md](/.github/instructions/security.instructions.md) - Security guidelines (HIGHEST PRIORITY)
- [instructions/ai-workflows.constitution.instructions.md](/.github/instructions/ai-workflows.constitution.instructions.md) - Workflow constitution
- [instructions/ai-workflows.instructions.md](/.github/instructions/ai-workflows.instructions.md) - Workflow policies
- [instructions/generators-first.instructions.md](/.github/instructions/generators-first.instructions.md) - Generator-first approach
- [instructions/testing.instructions.md](/.github/instructions/testing.instructions.md) - Testing strategies
- [instructions/general.instructions.md](/.github/instructions/general.instructions.md) - General conventions
- [prompts/tdd.workflow.prompt.md](/.github/prompts/tdd.workflow.prompt.md) - TDD guidance

**Key prompts:**

- [prompts/tdd.workflow.prompt.md](/.github/prompts/tdd.workflow.prompt.md) - TDD guidance
- [prompts/debug.workflow.prompt.md](/.github/prompts/debug.workflow.prompt.md) - Debug workflow
- [prompts/sec.review.prompt.md](/.github/prompts/sec.review.prompt.md) - Security audit
- [prompts/spec.implement.prompt.md](/.github/prompts/spec.implement.prompt.md) - Implement from spec

## 💡 Examples

### Example 1: Creating a New Instruction File

```markdown
---
description: "Brief description of the instruction domain"
applyTo: "**"
kind: instructions
domain: your-domain
precedence: 40
---

# Your Domain Instructions

- Rule 1: Clear, actionable guideline
- Rule 2: Another guideline
- Rule 3: With examples where helpful

## Integration with Other Guidelines

- Defer to security.instructions.md for security concerns
- Reference testing.instructions.md for test patterns
```

### Example 2: Creating a Chat Mode

```markdown
---
name: "domain.task"
description: "Brief description of this persona/workflow"
instructions:
    - /.github/instructions/security.instructions.md
    - /.github/instructions/relevant.instructions.md
prompts:
    - /.github/prompts/relevant.prompt.md
---

# Domain Task Chat Mode

## Persona

You are a [role description]...

## Context

This mode is used when [scenario]...

## Workflow

1. Step 1
2. Step 2
3. Step 3

## Examples

[Concrete examples]
```

### Example 3: TDD Workflow

**Sequence:**

1. Start with `tdd.red` chat mode → Write failing test
2. Switch to `tdd.green` chat mode → Implement minimal code to pass
3. Switch to `tdd.refactor` chat mode → Improve code quality

**Commands:**

```bash
# Run AI validation after implementation
just ai-validate

# Generate context bundle for AI
just ai-context-bundle
```

### Example 4: Debug Workflow

**Sequence:**

1. `debug.start` → Understand the issue
2. `debug.repro` → Create minimal reproduction
3. `debug.isolate` → Narrow down the root cause
4. `debug.fix` → Implement the fix
5. `debug.refactor` → Improve related code
6. `debug.regress` → Add regression tests

## ✅ Checklist

### Before Creating New AI Guidance

- [ ] Check if existing instruction/prompt/chat mode can be extended
- [ ] Follow naming conventions (domain.task for chat modes)
- [ ] Add frontmatter with appropriate metadata
- [ ] Reference related modular instructions
- [ ] Include concrete examples
- [ ] Link to specifications or ADRs if applicable
- [ ] Test with actual AI assistant

### After Creating AI Guidance

- [ ] Run `just prompt-lint` to validate
- [ ] Update cross-references in related files
- [ ] Add entry to this AGENT.md if it's a new pattern
- [ ] Update [AGENT-MAP.md](/AGENT-MAP.md) if needed
- [ ] Document in commit message with spec IDs

## 🔍 Quick Reference

### Common Commands

```bash
# Validate all AI guidance files
just ai-validate

# Lint prompt files
just prompt-lint

# Generate AI context bundle
just ai-context-bundle

# Validate spec matrix
just spec-guard

# Check all chat modes
node scripts/check_all_chatmodes.mjs

# Normalize chat mode format
node scripts/normalize_chatmodes.mjs
```

### Key Concepts

- **MECE Principle**: Mutually Exclusive, Collectively Exhaustive - each instruction file covers a distinct domain
- **Precedence**: Security (10) always wins; lower numbers take priority
- **Stacking**: Instructions compose per task in precedence order
- **Routing**: Chat modes and prompts route AI to appropriate context
- **Context Bundle**: Generated docs bundle for optimal AI context

### Validation Tools

| Tool                      | Purpose                                   | Location |
| ------------------------- | ----------------------------------------- | -------- |
| `prompt-lint`             | Validate prompt frontmatter and structure | justfile |
| `check_all_chatmodes.mjs` | Validate chat mode definitions            | scripts/ |
| `normalize_chatmodes.mjs` | Standardize chat mode format              | scripts/ |
| `check_model_lint.mjs`    | Validate model references                 | scripts/ |

## 🛡️ Security Considerations

**CRITICAL**: When working in this directory:

- ⚠️ **NEVER** modify `.vscode/settings.json` or `.vscode/tasks.json` without explicit user confirmation
- ⚠️ **NEVER** enable `chat.tools.autoApprove` in any configuration
- ⚠️ **NEVER** hardcode secrets in prompt files or instruction files
- ⚠️ Use environment variables for MCP tool auth tokens
- ⚠️ Validate all user inputs in workflow files
- ⚠️ Review GitHub Actions for command injection vulnerabilities

**Reference**: [instructions/security.instructions.md](/.github/instructions/security.instructions.md)

## 🎯 Workflow Integration

### Research → Plan → Implement → Validate

When creating AI guidance, always:

1. **Research**: Check existing prompts/instructions for similar patterns
2. **Plan**: Propose structure and get developer approval
3. **Implement**: Follow conventions and examples
4. **Validate**: Run linters and test with AI assistant

### Generator-First Approach

Before writing custom AI guidance:

- Check if existing instruction files can be extended
- Look for similar chat modes or prompts
- Consult [instructions/generators-first.instructions.md](/.github/instructions/generators-first.instructions.md)

## 📊 Metrics & Monitoring

### Token Usage Tracking

```bash
# Measure tokens in prompts
scripts/measure_tokens.sh .github/prompts/your-prompt.md

# Enhanced token measurement (Python)
python scripts/measure_tokens_enhanced.py --file .github/prompts/your-prompt.md
```

### Context Bundle Generation

```bash
# Generate AI context bundle
just ai-context-bundle

# Output location: docs/ai_context_bundle/
# Includes: CALM docs, techstack, specs, traceability matrix
```

## 🔄 Maintenance

### Regular Tasks

- **Weekly**: Review new prompts and chat modes for consistency
- **Monthly**: Update cross-references if structure changes
- **Quarterly**: Audit instruction precedence and conflicts
- **As needed**: Refine based on AI assistant feedback

### When to Update This AGENT.md

- New instruction file added to `instructions/`
- New chat mode pattern emerges
- Workflow processes change
- Naming conventions evolve
- Integration with new tools

---

_Last updated: 2025-10-13 | Maintained by: VibesPro Project Team_
_Parent context: [copilot-instructions.md](/.github/copilot-instructions.md) | Navigation: [AGENT-MAP.md](/AGENT-MAP.md)_

```<!-- Copied from repository .github/AGENT.md -->
# .github/ Agent Instructions

## 📍 Context

> **Purpose**: AI Development System - Prompts, instructions, chat modes, and workflows for AI-assisted development.
> **When to use**: When working with AI assistance features, prompt engineering, instruction files, chat modes, or CI/CD workflows.

Refer to the repo `.github/AGENT.md` for the canonical content. This file is included in the project template for generated projects.
```
