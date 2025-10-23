# Onboarding Chatmode Enhancement

**Date**: 2025-01-19
**Enhancement**: Interactive walkthrough of available resources
**Related**: Copilot Instructions Template Enhancement

---

## Overview

Enhanced the onboarding chatmode to provide optional interactive walkthroughs of project resources (just recipes, chatmodes, prompts, tools) with clear guidance on when and why to use them.

## Problem Statement

The original onboarding chatmode was:

- Static list of links and quick tips
- No interactive exploration
- Limited guidance on when/why to use tools
- Overwhelming for new users (all info at once)
- No differentiation based on user experience level

## Solution: Interactive Guided Onboarding

### New Approach

**Two-Track System:**

1. **Quick Overview** - Fast start for experienced developers
2. **Interactive Walkthroughs** - Deep dives for those who want to learn

**User-Driven Exploration:**

- User chooses what to explore
- Progressive disclosure (start simple, go deep)
- Context-specific guidance (when/why to use each tool)

### Opening Experience

```
👋 Welcome to {{ project_name }}!

I'm here to help you get started. I can provide:

1. Quick Overview - Project structure, key resources, first steps
2. Interactive Walkthrough - Deep dive into:
   - 🔧 Just Recipes (orchestration commands)
   - 💬 Chat Modes (AI personas for different tasks)
   - 📋 Prompts (task-specific AI workflows)
   - 🛠️ Tools (MCP servers, utilities)
   - 🚀 Development Workflows (TDD, Debug, Spec-driven)

What would you like to explore?
```

## Interactive Walkthroughs

### 1. Just Recipes Walkthrough

**Categories:**

- **Development** (`just dev`, `just setup`)
- **Code Quality** (`just lint`, `just test`, `just ai-validate`)
- **AI Workflows** (`just ai-scaffold`, `just customize-instructions`, `just ai-context-bundle`)

**Format for Each Recipe:**

```
- `just <command>` - Description
  **When**: Specific trigger/situation
  **Why**: Benefit/rationale
```

**Example:**

```
- `just ai-scaffold name=<generator>` - Run Nx generator
  **When**: Creating new components/libs/apps
  **Why**: Ensures consistent structure, proper config
```

### 2. Chat Modes Walkthrough

**Organized by Workflow:**

**TDD Workflow:**

- `tdd.red` → `tdd.green` → `tdd.refactor`
- Explains the cycle
- Shows when to use each phase

**Debug Workflow:**

- `debug.start` → `debug.repro` → `debug.fix`
- Structured debugging approach

**Customization:**

- `meta.customize-instructions`
- Audit-first customization

**Usage Instructions:**

```
Usage in VS Code:
1. Open GitHub Copilot chat
2. Reference: @chatmode-name
3. Example: @tdd.red then describe feature
```

### 3. Prompts Walkthrough

**Key Prompts:**

- `customize.copilot-instructions.prompt.md` - Intelligent customization

**How to Use:**

1. Via Chat (copy prompt content)
2. Via Just (recipes invoke prompts)
3. Via Chatmode (modes reference prompts)

### 4. Tools Walkthrough

**MCP Servers by Category:**

**Documentation:**

- Context7 - Library docs
- Microsoft Docs - Azure/TypeScript docs

**Search & Analysis:**

- Exa Code - Code search

**Development:**

- Nx MCP - Nx workspace operations
- Pylance MCP - Python language server

**Format:**

```
- **Tool Name** - Description
  **When**: Use case
  **Why**: Benefit
```

### 5. Development Workflows Walkthrough

**Core Workflows:**

1. **Generator-First** (CRITICAL)

   - Always check generators first
   - Example commands
   - Reference to instructions

2. **Research → Plan → Implement → Validate**

   - Each phase explained
   - When to use

3. **TDD Workflow**

   - Red → Green → Refactor cycle
   - When/why to use

4. **Spec-Driven**
   - If using formal specs
   - ADR → SDS/TS → PRD flow

## Adaptive Approach

### For New Users

- Start with Quick Overview
- Suggest `just setup`
- Recommend reading copilot-instructions.md

### For Experienced Developers

- Go straight to requested walkthrough
- Provide commands and file paths
- Less explanation, more actionable info

### For Overwhelmed Users

- Simplify to 3 key takeaways:
  1. Run `just setup`
  2. Use `just ai-scaffold` before writing code
  3. Reference copilot-instructions.md

## Quick Reference Card

Always available summary:

```
Essential Commands:
- just setup                    # First-time setup
- just dev                      # Start development
- just ai-scaffold name=<gen>   # Use generator
- just customize-instructions   # Customize AI guidance
- just ai-validate             # Validate before commit
- just test                     # Run tests

Essential Files:
- .github/copilot-instructions.md
- .github/instructions/generators-first.instructions.md
- .github/instructions/security.instructions.md
- docs/dev_spec_index.md

Essential Workflows:
1. Generator-first (always)
2. Research → Plan → Implement → Validate
3. TDD for complex logic
4. Security-first (non-negotiable)
```

## Benefits

### For New Contributors

1. **Progressive Learning** - Choose depth of information
2. **Context-Aware** - Understand when/why, not just what
3. **Interactive** - Engage with material vs passive reading
4. **Customized Pace** - Quick overview or deep dive
5. **Always Accessible** - Can return for specific topics

### For Project Maintainers

1. **Reduced Onboarding Time** - Self-service learning
2. **Consistent Knowledge** - Everyone gets same high-quality intro
3. **Less Repetition** - Common questions answered upfront
4. **Better Retention** - Interactive > passive reading

### For AI-Assisted Development

1. **Teaches AI Patterns** - Shows how to use chat modes
2. **Promotes Best Practices** - Generator-first, TDD, security-first
3. **Tool Discovery** - Users learn about available MCP servers
4. **Workflow Reinforcement** - Explains standard development cycles

## Example Interaction Flows

### Flow 1: Quick Start

```
User: onboarding.overview

AI: 👋 Welcome! What would you like to explore?

User: overview

AI: [Shows Quick Overview with structure, resources, first steps]

User: [Starts working]
```

### Flow 2: Deep Dive into Recipes

```
User: onboarding.overview

AI: 👋 Welcome! What would you like to explore?

User: recipes

AI: 🔧 Just Recipes - Orchestration Commands
    [Shows all recipes organized by category with when/why]

User: explain ai-scaffold more

AI: [Detailed explanation of ai-scaffold with examples]
```

### Flow 3: Learn Workflows

```
User: onboarding.overview

AI: 👋 Welcome! What would you like to explore?

User: workflows

AI: 🚀 Development Workflows
    [Shows Generator-first, R→P→I→V, TDD, Spec-driven]

User: TDD

AI: [Explains TDD workflow in detail with Red→Green→Refactor]
```

### Flow 4: Specific Tool Lookup

```
User: onboarding.overview

AI: 👋 Welcome! What would you like to explore?

User: chatmodes

AI: 💬 Chat Modes - Specialized AI Personas
    [Shows TDD, Debug, Customization modes]

User: show me customize prompt

AI: [Displays customize.copilot-instructions.prompt.md workflow]
```

## Implementation Details

### File Structure

**Location**: `templates/{{project_slug}}/.github/chatmodes/onboarding.overview.chatmode.md`

**Sections:**

1. Role & Approach
2. Opening Message (interactive menu)
3. Quick Overview (default)
4. Interactive Walkthroughs (5 categories)
5. Edge Cases & Follow-ups
6. Quick Reference Card

**Length**: ~350 lines (comprehensive)

### Frontmatter

```yaml
description: "Guide new contributors through project setup, available tools, and development workflows"
model: GPT-5 mini
tools: ["codebase", "search"]
```

### Key Design Patterns

1. **Menu-Driven** - User chooses what to explore
2. **When/Why Format** - Every tool/recipe explains context
3. **Progressive Disclosure** - Start simple, go deep on request
4. **Cross-References** - Link related concepts
5. **Actionable** - Provide commands, file paths, examples

## Usage

### In VS Code

```
1. Open GitHub Copilot chat
2. Type: @onboarding.overview
3. Choose exploration path:
   - "overview" for quick start
   - "recipes" for just commands
   - "chatmodes" for AI personas
   - "prompts" for workflows
   - "tools" for MCP servers
   - "workflows" for development processes
```

### First-Time Setup

Recommended sequence:

1. Use `@onboarding.overview` → choose "overview"
2. Run `just setup` (from overview)
3. Read `.github/copilot-instructions.md` (from overview)
4. Return to `@onboarding.overview` for specific topics as needed

### As Reference

User can return anytime:

- "Show me just recipes again"
- "Explain TDD workflow"
- "What MCP tools are available?"

## Future Enhancements

### Phase 2: Context-Aware Onboarding

1. **Detect User Progress**

   - Check if `just setup` was run
   - See if user has created files
   - Adjust recommendations accordingly

2. **Role-Based Onboarding**

   - Frontend developer → React, UI tools
   - Backend developer → API, database tools
   - Full-stack → comprehensive walkthrough

3. **Project-Specific**
   - Customize based on project type
   - Highlight relevant tools for tech stack

### Phase 3: Interactive Tutorials

1. **Guided Tasks**

   - "Create your first component"
   - "Write your first test"
   - "Use a generator"

2. **Validation**

   - Check if user completed task
   - Provide feedback

3. **Badge System**
   - Track onboarding completion
   - Celebrate milestones

## Testing

### Manual Testing Checklist

- [ ] User requests "overview" → sees quick start
- [ ] User requests "recipes" → sees organized just commands
- [ ] User requests "chatmodes" → sees TDD/Debug workflows
- [ ] User requests "prompts" → sees available prompts
- [ ] User requests "tools" → sees MCP servers
- [ ] User requests "workflows" → sees development processes
- [ ] User requests specific detail → gets focused explanation
- [ ] User seems overwhelmed → simplifies to 3 takeaways
- [ ] Quick Reference Card always accessible

### Success Metrics

- **Engagement**: Users explore 2+ walkthroughs
- **Comprehension**: Users use correct commands after onboarding
- **Retention**: Users return for reference
- **Satisfaction**: "Helpful for getting started" feedback

## Conclusion

The enhanced onboarding chatmode transforms new contributor experience from:

**"Here's a list of links, good luck"**

To:

**"What would you like to learn? I'll guide you through it with context on when and why to use each tool."**

This creates a more engaging, educational, and effective onboarding experience that sets contributors up for success in an AI-enhanced development environment.

---

## Spec Traceability

**Aligns with**:

- DEV-PRD: AI-enhanced development workflows
- UX Best Practices: Progressive disclosure, user-driven exploration
- Education: Learn by doing, contextual guidance
- Developer Experience: Reduce time-to-productivity

**No conflicts identified** - enhancement improves onboarding for all project types.
