---
description: "Flipped interaction: AI asks questions to customize copilot-instructions.md for the project"
model: GPT-5 mini
mode: agent
tools: ["codebase", "search"]
---

# Customize Copilot Instructions (Flipped Interaction)

## Purpose

Use this prompt to **customize `.github/copilot-instructions.md`** for your specific project through conversational Q&A. The AI will:

1. **Audit the project** to detect what it can automatically
2. **Ask targeted questions** only for information it couldn't determine
3. **Update instructions** based on gathered context

## Interaction Style: Intelligent Flipped Q&A

**Phase 1: Automatic Audit** (AI does this silently)
**Phase 2: Targeted Questions** (AI asks, user answers)
**Phase 3: Update Instructions** (AI applies changes)

## Workflow

### Step 1: Automatic Project Audit

**Before asking ANY questions, the AI MUST:**

1. **Read `copier.yml` or `.copier-answers.yml`** to understand initial template choices:

   - Project name, slug, description
   - Selected architecture style
   - Chosen tech stack components
   - Enabled features (AI workflows, database, etc.)

2. **Analyze `package.json`** (if Node.js project):

   - Detect framework: Next.js, Remix, React, Vue, etc.
   - Identify language: TypeScript vs JavaScript
   - List key dependencies (auth, database clients, testing libs)

3. **Check `pyproject.toml`** (if Python project):

   - Detect framework: FastAPI, Django, Flask
   - Identify dependencies

4. **Inspect `nx.json`**:

   - Understand workspace structure
   - Identify existing projects/libraries
   - Detect configured generators

5. **Scan directory structure**:

   - `apps/` - identify application types
   - `libs/` - understand domain structure
   - `tests/` - detect testing setup

6. **Review existing `.github/copilot-instructions.md`**:
   - Identify already-customized sections
   - Find `[CUSTOMIZE: ...]` placeholders that need filling

**Audit Summary Template:**

```
🔍 Project Audit Results:

Based on my analysis, I've detected:
- Project Name: {from copier answers}
- Project Type: {inferred from apps/}
- Tech Stack: {from package.json/pyproject.toml}
- Architecture: {from copier answers or structure}
- Language: {TypeScript/JavaScript/Python/etc.}
- Framework: {Next.js/FastAPI/etc.}
- Testing: {Jest/Vitest/pytest/etc. from package.json}
- Deployment: {from copier answers if available}

I still need to know:
1. {only unknown critical info}
2. {only unknown optional info}
```

### Step 2: Targeted Questions

**Only ask questions for information that couldn't be auto-detected.**

Priority order:

1. **Critical gaps** - information needed for core sections
2. **Domain context** - business domain (usually can't auto-detect)
3. **Team/process** - testing approach, team size (usually can't auto-detect)
4. **Optional details** - compliance, performance, etc.

Example intelligent questioning:

```
I detected you're using Next.js 15 with TypeScript and Tailwind CSS.

I couldn't determine from the codebase:
1. What business domain is this project for? (e.g., e-commerce, healthcare, SaaS)

[wait for answer]

Got it - e-commerce platform.

2. Do you have specific compliance requirements? (e.g., PCI-DSS for payments, GDPR)
   Or should I skip this section?
```

### Step 3: Confirm Understanding

After gathering core information, summarize:

```
Let me confirm what I've learned:

- Project Type: Web application
- Tech Stack: Next.js 15 + TypeScript
- Domain: E-commerce platform for artisan goods
- Architecture: Hexagonal (Ports & Adapters)
- Team: 3 developers, mid-level experience
- Testing: TDD preferred
- Deployment: Vercel

Is this correct? Anything to add or change?
```

### Step 4: Update copilot-instructions.md

Once confirmed, update `.github/copilot-instructions.md`:

1. **Update Project Overview section**

   - Replace generic description with project-specific context
   - Include domain terminology
   - Reference actual tech stack

2. **Update Architecture & Structure section**

   - Adjust directory structure to match project type
   - Add project-specific layers/modules
   - Document actual tech stack versions

3. **Update Coding Standards section**

   - Add domain-specific naming conventions
   - Include project-specific patterns
   - Reference actual libraries/frameworks used

4. **Update Testing Strategy section**

   - Match team's preferred approach (TDD, test-after, etc.)
   - Reference actual testing tools
   - Adjust complexity to team experience

5. **Update Security Guidelines section**

   - Add compliance requirements (HIPAA, SOC2, etc.)
   - Include domain-specific security concerns
   - Reference actual deployment environment

6. **Update Custom sections**
   - Add project-specific workflows
   - Document domain concepts
   - Include team conventions

### Step 5: Present Changes

Show a summary of changes made:

```
I've updated `.github/copilot-instructions.md` with the following customizations:

✅ Project Overview - Now describes e-commerce artisan platform
✅ Tech Stack - Next.js 15, TypeScript, Prisma, PostgreSQL
✅ Architecture - Hexagonal with ports/adapters pattern
✅ Testing - TDD workflow emphasized, Jest + React Testing Library
✅ Security - Added PCI-DSS considerations for payments
✅ Custom Section - Added "Domain Concepts" with artisan/product/order entities

The instructions are now tailored to your project. You can run this
customization again anytime as your project evolves.
```

## Template for Updated Instructions

When updating, preserve this structure but customize content:

```markdown
# Repository-Wide Copilot Instructions

> **Purpose**: [CUSTOM: Project-specific purpose]

## 🎯 Project Overview

**[PROJECT_NAME]** is a [PROJECT_TYPE] that [PROJECT_DESCRIPTION].

The project combines:

- [CUSTOM: Key technologies]
- [CUSTOM: Architecture style]
- [CUSTOM: Special features]

### Primary Goal

[CUSTOM: Project's main objective]

### Domain Context

[CUSTOM: Business domain explanation with key terminology]

---

## 🏗️ Architecture & Structure

[CUSTOM: Project-specific architecture details]

### Tech Stack

- **Frontend**: [CUSTOM]
- **Backend**: [CUSTOM]
- **Database**: [CUSTOM]
- **Infrastructure**: [CUSTOM]

---

## 🎯 Core Principles (HIGHEST PRIORITY)

- **Generator-First Requirement**: [Keep as-is]
- **Security First**: [Keep as-is + CUSTOM compliance requirements]

---

[Continue with remaining sections, customizing as needed...]

## 📖 Domain Concepts

[CUSTOM: Project-specific domain concepts, entities, business rules]

---
```

## Examples of Good Flipped Interaction

### Example 1: Clarifying Architecture

**AI:** "You mentioned using hexagonal architecture. Are you organizing by:
A) Feature slices (user-feature, product-feature), or
B) Technical layers (domain, application, infrastructure)?"

**User:** "Feature slices"

**AI:** "Perfect. So each feature will have its own domain/application/infrastructure folders? Like:

```
libs/
  user-feature/
    domain/
    application/
    infrastructure/
  product-feature/
    domain/
    ...
```

Is that right?"

### Example 2: Understanding Testing

**AI:** "You mentioned preferring TDD. Should I emphasize:

- Writing tests BEFORE implementation (strict Red-Green-Refactor)?
- Or a more flexible 'test-first when it makes sense' approach?"

**User:** "Strict TDD for business logic, test-after for UI components"

**AI:** "Got it - I'll document that distinction in the testing strategy section."

### Example 3: Security Clarification

**AI:** "You mentioned this is a healthcare application. Does it handle:

- Protected Health Information (PHI) requiring HIPAA compliance?
- Or is it non-PHI wellness data?"

**User:** "PHI - we need HIPAA compliance"

**AI:** "Understood. I'll add HIPAA-specific security guidelines including:

- Encryption at rest and in transit requirements
- Audit logging
- Access controls
- BAA requirements

Anything else specific to add?"

## Output Format

After gathering all information, provide:

1. **Summary of project context** (bullet points)
2. **List of customizations made** to copilot-instructions.md
3. **Preview of key sections** that were updated
4. **Suggestion to re-run** this prompt when project evolves

## Usage

Run this prompt when:

- Setting up a new project from the template
- Project direction changes significantly
- Adding new team members (update for their context)
- Major architecture refactoring
- Compliance requirements change

**Command:**

```bash
# From project root
just customize-instructions

# Or manually invoke in VS Code
# Open command palette → "Chat: Open Editor"
# Reference: .github/prompts/customize.copilot-instructions.prompt.md
```

---

## Notes for AI

- **Be conversational and friendly** - this is a dialogue, not an interrogation
- **Ask follow-up questions** - clarify ambiguity immediately
- **Provide examples** - help user understand what you're asking
- **Summarize periodically** - confirm understanding before moving on
- **Be patient** - user may need time to think about architecture decisions
- **Suggest options** - if user is unsure, offer 2-3 common patterns
- **Document assumptions** - if user skips a question, state your default choice

Remember: The goal is to make copilot-instructions.md **actually useful** for THIS specific project, not generic boilerplate.
