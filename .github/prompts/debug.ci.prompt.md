---
kind: prompt
domain: debug
task: workflow
thread: debug-workflow
matrix_ids: [DEV-PRD-004]
budget: M
mode: "agent"
model: GPT-5 mini
tools: ["search", "runTests", "Context7/*", "Exa Search/*", "github/*", "Ref/*", "Vibe Check/*"]
description: "Structured debugging phases from report to regression."
---

# CI/CD Workflow Diagnostic & Resolution Protocol

## Mission

Perform deep-stack analysis of failed GitHub Actions workflows on the current working branch (or specified branch), identify root causes (not symptoms), determine best-practice solutions with zero technical debt, and generate implementation prompts for a junior AI coding agent.

## Phase 1: Comprehensive Diagnostic Analysis

### 1.1 Branch Context Detection

-   Determine target branch:
    -   **Default**: Current working branch (via git context)
    -   **Override**: If user explicitly mentions a branch name (e.g., "main", "develop"), use that instead
    -   **Confirmation**: State which branch is being analyzed before proceeding

### 1.2 Workflow Failure Investigation

-   Use GitHub MCP server to retrieve for **target branch only**:
    -   All failed workflow runs on this branch
    -   Complete workflow YAML configurations (.github/workflows/\*)
    -   Workflow logs with full error traces for failed runs
    -   Dependency manifests (package.json, requirements.txt, Cargo.toml, etc.)
    -   Lock files and version constraints
    -   Repository configuration files (.nvmrc, .python-version, rust-toolchain, etc.)
    -   Branch protection rules and CI requirements
    -   Recent commits on this branch that might have introduced failures

### 1.3 Systemic Context Gathering

-   Use Context7 and Exa to research:
    -   Current best practices for identified failure patterns
    -   Known issues with specific action versions, dependencies, or configurations
    -   Breaking changes in tooling/platforms relevant to failures
    -   Production-grade solution examples from high-quality repositories
    -   Security and performance considerations for proposed solutions

### 1.4 Root Cause Analysis Framework

Apply these analytical lenses:

1. **Dependency Architecture**

    - Version conflicts and constraint violations
    - Transitive dependency issues
    - Platform/runtime version mismatches
    - Lock file drift or corruption

2. **Configuration Coherence**

    - Workflow step ordering and dependencies
    - Environment variable propagation
    - Secret availability and scope
    - Caching strategy effectiveness

3. **Systemic Patterns**

    - Flaky tests vs. deterministic failures
    - Race conditions in parallel jobs
    - Resource exhaustion patterns
    - Authentication/permission boundaries

4. **Technical Debt Indicators**

    - Deprecated action versions
    - Hardcoded values requiring environment abstraction
    - Missing error handling or retry logic
    - Insufficient test coverage in critical paths

5. **Branch-Specific Context**
    - Changes introduced in this branch that triggered failures
    - Differences from main/base branch configurations
    - Whether failures are unique to this branch or systemic

### 1.5 Solution Selection Criteria

Rank solutions by:

1. **Eliminates root cause** (not symptoms)
2. **Zero technical debt addition**
3. **Maintainability** (clarity, documentation, convention adherence)
4. **Reliability** (deterministic, tested, proven patterns)
5. **Performance** (build time, resource efficiency)

## Phase 2: Implementation Prompt Generation

### 2.1 Prompt Engineering Standards

Each prompt must include:

-   **Context Block**: Why this change matters (root cause it addresses)
-   **Concrete Instructions**: Exact files, line numbers, or code patterns
-   **Success Criteria**: Specific passing tests, validation commands
-   **Verification Protocol**: Step-by-step testing instructions
-   **Rollback Plan**: How to revert if issues arise

### 2.2 Prompt Structure Template

```
## Task [N/Total]: [Descriptive Title]

**Root Cause Addressed**: [Specific systemic issue this solves]

**Objective**: [Single, concrete outcome]

**Files to Modify**:
- `path/to/file.ext` - [What changes and why]
- `path/to/another.ext` - [What changes and why]

**Explicit Instructions**:
1. [Action verb] [Specific location]: [Exact change]
   - **Before**: [Current state/code snippet if helpful]
   - **After**: [Expected state/code snippet]
   - **Rationale**: [Why this specific change]

2. [Next concrete step with same level of detail]

**Dependencies**:
- [Any tasks that must complete before this one]
- [External context the agent needs]

**Testing Protocol**:
1. Run `[specific test command]` - expect [specific output]
2. Execute `just ai-validate` - all checks must pass
3. Verify [specific behavior/output]
4. If failures occur, [specific debugging steps]

**Iteration Loop**:
- If `just ai-validate` fails:
  1. Read error output carefully
  2. Identify which check failed
  3. [Specific remediation for common failure modes]
  4. Re-run full validation
  5. Repeat until all checks pass

**Validation Checklist**:
- [ ] All tests pass
- [ ] `just ai-validate` passes
- [ ] No new linter warnings
- [ ] [Any other specific checks]

**Success Indicators**:
- [Observable outcome 1]
- [Observable outcome 2]
```

### 2.3 Agent Capability Constraints

Design prompts assuming the agent:

-   Has limited context window (provide all necessary context inline)
-   Cannot infer implicit requirements (be exhaustively explicit)
-   Benefits from examples (include before/after code snippets)
-   Needs guidance on where to look for information (specify docs, files, commands)
-   Requires step-by-step validation instructions (no assumptions)

### 2.4 Best Practices Integration

Each prompt incorporates:

-   **Specificity**: No ambiguous verbs ("improve" → "add error handling for case X in function Y at line Z")
-   **Verifiability**: Every instruction has a check ("you'll know it worked when...")
-   **Atomicity**: One logical change per prompt (enables clean rollback)
-   **Traceability**: Links back to root cause analysis
-   **Self-containment**: Agent doesn't need to reference other prompts or external context

## Phase 3: Output Generation

### 3.1 Create `docs/tmp/sandbox.md`

Structure:

```markdown
# CI/CD Workflow Resolution Implementation Guide

## Executive Summary

**Branch Analyzed**: [branch-name]
[2-3 sentences: What failed, root causes identified, solution approach]

## Root Cause Analysis

[Concise summary of findings from Phase 1]

## Implementation Sequence

[Dependency-ordered list of tasks with brief descriptions]

---

## Task 1/N: [Title]

[Full prompt following template from 2.2]

---

## Task 2/N: [Title]

[Full prompt following template from 2.2]

[... continue for all tasks ...]

---

## Final Validation Protocol

[Comprehensive end-to-end testing instructions]

## Rollback Procedures

[How to safely revert changes if needed]
```

### 3.2 Quality Assurance Checks

Before finalizing prompts, verify:

-   [ ] Each task is actionable by a less-capable agent
-   [ ] No implicit knowledge assumptions
-   [ ] All file paths are complete and correct
-   [ ] Testing instructions are deterministic
-   [ ] Tasks are properly sequenced (no dependency violations)
-   [ ] Success criteria are objective and measurable

## Execution Notes

-   **Mode**: Deep analysis (full paradigmatic excavation)
-   **Frameworks Active**:

    -   Dependency Architecture Analysis
    -   Configuration Coherence Mapping
    -   Systemic Pattern Recognition
    -   Technical Debt Avoidance Protocol

-   **Adaptive Behavior**: If initial investigation reveals complexity requiring user input, surface that explicitly before proceeding to solution generation

-   **Output Location**: `docs/tmp/sandbox.md`

-   **Validation Command**: `just ai-validate` (must pass before task completion)

---

## Meta-Instructions for This Prompt File

When executed, this prompt should:

1. **Detect branch context first**: Identify current working branch or use explicitly mentioned branch
2. Execute Phase 1 completely before moving to Phase 2
3. Show diagnostic findings and proposed solution approach for user confirmation before generating implementation prompts
4. Generate prompts optimized for a junior AI agent (explicit, concrete, verified)
5. Output single consolidated markdown file at specified location
6. Maintain analytical rigor while ensuring practical implementability
