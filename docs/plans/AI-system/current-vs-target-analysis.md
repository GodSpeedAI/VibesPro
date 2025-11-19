# Current vs. Target State Analysis

**Date:** 2025-11-11  
**Related Plan:** ai-profile-architecture-alignment.md  
**Specification:** DEV-SDS-AI-PROFILE-001

---

## Executive Summary

This document provides a side-by-side comparison of VibesPro's current AI system architecture and the target AI System Profile Architecture.

---

## Architecture Comparison

### Current State: Distributed Agent System

```
VibesPro/
├── .github/
│   ├── copilot-instructions.md          # Supreme authority
│   ├── instructions/                    # 17 modular files
│   │   ├── security.instructions.md     # Precedence: 10
│   │   ├── generators-first.instructions.md  # Precedence: 15
│   │   ├── testing.instructions.md      # Precedence: 35
│   │   └── general.instructions.md      # Precedence: 50
│   ├── prompts/                         # 26 prompt files
│   │   ├── tdd.workflow.prompt.md
│   │   ├── debug.workflow.prompt.md
│   │   └── spec.implement.prompt.md
│   └── chatmodes/                       # 32 chatmode files
│       ├── tdd.red.chatmode.md
│       ├── tdd.green.chatmode.md
│       └── debug.start.chatmode.md
├── AGENT-SYSTEM.md                      # Routing documentation
├── AGENT-MAP.md                         # Navigation hub
├── .github/AGENT.md                     # Directory context
├── docs/AGENT.md                        # Directory context
├── tools/AGENT.md                       # Directory context
└── scripts/AGENT.md                     # Directory context
```

**Strengths:**
✅ Modular, MECE-compliant instruction stacking  
✅ Rich library of prompts and chatmodes  
✅ Clear precedence hierarchy  
✅ Distributed context via AGENT.md files  
✅ Well-documented navigation (AGENT-MAP.md)

**Gaps:**
❌ No unified profile manifest  
❌ Inconsistent frontmatter across artifacts  
❌ No token budget management  
❌ No formal tool access policies  
❌ No automated validation pipeline  
❌ No signature verification  
❌ No audit trail logging

---

### Target State: Unified Profile Architecture

```
VibesPro/
├── .vscode/profiles/vibespro-ai/
│   ├── profile.jsonc                    # Central manifest
│   ├── signatures/
│   │   ├── profile.sig.asc              # GPG signature
│   │   └── public-key.asc
│   ├── AGENTS.md → ../../../AGENTS.md   # Symlink
│   ├── .github/                         # Symlinks to artifacts
│   │   ├── copilot-instructions.md
│   │   ├── instructions/
│   │   ├── prompts/
│   │   └── chatmodes/
│   ├── toolsets/
│   │   └── vibespro-tools.jsonc         # Tool definitions
│   ├── mcp/
│   │   └── mcp-config.json → ../../../.mcp.json
│   ├── scripts/
│   │   ├── compose-profile.js           # Profile composer
│   │   ├── validate-profile.js          # Validator
│   │   ├── token-budget.js              # Token calculator
│   │   ├── sign-profile.sh              # Signing
│   │   └── audit-logger.js              # Audit trails
│   └── audit.jsonl                      # Audit log
├── .github/
│   ├── workflows/
│   │   └── profile-validation.yml       # CI validation
│   ├── instructions/                    # Enhanced frontmatter
│   ├── prompts/                         # Enhanced frontmatter
│   └── chatmodes/                       # Enhanced frontmatter
├── AGENT-SYSTEM.md                      # Updated with profile info
└── justfile                             # New ai-profile-* recipes
```

**Enhancements:**
✅ Unified profile manifest with checksum  
✅ Standardized frontmatter schemas  
✅ Token budget calculation and pruning  
✅ Tool access policies enforced  
✅ Automated CI/CD validation  
✅ GPG signature verification  
✅ Comprehensive audit trails  
✅ Profile composer for orchestration

---

## Component Mapping

### Instructions (17 files → INSTRUCTION_FILE entity)

| Current                                     | Target Frontmatter                    | Status          |
| ------------------------------------------- | ------------------------------------- | --------------- |
| `security.instructions.md`                  | Add `profileId`, ensure `applyToGlob` | ⚠️ Needs update |
| `ai-workflows.constitution.instructions.md` | Add `profileId`                       | ⚠️ Needs update |
| `generators-first.instructions.md`          | Add `profileId`                       | ⚠️ Needs update |
| _(14 more files)_                           | Add `profileId`, standardize          | ⚠️ Needs update |

**Current Frontmatter Example:**

```yaml
---
description: "Security-focused instructions"
applyTo: "**"
kind: instructions
domain: security
precedence: 10
---
```

**Target Frontmatter:**

```yaml
---
description: "Security-focused instructions"
applyToGlob: "**"
kind: instructions
domain: security
precedence: 10
profileId: "com.vibespro.ai-profile"
---
```

---

### Prompts (26 files → PROMPT_FILE entity)

| Current                    | Target Frontmatter                        | Status          |
| -------------------------- | ----------------------------------------- | --------------- |
| `tdd.workflow.prompt.md`   | Add `mode`, `model`, `tools`, `profileId` | ⚠️ Needs update |
| `debug.workflow.prompt.md` | Add `mode`, `model`, `tools`, `profileId` | ⚠️ Needs update |
| `spec.implement.prompt.md` | Add `mode`, `model`, `tools`, `profileId` | ⚠️ Needs update |
| _(23 more files)_          | Standardize all fields                    | ⚠️ Needs update |

**Current Frontmatter Example:**

```yaml
---
kind: prompt
domain: tdd
task: workflow
thread: tdd-workflow
matrix_ids: []
budget: M
mode: "agent"
model: GPT-5 mini
tools: ["codebase", "search", "runTests"]
description: "TDD phases aligned to specs"
---
```

**Target Frontmatter (aligned to spec):**

```yaml
---
kind: prompt
mode: "agent"
model: "gpt-4-turbo"
tools: ["codebase", "search", "runTests"]
description: "TDD phases aligned to specs"
domain: tdd
task: workflow
variables:
    - "SPEC_IDS"
    - "TARGET"
    - "NOTES"
profileId: "com.vibespro.ai-profile"
---
```

**Gap:** Need to extract variable placeholders and standardize model IDs.

---

### Chat Modes (32 files → CHAT_MODE entity)

| Current                   | Target Enhancement               | Status           |
| ------------------------- | -------------------------------- | ---------------- |
| `tdd.red.chatmode.md`     | Add `handoffs` to `tdd.green`    | ⚠️ Needs handoff |
| `tdd.green.chatmode.md`   | Add `handoffs` to `tdd.refactor` | ⚠️ Needs handoff |
| `debug.start.chatmode.md` | Add workflow handoffs            | ⚠️ Needs handoff |
| _(29 more files)_         | Add `profileId`, tools, model    | ⚠️ Needs update  |

**Current Frontmatter Example:**

```yaml
---
name: "tdd.red"
description: "Write failing test"
instructions:
    - /.github/instructions/security.instructions.md
    - /.github/instructions/testing.instructions.md
prompts:
    - /.github/prompts/tdd.workflow.prompt.md
---
```

**Target Frontmatter:**

```yaml
---
id: "tdd.red"
kind: chatmode
description: "Write failing test aligned to specifications"
tools: ["codebase", "runTests"]
model: "gpt-4-turbo"
handoffs:
    - label: "red-to-green"
      target: "tdd.green"
      autoSend: false
      prompt: "Switch to GREEN phase: implement minimal solution"
profileId: "com.vibespro.ai-profile"
---
```

**Gap:** Missing `handoffs` for workflow transitions, need to add `tools` and `model`.

---

## Frontmatter Standardization Summary

### Instructions (17 files)

- ✅ Already have: `description`, `kind`, `domain`, `precedence`
- ⚠️ Need to add: `profileId`
- ⚠️ Need to rename: `applyTo` → `applyToGlob`

### Prompts (26 files)

- ✅ Already have: `kind`, `description`, `domain`, `task`
- ⚠️ Need to add: `profileId`, `variables` array
- ⚠️ Need to standardize: `model` (map "GPT-5 mini" → "gpt-4-turbo")
- ⚠️ Optional: `mode` (most already have this)

### Chat Modes (32 files)

- ✅ Already have: `description`
- ⚠️ Need to add: `id`, `kind: chatmode`, `profileId`, `handoffs`
- ⚠️ Need to rename: `name` → `id`
- ⚠️ Optional: `tools`, `model`

---

## Infrastructure Gaps

### Missing Components

| Component                                  | Description           | Priority     | Phase   |
| ------------------------------------------ | --------------------- | ------------ | ------- |
| `profile.jsonc`                            | Central manifest      | **Critical** | Phase 3 |
| `scripts/compose-profile.js`               | Profile composer      | **Critical** | Phase 3 |
| `scripts/validate-profile.js`              | Manifest validator    | **Critical** | Phase 4 |
| `scripts/token-budget.js`                  | Token calculator      | **High**     | Phase 3 |
| `scripts/validate-frontmatter.js`          | Frontmatter validator | **High**     | Phase 4 |
| `scripts/sign-profile.sh`                  | GPG signing           | **Medium**   | Phase 5 |
| `scripts/audit-logger.js`                  | Audit trail logger    | **Medium**   | Phase 5 |
| `toolsets/vibespro-tools.jsonc`            | Tool definitions      | **High**     | Phase 3 |
| `.github/workflows/profile-validation.yml` | CI pipeline           | **High**     | Phase 4 |

---

## Security Comparison

### Current Security Posture

✅ `security.instructions.md` with highest precedence  
✅ SOPS for secret management  
✅ No plaintext credentials in repo  
✅ Explicit warnings against auto-approve

❌ No formal tool approval policy  
❌ No MCP trust boundaries  
❌ No audit logging  
❌ No signature verification

### Target Security Enhancements

**In Profile Manifest:**

```jsonc
{
    "toolPolicy": {
        "allowedToolSets": ["vibespro-tools"],
        "requireMcpTrust": true,
        "autoApproveTools": false, // Enforced
    },
    "security": {
        "requireSignature": true,
        "signedBy": "vibespro-team",
        "allowedHosts": [],
    },
}
```

**Audit Trail:**

- Every profile composition logged
- Tool invocations tracked
- MCP access recorded
- Query-able audit logs

---

## Token Budget Comparison

### Current State

- ❌ No token tracking
- ❌ No budget limits
- ❌ No pruning strategy
- ⚠️ Risk of context window overflow

### Target State

**Profile Manifest:**

```jsonc
{
    "tokenPresets": {
        "baseInstructions": 400, // Security + AI workflows
        "fileContextReserve": 2400, // Code files
        "recentHistoryCount": 3, // Message history
    },
    "modelPreferences": {
        "contextWindow": 128000, // GPT-4 Turbo limit
    },
}
```

**Token Budget Report (example):**

```
Base Instructions:     387 tokens (97% of 400)
File Context:        1,245 tokens (52% of 2400)
Message History:       189 tokens (3 messages)
Total Used:          1,821 tokens (1.4% of 128k)
```

---

## Migration Strategy

### Phase 1: Inventory (Week 1)

- Scan all 17 instructions, 26 prompts, 32 chatmodes
- Extract existing frontmatter patterns
- Generate gap analysis

### Phase 2: Standardization (Week 1-2)

- Update all frontmatter in parallel
- Add `profileId` to all artifacts
- Rename fields to match schema
- Validate with linter

### Phase 3: Infrastructure (Week 2-3)

- Create profile directory structure
- Generate `profile.jsonc` manifest
- Implement composer and token budget
- Define toolsets

### Phase 4: Integration (Week 3)

- Create CI validation workflow
- Add `just` recipes
- Implement validation suite
- Test end-to-end

### Phase 5: Production (Week 4)

- Implement GPG signing
- Add audit trail logging
- Update documentation
- Team training

---

## Success Criteria

### Phase Completion Gates

**Phase 1:** ✅ Complete inventory JSON + gap analysis markdown  
**Phase 2:** ✅ All frontmatter validation passes  
**Phase 3:** ✅ Profile composer dry-run succeeds  
**Phase 4:** ✅ CI workflow passing on all checks  
**Phase 5:** ✅ Profile signed and audit logs generated

### Final Acceptance

- [ ] Profile manifest validates against schema
- [ ] All artifacts have valid frontmatter
- [ ] Token budget within limits
- [ ] Security policy enforced (`autoApproveTools: false`)
- [ ] CI pipeline green
- [ ] Signature verified
- [ ] Backward compatibility maintained
- [ ] Documentation complete
- [ ] Team trained

---

## Risk Assessment

| Risk                              | Likelihood | Impact | Mitigation                            |
| --------------------------------- | ---------- | ------ | ------------------------------------- |
| Breaking existing workflows       | Medium     | High   | Maintain backward compatibility layer |
| Frontmatter validation too strict | Low        | Medium | Start with warnings, then errors      |
| Token budget miscalculation       | Medium     | Low    | Conservative estimates, monitoring    |
| Team adoption resistance          | Low        | Medium | Clear documentation, training         |
| Performance degradation           | Low        | Low    | Profile composer caching              |

---

## Next Steps

1. **Review this analysis** with team
2. **Approve** ai-profile-architecture-alignment.md plan
3. **Execute Phase 1** (Inventory & Analysis)
4. **Iterate** through phases with validation gates
5. **Monitor** adoption and adjust as needed

---

**Related Documents:**

- [AI Profile Architecture Alignment Plan](./ai-profile-architecture-alignment.md)
- [DEV-SDS-AI-PROFILE-001 Specification](/docs/specs/ai-system-profile-architecture.md)
- [AGENT-SYSTEM.md](/AGENT-SYSTEM.md)
