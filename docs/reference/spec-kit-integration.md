# Spec-Kit Integration Reference

> Technical reference for maintaining and extending the spec-kit integration.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                      VibesPro Agent System                           │
│  ce.manifest.jsonc → orchestrator.agent.md → skill routing          │
├─────────────────────────────────────────────────────────────────────┤
│                     Adapter Skill Layer                              │
│  .github/skills/spec-kit-workflow/                                  │
│    ├── skill.md       Slash command definitions                     │
│    ├── port.md        Interface contracts                           │
│    └── adapter.md     Path + ID mapping logic                       │
├─────────────────────────────────────────────────────────────────────┤
│                 Vendored Spec-Kit (blackbox)                         │
│  libs/tools/spec-kit/                                               │
│    ├── templates/commands/   Original slash commands                │
│    ├── templates/*.md        Document templates                     │
│    ├── scripts/              Bash/PowerShell automation             │
│    └── src/specify_cli/      Python CLI (not used directly)        │
├─────────────────────────────────────────────────────────────────────┤
│                    Constitution Layer                                │
│  .github/instructions/sdd_constitution.instructions.md              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## File Inventory

### Core Configuration

| File                                                    | Purpose           | Edit Frequency |
| ------------------------------------------------------- | ----------------- | -------------- |
| `ce.manifest.jsonc`                                     | Artifact registry | Rarely         |
| `libs/tools/spec-kit/project.json`                      | Nx project config | Rarely         |
| `.github/instructions/sdd_constitution.instructions.md` | SDD principles    | Occasionally   |

### Skill Layer

| File                                          | Purpose                | Edit Frequency            |
| --------------------------------------------- | ---------------------- | ------------------------- |
| `.github/skills/spec-kit-workflow/skill.md`   | Command definitions    | When adding commands      |
| `.github/skills/spec-kit-workflow/port.md`    | Input/output contracts | When changing interfaces  |
| `.github/skills/spec-kit-workflow/adapter.md` | Path + ID mappings     | When changing conventions |

### Vendored Code (Blackbox)

| Directory                        | Purpose            | Edit Policy     |
| -------------------------------- | ------------------ | --------------- |
| `libs/tools/spec-kit/templates/` | Document templates | **Do not edit** |
| `libs/tools/spec-kit/scripts/`   | Automation scripts | **Do not edit** |
| `libs/tools/spec-kit/src/`       | Python CLI         | **Do not edit** |

---

## Manifest Entries

### Skill Registration

```jsonc
{
  "id": "ce.skill.spec-kit-workflow",
  "kind": "skill",
  "path": ".github/skills/spec-kit-workflow/skill.md",
  "tags": ["planning", "product", "context-min"],
  "inputs": {
    "files": ["PRODUCT.md", "libs/tools/spec-kit/templates/spec-template.md"],
    "concepts": ["sdd", "specification"],
    "tools": ["toolset:write", "toolset:exec"],
  },
  "outputs": {
    "artifacts": ["ce.instr.sdd-constitution"],
    "files": ["docs/specs/**/spec.md", "docs/specs/**/plan.md"],
    "actions": ["create-spec", "create-plan", "create-tasks"],
  },
  "dependsOn": {
    "artifacts": ["ce.instr.sdd-constitution"],
    "files": [".github/instructions/sdd_constitution.instructions.md"],
  },
}
```

### Instruction Registration

```jsonc
{
  "id": "ce.instr.sdd-constitution",
  "kind": "instruction",
  "path": ".github/instructions/sdd_constitution.instructions.md",
  "tags": ["planning", "product", "context-min"],
}
```

---

## Lint Exclusions

Spec-kit is a vendored blackbox. It's excluded from VibesPro's strict linting:

### pyproject.toml

```toml
[tool.ruff]
extend-exclude = ["libs/tools/spec-kit/**"]

[tool.mypy]
exclude = ["libs/tools/spec-kit/.*"]
```

### .pre-commit-config.yaml

```yaml
# mypy exclude
libs/tools/spec-kit/.*|

# shellcheck exclude
exclude: ^(.*|libs/tools/spec-kit/.*)$

# ruff exclude
exclude: ^(.*|libs/tools/spec-kit/.*)$
```

---

## Upstream Sync

### Initial Setup

```bash
git remote add spec-kit-upstream https://github.com/github/spec-kit.git
```

### Pulling Updates

```bash
git subtree pull --prefix=libs/tools/spec-kit spec-kit-upstream main --squash
```

### Pushing Patches (if contributing back)

```bash
git subtree push --prefix=libs/tools/spec-kit spec-kit-upstream feature/your-patch
```

### Update Checklist

After pulling updates:

1. [ ] Run `just ai-validate`
2. [ ] Check for new template files
3. [ ] Review changelog at `libs/tools/spec-kit/CHANGELOG.md`
4. [ ] Update adapter if paths changed

---

## Customization Recipes

### Add New Bounded Context

1. **Create directory**:

   ```bash
   mkdir -p docs/specs/payments
   ```

2. **Update adapter detection** in `.github/skills/spec-kit-workflow/adapter.md`:

   ```markdown
   | Keywords                                | Context    |
   | --------------------------------------- | ---------- |
   | payment, billing, invoice, subscription | `payments` |
   ```

3. **Validate**:
   ```bash
   just ai-validate
   ```

### Add New Slash Command

1. **Create prompt** at `.github/prompts/vibepro.analyze.prompt.md`:

   ```markdown
   ---
   description: Analyze specification for gaps
   ---

   ## Outline

   1. Load current spec
   2. Check for missing sections
   3. Report gaps
   ```

2. **Register in skill.md**:

   ```markdown
   | `/vibepro.analyze` | Analyze spec for gaps | N/A |
   ```

3. **Add to manifest** if needed

4. **Validate**:
   ```bash
   just ai-validate
   ```

### Override Template

1. **Copy template**:

   ```bash
   cp libs/tools/spec-kit/templates/spec-template.md \
      .github/templates/sdd/spec-template.md
   ```

2. **Modify copy** (not original)

3. **Update adapter.md** to reference new location

---

## Troubleshooting

### Skill Not Found in Chat

```bash
# Verify registration
grep -r "spec-kit-workflow" ce.manifest.jsonc

# Reload VS Code
Cmd/Ctrl + Shift + P → "Developer: Reload Window"
```

### Validation Fails After Upstream Sync

```bash
# Re-add exclusions if new Python/shell files added
# Check pyproject.toml and .pre-commit-config.yaml
```

### ID Conflicts

```bash
# Check traceability matrix for highest ID
grep -E "PRD-[0-9]+" docs/specs/shared/reference/009-traceability-matrix.md | sort -t- -k2 -n | tail -5
```

---

## Testing

### Manual Verification

```bash
# 1. Test skill detection
# Open VS Code Chat, type "/vibepro." and check autocomplete

# 2. Test spec creation
/vibepro.specify Test feature for verification purposes

# 3. Verify output
ls -la docs/specs/features/test-feature/
```

### Automated Validation

```bash
just ai-validate
```

---

## License

Spec-kit is MIT licensed (Copyright GitHub, Inc.). See:

- Original license: `libs/tools/spec-kit/LICENSE`
- Attribution: `THIRD_PARTY_LICENSES.md`
