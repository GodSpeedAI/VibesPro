# How to Use Spec-Driven Development

> Practical recipes for common SDD tasks.

## Create a New Feature Spec

**Goal**: Transform an idea into a structured specification.

**Steps**:

1. Open VS Code Chat
2. Type your feature description:
   ```
   /vibepro.specify Users can bookmark articles and view them later in a saved list
   ```
3. Review the generated spec at `docs/specs/<context>/<feature>/spec.md`
4. Address any `[NEEDS CLARIFICATION]` markers

**Result**: Traceable spec with PRD ID, ready for planning.

---

## Generate an Implementation Plan

**Goal**: Create technical design with your chosen tech stack.

**Prerequisites**: Completed spec.md without unresolved clarifications.

**Steps**:

1. Ensure you're on the feature branch
2. Specify your technical preferences:
   ```
   /vibepro.plan Use React with TanStack Query for data fetching.
   Store bookmarks in Supabase. Add optimistic updates for better UX.
   ```
3. Review generated files:
   - `plan.md` — implementation phases
   - `data-model.md` — entity definitions
   - `contracts/` — API specifications

**Result**: Detailed implementation plan with SDS ID.

---

## Break Plan into Tasks

**Goal**: Convert plan into actionable, ordered work items.

**Prerequisites**: Reviewed and approved plan.md.

**Steps**:

1. Generate task breakdown:
   ```
   /vibepro.tasks
   ```
2. Review `tasks.md`:
   - Tasks are ordered by dependency
   - `[P]` marks parallel-safe tasks
   - Each task has specific file paths

**Result**: Ready-to-execute task list.

---

## Add to an Existing Feature

**Goal**: Extend a feature without starting over.

**Steps**:

1. Reference the existing spec:
   ```
   /vibepro.specify Add folder organization to the bookmarks feature.
   Reference: docs/specs/bookmarks/article-bookmarks/spec.md
   ```
2. The AI will read existing context and extend appropriately

**Result**: Incremental spec that builds on prior work.

---

## Explore Multiple Approaches

**Goal**: Compare different technical solutions.

**Steps**:

1. Create base spec:

   ```
   /vibepro.specify Real-time notifications for order updates
   ```

2. Create branch for option A:

   ```bash
   git checkout -b feature/notifications-websocket
   ```

   ```
   /vibepro.plan Use WebSockets with Socket.io
   ```

3. Create branch for option B:

   ```bash
   git checkout -b feature/notifications-sse
   ```

   ```
   /vibepro.plan Use Server-Sent Events with EventSource
   ```

4. Compare plans, choose preferred approach

**Result**: Informed technical decision with documented alternatives.

---

## Customize Path Conventions

**Goal**: Change where specs are stored.

**Steps**:

1. Edit `.github/skills/spec-kit-workflow/adapter.md`
2. Update the path mapping table:
   ```markdown
   | Spec-Kit Convention | VibesPro Pattern             |
   | ------------------- | ---------------------------- |
   | `.specify/specs/*`  | `specs/<context>/<feature>/` |
   ```
3. Update Article IX in `.github/instructions/sdd_constitution.instructions.md`
4. Validate:
   ```bash
   just ai-validate
   ```

**Result**: Custom path structure for your organization.

---

## Sync with Upstream Spec-Kit

**Goal**: Get latest improvements without losing customizations.

**Steps**:

1. Add upstream remote (one-time):

   ```bash
   git remote add spec-kit-upstream https://github.com/github/spec-kit.git
   ```

2. Pull updates:

   ```bash
   git subtree pull --prefix=libs/tools/spec-kit spec-kit-upstream main --squash
   ```

3. Resolve any conflicts (rare)

4. Validate:
   ```bash
   just ai-validate
   ```

**Result**: Updated spec-kit with your adapter layer intact.

---

## Troubleshoot Common Issues

### Spec creation fails silently

**Cause**: Git branch already exists or unclean working directory.

**Fix**:

```bash
git status  # Check for uncommitted changes
git branch -a | grep <feature>  # Check for existing branch
```

### Plan seems to ignore my tech preferences

**Cause**: Preferences not clear enough or conflicting with spec.

**Fix**: Be explicit and specific:

```
/vibepro.plan
Tech stack: Next.js 14 (App Router), Supabase, TailwindCSS
Constraints: No new dependencies. Use existing design system.
```

### Tasks don't respect project structure

**Cause**: Adapter not configured for your structure.

**Fix**: Update `.github/skills/spec-kit-workflow/adapter.md` with your conventions.
