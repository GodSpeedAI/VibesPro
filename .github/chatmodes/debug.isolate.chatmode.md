---
kind: chatmode
domain: debug
task: isolate
budget: M
model: ${ default_model }
name: "Debug Isolate Mode"
description: Debug isolate mode for narrowing down issues to minimal reproducible cases
tools: ["codebase", "search", "runInTerminal", "runTests"]
---

# Debug Isolate Mode

## Entry Criteria

Run isolate mode when:

- A bug has been identified but the root cause is unclear
- The issue involves complex interactions between multiple components
- You need to create a minimal reproduction case for reporting or fixing
- Initial debugging efforts have not pinpointed the exact source of the problem
- You want to isolate the problem from external dependencies or environmental factors

## Investigative Prompts/Checklist

### Logs to Collect

- [ ] Application error logs (both stdout and stderr)
- [ ] Framework-specific logs (e.g., Nx, pnpm, uv)
- [ ] System logs (if the issue might be environment-related)
- [ ] Network logs (for issues involving external services)
- [ ] Database logs (for persistence-related issues)

### Commands to Run

- [ ] `just clean && just setup` - Clean build and setup
- [ ] `pnpm run nx graph` - Visualize project dependencies
- [ ] `uv sync --dev` - Ensure Python dependencies are consistent
- [ ] `copier --dry-run copy . /tmp/validation-test` - Validate template generation
- [ ] Run specific unit tests related to the suspected area

### Key Metrics to Inspect

- [ ] Memory usage during reproduction
- [ ] Execution time for affected operations
- [ ] Database query performance (if applicable)
- [ ] API response times (if applicable)
- [ ] File I/O operations (if applicable)

## Steps to Reproduce and Roll Back to Minimal Repro

1. **Create Isolated Environment**

   - Create a new temporary directory for isolation
   - Copy only the essential files needed to reproduce the issue
   - Remove all non-essential dependencies and configurations

2. **Incremental Reduction**

   - Start with a working version of the code
   - Gradually remove components while maintaining the bug
   - Document each step that still reproduces the issue

3. **Dependency Elimination**

   - Replace external services with mocks or in-memory alternatives
   - Use minimal configuration files
   - Strip down templates to bare essentials

4. **Validation**
   - Confirm the minimal repro still exhibits the same behavior
   - Ensure the repro is self-contained and portable
   - Verify that removing any additional element makes the bug disappear

## Hand-off Instructions for Engineers Fixing the Issue

### Artifacts to Attach

- [ ] Minimal reproduction case as a standalone project/directory
- [ ] Complete error logs and stack traces
- [ ] Screenshots or recordings demonstrating the issue (if UI-related)
- [ ] Exported dependency graphs (from `nx graph`)
- [ ] Performance metrics if the issue is performance-related

### Required Context

- [ ] Clear description of expected vs. actual behavior
- [ ] Steps to reproduce the issue from a clean state
- [ ] Environment information (OS, Node.js version, Python version)
- [ ] List of recently changed files or components
- [ ] Any workarounds discovered during isolation

## Termination/Escape Criteria

Stop isolate mode when:

- A minimal, self-contained reproduction case has been created
- The root cause has been clearly identified
- The issue has been isolated to a specific component or dependency
- It's determined that the issue cannot be reproduced in isolation (may be environmental)
- More than 2 hours have been spent without significant progress (escalate)

## Relevant Templates and Examples

- Template: `/templates/{{project_slug}}/` - Base project template for creating minimal repros
- Example: `/examples/minimal-repro/` - Example of a minimal reproduction case
- Workflow: `/tools/test/node-smoke.cjs` - Simple test to validate Node.js environment
- Documentation: `/docs/debugging.md` - General debugging guidelines
