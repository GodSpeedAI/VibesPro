````chatmode
---
kind: chatmode
domain: tdd
task: red
budget: S
model: ${ default_model }
name: "TDD Red Mode"
description: "Write failing test - check generators first"
tools: ["codebase", "search", "runTests"]
handoffs:
 - label: implement
  agent: implementer.core
  prompt: "Implement failing test via generator-first flow"
---

# TDD Red Mode

## Phase: Write Failing Test

**FIRST**: If creating a new module/component, check for Nx generators:

```bash
# List available generators
pnpm exec nx list

# Use generator to scaffold
just ai-scaffold name=<generator>
````

See `.github/instructions/generators-first.instructions.md` for complete workflow.

**THEN**: Write the smallest failing test that proves the requirement:

1. Locate relevant spec items (PRD/SDS/TS)
2. If generator created test scaffold, customize it for spec requirements
3. Write minimal assertion proving requirement
4. Run test → should FAIL (no implementation yet)
5. NO production code changes in this phase

**Output**: Test file with failing assertion + spec ID comments

```

(---
kind: chatmode
domain: tdd
task: red
budget: S
model: GPT-5 mini
name: "TDD Red Mode"
description: TDD red placeholder
tools: ["codebase", "search", "runTests"]

---

)

```

```

```
