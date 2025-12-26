# Spec-Driven Development (SDD) Guide

> **From idea → specification → working code in minutes, not hours.**

This guide teaches you how to use VibesPro's integrated Spec-Driven Development workflow to build features systematically.

---

## Quick Start (2 Minutes)

**New to SDD? Start here.**

```
1. Open VS Code Chat
2. Type: /vibepro.specify Build a user login with email and password
3. Follow the AI's guidance
```

That's it. You've just created your first specification.

---

## Table of Contents

1. [Why Spec-Driven Development?](#why-spec-driven-development)
2. [The Mental Model](#the-mental-model)
3. [The Five Commands](#the-five-commands)
4. [Step-by-Step Tutorial](#step-by-step-tutorial)
5. [Path Conventions](#path-conventions)
6. [Customization Guide](#customization-guide)
7. [Troubleshooting](#troubleshooting)
8. [Advanced Usage](#advanced-usage)

---

## Why Spec-Driven Development?

### The Problem with "Vibe Coding"

```
Traditional approach:
  "Build me a login" → [AI generates code] → "Wait, what about...?"
                                           → Endless back-and-forth
                                           → Lost context
                                           → Inconsistent architecture
```

### The SDD Solution

```
SDD approach:
  "Build me a login" → /vibepro.specify → Clear requirements
                     → /vibepro.plan    → Technical decisions
                     → /vibepro.tasks   → Actionable steps
                     → /vibepro.implement → Code that matches intent
```

**Key insight**: Specifications are the source of truth. Code is just their expression.

---

## The Mental Model

Think of SDD as a **funnel** that progressively refines your idea:

```
┌──────────────────────────────────────────┐
│           Your Idea (vague)              │  /vibepro.specify
├──────────────────────────────────────────┤
│     Specification (what & why)           │  /vibepro.clarify
├──────────────────────────────────────────┤
│   Implementation Plan (how)              │  /vibepro.plan
├──────────────────────────────────────────┤
│      Task Breakdown (steps)              │  /vibepro.tasks
├──────────────────────────────────────────┤
│       Working Code (result)              │  /vibepro.implement
└──────────────────────────────────────────┘
```

Each layer adds precision while **preserving your original intent**.

---

## The Five Commands

### `/vibepro.specify` — Capture Intent

**What it does**: Transforms your idea into a structured specification.

**When to use**: Starting any new feature.

**Input**: Natural language description of what you want.

**Output**: `docs/specs/<context>/<feature>/spec.md`

```
Example:
/vibepro.specify Users can reset their password via email link
```

**Cognitive tip**: Describe the _outcome_ you want, not _how_ to build it.

---

### `/vibepro.clarify` — Resolve Ambiguity

**What it does**: Identifies gaps and asks clarifying questions.

**When to use**: After `/vibepro.specify`, before `/vibepro.plan`.

**Input**: Existing specification.

**Output**: Updated specification with clarifications.

```
Example:
/vibepro.clarify
```

**Cognitive tip**: This step prevents costly mid-implementation pivots.

---

### `/vibepro.plan` — Design the Solution

**What it does**: Creates technical implementation plan with your tech stack.

**When to use**: After specification is clear.

**Input**: Tech stack and architectural preferences.

**Output**: `plan.md`, `data-model.md`, `contracts/`

```
Example:
/vibepro.plan Use NextJS with Supabase auth, send emails via Resend
```

**Cognitive tip**: This is where you specify _how_, not _what_.

---

### `/vibepro.tasks` — Break Into Steps

**What it does**: Converts plan into actionable, ordered tasks.

**When to use**: After `/vibepro.plan`.

**Input**: Existing plan.

**Output**: `tasks.md` with dependency-ordered tasks.

```
Example:
/vibepro.tasks
```

**Cognitive tip**: Tasks marked `[P]` can run in parallel.

---

### `/vibepro.implement` — Build It

**What it does**: Executes tasks to produce working code.

**When to use**: After reviewing tasks.

**Input**: Approved task list.

**Output**: Working implementation.

```
Example:
/vibepro.implement
```

**Cognitive tip**: Review the plan before implementing—you can still change it.

---

## Step-by-Step Tutorial

### Scenario: Build a "Favorites" Feature

Users should be able to favorite items and view their favorites list.

#### Step 1: Specify (30 seconds)

```
/vibepro.specify Users can mark items as favorites using a heart icon.
Favorites are saved per user and persist across sessions.
Users can view all favorites in a dedicated page.
```

**What happens**:

- Creates branch: `favorites/item-favorites`
- Creates: `docs/specs/favorites/item-favorites/spec.md`
- Assigns: PRD-048

#### Step 2: Clarify (optional, 1 minute)

```
/vibepro.clarify
```

**AI might ask**:

- Should favorites sync across devices?
- Is there a limit to favorites?
- Can favorites be organized into folders?

Answer the questions. The spec updates automatically.

#### Step 3: Plan (1 minute)

```
/vibepro.plan Use React for frontend, Supabase for storage.
The heart icon should animate when clicked.
```

**What happens**:

- Creates: `plan.md` with technical decisions
- Creates: `data-model.md` with Favorite entity
- Creates: `contracts/favorites-api.json`

#### Step 4: Tasks (30 seconds)

```
/vibepro.tasks
```

**What happens**:

- Creates: `tasks.md` with 8-12 ordered tasks
- Groups: Database → API → UI → Tests

#### Step 5: Implement (varies)

```
/vibepro.implement
```

**What happens**:

- Executes tasks in order
- Creates files in hexagonal architecture
- Runs tests as it goes

---

## Path Conventions

### Where Specs Live

```
docs/specs/<bounded-context>/<feature>/
           │                  │
           │                  └── Feature slug (e.g., item-favorites)
           │
           └── Domain area (e.g., auth, orders, favorites)
```

### Example Structure

```
docs/specs/
├── auth/
│   ├── user-registration/
│   │   ├── spec.md
│   │   ├── plan.md
│   │   └── tasks.md
│   └── password-reset/
│       └── spec.md
├── orders/
│   └── checkout-flow/
│       └── spec.md
└── favorites/
    └── item-favorites/
        ├── spec.md
        ├── plan.md
        ├── data-model.md
        ├── contracts/
        │   └── favorites-api.json
        └── tasks.md
```

### Bounded Context Detection

The system auto-detects context from your description:

| Keywords                       | Context              |
| ------------------------------ | -------------------- |
| login, auth, user, permission  | `auth`               |
| order, cart, checkout, payment | `orders`             |
| trace, log, metric, observe    | `observability`      |
| generate, template, scaffold   | `generators`         |
| _other_                        | `features` (default) |

---

## Customization Guide

### Modifying the Constitution

The SDD constitution defines core principles. To customize:

1. Edit `.github/instructions/sdd_constitution.instructions.md`
2. Modify articles as needed
3. Run `just ai-validate` to verify

**Common customizations**:

- Change path conventions in Article IX
- Adjust max clarification markers in Article III
- Add domain-specific principles

### Customizing Templates

Templates control output format. To customize:

1. Copy templates from `libs/tools/spec-kit/templates/`
2. Place in `.github/templates/sdd/`
3. Update skill references in `.github/skills/spec-kit-workflow/adapter.md`

### Adding New Bounded Contexts

1. Create directory: `docs/specs/<new-context>/`
2. Update adapter detection in `.github/skills/spec-kit-workflow/adapter.md`
3. Add keywords → context mapping

---

## Troubleshooting

### "Command not recognized"

**Cause**: Skill not loaded or VS Code restart needed.

**Fix**:

```bash
# Reload VS Code window
Cmd/Ctrl + Shift + P → "Developer: Reload Window"
```

### "Spec already exists"

**Cause**: You're creating a duplicate spec.

**Fix**: Either:

- Use existing spec: `docs/specs/<context>/<feature>/spec.md`
- Or create with different name: `/vibepro.specify ... (v2)`

### "Cannot determine bounded context"

**Cause**: Description too vague for auto-detection.

**Fix**: Be explicit:

```
/vibepro.specify [AUTH] Password reset with email verification
```

### Plan seems over-engineered

**Cause**: AI defaulting to complex solutions.

**Fix**: Be explicit about simplicity:

```
/vibepro.plan Keep it simple. Use existing auth system.
No new databases. Minimal dependencies.
```

---

## Advanced Usage

### Parallel Exploration

Create multiple plans from one spec to explore options:

```bash
# Create spec
/vibepro.specify Build analytics dashboard

# Plan option A
git checkout -b feature/analytics-react
/vibepro.plan Use React with Chart.js

# Plan option B
git checkout -b feature/analytics-vue
/vibepro.plan Use Vue with D3.js

# Compare, then proceed with preferred option
```

### Incremental Features

Add to existing features without starting over:

```
/vibepro.specify Add export-to-CSV to the existing favorites feature.
Reference: docs/specs/favorites/item-favorites/spec.md
```

### Syncing with Upstream Spec-Kit

Get latest spec-kit improvements:

```bash
git remote add spec-kit-upstream https://github.com/github/spec-kit.git
git subtree pull --prefix=libs/tools/spec-kit spec-kit-upstream main --squash
```

### Creating Custom Slash Commands

To add new `/vibepro.*` commands:

1. Create prompt in `.github/prompts/vibepro.<command>.prompt.md`
2. Add workflow to `.github/skills/spec-kit-workflow/skill.md`
3. Register in `ce.manifest.jsonc`
4. Run `just ai-validate`

---

## Key Principles

| Principle                      | Why It Matters                       |
| ------------------------------ | ------------------------------------ |
| **Spec first**                 | Prevents scope creep and lost intent |
| **One layer at a time**        | Reduces cognitive load               |
| **Clarify before planning**    | Catches ambiguity early              |
| **Review before implementing** | Last chance to pivot cheaply         |
| **Trace everything**           | Enables auditing and debugging       |

---

## Next Steps

1. ✅ Try the Quick Start above
2. 📖 Read the [SDD Constitution](.github/instructions/sdd_constitution.instructions.md)
3. 🔧 Explore [skill customization](.github/skills/spec-kit-workflow/)
4. 🎯 Apply to your next feature

---

_This guide follows cognitive ergonomics principles: progressive disclosure, worked examples, clear mental models, and actionable steps._
