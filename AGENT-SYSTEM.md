# 🗺️ Distributed Agent System - Quick Start

> **Status**: Phase 1 Complete ✅ | **Created**: 2025-10-13

## What Is This?

A **semantic routing network** of AGENT.md files throughout the project that provide local, context-specific guidance for AI-assisted development. Think of it as a distributed version of `copilot-instructions.md` optimized for specific directories.

## Quick Navigation

**Start Here**: [AGENT-MAP.md](/AGENT-MAP.md) - Complete navigation hub and routing strategy

### Core Infrastructure (Phase 1 - ✅ Complete)

-   [.github/AGENT.md](/.github/AGENT.md) - AI development system (prompts, instructions, chat modes)
-   [docs/AGENT.md](/docs/AGENT.md) - Documentation & specifications (ADR, PRD, SDS, traceability)
-   [tools/AGENT.md](/tools/AGENT.md) - Development tools (utilities, generators, metrics)
-   [scripts/AGENT.md](/scripts/AGENT.md) - Orchestration scripts (shell automation, justfile)

### Coming Soon (Phase 2)

-   `apps/AGENT.md` - Application interfaces
-   `libs/AGENT.md` - Business logic libraries
-   `tests/AGENT.md` - Testing infrastructure
-   `generators/AGENT.md` - Code generators
-   `templates/AGENT.md` - Jinja2 templates

## How to Use

### For AI Assistants

1. **Check current directory** for AGENT.md when starting a task
2. **Read local context** and routing rules
3. **Follow parent links** for broader architectural guidance
4. **Apply referenced instructions** via precedence order
5. **Use examples** as implementation patterns

### For Developers

1. **Navigate to AGENT-MAP.md** when starting work in unfamiliar area
2. **Use "By Task Type"** table to find relevant context
3. **Read directory-specific AGENT.md** for local conventions
4. **Follow checklists** before/after implementation
5. **Update AGENT.md** when patterns evolve

## Key Benefits

✅ **Context-Aware**: AI gets exactly the guidance needed for each directory
✅ **Reduced Overload**: No need to process entire copilot-instructions.md every time
✅ **Clear Boundaries**: Know when to use this context vs refer elsewhere
✅ **Actionable**: Checklists and examples make it easy to follow
✅ **Maintainable**: Distributed system evolves naturally with project
✅ **Navigable**: Cross-reference network enables efficient discovery

## Integration with Existing System

| File                              | Role                 | Authority Level |
| --------------------------------- | -------------------- | --------------- |
| `.github/copilot-instructions.md` | Master guidance      | **Supreme**     |
| `.github/instructions/*.md`       | Modular rules (MECE) | **High**        |
| `AGENT-MAP.md`                    | Navigation hub       | Reference       |
| `*/AGENT.md`                      | Local context        | **Local**       |

**Note**: copilot-instructions.md remains the supreme authority. AGENT.md files provide complementary local context.

## Routing Strategy

```
New Task → AGENT-MAP.md → Relevant AGENT.md → Local Conventions + Examples
                ↓
        Apply modular instructions (precedence: Security > Testing > General)
                ↓
        Reference parent context for architecture
                ↓
        Implement with traceability
```

## Example Workflow

**Implementing a feature from spec:**

1. Start at [docs/AGENT.md](/docs/AGENT.md) - Read spec hierarchy and traceability requirements
2. Navigate to [libs/AGENT.md](/libs/AGENT.md) - Understand hexagonal architecture patterns
3. Check [tests/AGENT.md](/tests/AGENT.md) - Plan testing strategy
4. Reference [.github/AGENT.md](/.github/AGENT.md) - Use TDD chat modes
5. Follow checklists in each context

**Writing a development tool:**

1. Start at [tools/AGENT.md](/tools/AGENT.md) - Read language choice guidelines
2. Check [scripts/AGENT.md](/scripts/AGENT.md) - Determine if script is more appropriate
3. Reference [tests/AGENT.md](/tests/AGENT.md) - Plan unit tests
4. Follow coding standards and examples

## File Structure

Each AGENT.md follows this structure:

```markdown
📍 Context (Purpose and when to use)
🔗 Parent Context (Link to parent/navigation)
🎯 Local Scope (What this directory handles)
📁 Key Files & Patterns (Directory structure, naming)
🧭 Routing Rules (When to use vs refer elsewhere)
🔧 Local Conventions (Specific guidelines)
📚 Related Instructions (Modular instructions that apply)
💡 Examples (Real-world patterns)
✅ Checklist (Before/after actions)
🔍 Quick Reference (Commands, concepts)
🛡️ Security (Security considerations)
🔄 Maintenance (When to update)
```

## Commands

```bash
# Find all AGENT.md files
find . -name "AGENT.md" -type f

# Search AGENT.md content
grep -r "search term" */AGENT.md

# View navigation map
cat AGENT-MAP.md

# Validate (when CI is set up)
just validate-agent-files  # TODO: Add to justfile
```

## Maintenance

**When to update AGENT.md:**

-   New patterns emerge in the directory
-   Conventions change
-   Examples become outdated
-   Related contexts are added/removed
-   Security best practices evolve

**How to update:**

1. Edit relevant AGENT.md file
2. Update cross-references if structure changes
3. Validate links still work
4. Update AGENT-MAP.md if new context added
5. Submit PR with changes

## Learn More

-   [AGENT-MAP.md](/AGENT-MAP.md) - Complete navigation and routing strategy
-   [docs/work-summaries/2025-10-13-distributed-agent-system.md](/docs/work-summaries/2025-10-13-distributed-agent-system.md) - Detailed implementation summary
-   [.github/copilot-instructions.md](/.github/copilot-instructions.md) - Master project guidance

## Feedback

This is a living system. If you find:

-   Missing contexts that would be valuable
-   Outdated information
-   Unclear routing logic
-   Better examples

Please update the relevant AGENT.md file or open an issue!

---

_For detailed implementation notes, see: [docs/work-summaries/2025-10-13-distributed-agent-system.md](/docs/work-summaries/2025-10-13-distributed-agent-system.md)_
